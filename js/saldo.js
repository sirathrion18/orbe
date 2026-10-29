// Tu plata real contra lo que ve Orbe.
// Cada tanto le decís cuánto tenés (BNA, Mercado Pago, Personal Pay, efectivo, otra). Orbe toma la vez anterior,
// le suma lo que vio entrar y le resta lo que vio salir de tus cuentas; la diferencia con lo que tenés de verdad
// es lo que se le escapó (casi siempre, pagos de Mercado Pago sin mail o efectivo sin anotar).
// Las compras con tarjeta de crédito no cuentan acá: salen de la cuenta cuando pagás el resumen.
import { leer, guardar } from "./almacen.js";
import { datosFinanzas } from "./finanzas.js";

export const CUENTAS = [["bna", "BNA"], ["mp", "Mercado Pago"], ["pp", "Personal Pay"], ["efectivo", "Efectivo"], ["otra", "Otra"]];
export const datosSaldo = () => leer("saldos", { controles: [] });

const SALE = ["gasto", "tarjeta", "deuda", "ahorro"];
const ENTRA = ["ingreso"];
// Un movimiento cuenta una sola vez: el mail que se unió con lo que anotaste (o con el celu) no se repite.
const vale = (m) => m && m.ts && m.moneda !== "USD" && m.diario !== "dup";

export function flujo(desde, hasta, movs = datosFinanzas()?.movs || []) {
  let entra = 0, sale = 0, n = 0;
  for (const m of movs) {
    if (!vale(m) || m.ts <= desde || m.ts > hasta) continue;
    if (SALE.includes(m.clase)) { sale += m.monto || 0; n++; }
    else if (ENTRA.includes(m.clase)) { entra += m.monto || 0; n++; }
    else if (m.clase === "devolucion" && !/tarjeta|mastercard|visa/i.test(m.medio || "")) { entra += m.monto || 0; n++; }
  }
  return { entra, sale, n };
}

const total = (c) => Object.values(c.cuentas || {}).reduce((s, v) => s + (Number(v) || 0), 0);

// La comparación del último control contra el anterior (o null si es el primero).
export function discrepancia(d = datosSaldo()) {
  const cs = d.controles || [];
  if (cs.length < 2) return null;
  const ant = cs[cs.length - 2], ult = cs[cs.length - 1];
  const f = flujo(ant.ts, ult.ts);
  const esperado = total(ant) + f.entra - f.sale;
  const real = total(ult);
  return { ant, ult, esperado, real, dif: real - esperado, ...f, resuelto: ult.resuelto || null };
}

export function anotarSaldo(cuentas, ahora = Date.now()) {
  const d = datosSaldo();
  const limpio = Object.fromEntries(CUENTAS.map(([k]) => [k, Math.round((Number(cuentas[k]) || 0) * 100) / 100]).filter(([, v]) => v));
  d.controles = [...(d.controles || []), { ts: ahora, cuentas: limpio }].slice(-24);
  guardar("saldos", d);
  return discrepancia(d);
}

export function resolverDiferencia(como) {
  const d = datosSaldo();
  const ult = d.controles?.[d.controles.length - 1];
  if (!ult) return;
  ult.resuelto = como ? { como, cuando: Date.now() } : null;
  guardar("saldos", d);
}

// Último control: para sugerir uno nuevo si pasó una semana.
export function ultimoControl() {
  const cs = datosSaldo().controles || [];
  return cs.length ? cs[cs.length - 1] : null;
}
export { total as totalControl };
