// Cierra la sesión: revoca el permiso en Google y borra la cookie.
import { configurado, descifrar, leerCookie, COOKIE, borrarSesion, mismoOrigen, json } from "../../../servidor/sesion.js";

export async function onRequestPost({ request, env }) {
  if (!mismoOrigen(request)) return json({ error: "origen" }, 403);
  const crudo = leerCookie(request, COOKIE);
  const s = configurado(env) && crudo ? await descifrar(env, crudo) : null;
  if (s && s.rt) {
    try { await fetch("https://oauth2.googleapis.com/revoke?token=" + encodeURIComponent(s.rt), { method: "POST" }); } catch (e) { /* igual se borra */ }
  }
  return json({ ok: true }, 200, { "Set-Cookie": borrarSesion() });
}
