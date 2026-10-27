// Listas que viven en tu planilla Orbe · datos: lo de Agus, el fútbol y los proyectos.
import { leer, guardar } from "./almacen.js";
import { leerRangos, agregar, escribir, aFecha } from "./hoja.js";
export { aFecha };

const si = (v) => /^(s[ií]|si|true|1|x)$/i.test(String(v ?? "").trim());

export const HOJAS_LISTAS = {
  // Las filas de arranque de AGUS (fechas, vuelos, docs) no están en este código público:
  // Orbe las copia de la planilla privada «Orbe · semillas» de tu Drive, si existe.
  AGUS: { cab: ["tipo", "titulo", "fecha", "nota", "hecho", "url"], filas: [], semillas: "AGUS" },
  FUTBOL: { cab: ["fecha", "resultado", "goles", "nota"], filas: [] },
  PROYECTOS: {
    cab: ["id", "nombre", "repo", "url", "estado", "proximos"],
    filas: [
      ["orbe", "Orbe", "sirathrion18/orbe", "https://orbe-5es.pages.dev/", "Activo", "Satélite (mini app Android); Transporte en vivo"],
      ["a64", "Archivo 64", "sirathrion18/archivo64", "https://sirathrion18.github.io/archivo64/", "Activo", "Sumar el bot de práctica"],
      ["mateshka", "Mateshka", "sirathrion18/mateshka", "https://sirathrion18.github.io/mateshka/", "Activo", "Feedback de Agus"],
      ["nexus", "Nexus", "", "", "En marcha", "Que corra sin ventana en la PC"],
      ["linea", "Línea Sagrada", "sirathrion18/linea-sagrada", "", "En pausa", "Repensar la v1"]
    ]
  }
};

export const datosListas = () => leer("listas");

export async function leerListas() {
  const [agus, futbol, proyectos] = await leerRangos(["AGUS!A2:F", "FUTBOL!A2:D", "PROYECTOS!A2:F"]);
  const l = {
    cuando: Date.now(),
    agus: agus.filter((f) => f[0]).map((f, i) => ({ tipo: String(f[0]).toLowerCase(), titulo: f[1] || "", fecha: aFecha(f[2]), nota: f[3] || "", hecho: si(f[4]), url: f[5] || "", fila: i + 2 })),
    futbol: futbol.filter((f) => f[0]).map((f, i) => ({ fecha: aFecha(f[0]).slice(0, 10), resultado: String(f[1] || "").toUpperCase().slice(0, 1), goles: Number(f[2]) || 0, nota: f[3] || "", fila: i + 2 })),
    proyectos: proyectos.filter((f) => f[0]).map((f, i) => ({ id: f[0], nombre: f[1] || f[0], repo: f[2] || "", url: f[3] || "", estado: f[4] || "",
      proximos: String(f[5] || "").split(";").map((x) => x.trim()).filter(Boolean), fila: i + 2 }))
  };
  guardar("listas", { ...l, github: leer("listas")?.github || {} }, true);
  return leer("listas");
}

export async function agregarAgus(tipo, titulo, fecha, nota, url) {
  await agregar("AGUS!A:F", [[tipo, titulo, fecha || "", nota || "", "", url || ""]]);
  return leerListas();
}
export async function tildarAgus(fila, hecho) {
  const it = datosListas()?.agus.find((x) => x.fila === fila);
  if (!it) return;
  await escribir("AGUS!A" + fila + ":F" + fila, [[it.tipo, it.titulo, it.fecha, it.nota, hecho ? "sí" : "", it.url]]);
  return leerListas();
}
export async function anotarPartido(fecha, resultado, goles, nota) {
  await agregar("FUTBOL!A:D", [[fecha, resultado, Number(goles) || 0, nota || ""]]);
  return leerListas();
}
export async function guardarProximos(id, proximos) {
  const p = datosListas()?.proyectos.find((x) => x.id === id);
  if (!p) return;
  await escribir("PROYECTOS!A" + p.fila + ":F" + p.fila, [[p.id, p.nombre, p.repo, p.url, p.estado, proximos.join("; ")]]);
  return leerListas();
}

// Último cambio de cada repo público en GitHub (sin cuenta; se guarda una hora).
export async function traerGithub() {
  const l = datosListas();
  if (!l) return;
  const gh = { ...(l.github || {}) };
  for (const p of l.proyectos.filter((x) => x.repo)) {
    if (gh[p.repo] && Date.now() - gh[p.repo].cuando < 3600000) continue;
    try {
      const r = await fetch("https://api.github.com/repos/" + p.repo + "/commits?per_page=1", { headers: { Accept: "application/vnd.github+json" } });
      if (r.status === 404) { gh[p.repo] = { cuando: Date.now(), privado: true }; continue; }
      if (!r.ok) continue;
      const [c] = await r.json();
      gh[p.repo] = { cuando: Date.now(), fecha: c?.commit?.author?.date, mensaje: (c?.commit?.message || "").split("\n")[0].slice(0, 90) };
    } catch (e) { /* sin red: se reintenta */ }
  }
  guardar("listas", { ...leer("listas"), github: gh }, true);
}

// Próxima vez que cae una fecha anual (aniversario, cumple) y cuántos días faltan.
export function proximaAnual(iso, desde) {
  const [, m, d] = iso.slice(0, 10).split("-").map(Number);
  const hoy = new Date(desde.getFullYear(), desde.getMonth(), desde.getDate());
  let f = new Date(hoy.getFullYear(), m - 1, d);
  if (f < hoy) f = new Date(hoy.getFullYear() + 1, m - 1, d);
  return { fecha: f, dias: Math.round((f - hoy) / 86400000) };
}
