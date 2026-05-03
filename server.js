// Mini serveur HTTP pour exposer SB sur le LAN (S25 Ultra)
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = 8080;
const ROOT = __dirname;
const TYPES = {
  '.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8',
  '.js':'application/javascript; charset=utf-8','.json':'application/json; charset=utf-8',
  '.webmanifest':'application/manifest+json; charset=utf-8',
  '.png':'image/png','.svg':'image/svg+xml','.ico':'image/x-icon'
};

http.createServer((req,res)=>{
  let url = decodeURIComponent(req.url.split('?')[0]);
  if (url === '/') url = '/index.html';
  const file = path.join(ROOT, url);
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(file, (err,data)=>{
    if (err) { res.writeHead(404); return res.end('Not found'); }
    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, {
      'Content-Type': TYPES[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache'
    });
    res.end(data);
  });
}).listen(PORT, '0.0.0.0', ()=>{
  console.log('\n✅ SB est en ligne !\n');
  console.log('💻 Sur ce PC      : http://localhost:' + PORT);
  const ifs = os.networkInterfaces();
  for (const name in ifs) {
    for (const i of ifs[name]) {
      if (i.family === 'IPv4' && !i.internal) {
        console.log(`📱 Sur ton S25    : http://${i.address}:${PORT}   (${name})`);
      }
    }
  }
  console.log('\nCtrl+C pour arrêter\n');
});
