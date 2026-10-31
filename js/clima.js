// Clima: la página propia (ahora, por horas, la semana, radar, alertas del SMN y «¿llevo paraguas?»).
// Pronóstico: Open-Meteo (gratis, sin clave). Radar: RainViewer (últimas 2 h, toma los radares del SMN).
// Alertas: el aviso oficial del SMN (CAP), leído por el servidor de Orbe. El lugar lo elegís vos y queda en tu planilla.
import { leer, guardar } from "./almacen.js";
import { bloquesFecha } from "./contexto.js";
import { ICONOS } from "./iconos.js";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const MEDIA_HORA = 30 * 60 * 1000;
const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const DIAS_L = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

// ---------- Lugar ----------
export function lugar(datos) {
  const l = leer("lugarClima");
  if (l && typeof l.lat === "number") return l;
  const c = datos?.ciudad || { nombre: "CABA", lat: -34.61, lon: -58.38 };
  return { nombre: c.nombre || "CABA", lat: c.lat, lon: c.lon };
}

// ---------- Datos ----------
export async function traerPronostico(l, forzar) {
  const g = leer("pronostico");
  if (!forzar && g && g.lat === l.lat && g.lon === l.lon && Date.now() - g.cuando < MEDIA_HORA) return g;
  const q = new URLSearchParams({
    latitude: l.lat, longitude: l.lon, timezone: "America/Argentina/Buenos_Aires", forecast_days: "8", wind_speed_unit: "kmh",
    current: "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,is_day,wind_speed_10m,wind_direction_10m",
    hourly: "temperature_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,is_day,wind_speed_10m",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,sunrise,sunset,uv_index_max,wind_speed_10m_max",
  });
  const r = await fetch("https://api.open-meteo.com/v1/forecast?" + q);
  if (!r.ok) throw new Error("clima");
  const j = await r.json();
  const p = { cuando: Date.now(), lat: l.lat, lon: l.lon, current: j.current, hourly: j.hourly, daily: j.daily };
  guardar("pronostico", p);
  return p;
}

// Alertas del SMN para tu punto (las arma el servidor de Orbe; si el SMN no responde, no se muestra nada).
export async function traerAlertas(l) {
  const g = leer("alertasSmn");
  if (g && g.lat === l.lat && Date.now() - g.cuando < MEDIA_HORA) return g;
  const r = await fetch(`/api/alertas?lat=${l.lat}&lon=${l.lon}`, { credentials: "same-origin" });
  const j = await r.json().catch(() => ({}));
  const a = { cuando: Date.now(), lat: l.lat, alertas: Array.isArray(j.alertas) ? j.alertas : [], ok: r.ok && !j.error };
  guardar("alertasSmn", a);
  return a;
}

// Códigos WMO a estado, dibujo y escena animada.
export function estado(codigo, dia = true) {
  const c = Number(codigo);
  let e = { t: "Variable", k: "parcial", esc: "nubes" };
  if (c === 0) e = { t: "Despejado", k: "sol", esc: "sol" };
  else if (c <= 2) e = { t: c === 1 ? "Mayormente despejado" : "Algo nublado", k: "parcial", esc: "sol" };
  else if (c === 3) e = { t: "Nublado", k: "nube", esc: "nubes" };
  else if (c === 45 || c === 48) e = { t: "Niebla", k: "niebla", esc: "niebla" };
  else if (c >= 51 && c <= 57) e = { t: "Llovizna", k: "lluvia", esc: "lluvia" };
  else if (c >= 61 && c <= 67) e = { t: c >= 65 ? "Lluvia fuerte" : "Lluvia", k: "lluvia", esc: "lluvia" };
  else if (c >= 71 && c <= 77) e = { t: "Nieve", k: "nube", esc: "nubes" };
  else if (c >= 80 && c <= 82) e = { t: "Chaparrones", k: "lluvia", esc: "lluvia" };
  else if (c >= 95) e = { t: "Tormenta", k: "tormenta", esc: "tormenta" };
  if (!dia) { if (e.k === "sol" || e.k === "parcial") e = { ...e, k: e.k === "sol" ? "luna" : "lunanube" }; if (e.esc === "sol") e = { ...e, esc: "noche" }; }
  return e;
}
const SVG = {
  sol: '<circle cx="24" cy="24" r="8" fill="none" stroke="#F08A3C" stroke-width="2.4"/><g stroke="#F08A3C" stroke-width="2.4" stroke-linecap="round"><path d="M24 6v5M24 37v5M6 24h5M37 24h5M11.3 11.3l3.5 3.5M33.2 33.2l3.5 3.5M11.3 36.7l3.5-3.5M33.2 14.8l3.5-3.5"/></g>',
  luna: '<path d="M30 10a14 14 0 1 0 8 22 11 11 0 1 1-8-22z" fill="none" stroke="currentColor" stroke-width="2.2" opacity=".8"/>',
  parcial: '<circle cx="18" cy="17" r="6.5" fill="none" stroke="#F08A3C" stroke-width="2.2"/><path d="M15 36h20a7 7 0 0 0 0-14 9 9 0 0 0-17 2 6 6 0 0 0-3 12z" style="fill:var(--tile)" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/>',
  lunanube: '<path d="M21 8a9 9 0 1 0 6 15 7 7 0 1 1-6-15z" fill="none" stroke="currentColor" stroke-width="2" opacity=".7"/><path d="M15 38h20a7 7 0 0 0 0-14 9 9 0 0 0-17 2 6 6 0 0 0-3 12z" style="fill:var(--tile)" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/>',
  nube: '<path d="M13 35h22a8 8 0 0 0 0-16 10 10 0 0 0-19 2 7 7 0 0 0-3 14z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/>',
  lluvia: '<path d="M13 28h22a8 8 0 0 0 0-16 10 10 0 0 0-19 2 7 7 0 0 0-3 14z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><g class="cl-azul" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M17 33l-2 5M25 33l-2 5M33 33l-2 5"/></g>',
  tormenta: '<path d="M13 27h22a8 8 0 0 0 0-16 10 10 0 0 0-19 2 7 7 0 0 0-3 14z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M26 29l-5 8h6l-4 7" fill="none" stroke="#C8102E" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>',
  niebla: '<g stroke="currentColor" stroke-width="2.2" stroke-linecap="round" opacity=".7"><path d="M9 18h30M13 25h28M8 32h28M14 39h22"/></g>',
};
export const icono = (k) => `<svg viewBox="0 0 48 48" aria-hidden="true">${SVG[k] || SVG.parcial}</svg>`;
const rumbo = (g) => ["N", "NE", "E", "SE", "S", "SO", "O", "NO"][Math.round(((g % 360) + 360) % 360 / 45) % 8];
const uvTxt = (u) => u < 3 ? "Bajo" : u < 6 ? "Moderado" : u < 8 ? "Alto" : u < 11 ? "Muy alto" : "Extremo";
const hh = (iso) => iso.slice(11, 16);
const isoDia = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");

// Las horas que vienen (desde la actual) y las de un día puntual.
function horasDesde(p, ahora, n) {
  const h = p.hourly, clave = isoDia(ahora) + "T" + String(ahora.getHours()).padStart(2, "0");
  let i = h.time.findIndex((t) => t.startsWith(clave)); if (i < 0) i = 0;
  return h.time.slice(i, i + n).map((t, k) => ({ t, temp: Math.round(h.temperature_2m[i + k]), pp: h.precipitation_probability?.[i + k] ?? 0, mm: h.precipitation?.[i + k] ?? 0, cod: h.weather_code[i + k], dia: !!h.is_day[i + k] }));
}
function horasDelDia(p, iso) {
  const h = p.hourly;
  return h.time.map((t, i) => ({ t, i })).filter((x) => x.t.startsWith(iso)).map(({ t, i }) => ({ t, temp: Math.round(h.temperature_2m[i]), pp: h.precipitation_probability?.[i] ?? 0, mm: h.precipitation?.[i] ?? 0, cod: h.weather_code[i], dia: !!h.is_day[i] }));
}

// ---------- ¿Llevo paraguas? ----------
// Mira las salidas del día (BNA, facu, gym, fútbol…) y la lluvia a la hora de ir y de volver.
const SALIDAS = { bna: ["al BNA", "del BNA"], ufasta: ["a la facu", "de la facu"], gym: ["al gym", "del gym"], futbol: ["al fútbol", "del fútbol"], river: ["a la cancha", "de la cancha"], ntn: ["a NTN", "de NTN"], agus: ["a lo de Agus", "de lo de Agus"] };
export function paraguas(p, datos, ahora) {
  const tarde = ahora.getHours() >= 21;
  const dia = new Date(ahora); if (tarde) dia.setDate(dia.getDate() + 1);
  const iso = isoDia(dia), hs = horasDelDia(p, iso);
  const pp = (min) => { const x = hs[Math.min(23, Math.max(0, Math.floor(min / 60)))]; return x ? x.pp : 0; };
  const cuando = tarde ? "Mañana" : "Hoy";
  let bloques = [];
  try { bloques = bloquesFecha(datos, dia).filter((b) => SALIDAS[b.tipo]); } catch (e) { /* sin agenda */ }
  const riesgos = [];
  for (const b of bloques) {
    if (!tarde && b.fin < ahora.getHours() * 60 + ahora.getMinutes() - 30) continue;
    const ida = Math.max(pp(b.ini - 45), pp(b.ini)), vuelta = Math.max(pp(b.fin), pp(b.fin + 45));
    if (ida >= 40) riesgos.push({ pp: ida, txt: `a la ida ${SALIDAS[b.tipo][0]} (${String(Math.floor(b.ini / 60)).padStart(2, "0")} h)` });
    if (vuelta >= 40) riesgos.push({ pp: vuelta, txt: `a la vuelta ${SALIDAS[b.tipo][1]} (${String(Math.floor(b.fin / 60)).padStart(2, "0")} h)` });
  }
  const max = Math.max(0, ...hs.slice(tarde ? 6 : ahora.getHours()).map((x) => x.pp));
  if (riesgos.length) { const r = riesgos.sort((a, b) => b.pp - a.pp)[0]; return { si: true, txt: `Llevá paraguas: ${r.txt} hay ${r.pp} % de lluvia.` }; }
  if (max >= 50) { const h = hs.find((x) => x.pp === max); return { si: true, txt: `${cuando} puede llover (${max} % ${franja(h ? Number(h.t.slice(11, 13)) : 15)}). Si salís, llevá paraguas.` }; }
  if (max >= 25) return { si: false, txt: `${cuando} hay poca chance de lluvia (${max} %). El paraguas, opcional.` };
  return { si: false, txt: `${cuando} no hace falta paraguas.` };
}
const franja = (h) => h < 6 ? "de madrugada" : h < 12 ? "a la mañana" : h < 19 ? "a la tarde" : "a la noche";

// ---------- Pantalla ----------
let abierto = null; // día de la semana desplegado
const volver = `<a class="volver" href="#/">${ICONOS.volver} Inicio</a>`;

function curva(horas, ahoraIdx = 0) {
  if (!horas.length) return "";
  const W = 52, H = 150, ts = horas.map((x) => x.temp), mn = Math.min(...ts), mx = Math.max(...ts);
  const y = (t) => 104 - (t - mn) / (mx - mn || 1) * 40;
  const pts = horas.map((x, i) => [i * W + W / 2, y(x.temp)]);
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], cx = (x0 + x1) / 2; d += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`; }
  const barras = horas.map((x, i) => x.pp ? `<rect x="${i * W + 14}" y="${H - 16 - x.pp * .3}" width="24" height="${x.pp * .3}" rx="3" class="cl-azul" style="fill:currentColor;opacity:.3"/>` : "").join("");
  const svg = `<svg class="cl-linea" width="${W * horas.length}" height="${H}" aria-hidden="true"><path d="${d}" style="fill:none;stroke:var(--accent);stroke-width:2.4"/>${pts.map(([x, yy], i) => `<circle cx="${x}" cy="${yy}" r="${i === ahoraIdx ? 4.5 : 2.5}" style="fill:${i === ahoraIdx ? "var(--accent)" : "var(--text)"}"/>`).join("")}${barras}</svg>`;
  const cols = horas.map((x, i) => `<div class="cl-h${i === ahoraIdx ? " ahora" : ""}" style="left:${i * W}px;height:${H}px"><span class="hh">${i === ahoraIdx ? "Ahora" : x.t.slice(11, 13)}</span>${icono(estado(x.cod, x.dia).k)}<span class="tt" style="top:${y(x.temp) - 24}px">${x.temp}°</span><span class="pp cl-azul">${x.pp ? x.pp + "%" : ""}</span></div>`).join("");
  return `<div class="cl-scroll"><div class="cl-curva" style="width:${W * horas.length}px;height:${H}px">${svg}${cols}</div></div>`;
}

// Animación del cielo según el clima (sutil, se apaga con «reducir movimiento»).
function cielo(esc) {
  const r = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join("");
  if (esc === "lluvia" || esc === "tormenta") return `<div class="cl-cielo ${esc}">${r(22, (i) => `<i style="left:${(i * 37) % 100}%;animation-delay:${((i * 0.29) % 1.2).toFixed(2)}s;animation-duration:${(0.8 + (i % 5) * 0.12).toFixed(2)}s"></i>`)}${esc === "tormenta" ? '<b class="rayo"></b>' : ""}</div>`;
  if (esc === "noche") return `<div class="cl-cielo noche">${r(14, (i) => `<i style="left:${(i * 41 + 7) % 96}%;top:${(i * 17 + 4) % 34}%;animation-delay:${(i * 0.37 % 3).toFixed(2)}s"></i>`)}</div>`;
  if (esc === "sol") return '<div class="cl-cielo sol"><b></b></div>';
  if (esc === "niebla") return '<div class="cl-cielo niebla"><b></b><b></b></div>';
  return '<div class="cl-cielo nubes"><b></b><b></b></div>';
}

export function renderClima(datos) {
  const l = lugar(datos), p = leer("pronostico"), al = leer("alertasSmn");
  const cab = `${volver}<h1 class="cl-tit">Clima</h1><button class="cl-lugar" data-cl="lugar" aria-label="Cambiar el lugar">📍 <span>${esc(l.nombre)}</span><small>cambiar</small></button>`;
  const elegir = leer("lugarClima") ? "" : `<section class="bloque cl-elegir"><b>¿Desde dónde mirás el clima?</b><p class="vacio">Ahora uso CABA en general. Elegí tu barrio para que sea preciso.</p><div class="chips"><button class="chip on" data-cl="lugar">Elegir lugar</button><button class="chip" data-cl="gps">Usar mi ubicación</button></div></section>`;
  if (!p || p.lat !== l.lat || p.lon !== l.lon) return `<div class="pagina clima-pag">${cab}${elegir}<section class="bloque"><p class="vacio">Trayendo el pronóstico…</p></section></div>`;
  const ahora = new Date(), c = p.current, d = p.daily, e = estado(c.weather_code, !!c.is_day);
  const proximas = horasDesde(p, ahora, 25);
  const maxPP = Math.max(0, ...proximas.slice(0, 12).map((x) => x.pp));
  const cuandoLlueve = maxPP >= 30 ? proximas.find((x) => x.pp === maxPP) : null;
  const linea = cuandoLlueve ? `${estado(cuandoLlueve.cod, cuandoLlueve.dia).k === "tormenta" ? "Puede haber tormenta" : "Puede llover"} ${franja(Number(cuandoLlueve.t.slice(11, 13)))} (${maxPP} %)` : maxPP ? `Poca chance de lluvia en las próximas horas` : `Sin lluvia en las próximas horas`;
  const alertas = (al?.alertas || []).map((a) => `<div class="cl-alerta n-${esc(a.nivel || "amarilla")}"><b>Alerta ${esc(a.nivel || "")} por ${esc((a.evento || "").toLowerCase())}</b><span>${esc(a.cuando || "")}</span>${a.texto ? `<details><summary>Qué dice el SMN</summary><p>${esc(a.texto)}</p></details>` : ""}</div>`).join("");
  const pg = paraguas(p, datos, ahora);
  const hero = `<section class="cl-hero esc-${e.esc}">${cielo(e.esc)}<span class="t">${Math.round(c.temperature_2m)}°</span>${icono(e.k)}<span class="est">${e.t}</span>
    <span class="s">Sensación ${Math.round(c.apparent_temperature)}° · ↑${Math.round(d.temperature_2m_max[0])}° ↓${Math.round(d.temperature_2m_min[0])}°</span><span class="s">${linea}</span></section>
    <div class="cl-datos"><div><b>${Math.round(c.relative_humidity_2m)} %</b><small>Humedad</small></div><div><b>${Math.round(c.wind_speed_10m)} km/h</b><small>Viento ${rumbo(c.wind_direction_10m)}</small></div><div><b>UV ${Math.round(d.uv_index_max[0])}</b><small>${uvTxt(d.uv_index_max[0])}</small></div><div><b>${ahora.getHours() < 12 && hh(d.sunrise[0]) > `${String(ahora.getHours()).padStart(2, "0")}:00` ? hh(d.sunrise[0]) : hh(d.sunset[0])}</b><small>${ahora.getHours() < 12 && hh(d.sunrise[0]) > `${String(ahora.getHours()).padStart(2, "0")}:00` ? "Amanecer" : "Atardecer"}</small></div></div>
    <div class="cl-paraguas${pg.si ? " si" : ""}"><span aria-hidden="true">${pg.si ? "☂️" : "🌂"}</span><p>${esc(pg.txt)}</p></div>`;
  const gmn = Math.min(...d.temperature_2m_min.slice(0, 7)), gmx = Math.max(...d.temperature_2m_max.slice(0, 7));
  const semana = `<ul class="cl-sem">${d.time.slice(0, 7).map((iso, i) => {
    const f = new Date(iso + "T12:00"), a = Math.round(d.temperature_2m_min[i]), b = Math.round(d.temperature_2m_max[i]), pp = d.precipitation_probability_max?.[i] ?? 0;
    const ab = abierto === iso;
    return `<li class="${ab ? "ab" : ""}"><button class="cl-dia" data-cl="dia" data-iso="${iso}" aria-expanded="${ab}"><span class="d">${i === 0 ? "Hoy" : i === 1 ? "Mañana" : DIAS[f.getDay()]}</span>${icono(estado(d.weather_code[i]).k)}<span class="pp cl-azul">${pp ? pp + "%" : ""}</span><span class="mn">${a}°</span><span class="cl-bar"><i style="left:${(a - gmn) / (gmx - gmn || 1) * 100}%;right:${100 - (b - gmn) / (gmx - gmn || 1) * 100}%"></i></span><b>${b}°</b></button>
      ${ab ? `<div class="cl-det"><p>${DIAS_L[f.getDay()][0].toUpperCase() + DIAS_L[f.getDay()].slice(1)} ${f.getDate()}: ${estado(d.weather_code[i]).t.toLowerCase()}${d.precipitation_sum?.[i] ? `, ${String(Math.round(d.precipitation_sum[i] * 10) / 10).replace(".", ",")} mm de lluvia` : ""}. Viento hasta ${Math.round(d.wind_speed_10m_max[i])} km/h · UV ${Math.round(d.uv_index_max[i])} · sol ${hh(d.sunrise[i])}–${hh(d.sunset[i])}.</p>${curva(horasDelDia(p, iso), i === 0 ? ahora.getHours() : -1)}</div>` : ""}</li>`;
  }).join("")}</ul>`;
  const radar = `<h3 class="cl-h2">Radar · últimas 2 horas</h3><div class="cl-radar" id="cl-radar" data-lat="${l.lat}" data-lon="${l.lon}"><p class="vacio">Cargando el radar…</p></div>`;
  const fuente = `<p class="fuente-dato">Pronóstico: Open-Meteo, actualizado ${new Date(p.cuando).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })} · <button class="link" data-cl="refrescar">Actualizar</button><br>Radar: RainViewer con los radares del SMN · Mapa © OpenStreetMap, © CARTO${al?.ok === false ? "<br>Las alertas del SMN no respondieron; se reintenta solo." : ""}</p>`;
  return `<div class="pagina clima-pag">${cab}${elegir}${alertas}${hero}<h3 class="cl-h2">Por horas</h3>${curva(proximas, 0)}<h3 class="cl-h2">La semana <small>tocá un día</small></h3>${semana}${radar}${fuente}</div>`;
}

// ---------- Radar (RainViewer + mapa base de CARTO, sin librerías) ----------
let radarVivo = null, indiceRadar = null;
function tileXY(lat, lon, z) {
  const n = 2 ** z, x = (lon + 180) / 360 * n, r = lat * Math.PI / 180;
  return { x, y: (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * n };
}
export async function montarRadar() {
  const caja = document.getElementById("cl-radar");
  if (radarVivo) { clearInterval(radarVivo); radarVivo = null; }
  if (!caja) return;
  const lat = Number(caja.dataset.lat), lon = Number(caja.dataset.lon);
  let m = indiceRadar && Date.now() - indiceRadar.t < 300000 ? indiceRadar.m : null;
  try { if (!m) { m = await fetch("https://api.rainviewer.com/public/weather-maps.json").then((r) => r.json()); indiceRadar = { t: Date.now(), m }; } }
  catch (e) { caja.innerHTML = '<p class="vacio">El radar no respondió. Probá en un rato.</p>'; return; }
  if (!document.body.contains(caja)) return;
  const cuadros = (m.radar?.past || []).slice(-12);
  if (!cuadros.length) { caja.innerHTML = '<p class="vacio">Sin imágenes de radar ahora.</p>'; return; }
  // Radar en zoom 7 (el máximo gratis), ampliado al doble; el mapa base en zoom 8 para que se vea nítido.
  const Z = 7, ESC = 2, W = caja.clientWidth || 350, H = 280;
  const p = tileXY(lat, lon, Z), cx = p.x * 256 * ESC, cy = p.y * 256 * ESC;
  const ox = cx - W / 2, oy = cy - H / 2;
  const oscuro = document.documentElement.dataset.theme === "oscuro";
  const base = [], capas = [];
  const t8 = 256; // cada tile de zoom 8 mide 256 px a esta escala
  for (let x = Math.floor(ox / t8); x <= Math.floor((ox + W) / t8); x++) for (let y = Math.floor(oy / t8); y <= Math.floor((oy + H) / t8); y++)
    base.push(`<img src="https://${"abcd"[(x + y) % 4]}.basemaps.cartocdn.com/${oscuro ? "dark_all" : "light_all"}/8/${x}/${y}@2x.png" style="left:${x * t8 - ox}px;top:${y * t8 - oy}px;width:${t8}px;height:${t8}px" alt="">`);
  const tR = 256 * ESC;
  cuadros.forEach((c, k) => {
    const imgs = [];
    for (let x = Math.floor(ox / tR); x <= Math.floor((ox + W) / tR); x++) for (let y = Math.floor(oy / tR); y <= Math.floor((oy + H) / tR); y++)
      imgs.push(`<img src="${m.host}${c.path}/256/${Z}/${x}/${y}/2/1_1.png" style="left:${x * tR - ox}px;top:${y * tR - oy}px;width:${tR}px;height:${tR}px" alt="">`);
    capas.push(`<div class="cl-capa" data-k="${k}"${k === cuadros.length - 1 ? ' style="opacity:1"' : ""}>${imgs.join("")}</div>`);
  });
  caja.innerHTML = `<div class="cl-mapa" style="height:${H}px">${base.join("")}${capas.join("")}<span class="cl-yo" style="left:${W / 2}px;top:${H / 2}px"></span><span class="cl-hora"></span></div>`;
  const hora = caja.querySelector(".cl-hora"), cs = [...caja.querySelectorAll(".cl-capa")];
  let i = cs.length - 1, pausa = 0;
  const mostrar = () => {
    cs.forEach((el, k) => { el.style.opacity = k === i ? "1" : "0"; });
    const min = Math.round((Date.now() / 1000 - cuadros[i].time) / 60);
    hora.textContent = min <= 10 ? "Ahora" : `Hace ${min >= 60 ? Math.floor(min / 60) + " h " + (min % 60 ? (min % 60) + " min" : "") : min + " min"}`;
  };
  mostrar();
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  radarVivo = setInterval(() => {
    if (!document.body.contains(caja)) { clearInterval(radarVivo); radarVivo = null; return; }
    if (document.hidden) return;
    if (i === cs.length - 1 && pausa < 3) { pausa++; return; }
    pausa = 0; i = (i + 1) % cs.length; mostrar();
  }, 550);
}

// ---------- Elegir el lugar ----------
async function buscarLugar(texto) {
  const r = await fetch("https://geocoding-api.open-meteo.com/v1/search?" + new URLSearchParams({ name: texto, count: "8", language: "es", format: "json" }));
  const j = await r.json();
  return (j.results || []).map((x) => ({ nombre: x.name, lat: Math.round(x.latitude * 1000) / 1000, lon: Math.round(x.longitude * 1000) / 1000, zona: [x.admin2, x.admin1, x.country_code === "AR" ? "" : x.country].filter(Boolean).join(", ") }));
}
function hojaLugar(repintar) {
  document.querySelector(".cl-hoja")?.remove();
  const h = document.createElement("div");
  h.className = "cl-hoja"; h.setAttribute("role", "dialog"); h.setAttribute("aria-label", "Elegir el lugar del clima");
  h.innerHTML = `<div class="cl-hoja-in"><b>¿Dónde querés el clima?</b><form class="form" data-cl-form="buscar"><input name="q" placeholder="Barrio o ciudad (ej.: Parque Chacabuco)" autocomplete="off" required><button class="btn">Buscar</button></form>
    <div class="cl-res"></div><button class="chip" data-cl="gps">📍 Usar mi ubicación</button><button class="chip" data-cl="cerrar-hoja" style="margin-left:6px">Cancelar</button></div>`;
  document.body.append(h);
  setTimeout(() => h.querySelector("input")?.focus(), 50);
  h.addEventListener("click", (e) => { if (e.target === h) h.remove(); });
  h.addEventListener("submit", async (e) => {
    e.preventDefault();
    const q = new FormData(e.target).get("q"), res = h.querySelector(".cl-res");
    res.innerHTML = '<p class="vacio">Buscando…</p>';
    try {
      const l = await buscarLugar(q);
      res.innerHTML = l.length ? l.map((x, i) => `<button class="cl-op" data-i="${i}"><b>${esc(x.nombre)}</b><small>${esc(x.zona)}</small></button>`).join("") : '<p class="vacio">No encontré ese lugar. Probá con otro nombre o con tu ubicación.</p>';
      res.querySelectorAll(".cl-op").forEach((b) => b.addEventListener("click", () => { const x = l[Number(b.dataset.i)]; guardar("lugarClima", { nombre: x.nombre, lat: x.lat, lon: x.lon }); h.remove(); repintar(true); }));
    } catch (err) { res.innerHTML = '<p class="vacio">Sin señal para buscar. Probá de nuevo.</p>'; }
  });
}
function ubicacion(repintar, aviso) {
  if (!navigator.geolocation) { aviso?.("Este navegador no da la ubicación"); return; }
  navigator.geolocation.getCurrentPosition((pos) => {
    // Redondeado a ~1 km: alcanza para el clima y no guarda tu dirección exacta.
    const actual = leer("lugarClima");
    guardar("lugarClima", { nombre: actual?.nombre && actual.gps ? actual.nombre : "Tu ubicación", gps: true, lat: Math.round(pos.coords.latitude * 100) / 100, lon: Math.round(pos.coords.longitude * 100) / 100 });
    document.querySelector(".cl-hoja")?.remove(); repintar(true);
  }, () => aviso?.("No me diste permiso de ubicación"), { maximumAge: 600000, timeout: 10000 });
}

// ---------- Toques (se engancha una vez) ----------
export function conectarClima({ repintar, aviso }) {
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-cl]");
    if (!b) return;
    const t = b.dataset.cl;
    if (t === "lugar") hojaLugar(repintar);
    else if (t === "gps") ubicacion(repintar, aviso);
    else if (t === "cerrar-hoja") document.querySelector(".cl-hoja")?.remove();
    else if (t === "dia") { abierto = abierto === b.dataset.iso ? null : b.dataset.iso; repintar(true); }
    else if (t === "refrescar") { const l = lugar(); traerPronostico(l, true).then(() => repintar(true)).catch(() => aviso?.("Sin señal: probá en un rato")); }
  });
}
// Al entrar a la página: trae lo que falte y arranca el radar.
export function alEntrar(datos, repintar) {
  const l = lugar(datos), p = leer("pronostico");
  if (!p || p.lat !== l.lat || p.lon !== l.lon || Date.now() - p.cuando > MEDIA_HORA) traerPronostico(l).then(() => repintar(true)).catch(() => {});
  const a = leer("alertasSmn");
  if (!a || a.lat !== l.lat || Date.now() - a.cuando > MEDIA_HORA) traerAlertas(l).then((x) => { if (x.alertas.length || x.ok === false) repintar(true); }).catch(() => {});
  montarRadar();
}
