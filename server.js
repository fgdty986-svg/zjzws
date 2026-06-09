// 轻量网络测速后端 —— 零依赖，纯 Node 内置模块
// 运行：node server.js   然后访问 http://localhost:8000
//
// 提供三个端点：
//   GET  /api/ping              -> 探测后端是否在线（前端据此决定用本地还是公共端点）
//   GET  /api/download?bytes=N  -> 下发 N 字节随机数据，用于下载测速
//   POST /api/upload            -> 接收并丢弃上传数据，返回字节数，用于上传测速
// 其余路径作为静态文件服务（index.html 等）

const http = require('http');
const fs   = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const PORT = process.env.PORT || 8000;

const MIME = {
  '.html':'text/html; charset=utf-8',
  '.js'  :'text/javascript; charset=utf-8',
  '.css' :'text/css; charset=utf-8',
  '.svg' :'image/svg+xml',
  '.json':'application/json; charset=utf-8',
  '.png' :'image/png',
  '.ico' :'image/x-icon',
};

// 预生成一块随机数据，下载时重复发送（避免每次现算）
const RAND_CHUNK = crypto.randomBytes(65536);

function cors(res){
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
}

const server = http.createServer((req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const url = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));
  const p = url.pathname;

  // --- 后端探测 ---
  if (p === '/api/ping') {
    res.writeHead(200, {'Content-Type':'text/plain','Cache-Control':'no-store'});
    res.end('pong');
    return;
  }

  // --- 下载测速：流式下发 N 字节 ---
  if (p === '/api/download') {
    const n = Math.min(parseInt(url.searchParams.get('bytes')) || 1e6, 1e8); // 上限 100MB
    res.writeHead(200, {
      'Content-Type':'application/octet-stream',
      'Cache-Control':'no-store',
      'Content-Length': String(n),
    });
    let sent = 0;
    (function pump(){
      while (sent < n) {
        const size = Math.min(RAND_CHUNK.length, n - sent);
        sent += size;
        const buf = size === RAND_CHUNK.length ? RAND_CHUNK : RAND_CHUNK.subarray(0, size);
        if (!res.write(buf)) { res.once('drain', pump); return; }
      }
      res.end();
    })();
    return;
  }

  // --- 上传测速：读取并丢弃，统计字节数 ---
  if (p === '/api/upload' && req.method === 'POST') {
    let bytes = 0;
    req.on('data', c => { bytes += c.length; });
    req.on('end', () => {
      res.writeHead(200, {'Content-Type':'application/json','Cache-Control':'no-store'});
      res.end(JSON.stringify({ bytes }));
    });
    req.on('error', () => { try { res.writeHead(400); res.end(); } catch(e){} });
    return;
  }

  // --- 静态文件 ---
  let file = decodeURIComponent(p === '/' ? '/index.html' : p);
  const full = path.join(ROOT, path.normalize(file).replace(/^(\.\.[/\\])+/, ''));
  if (!full.startsWith(ROOT)) { res.writeHead(403); res.end('Forbidden'); return; }

  fs.readFile(full, (err, data) => {
    if (err) { res.writeHead(404, {'Content-Type':'text/plain'}); res.end('404 Not Found'); return; }
    res.writeHead(200, {'Content-Type': MIME[path.extname(full)] || 'application/octet-stream'});
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`\n  ✅ 网络测速服务已启动`);
  console.log(`  ➜  本机访问:  http://localhost:${PORT}`);
  console.log(`  ➜  局域网访问: http://<你的IP>:${PORT}\n`);
});
