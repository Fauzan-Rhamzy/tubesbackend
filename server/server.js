// server.js
const http = require('http');
const db = require('./db'); // Import koneksi db yang tadi dibuat

const server = http.createServer(async (req, res) => {
    // 1. ATUR CORS (Agar frontend html bisa akses server ini)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Jika browser tanya "boleh akses gak?" (OPTIONS), jawab "boleh"
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // 2. RUTE: LOGIN (POST /api/login)
    if (req.url === '/api/login' && req.method === 'POST') {
        let body = '';

        // Terima data potong-potong (chunk) dari frontend
        req.on('data', chunk => {
            body += chunk.toString();
        });

        // Setelah data diterima semua
        req.on('end', async () => {
            try {
                // Ubah data JSON string jadi Objek Asli
                const { email, password } = JSON.parse(body);

                // --- LOGIKA DATABASE ---
                // Cek apakah user ada di database
                const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);

                if (result.rows.length === 0) {
                    // User tidak ditemukan
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Email tidak ditemukan' }));
                    return;
                }

                const user = result.rows[0];

                // Cek Password (sederhana dulu, nanti bisa pakai bcrypt kalau sempat)
                if (user.password !== password) {
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Password salah' }));
                    return;
                }

                // Login Sukses
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    message: 'Login berhasil',
                    userId: user.id, // Tambahkan userId untuk booking
                    username: user.username,
                    role: user.role // misal ada kolom role (admin/user)
                }));

            } catch (error) {
                console.error(error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Error server' }));
            }
        });
    }

    // 3. RUTE: GET ROOMS (GET /api/rooms)
    else if (req.url === '/api/rooms' && req.method === 'GET') {
        try {
            // Ambil semua data ruangan dari database
            const result = await db.query('SELECT id, name, image_path, capacity FROM rooms ORDER BY id ASC');

            // Kirim data ruangan
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result.rows));

        } catch (error) {
            console.error(error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Error mengambil data ruangan' }));
        }
    }

    // 4. RUTE: GET ROOM BY ID (GET /api/rooms/:id)
    else if (req.url.startsWith('/api/rooms/') && req.method === 'GET') {
        try {
            // Ambil ID dari URL
            const id = req.url.split('/')[3];

            // Query ruangan berdasarkan ID
            const result = await db.query('SELECT id, name, image_path, capacity FROM rooms WHERE id = $1', [id]);

            if (result.rows.length === 0) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Ruangan tidak ditemukan' }));
                return;
            }

            // Kirim data ruangan
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result.rows[0]));

        } catch (error) {
            console.error(error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Error mengambil data ruangan' }));
        }
    }

   // 5. RUTE: CREATE BOOKING (POST /api/bookings)
else if (req.url === '/api/bookings' && req.method === 'POST') {
    let body = '';

    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', async () => {
        try {
            const { userId, roomId, bookingDate, bookingTime, purpose } = JSON.parse(body);

            // Validasi input
            if (!userId || !roomId || !bookingDate || !bookingTime || !purpose) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Semua field harus diisi' }));
                return;
            }

            // CEK BENTROK BOOKING RUANGAN
            const checkBooking = await db.query(
                `SELECT * FROM bookings 
                 WHERE room_id = $1 
                 AND booking_date = $2 
                 AND booking_time = $3 
                 AND status != $4`,
                [roomId, bookingDate, bookingTime, 'rejected']
            );

            if (checkBooking.rows.length > 0) {
                res.writeHead(409, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    message: 'Ruangan sudah dibooking pada tanggal dan waktu tersebut'
                }));
                return;
            }

            // INSERT booking baru — MULTIPLE BOOKING ALLOWED
            const result = await db.query(
                `INSERT INTO bookings (user_id, room_id, booking_date, booking_time, purpose, status) 
                 VALUES ($1, $2, $3, $4, $5, $6) 
                 RETURNING *`,
                [userId, roomId, bookingDate, bookingTime, purpose, 'pending']
            );

            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                message: 'Booking berhasil dibuat',
                booking: result.rows[0]
            }));

        } catch (error) {
            console.error('Error creating booking:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Error membuat booking' }));
        }
    });
}

    // 6. RUTE: GET USER BOOKINGS (GET /api/bookings/user/:userId)
    else if (req.url.startsWith('/api/bookings/user/') && req.method === 'GET') {
        try {
            const userId = req.url.split('/')[4];

            // Query semua booking milik user dengan join ke tabel rooms
            const result = await db.query(
                `SELECT b.*, r.name as room_name, r.image_path 
                 FROM bookings b 
                 JOIN rooms r ON b.room_id = r.id 
                 WHERE b.user_id = $1 
                 ORDER BY b.created_at DESC`,
                [userId]
            );

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result.rows));

        } catch (error) {
            console.error('Error fetching user bookings:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Error mengambil data booking' }));
        }
    }

    // 7. RUTE: CANCEL BOOKING (PATCH /api/bookings/cancel/:id)
    else if (req.url.startsWith('/api/bookings/cancel/') && req.method === 'PATCH') {
        const id = req.url.split('/')[3];

        try {
            const result = await db.query(
                `UPDATE bookings 
                SET status = 'cancelled_by_user' 
                WHERE id = $1 
                RETURNING *`,
                [id]
            );

            if (result.rows.length === 0) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Booking tidak ditemukan' }));
                return;
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                message: 'Booking berhasil dibatalkan',
                booking: result.rows[0]
            }));

        } catch (error) {
            console.error('Cancel error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Gagal membatalkan booking' }));
        }
    }
    // 8. RUTE: GET SEMUA BOOKING (ADMIN)
    else if (req.url === '/api/bookings' && req.method === 'GET') {

        try {
            const result = await db.query(`
                SELECT b.*, u.username, r.name AS room_name, r.image_path
                FROM bookings b
                JOIN users u ON b.user_id = u.id
                JOIN rooms r ON b.room_id = r.id
                ORDER BY b.created_at DESC
            `);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result.rows));

        } catch (error) {
            console.error('Admin fetch error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Gagal mengambil semua booking' }));
        }
    }
    // 9. RUTE: APPROVE BOOKING (PATCH /api/bookings/approve/:id)
    else if (req.url.startsWith('/api/bookings/approve/') && req.method === 'PATCH') {
        const id = req.url.split('/')[3];

        try {
            const result = await db.query(
                `UPDATE bookings 
                SET status = 'approved' 
                WHERE id = $1 
                RETURNING *`,
                [id]
            );

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: "Booking disetujui", booking: result.rows[0] }));

        } catch (error) {
            console.error(error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Gagal approve booking' }));
        }
    }
    // 10. RUTE: REJECT BOOKING (PATCH /api/bookings/reject/:id)
    else if (req.url.startsWith('/api/bookings/reject/') && req.method === 'PATCH') {
        const id = req.url.split('/')[3];

        try {
            const result = await db.query(
                `UPDATE bookings 
                SET status = 'rejected' 
                WHERE id = $1 
                RETURNING *`,
                [id]
            );

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: "Booking ditolak", booking: result.rows[0] }));

        } catch (error) {
            console.error(error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Gagal reject booking' }));
        }
    }

    else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Halaman tidak ditemukan' }));
    }
});



// Jalankan Server
server.listen(3000, () => {
    console.log('Server berjalan di http://localhost:3000');
});