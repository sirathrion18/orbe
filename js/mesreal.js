// El mes real: los mismos renglones que tu ECONOMÍA, pero con la plata de verdad.
// Cada concepto busca su número en este orden: lo que marcaste vos → el recibo (préstamo) → la hoja DIVISIÓN
// (lo compartido, tu mitad) → un pago que Orbe vio en tus mails → el aviso de vencimiento → las suscripciones.
// Si no hay nada, usa el del mes pasado (o el de tu planilla) y lo marca como estimado. Nada se inventa.
import { leer, guardar } from "./almacen.js";
import { datosEconomia } from "./economia.js";
import { datosFinanzas } from "./finanzas.js";

const normal = (t) => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
const dos = (n) => String(n).padStart(2, "0");
const VACIAS = new Set(["pago", "pagos", "cuota", "cuotas", "mes", "servicio", "servicios", "total", "gym"]);
const palabras = (t) => normal(t).split(" ").filter((w) => w.length >= 4 && !VACIAS.has(w));

export const colchonPct = () => { const v = Number(leer("colchonPct", 5)); return Number.isFinite(v) && v >= 0 && v <= 50 ? v : 5; };
export const fijarColchonPct = (v) => guardar("colchonPct", v);
const marcas = () => leer("mesReal", {});
export function marcarPagado(clave, concepto, monto) {
  const m = marcas(); m[clave] = m[clave] || {};
  if (monto > 0) m[clave][concepto] = { monto, cuando: Date.now() }; else delete m[clave][concepto];
  guardar("mesReal", m);
}
export function usarColchon(clave, monto) {
  const m = marcas(); m[clave] = m[clave] || {};
  m[clave]._colchonUsado = Math.max(0, monto);
  guardar("mesReal", m);
}

// Neto y talón del recibo que paga este período (la hoja MES guarda «neto $X − talón $Y»).
function recibo(clave) {
  const r = (datosFinanzas()?.meses || []).find((x) => x.mes === clave);
  if (!r) return null;
  const n = /neto \$\s?([\d.]+)/i.exec(r.fuente || ""), t = /tal[oó]n \$\s?([\d.]+)/i.exec(r.fuente || "");
  const num = (x) => x ? Number(x[1].replace(/\./g, "")) : null;
  return { neto: num(n), talon: num(t), texto: (r.fuente || "").split(":")[0] };
}

export function mesReal(p, pendientes = []) {
  const eco = datosEconomia();
  const col = eco && String(eco.anio) === String(p.col.anio) ? eco.meses[p.col.mes] : null;
  if (!col) return null;
  const mis = marcas()[p.clave] || {};
  const prevClave = (() => { const [y, m] = p.clave.split("-").map(Number); const d = new Date(y, m - 2, 1); return d.getFullYear() + "-" + dos(d.getMonth() + 1); })();
  const prev = marcas()[prevClave] || {};
  const rec = recibo(p.clave);
  const div = eco?.division?.actual?.items || [];
  const movs = (datosFinanzas()?.movs || []).filter((m) => m.ts >= p.inicio.getTime() && m.ts < p.fin.getTime() + 86400000 && m.moneda !== "USD" && m.clase !== "ingreso");
  const deudas = datosFinanzas()?.deudas || [];
  const sus = Object.values(leer("susCobros", {})).filter((c) => c.col === p.clave).reduce((s, c) => s + c.ars, 0);
  const fmt = (n) => "$ " + Math.round(n).toLocaleString("es-AR");

  // Todos los conceptos de Egresos, aunque este mes en tu planilla estén vacíos (si hay un número real, aparece).
  const lista = col.todos || col.egresos;
  const filas = lista.map(({ concepto, monto: plan }) => {
    const n = normal(concepto), ws = palabras(concepto);
    const f = { concepto, plan, real: null, estado: "estimado", fuente: "", nota: "" };
    if (mis[concepto]) return { ...f, real: mis[concepto].monto, estado: "pagado", fuente: "lo marcaste vos" };
    // Préstamo y lo que se descuenta del recibo (tu planilla lo llama «PP + Gym»).
    if (/\bpp\b|prestamo|talon/.test(n) && rec?.talon) return { ...f, real: rec.talon, estado: "pagado", fuente: "talón del recibo" };
    if (/suscrip/.test(n) && sus) return { ...f, real: sus, estado: "pagado", fuente: "tus suscripciones" };
    // Tarjetas: lo que pagaste del resumen; si todavía no, queda tu plan y se muestra el resumen.
    if (/master|visa|tarjeta/.test(n)) {
      const pago = movs.filter((m) => m.clase === "tarjeta" && ws.some((w) => normal(m.contra).includes(w))).reduce((s, m) => s + (m.monto || 0), 0);
      const d = deudas.find((x) => ws.some((w) => normal(x.nombre).includes(w)));
      if (pago) return { ...f, real: pago, estado: "pagado", fuente: "pago del resumen (mails)" };
      return { ...f, real: plan, estado: "por pagar", plan_: true, fuente: "lo que pensás pagar", nota: d ? `resumen: total ${fmt(d.saldo || 0)}${d.cuota ? " · mínimo " + fmt(d.cuota) : ""}` : "" };
    }
    // Lo compartido con Agus: tu mitad, con el monto real de la hoja DIVISIÓN.
    const d = div.find((x) => { const nx = normal(x.concepto); return nx === n || ws.some((w) => nx.includes(w)); });
    if (d && d.monto) return { ...f, real: d.monto / 2, estado: "por pagar", fuente: "DIVISIÓN (tu mitad)", nota: "total " + fmt(d.monto), compartido: true };
    // Un pago que Orbe vio en tus mails este período.
    const pagos = movs.filter((m) => ws.length && ws.some((w) => normal(m.contra).includes(w)));
    if (pagos.length) return { ...f, real: pagos.reduce((s, m) => s + (m.monto || 0), 0), estado: "pagado", fuente: pagos[0].fuente || "tus mails" };
    // El aviso de vencimiento (calendario o mails).
    const av = pendientes.find((x) => x.monto && ws.some((w) => normal(x.titulo).includes(w)));
    if (av) { const v = Number(String(av.monto).replace(/[^\d,]/g, "").replace(",", ".")); if (v) return { ...f, real: v, estado: "por pagar", fuente: av.fuente || "aviso de vencimiento" }; }
    // Sin nada todavía: el del mes pasado o tu plan, como estimado.
    if (prev[concepto]) return { ...f, real: prev[concepto].monto, fuente: "el del mes pasado" };
    return { ...f, real: plan, fuente: "tu planilla" };
  }).filter((f) => f.real || f.plan);
  const ingreso = rec?.neto ? { monto: rec.neto, estado: "real", fuente: rec.texto || "recibo" } : col.ingresos ? { monto: col.ingresos, estado: "estimado", fuente: "tu planilla" } : null;
  const totalReal = filas.reduce((s, f) => s + (f.real || 0), 0);
  const totalPlan = filas.reduce((s, f) => s + (f.plan || 0), 0);
  const pct = colchonPct();
  const colchon = ingreso ? Math.round(ingreso.monto * pct / 100) : 0;
  const usado = Math.min(colchon, mis._colchonUsado || 0);
  return { p, filas, ingreso, totalReal, totalPlan, planIngreso: col.ingresos, colchon, pct, usado,
    estimados: filas.filter((f) => f.estado === "estimado" || f.plan_).length };
}
