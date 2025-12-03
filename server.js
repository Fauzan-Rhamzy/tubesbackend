import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import db from "./db.js";

const PORT = 3000;
const server = new http.Server();

server.on("request", async (request, response) => {
    console.log(`Request received: ${request.method} ${request.url}`);

    const method = request.method;
    const url = request.url;

    if (url.startsWith('/api')) {
        // LOGIN API - PINDAHKAN KE DALAM BLOK API
        if (url === '/api/login' && method === 'POST') {
            let body = '';

            request.on('data', chunk => {
                body += chunk.toString();
            });

            request.on('end', async () => {
                try {
                    const { email, password } = JSON.parse(body);

                    console.log("Login attempt - Email:", email);

                    const result = await db.query(
                        'SELECT * FROM users WHERE email = $1 AND password = $2',
                        [email, password]
                    );

                    if (result.rows.length > 0) {
                        const user = result.rows[0];
                        console.log("Login successful:", user.username);

                        response.writeHead(200, { 'Content-Type': 'application/json' });
                        response.end(JSON.stringify({
                            message: 'Login successful',
                            userId: user.id,
                            username: user.username,
                            role: user.role,
                            email: user.email
                        }));
                    } else {
                        console.log("Login failed: Invalid credentials");
                        response.writeHead(401, { 'Content-Type': 'application/json' });
                        response.end(JSON.stringify({
                            message: 'Email atau password salah'
                        }));
                    }
                } catch (error) {
                    console.error("Login error:", error);
                    response.writeHead(500, { 'Content-Type': 'application/json' });
                    response.end(JSON.stringify({
                        message: 'Server error'
                    }));
                }
            });
            return;
        }

        // GET all bookings
        if (url === '/api/bookings' && method === 'GET') {
            const result = await db.query('SELECT * FROM bookings');
            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify(result.rows));
            return;
        }

        // GET all users
        if (url === '/api/users' && method === 'GET') {
            const result = await db.query('SELECT * FROM users');
            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify(result.rows));
            return;
        }

        // GET all rooms
        if (url === '/api/rooms' && method === 'GET') {
            const result = await db.query('SELECT * FROM rooms');
            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify(result.rows));
            return;
        }

        // GET room by ID
        const roomMatch = url.match(/^\/api\/rooms\/(\d+)$/);
        if (roomMatch && method === 'GET') {
            const roomId = roomMatch[1];

            const result = await db.query('SELECT * FROM rooms WHERE id = $1', [roomId]);

            if (result.rows.length === 0) {
                response.writeHead(404, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify({ message: 'Room not found' }));
                return;
            }

            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify(result.rows[0]));
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
                const { status } = JSON.parse(body);
                await db.query('UPDATE bookings SET status = $1 WHERE id = $2', [status, id]);
                response.writeHead(200, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify({ message: 'Status updated successfully' }));
            });
            return;
        }

        // GET booking availability
        const availabilityMatch = url.match(/\/api\/bookings\/availability\/(\d+)\/(.+)$/);
        if (availabilityMatch && method === 'GET') {
            const roomId = availabilityMatch[1];
            const date = availabilityMatch[2];

            const result = await db.query(
                `SELECT booking_time FROM bookings 
                WHERE room_id = $1 
                AND booking_date = $2 
                AND status IN ('pending', 'confirmed')`,
                [roomId, date]
            );

            const bookedTimes = result.rows.map(row => row.booking_time);

            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ bookedTimes }));
            return;
        }

        // CREATE booking
        if (url === '/api/bookings' && method === 'POST') {
            let body = '';

            request.on('data', chunk => {
                body += chunk.toString();
            });

            request.on('end', async () => {
                const { userId, roomId, bookingDate, bookingTime, purpose } = JSON.parse(body);

                if (!userId || !roomId || !bookingDate || !bookingTime || !purpose) {
                    response.writeHead(400, { 'Content-Type': 'application/json' });
                    response.end(JSON.stringify({ message: 'Semua field harus diisi' }));
                    return;
                }

                // Cek apakah ruangan sudah dibooking
                const checkBooking = await db.query(
                    `SELECT * FROM bookings 
                    WHERE room_id = $1 
                    AND booking_date = $2 
                    AND booking_time = $3 
                    AND status IN ('pending', 'confirmed')`,
                    [roomId, bookingDate, bookingTime]
                );

                if (checkBooking.rows.length > 0) {
                    response.writeHead(409, { 'Content-Type': 'application/json' });
                    response.end(JSON.stringify({ message: 'Ruangan sudah dibooking pada tanggal dan waktu tersebut' }));
                    return;
                }

                // Insert booking
                const result = await db.query(
                    `INSERT INTO bookings (user_id, room_id, booking_date, booking_time, purpose, status)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    RETURNING *`,
                    [userId, roomId, bookingDate, bookingTime, purpose, 'pending']
                );

                response.writeHead(201, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify({
                    message: 'Booking berhasil dibuat',
                    booking: result.rows[0]
                }));
            });
            return;
        }

        // Jika API tidak ditemukan
        response.writeHead(404, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ message: "API route not found" }));
        return;
    }

    // Route untuk serving HTML pages
    let folder = "./public";
    let fileName = url;

    if (url === "/" || url === "/login") {
        fileName = "/pages/login.html";
    } else if (url === "/dashboard") {
        fileName = "/pages/dashboard.html";
    } else if (url === "/admin" || url === "/admin_page") {
        fileName = "/pages/admin_page.html";
    } else if (url === "/history") {
        fileName = "/pages/history.html";
    } else if (url === "/booking") {
        fileName = "/pages/bookingDetail.html";
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

    console.log("URL dari Browser:", url);
    console.log("Server mencari di:", filePath);

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