// Ajustes › Satélite: vincular el celu, ver qué celus pueden mandar al buzón y anularlos.
import { esc } from "./inicio.js";
import { sesion } from "./almacen.js";
import { datosSatelite, APK } from "./satelite.js";

const hace = (t) => {
  if (!t) return "todavía nada";
  const m = Math.round((Date.now() - t) / 60000);
  return m < 1 ? "recién" : m < 60 ? "hace " + m + " min" : m < 48 * 60 ? "hace " + Math.round(m / 60) + " h" : "hace " + Math.round(m / 1440) + " días";
};
const hhmm = (ts) => { const d = new Date(ts); return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); };
const PASOS_KV = `<ol class="sat-pasos">
  <li>Entrá a <a href="https://dash.cloudflare.com/?to=/:account/workers/kv/namespaces" target="_blank" rel="noopener">Cloudflare › Workers KV</a> › <b>Create instance</b>, ponele de nombre <b>orbe-satelite</b> y tocá <b>Create</b>.</li>
  <li>Andá a <b>Workers &amp; Pages</b> › <b>orbe</b> › <b>Settings</b> › <b>Bindings</b> › <b>Add</b> › <b>KV namespace</b>.</li>
  <li>Variable name: <b>SATELITE</b> (así, en mayúsculas) · KV namespace: <b>orbe-satelite</b>. Guardá.</li>
  <li>Volvé a publicar: en <b>Deployments</b>, en el último, tocá los tres puntitos › <b>Retry deployment</b>. Listo: volvé acá y tocá «Vincular un celu».</li></ol>`;

export function bloqueSatelite(conectado) {
  if (!conectado) return `<section class="bloque satelite"><h2>Satélite · tu celu</h2><p class="vacio">Primero conectá tu Google.</p></section>`;
  const s = datosSatelite() || {};
  const devs = s.dispositivos || [];
  const cod = sesion("satCodigo");
  // El código se esconde solo apenas aparece un celu vinculado después de pedirlo.
  const codVivo = cod && cod.vence > Date.now() && !devs.some((d) => d.creado >= cod.vence - 600000);
  let cuerpo;
  if (s.error === "falta-buzon" && !devs.length && !codVivo) {
    cuerpo = `<p>Satélite necesita un buzón en tu Cloudflare (gratis, una sola vez, 3 minutos). Ahí el celu deja los pagos cifrados hasta que Orbe los retira.</p>${PASOS_KV}
      <div class="chips"><button class="btn" data-accion="sat-codigo" data-nombre="Xiaomi">Ya lo hice: vincular un celu</button></div>`;
  } else if (codVivo) {
    const min = Math.max(1, Math.round((cod.vence - Date.now()) / 60000));
    cuerpo = `<p>En el celu, abrí <b>Satélite</b>, tocá <b>Vincular</b> y escribí este código:</p>
      <p class="sat-codigo" aria-label="Código ${esc(cod.codigo.split("").join(" "))}">${esc(cod.codigo.slice(0, 4))}<span>·</span>${esc(cod.codigo.slice(4))}</p>
      <p class="vacio" style="font-size:13px">Sirve una sola vez y vence en ${min} min. ¿Todavía no tenés la app? <a href="${APK}" rel="noopener">Bajar Satélite</a> (desde el celu).</p>
      <div class="chips" style="margin-top:12px"><button class="btn sec" data-accion="sat-retirar">Ya lo vinculé</button><button class="chip" data-accion="sat-codigo" data-nombre="Xiaomi">Otro código</button></div>`;
  } else {
    cuerpo = devs.length ? "" : `<p>Satélite es la mini app de Orbe para tu Android: lee los avisos de pago de Mercado Pago, BNA+ y Personal Pay, y la próxima alarma. Así Finanzas se entera aunque no llegue mail.</p>
      <div class="chips" style="margin-top:12px"><button class="btn" data-accion="sat-codigo" data-nombre="Xiaomi">Vincular un celu</button><a class="chip" href="${APK}" rel="noopener">Bajar Satélite</a></div>`;
  }
  const lista = devs.length ? `<ul class="lista sat-devs">${devs.map((d) => `<li><span><b>${esc(d.nombre)}</b>${d.modelo ? " · " + esc(d.modelo) : ""}<br>
      <small class="vacio">Último aviso: ${esc(hace(d.visto))}${d.version ? " · Satélite " + esc(d.version) : ""} · vinculado el ${new Date(d.creado).toLocaleDateString("es-AR")}</small></span>
      <button class="chip" data-accion="sat-anular" data-id="${esc(d.id)}">Anular</button></li>`).join("")}</ul>
    <p class="vacio" style="font-size:13px;margin-top:10px">${s.alarma?.ts ? "Próxima alarma que ve: " + hhmm(s.alarma.ts) + " (" + new Date(s.alarma.ts).toLocaleDateString("es-AR", { weekday: "short", day: "numeric" }) + ")." : s.alarma ? "No ve ninguna alarma puesta." : ""} ${s.recibidos ? s.recibidos + " pagos del celu en total." : ""} Orbe mira el buzón al abrir y cada 5 minutos.</p>
    <div class="chips" style="margin-top:12px"><button class="btn sec" data-accion="sat-retirar">Mirar el buzón ahora</button>${codVivo ? "" : '<button class="chip" data-accion="sat-codigo" data-nombre="Otro celu">Vincular otro</button>'}<a class="chip" href="${APK}" rel="noopener">Bajar la última versión</a></div>` : "";
  return `<section class="bloque satelite"><h2>Satélite · tu celu</h2>${cuerpo}${lista}
    <p class="vacio" style="margin-top:12px;font-size:12px">Escucha solo esas tres apps y de cada aviso manda app, monto, comercio y hora: nunca el texto completo ni otras notificaciones. Va cifrado y Orbe lo borra del buzón apenas lo pasa a tu planilla. Si perdés el celu, tocá «Anular» y esa llave deja de servir.</p></section>`;
}
