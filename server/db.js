// db.js
const { Pool } = require('pg');

// Sesuaikan konfigurasi ini dengan PostgreSQL di laptop Anda
const pool = new Pool({
  user: 'postgres',      // Default user postgres
  host: 'localhost',
  database: 'backend_tubes',  // Ganti dengan nama database Anda
  password: 'ayamjantanada2', // Ganti dengan password pgAdmin Anda
  port: 5432,
});

// Kita export fungsi query agar bisa dipakai di server.js
module.exports = {
  query: (text, params) => pool.query(text, params),
};