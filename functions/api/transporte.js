// Estado del subte (líneas E, H y A) desde la API de Transporte de la Ciudad.
// Las credenciales viven en Cloudflare (TRANSPORTE_ID y TRANSPORTE_SECRET); el navegador nunca las ve.
const LINEAS = ["E", "H", "A"];

const texto = (t) => (t?.translation || []).find((x) => /^es/i.test(x.language || "es"))?.text || t?.translation?.[0]?.text || "";

export async function onRequestGet({ env }) {
  if (!env.TRANSPORTE_ID || !env.TRANSPORTE_SECRET) return json({ error: "sin-configurar" }, 503);
  const base = env.TRANSPORTE_BASE || "https://apitransporte.buenosaires.gob.ar";
  const url = base + "/subtes/serviceAlerts?json=1&client_id=" + encodeURIComponent(env.TRANSPORTE_ID) + "&client_secret=" + encodeURIComponent(env.TRANSPORTE_SECRET);
  let j;
  try {
    const r = await fetch(url, { cf: { cacheTtl: 60 } });
    if (r.status === 401 || r.status === 403) return json({ error: "credenciales" }, 502);
    if (!r.ok) return json({ error: "ciudad", status: r.status }, 502);
    j = await r.json();
  } catch (e) { return json({ error: "ciudad" }, 502); }
  const lineas = Object.fromEntries(LINEAS.map((l) => [l, { ok: true, texto: "" }]));
  for (const ent of j.entity || []) {
    const a = ent.alert || {};
    const msj = (texto(a.header_text) + " " + texto(a.description_text)).trim();
    const rutas = (a.informed_entity || []).map((x) => String(x.route_id || "")).join(" ") + " " + ent.id + " " + msj;
    for (const l of LINEAS) {
      if (new RegExp("l[ií]nea\\s*" + l + "\\b", "i").test(rutas)) lineas[l] = { ok: false, texto: msj.slice(0, 160) };
    }
  }
  return json({ lineas, cuando: Date.now() });
}

const json = (d, status = 200) => new Response(JSON.stringify(d), {
  status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=60" }
});
