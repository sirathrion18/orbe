// Entrega un pase de Google de 1 hora usando la renovación guardada. Así la sesión dura semanas.
import { CLIENT_ID, configurado, descifrar, cifrar, leerCookie, COOKIE, cookieSesion, borrarSesion, mismoOrigen, json } from "../../servidor/sesion.js";

export async function onRequestPost({ request, env }) {
  if (!mismoOrigen(request)) return json({ error: "origen" }, 403);
  if (!configurado(env)) return json({ error: "sin-configurar" }, 503);
  const crudo = leerCookie(request, COOKIE);
  const s = crudo && await descifrar(env, crudo);
  if (!s || !s.rt) return json({ error: "sin-sesion" }, 401);

  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, refresh_token: s.rt, grant_type: "refresh_token" })
  });
  const t = await r.json();
  if (!r.ok) {
    // invalid_grant: la renovación venció o la revocaste. Hay que volver a conectar.
    return json({ error: "reconectar" }, 401, { "Set-Cookie": borrarSesion() });
  }
  // Renueva la cookie por otros 30 días cada vez que usás Orbe.
  const nueva = await cifrar(env, { ...s, rt: t.refresh_token || s.rt });
  return json({ access_token: t.access_token, expires_in: t.expires_in, email: s.email, scope: t.scope }, 200, { "Set-Cookie": cookieSesion(nueva) });
}
