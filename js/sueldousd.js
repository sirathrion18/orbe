// Tu sueldo en dólares: cada recibo desde 2020, pasado a dólares con el promedio del mes, y a pesos de hoy.
// La cuenta se hace acá, en tu celu: el servidor solo da el dólar de cada mes (público) y nunca ve tu sueldo.
import { leer, guardar, sesion } from "./almacen.js";
import { datosSueldosHist as datosHist } from "./recibos.js";
import { esc } from "./inicio.js";
import { MESES } from "./contexto.js";
import { ICONOS } from "./iconos.js";
import { permisos } from "./google.js";

const DIA = 24 * 60 * 60000;
export const datosDolarMeses = () => leer("dolarMeses");
let trayendo = null;
// El dólar de cada mes, una vez por día.
export function traerDolarMeses(forzar) {
  const g = datosDolarMeses();
  if (!forzar && g && Date.now() - g.cuando < DIA) return Promise.resolve(g);
  if (trayendo) return trayendo;
  trayendo = fetch("/api/dolar-historico").then((r) => { if (!r.ok) throw new Error("dolar-historico"); return r.json(); })
    .then((j) => { if (!j.blue) throw new Error("sin-datos"); const d = { cuando: Date.now(), fuente: j.fuente, blue: j.blue, oficial: j.oficial }; guardar("dolarMeses", d, true); return d; })
    .catch(() => g || null).finally(() => { trayendo = null; });
  return trayendo;
}

const mesLargo = (k) => { const [y, m] = k.split("-").map(Number); return MESES[m - 1] + " " + y; };
const mesCorto = (k) => MESES[Number(k.slice(5, 7)) - 1].slice(0, 3) + " " + k.slice(2, 4);
const may = (t) => t.charAt(0).toUpperCase() + t.slice(1);
const pct = (x) => (Math.round(Math.abs(x) * 10) / 10).toLocaleString("es-AR", { maximumFractionDigits: 1 });

// Los meses con recibo y dólar: { k, neto, cot, usd }.
export function serieUsd(casa = "blue") {
  const h = datosHist(), d = datosDolarMeses()?.[casa] || {};
  return Object.keys(h).filter((k) => /^\d{4}-\d{2}$/.test(k) && h[k]?.neto > 0).sort()
    .map((k) => ({ k, neto: h[k].neto, cot: d[k] || null, usd: d[k] ? h[k].neto / d[k] : null }));
}

// El dólar de hoy: el de dolarapi (el mismo de Finanzas) o, si no hay, el promedio del último mes.
function dolarHoy(casa) {
  const v = leer("dolar")?.[casa]?.venta;
  if (v > 0) return { v, de: "hoy" };
  const d = datosDolarMeses()?.[casa] || {}, ult = Object.keys(d).sort().pop();
  return ult ? { v: d[ult], de: mesLargo(ult) } : null;
}

export function renderDolares() {
  const oculto = leer("plataOculta", false);
  const $ = (n) => oculto ? "••••" : "$ " + Math.round(n).toLocaleString("es-AR");
  const u = (n) => oculto ? "US$ •••" : "US$ " + Math.round(n).toLocaleString("es-AR");
  const casa = sesion("usdCasa") === "oficial" ? "oficial" : "blue";
  const nombreCasa = casa === "blue" ? "blue" : "oficial";
  const cab = `<a class="volver" href="#/d/sueldo">${ICONOS.volver} Tu sueldo</a><h1>En dólares</h1><p class="bajada">Cada recibo desde que entraste, pasado a dólares del mes en que lo cobraste, y a pesos de hoy.</p>`;
  const h = datosHist(), l = h._l || {};
  const leidos = Object.keys(h).filter((k) => /^\d{4}-\d{2}$/.test(k)).length;
  const leyendo = sesion("histLeyendo");
  const boton = (txt) => `<button class="chip" data-accion="hist-leer" ${leyendo ? "disabled" : ""}>${leyendo ? esc(leyendo) : txt}</button>`;
  if (!permisos().drive) return cab + `<section class="bloque"><h2>Falta permiso de Drive</h2><p class="vacio">Orbe lee tus recibos de BNA/RECIBOS en tu Drive. Dale permiso en Ajustes.</p><div class="chips" style="margin-top:12px"><a class="chip" href="#/ajustes">Ir a Ajustes</a></div></section>`;
  if (!leidos) return cab + `<section class="bloque"><h2>Todavía no leí tus recibos viejos</h2><p class="vacio">Están en tu Drive, en BNA › RECIBOS, una carpeta por año. Leerlos todos tarda un par de minutos; mejor con wifi.</p><div class="chips" style="margin-top:12px">${boton("Leer todos los recibos")}</div></section>`;
  const dm = datosDolarMeses();
  if (!dm) return cab + `<section class="bloque"><h2>Falta el dólar de cada mes</h2><p class="vacio">Lo bajo de internet (es público). Si no carga, probá con señal.</p><div class="chips" style="margin-top:12px"><button class="chip" data-accion="dolar-meses">Reintentar</button></div></section>`;

  const s = serieUsd(casa), con = s.filter((x) => x.usd);
  const hoy = dolarHoy(casa);
  if (!con.length || !hoy) return cab + `<section class="bloque"><h2>Sin datos para cruzar</h2><p class="vacio">Tengo ${leidos} recibos pero no el dólar de esos meses. Probá más tarde.</p></section>`;
  const prim = con[0], ult = con[con.length - 1];
  const vs = (ult.usd / prim.usd - 1) * 100;
  const chips = `<div class="chips usd-casa" role="group" aria-label="Qué dólar">${[["blue", "Blue"], ["oficial", "Oficial"]].map(([k, n]) => `<button class="chip ${casa === k ? "on" : ""}" data-accion="usd-casa" data-c="${k}" aria-pressed="${casa === k}">${n}</button>`).join("")}</div>`;

  const hero = `<section class="bloque usd-hero">
      <p class="k-dt">${may(mesLargo(prim.k))} · ${prim === s[0] ? "tu primer recibo" : "el primero con dólar"}</p>
      <ul class="lista usd-filas">
        <li><span>Cobraste</span><span class="der">${$(prim.neto)}</span></li>
        <li><span>Eran<br><small class="vacio">${nombreCasa} de ese mes: ${oculto ? "•••" : "$ " + Math.round(prim.cot).toLocaleString("es-AR")}</small></span><span class="der">${u(prim.usd)}</span></li>
        <li><span>A dólar de hoy<br><small class="vacio">${nombreCasa} ${hoy.de === "hoy" ? "de hoy" : "de " + hoy.de}: ${oculto ? "•••" : "$ " + Math.round(hoy.v).toLocaleString("es-AR")}</small></span><span class="der"><b>${$(prim.usd * hoy.v)}</b></span></li>
      </ul>
      <p class="k-dt" style="margin-top:16px">${may(mesLargo(ult.k))} · el último</p>
      <p class="dt-big">${$(ult.neto)} <span class="usd-eq">= ${u(ult.usd)}</span></p>
      <p class="dt-var"><span class="${vs >= 0 ? "dt-sube" : "dt-baja"}">${vs >= 0 ? "▲" : "▼"} ${pct(vs)}%</span> <span>${vs >= 0 ? "más" : "menos"} que en ${mesLargo(prim.k)}, medido en dólares</span></p>
    </section>`;

  // Gráfico: US$ por mes, de punta a punta.
  const W = 320, H = 120, P = 4, max = Math.max(...con.map((x) => x.usd)), min = 0;
  const xs = (i) => P + (W - 2 * P) * (s.length === 1 ? .5 : i / (s.length - 1));
  const ys = (v) => H - P - (H - 2 * P) * ((v - min) / (max - min || 1));
  const pts = s.map((x, i) => x.usd ? [xs(i), ys(x.usd)] : null).filter(Boolean);
  const linea = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join("");
  const area = pts.length ? linea + `L${pts[pts.length - 1][0].toFixed(1)} ${H - P}L${pts[0][0].toFixed(1)} ${H - P}Z` : "";
  const anios = [...new Set(s.map((x) => x.k.slice(0, 4)))];
  const marcas = anios.map((a) => { const i = s.findIndex((x) => x.k.startsWith(a)); return `<span style="left:${(xs(i) / W * 100).toFixed(1)}%">${a.slice(2)}</span>`; }).join("");
  const mejor = con.reduce((a, b) => (b.usd > a.usd ? b : a)), peor = con.reduce((a, b) => (b.usd < a.usd ? b : a));
  const grafico = oculto ? "" : `<section class="bloque"><h2>US$ por mes</h2>
      <svg class="usd-graf" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Tu sueldo en dólares ${nombreCasa}, de ${mesLargo(s[0].k)} a ${mesLargo(ult.k)}">
        <path d="${area}" class="a"/><path d="${linea}" class="l" vector-effect="non-scaling-stroke"/></svg>
      <div class="usd-anios" aria-hidden="true">${marcas}</div>
      <p class="usd-mm"><span>Mejor mes: <b>${mesCorto(mejor.k)}</b> · ${u(mejor.usd)}</span><span>Peor: <b>${mesCorto(peor.k)}</b> · ${u(peor.usd)}</span></p></section>`;

  const porAnio = anios.map((a) => { const l = con.filter((x) => x.k.startsWith(a)); return l.length ? { a, n: l.length, prom: l.reduce((t, x) => t + x.usd, 0) / l.length } : null; }).filter(Boolean);
  const maxA = Math.max(...porAnio.map((x) => x.prom));
  const anual = `<section class="bloque"><h2>Por año</h2><p class="usd-sub">Promedio de cada año, en dólares.</p><ul class="usd-anual">${porAnio.map((x) => `<li><span>${x.a}</span><i style="--w:${(x.prom / maxA * 100).toFixed(1)}%"></i><b>${u(x.prom)}</b>${x.n < 12 ? `<small>${x.n} ${x.n === 1 ? "mes" : "meses"}</small>` : "<small></small>"}</li>`).join("")}</ul></section>`;

  const lista = `<details class="bloque plegable"><summary>Mes por mes</summary><ul class="lista usd-lista">${[...s].reverse().map((x) => `<li><span>${may(mesLargo(x.k))}<br><small class="vacio">${$(x.neto)}${x.cot ? " · " + nombreCasa + " " + (oculto ? "•••" : "$ " + Math.round(x.cot).toLocaleString("es-AR")) : " · sin dólar de ese mes"}</small></span><span class="der">${x.usd ? u(x.usd) + `<br><small class="vacio">hoy ${$(x.usd * hoy.v)}</small>` : "—"}</span></li>`).join("")}</ul></details>`;

  const ilegibles = Object.values(l).filter((v) => v === "ilegible").length;
  const pie = `<p class="fuente-dato">Neto de cada recibo de sueldo de tu carpeta BNA › RECIBOS (${leidos} meses${ilegibles ? `; ${ilegibles} ${ilegibles === 1 ? "PDF no lo pude leer" : "PDF no los pude leer"}` : ""}). Los «DB» y los bonos aparte no entran. Dólar: promedio del mes, precio de venta (${esc(dm.fuente === "bluelytics" ? "Bluelytics" : "ArgentinaDatos")}). Es una referencia en dólares, no por inflación.</p>
    <div class="chips" style="margin-top:12px">${boton("Buscar recibos nuevos")}</div>`;
  return cab + chips + hero + grafico + anual + lista + pie;
}

// Leer los recibos que falten, con aviso de cuántos van.
export async function leerTodos(leerHistorico, repintar, avisar) {
  if (sesion("histLeyendo")) return;
  sesion("histLeyendo", "Buscando recibos…"); repintar();
  try {
    const r = await leerHistorico(200, (n, t) => { sesion("histLeyendo", `Leyendo ${n} de ${t}…`); repintar(); });
    await traerDolarMeses();
    avisar(r.leidos ? `Leí ${r.leidos} ${r.leidos === 1 ? "recibo" : "recibos"}` : "No hay recibos nuevos");
  } catch (e) { avisar("No pude leer los recibos: probá con señal"); }
  finally { sesion("histLeyendo", null); repintar(); }
}
