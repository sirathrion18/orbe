// Arranca el inicio de sesión con Google (pide la renovación de larga duración).
import { CLIENT_ID, ALCANCES, configurado, cookieEstado } from "../../../servidor/sesion.js";

export async function onRequestGet({ request, env }) {
  if (!configurado(env)) return new Response("Orbe todavía no tiene cargado el secreto de Google en Cloudflare.", { status: 503 });
  const url = new URL(request.url);
  const estado = crypto.randomUUID();
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: url.origin + "/api/auth/callback",
    response_type: "code",
    scope: ALCANCES.join(" "),
    access_type: "offline",
    include_granted_scopes: "true",
    prompt: "consent",
    state: estado
  });
  return new Response(null, {
    status: 302,
    headers: { Location: "https://accounts.google.com/o/oauth2/v2/auth?" + params, "Set-Cookie": cookieEstado(estado), "Cache-Control": "no-store" }
  });
}
