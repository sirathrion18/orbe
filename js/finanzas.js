// Finanzas: lee y escribe la planilla, trae los mails nuevos a través del servidor y arma la cuenta del mes.
import { leer, guardar } from "./almacen.js";
import { leerRangos, agregar, escribir, idHoja } from "./hoja.js";
import { servidor, permisos } from "./google.js";
import { fusionar } from "./movimientos.js";
import { rubroDe } from "./rubros.js";

const COLS = ["id", "fecha", "ts", "clase", "tipo", "monto", "moneda", "contra", "medio", "rubro", "mitad", "fuente", "revisar", "nota", "grupo", "eco"];
const si = (v) => /^(s[ií]|si|true|1|x)$/i.test(String(v ?? "").trim());
const num = (v) => { if (typeof v === "number") return v; const n = Number(String(v ?? "").replace(/\./g, "").replace(",", ".")); return Number.isFinite(n) ? n : null; };
const isoDia = (ts) => { const d = new Date(ts); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
export const mesDe = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");

export const datosFinanzas = () => leer("finanzas");

function aMov(f, i) {
  const o = Object.fromEntries(COLS.map((c, j) => [c, f[j] ?? ""]));
  return { ...o, fila: i + 2, ts: Number(o.ts) || 0, monto: num(o.monto), mitad: si(o.mitad), revisar: si(o.revisar), eco: si(o.eco) };
}
const aFila = (m) => COLS.map((c) => c === "mitad" || c === "revisar" || c === "eco" ? (m[c] ? "sí" : "") : c === "fecha" ? isoDia(m.ts) : m[c] ?? "");

// ---------- Leer la planilla ----------
export async function leerPlanilla() {
  const [movs, reglas, topes, meses, deudas] = await leerRangos(["MOVIMIENTOS!A2:P", "REGLAS!A2:E", "TOPES!A2:C", "MES!A2:C", "DEUDAS!A2:J"]);
  const previo = leer("finanzas", {});
  const fin = {
    cuando: Date.now(), ultimoMail: previo.ultimoMail || 0,
    movs: movs.map(aMov).filter((m) => m.id),
    reglas: reglas.filter((r) => r[0]).map((r, i) => ({ contiene: String(r[0]), rubro: r[1] || "", clase: r[2] || "", mitad: si(r[3]), fila: i + 2 })),
    topes: topes.filter((t) => t[0] && num(t[1])).map((t) => ({ rubro: String(t[0]), tope: num(t[1]), nota: t[2] || "" })),
    meses: meses.filter((m) => m[0]).map((m) => ({ mes: String(m[0]).slice(0, 7), disponible: num(m[1]), fuente: m[2] || "" })),
    deudas: deudas.filter((d) => d[0]).map((d) => ({ nombre: d[0], tipo: d[1], saldo: num(d[2]), cuota: num(d[3]), tasa: num(d[4]),
      cuotas: d[5], vence: d[6], al: d[7], fuente: d[8], nota: d[9] }))
  };
  guardar("finanzas", fin, true);
  return fin;
}

// ---------- Clasificar ----------
export function clasificar(m, reglas) {
  const texto = (m.contra + " " + m.medio).toLowerCase();
  const r = reglas.find((x) => texto.includes(x.contiene.toLowerCase()));
  const out = { ...m };
  if (r) {
    if (r.clase) out.clase = r.clase;
    if (r.rubro) out.rubro = r.rubro;
    out.mitad = r.mitad;
    out.revisar = false;
  }
  if ((out.clase === "gasto" || out.clase === "gasto-tarjeta" || out.clase === "devolucion") && !out.rubro) {
    out.rubro = rubroDe(out.contra) || "Otros";
    if (out.rubro === "Otros" && !r) out.revisar = true;
  }
  return out;
}

// ---------- Traer mails nuevos ----------
const SEIS_MESES = 182 * 86400000;
// De a tandas chicas, guardando lo avanzado después de cada una: si Gmail pide pausa, se sigue la próxima vez desde ahí.
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
export async function traerMails() {
  if (!permisos().gmail) return { nuevos: 0 };
  let fin = await leerPlanilla();
  let desde = fin.ultimoMail || Date.now() - SEIS_MESES;
  let total = 0, frenado = false, quedan = 0;
  for (let vuelta = 0; vuelta < 6; vuelta++) {
    if (vuelta) await espera(2500);
    const r = await servidor("/api/finanzas", { desde });
    const aceptados = fusionar(fin.movs, r.movimientos).map((m) => clasificar({ ...m, mitad: false, nota: m.nota || "", grupo: m.grupo || "" }, fin.reglas));
    if (aceptados.length) { await agregar("MOVIMIENTOS!A:P", aceptados.map(aFila)); fin.movs.push(...aceptados); total += aceptados.length; }
    if (r.ultimo > desde) { desde = r.ultimo; fin.ultimoMail = desde; guardar("finanzas", fin, true); }
    frenado = !!r.frenado; quedan = r.quedan || 0;
    if (frenado || !quedan) break;
  }
  fin = await leerPlanilla();
  fin.ultimoMail = desde; fin.mailsPendientes = frenado || quedan > 0;
  guardar("finanzas", fin, true);
  return { nuevos: total, frenado, quedan };
}

// ---------- Corregir un movimiento (y aprender la regla) ----------
export async function corregir(id, cambios, aprender) {
  const fin = leer("finanzas");
  const m = fin.movs.find((x) => x.id === id);
  if (!m) return;
  const nuevo = { ...m, ...cambios, revisar: false };
  await escribir("MOVIMIENTOS!A" + m.fila + ":P" + m.fila, [aFila(nuevo)]);
  if (aprender && m.contra && !/^(rappi|uber|propina)/i.test(m.contra)) {
    const clave = m.contra.replace(/\s*\(.*\)\s*$/, "").replace(/,? cuota.*$/i, "").trim();
    if (clave.length >= 3 && !fin.reglas.some((r) => r.contiene.toLowerCase() === clave.toLowerCase())) {
      await agregar("REGLAS!A:E", [[clave, nuevo.rubro || "", nuevo.clase || "", nuevo.mitad ? "sí" : "", "Aprendida al corregir en Orbe"]]);
    }
  }
  return leerPlanilla();
}

// ---------- La cuenta del mes ----------
// "Te queda" = disponible − lo que salió de tus cuentas (gastos, cuotas, pagos de tarjeta, ahorro).
// Las compras con tarjeta cuentan en su rubro el día que comprás, y en lo que te queda cuando pagás la tarjeta.
export function resumenMes(fin, fecha) {
  if (!fin) return null;
  const mes = mesDe(fecha);
  const delMes = fin.movs.filter((m) => m.ts && mesDe(new Date(m.ts)) === mes && m.moneda !== "USD");
  const parte = (m) => (m.monto || 0) * (m.mitad ? 0.5 : 1);
  const registro = fin.meses.find((x) => x.mes === mes);
  const anterior = [...fin.meses].filter((x) => x.mes < mes).sort((a, b) => b.mes.localeCompare(a.mes))[0];
  const base = registro || anterior || null;
  const salio = delMes.filter((m) => ["gasto", "tarjeta", "deuda", "ahorro"].includes(m.clase)).reduce((s, m) => s + parte(m), 0)
    - delMes.filter((m) => m.clase === "devolucion" && !/tarjeta|mastercard|visa/i.test(m.medio)).reduce((s, m) => s + parte(m), 0);
  const porRubro = {};
  delMes.forEach((m) => {
    if (m.clase === "gasto" || m.clase === "gasto-tarjeta") porRubro[m.rubro || "Otros"] = (porRubro[m.rubro || "Otros"] || 0) + parte(m);
    if (m.clase === "devolucion") porRubro[m.rubro || "Otros"] = (porRubro[m.rubro || "Otros"] || 0) - parte(m);
  });
  const topes = fin.topes.map((t) => ({ ...t, gastado: Math.max(0, porRubro[t.rubro] || 0), pct: (porRubro[t.rubro] || 0) / t.tope }));
  const finMes = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0).getDate();
  return {
    mes, base, propio: !!registro, disponible: base ? base.disponible : null,
    salio, queda: base ? base.disponible - salio : null,
    usado: base && base.disponible ? Math.min(1, Math.max(0, salio / base.disponible)) : 0,
    porRubro: Object.entries(porRubro).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]),
    topes, alertas: topes.filter((t) => t.pct >= 0.8).sort((a, b) => b.pct - a.pct),
    revisar: fin.movs.filter((m) => m.revisar),
    movs: delMes.sort((a, b) => b.ts - a.ts),
    usd: fin.movs.filter((m) => m.moneda === "USD" && m.ts && mesDe(new Date(m.ts)) === mes),
    diasRestantes: finMes - fecha.getDate(),
    deudas: fin.deudas
  };
}

export const hayPlanilla = () => !!idHoja();
