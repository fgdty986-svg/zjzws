# 轻量网络测速后端 —— 纯 Python 标准库，零依赖
# 运行：python server.py   然后访问 http://localhost:8000
#
# 端点：
#   GET  /api/ping              -> 探测后端是否在线
#   GET  /api/download?bytes=N  -> 下发 N 字节随机数据（下载测速）
#   POST /api/upload            -> 接收并丢弃上传数据，返回字节数（上传测速）
#   其余路径作为静态文件服务（index.html 等）

import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = int(os.environ.get("PORT", 8000))
RAND_CHUNK = os.urandom(65536)  # 预生成随机块，下载时重复发送

MIME = {
    ".html": "text/html; charset=utf-8",
    ".js":   "text/javascript; charset=utf-8",
    ".css":  "text/css; charset=utf-8",
    ".svg":  "image/svg+xml",
    ".json": "application/json; charset=utf-8",
    ".png":  "image/png",
    ".ico":  "image/x-icon",
}


class Handler(BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self):
        u = urlparse(self.path)
        p = u.path

        if p == "/api/ping":
            self.send_response(200); self._cors()
            self.send_header("Content-Type", "text/plain")
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(b"pong")
            return

        if p == "/api/download":
            q = parse_qs(u.query)
            n = min(int(q.get("bytes", ["1000000"])[0] or 0), 100_000_000)
            self.send_response(200); self._cors()
            self.send_header("Content-Type", "application/octet-stream")
            self.send_header("Cache-Control", "no-store")
            self.send_header("Content-Length", str(n))
            self.end_headers()
            sent = 0
            try:
                while sent < n:
                    size = min(len(RAND_CHUNK), n - sent)
                    self.wfile.write(RAND_CHUNK[:size])
                    sent += size
            except (BrokenPipeError, ConnectionResetError):
                pass
            return

        self._serve_static(p)

    def do_POST(self):
        u = urlparse(self.path)
        if u.path == "/api/upload":
            length = int(self.headers.get("Content-Length", 0))
            remaining = length
            while remaining > 0:                       # 读取并丢弃
                chunk = self.rfile.read(min(65536, remaining))
                if not chunk:
                    break
                remaining -= len(chunk)
            self.send_response(200); self._cors()
            self.send_header("Content-Type", "application/json")
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(('{"bytes":%d}' % length).encode())
            return
        self.send_response(404); self.end_headers()

    def _serve_static(self, p):
        rel = "index.html" if p == "/" else p.lstrip("/")
        full = os.path.normpath(os.path.join(ROOT, rel))
        if not full.startswith(ROOT) or not os.path.isfile(full):
            self.send_response(404); self._cors()
            self.send_header("Content-Type", "text/plain"); self.end_headers()
            self.wfile.write(b"404 Not Found")
            return
        ext = os.path.splitext(full)[1]
        with open(full, "rb") as f:
            data = f.read()
        self.send_response(200); self._cors()
        self.send_header("Content-Type", MIME.get(ext, "application/octet-stream"))
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, *args):   # 静默常规请求日志
        pass


if __name__ == "__main__":
    print("\n  ✅ 网络测速服务已启动 (Python)")
    print(f"  ➜  本机访问:  http://localhost:{PORT}")
    print(f"  ➜  局域网访问: http://<你的IP>:{PORT}\n")
    ThreadingHTTPServer(("0.0.0.0", PORT), Handler).serve_forever()
