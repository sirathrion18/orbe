// Datos públicos que no necesitan tu cuenta: dólar y River.
import { leer, guardar } from "./almacen.js";

const isoHoy = () => new Date().toISOString().slice(0, 10);

// Dólar oficial y MEP (dolarapi.com). Guarda uno por día para ver si se movió fuerte.
export async function traerDolar() {
  const g = leer("dolar");
  if (g && Date.now() - g.cuando < 30 * 60000) return g;
  try {
    const r = await fetch("https://dolarapi.com/v1/dolares");
    if (!r.ok) throw new Error("dolar");
    const j = await r.json();
    const de = (casa) => j.find((x) => x.casa === casa);
    const d = { cuando: Date.now(), oficial: de("oficial"), mep: de("bolsa"), blue: de("blue"), tarjeta: de("tarjeta") };
    const hist = leer("dolarHist", {});
    hist[isoHoy()] = { oficial: d.oficial?.venta, mep: d.mep?.venta };
    const dias = Object.keys(hist).sort().slice(-15);
    guardar("dolarHist", Object.fromEntries(dias.map((k) => [k, hist[k]])), true);
    guardar("dolar", d, true);
    return d;
  } catch (e) { return g || null; }
}

// Cuánto se movió el MEP contra el último día anterior guardado (en %).
export function movimientoDolar() {
  const hist = leer("dolarHist", {});
  const dias = Object.keys(hist).sort();
  if (dias.length < 2) return null;
  const hoy = hist[dias[dias.length - 1]], antes = hist[dias[dias.length - 2]];
  if (!hoy?.mep || !antes?.mep) return null;
  return { pct: (hoy.mep / antes.mep - 1) * 100, mep: hoy.mep };
}

export async function traerRiver() {
  const g = leer("river");
  if (g && Date.now() - g.cuando < 60 * 60000) return g;
  try {
    const r = await fetch("/api/river");
    if (!r.ok) throw new Error("river");
    const d = { ...(await r.json()), cuando: Date.now() };
    guardar("river", d, true);
    return d;
  } catch (e) { return g || null; }
}

// Subte en vivo (líneas E, H y A). Si la Ciudad todavía no te dio las credenciales, queda en espera sin molestar.
export async function traerTransporte() {
  const g = leer("transporte");
  if (g && Date.now() - g.cuando < 3 * 60000) return g;
  try {
    const r = await fetch("/api/transporte");
    const d = await r.json();
    if (!r.ok) { guardar("transporte", { cuando: Date.now(), error: d.error || "ciudad" }, true); return null; }
    guardar("transporte", d, true);
    return d;
  } catch (e) { return g || null; }
}

// Otros equipos que seguís (además de River): se piden por nombre y se guardan para ver sin señal.
export const EQUIPOS_INICIALES = ["Ferro", "Morón", "Racing", "Independiente"];
export const equiposSeguidos = () => leer("equiposSeguidos", EQUIPOS_INICIALES);
export async function traerEquipos(forzar) {
  const g = leer("equipos");
  const lista = equiposSeguidos();
  if (!forzar && g && g.pedidos === lista.join(",") && Date.now() - g.cuando < 3600000) return g;
  const r = await fetch("/api/equipos?q=" + encodeURIComponent(lista.join(",")));
  if (!r.ok) throw new Error("equipos");
  const j = await r.json();
  const d = { ...j, cuando: Date.now(), pedidos: lista.join(",") };
  guardar("equipos", d, true);
  return d;
}
