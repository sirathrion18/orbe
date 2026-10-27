// Sesión de Orbe con Google, del lado del servidor (Cloudflare Pages Functions).
// La llave de renovación de Google viaja cifrada dentro de una cookie que solo el servidor puede leer:
// no hay base de datos, y el código del navegador nunca la ve.
// El único secreto es GOOGLE_CLIENT_SECRET, cargado como variable cifrada en Cloudflare (nunca en este repo).

export const CLIENT_ID = "775947921311-t5edjab9rq99eng3fd3dh1bs5c1jd8e7.apps.googleusercontent.com";
// SHA-256 del único mail autorizado (así el mail no queda escrito en el código público).
const PERMITIDOS = ["39dc598bce7bddfb544f4af478a721512df0afd5946afe9c3f637f593dc33dd3"];
export const COOKIE = "__Host-orbe";
const COOKIE_ESTADO = "__Host-orbe-estado";
const TREINTA_DIAS = 30 * 24 * 3600;
// Permisos de solo lectura. Se piden de a poco: cada versión suma los que necesita.
export const ALCANCES = ["openid", "email", "https://www.googleapis.com/auth/calendar.readonly"];
// Se suman cuando activás sincronización y finanzas: la planilla de Orbe (Sheets) y los mails de aviso (Gmail, solo lectura).
export const SHEETS = "https://www.googleapis.com/auth/spreadsheets";
export const GMAIL = "https://www.googleapis.com/auth/gmail.readonly";
export const EXTRAS = [SHEETS, GMAIL];

// Pide a Google un pase de 1 hora con solo los permisos indicados (así el navegador nunca recibe el de Gmail).
export async function paseDe(env, rt, alcances) {
  const cuerpo = { client_id: CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, refresh_token: rt, grant_type: "refresh_token" };
  if (alcances && alcances.length) cuerpo.scope = alcances.join(" ");
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(cuerpo)
  });
  const t = await r.json().catch(() => ({}));
  return { ok: r.ok, t };
}

const enc = new TextEncoder(), dec = new TextDecoder();
const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const deB64 = (s) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4)), (c) => c.charCodeAt(0));

export function configurado(env) { return !!(env && env.GOOGLE_CLIENT_SECRET); }

async function llave(env) {
  const base = await crypto.subtle.importKey("raw", enc.encode(env.GOOGLE_CLIENT_SECRET), "HKDF", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "HKDF", hash: "SHA-256", salt: enc.encode("orbe"), info: enc.encode("sesion-v1") },
    base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}

export async function cifrar(env, obj) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const c = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await llave(env), enc.encode(JSON.stringify(obj)));
  return b64(iv) + "." + b64(c);
}

export async function descifrar(env, texto) {
  try {
    const [iv, c] = texto.split(".");
    const p = await crypto.subtle.decrypt({ name: "AES-GCM", iv: deB64(iv) }, await llave(env), deB64(c));
    return JSON.parse(dec.decode(p));
  } catch (e) { return null; }
}

export function leerCookie(request, nombre) {
  const h = request.headers.get("Cookie") || "";
  const m = h.split(/;\s*/).find((p) => p.startsWith(nombre + "="));
  return m ? decodeURIComponent(m.slice(nombre.length + 1)) : null;
}

export const cookieSesion = (valor) => `${COOKIE}=${encodeURIComponent(valor)}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=${TREINTA_DIAS}`;
export const borrarSesion = () => `${COOKIE}=; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=0`;
export const cookieEstado = (v) => `${COOKIE_ESTADO}=${v}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=600`;
export const borrarEstado = () => `${COOKIE_ESTADO}=; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=0`;
export const leerEstado = (req) => leerCookie(req, COOKIE_ESTADO);

export async function mailPermitido(mail) {
  const h = await crypto.subtle.digest("SHA-256", enc.encode(String(mail || "").trim().toLowerCase()));
  return PERMITIDOS.includes([...new Uint8Array(h)].map((x) => x.toString(16).padStart(2, "0")).join(""));
}

// Solo acepta pedidos que vienen de la propia página de Orbe.
export function mismoOrigen(request) {
  const url = new URL(request.url);
  const origen = request.headers.get("Origin");
  const sitio = request.headers.get("Sec-Fetch-Site");
  if (origen && origen !== url.origin) return false;
  if (sitio && sitio !== "same-origin") return false;
  return true;
}

export const json = (cuerpo, status = 200, cabeceras = {}) => new Response(JSON.stringify(cuerpo), {
  status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...cabeceras }
});

export function decodificarIdToken(t) {
  try { return JSON.parse(dec.decode(deB64(t.split(".")[1]))); } catch (e) { return {}; }
}
