// Suscripciones recurrentes (en dólares o en pesos), con su renovación y un aviso en Urgente unos días antes.
// Los datos los cargás vos en Finanzas y se guardan en tu planilla (sincronizados), nunca en el código.
import { leer, guardar } from "./almacen.js";

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
    ${l.some((s) => s.moneda === "USD") && !leer("dolar")?.tarjeta ? '<p class="fuente-dato">El equivalente en pesos aparece cuando Orbe lee el dólar tarjeta.</p>' : ""}</section>`;
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
