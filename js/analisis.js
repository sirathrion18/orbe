// Análisis económico: tu historia con la plata, desde el extracto más viejo.
// Orbe lee los PDF de tus carpetas de Drive (extractos de la caja de ahorro del BNA y resúmenes de tarjeta), arma una
// fila por movimiento en la hoja HISTORICO de tu planilla y con eso dibuja los gráficos. Lo nuevo que subas se suma solo.
import { leer, guardar } from "./almacen.js";
import { leerRangos, agregar, escribirVarios } from "./hoja.js";
import { api, pedirPase } from "./google.js";
import { rubroDe } from "./rubros.js";

export const HOJAS_ANALISIS = {
  HISTORICO: { cab: ["fecha", "cuenta", "concepto", "monto", "saldo", "categoria", "archivo"], filas: [] }
};
const DRIVE = "https://www.googleapis.com/drive/v3/files";
const num = (t) => Number(String(t).replace(/\./g, "").replace(",", "."));
const dos = (n) => String(n).padStart(2, "0");

// ---------- Leer PDFs (pdf.js, el mismo de los recibos) ----------
let cargando = null;
function pdfjs() {
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  if (cargando) return cargando;
  cargando = new Promise((ok, mal) => {
    const s = document.createElement("script");
    s.src = "vendor/pdfjs/pdf.min.js";
    s.onload = () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = "vendor/pdfjs/pdf.worker.min.js"; ok(window.pdfjsLib); };
    s.onerror = () => mal(new Error("pdfjs"));
    document.head.appendChild(s);
  });
  return cargando;
}
// Renglones: los pedazos de texto que comparten altura en la página, ordenados de izquierda a derecha.
export async function renglonesPdf(buffer) {
  const lib = await pdfjs();
  const doc = await lib.getDocument({ data: buffer, isEvalSupported: false }).promise;
  const out = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const p = await doc.getPage(i);
    const items = (await p.getTextContent()).items.filter((x) => x.str.trim());
    const filas = [];
    items.forEach((x) => {
      const y = x.transform[5], xx = x.transform[4];
      let f = filas.find((r) => Math.abs(r.y - y) < 2.5);
      if (!f) { f = { y, partes: [] }; filas.push(f); }
      f.partes.push({ x: xx, t: x.str.trim() });
    });
    filas.sort((a, b) => b.y - a.y).forEach((f) => out.push(f.partes.sort((a, b) => a.x - b.x).map((p) => p.t).join(" ").replace(/\s+/g, " ")));
  }
  return out;
}

// ---------- Extracto de la caja de ahorro ----------
// Cada renglón: fecha, concepto, (comprobante), importe y saldo. Si es débito o crédito sale de cómo cambia el saldo,
// y la cadena de saldos sirve de control: si un importe no cierra con el saldo, el extracto queda marcado.
export function leerExtracto(lineas) {
  const movs = [];
  // El CUIT del titular sale del propio extracto (no del banco): las transferencias con ese CUIT son pases entre tus cuentas.
  const cuits = lineas.join(" ").match(/CUIT:?\s*(\d{11})/g) || [];
  const tuyo = (cuits.map((c) => c.replace(/\D/g, "")).find((c) => !c.startsWith("30")) || "");
  let saldo = null, inicial = null, final = null, errores = 0;
  for (const l of lineas) {
    let m = /SALDO ANTERIOR\s+(-?[\d.]+,\d{2})/.exec(l);
    if (m && saldo === null) { saldo = num(m[1]); inicial = saldo; continue; }
    m = /SALDO FINAL\s+(-?[\d.]+,\d{2})/.exec(l);
    if (m) { final = num(m[1]); continue; }
    m = /^(\d{2})\/(\d{2})\/(\d{2})\s+(.+?)\s+(-?[\d.]+,\d{2})\s+(-?[\d.]+,\d{2})$/.exec(l);
    if (!m) continue;
    const importe = num(m[5]), nuevo = num(m[6]);
    const concepto = m[4].replace(/\s+\d{1,6}$/, "").replace(/\s+0$/, "").trim();
    let monto = saldo === null ? importe : Math.round((nuevo - saldo) * 100) / 100;
    if (saldo !== null && Math.abs(Math.abs(monto) - importe) > 0.02) { errores++; monto = importe * (nuevo < saldo ? -1 : 1); }
    movs.push({ fecha: "20" + m[3] + "-" + m[2] + "-" + m[1], concepto, monto, saldo: nuevo, categoria: categoriaCuenta(concepto, monto, tuyo) });
    saldo = nuevo;
  }
  const cierra = final === null || saldo === null || Math.abs(final - saldo) < 0.02;
  return { movs, inicial, final, cierra: cierra && !errores, errores };
}
export function categoriaCuenta(c, monto, cuit = "") {
  const t = c.toUpperCase();
  if (/ACRED\. DE HABERES/.test(t)) return "Sueldo";
  if (/DESC\.COMPLEMENTARIOS|DESC\. COMPLEMENTARIOS/.test(t)) return "Descuento complementario";
  if (/EMOVA|SUBE|SUBT/.test(t)) return "Transporte";
  if (/PROMOCION MODO|REINTEGRO|DEVOLUCION/.test(t)) return "Promos y reintegros";
  if (/RENDIMIENTO|INTERESES CAPITALIZADOS/.test(t)) return "Rendimientos";
  if (/PAGO TARJETA/.test(t)) return "Pago de tarjeta";
  if (/EXTRACC|EXTRAC\./.test(t)) return "Efectivo";
  if (/FCI|PLAZO FIJO/.test(t)) return "Inversión";
  if (cuit && t.includes(cuit)) return "Pase propio";
  if (/TRANSF|DEBIN|LINK/.test(t)) return monto < 0 ? "Transferencia enviada" : "Transferencia recibida";
  if (/COMPRA|MAESTRO|DEBITO/.test(t)) return rubroDe(c) || "Compras con débito";
  if (/IMPUESTO|LEY 25413|IVA|COMISION/.test(t)) return "Impuestos y comisiones";
  return monto < 0 ? "Otros gastos" : "Otros ingresos";
}

// ---------- Resumen de tarjeta ----------
const MES3 = { ENE: 1, FEB: 2, MAR: 3, ABR: 4, MAY: 5, JUN: 6, JUL: 7, AGO: 8, SET: 9, SEP: 9, OCT: 10, NOV: 11, DIC: 12 };
export function leerResumenTarjeta(lineas, nombre) {
  const cuenta = /visa/i.test(nombre + lineas.slice(0, 15).join(" ")) ? "Visa" : "Mastercard";
  const movs = [];
  const re1 = /(\d{2})\.(\d{2})\.(\d{2})\s+(?:\d{6}\s+)?(.+?)\s+(-?[\d.]+,\d{2})\s+(-?[\d.]+,\d{2})(?=\s+\d{2}\.\d{2}\.\d{2}\s|\s*$)/g;
  const re2 = /(\d{2})-([A-Za-z]{3})-(\d{2})\s+(?:\d{4,6}\s+)?(.+?)\s+(-?[\d.]+,\d{2})(?:\s+(-?[\d.]+,\d{2}))?(?=\s+\d{2}-[A-Za-z]{3}-\d{2}\s|\s*$)/g;
  for (const l of lineas) {
    let m;
    re1.lastIndex = 0;
    while ((m = re1.exec(l))) movs.push(tarj(cuenta, "20" + m[3] + "-" + m[2] + "-" + m[1], m[4], num(m[5]), num(m[6])));
    re2.lastIndex = 0;
    while ((m = re2.exec(l))) { const mm = MES3[m[2].toUpperCase()]; if (mm) movs.push(tarj(cuenta, "20" + m[3] + "-" + dos(mm) + "-" + m[1], m[4], num(m[5]), m[6] ? num(m[6]) : 0)); }
  }
  return { movs: movs.filter(Boolean), cuenta };
}
function tarj(cuenta, fecha, concepto, pesos, dolar) {
  const c = concepto.trim();
  if (/SU PAGO|PAGO EN PESOS|PAGO EN DOLARES/i.test(c)) return { fecha, concepto: c, monto: Math.abs(pesos), saldo: "", categoria: "Pago del resumen", cuenta };
  const cat = /COM ADM|IVA|IMPUESTO|SELLOS|PERCEP/i.test(c) ? "Impuestos y comisiones" : /INTERES/i.test(c) ? "Intereses de tarjeta" : rubroDe(c.replace(/^MERPAGO\*/i, "")) || "Otros";
  return { fecha, concepto: c + (dolar ? ` (US$ ${dolar})` : ""), monto: -Math.abs(pesos), saldo: "", categoria: cat, cuenta };
}

// ---------- Traer todo de Drive y guardarlo en HISTORICO ----------
export const datosHist = () => leer("historico");
export async function leerHistorico() {
  const [f] = await leerRangos(["HISTORICO!A2:G"]);
  const h = { cuando: Date.now(), movs: f.map((r, i) => ({ fecha: String(r[0] || "").slice(0, 10), cuenta: String(r[1] || ""), concepto: String(r[2] || ""),
    monto: Number(r[3]) || 0, saldo: r[4] === "" || r[4] == null ? null : Number(r[4]), categoria: String(r[5] || ""), archivo: String(r[6] || ""), fila: i + 2 }))
    .filter((m) => /^\d{4}-\d{2}-\d{2}$/.test(m.fecha)) };
  guardar("historico", h, true);
  return h;
}

export async function importarHistorico(avance = () => {}) {
  const q = (s) => DRIVE + "?fields=files(id,name,modifiedTime)&pageSize=200&q=" + encodeURIComponent(s);
  const carpetas = ((await api(q("mimeType = 'application/vnd.google-apps.folder' and trashed = false and (name contains 'EXTRACTOS' or name contains 'RESUMENES TC')"))).files || []);
  const h = datosHist() || await leerHistorico();
  const leidos = new Set(h.movs.map((m) => m.archivo));
  const res = { archivos: 0, filas: 0, noCierran: [], omitidos: 0 };
  for (const c of carpetas) {
    const tarjeta = /RESUMEN/i.test(c.name);
    const pdfs = (await api(q(`'${c.id}' in parents and mimeType = 'application/pdf' and trashed = false`))).files || [];
    for (const f of pdfs) {
      const clave = f.name + " · " + f.id.slice(0, 6);
      if (leidos.has(clave)) { res.omitidos++; continue; }
      avance(`Leyendo ${f.name}…`);
      const r = await fetch(DRIVE + "/" + f.id + "?alt=media", { headers: { Authorization: "Bearer " + await pedirPase() } });
      if (!r.ok) continue;
      const lineas = await renglonesPdf(new Uint8Array(await r.arrayBuffer()));
      const filas = [];
      if (tarjeta) {
        const t = leerResumenTarjeta(lineas, f.name);
        t.movs.forEach((m) => filas.push([m.fecha, m.cuenta, m.concepto, m.monto, "", m.categoria, clave]));
      } else {
        const x = leerExtracto(lineas);
        if (!x.cierra) res.noCierran.push(f.name);
        x.movs.forEach((m) => filas.push([m.fecha, "Caja de ahorro BNA", m.concepto, m.monto, m.saldo, m.categoria, clave]));
      }
      if (filas.length) { await agregar("HISTORICO!A:G", filas); res.filas += filas.length; }
      res.archivos++;
    }
  }
  guardar("historicoImport", { cuando: Date.now(), ...res }, true);
  await leerHistorico();
  return res;
}

// Reclasificar un movimiento (ej. a dónde fue una transferencia grande).
export async function reclasificar(indice, categoria) {
  const h = datosHist();
  const m = h?.movs[indice];
  if (!m) return;
  await escribirVarios([{ range: "HISTORICO!F" + m.fila, values: [[categoria]] }]);
  return leerHistorico();
}

// ---------- Cuentas para los gráficos ----------
const mesDe = (f) => f.slice(0, 7);
export function analisis(h = datosHist()) {
  const movs = h?.movs || [];
  if (!movs.length) return null;
  const meses = [...new Set(movs.map((m) => mesDe(m.fecha)))].sort();
  const porMes = (filtro, valor = (m) => m.monto) => Object.fromEntries(meses.map((mes) => [mes, movs.filter((m) => mesDe(m.fecha) === mes && filtro(m)).reduce((s, m) => s + valor(m), 0)]));
  const sueldo = porMes((m) => m.categoria === "Sueldo");
  const descuentos = porMes((m) => m.categoria === "Descuento complementario", (m) => -m.monto);
  const promos = porMes((m) => m.categoria === "Promos y reintegros" || m.categoria === "Rendimientos");
  // Saldo de la caja de ahorro al cierre de cada mes: el último saldo del mes.
  const saldo = {};
  movs.filter((m) => m.cuenta === "Caja de ahorro BNA" && m.saldo != null).sort((a, b) => a.fecha.localeCompare(b.fecha)).forEach((m) => { saldo[mesDe(m.fecha)] = m.saldo; });
  // Gasto por rubro: compras con tarjeta y con débito, efectivo y transporte (sin pagos de tarjeta ni pases propios).
  const NO = ["Sueldo", "Descuento complementario", "Pago de tarjeta", "Pago del resumen", "Pase propio", "Promos y reintegros", "Rendimientos", "Inversión", "Transferencia recibida", "Otros ingresos"];
  const gastos = movs.filter((m) => m.monto < 0 && !NO.includes(m.categoria));
  const rubrosTot = {};
  gastos.forEach((m) => { rubrosTot[m.categoria] = (rubrosTot[m.categoria] || 0) - m.monto; });
  const top = Object.entries(rubrosTot).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([r]) => r);
  const rubros = meses.map((mes) => {
    const o = { mes };
    gastos.filter((m) => mesDe(m.fecha) === mes).forEach((m) => { const r = top.includes(m.categoria) ? m.categoria : "Resto"; o[r] = (o[r] || 0) - m.monto; });
    return o;
  });
  // Transferencias grandes sin destino: las pregunta una vez.
  const grandes = movs.map((m, i) => ({ ...m, i })).filter((m) => m.categoria === "Transferencia enviada" && m.monto <= -300000);
  return { meses, sueldo, descuentos, promos, saldo, rubros, top: [...top, "Resto"], grandes, desde: meses[0], hasta: meses[meses.length - 1], total: movs.length };
}
