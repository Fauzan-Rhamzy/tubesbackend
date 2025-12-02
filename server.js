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
        if (url === '/api/bookings' && method === 'GET') {
            const result = await db.query('SELECT * FROM bookings');
            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify(result.rows));
            return;
        }
        if (url === '/api/users' && method === 'GET') {
            const result = await db.query('SELECT * FROM users');
            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify(result.rows));
            return;
        }
        if (url === '/api/rooms' && method === 'GET') {
            const result = await db.query('SELECT * FROM rooms');
            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify(result.rows));
            return;
        }
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
    }

    // hdandle post ke login
    if (url === "/login" && method === "POST") {
        let body = "";
        request.on("data", chunk => {
            body += chunk.toString();
        });
        request.on("end", async() => {
            const {email, password} = JSON.parse(body);

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
