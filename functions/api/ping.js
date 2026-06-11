// Cloudflare Pages Function: GET /api/ping
// 前端据此判断"有后端"，从而启用 /api/download、/api/upload 做更准的测速
export function onRequest() {
  return new Response('pong', {
    headers: { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' },
  });
}
