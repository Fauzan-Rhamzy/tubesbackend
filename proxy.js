import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';

// port public milik proxy
const PROXY_PORT = 8443; 

// port aplikasi/server
const APP_PORT = 3000;

// konfigurasi server https
const privateKeyPath = path.resolve('private-key.pem');
const certificatePath = path.resolve('certificate.pem');

const privateKey = fs.readFileSync(privateKeyPath);
const certificate = fs.readFileSync(certificatePath);

const options = {
  key: privateKey,
  cert: certificate
};

// membuat server https sebagai reverse proxy
const proxy = https.createServer(options, (request, response) => {
  // opsi request untuk diteruskan ke server internal
  const server = {
    hostname: 'localhost',    // server berjalan di localhost
    port: APP_PORT,           // port server
    path: request.url,        // url yang diminta client
    method: request.method,   // method diminta client
    headers: request.headers, // header dari client
  };

  // proxy membuat request lewat http ke server internal
  const proxyReq = http.request(server, (proxyRes) => {
    // ketika proxy dapat respons dari server, kirim response ke client status dan header
    response.writeHead(proxyRes.statusCode, proxyRes.headers);
    // kirim juga body dari respons yang diterima proxy ke client sebagai response
    proxyRes.pipe(response);
  });

  // kirim bagian body dari request client lewat proxy ke server
  request.pipe(proxyReq);

});

proxy.listen(PROXY_PORT, () => {
  console.log(`HTTPS reverse proxy is listening on https://localhost:${PROXY_PORT}`);
});
