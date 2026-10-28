// Guiños: si el switch de Ajustes › Diseño está prendido, tres veces por día (uno a la mañana, uno a la tarde
// y uno a la noche, en un momento al azar), Inicio se viste de Arácnido, Laboratorio, Decreto o TVA durante
// 20 minutos desde que lo ves. Tocando tres veces el saludo sale uno al toque.
// Son guiños con dibujos genéricos y textos: ningún personaje dibujado.
import { leer, guardar, sesion } from "./almacen.js";

export const GUINOS = [["arana", "Arácnido"], ["lab", "Laboratorio"], ["decreto", "Decreto"], ["tva", "TVA"]];
const DURA = 20 * 60000;
const FRANJAS = [[9, 13, "a la mañana"], [13, 18, "a la tarde"], [18, 23, "a la noche"]];
export const guinosPrendidos = () => leer("guinos", true) !== false;

function azar(semilla) {
  let s = semilla >>> 0;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
}

// El plan del día sale de la fecha: los mismos momentos en el celu y en la compu.
function plan(f) {
  const dia = f.getFullYear() + "-" + (f.getMonth() + 1) + "-" + f.getDate();
  let p = leer("guinoPlan");
  if (!p || p.dia !== dia || p.v !== 2) {
    const r = azar(f.getFullYear() * 10007 + (f.getMonth() + 1) * 389 + f.getDate() * 31);
    const tipos = GUINOS.map(([k]) => k).sort(() => r() - .5);
    const momentos = FRANJAS.map(([a, b], i) => ({ min: Math.floor(a * 60 + r() * (b - a) * 60), tipo: tipos[i], visto: 0 }));
    p = { v: 2, dia, momentos };
    guardar("guinoPlan", p, true);
  }
  return p;
}

// Cuántos te tocan hoy y cuántos quedan (sin decir cuál), para Ajustes.
export function resumenGuinos(f) {
  const p = plan(f);
  const min = f.getHours() * 60 + f.getMinutes();
  const quedan = p.momentos.filter((m) => m.min > min).map((m) => FRANJAS.find(([a, b]) => m.min >= a * 60 && m.min < b * 60)?.[2]).filter(Boolean);
  return quedan.length ? `Hoy te quedan ${quedan.length}: ${quedan.join(", ")}.` : "Por hoy ya pasaron los tres. Mañana hay más.";
}

// Uno al toque (tres toques en el saludo): dura 20 minutos o hasta cerrar Orbe.
export function guinoYa() {
  const actual = sesion("guinoYa")?.tipo;
  const opciones = GUINOS.map(([k]) => k).filter((k) => k !== actual);
  const tipo = opciones[Math.floor(Math.random() * opciones.length)];
  sesion("guinoYa", { tipo, hasta: Date.now() + DURA });
  return tipo;
}

// El guiño de ahora (o null). Se cuenta desde la primera vez que ves Inicio (con la pantalla prendida)
// después del momento sorteado, así no se pierde si justo no estabas mirando.
export function guinoActivo(f, demo) {
  if (demo) return demo;
  if (!guinosPrendidos()) return null;
  const ya = sesion("guinoYa");
  if (ya && Date.now() < ya.hasta) return ya.tipo;
  const p = plan(f);
  const min = f.getHours() * 60 + f.getMinutes(), ahora = f.getTime();
  const visible = typeof document === "undefined" || document.visibilityState !== "hidden";
  for (const m of p.momentos) {
    if (m.min > min) continue;
    if (!m.visto) {
      if (!visible) return null; // con Orbe en segundo plano no se gasta
      m.visto = ahora; guardar("guinoPlan", p, true); return m.tipo;
    }
    if (ahora - m.visto < DURA) return m.tipo;
  }
  return null;
}

// ---------- Dibujos (genéricos) ----------
const ARANA = `<svg viewBox="0 0 40 40" aria-hidden="true" fill="currentColor" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
  <g fill="none"><path d="M16 17 8 11 4 14M15 20 6 19 3 23M16 23 8 27 6 32M17 25 12 31 12 36"/><path d="M24 17 32 11 36 14M25 20 34 19 37 23M24 23 32 27 34 32M23 25 28 31 28 36"/></g>
  <ellipse cx="20" cy="23" rx="5.2" ry="6.4" stroke="none"/><circle cx="20" cy="14.6" r="3.4" stroke="none"/></svg>`;

const HUD = `<svg class="hud" viewBox="0 0 200 200" aria-hidden="true" fill="none" stroke="currentColor">
  <circle cx="100" cy="100" r="97" stroke-width=".6" stroke-dasharray="2 4" opacity=".7"/>
  <g class="hud-giro"><path d="M100 6a94 94 0 0 1 81 47" stroke-width="2.2"/><path d="M19 147a94 94 0 0 1-6-73" stroke-width="2.2"/><path d="M146 182a94 94 0 0 1-34 11" stroke-width="2.2"/></g>
  <g class="hud-giro2"><circle cx="100" cy="100" r="88" stroke-width=".8" stroke-dasharray="18 10 4 10" opacity=".8"/></g>
  <g stroke-width="1"><path d="M100 0v7M100 193v7M0 100h7M193 100h7"/></g>
  <line class="hud-barrido" x1="100" y1="100" x2="100" y2="8" stroke-width="1.4"/>
  <g fill="currentColor" stroke="none" font-size="6" font-family="ui-monospace,monospace" letter-spacing=".5"><text x="128" y="20">SYS 100%</text><text x="18" y="186">ORBE·HUD</text></g></svg>`;

const TELA2 = `<svg class="tela tela-izq" viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="1" aria-hidden="true">
<path d="M0 0L120 0M0 0L110 70M0 0L50 120M0 0L0 120"/><path d="M30 0Q26 18 0 24"/><path d="M62 0Q56 30 24 44Q12 50 0 50"/><path d="M95 0Q88 45 50 66Q24 80 0 80"/></svg>`;

// Lo que se suma arriba de Inicio según el guiño.
export function decoracion(tipo) {
  if (tipo === "arana") return `${TELA2}<button class="arana" data-accion="arana" aria-label="Una arañita. Tocala y sube."><span class="hilo"></span>${ARANA}</button>`;
  return "";
}

// El reloj, en modo Laboratorio, con la pantalla de escaneo encima y una lectura del día abajo.
export function hudSobre(anilloHtml, ctx, datos, clima, urgentes) {
  const hoy = ctx.hoy || [];
  const enCurso = hoy.find((b) => b.ini <= ctx.min && ctx.min < b.fin);
  const sigue = hoy.find((b) => b.ini > ctx.min);
  const partes = [enCurso ? "en curso: " + enCurso.titulo : sigue ? "después: " + sigue.titulo : "agenda libre", urgentes ? urgentes + (urgentes === 1 ? " urgente" : " urgentes") : "nada urgente", clima ? Math.round(clima.temp) + "° afuera" : ""].filter(Boolean);
  return `<div class="hud-cont escanea">${anilloHtml}${HUD}</div>
    <button class="hud-lectura" data-accion="hud" aria-label="Volver a escanear el día"><span class="pt"></span><span class="txt">Escaneo · ${partes.map((x) => x.replace(/[<>&]/g, "")).join(" · ")}</span></button>`;
}

// Urgente como decreto real (o el reino en orden, si no hay nada).
export function decreto(lista, cuandoTexto, esc) {
  const sello = `<span class="sello" aria-hidden="true"><svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="17" fill="currentColor"/><circle cx="20" cy="20" r="12.5" fill="none" stroke="#0E1A12" stroke-width="1.2" opacity=".5"/><path d="M20 11l2.6 5.6 6 .7-4.5 4.1 1.2 6-5.3-3-5.3 3 1.2-6-4.5-4.1 6-.7z" fill="#0E1A12" opacity=".55"/></svg></span>`;
  if (!lista.length) return `<a class="w ancho decreto" href="#/urgente">${sello}<span class="dk">Decreto del día</span><span class="dt">El reino está en orden. Nada vence, nada arde.</span><span class="df">Firmado: el que manda</span></a>`;
  const [p, ...resto] = lista;
  return `<a class="w ancho decreto" href="#/urgente" aria-label="Abrir todo lo urgente">${sello}<span class="dk">Decreto real${lista.length > 1 ? " · " + lista.length : ""}</span>
    <span class="dt">Por orden del soberano: ${esc(p.titulo)}${p.monto ? ", " + esc(p.monto) : ""}. ${p.dias < 0 ? "Debió cumplirse: " + esc(cuandoTexto(p.dias)) : "Plazo: " + esc(cuandoTexto(p.dias))}.</span>
    <span class="df">${resto.length ? resto.length + (resto.length === 1 ? " decreto más ›" : " decretos más ›") : "Firmado: el que manda"}</span></a>`;
}

// TVA: debajo del reloj, la línea temporal con una rama por cada cosa vencida, y el sello de variante.
export function lineaTva(vencidos) {
  const ramas = Math.min(vencidos, 5);
  const xs = [28, 66, 104, 142, 180].slice(0, ramas);
  return `<div class="tva-bloque"><svg class="linea-tva" viewBox="0 0 220 36" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true">
    <path d="M4 26H216"/>${xs.map((x, i) => `<path d="M${x} 26c10 0 16-${10 + (i % 2) * 6} 30-${12 + (i % 2) * 6}" stroke-dasharray="2.5 3.5"/><circle cx="${x + 30}" cy="${14 - (i % 2) * 6}" r="2" fill="currentColor" stroke="none"/>`).join("")}
    <circle cx="110" cy="26" r="3.6" fill="currentColor" stroke="none"/></svg>
    <span class="tva-txt">Línea temporal sagrada · ${vencidos ? vencidos + (vencidos === 1 ? " rama" : " ramas") : "sin ramas"}</span>
    <span class="sello-tva">Variante detectada</span></div>`;
}
