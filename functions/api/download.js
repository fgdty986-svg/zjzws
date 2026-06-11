// Cloudflare Pages Function: GET /api/download?bytes=N
// 流式下发 N 字节随机数据，用于下载测速
export function onRequestGet(context) {
  const url = new URL(context.request.url);
  let n = parseInt(url.searchParams.get('bytes')) || 1_000_000;
  n = Math.min(Math.max(n, 0), 100_000_000); // 上限 100MB

  const chunk = new Uint8Array(65536);
  crypto.getRandomValues(chunk); // 一次性填随机，重复发送

  let sent = 0;
  const stream = new ReadableStream({
    pull(controller) {
      if (sent >= n) { controller.close(); return; }
      const size = Math.min(65536, n - sent);
      controller.enqueue(size === 65536 ? chunk : chunk.subarray(0, size));
      sent += size;
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Cache-Control': 'no-store',
      'Content-Length': String(n),
    },
  });
}
