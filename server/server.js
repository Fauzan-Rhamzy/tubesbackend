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

    // 3. JIKA RUTE TIDAK DITEMUKAN
    else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Halaman tidak ditemukan' }));
    }
});

// Jalankan Server
server.listen(3000, () => {
    console.log('Server berjalan di http://localhost:3000');
});