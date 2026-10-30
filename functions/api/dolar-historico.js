// Dólar histórico, mes por mes: promedio del precio de venta del blue y del oficial desde 2011.
// Datos públicos (ArgentinaDatos; si no responde, Bluelytics). No usa cuenta ni guarda nada tuyo:
// el sueldo nunca viaja acá, la cuenta en dólares se hace en tu celu.
const FUENTES = {
  argentinadatos: async () => {
    const bajar = async (casa) => {
      const r = await fetch("https://api.argentinadatos.com/v1/cotizaciones/dolares/" + casa, { cf: { cacheTtl: 43200 } });
      if (!r.ok) throw new Error("argentinadatos " + r.status);
      return (await r.json()).map((x) => ({ fecha: String(x.fecha || ""), venta: Number(x.venta) }));
    };
    const [blue, oficial] = await Promise.all([bajar("blue"), bajar("oficial")]);
    return { blue, oficial };
  },
  bluelytics: async () => {
    const r = await fetch("https://api.bluelytics.com.ar/v2/evolution.json", { cf: { cacheTtl: 43200 } });
    if (!r.ok) throw new Error("bluelytics " + r.status);
    const l = await r.json();
    const de = (s) => l.filter((x) => String(x.source).toLowerCase() === s).map((x) => ({ fecha: String(x.date || ""), venta: Number(x.value_sell) }));
    return { blue: de("blue"), oficial: de("oficial") };
  }
};

// Promedio de cada mes (AAAA-MM), redondeado a dos decimales.
export function porMes(serie) {
  const acc = {};
  for (const { fecha, venta } of serie) {
    const m = /^(\d{4})-(\d{2})/.exec(fecha);
    if (!m || !(venta > 0)) continue;
    const k = m[1] + "-" + m[2];
    (acc[k] ||= [0, 0]);
    acc[k][0] += venta; acc[k][1]++;
  }
  return Object.fromEntries(Object.entries(acc).sort(([a], [b]) => a.localeCompare(b)).map(([k, [s, n]]) => [k, Math.round(s / n * 100) / 100]));
}

export async function onRequestGet({ request }) {
  const cache = caches.default, clave = new Request(new URL("/api/dolar-historico?v=1", request.url).toString());
  const guardado = await cache.match(clave);
  if (guardado) return guardado;
  for (const [nombre, f] of Object.entries(FUENTES)) {
    try {
      const { blue, oficial } = await f();
      const out = { fuente: nombre, blue: porMes(blue), oficial: porMes(oficial) };
      if (Object.keys(out.blue).length < 12) throw new Error("serie corta");
      const r = new Response(JSON.stringify(out), { headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=43200" } });
      await cache.put(clave, r.clone());
      return r;
    } catch (e) { /* la otra fuente */ }
  }
  return new Response(JSON.stringify({ error: "sin-datos" }), { status: 502, headers: { "Content-Type": "application/json; charset=utf-8" } });
}
