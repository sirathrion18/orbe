// Próximo partido y último resultado de River (datos públicos de ESPN, sin cuenta ni claves).
const BASE = "https://site.api.espn.com/apis/site/v2/sports/soccer/arg.1/teams/16/schedule";

function partido(ev) {
  const c = ev.competitions?.[0];
  if (!c) return null;
  const yo = c.competitors.find((x) => x.team?.id === "16" || /river plate/i.test(x.team?.displayName || ""));
  const otro = c.competitors.find((x) => x !== yo);
  if (!yo || !otro) return null;
  const gol = (x) => { const v = x.score?.displayValue ?? x.score; return v === undefined || v === null || v === "" ? null : Number(v); };
  return {
    fecha: ev.date, rival: otro.team?.shortDisplayName || otro.team?.displayName || "", local: yo.homeAway === "home",
    torneo: ev.season?.displayName || c.type?.abbreviation || "", jugado: !!ev.competitions?.[0]?.status?.type?.completed || ev.status?.type?.completed,
    gf: gol(yo), gc: gol(otro)
  };
}

export async function onRequestGet() {
  try {
    const [a, b] = await Promise.all([fetch(BASE + "?fixture=true"), fetch(BASE)]);
    const eventos = [...((await a.json()).events || []), ...((await b.json()).events || [])];
    const ahora = Date.now();
    const lista = eventos.map(partido).filter(Boolean);
    const proximo = lista.filter((p) => !p.jugado && new Date(p.fecha).getTime() > ahora - 3 * 3600000).sort((x, y) => new Date(x.fecha) - new Date(y.fecha))[0] || null;
    const ultimo = lista.filter((p) => p.jugado && p.gf !== null).sort((x, y) => new Date(y.fecha) - new Date(x.fecha))[0] || null;
    return new Response(JSON.stringify({ proximo, ultimo, cuando: ahora }), {
      headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=1800" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "espn" }), { status: 502, headers: { "Content-Type": "application/json" } });
  }
}
