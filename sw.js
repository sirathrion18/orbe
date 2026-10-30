// Orbe funciona sin internet: guarda la app y muestra lo último que tenía.
const VERSION = "orbe-0.41.0";
const APP = [
  "./", "index.html", "manifest.webmanifest", "css/orbe.css",
  "js/app.js", "js/almacen.js", "js/finanzas.js", "js/hoja.js", "js/facu.js", "js/campus.js", "js/campusui.js", "js/satelite.js", "js/sateliteui.js", "js/saldo.js", "js/recibos.js", "js/extras.js", "js/preguntas.js", "js/economia.js", "js/huella.js", "js/listas.js", "js/productividad.js", "js/presupuesto.js", "js/escalafon.js", "js/analisis.js", "js/semanal.js", "js/checklists.js", "js/rastreador.js", "js/central.js", "js/proyectosid.js", "js/proyectosui.js", "js/cosmos.js", "js/detalles.js", "js/avisos.js", "js/huevos.js", "js/guinos.js", "js/suscripciones.js", "js/rivercal.js", "js/agendames.js", "js/bnahoy.js", "js/finanzasui.js", "js/mesreal.js", "js/resumen.js", "js/movimientos.js", "js/rubros.js", "js/sincro.js", "js/config.js", "js/contexto.js", "js/fuente.js", "js/google.js",
  "js/iconos.js", "js/inicio.js", "js/novedades.js", "js/paginas.js", "js/saludos.js", "js/sol.js", "js/tema-temprano.js",
  "datos/ejemplo.json", "iconos/orbe.svg", "iconos/orbe-192.png", "iconos/orbe-512.png", "iconos/orbe-180.png",
  "vendor/fraunces/fraunces-latin-600-normal.woff2"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(APP)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys()
    .then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Primero la red (así siempre ves lo último), y si no hay conexión, lo guardado.
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  const mismoOrigen = url.origin === location.origin;
  const fuentes = url.hostname.endsWith("fonts.googleapis.com") || url.hostname.endsWith("fonts.gstatic.com");
  if (!mismoOrigen && !fuentes) return; // el clima lo maneja la app
  if (mismoOrigen && url.pathname.startsWith("/api/")) return; // la sesión nunca se guarda en caché
  e.respondWith(
    fetch(e.request).then((r) => {
      if (r.ok || r.type === "opaque") { const copia = r.clone(); caches.open(VERSION).then((c) => c.put(e.request, copia)); }
      return r;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match("index.html")))
  );
});
