import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import db from "./db.js";
import jwt from 'jsonwebtoken';
import zlib from "node:zlib";
import querystring from 'node:querystring';

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
                    <p>Capacity: ${room.capacity} Persons</p>
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
                "transfer-encoding": "chunked",
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

            const selectedDate = query.searchParams.get("date") || new Date().toISOString().split('T')[0];

            const bookingsResult = await db.query(
                `SELECT booking_time FROM bookings 
                WHERE room_id = $1 
                AND booking_date = $2 
                AND status IN ('pending', 'approved')`,
                [roomId, selectedDate]
            );

            const bookedTimes = bookingsResult.rows.map(row => row.booking_time);

            //Mengecek waktu sekarang
            const now = new Date();
            const today = new Date().toISOString().split('T')[0];
            const isToday = selectedDate === today;
            const currentHour = now.getHours();
            const currentMinutes = now.getMinutes();

            //Membuat slot jam 
            const timeSlots = [
                { value: "08.00 - 11.00", start: 8 },
                { value: "11.00 - 13.00", start: 11 },
                { value: "13.00 - 15.00", start: 13 },
                { value: "15.00 - 18.00", start: 15 }
            ];

            let optionsHtml = '<option value="">--Select Booking Time--</option>';

            timeSlots.forEach(slot => {
                const isBooked = bookedTimes.includes(slot.value);
                const isPastTime = isToday && (slot.start < currentHour || (slot.start === currentHour && currentMinutes > 0));

                let disabled = '';
                let label = slot.value;

                if (isBooked) {
                    disabled = 'disabled';
                    label = `${slot.value} (Booked)`;
                } else if (isPastTime) {
                    disabled = 'disabled';
                    label = `${slot.value} (Passed)`;
                }
                optionsHtml += `<option value="${slot.value}" ${disabled}>${label}</option>`;
            });

            //Membaca file bookingHTML
            const bookingPath = path.join("./public/pages/bookingDetail.html");
            let htmlBooking = fs.readFileSync(bookingPath, 'utf8');

            //Mengganti daftar ruangan pada dashboard html
            htmlBooking = htmlBooking.replace('<!--ROOM_IMAGE-->', room.image_path);
            htmlBooking = htmlBooking.replace('<!--ROOM_NAME-->', room.name);
            htmlBooking = htmlBooking.replace('<!--ROOM_CAPACITY-->', `Capacity: ${room.capacity} Persons`)
            htmlBooking = htmlBooking.replace('<!--ROOM_ID-->', room.id);

            htmlBooking = htmlBooking.replace(
                /<select id="duration" name="duration" required>[\s\S]*?<\/select>/,
                `<select id="duration" name="duration" required>${optionsHtml}</select>`
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

    // create booking 
    if (url === "/booking" && method === "POST") {
        let body = "";

        request.on("data", chunk => body += chunk.toString());

        request.on("end", async () => {
            const user = getUserFromRequest(request);
            if (!user || user.role !== "user") {
                response.writeHead(302, { Location: "/login" });
                return response.end();
            }

            const form = new URLSearchParams(body);

            const roomId = form.get("roomId");
            const bookingDate = form.get("bookingDate");
            const bookingTime = form.get("duration");
            const purpose = form.get("purpose");

            // Validasi
            if (!roomId || !bookingDate || !bookingTime) {
                response.writeHead(400, { "Content-Type": "text/plain" });
                return response.end("Incomplete form data.");
            }

            try {
                // Insert ke database
                await db.query(`
                INSERT INTO bookings (user_id, room_id, booking_date, booking_time, purpose, status)
                VALUES ($1, $2, $3, $4, $5, 'pending')
            `, [user.id, roomId, bookingDate, bookingTime, purpose]);

                // Redirect ke history page
                response.writeHead(302, {
                    "Location": "/history"
                });
                response.end();

            } catch (err) {
                console.error("Error insert booking:", err);
                response.writeHead(500, { "Content-Type": "text/plain" });
                response.end("Error saving booking");
            }
        });

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
                        case 'approved': 
                            statusLabel = "Approved"; 
                            break;
                        case 'pending': 
                            statusLabel = "Pending"; 
                            break;
                        case 'rejected': 
                            statusLabel = "Rejected"; 
                            break;
                        case 'canceled': 
                            statusLabel = "Canceled"; 
                            break;
                    }

                    let cancel_book = false;

                    if (item.status === 'pending' || item.status === 'approved') {
                        cancel_book = true;
                    }

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

                                <div class="cancel">
                                    ${cancel_book ? `
                                        <button class="btn-cancel-booking" onclick="cancelBooking(${item.id})">Cancel Booking</button>
                                    ` : ""}
                                </div>
                            </div>

                            <img class="history-image"
                                src="${image}"
                                onerror="this.src='../images/ruang-a/default-room.webp'">
                        </div>
                    </div>`;
                });
            }

            //baca history.html
            let html_history = fs.readFileSync("./public/pages/history.html", 'utf8');

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
                `
            );

            //Compression
            response.writeHead(200, {
                "Content-Type": "text/html",
                "transfer-encoding": "chunked",
                "Content-Encoding": "gzip",
            });

            const gzip = zlib.createGzip();
            //kirim html dalam stream
            const { Readable } = await import("node:stream");
            Readable.from([html_history]).pipe(gzip).pipe(response);

        } catch (err) {
            console.error("Error:", err);
            response.writeHead(500, { "Content-Type": "text/plain" });
            response.end("Error rendering history page");
        }
        return;
    }


    //update booking status di page admin
    if (url === '/admin/booking/update' && method === 'POST') {
        let body = '';
        //menerima data form dalam chunk
        request.on('data', chunk => {
            body += chunk.toString();
        });
        request.on('end', async () => {
            //parse dari url encoded menjadi objek js 
            const parsedBody = querystring.parse(body);
            const { booking_id, status } = parsedBody;

            try {
                //perintah sql update si booking status dan minta redirect ke page admin biar refresh
                await db.query('UPDATE bookings SET status = $1 WHERE id = $2', [status, booking_id]);
                response.writeHead(302, { 'Location': '/admin' });
                response.end();
            } catch (error) {
                console.error('Error updating status:', error);
                response.writeHead(500, { 'Content-Type': 'text/plain' });
                response.end('Error updating status');
            }
        });
        return;
    }

    //page admin
    if (url === '/admin' && method === 'GET') {
        const user = getUserFromRequest(request);
        if (!user || user.role !== 'admin') {
            response.writeHead(302, { 'Location': '/login' });
            response.end();
            return;
        }

        try {
            //ambil dari db booking result nya di join sama user dan room
            const bookingsResult = await db.query(`
                SELECT 
                    b.id,
                    u.username,
                    r.name AS room_name,
                    b.booking_date,
                    b.booking_time,
                    b.purpose,
                    b.status
                FROM bookings b
                JOIN users u ON b.user_id = u.id
                JOIN rooms r ON b.room_id = r.id
                ORDER BY b.id ASC
            `);
            
            //inisiasi tabel kosong dan diisi 
            let tableRows = "";
            if (bookingsResult.rows.length === 0) {
                tableRows = `<tr><td colspan="8" style="text-align: center;">No booking requests found.</td></tr>`;
            } else {
                bookingsResult.rows.forEach(booking => {
                    //convert date/string ke objek js date 
                    const date = new Date(booking.booking_date).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'long', year: 'numeric'
                    });

                    //ngecek status terus masukin ke variabel
                    let statusClass = '';
                    switch (booking.status) {
                        case 'pending':
                            statusClass = 'status-pending';
                            break;
                        case 'approved':
                            statusClass = 'status-approved';
                            break;
                        case 'rejected':
                            statusClass = 'status-rejected';
                            break;
                        case 'canceled':
                            statusClass = 'status-canceled';
                            break;
                    }

                    //variabel boolean
                    const isPending = booking.status === 'pending';
                    const isActive = booking.status === 'pending' || booking.status === 'approved';

                    //tabel tadi diisi dengan data yang udh diambil dari db
                    tableRows += `
                        <tr>
                            <td>${booking.id}</td>
                            <td>${booking.username}</td>
                            <td>${booking.room_name}</td>
                            <td>${date}</td>
                            <td>${booking.booking_time}</td>
                            <td>${booking.purpose}</td>
                            <td class="status"><span class="${statusClass}">${booking.status}</span></td>
                            <td>
                                <div class="action-buttons">
                                    <form action="/admin/booking/update" method="POST" style="display: inline;" onsubmit="return confirm('Are you sure you want to approve this booking?');">
                                        <input type="hidden" name="booking_id" value="${booking.id}">
                                        <input type="hidden" name="status" value="approved">
                                        <button type="submit" class="btn btn-approve" ${!isPending ? 'disabled' : ''}>Approve</button>
                                    </form>
                                    <form action="/admin/booking/update" method="POST" style="display: inline;" onsubmit="return confirm('Are you sure you want to reject this booking?');">
                                        <input type="hidden" name="booking_id" value="${booking.id}">
                                        <input type="hidden" name="status" value="rejected">
                                        <button type="submit" class="btn btn-reject" ${!isPending ? 'disabled' : ''}>Reject</button>
                                    </form>
                                    <form action="/admin/booking/update" method="POST" style="display: inline;" onsubmit="return confirm('Are you sure you want to cancel this booking?');">
                                        <input type="hidden" name="booking_id" value="${booking.id}">
                                        <input type="hidden" name="status" value="canceled">
                                        <button type="submit" class="btn btn-cancel" ${!isActive ? 'disabled' : ''}>Cancel</button>
                                    </form>
                                </div>
                            </td>
                        </tr>
                    `;
                });
            }

            //baca admin_page.html
            const adminPagePath = path.join("./public/pages/admin_page.html");
            let htmlAdmin = fs.readFileSync(adminPagePath, 'utf8');

            //meng-inject pada <tbody>(dicari) dengan tabel yang sudah diisi
            htmlAdmin = htmlAdmin.replace('<tbody>', `<tbody>${tableRows}`);

            //kompresi
            response.writeHead(200, {
                "Content-Type": "text/html",
                "Transfer-Encoding": "chunked",
                "Content-Encoding": "gzip"
            });
            const gzip = zlib.createGzip();
            //kirim dalam stream chunk
            const { Readable } = await import("node:stream");
            Readable.from([htmlAdmin]).pipe(gzip).pipe(response);

        } catch (err) {
            console.error("SSR admin error:", err);
            response.writeHead(500, { "Content-Type": "text/plain" });
            response.end("Error rendering admin page");
        }
        return;
    }

    // --- HANDLE STATIC FILES (Baru dijalankan setelah lolos cek di atas) ---
    let folder = "./public";
    let fileName = url;

    if (url === "/" || url === "/login") {
        fileName = "/pages/login.html";
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