import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import db from "./db.js";

const PORT = 3000;
const server = new http.Server();
server.on("request", async (request, response) => {
    console.log(`Request received: ${request.method} ${request.url}`);

    // cek method
    const method = request.method;
    // cek path
    const url = request.url;
    // cek extension
    const extension = path.extname(request.url);


    // handle API requests
    if (url.startsWith('/api')) {
        // GET all bookings with JOIN
        if (url === '/api/bookings' && method === 'GET') {
            try {
                const result = await db.query(
                    `SELECT b.*, r.name as room_name, r.image_path, u.username 
                     FROM bookings b 
                     JOIN rooms r ON b.room_id = r.id 
                     JOIN users u ON b.user_id = u.id
                     ORDER BY b.created_at DESC`
                );
                response.writeHead(200, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify(result.rows));
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
                    const { userId, roomId, bookingDate, bookingTime, purpose } = JSON.parse(body);

                    // Validasi input
                    if (!userId || !roomId || !bookingDate || !bookingTime || !purpose) {
                        response.writeHead(400, { 'Content-Type': 'application/json' });
                        response.end(JSON.stringify({ message: 'Semua field harus diisi' }));
                        return;
                    }

                    // Cek apakah ruangan sudah dibooking
                    const checkBooking = await db.query(
                        'SELECT * FROM bookings WHERE room_id = $1 AND booking_date = $2 AND booking_time = $3 AND status != $4',
                        [roomId, bookingDate, bookingTime, 'rejected']
                    );

                    if (checkBooking.rows.length > 0) {
                        response.writeHead(409, { 'Content-Type': 'application/json' });
                        response.end(JSON.stringify({
                            message: 'Ruangan sudah dibooking pada tanggal dan waktu tersebut'
                        }));
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

                } catch (error) {
                    console.error('Error creating booking:', error);
                    response.writeHead(500, { 'Content-Type': 'application/json' });
                    response.end(JSON.stringify({ message: 'Error membuat booking' }));
                }
            });
            return;
        }

        // GET user bookings
        if (url.startsWith('/api/bookings/user/') && method === 'GET') {
            try {
                const userId = url.split('/')[4];

                const result = await db.query(
                    `SELECT b.*, r.name as room_name, r.image_path 
                     FROM bookings b 
                     JOIN rooms r ON b.room_id = r.id 
                     WHERE b.user_id = $1 
                     ORDER BY b.created_at DESC`,
                    [userId]
                );

                response.writeHead(200, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify(result.rows));

            } catch (error) {
                console.error('Error fetching user bookings:', error);
                response.writeHead(500, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify({ message: 'Error mengambil data booking' }));
            }
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
                    await db.query('UPDATE bookings SET status = $1 WHERE id = $2', [status, id]);
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
                const result = await db.query('SELECT id, username, email, role, created_at FROM users ORDER BY id ASC');
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
                const result = await db.query('SELECT id, name, image_path, capacity FROM rooms ORDER BY id ASC');
                response.writeHead(200, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify(result.rows));
            } catch (error) {
                console.error('Error fetching rooms:', error);
                response.writeHead(500, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify({ message: 'Error mengambil data ruangan' }));
            }
            return;
        }

        // GET room by ID
        if (url.startsWith('/api/rooms/') && !url.includes('user') && method === 'GET') {
            try {
                const id = url.split('/')[3];

                const result = await db.query('SELECT id, name, image_path, capacity FROM rooms WHERE id = $1', [id]);

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

                    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);

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

                    response.writeHead(200, { 'Content-Type': 'application/json' });
                    response.end(JSON.stringify({
                        message: 'Login berhasil',
                        userId: user.id,
                        username: user.username,
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

    // handle post ke login (keep original)
    if (url === "/login" && method === "POST") {
        let body = "";
        request.on("data", chunk => {
            body += chunk.toString();
        });
        request.on("end", async () => {
            const { email, password } = JSON.parse(body);

            const result = await db.query('SELECT * FROM users WHERE email = $1 AND password = $2', [email, password]);
            console.log("Email:", email);
            console.log("Password:", password);
            if (result.rows.length > 0) {
                const user = result.rows[0];
                console.log(user);
                response.writeHead(300, { "Content-Type": "text/plain" });
                if (user.role === 'admin') {
                    // response.
                }
            }
        });
        return;
    }

    let folder = "./public";
    let fileName = url;

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
    // console.log(contentType);

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
    })
});

server.listen(PORT, () => {
    console.log(`Server is listening on http://localhost:${PORT}`);
});