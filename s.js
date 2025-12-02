import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const server = new http.Server();
server.on("request", (request, response) => {
    console.log(`Request received: ${request.method} ${request.url}`);
    // cek method
    const method = request.method;
    // cek path
    const extension = path.extname(request.url);

    let filePath;
    if (request.url === "/") {
        filePath = "./public/pages/login.html";
        response.write(filePath);
    } else if (request.url === "/admin") {
        filePath = "./public/pages/admin_page.html";
    }
    // else if (extension === "") {
    //     console.log("masuk sini");
    //     filePath = "./public/pages" + request.url + ".html";
    // }
    else {
        filePath = `./public${request.url}`;
    }
    const finalExtension = path.extname(filePath);

    const mimeTypes = {
        ".html": "text/html",
        ".css": "text/css",
        ".js": "application/javascript",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".json": "application/json",
        ".webp": "image/webp",
    };

    const contentType = mimeTypes[finalExtension] || "text/plain";

    fs.readFile(filePath, (err, content) => {
        console.log(filePath);
        // console.log(content);
        if (err) {
            response.writeHead(404);
            response.end("Halaman tidak ditemukan!");
        } else {
            response.writeHead(200, { "Content-Type": contentType });
            response.end(content);
        }
    })
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is listening on http://localhost:${PORT}`);
});