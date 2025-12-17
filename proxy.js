import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';

// Port yang digunakan oleh proxy dan server aplikasi
const PROXY_PORT = 8443; // Port publik yang mendengarkan koneksi HTTPS dari klien
const APP_PORT = 3000;   // Port internal tempat server aplikasi utama berjalan (HTTP)

// Opsi untuk konfigurasi server HTTPS (memuat sertifikat SSL)
const options = {
  key: fs.readFileSync(path.resolve('private-key.pem')), 
  cert: fs.readFileSync(path.resolve('certificate.pem')),
};

// Membuat server HTTPS yang bertindak sebagai reverse proxy
// Setiap permintaan masuk dari klien akan ditangani oleh fungsi callback ini
const server = https.createServer(options, (req, res) => {
  // Opsi untuk permintaan baru yang akan diteruskan ke server aplikasi internal
  const proxyOptions = {
    hostname: 'localhost', // Server aplikasi berjalan di localhost
    port: APP_PORT,        // Target port server aplikasi
    path: req.url,         // Meneruskan URL asli dari permintaan klien
    method: req.method,    // Meneruskan metode HTTP asli (GET, POST, dll.)
    headers: req.headers,  // Meneruskan semua header asli dari permintaan klien
  };

  // Membuat permintaan HTTP ke server aplikasi internal
  const proxyReq = http.request(proxyOptions, (proxyRes) => {
    // Ketika server aplikasi merespons, salin status code dan header-nya ke respons klien
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    // Mengalirkan (stream) body respons dari server aplikasi langsung ke klien
    proxyRes.pipe(res);
  });

  // Penanganan error jika proxy gagal terhubung ke server aplikasi
  proxyReq.on('error', (err) => {
    console.error('Proxy request error:', err);
    res.writeHead(502, { 'Content-Type': 'text/plain' }); // Mengirim 502 Bad Gateway
    res.end('Bad Gateway');
  });
  
  // Mengalirkan (stream) body permintaan dari klien ke server aplikasi
  // Penting untuk permintaan seperti POST/PUT yang memiliki body data
  req.pipe(proxyReq);

  // Penanganan error jika ada masalah dengan permintaan masuk dari klien
  req.on('error', (err) => {
    console.error('Incoming request error:', err);
    proxyReq.destroy(); // Hancurkan permintaan proxy jika ada error klien
  });
});

// Memulai server HTTPS reverse proxy untuk mendengarkan koneksi
server.listen(PROXY_PORT, () => {
  console.log(`HTTPS reverse proxy listening on https://localhost:${PROXY_PORT}`);
});
