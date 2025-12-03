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
    const extension = path.extname(request.url);

    // handle API requests
    if (url.startsWith('/api')) {
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
                    const { userId, roomId, bookingDate, bookingTime, purpose } = JSON.parse(body);

                    if (!userId || !roomId || !bookingDate || !bookingTime || !purpose) {
                        response.writeHead(400, { 'Content-Type': 'application/json' });
                        response.end(JSON.stringify({ message: 'Semua field harus diisi' }));
                        return;
                    }

                    // Cek apakah ruangan sudah dibooking dengan status aktif (pending / approved)
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

                // Mengambil bookings user
                const bookingsResult = await db.query(
                    'SELECT * FROM bookings WHERE user_id = $1 ORDER BY created_at DESC',
                    [userId]
                );

                // Ambil data rooms untuk semua booking
                const roomIds = bookingsResult.rows.map(b => b.room_id);
                const roomsResult = await db.query(
                    `SELECT * FROM rooms WHERE id = ANY($1)`,
                    [roomIds]
                );

                // Mapping rooms
                const roomsMap = {};
                roomsResult.rows.forEach(room => {
                    roomsMap[room.id] = room;
                });

                // Menggabungkan data
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

                // Booking dengan status 'rejected' atau 'cancelled' tidak dianggap "booked"
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

                    response.writeHead(200, { 
                        'Content-Type': 'application/json',
                        'set-cookie': `userId=${user.id}; HttpOnly; Path=/`
                    });
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
            const result = await db.query(
                'SELECT * FROM users WHERE email = $1 AND password = $2',
                [email, password]
            );

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

    // Handle static files
    let folder = "./public";
    let fileName = url;
    const cookies = request.headers.cookie || "";
    console.log(cookies);
    const isLoggedIn = cookies.includes("userId=");

    // const cookie = request.headers.cookie;
    if (url === "/" || url === "/login") {
        if (!cookies) 
            fileName = "/pages/login.html";
        else if (cookies.includes("role=admin")) 
            fileName ="/pages/admin_page.html";
        else if (cookies.includes("role=user"))
            fileName = "/pages/dashboard.html";
        else 
            fileName = "/pages/login.html";
    } 
    else if (url === "/dashboard") {
        if (!isLoggedIn) 
            fileName="/pages/login.html"
        else if (cookies.includes("role=admin"))
            fileName="/pages/admin_page.html"
        else if (!cookies.includes("role=user")) 
            fileName = "/pages/dashboard.html";
    } 
    else if (url === "/admin") {
        if (cookies.includes("role=admin"))
            fileName = "/pages/admin_page.html";
    } 
    else if (url === "/history") {
        fileName = "/pages/history.html";
    } 
    else if (url === "/booking") {
        fileName = "/pages/bookingDetail.html";
    } 
    else {
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

    // console.log("URL dari Browser:", url);
    // console.log("Server mencari di:", filePath);
    // console.log(cookie)


    // if (!isLoggedIn && (url === "/dashboard" || url === "/admin")) {
    //     response.writeHead(302, {
    //         location: "/login"
    //     })
    //     return response.end();
    // }
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