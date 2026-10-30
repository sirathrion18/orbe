// Buzón de Satélite (la mini app Android de Orbe).
// El celu deja acá, cifrado, lo que leyó de las notificaciones de tus apps de pago (solo app, monto, comercio y hora)
// y la próxima alarma. Orbe lo retira, lo pasa a tu planilla y lo borra. Lo que nadie retira se borra solo a los 30 días.
// Todo vive en un KV de Cloudflare (enlace SATELITE) y va cifrado con una llave derivada del secreto de Orbe.
// Cada celu tiene su propia llave (se guarda solo su huella, nunca la llave) y se anula desde Ajustes.

const enc = new TextEncoder(), dec = new TextDecoder();
const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const deB64 = (s) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4)), (c) => c.charCodeAt(0));
export const hex = (buf) => [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, "0")).join("");
export const sha256 = async (t) => hex(await crypto.subtle.digest("SHA-256", enc.encode(String(t))));

export const DIAS30 = 30 * 86400;
export const APPS = ["mercadopago", "bna", "personalpay"];
const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin 0/O ni 1/I para que no se confundan

async function llave(env) {
  const base = await crypto.subtle.importKey("raw", enc.encode(env.GOOGLE_CLIENT_SECRET), "HKDF", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "HKDF", hash: "SHA-256", salt: enc.encode("orbe"), info: enc.encode("satelite-v1") },
    base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}
export async function cifrar(env, obj) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const c = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await llave(env), enc.encode(JSON.stringify(obj)));
  return b64(iv) + "." + b64(c);
}
export async function descifrar(env, texto) {
  try {
    const [iv, c] = String(texto).split(".");
    return JSON.parse(dec.decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: deB64(iv) }, await llave(env), deB64(c))));
  } catch (e) { return null; }
}

export function codigoNuevo() {
  const r = crypto.getRandomValues(new Uint8Array(8));
  return [...r].map((x) => ALFABETO[x % ALFABETO.length]).join("");
}
export const llaveNueva = () => b64(crypto.getRandomValues(new Uint8Array(32)));
export const idNuevo = () => b64(crypto.getRandomValues(new Uint8Array(9)));

// Lo que manda el celu, limpio: nada de texto libre largo, montos razonables, solo las apps permitidas.
const corto = (t, n) => String(t ?? "").replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, n);
export function limpiarItem(x) {
  if (!x || typeof x !== "object") return null;
  const monto = Number(x.monto);
  const ts = Number(x.ts);
  if (!APPS.includes(x.app)) return null;
  if (!(monto > 0 && monto < 1e9) || !(ts > 1.6e12 && ts < Date.now() + 86400000)) return null;
  return {
    id: corto(x.id, 40) || null, app: x.app, monto: Math.round(monto * 100) / 100,
    moneda: x.moneda === "USD" ? "USD" : "ARS", comercio: corto(x.comercio, 60),
    sentido: ["pago", "cobro", "transferencia", "tarjeta", "otro"].includes(x.sentido) ? x.sentido : "otro", ts
  };
}

// ---------- Avisos de Orbe para el celu ----------
// Orbe arma la agenda (próximas 36 h) y la deja acá, cifrada; el celu la baja cuando cambia y la programa.
// Validación estricta: categorías fijas, textos cortos, horas razonables, nada de HTML. Si algo no cierra, se rechaza todo.
export const CATS_AVISO = ["urgente", "plata", "facu", "bna", "river", "manana"];
export const DIAS3 = 3 * 86400;
const MAX_AVISOS = 40;
export function limpiarAgenda(c, ahora = Date.now()) {
  if (!c || typeof c !== "object") return null;
  const lista = Array.isArray(c.avisos) ? c.avisos : [];
  if (lista.length > MAX_AVISOS) return null;
  const avisos = [];
  const ids = new Set();
  for (const x of lista) {
    if (!x || typeof x !== "object") return null;
    const ts = Number(x.ts);
    const id = String(x.id ?? "");
    if (!/^[A-Za-z0-9_-]{1,24}$/.test(id)) return null;
    if (ids.has(id)) continue; // repetido: queda el primero
    if (!CATS_AVISO.includes(x.cat)) return null;
    if (!(ts > ahora - 3600000 && ts < ahora + DIAS3 * 1000)) return null;
    const titulo = corto(x.titulo, 60), texto = corto(x.texto, 160);
    if (!titulo) return null;
    ids.add(id);
    avisos.push({ id, ts: Math.round(ts), cat: x.cat, titulo, texto });
  }
  avisos.sort((a, b) => a.ts - b.ts);
  let diario = null;
  if (c.diario != null) {
    const d = c.diario;
    if (typeof d !== "object") return null;
    const q = Number(d.queda), ts = Math.min(Number(d.ts), ahora), visto = Number(d.visto) || 0;
    // Con el reloj de la compu corrido solo se descarta «diario», no la agenda entera.
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(d.fecha)) && Number.isFinite(q) && Math.abs(q) < 1e10 && ts > ahora - 86400000)
      diario = { fecha: String(d.fecha), queda: Math.round(q), ts: Math.round(ts), visto: Math.round(Math.max(0, Math.min(visto, ts))) };
  }
  const k = c.cfg && typeof c.cfg === "object" ? c.cfg : {};
  const hora = (h, def) => { const n = Number(h); return Number.isInteger(n) && n >= 0 && n <= 23 ? n : def; };
  const cfg = { desde: hora(k.desde, 0), hasta: hora(k.hasta, 8), plata: k.plata !== false };
  return { avisos, diario, cfg };
}
