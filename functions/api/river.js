// River: próximos partidos, últimos resultados y la tabla (datos públicos de ESPN, sin cuenta ni claves).
// Se juntan la Liga, la Copa Argentina y las copas de CONMEBOL; si alguna no responde, se sigue con las otras.
const API = "https://site.api.espn.com/apis/site/v2/sports/soccer/";
const LIGAS = ["arg.1", "arg.copa", "conmebol.libertadores", "conmebol.sudamericana"];
const RIVER = "16";

function partido(ev, liga) {
  const c = ev.competitions?.[0];
  if (!c) return null;
  const yo = c.competitors.find((x) => x.team?.id === RIVER || /river plate/i.test(x.team?.displayName || ""));
  const otro = c.competitors.find((x) => x !== yo);
  if (!yo || !otro) return null;
  const gol = (x) => { const v = x.score?.displayValue ?? x.score; return v === undefined || v === null || v === "" ? null : Number(v); };
  const rival = otro.team?.shortDisplayName || otro.team?.displayName || "";
  return {
    id: ev.id, fecha: ev.date, rival, local: yo.homeAway === "home",
    torneo: ev.league?.shortName || ev.league?.name || ev.season?.displayName || liga,
    estadio: c.venue?.fullName || "", hora: c.timeValid !== false,
    jugado: !!(c.status?.type?.completed || ev.status?.type?.completed),
    gf: gol(yo), gc: gol(otro), penales: yo.shootoutScore != null ? [yo.shootoutScore, otro.shootoutScore] : null,
    clasico: /boca/i.test(rival)
  };
}

async function json(url) {
  const r = await fetch(url, { cf: { cacheTtl: 900 } });
  if (!r.ok) throw new Error("espn " + r.status);
  return r.json();
}

async function tabla() {
  try {
    const t = await json("https://site.api.espn.com/apis/v2/sports/soccer/arg.1/standings");
    for (const g of t.children || []) {
      const e = (g.standings?.entries || []).find((x) => x.team?.id === RIVER);
      if (!e) continue;
      const s = Object.fromEntries((e.stats || []).map((x) => [x.name, x.value]));
      return { torneo: t.name || "Liga", zona: g.name || "", pos: s.rank, pts: s.points, pj: s.gamesPlayed, g: s.wins, e: s.ties, p: s.losses, dg: s.pointDifferential,
        equipos: (g.standings?.entries || []).length };
    }
  } catch (e) { /* sin tabla */ }
  return null;
}

export async function onRequestGet() {
  const ahora = Date.now();
  const pedidos = LIGAS.flatMap((l) => [API + l + "/teams/" + RIVER + "/schedule?fixture=true", API + l + "/teams/" + RIVER + "/schedule"].map((u) =>
    json(u).then((j) => (j.events || []).map((ev) => partido(ev, l))).catch(() => [])));
  const [listas, posiciones] = await Promise.all([Promise.all(pedidos), tabla()]);
  const vistos = new Map();
  listas.flat().filter(Boolean).forEach((p) => { if (!vistos.has(p.id) || p.jugado) vistos.set(p.id, p); });
  const todos = [...vistos.values()];
  if (!todos.length) return new Response(JSON.stringify({ error: "espn" }), { status: 502, headers: { "Content-Type": "application/json" } });
  const proximos = todos.filter((p) => !p.jugado && new Date(p.fecha).getTime() > ahora - 3 * 3600000).sort((x, y) => new Date(x.fecha) - new Date(y.fecha)).slice(0, 6);
  const ultimos = todos.filter((p) => p.jugado && p.gf !== null).sort((x, y) => new Date(y.fecha) - new Date(x.fecha)).slice(0, 6);
  return new Response(JSON.stringify({ proximo: proximos[0] || null, ultimo: ultimos[0] || null, proximos, ultimos, tabla: posiciones, cuando: ahora }), {
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=1800" }
  });
}
