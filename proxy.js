import https from 'https:';
import http from 'http';
import fs from 'fs';
import path from 'path';

const PROXY_PORT = 8443;
const APP_PORT = 3000;

const options = {
  key: fs.readFileSync(path.resolve('private-key.pem')),
  cert: fs.readFileSync(path.resolve('certificate.pem')),
};

const server = https.createServer(options, (req, res) => {
  const proxyOptions = {
    hostname: 'localhost',
    port: APP_PORT,
    path: req.url,
    method: req.method,
    headers: req.headers,
  };

  const proxyReq = http.request(proxyOptions, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('Proxy request error:', err);
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('Bad Gateway');
  });
  
  req.pipe(proxyReq);

  req.on('error', (err) => {
    console.error('Incoming request error:', err);
    proxyReq.destroy();
  });
});

server.listen(PROXY_PORT, () => {
  console.log(`HTTPS reverse proxy listening on https://localhost:${PROXY_PORT}`);
});
