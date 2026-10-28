// Suscripciones recurrentes (en dólares o en pesos), con su renovación y un aviso en Urgente unos días antes.
// Los datos los cargás vos en Finanzas y se guardan en tu planilla (sincronizados), nunca en el código.
import { leer, guardar } from "./almacen.js";
import { api } from "./google.js";
import { idEconomia, MESES_AR } from "./economia.js";
import { periodo } from "./presupuesto.js";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const CLAVE = "suscripciones";
export const todas = () => leer(CLAVE, []);
const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

const iso = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const deIso = (t) => { const [y, m, d] = String(t).split("-").map(Number); return new Date(y, m - 1, d, 12); };
const fechaTxt = (d) => DIAS[d.getDay()].slice(0, 3) + " " + d.getDate() + "/" + (d.getMonth() + 1);

// La próxima renovación desde hoy: si la fecha cargada ya pasó, avanza de a un mes (mismo día, o el último del mes).
export function proxima(s, hoy = new Date()) {
  const base = deIso(s.renueva);
  const h = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 12);
  let d = new Date(base), k = 0;
  while (d < h && k < 240) {
    k++;
    const y = base.getFullYear(), m = base.getMonth() + k;
    const ultimo = new Date(y, m + 1, 0).getDate();
    d = new Date(y, m, Math.min(base.getDate(), ultimo), 12);
  }
  return d;
}

export function guardarSuscripcion(d, id) {
  const l = todas();
  const s = {
    id: id || Date.now().toString(36),
    nombre: String(d.nombre || "").trim(),
    monto: Number(String(d.monto || "").replace(/\./g, "").replace(",", ".")) || 0,
    moneda: d.moneda === "ARS" ? "ARS" : "USD",
    renueva: d.renueva,
    avisar: Math.max(1, Math.min(14, Number(d.avisar) || 3)),
    impacto: String(d.impacto || "").trim(),
    nota: String(d.nota || "").trim()
  };
  if (!s.nombre || !/^\d{4}-\d{2}-\d{2}$/.test(s.renueva || "")) return null;
  const i = l.findIndex((x) => x.id === s.id);
  s.desde = (i >= 0 && l[i].desde) || iso(new Date());
  if (i >= 0) l[i] = s; else l.push(s);
  guardar(CLAVE, l);
  return s;
}
export const borrarSuscripcion = (id) => guardar(CLAVE, todas().filter((s) => s.id !== id));

const montoTxt = (s) => (s.moneda === "USD" ? "US$ " : "$ ") + s.monto.toLocaleString("es-AR");
// En pesos, con el dólar tarjeta de hoy (dolarapi.com, ya con los impuestos de tarjeta). Si no hay cotización, no se estima.
function enPesos(s) {
  if (s.moneda !== "USD") return "";
  const t = leer("dolar")?.tarjeta?.venta;
  return t ? "≈ $ " + Math.round(s.monto * t).toLocaleString("es-AR") + " con el dólar tarjeta de hoy" : "";
}

// Para Urgente: aparece «avisar» días antes de la renovación. La fecha límite es el día anterior,
// porque para cambiar o cancelar hay que hacerlo al menos 24 h antes.
export function pendientesDeSuscripciones(hoy = new Date()) {
  return todas().map((s) => {
    const r = proxima(s, hoy);
    const limite = new Date(r); limite.setDate(r.getDate() - 1);
    const desde = new Date(r); desde.setDate(r.getDate() - s.avisar);
    const h = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 12);
    if (h < desde || h > limite) return null;
    return {
      titulo: "Revisar " + s.nombre + " antes de que renueve", tipo: "vencimiento", universo: "finanzas", ruta: "#/u/finanzas",
      fecha: iso(limite), monto: montoTxt(s) + (s.moneda === "USD" ? " + impuestos" : ""),
      nota: [("Renueva el " + fechaTxt(r) + "."), s.nota].filter(Boolean).join(" "),
      impacto: s.impacto, fuente: "Tus suscripciones en Finanzas",
      clave: ("sus|" + s.id + "|" + iso(r)).toLowerCase()
    };
  }).filter(Boolean);
}

// ---------- Finanzas ----------
export function bloqueSuscripciones(hoy = new Date()) {
  const l = todas();
  const filas = l.map((s) => {
    const r = proxima(s, hoy);
    const dias = Math.round((r - new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 12)) / 86400000);
    const pesos = enPesos(s);
    return `<li><button class="sus-fila" data-accion="sus-editar" data-id="${esc(s.id)}">
      <span class="sus-izq"><b>${esc(s.nombre)}</b><small>Renueva el ${fechaTxt(r)}${dias <= 7 ? ` · <em>en ${dias === 0 ? "hoy" : dias === 1 ? "1 día" : dias + " días"}</em>` : ""}</small>${pesos ? `<small>${pesos}</small>` : ""}</span>
      <span class="sus-der"><b>${montoTxt(s)}</b><small>por mes${s.moneda === "USD" ? " + impuestos" : ""}</small></span></button></li>`;
  }).join("");
  return `<section class="bloque sus"><h2>Suscripciones</h2>
    ${l.length ? `<ul class="sus-lista">${filas}</ul>` : '<p class="vacio">Cargá lo que se renueva solo cada mes (como Claude o Spotify) y Orbe te avisa en Urgente unos días antes.</p>'}
    <div class="chips" style="margin-top:12px"><button class="chip" data-accion="sus-editar" data-id="">+ Suscripción</button></div>
    ${l.some((s) => s.moneda === "USD") && !leer("dolar")?.tarjeta ? '<p class="fuente-dato">El equivalente en pesos aparece cuando Orbe lee el dólar tarjeta.</p>' : ""}
    ${leer("ecoSusNo") ? "" : bloqueEconomiaSus()}</section>`;
}

export function hojaSuscripcion(id) {
  const s = todas().find((x) => x.id === id) || { nombre: "", monto: "", moneda: "USD", renueva: "", avisar: 3, impacto: "", nota: "" };
  const campo = (n, et, v, extra = "") => `<label class="campo-sus"><span>${et}</span><input name="${n}" value="${esc(v)}" ${extra}></label>`;
  return `<h2>${id ? esc(s.nombre) : "Nueva suscripción"}</h2>
    <form data-form="sus" data-id="${esc(id || "")}">
      ${campo("nombre", "Nombre", s.nombre, 'placeholder="Claude Max" required autocomplete="off"')}
      ${campo("monto", "Monto por mes", s.monto || "", 'inputmode="decimal" placeholder="100" required')}
        <div class="grupo" style="margin-top:12px"><span>Moneda</span><div class="chips">${[["USD", "Dólares"], ["ARS", "Pesos"]].map(([k, n]) => `<label class="chip ${s.moneda === k ? "on" : ""}"><input type="radio" class="sr" name="moneda" value="${k}" ${s.moneda === k ? "checked" : ""}>${n}</label>`).join("")}</div></div>
      <div class="sus-dos">${campo("renueva", "Próxima renovación", s.renueva, 'type="date" required')}${campo("avisar", "Avisar días antes", s.avisar, 'type="number" min="1" max="14"')}</div>
      ${campo("impacto", "Si no lo revisás… (opcional)", s.impacto, 'placeholder="te cobran otro mes"')}
      <label class="campo-sus"><span>Nota (opcional)</span><textarea name="nota" class="campo-texto" style="height:84px" placeholder="Cómo se cambia o se cancela">${esc(s.nota)}</textarea></label>
      <div class="grupo" style="display:flex;gap:10px">${id ? `<button type="button" class="btn sec" data-accion="sus-borrar" data-id="${esc(id)}" style="flex:1">Borrar</button>` : `<button type="button" class="btn sec" data-accion="cerrar-hoja" style="flex:1">Cancelar</button>`}<button class="btn" style="flex:2">Guardar</button></div>
    </form>`;
}

// ---------- Cobros y ECONOMÍA ----------
// El día que renueva, el cobro se anota en pesos con el dólar tarjeta de ese día (si Orbe no se abrió ese día,
// con el del primer día que se abra después). Va a la columna de ECONOMÍA del período de ese cobro.
export function renovacionDelMes(s, anio, mes) {
  const dia = deIso(s.renueva).getDate();
  return new Date(anio, mes, Math.min(dia, new Date(anio, mes + 1, 0).getDate()), 12);
}
export function anotarCobros(hoy = new Date()) {
  const cobros = leer("susCobros", {});
  const tasa = leer("dolar")?.tarjeta?.venta;
  const h = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 12);
  let cambio = false;
  todas().forEach((s) => {
    let ult = renovacionDelMes(s, h.getFullYear(), h.getMonth());
    if (ult > h) ult = renovacionDelMes(s, h.getFullYear(), h.getMonth() - 1);
    if (ult < deIso(s.desde || s.renueva)) return; // antes de que la cargaras
    const k = s.id + "|" + iso(ult);
    if (cobros[k] || (s.moneda === "USD" && !tasa)) return;
    const p = periodo(ult);
    cobros[k] = { id: s.id, nombre: s.nombre, fecha: iso(ult), ars: s.moneda === "USD" ? Math.round(s.monto * tasa) : s.monto,
      tasa: s.moneda === "USD" ? tasa : null, col: p.clave, escrito: false };
    cambio = true;
  });
  if (cambio) guardar("susCobros", cobros);
  return cobros;
}
const porColumna = () => {
  const out = {};
  Object.values(leer("susCobros", {})).forEach((c) => { const x = (out[c.col] = out[c.col] || { total: 0, pendiente: false, items: [] }); x.total += c.ars; x.items.push(c); if (!c.escrito) x.pendiente = true; });
  return out;
};
export const hayParaEconomia = () => Object.values(porColumna()).some((x) => x.pendiente);
const letra = (i) => { let s = ""; i++; while (i) { const r = (i - 1) % 26; s = String.fromCharCode(65 + r) + s; i = Math.floor((i - 1) / 26); } return s; };
const normal = (t) => String(t ?? "").trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

// Escribe el total del mes en la fila «Suscripciones» de Egresos (la crea dentro del rango del TOTAL si no está).
// Devuelve qué hizo y, si el TOTAL no la suma, lo avisa en vez de tocar tus fórmulas.
export async function escribirEnEconomia() {
  const id = idEconomia();
  if (!id) return { estado: "sin-economia" };
  const cols = Object.entries(porColumna()).filter(([, x]) => x.pendiente);
  if (!cols.length) return { estado: "al-dia" };
  const BASE = "https://sheets.googleapis.com/v4/spreadsheets/" + id;
  const meta = await api(BASE + "?fields=sheets(properties(title,sheetId))");
  const hechos = [], avisos = [];
  for (const [col, x] of cols) {
    const [anio, mes] = col.split("-").map(Number);
    const hoja = (meta.sheets || []).find((h) => h.properties.title.trim() === String(anio));
    if (!hoja) { avisos.push(`No hay hoja ${anio} en ECONOMÍA: lo de ${MESES_AR[mes - 1].toLowerCase()} queda anotado en Orbe.`); continue; }
    const t = "'" + hoja.properties.title.replace(/'/g, "''") + "'";
    const leerHoja = async () => (await api(BASE + "/values/" + encodeURIComponent(t + "!A1:Z60") + "?valueRenderOption=FORMULA")).values || [];
    let filas = await leerHoja();
    const c = (filas[0] || []).map(normal).indexOf(MESES_AR[mes - 1]);
    if (c < 0) { avisos.push(`La hoja ${anio} no tiene la columna ${MESES_AR[mes - 1]}.`); continue; }
    let r = filas.findIndex((f) => normal(f[0]) === "SUSCRIPCIONES");
    if (r < 0) {
      const iEgr = filas.findIndex((f) => normal(f[0]) === "EGRESOS"), iTot = filas.findIndex((f) => normal(f[0]) === "TOTAL");
      if (iEgr < 0 || iTot <= iEgr) { avisos.push(`No encontré Egresos y TOTAL en la hoja ${anio}.`); continue; }
      // Se mete antes del último concepto: así queda adentro del rango que suma el TOTAL.
      const ins = iTot - iEgr > 2 ? iTot - 1 : iTot;
      await api(BASE + ":batchUpdate", "POST", { requests: [{ insertDimension: { range: { sheetId: hoja.properties.sheetId, dimension: "ROWS", startIndex: ins, endIndex: ins + 1 }, inheritFromBefore: true } }] });
      await api(BASE + "/values/" + encodeURIComponent(t + "!A" + (ins + 1)) + "?valueInputOption=RAW", "PUT", { values: [["Suscripciones"]] });
      filas = await leerHoja();
      r = ins;
    }
    await api(BASE + "/values/" + encodeURIComponent(t + "!" + letra(c) + (r + 1)) + "?valueInputOption=RAW", "PUT", { values: [[x.total]] });
    // ¿El TOTAL la suma? Si es una fórmula con un rango que la incluye, sí; si no, se avisa.
    const tot = filas.find((f) => normal(f[0]) === "TOTAL");
    const fx = String(tot?.[c] ?? "");
    const rango = fx.match(/[A-Z]+(\d+):[A-Z]+(\d+)/);
    if (!/^=/.test(fx) || !rango || r + 1 < Number(rango[1]) || r + 1 > Number(rango[2])) avisos.push(`Revisá el TOTAL de ${MESES_AR[mes - 1].toLowerCase()}: no parece sumar la fila Suscripciones.`);
    const cobros = leer("susCobros", {});
    x.items.forEach((it) => { const k = it.id + "|" + it.fecha; if (cobros[k]) cobros[k].escrito = true; });
    guardar("susCobros", cobros);
    hechos.push(`${MESES_AR[mes - 1].toLowerCase()} ${anio}: $ ${x.total.toLocaleString("es-AR")}`);
  }
  return { estado: "ok", hechos, avisos };
}

// Lo que Orbe va a escribir, para pedir el OK la primera vez.
export function bloqueEconomiaSus() {
  if (!idEconomia() || !hayParaEconomia()) return "";
  const cols = Object.entries(porColumna()).filter(([, x]) => x.pendiente);
  const det = cols.map(([col, x]) => { const [a, m] = col.split("-").map(Number); return `${MESES_AR[m - 1].toLowerCase()} ${a}: <b>$ ${x.total.toLocaleString("es-AR")}</b> (${x.items.map((i) => esc(i.nombre) + (i.tasa ? " a $ " + Math.round(i.tasa).toLocaleString("es-AR") + " el dólar tarjeta del " + fechaTxt(deIso(i.fecha)) : "")).join(", ")})`; }).join("<br>");
  if (leer("ecoSusOk")) return `<p class="fuente-dato">Pendiente de pasar a ECONOMÍA: ${det}. Se escribe solo al actualizar.</p>`;
  return `<div class="eco-ok"><p><b>¿Lo paso a ECONOMÍA?</b> Orbe va a sumar la fila «Suscripciones» en los Egresos de tu planilla (si no está), adentro del rango que suma el TOTAL, y escribir:</p>
    <p class="det">${det}</p>
    <div class="chips"><button class="btn" data-accion="eco-sus-ok">Sí, escribir en ECONOMÍA</button><button class="chip" data-accion="eco-sus-no">Ahora no</button></div>
    <p class="fuente-dato">Es lo único que Orbe escribe en ECONOMÍA. Desde ahí lo hace solo cada vez que renueva algo.</p></div>`;
}
