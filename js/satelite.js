// Satélite: la mini app Android de Orbe. Escucha solo las notificaciones de Mercado Pago, BNA+ y Personal Pay,
// y la próxima alarma del celu, y lo deja cifrado en el buzón de Orbe. Acá Orbe lo retira, lo pasa a tu
// planilla (MOVIMIENTOS, sin duplicar con los mails) y recién ahí lo borra del buzón.
import { leer, guardar } from "./almacen.js";
import { permisos } from "./google.js";
import { agregar } from "./hoja.js";
import { datosFinanzas, leerPlanilla, clasificar, aFila } from "./finanzas.js";
import { fusionar } from "./movimientos.js";

export const APK = "https://github.com/sirathrion18/orbe/releases/latest/download/Satelite.apk";
export const NOMBRE_APP = { mercadopago: "Mercado Pago", bna: "BNA+", personalpay: "Personal Pay" };
export const datosSatelite = () => leer("satelite");

async function pedir(accion, cuerpo) {
  const r = await fetch("/api/satelite/" + accion, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cuerpo || {}) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || "servidor " + r.status);
  return j;
}

// Un aviso del celu como movimiento de Orbe (mismo formato que los de los mails).
export function aMovimiento(it) {
  const app = NOMBRE_APP[it.app] || it.app;
  const clase = it.sentido === "cobro" ? "ingreso" : "gasto";
  return {
    id: "cel-" + String(it.id || it.ts).slice(0, 40), ts: it.ts, clase, tipo: it.sentido === "transferencia" ? "transferencia" : "notif",
    monto: it.monto, moneda: it.moneda || "ARS", contra: it.comercio || app, medio: app, rubro: "", mitad: false,
    fuente: "Celu · " + app, revisar: false, nota: "", grupo: "", eco: false, diario: "", cruce: ""
  };
}

// Retira el buzón: lo nuevo va a la planilla y después se borra del buzón. Si algo falla, queda en el buzón para la próxima.
export async function retirarSatelite() {
  const r = await pedir("retirar");
  const previo = leer("satelite", {}) || {};
  let nuevos = 0;
  const items = (r.tandas || []).flatMap((t) => t.items || []);
  if (items.length) {
    if (!permisos().sheets) throw new Error("permiso");
    const fin = datosFinanzas() || await leerPlanilla();
    const aceptados = fusionar(fin.movs, items.map(aMovimiento)).map((m) => clasificar(m, fin.reglas || []));
    if (aceptados.length) { await agregar("MOVIMIENTOS!A:R", aceptados.map(aFila)); nuevos = aceptados.length; await leerPlanilla(); }
  }
  if ((r.tandas || []).length) await pedir("listo", { claves: r.tandas.map((t) => t.clave) });
  const s = { cuando: Date.now(), alarma: r.alarma || previo.alarma || null, dispositivos: r.dispositivos || [], ultimos: nuevos ? nuevos : previo.ultimos || 0,
    recibidos: (previo.recibidos || 0) + nuevos, error: null };
  guardar("satelite", s, true);
  return { ...s, nuevos };
}

export async function codigoSatelite(nombre) { return pedir("codigo", { nombre }); }
export async function anularSatelite(id) {
  await pedir("anular", { id });
  const s = leer("satelite", {}) || {};
  s.dispositivos = (s.dispositivos || []).filter((d) => d.id !== id);
  guardar("satelite", s, true);
}

// Próxima alarma que vio Satélite (si el aviso es reciente: de las últimas 36 horas).
export function alarmaSatelite(ahora = Date.now()) {
  const a = leer("satelite")?.alarma;
  if (!a || !a.cuando || ahora - a.cuando > 36 * 3600000) return null;
  return { ts: a.ts && a.ts > ahora - 3600000 ? a.ts : null, cuando: a.cuando };
}
