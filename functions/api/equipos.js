// Otros equipos (Primera División y Primera Nacional): posición, cómo vienen y qué juegan.
// Datos públicos de ESPN, sin cuenta ni claves. Se buscan por nombre en las tablas de las dos categorías.
const API = "https://site.api.espn.com/apis/";
const LIGAS = [["arg.1", "Primera División"], ["arg.2", "Primera Nacional"]];
const normal = (t) => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

async function json(url) {
  const r = await fetch(url, { cf: { cacheTtl: 900 } });
  if (!r.ok) throw new Error("espn " + r.status);
  return r.json();
}

function partido(ev, id) {
  const c = ev.competitions?.[0];
  if (!c) return null;
  const yo = c.competitors.find((x) => x.team?.id === id), otro = c.competitors.find((x) => x.team?.id !== id);
  if (!yo || !otro) return null;
  const gol = (x) => { const v = x.score?.displayValue ?? x.score; return v === undefined || v === null || v === "" ? null : Number(v); };
  return { fecha: ev.date, rival: otro.team?.shortDisplayName || otro.team?.displayName || "", local: yo.homeAway === "home", hora: c.timeValid !== false,
    jugado: !!(c.status?.type?.completed || ev.status?.type?.completed), gf: gol(yo), gc: gol(otro) };
}

export async function onRequestGet({ request }) {
  const pedidos = (new URL(request.url).searchParams.get("q") || "").split(",").map((x) => x.trim()).filter(Boolean).slice(0, 12);
  if (!pedidos.length) return new Response(JSON.stringify({ equipos: [] }), { headers: { "Content-Type": "application/json" } });
  const tablas = await Promise.all(LIGAS.map(([l]) => json(API + "v2/sports/soccer/" + l + "/standings").catch(() => null)));
  // Todos los equipos de las dos categorías, con su zona y posición.
  const todos = [];
  tablas.forEach((t, i) => (t?.children || []).forEach((g) => (g.standings?.entries || []).forEach((e) => {
    const s = Object.fromEntries((e.stats || []).map((x) => [x.name, x.value]));
    todos.push({ id: e.team?.id, nombre: e.team?.shortDisplayName || e.team?.displayName || "", largo: e.team?.displayName || "", liga: LIGAS[i][0], ligaNombre: LIGAS[i][1],
      zona: g.name || "", pos: s.rank, pts: s.points, pj: s.gamesPlayed, equiposZona: (g.standings?.entries || []).length });
  })));
  const equipos = await Promise.all(pedidos.map(async (q) => {
    const nq = normal(q);
    const e = todos.find((x) => normal(x.nombre) === nq || normal(x.largo) === nq) || todos.find((x) => normal(x.largo).includes(nq) || normal(x.nombre).includes(nq));
    if (!e) return { pedido: q, encontrado: false };
    const base = API + "site/v2/sports/soccer/" + e.liga + "/teams/" + e.id + "/schedule";
    const [prox, res] = await Promise.all([json(base + "?fixture=true").catch(() => ({})), json(base).catch(() => ({}))]);
    const lista = [...(prox.events || []), ...(res.events || [])].map((ev) => partido(ev, e.id)).filter(Boolean);
    const vistos = new Set();
    const unicos = lista.filter((p) => { const k = p.fecha + p.rival; if (vistos.has(k)) return false; vistos.add(k); return true; });
    const ultimos = unicos.filter((p) => p.jugado && p.gf !== null).sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, 5);
    const proximo = unicos.filter((p) => !p.jugado && new Date(p.fecha).getTime() > Date.now() - 3 * 3600000).sort((a, b) => new Date(a.fecha) - new Date(b.fecha))[0] || null;
    return { pedido: q, encontrado: true, nombre: e.nombre, liga: e.ligaNombre, zona: e.zona, pos: e.pos, pts: e.pts, pj: e.pj, equiposZona: e.equiposZona, ultimos, proximo };
  }));
  return new Response(JSON.stringify({ equipos, cuando: Date.now() }), {
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=1800" }
  });
}
