// Rastreador: pedís un precio (escrito o dictado) y Orbe lo manda a la Oficina de Compras,
// la página de Claude que busca y compara. Orbe no busca nada: arma el pedido y abre el link.
import { ICONOS } from "./iconos.js";
import { leer, guardar } from "./almacen.js";

export const URL_RASTREADOR = "https://claude.ai/artifact/HwojSFmVVfw3SJUcPUwGw8";
// El chat de Claude donde se armó el Rastreador: ahí se le pide «procesá el Rastreador».
export const URL_CHAT = "https://claude.ai/code/session_01ATaNuSiXwoeDz8Aa8SeQSk";
const esAndroid = () => /Android/i.test(navigator.userAgent);

// En Android, un link común lo abre el navegador (sin tu sesión de Claude) y termina en
// «descargá la app». Con un link intent:// Android lo abre directo en la app de Claude
// (com.anthropic.claude). Si la app no lo puede abrir, cae al link común.
export function enApp(url) {
  if (!esAndroid()) return url;
  const u = new URL(url);
  return "intent://" + u.host + u.pathname + "#Intent;scheme=https;package=com.anthropic.claude;S.browser_fallback_url=" + encodeURIComponent(url) + ";end";
}
const linkApp = (url, texto, clase = "chip") => esAndroid()
  ? `<a class="${clase}" href="${esc(enApp(url))}">${texto}</a>`
  : `<a class="${clase}" href="${esc(url)}" target="_blank" rel="noopener">${texto}</a>`;
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const puedeDictar = () => "webkitSpeechRecognition" in window || "SpeechRecognition" in window;

// El pedido viaja en el #ancla del link como hexadecimal: la página de Claude solo deja pasar
// letras, números y guiones ahí. Ejemplo: #p-7b2270223a...
export function linkPedido(p) {
  const bytes = new TextEncoder().encode(JSON.stringify(p));
  return URL_RASTREADOR + "#p-" + [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function formPrecio(compacto = false) {
  return `<form data-form="precio">
    <label class="sr" for="precio-txt">¿Qué querés comprar?</label>
    <textarea id="precio-txt" name="t" class="campo-texto" placeholder="Decí o escribí qué querés comprar. Ej.: un teclado inalámbrico plegable" required maxlength="400"></textarea>
    ${puedeDictar() ? `<button type="button" class="btn sec dictar" data-accion="dictar" style="margin-top:8px;display:inline-flex;gap:8px;align-items:center"><span style="width:18px;height:18px;display:inline-flex">${ICONOS.mic}</span>Dictar</button>` : ""}
    <div class="grupo" style="display:flex;gap:10px;flex-wrap:wrap">
      <input name="tope" class="campo-linea" inputmode="numeric" placeholder="Hasta $ (opcional)" maxlength="40" style="flex:1;min-width:140px;margin:0;font-family:var(--sans);font-size:15px">
      <input name="uso" class="campo-linea" placeholder="Para qué (opcional)" maxlength="120" style="flex:2;min-width:160px;margin:0;font-family:var(--sans);font-size:15px">
    </div>
    <div class="grupo" style="display:flex;gap:10px">${compacto ? `<button type="button" class="btn sec" data-accion="cerrar-hoja" style="flex:1">Cancelar</button>` : ""}<button class="btn" style="flex:2">Mandar al Rastreador</button></div>
    <p class="vacio" style="font-size:12.5px;margin:8px 0 0">${esAndroid() ? "Se abre el Rastreador en la app de Claude con tu pedido copiado: mantené apretado el cuadro, «Pegar» y «Mandar a rastrear»." : "Se abre el Rastreador con tu pedido ya cargado y queda en espera hasta que Claude busque precios reales. Por las dudas, el texto también queda copiado."}</p>
  </form>`;
}

// Arma el pedido, lo copia, lo anota acá y abre el Rastreador. Devuelve el link.
export function mandarPedido(d) {
  const p = { p: String(d.t || "").trim(), tope: String(d.tope || "").trim(), uso: String(d.uso || "").trim(), ts: Date.now() };
  if (!p.p) return null;
  const url = linkPedido(p);
  try { navigator.clipboard?.writeText(p.p).catch(() => {}); } catch (e) { /* nada */ }
  const hist = leer("precios", []);
  hist.unshift({ t: p.p, tope: p.tope, cuando: p.ts });
  guardar("precios", hist.slice(0, 15));
  // En Android va a la app de Claude. La app no recibe el pedido del link (se pierde el #),
  // por eso queda copiado: en el Rastreador lo pegás y tocás «Mandar a rastrear».
  if (esAndroid()) { setTimeout(() => { location.href = enApp(url); }, 60); return url; }
  const w = window.open(url, "_blank", "noopener");
  if (!w) location.href = url;
  return url;
}

export function renderRastreador(volver) {
  const hist = leer("precios", []);
  const fecha = (t) => new Date(t).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
  return `<div class="pagina">${volver}<h1>Rastreador</h1>
    <p class="bajada">Decile qué querés comprar. Claude compara precios, calidad y dónde conviene (online o en persona) y te arma las 5 mejores opciones y una de reserva.</p>
    <section class="bloque">${formPrecio()}</section>
    <section class="bloque"><div class="chips">${linkApp(URL_RASTREADOR, "Ver expedientes")}${linkApp(URL_CHAT, "Hablarlo con Claude")}</div>
      <p class="vacio" style="font-size:12.5px;margin:8px 0 0">«Hablarlo con Claude» abre el chat del Rastreador. Decile «procesá el Rastreador» para que resuelva lo que está en espera.</p></section>
    ${hist.length ? `<section class="bloque"><h2>Lo último que pediste</h2><ul class="lista">${hist.map((h) => `<li><span>${esc(h.t)}${h.tope ? `<br><small class="vacio">Hasta ${esc(h.tope)}</small>` : ""}</span><span class="der">${fecha(h.cuando)}</span></li>`).join("")}</ul></section>` : ""}
  </div>`;
}
