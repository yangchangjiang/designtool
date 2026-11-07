// designtool Worker — 静态资产 + /models/ R2 代理 (借鉴 videoprompt/soundtool 模式)
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/models/')) {
      const key = url.pathname.slice('/models/'.length);
      const rangeHdr = request.headers.get('Range');
      const manifestKey = key + '.manifest';
      const manifest = await env.MODELS.get(manifestKey);
      let headers = new Headers();
      headers.set('Access-Control-Allow-Origin', '*');
      const ext = key.split('.').pop();
      headers.set('Content-Type', ext === 'json' ? 'application/json'
        : ext === 'wasm' ? 'application/wasm'
        : ext === 'mjs' || ext === 'js' ? 'text/javascript'
        : 'application/octet-stream');
      headers.set('Cache-Control', (ext === 'json' || ext === 'wasm' || ext === 'mjs')
        ? 'public, max-age=86400'
        : 'public, max-age=31536000, immutable');
      if (rangeHdr && /^bytes=\d+-\d*$/.test(rangeHdr.trim())) {
        const m = rangeHdr.trim().match(/^bytes=(\d+)-(\d*)$/);
        const start = parseInt(m[1], 10);
        let end = m[2] ? parseInt(m[2], 10) : null;
        if (manifest) {
          const info = JSON.parse(await manifest.text());
          const sizes = info.sizes, keys = info.parts;
          let total = 0;
          for (let si = 0; si < sizes.length; si++) total += sizes[si];
          if (end === null) end = total - 1;
          end = Math.min(end, total - 1);
          if (start > end) {
            return new Response('Range Not Satisfiable', { status: 416, headers: { 'Content-Range': 'bytes */' + total } });
          }
          const segs = [];
          let off = 0;
          for (let pi = 0; pi < keys.length; pi++) {
            const ps = sizes[pi];
            const s0 = Math.max(start, off), s1 = Math.min(end, off + ps - 1);
            if (s0 <= s1) segs.push({ key: keys[pi], rel0: s0 - off, rel1: s1 - off });
            off += ps;
          }
          const parts = await Promise.all(segs.map(async function(sg) {
            const o = await env.MODELS.get(sg.key, { range: { offset: sg.rel0, length: sg.rel1 - sg.rel0 + 1 } });
            return await o.arrayBuffer();
          }));
          const len = end - start + 1;
          const out = new Uint8Array(len);
          let p = 0;
          for (let ai = 0; ai < parts.length; ai++) {
            out.set(new Uint8Array(parts[ai]), p);
            p += parts[ai].byteLength;
          }
          headers.set('Content-Length', String(len));
          headers.set('Content-Range', 'bytes ' + start + '-' + end + '/' + total);
          headers.set('Accept-Ranges', 'bytes');
          return new Response(out, { status: 206, headers: headers });
        }
        const obj = await env.MODELS.get(key);
        if (!obj) return new Response('Not Found', { status: 404 });
        const total2 = obj.size;
        if (end === null) end = total2 - 1;
        end = Math.min(end, total2 - 1);
        if (start > end) {
          return new Response('Range Not Satisfiable', { status: 416, headers: { 'Content-Range': 'bytes */' + total2 } });
        }
        const o2 = await env.MODELS.get(key, { range: { offset: start, length: end - start + 1 } });
        const ab2 = await o2.arrayBuffer();
        headers.set('Content-Length', String(ab2.byteLength));
        headers.set('Content-Range', 'bytes ' + start + '-' + end + '/' + total2);
        headers.set('Accept-Ranges', 'bytes');
        return new Response(ab2, { status: 206, headers: headers });
      }
      if (manifest) {
        try {
          const info = JSON.parse(await manifest.text());
          const parts = info.parts.slice();
          const h2 = new Headers();
          h2.set('Content-Type', 'application/octet-stream');
          h2.set('Cache-Control', 'public, max-age=31536000, immutable');
          h2.set('Access-Control-Allow-Origin', '*');
          if (info.sizes && info.sizes.length === parts.length) {
            let total = 0;
            for (let i = 0; i < info.sizes.length; i++) total += info.sizes[i];
            h2.set('Content-Length', String(total));
          }
          const readable = new ReadableStream({
            async pull(controller) {
              if (info.parts.length === 0) { controller.close(); return; }
              const obj = await env.MODELS.get(info.parts.shift());
              if (!obj) { controller.error(new Error('missing part')); return; }
              const reader = obj.body.getReader();
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                controller.enqueue(value);
              }
              if (info.parts.length === 0) controller.close();
            }
          });
          return new Response(readable, { headers: h2 });
        } catch (e) {
          return new Response('manifest error: ' + String(e && e.message || e), { status: 500 });
        }
      }
      const plain = await env.MODELS.get(key);
      if (!plain) return new Response('Not Found', { status: 404 });
      headers.set('Content-Length', String(plain.size));
      headers.set('Connection', 'close');
      return new Response(plain.body, { headers: headers });
    }
    return env.ASSETS.fetch(request);
  }
}
