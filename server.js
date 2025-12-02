import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import querystring from "node:querystring";
// import db from "./db.js";

const PORT = 3000;
const server = new http.Server();
server.on("request", (request, response) => {
    console.log(`Request received: ${request.method} ${request.url}`);

    // cek method
    const method = request.method;
    // cek path
    const url = request.url;
    // cek extension
    const extension = path.extname(request.url);

    // hdandle post ke login
    if (url === "/login" && method === "POST") {
        let body = "";
        request.on("data", chunk => {
            body += chunk.toString();
        });
        request.on("end", () => {
            const {email, password} = JSON.parse(body);

            // const result =
            console.log("Email:", email);
            console.log("Password:", password);
            response.end("Login data received");
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
    console.log(contentType);

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
