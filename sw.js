const CACHE = "sgy-v147";
const SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./sgy_logo.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Only handle our own origin (app shell). Let YouTube/podcast/network calls pass through.
  if (url.origin !== location.origin) return;
  // 화면(HTML)은 브라우저 캐시(최대 10분)를 거치지 않고 서버에 확인해서 받음 — 다시 열면 바로 최신 배포 (11/23)
  const page = req.mode === "navigate" || /\/$|\.html$/.test(url.pathname);
  const net = page
    ? fetch(req.url, { cache: "no-cache", credentials: "same-origin" }).then(r => r.redirected ? Response.redirect(r.url, 302) : r)
    : fetch(req);
  e.respondWith(
    net
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req).then(r => r || caches.match("./index.html")))
  );
});
