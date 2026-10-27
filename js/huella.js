// Desbloqueo con huella (o cara) usando el lector del propio dispositivo (WebAuthn).
// La huella nunca sale del celu: Android solo le confirma a Orbe "es el dueño". Cada dispositivo se registra aparte.
import { leer, guardar, borrar } from "./almacen.js";

const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const deB64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const azar = (n) => crypto.getRandomValues(new Uint8Array(n));

export const huellaActiva = () => !!leer("huella");

export async function huellaDisponible() {
  try { return !!(window.PublicKeyCredential && await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()); }
  catch (e) { return false; }
}

export async function registrarHuella() {
  const cred = await navigator.credentials.create({ publicKey: {
    challenge: azar(32), rp: { name: "Orbe", id: location.hostname },
    user: { id: azar(16), name: "orbe", displayName: "Orbe" },
    pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
    authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required", residentKey: "discouraged" },
    timeout: 60000, attestation: "none"
  } });
  guardar("huella", { id: b64(cred.rawId), desde: Date.now() });
}

export async function verificarHuella() {
  const h = leer("huella");
  if (!h) return false;
  try {
    const r = await navigator.credentials.get({ publicKey: {
      challenge: azar(32), rpId: location.hostname, userVerification: "required", timeout: 60000,
      allowCredentials: [{ type: "public-key", id: deB64(h.id), transports: ["internal"] }]
    } });
    return !!r;
  } catch (e) { return false; }
}

export const sacarHuella = () => borrar("huella");
