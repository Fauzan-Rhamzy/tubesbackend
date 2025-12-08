import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import db from "./db.js";
import jwt from 'jsonwebtoken';
import zlib from "node:zlib";

const PORT = 3000;
const server = new http.Server();

const SECRET_KEY = "rahasia";

function getUserFromRequest(request) {
    const cookieHeader = request.headers.cookie;
    if (!cookieHeader) return null;

    const tokenCookie = cookieHeader.split(';').find(c => c.trim().startsWith('token='));
    if (!tokenCookie) return null;

    const token = tokenCookie.split('=')[1];
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        return decoded;
    } catch (err) {
        return null;
    }
}

server.on("request", async (request, response) => {
    console.log(`Request received: ${request.method} ${request.url}`);

    const method = request.method;
    const url = request.url;
    const extension = path.extname(request.url);

    // handle API requests
    if (url.startsWith('/api')) {

        // --- API: LOGOUT (DIPERBAIKI POSISINYA DISINI) ---
        if (url === '/api/logout' && method === 'POST') {
            // Kita timpa cookie 'token' dengan tanggal kadaluarsa masa lalu
            response.writeHead(200, {
                'Content-Type': 'application/json',
                'Set-Cookie': 'token=; HttpOnly; Path=/; Max-Age=0'
            });
            response.end(JSON.stringify({ message: 'Logout berhasil' }));
            return;
        }

        // GET all bookings
        if (url === '/api/bookings' && method === 'GET') {
            try {
                // Mengambil semua bookings
                const bookingsResult = await db.query(
                    'SELECT * FROM bookings ORDER BY id ASC'
                );

                // Mengambil semua rooms dan users
                const roomsResult = await db.query('SELECT * FROM rooms');
                const usersResult = await db.query('SELECT id, username FROM users');

                const roomsMap = {};
                roomsResult.rows.forEach(room => {
                    roomsMap[room.id] = room;
                });

                const usersMap = {};
                usersResult.rows.forEach(user => {
                    usersMap[user.id] = user;
                });

                // Menggabungkan data
                const bookings = bookingsResult.rows.map(booking => {
                    const room = roomsMap[booking.room_id] || {};
                    const user = usersMap[booking.user_id] || {};
                    return {
                        ...booking,
                        room_name: room.name,
                        image_path: room.image_path,
                        username: user.username
                    };
                });

                response.writeHead(200, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify(bookings));
            } catch (error) {
                console.error('Error fetching bookings:', error);
                response.writeHead(500, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify({ message: 'Error mengambil data booking' }));
            }
            return;
        }

        // CREATE booking
        if (url === '/api/bookings' && method === 'POST') {
            let body = '';

            request.on('data', chunk => {
                body += chunk.toString();
            });

            request.on('end', async () => {
                try {
                    // [UBAH] 1. Cek User dari Cookie
                    const user = getUserFromRequest(request);
                    if (!user) {
                        response.writeHead(401, { 'Content-Type': 'application/json' });
                        response.end(JSON.stringify({ message: 'Silakan login terlebih dahulu' }));
                        return;
                    }

                    // [UBAH] 2. Hapus 'userId' dari body, karena kita pakai user.id dari cookie
                    const { roomId, bookingDate, bookingTime, purpose } = JSON.parse(body);

                    // Validasi input
                    if (!roomId || !bookingDate || !bookingTime || !purpose) {
                        response.writeHead(400, { 'Content-Type': 'application/json' });
                        response.end(JSON.stringify({ message: 'Semua field harus diisi' }));
                        return;
                    }

                    // Cek ketersediaan
                    const checkBooking = await db.query(
                        `SELECT * FROM bookings 
                         WHERE room_id = $1 
                         AND booking_date = $2 
                         AND booking_time = $3 
                         AND status IN ('pending', 'approved')`,
                        [roomId, bookingDate, bookingTime]
                    );

                    if (checkBooking.rows.length > 0) {
                        response.writeHead(409, { 'Content-Type': 'application/json' });
                        response.end(JSON.stringify({ message: 'Ruangan sudah dibooking' }));
                        return;
                    }

                    // [UBAH] 3. Insert menggunakan user.id (dari cookie)
                    const result = await db.query(
                        `INSERT INTO bookings (user_id, room_id, booking_date, booking_time, purpose, status)
                         VALUES ($1, $2, $3, $4, $5, $6)
                         RETURNING *`,
                        [user.id, roomId, bookingDate, bookingTime, purpose, 'pending'] // <--- Pakai user.id
                    );

                    response.writeHead(201, { 'Content-Type': 'application/json' });
                    response.end(JSON.stringify({
                        message: 'Booking berhasil dibuat',
                        booking: result.rows[0]
                    }));

                } catch (error) {
                    console.error('Error creating booking:', error);
                    response.writeHead(500, { 'Content-Type': 'application/json' });
                    response.end(JSON.stringify({ message: 'Error membuat booking' }));
                }
            });
            return;
        }

        // UPDATE booking status
        const bookingStatusMatch = url.match(/\/api\/bookings\/(\d+)\/status/);
        if (bookingStatusMatch && method === 'POST') {
            const id = bookingStatusMatch[1];
            let body = '';

            request.on('data', chunk => {
                body += chunk.toString();
            });

            request.on('end', async () => {
                try {
                    const { status } = JSON.parse(body);
                    await db.query(
                        'UPDATE bookings SET status = $1 WHERE id = $2',
                        [status, id]
                    );

                    response.writeHead(200, { 'Content-Type': 'application/json' });
                    response.end(JSON.stringify({ message: 'Status berhasil diupdate' }));
                } catch (error) {
                    console.error('Error updating status:', error);
                    response.writeHead(500, { 'Content-Type': 'application/json' });
                    response.end(JSON.stringify({ message: 'Error mengupdate status' }));
                }
            });
            return;
        }

        // GET all users
        if (url === '/api/users' && method === 'GET') {
            try {
                const result = await db.query(
                    'SELECT id, username, email, role, created_at FROM users ORDER BY id ASC'
                );

                response.writeHead(200, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify(result.rows));
            } catch (error) {
                console.error('Error fetching users:', error);
                response.writeHead(500, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify({ message: 'Error mengambil data users' }));
            }
            return;
        }

        // GET all rooms
        if (url === '/api/rooms' && method === 'GET') {
            try {
                const result = await db.query(
                    'SELECT id, name, image_path, capacity FROM rooms ORDER BY id ASC'
                );

                response.writeHead(200, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify(result.rows));
            } catch (error) {
                console.error('Error fetching rooms:', error);
                response.writeHead(500, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify({ message: 'Error mengambil data ruangan' }));
            }
            return;
        }

        // GET booking availability by room and date
        if (url.startsWith('/api/bookings/availability/') && method === 'GET') {
            try {
                const parts = url.split('/');
                const roomId = parts[4];
                const date = parts[5];

                const result = await db.query(
                    `SELECT booking_time FROM bookings 
                     WHERE room_id = $1 
                     AND booking_date = $2 
                     AND status IN ('pending', 'approved')`,
                    [roomId, date]
                );

                const bookedTimes = result.rows.map(row => row.booking_time);

                response.writeHead(200, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify({ bookedTimes }));
            } catch (error) {
                console.error('Error checking availability:', error);
                response.writeHead(500, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify({ message: 'Error checking availability' }));
            }
            return;
        }

        // GET room by ID
        if (url.startsWith('/api/rooms/') && !url.includes('user') && method === 'GET') {
            try {
                const id = url.split('/')[3];
                const result = await db.query(
                    'SELECT id, name, image_path, capacity FROM rooms WHERE id = $1',
                    [id]
                );

                if (result.rows.length === 0) {
                    response.writeHead(404, { 'Content-Type': 'application/json' });
                    response.end(JSON.stringify({ message: 'Ruangan tidak ditemukan' }));
                    return;
                }

                response.writeHead(200, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify(result.rows[0]));
            } catch (error) {
                console.error('Error fetching room:', error);
                response.writeHead(500, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify({ message: 'Error mengambil data ruangan' }));
            }
            return;
        }

        // LOGIN API
        if (url === '/api/login' && method === 'POST') {
            let body = '';

            request.on('data', chunk => {
                body += chunk.toString();
            });

            request.on('end', async () => {
                try {
                    const { email, password } = JSON.parse(body);
                    const result = await db.query(
                        'SELECT * FROM users WHERE email = $1',
                        [email]
                    );

                    if (result.rows.length === 0) {
                        response.writeHead(401, { 'Content-Type': 'application/json' });
                        response.end(JSON.stringify({ message: 'Email tidak ditemukan' }));
                        return;
                    }

                    const user = result.rows[0];
                    if (user.password !== password) {
                        response.writeHead(401, { 'Content-Type': 'application/json' });
                        response.end(JSON.stringify({ message: 'Password salah' }));
                        return;
                    }

                    const token = jwt.sign(
                        { id: user.id, username: user.username, role: user.role },
                        SECRET_KEY,
                        { expiresIn: '1h' }
                    );

                    response.writeHead(200, {
                        'Content-Type': 'application/json',
                        'Set-Cookie': `token=${token}; HttpOnly; Path=/; Max-Age=3600`
                    });

                    response.end(JSON.stringify({
                        message: 'Login berhasil',
                        role: user.role
                    }));
                } catch (error) {
                    console.error('Login error:', error);
                    response.writeHead(500, { 'Content-Type': 'application/json' });
                    response.end(JSON.stringify({ message: 'Error server' }));
                }
            });
            return;
        }
    }

    // Handle static files

    // 1. Proteksi Halaman Admin
    if (url === '/admin' || url === '/pages/admin_page.html') {
        const user = getUserFromRequest(request);
        // Kalau belum login ATAU bukan admin -> Tendang ke Login
        if (!user || user.role !== 'admin') {
            response.writeHead(302, { 'Location': '/login' });
            response.end();
            return;
        }
    }

    //dashboard page
    if (url === '/dashboard' && method === 'GET') {
        const user = getUserFromRequest(request);
        if (!user) {
            response.writeHead(302, { 'Location': '/login' });
            response.end();
            return;
        }

        try {
            // Ambil data rooms dari database
            const roomsResult = await db.query(
                'SELECT id, name, image_path, capacity FROM rooms ORDER BY id ASC'
            );

            let roomCards = "";

            if (roomsResult.rows.length === 0) {
                roomCards = `<p>Belum ada ruangan tersedia.</p>`;
            } else {
                roomsResult.rows.forEach(room => {
                    const imagePath = room.image_path;

                    roomCards += `
                <div class="room-option-card" data-room-id="${room.id}">
                    <h3>${room.name}</h3>
                    <img src="${imagePath}" alt="${room.name}">
                    <p>Kapasitas: ${room.capacity} Orang</p>
                </div>`;
                });
            }

            // Baca file dashboard.html
            const dashboardPath = path.join("./public/pages/dashboard.html");
            let htmlDashboard = fs.readFileSync(dashboardPath, 'utf8');

            // Replace container dengan konten yang sudah di-render
            htmlDashboard = htmlDashboard.replace(
                '<div class="container"></div>',
                `<div class="container">
                <div class="dashboardHeader">
                    <h1>Dashboard</h1>
                    <button class="bookingButton disabled" id="bookingButton" disabled>Booking</button>
                </div>

                <div class="dashboardContainer">
                    <p class="chooseRoomTitle">Choose one of these rooms</p>
                    <div class="room-options-container">
                        ${roomCards}
                    </div>
                </div>
            </div>`
            );

            // Compression dengan gzip
            response.writeHead(200, {
                "Content-Type": "text/html",
                "Content-Encoding": "gzip"
            });

            const gzip = zlib.createGzip();
            const { Readable } = await import("node:stream");
            Readable.from([htmlDashboard]).pipe(gzip).pipe(response);

        } catch (err) {
            response.writeHead(500, { "Content-Type": "text/plain" });
            response.end("Error rendering dashboard page");
        }
        return;
    }

    //Booking Page
    if (url.startsWith('/booking') && method === "GET") {
        const user = getUserFromRequest(request);
        if (!user || user.role !== "user") {
            response.writeHead(302, { 'Location': '/login' });
            response.end();
            return;
        }

        //Mengambil room id dari query parameter url
        try {
            const query = new URL(request.url, `http://${request.headers.host}`);
            const roomId = query.searchParams.get("id");

            if (!roomId) {
                response.writeHead(400, { "Content-Type": "text/plain" });
                response.end("Room ID is required");
                return;
            }

            //Mengambil data ruangan dari database berdasarkan id
            const roomResult = await db.query(
                'SELECT id, name, image_path, capacity FROM rooms WHERE id = $1',
                [roomId]
            );

            if (roomResult.rows.length === 0) {
                response.writeHead(404, { "Content-Type": "text/plain" });
                response.end("Room not found");
                return;
            }

            const room = roomResult.rows[0];

            //Membaca file bookingHTML
            const bookingPath = path.join("./public/pages/bookingDetail.html");
            let htmlBooking = fs.readFileSync(bookingPath, 'utf8');

            //Mengganti daftar ruangan pada dashboard html
            htmlBooking = htmlBooking.replace('<!--ROOM_IMAGE-->', room.image_path);
            htmlBooking = htmlBooking.replace('<!--ROOM_NAME-->', room.name);
            htmlBooking = htmlBooking.replace('<!--ROOM_CAPACITY-->', `Capacity: ${room.capacity} people`)

            htmlBooking = htmlBooking.replace(
                `<input type="hidden" id="roomId" name="roomId" value="${room.id}">`
            );

            // Compression dengan gzip
            response.writeHead(200, {
                "Content-Type": "text/html",
                "Content-Encoding": "gzip"
            });

            const gzip = zlib.createGzip();
            const { Readable } = await import("node:stream");
            Readable.from([htmlBooking]).pipe(gzip).pipe(response);
        } catch (err) {
            response.writeHead(500, { "Content-Type": "text/plain" });
            response.end("Error rendering booking detail page");
        }
        return;
    }

    //History Page
    if (url === '/history' && method === 'GET') {
        const user = getUserFromRequest(request);
        if (!user || user.role !== "user") {
            response.writeHead(302, { 'Location': '/login' });
            response.end();
            return;
        }

        try {
            //join booking + room
            const booking_room = await db.query(
                `SELECT 
                    b.*, 
                    r.name AS room_name,
                    r.image_path
                FROM bookings b
                LEFT JOIN rooms r ON b.room_id = r.id
                WHERE b.user_id = $1
                ORDER BY b.created_at DESC`,
                [user.id]
            );

            let card_history = "";

            if (booking_room.rows.length === 0) {
                card_history = `<p id="belum-ada-booking">There is no history booking data.</p>`;
            } else {
                booking_room.rows.forEach(item => {
                    let statusLabel = item.status;
                    switch (item.status) {
                        case 'confirmed': statusLabel = "Approved"; break;
                        case 'pending': statusLabel = "Pending"; break;
                        case 'rejected': statusLabel = "Rejected"; break;
                        case 'canceled': statusLabel = "Canceled"; break;
                    }

                    const cancel_book = item.status === 'pending' || item.status === 'confirmed';

                    const date = new Date(item.booking_date).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'long', year: 'numeric'
                    });

                    const image = item.image_path;

                    card_history += `
                    <div class="history-card">
                        <div class="history-card-content">
                            <div>
                                <div class="room-name">${item.room_name}</div>
                                <div class="detail">Date: ${date}</div>
                                <div class="detail">Time: ${item.booking_time}</div>
                                <div class="detail">Purpose: ${item.purpose}</div>
                                <div class="status-booking">Status: ${statusLabel.toUpperCase()}</div>

                                <div style="margin-top:12px;">
                                    ${cancel_book ? `
                                        <button class="btn-cancel-booking" onclick="cancelBooking(${item.id})">Cancel Booking</button>
                                    ` : ""}
                                </div>
                            </div>

                            <img class="history-image"
                                src="${image}"
                                onerror="this.src='../images/ruang-a/meetingroom-1.jpg'">
                        </div>
                    </div>`;
                });
            }

            //baca history.html
            const history_path = path.join("./public/pages/history.html");
            let html_history = fs.readFileSync(history_path, 'utf8');

            //Taro card di html
            html_history = html_history.replace(
                '<div class="container">',
                `<div class="container">
                    <div class="header">
                        <h1>Riwayat Booking</h1>
                    </div>
                    <div id="historyList" class="history-list">
                        ${card_history}
                    </div>
                    

                <script>
                    function cancelBooking(id) {
                        fetch("/api/bookings/" + id + "/status", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ status: "canceled" })
                        })
                        .then(res => res.json())
                        .then(data => {
                            alert(data.message || "Request berhasil");
                            location.reload();
                        })
                        .catch(() => alert("Gagal cancel"));
                    }
                </script>
                `
            );

            //Compression
            response.writeHead(200, {
                "Content-Type": "text/html",
                "Content-Encoding": "gzip"
            });

            const gzip = zlib.createGzip();
            //stream
            const { Readable } = await import("node:stream");
            Readable.from([html_history]).pipe(gzip).pipe(response);

        } catch (err) {
            console.error("SSR history error:", err);
            response.writeHead(500, { "Content-Type": "text/plain" });
            response.end("Error rendering history page");
        }
        return;
    }

    // --- HANDLE STATIC FILES (Baru dijalankan setelah lolos cek di atas) ---
    let folder = "./public";
    let fileName = url;

    if (url === "/" || url === "/login") {
        fileName = "/pages/login.html";
    } else if (url === "/admin") {
        fileName = "/pages/admin_page.html";
    } else if (url === "/booking") {
        fileName = "/pages/bookingDetail.html";
    } else {
        fileName = url;
    }

    const filePath = path.join(folder, fileName);
    const fileExtension = path.extname(filePath);

    const mimeTypes = {
        ".html": "text/html",
        ".css": "text/css",
        ".js": "application/javascript",
        ".png": "image/png",
        ".jpg": "image/jpg",
        ".json": "application/json",
        ".webp": "image/webp",
    };

    const contentType = mimeTypes[fileExtension] || "text/plain";

    fs.readFile(filePath, (err, content) => {
        if (err) {
            response.writeHead(404);
            response.end("Halaman tidak ditemukan!");
        } else {
            response.writeHead(200, { "Content-Type": contentType });
            response.end(content);
        }
    });
}); // <--- Tutup server.on request

server.listen(PORT, () => {
    console.log(`Server is listening on http://localhost:${PORT}`);
});