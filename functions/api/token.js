// Entrega un pase de Google de 1 hora usando la renovación guardada. Así la sesión dura semanas.
// El pase que llega al navegador nunca incluye Gmail: los mails se leen solo del lado del servidor.
import { configurado, descifrar, cifrar, leerCookie, COOKIE, cookieSesion, borrarSesion, mismoOrigen, json, paseDe, GMAIL } from "../../servidor/sesion.js";

export async function onRequestPost({ request, env }) {
  if (!mismoOrigen(request)) return json({ error: "origen" }, 403);
  if (!configurado(env)) return json({ error: "sin-configurar" }, 503);
  const crudo = leerCookie(request, COOKIE);
  const s = crudo && await descifrar(env, crudo);
  if (!s || !s.rt) return json({ error: "sin-sesion" }, 401);

  const otorgados = (s.scope || "").split(" ").filter(Boolean);
  const sinGmail = otorgados.filter((a) => a !== GMAIL);
  let { ok, t } = await paseDe(env, s.rt, otorgados.includes(GMAIL) ? sinGmail : null);
  if (!ok && t.error === "invalid_scope") {
    // Nunca se cae al pase completo si incluye Gmail: se pide solo el calendario.
    ({ ok, t } = await paseDe(env, s.rt, otorgados.includes(GMAIL) ? ["https://www.googleapis.com/auth/calendar.readonly"] : null));
  }
  if (!ok) {
    // invalid_grant: la renovación venció o la revocaste. Hay que volver a conectar.
    return json({ error: "reconectar" }, 401, { "Set-Cookie": borrarSesion() });
  }
  // Renueva la cookie por otros 30 días cada vez que usás Orbe.
  const nueva = await cifrar(env, { ...s, rt: t.refresh_token || s.rt });
  return json({ access_token: t.access_token, expires_in: t.expires_in, email: s.email, scope: t.scope,
    permisos: { sheets: otorgados.some((a) => a.endsWith("/spreadsheets")), gmail: otorgados.includes(GMAIL),
      drive: otorgados.some((a) => a.endsWith("/drive.readonly")), calendario: otorgados.some((a) => a.endsWith("/calendar.events")) } }, 200, { "Set-Cookie": cookieSesion(nueva) });
}
