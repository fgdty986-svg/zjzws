// Cloudflare Pages Function: POST /api/upload
// 读取并丢弃上传数据，返回字节数，用于上传测速
export async function onRequestPost(context) {
  let bytes = 0;
  const body = context.request.body;
  if (body) {
    const reader = body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.length;
    }
  }
  return new Response(JSON.stringify({ bytes }), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}
