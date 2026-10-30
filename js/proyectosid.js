// La cara de cada proyecto: color, logo y en qué anillo del cosmos va.
// Es diseño, no datos: los proyectos y su estado vienen de tu planilla y de la central de Drive.

import { LOGOS } from "./logos.js";
import { leer, guardar } from "./almacen.js";

const svg = (cuerpo, vb = "0 0 24 24") => `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${cuerpo}</svg>`;
const B = "#f4f4f2";

export const IDENT = {
  satelite: { base: "#1b1b20", acc: "#e8364f", glow: "#ff3b5c",
    logo: svg(`<circle cx="11" cy="13.5" r="5.6" fill="none" stroke="${B}" stroke-width="2.6"/><circle cx="18.4" cy="6" r="2.8" fill="#e8364f"/>`) },
  semanal: { base: "#d8d5cd", acc: "#c8102e", glow: "#ffd9de",
    logo: svg(`<text x="12" y="17.2" text-anchor="middle" font-family="Georgia,serif" font-size="15"><tspan fill="#c8102e">E</tspan><tspan fill="#111">S</tspan></text>`) },
  nexus: { base: "#e05d00", acc: "#ffd2a8", glow: "#ff7a1a", anillo: true,
    logo: svg(`<circle cx="12" cy="12" r="8.4" fill="none" stroke="${B}" stroke-width="2.3"/><path d="M12 6.5v5.8l3.8 2" fill="none" stroke="${B}" stroke-width="2.3" stroke-linecap="round"/>`) },
  rastreador: { base: "#0e6a82", acc: "#67e8f9", glow: "#22d3ee",
    logo: svg(`<circle cx="10" cy="10" r="5.8" fill="none" stroke="${B}" stroke-width="2.4"/><path d="M14.6 14.6l5 5" stroke="${B}" stroke-width="2.6" stroke-linecap="round"/>`) },
  a64: { base: "#232327", acc: "#ff6a00", glow: "#ff7a1a",
    logo: svg(`<rect x="4" y="4" width="8" height="8" fill="#ff6a00"/><rect x="12" y="12" width="8" height="8" fill="#ff6a00"/><rect x="12" y="4" width="8" height="8" fill="#ffffff40"/><rect x="4" y="12" width="8" height="8" fill="#ffffff40"/>`) },
  mateshka: { base: "#6d32d6", acc: "#c4b5fd", glow: "#a78bfa",
    logo: svg(`<text x="12" y="17.6" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-weight="600" font-size="15" fill="${B}">М</text>`) },
  sur: { base: "#d98a06", acc: "#fde68a", glow: "#fbbf24",
    logo: svg(`<path d="M3 15.5h18M6.5 15.5a5.5 5.5 0 0111 0" fill="none" stroke="${B}" stroke-width="2.2" stroke-linecap="round"/>`) },
  linea: { base: "#2b1d10", acc: "#ff6a00", glow: "#ff8a3a",
    logo: svg(`<path d="M3 16h18M7 16c2.2-6.5 6.5-8.8 11-9.8" fill="none" stroke="#ff8a3a" stroke-width="2.2" stroke-dasharray="3 2.4" stroke-linecap="round"/>`) },
  orbe: { base: "#0b0b0e", acc: "#e8364f", glow: "#ff5a70",
    logo: svg(`<circle cx="11" cy="13" r="6.5" fill="none" stroke="${B}" stroke-width="3"/><circle cx="19" cy="5.5" r="2.6" fill="#e8364f"/>`) }
};

// Cómo se llama cada uno en Orbe (las fichas a veces tienen nombre largo).
export const NOMBRES = { satelite: "Satélite", semanal: "El Semanal", nexus: "Nexus", rastreador: "Rastreador", a64: "Archivo 64", mateshka: "Mateshka", sur: "SUR lo-fi", linea: "Línea Sagrada", orbe: "Orbe" };

// Nombre de la ficha de Drive → id del proyecto en Orbe.
const ALIAS = [
  [/sat[eé]lite/i, "satelite"], [/semanal|el diario/i, "semanal"], [/nexus/i, "nexus"], [/rastreador|buscador/i, "rastreador"],
  [/archivo\s*64|ajedrez/i, "a64"], [/mateshka|ruso/i, "mateshka"], [/sur\s*lo-?fi/i, "sur"], [/l[ií]nea sagrada/i, "linea"], [/^orbe\b/i, "orbe"]
];
// Fichas de la central que son universos o archivo, no proyectos: no van al cosmos.
const NO_PLANETA = /^(plata|bna|facu|viaje)\b|archivo de cerrados|contexto global/i;

export function idDeFicha(nombre) {
  const n = String(nombre || "").replace(/^ficha\s*·\s*/i, "").trim();
  if (NO_PLANETA.test(n)) return null;
  const a = ALIAS.find(([re]) => re.test(n));
  return a ? a[1] : slug(n);
}
export const slug = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 32) || "proyecto";

// Un proyecto nuevo que aparece en la central toma un color propio (estable) y su inicial como logo.
const PALETA = [["#0f766e", "#5eead4"], ["#9d174d", "#f9a8d4"], ["#3f6212", "#bef264"], ["#7c2d12", "#fdba74"], ["#1e3a5f", "#93c5fd"], ["#4c1d95", "#d8b4fe"], ["#7f1d1d", "#fca5a5"]];
// El logo elegido de cada proyecto (se sincroniza entre el celu y la compu).
export const logoElegido = (id) => Math.max(0, Math.min((LOGOS[id]?.length || 1) - 1, Number(leer("logos", {})[id]) || 0));
export function elegirLogo(id, i) { const l = { ...leer("logos", {}) }; l[id] = Number(i) || 0; guardar("logos", l); }
export const opcionesLogo = (id) => (LOGOS[id] || []).map((c) => svg(c));
export function identidad(id, nombre) {
  if (IDENT[id]) return LOGOS[id] ? { ...IDENT[id], logo: svg(LOGOS[id][logoElegido(id)]) } : IDENT[id];
  let h = 0; for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const [base, acc] = PALETA[h % PALETA.length];
  const ini = (String(nombre || id).trim()[0] || "?").toUpperCase().replace(/[<>&"]/g, "");
  return { base, acc, glow: acc, nuevo: true,
    logo: svg(`<text x="12" y="17" text-anchor="middle" font-family="Georgia, serif" font-size="14" fill="${B}">${ini}</text>`) };
}

// Insignia redonda para las páginas (la misma que se ve en el cosmos).
export function insigniaHtml(id, nombre, tam = 44) {
  const i = identidad(id, nombre);
  return `<span class="insignia" style="width:${tam}px;height:${tam}px;background:${i.base};box-shadow:0 0 0 1px ${i.glow}55, 0 0 18px ${i.glow}33">${i.logo}</span>`;
}
