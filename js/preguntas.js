// Preguntas simples en el buscador, con reglas fijas (sin IA):
// «cuánto gasté en rappi», «cuánto gasté en delivery en septiembre», «cuánto me queda», «cuándo vence edesur», «dólar», «cuándo juega river».
import { leer } from "./almacen.js";
import { datosFinanzas, resumenMes, mesDe } from "./finanzas.js";
import { datosEconomia, MESES_AR } from "./economia.js";
import { pendientesCon, cuandoTexto } from "./contexto.js";

const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const normal = (t) => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
const pesos = (n) => "$ " + Math.round(n).toLocaleString("es-AR");
const MESES = MESES_AR.map((m) => normal(m));

function mesPedido(q, hoy) {
  const i = MESES.findIndex((m) => q.includes(m));
  if (i >= 0) return new Date(i > hoy.getMonth() ? hoy.getFullYear() - 1 : hoy.getFullYear(), i, 15);
  if (/mes pasado/.test(q)) return new Date(hoy.getFullYear(), hoy.getMonth() - 1, 15);
  return hoy;
}

export function responder(texto, estado) {
  const q = normal(texto);
  if (q.length < 5) return null;
  const hoy = new Date();

  let m = q.match(/cuanto (?:gaste|gasto|gastamos|llevo gastado) (?:en|de) (.+?)(?: (?:este mes|en (?:\w+)|el mes pasado))?$/);
  if (m) {
    const cuando = mesPedido(q, hoy);
    const termino = m[1].replace(/ (este mes|el mes pasado|en \w+)$/, "").trim();
    const fin = datosFinanzas();
    let total = 0, n = 0;
    (fin?.movs || []).filter((x) => x.ts && mesDe(new Date(x.ts)) === mesDe(cuando) && x.moneda !== "USD")
      .filter((x) => normal(x.contra + " " + x.rubro).includes(termino))
      .forEach((x) => {
        if (x.clase === "gasto" || x.clase === "gasto-tarjeta" || x.clase === "deuda" || x.clase === "tarjeta") { total += x.monto * (x.mitad ? 0.5 : 1); n++; }
        if (x.clase === "devolucion") total -= x.monto;
      });
    const eco = datosEconomia()?.meses?.[cuando.getMonth()];
    const concepto = eco?.egresos?.find((e) => normal(e.concepto).includes(termino));
    const mes = MESES_AR[cuando.getMonth()].toLowerCase();
    if (!n && !concepto) return { texto: `No encuentro gastos de «${esc(termino)}» en ${mes}.`, extra: "Respuesta" };
    const partes = [];
    if (n) partes.push(`<b>${pesos(total)}</b> en ${esc(termino)} (${n} movimiento${n === 1 ? "" : "s"})`);
    if (concepto) partes.push(`tu planilla dice ${pesos(concepto.monto)} en ${esc(concepto.concepto)}`);
    return { texto: `En ${mes}: ${partes.join(" · ")}.`, extra: "Respuesta" };
  }

  if (/cuanto me queda|cuanta plata (tengo|me queda)|saldo del mes/.test(q)) {
    const eco = datosEconomia()?.meses?.[hoy.getMonth()];
    if (eco && eco.saldo != null) return { texto: `Según tu planilla te quedan <b>${pesos(eco.saldo)}</b>${eco.diario != null ? `, unos ${pesos(Math.abs(eco.diario))} por día` : ""}.`, extra: "Respuesta" };
    const r = resumenMes(datosFinanzas(), hoy);
    if (r && r.queda != null) return { texto: `Te quedan <b>${pesos(r.queda)}</b> del disponible del mes.`, extra: "Respuesta" };
    return null;
  }

  m = q.match(/cuando (?:vence|tengo que pagar|pago) (.+)$/);
  if (m && estado?.datos) {
    const p = pendientesCon(estado.datos, hoy).find((x) => normal(x.titulo).includes(m[1].trim()));
    if (p) return { texto: `${esc(p.titulo)}: ${cuandoTexto(p.dias)}${p.monto ? " · " + esc(p.monto) : ""}.`, extra: "Respuesta" };
    return { texto: `No tengo un vencimiento de «${esc(m[1])}» en tu agenda.`, extra: "Respuesta" };
  }

  if (/dolar/.test(q) && /(cuanto|esta|precio|mep|oficial|hoy)/.test(q)) {
    const d = leer("dolar");
    if (d?.oficial) return { texto: `Oficial <b>${pesos(d.oficial.venta)}</b> · MEP <b>${pesos(d.mep?.venta || 0)}</b>`, extra: "Dólar hoy" };
  }

  if (/cuando juega river|proximo partido|juega river/.test(q)) {
    const r = leer("river");
    if (r?.proximo) {
      const f = new Date(r.proximo.fecha);
      return { texto: `River ${r.proximo.local ? "vs" : "visita a"} ${esc(r.proximo.rival)}: ${f.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })} a las ${f.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}.`, extra: "River", href: "#/" };
    }
  }
  return null;
}
