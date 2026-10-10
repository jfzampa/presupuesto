// Alcanza - service worker: guarda la app para abrirla sin conexión
const V = "alcanza-v1";
self.addEventListener("install", e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(["./", "./index.html"])).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET" || new URL(r.url).hostname.endsWith("supabase.co")) return; // los datos los maneja la app
  e.respondWith(caches.open(V).then(async c => {
    if (r.mode === "navigate") { // la página: primero red (para recibir actualizaciones), si no hay señal, la guardada
      try { const res = await fetch(r); if (res.ok) c.put(r, res.clone()); return res; }
      catch (err) { return (await c.match(r, { ignoreSearch: true })) || (await c.match("./index.html")) || Response.error(); }
    }
    const hit = await c.match(r);
    const net = fetch(r).then(res => { if (res.ok) c.put(r, res.clone()); return res; }).catch(() => null);
    return hit || (await net) || Response.error();
  }));
});
