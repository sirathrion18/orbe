// Alertas meteorológicas oficiales del SMN para un punto (las que publica en formato CAP, el estándar de la OMM).
// Lee el índice público del SMN, abre cada alerta vigente y se queda con las que tocan tu punto
// (por el polígono del área o, si no hay polígono, por el nombre de la zona). Datos públicos: no usa ni guarda nada tuyo.
const INDICE = "https://ssl.smn.gob.ar/CAP/AR.php";
const CABA = /ciudad aut[oó]noma|capital federal|\bcaba\b|ciudad de buenos aires/i;

const tag = (xml, t) => { const m = xml.match(new RegExp(`<(?:\\w+:)?${t}[^>]*>([\\s\\S]*?)</(?:\\w+:)?${t}>`, "i")); return m ? limpiar(m[1]) : ""; };
const tags = (xml, t) => [...xml.matchAll(new RegExp(`<(?:\\w+:)?${t}[^>]*>([\\s\\S]*?)</(?:\\w+:)?${t}>`, "gi"))].map((m) => m[1]);
const limpiar = (s) => String(s).replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, "&").trim();

// ¿El punto está dentro del polígono CAP («lat,lon lat,lon …»)?
function adentro(poly, lat, lon) {
  const p = poly.trim().split(/\s+/).map((x) => x.split(",").map(Number)).filter((x) => x.length === 2 && x.every(Number.isFinite));
  let d = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const [ai, oi] = p[i], [aj, oj] = p[j];
    if ((oi > lon) !== (oj > lon) && lat < (aj - ai) * (lon - oi) / (oj - oi) + ai) d = !d;
  }
  return d;
}
const NIVEL = { minor: "amarilla", moderate: "amarilla", severe: "naranja", extreme: "roja" };
function nivelDe(info) {
  const v = tags(info, "parameter").map((x) => limpiar(x)).join(" ").toLowerCase();
  if (/\b(rojo|roja|red)\b/.test(v)) return "roja";
  if (/\b(naranja|orange)\b/.test(v)) return "naranja";
  if (/\b(amarillo|amarilla|yellow)\b/.test(v)) return "amarilla";
  return NIVEL[tag(info, "severity").toLowerCase()] || "amarilla";
}
const fecha = (s) => { const d = new Date(s); return isNaN(d) ? null : d; };
const corto = (d) => d ? d.toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", weekday: "short", hour: "2-digit", minute: "2-digit" }) : "";

export async function onRequestGet({ request }) {
  const u = new URL(request.url);
  const lat = Number(u.searchParams.get("lat")), lon = Number(u.searchParams.get("lon"));
  const cab = { "Content-Type": "application/json", "Cache-Control": "public, max-age=600" };
  if (!(lat >= -56 && lat <= -21 && lon >= -74 && lon <= -53)) return new Response(JSON.stringify({ alertas: [], error: "lugar" }), { status: 400, headers: cab });
  try {
    const r = await fetch(INDICE, { cf: { cacheTtl: 600, cacheEverything: true }, headers: { "User-Agent": "Orbe (uso personal)" } });
    if (!r.ok) throw new Error("indice " + r.status);
    const indice = await r.text();
    // El índice puede traer las alertas adentro o links a cada una.
    let caps = tags(indice, "alert").map((x) => "<alert>" + x + "</alert>");
    if (!caps.length) {
      const links = [...new Set([...indice.matchAll(/https?:\/\/[^\s"'<>]+?\.xml/gi)].map((m) => m[0].replace(/&amp;/g, "&")))].slice(0, 30);
      caps = (await Promise.all(links.map((l) => fetch(l, { cf: { cacheTtl: 600, cacheEverything: true } }).then((x) => x.ok ? x.text() : "").catch(() => "")))).filter(Boolean);
    }
    const ahora = new Date(), vistos = new Set(), alertas = [];
    for (const cap of caps) {
      if (/<(?:\w+:)?msgType>\s*Cancel/i.test(cap) || /<(?:\w+:)?status>\s*(Test|Exercise|Draft)/i.test(cap)) continue;
      for (const info of tags(cap, "info")) {
        const lang = tag(info, "language"); if (lang && !/^es/i.test(lang)) continue;
        const hasta = fecha(tag(info, "expires")), desde = fecha(tag(info, "onset") || tag(info, "effective"));
        if (hasta && hasta < ahora) continue;
        const areas = tags(info, "area");
        const toca = areas.some((a) => tags(a, "polygon").some((p) => adentro(limpiar(p), lat, lon)) || (!tags(a, "polygon").length && CABA.test(tag(a, "areaDesc"))));
        if (!toca) continue;
        const evento = tag(info, "event") || tag(info, "headline");
        const k = evento + "|" + (desde?.toISOString() || "");
        if (vistos.has(k)) continue; vistos.add(k);
        alertas.push({ evento, nivel: nivelDe(info), cuando: [desde && desde > ahora ? "Desde el " + corto(desde) : "Vigente", hasta ? "hasta el " + corto(hasta) : ""].filter(Boolean).join(" "), texto: (tag(info, "description") || tag(info, "instruction")).slice(0, 900) });
      }
    }
    const orden = { roja: 0, naranja: 1, amarilla: 2 };
    alertas.sort((a, b) => orden[a.nivel] - orden[b.nivel]);
    return new Response(JSON.stringify({ alertas: alertas.slice(0, 4), revisadas: caps.length }), { headers: cab });
  } catch (e) {
    return new Response(JSON.stringify({ alertas: [], error: "smn" }), { status: 502, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
  }
}
