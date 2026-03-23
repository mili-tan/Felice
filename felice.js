/**
 * Cloudflare Worker — Felice
 */

let searxInstances = null;

async function fetchInstances(env) {
  if (searxInstances) {
    console.log('[instances] cache hit, count:', Object.keys(searxInstances).length);
    return searxInstances;
  }
  console.log('[instances] fetching...');
  try {
    const res = await fetch('https://searx.space/data/instances.json', {
      headers: { 'User-Agent': 'Felice/0.1' },
    });
    console.log('[instances] status:', res.status);
    searxInstances = (await res.json()).instances;
    console.log('[instances] loaded:', Object.keys(searxInstances).length);
  } catch (e) {
    console.error('[instances] failed:', e.message);
    searxInstances = {};
  }
  return searxInstances;
}

function getSearX(instances) {
  const names = Object.keys(instances);
  if (!names.length) throw new Error('No instances');
  for (let i = 0; i < 50; i++) {
    const name = names[Math.floor(Math.random() * names.length)];
    const inst = instances[name];
    try {
      if (name.includes('.onion') || name.includes('.i2p')) { console.log(`  skip: onion/i2p`); continue; }
      if (parseInt(inst.version.split('.')[0]) < 2) { console.log(`  skip: ver < 2`); continue; }
      if (!inst.tls?.grade?.includes('A')) { console.log(`  skip: tls`); continue; }
      if (!inst.http?.grade?.includes('A')) { console.log(`  skip: http`); continue; }
      if (inst.html?.grade !== 'V' && inst.html?.grade !== 'F') { console.log(`  skip: html`); continue; }
      console.log(`[getSearX] selected: ${name}`);
      return name;
    } catch { continue; }
  }
  const fb = names[Math.floor(Math.random() * names.length)];
  console.warn('[getSearX] fallback:', fb);
  return fb;
}

function getEngine(engine) {
  const map = { ddg:'duckduckgo', go:'google', gg:'google', bi:'bing', by:'bing', yh:'yahoo', wp:'wikipedia', wiki:'wikipedia' };
  return map[engine] || engine;
}

async function handleFind(keyword, env) {
  console.log('[find] raw:', keyword);
  if (keyword === 'idk' || keyword === '.idk') return Response.redirect('https://felice.mili.one', 302);
  if (keyword.includes('xn--')) { try { keyword = decodeURIComponent(keyword); } catch {} }
  keyword = keyword.replace(/[ _-]/g, '+').replace(/\.idk$/, '');
  console.log('[find] normalized:', keyword);

  if (keyword.includes('@')) {
    const [q, e] = keyword.split('@');
    const t = `https://searx.neocities.org/?q=${q}&engines=${getEngine(e)}&theme=simple&language=all&oscar-style=logicodev`;
    console.log('[find] engine ->', t);
    return Response.redirect(t, 302);
  }

  try {
    const sr = await fetch(`https://www.wikidata.org/w/api.php?action=wbsearchentities&language=en&limit=3&format=json&search=${encodeURIComponent(keyword)}`, { headers: { 'User-Agent': 'Felice/0.1' } });
    const sd = await sr.json();
    console.log('[find] wikidata results:', sd.search?.length ?? 0);
    if (sd.search?.length) {
      for (const item of sd.search) {
        const cr = await fetch(`https://www.wikidata.org/w/api.php?action=wbgetclaims&property=P856&format=json&entity=${item.id}`, { headers: { 'User-Agent': 'Felice/0.1' } });
        const cd = await cr.json();
        const p = cd.claims?.P856;
        if (p?.length) {
          try { const u = p[0].mainsnak.datavalue.value; console.log('[find] wiki URL:', u); return Response.redirect(u, 302); } catch {}
        }
      }
    }
  } catch (e) { console.error('[find] wiki error:', e.message); }

  try {
    if (env.API_KEY) {
      console.log('[find] trying Ollama...');
      const or = await fetch('https://ollama.com/api/web_search', {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: keyword, max_results: 1 }),
      });
      const od = await or.json();
      if (od?.results?.length) { console.log('[find] ollama:', od.results[0].url); return Response.redirect(od.results[0].url, 302); }
    }
  } catch (e) { console.error('[find] ollama error:', e.message); }

  console.log('[find] fallback DDG');
  return Response.redirect(`https://duckduckgo.com/?q=!ducky+${keyword}`, 302);
}

// ─── HTML ────────────────────────────────────────────────────────────
const HTML = `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"><title>Felice</title>
<link href="https://fonts.googleapis.com/css2?family=Playwrite+DK+Uloopet:wght@100..400&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0a0a0a;color:#e8e4dc;font-family:monospace;height:100vh;display:flex;align-items:center;justify-content:center;overflow:hidden}
body::before{content:'';position:fixed;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");pointer-events:none;z-index:999}
.w{width:min(520px,88vw);opacity:0;animation:r .8s cubic-bezier(.22,1,.36,1) .2s forwards}
@keyframes r{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
.b{font-family:'Playwrite DK Uloopet',cursive;font-weight:100;font-size:2.4rem;text-align:center;margin-bottom:2rem}
.b span{color:#c8b47a}
.s{display:flex;border:1px solid #2a2a2a;border-radius:2px;background:#141414;transition:border-color .3s}
.s:focus-within{border-color:#c8b47a}
.s input{flex:1;background:0 0;border:0;outline:0;color:#e8e4dc;font-family:inherit;font-size:.85rem;font-weight:300;padding:1rem 1.2rem}
.s input::placeholder{color:#5a554d}
.s button{background:0 0;border:0;border-left:1px solid #2a2a2a;color:#5a554d;padding:0 1.2rem;cursor:pointer;transition:color .25s;display:flex;align-items:center}
.s button:hover{color:#c8b47a}
.s button svg{width:16px;height:16px;transition:transform .25s}
.s button:hover svg{transform:translateX(2px)}
.h{text-align:center;margin-top:1.4rem;font-size:.65rem;letter-spacing:.15em;text-transform:uppercase;color:#5a554d;opacity:0;animation:f .6s ease .9s forwards}
@keyframes f{to{opacity:1}}
.f{position:fixed;bottom:2rem;left:0;right:0;text-align:center;font-size:.6rem;letter-spacing:.12em;color:#5a554d;opacity:0;animation:f .6s ease 1.2s forwards}
.f a{color:#c8b47a;text-decoration:none}
</style></head><body>
<div class="w"><div class="b">Feli<span>c</span>e</div><div class="s"><input id="i" type="text" placeholder="search anything..." autocomplete="off" autofocus><button onclick="go()"><svg viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" d="M1 8a7 7 0 1 0 14 0A7 7 0 0 0 1 8m15 0A8 8 0 1 1 0 8a8 8 0 0 1 16 0M4.5 7.5a.5.5 0 0 0 0 1h5.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5z"/></svg></button></div><div class="h">powered by wikidata & searx</div></div>
<div class="f">&copy; Felice by <a href="https://mili.one">Mili.ONE</a></div>
<script>
const i=document.getElementById('i');i.addEventListener('keydown',e=>{if(e.key==='Enter'&&i.value.trim())go()});
function go(){if(i.value.trim())window.location.replace('https://felice.mili.one/find/'+encodeURIComponent(i.value.trim()))}
</script></body></html>`;

// ─── Router ──────────────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    console.log('══════════════════════════════════');
    console.log(`[req] ${request.method} ${path}`);

    const instances = await fetchInstances(env);

    if (path === '/' && request.method === 'GET') {
      console.log('[route] / -> index');
      return new Response(HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }

    if (path === '/searx' && request.method === 'GET') {
      const inst = getSearX(instances);
      console.log('[route] /searx ->', inst);
      return new Response(inst, { headers: { 'Content-Type': 'text/plain' } });
    }

    if (path.startsWith('/search/') && request.method === 'GET') {
      let keyword = decodeURIComponent(path.slice(8));
      if (keyword.includes('xn--')) { try { keyword = decodeURIComponent(keyword); } catch {} }
      const parts = keyword.split('.');
      const query = parts[0].replace(/-/g, '+');
      let target;
      if (parts.length === 3 || (parts.length === 2 && parts[1] !== 's' && parts[1] !== 'search')) {
        target = `${getSearX(instances)}search?q=${query}&engines=${getEngine(parts[1])}&theme=simple&language=all&oscar-style=logicodev`;
      } else {
        target = `${getSearX(instances)}search?q=${query}&theme=simple&language=all&oscar-style=logicodev`;
      }
      console.log('[route] /search ->', target);
      return Response.redirect(target, 302);
    }

    if (path.startsWith('/find/') && request.method === 'GET') {
      return handleFind(decodeURIComponent(path.slice(6)), env);
    }

    console.log('[route] 404');
    return new Response('Not Found', { status: 404 });
  },
};
