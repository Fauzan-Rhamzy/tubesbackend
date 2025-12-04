import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import db from "./db.js";
import jwt from 'jsonwebtoken';

const PORT = 3000;
const server = new http.Server();

const SECRET_KEY = "rahasia";

// method ambil objek 'user' dari cookie
function getUserFromRequest(request) {
    // ngambil cookie
    const cookieHeader = request.headers.cookie;
    if (!cookieHeader) return null;

    // ngambil token
    const tokenCookie = cookieHeader.split(';').find(c => c.trim().startsWith('token='));
    if (!tokenCookie) return null;

    // ambil value dari token
    const token = tokenCookie.split('=')[1];
    // dekripsi
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        return decoded;
    } catch (err) {
        return null;
    }
}

server.on("request", async (request, response) => {
    // terima request
    console.log(`Request received: ${request.method} ${request.url}`);

    const method = request.method;
    const url = request.url;
    const extension = path.extname(request.url);

    // handle API requests
    if (url.startsWith('/api')) {

        // handle logout, hapus cookie token nya
        if (url === '/api/logout' && method === 'POST') {
            response.writeHead(200, {
                'Content-Type': 'application/json',
                'Set-Cookie': 'token=; HttpOnly; Path=/; Max-Age=0'
            });
            response.end(JSON.stringify({ message: 'Logout berhasil' }));
            return;
        }

        // GET all bookings, untuk di page admin
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

        // CREATE booking, buat di page 
        if (url === '/api/bookings' && method === 'POST') {
            let body = '';

            request.on('data', chunk => {
                body += chunk.toString();
            });

            request.on('end', async () => {
                try {
                    const user = getUserFromRequest(request);
                    if (!user) {
                        response.writeHead(401, { 'Content-Type': 'application/json' });
                        response.end(JSON.stringify({ message: 'Silakan login terlebih dahulu' }));
                        return;
                    }

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

                    const result = await db.query(
                        `INSERT INTO bookings (user_id, room_id, booking_date, booking_time, purpose, status)
                         VALUES ($1, $2, $3, $4, $5, $6)
                         RETURNING *`,
                        [user.id, roomId, bookingDate, bookingTime, purpose, 'pending']
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

        // GET user bookings untuk history
        if (url === '/api/my-bookings' && method === 'GET') {
            const user = getUserFromRequest(request); // 1. Cek siapa yang request dari Cookie

            if (!user) {
                response.writeHead(401, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify({ message: 'Anda belum login!' }));
                return;
            }

            try {
                // 2. Ambil data booking untuk user yang login
                const bookingsResult = await db.query(
                    'SELECT * FROM bookings WHERE user_id = $1 ORDER BY created_at DESC',
                    [user.id]
                );

                // Jika tidak ada booking, langsung return array kosong
                if (bookingsResult.rows.length === 0) {
                    response.writeHead(200, { 'Content-Type': 'application/json' });
                    response.end(JSON.stringify([]));
                    return;
                }

                const roomIds = bookingsResult.rows.map(b => b.room_id);
                const roomsResult = await db.query(
                    `SELECT * FROM rooms WHERE id = ANY($1)`,
                    [roomIds]
                );

                const roomsMap = {};
                roomsResult.rows.forEach(room => {
                    roomsMap[room.id] = room;
                });

                const bookings = bookingsResult.rows.map(booking => {
                    const room = roomsMap[booking.room_id] || {};
                    return {
                        ...booking,
                        room_name: room.name,
                        image_path: room.image_path
                    };
                });

                response.writeHead(200, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify(bookings));
            } catch (error) {
                console.error('Error fetching my bookings:', error);
                response.writeHead(500, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify({ message: 'Error server' }));
            }
            return;
        }

        // UPDATE booking status di admin dan history
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

        // GET room by ID buat dashboard
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

        // handle login
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
                        role: user.role,
                        username: user.username
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

    // proteksi halaman admin
    if (url === '/admin' || url === '/pages/admin_page.html') {
        const user = getUserFromRequest(request);
        if (!user || user.role !== 'admin') {
            response.writeHead(302, { 'Location': '/login' });
            response.end();
            return;
        }
    }

    // proteksi halaman user
    if (url === '/dashboard' || url === '/history' || url === '/booking') {
        const user = getUserFromRequest(request);
        if (!user || user.role !== "user") {
            response.writeHead(302, { 'Location': '/login' });
            response.end();
            return;
        }
    }

    // set main directory nya
    const folder = "./public";
    let fileName = url;

    // handle request ke url untuk nampilin html
    if (url === "/" || url === "/login") {
        fileName = "/pages/login.html";
    }
    else if (url === "/dashboard") {
        fileName = "/pages/dashboard.html";
    }
    else if (url === "/admin") {
        fileName = "/pages/admin_page.html";
    }
    else if (url === "/history") {
        fileName = "/pages/history.html";
    }
    else if (url === "/booking") {
        fileName = "/pages/bookingDetail.html";
    }
    // handle css, js, atau image dari request html
    else {
        fileName = url;
    }

    // buat direktori full menuju file
    const filePath = path.join(folder, fileName);
    // ambil extension dari file
    const fileExtension = path.extname(filePath);

    // mapping jenis extension dan nama content type nya
    const mimeTypes = {
        ".html": "text/html",
        ".css": "text/css",
        ".js": "application/javascript",
        ".png": "image/png",
        ".jpg": "image/jpg",
        ".json": "application/json",
        ".webp": "image/webp",
    };

    // ambil content ype berdasarkan mapping mimeTypes
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
});

server.listen(PORT, () => {
    console.log(`Server is listening on http://localhost:${PORT}`);
});