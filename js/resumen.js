// Lo que Orbe le pasa a El Semanal: una planilla chiquita aparte, «Orbe · resumen para El Semanal», con una sola hoja
// (RESUMEN) y los números que Orbe ya calculó. Va aparte de «Orbe · datos» porque así la tarea del domingo la baja
// entera como CSV, sin recortes. Cada renglón: sección, clave, valor y de dónde sale. Orbe la reescribe sola.
import { leer, guardar } from "./almacen.js";
import { api, permisos } from "./google.js";
import { VERSION, UNIVERSOS } from "./config.js";
import { DIAS, bloquesFecha, sumaTipo, urgentes, lunesDe } from "./contexto.js";
import { presupuesto } from "./presupuesto.js";
import { datosFinanzas, pendientesDeTarjetas } from "./finanzas.js";
import { datosProd, historial, metaDe } from "./productividad.js";
import { datosFacu } from "./facu.js";
import { datosListas, proximaAnual } from "./listas.js";

export const NOMBRE_RESUMEN = "Orbe · resumen para El Semanal";
const CAB = ["seccion", "clave", "valor", "detalle"];
const FILAS_MAX = 220;

const iso = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const $ = (n) => n == null || !Number.isFinite(n) ? "" : Math.round(n);
const hhmm = (min) => String(Math.floor(min / 60)).padStart(2, "0") + ":" + String(min % 60).padStart(2, "0");
const hm = (b) => hhmm(b.ini) + "–" + hhmm(b.fin);

export function armarResumen(datos, ctx) {
  const hoy = ctx.fecha, filas = [];
  const fila = (s, k, v, d = "") => filas.push([s, k, v == null ? "" : v, d]);
  const parte = (nombre, fn) => { try { fn(); } catch (e) { fila(nombre, "error", "", "Orbe no pudo armar esta parte: " + e.message); } };

  fila("meta", "actualizado", new Date().toISOString(), "Última vez que Orbe reescribió esta hoja (Orbe la actualiza cuando lo abrís).");
  fila("meta", "version", VERSION, "");

  parte("contexto", () => {
    for (let i = 1; i <= 7; i++) {
      const d = i % 7, h = leer("horario", {})[d];
      fila("contexto", "horario_" + DIAS[d], h && h.inicio && h.fin ? h.inicio + "–" + h.fin : "", "Horario fijo del BNA cargado en Orbe (vacío = no trabaja).");
    }
    const ag = UNIVERSOS.find((u) => u.id === "agus");
    fila("contexto", "universo_pareja", ag?.nombre || "", "Cómo se llama en Orbe lo de los dos.");
    const proys = datosListas()?.proyectos || [];
    fila("contexto", "proyectos", proys.map((p) => p.nombre).join("; "), "Proyectos activos en Orbe.");
    Object.entries(datos.tipos || {}).forEach(([k, t]) => fila("contexto", "color_" + k, t.claro, "Color de " + t.nombre + " en Orbe (modo claro)."));
  });

  parte("plata", () => {
    const b = presupuesto(hoy), p = b.p;
    fila("plata", "periodo", iso(p.inicio) + " → " + iso(p.fin), "De cobro a cobro; columna " + p.nombre + " de ECONOMÍA.");
    fila("plata", "ingreso", $(b.ingreso?.monto), b.ingreso?.fuente || "");
    fila("plata", "egresos_planilla", $(b.total), "TOTAL de la columna " + p.nombre + " de ECONOMÍA (con sus redondeos).");
    fila("plata", "tarjeta_periodo_anterior", $(b.tarjetaAnterior), "Compras con tarjeta del período anterior que ya contaron y se descuentan del resumen.");
    fila("plata", "base", $(b.base), "Ingreso − egresos + tarjeta del período anterior: lo que hay para el día a día.");
    fila("plata", "diario_hoy", $(b.diario), "Lo que se puede gastar hoy.");
    fila("plata", "gastado_periodo", $(b.gastoTotal), "Gastos que cuentan en el diario, desde el cobro.");
    fila("plata", "queda_periodo", $(b.queda), "Base − gastado.");
    fila("plata", "dias_restantes", p.restantes, "Hoy incluido.");
    fila("plata", "proximo_cobro", iso(p.proximo), p.extrasProximo || "");
    fila("plata", "colchon_agus", $(b.agus), "Lo que pasó Agus por la división en el período (no entra al diario).");
    fila("plata", "colchon_esperado", $(b.esperadoAgus), "Su mitad de la división menos los ajustes acordados.");
    (b.ajustes || []).forEach((a) => fila("plata", "ajuste", a.concepto + ": −" + $(a.monto), "cuota " + a.cuota + " de " + a.cuotas));
    const desde = new Date(hoy); desde.setDate(desde.getDate() - 6); desde.setHours(0, 0, 0, 0);
    const semana = (b.contados || []).filter((m) => m.ts >= desde.getTime());
    const porRubro = {};
    let total = 0;
    // Mismo criterio que el diario: de lo compartido, tu mitad; las devoluciones restan.
    semana.forEach((m) => { const v = (m.monto || 0) * (m.mitad ? 0.5 : 1) * (m.clase === "devolucion" ? -1 : 1); total += v; porRubro[m.rubro || "Sin rubro"] = (porRubro[m.rubro || "Sin rubro"] || 0) + v; });
    fila("plata", "gastos_7_dias", $(total), "Del " + iso(desde) + " a hoy, lo que cuenta en el diario (de lo compartido, tu mitad).");
    Object.entries(porRubro).sort((x, y) => y[1] - x[1]).slice(0, 8).forEach(([r, v]) => fila("plata", "rubro_7_dias", r + ": " + $(v), ""));
    const mes = (datosFinanzas()?.meses || []).slice().sort((x, y) => String(y.mes).localeCompare(String(x.mes)))[0];
    if (mes) fila("plata", "disponible_real_recibo", $(mes.disponible), (mes.fuente || "") + " (neto − talón complementario).");
    pendientesDeTarjetas(datosFinanzas()).forEach((t) => fila("plata", "tarjeta", t.titulo + " · " + t.monto + " · vence " + t.fecha, t.nota));
  });

  parte("agenda", () => {
    const lun = lunesDe(hoy, 1);
    for (let i = 0; i < 7; i++) {
      const d = new Date(lun); d.setDate(lun.getDate() + i);
      const bs = bloquesFecha(datos, d);
      fila("agenda", iso(d), bs.map((x) => (x.titulo || x.tipo) + " " + hm(x)).join("; "), DIAS[d.getDay()] + " · semana que viene, con los eventos depurados de Orbe.");
    }
    const lunPas = lunesDe(hoy, 0), domPas = new Date(lunPas); domPas.setDate(lunPas.getDate() + 6);
    const bna = sumaTipo(datos, lunPas, domPas, "bna", hoy);
    fila("agenda", "horas_bna_semana", Math.round((bna.hecho + bna.agenda) / 6) / 10, "Horas en el BNA de esta semana (lunes a domingo).");
    Object.entries(leer("agenda")?.conflictos || {}).filter(([d]) => d >= iso(hoy)).slice(0, 5).forEach(([d, cs]) => cs.forEach((c) =>
      fila("agenda", "conflicto", d + ": quedó " + c.queda + ", descartado " + c.descartado + (c.cal ? " (calendario «" + c.cal + "»)" : ""), "Eventos del mismo tipo que se pisaban; Orbe dejó el más nuevo.")));
  });

  parte("productividad", () => {
    if (!datosProd()) return;
    const desde = new Date(hoy); desde.setDate(desde.getDate() - 7);
    const meses = [...new Set([iso(desde).slice(0, 7), iso(hoy).slice(0, 7)])];
    const dias = meses.flatMap((m) => historial(m, iso(hoy)).dias).filter((d) => d.fecha >= iso(desde) && !d.enCurso && d.total > 0);
    const prom = dias.length ? dias.reduce((s, d) => s + d.total, 0) / dias.length : null;
    const meta = metaDe(iso(hoy))?.meta;
    fila("productividad", "dias", dias.length, "Días con carga en los últimos 7 (sin hoy).");
    fila("productividad", "promedio", prom == null ? "" : Math.round(prom * 10) / 10, "Puntos por día.");
    fila("productividad", "meta", meta || "", "Meta vigente.");
    fila("productividad", "en_meta", meta ? dias.filter((d) => d.total >= meta).length : "", "Días en la meta o más.");
    const mejor = dias.slice().sort((a, b) => b.total - a.total)[0];
    if (mejor) fila("productividad", "mejor_dia", mejor.fecha + ": " + Math.round(mejor.total * 10) / 10, "");
    fila("productividad", "verificados", dias.filter((d) => d.verificado).length, "Días comparados con la planilla oficial del banco.");
  });

  parte("facu", () => {
    const f = datosFacu();
    if (!f) return;
    const h = iso(hoy), lim = new Date(hoy); lim.setDate(lim.getDate() + 14);
    f.tps.filter((t) => !t.hecho && /^\d{4}-\d{2}-\d{2}$/.test(t.fecha) && t.fecha <= iso(lim)).sort((a, b) => a.fecha.localeCompare(b.fecha))
      .forEach((t) => fila("facu", t.fecha < h ? "vencido" : "pendiente", t.materia + " · " + t.titulo, "vence " + t.fecha));
    (f.feed || []).filter((x) => x.ts && Date.now() - x.ts < 7 * 86400000).slice(0, 8).forEach((x) => fila("facu", "novedad", x.titulo || x.asunto || "", x.materia || ""));
  });

  parte("river", () => {
    const r = leer("river");
    if (!r) return;
    const p = r.proximo, u = r.ultimo;
    if (p) fila("river", "proximo", (p.local ? "River vs " : p.rival + " vs ") + (p.local ? p.rival : "River") + " · " + p.fecha, (p.torneo || "") + (p.hora === false ? " · hora a confirmar" : "") + (p.clasico ? " · superclásico" : ""));
    if (u) fila("river", "ultimo", "River " + u.gf + "-" + u.gc + " " + u.rival + " · " + String(u.fecha).slice(0, 10), u.torneo || "");
  });

  parte("amorcitos", () => {
    const items = datosListas()?.agus || [];
    const viaje = items.filter((x) => x.tipo === "viaje" && x.fecha && x.fecha >= iso(hoy)).sort((a, b) => a.fecha.localeCompare(b.fecha))[0];
    if (viaje) fila("amorcitos", "viaje", viaje.titulo + " · " + viaje.fecha.slice(0, 10), Math.round((new Date(viaje.fecha.slice(0, 10) + "T00:00:00") - new Date(iso(hoy) + "T00:00:00")) / 86400000) + " días");
    items.filter((x) => x.tipo === "fecha" && x.fecha).map((x) => ({ x, a: proximaAnual(x.fecha, hoy) })).filter((o) => o.a.dias <= 30).sort((a, b) => a.a.dias - b.a.dias)
      .forEach((o) => fila("amorcitos", "fecha", o.x.titulo + " · " + iso(o.a.fecha), "en " + o.a.dias + " días"));
    items.filter((x) => x.tipo === "plan" && !x.hecho).slice(0, 6).forEach((x) => fila("amorcitos", "plan", x.titulo + (x.fecha ? " · " + x.fecha.slice(0, 10) : ""), x.nota));
    fila("amorcitos", "para_ver", items.filter((x) => (x.tipo === "peli" || x.tipo === "serie") && !x.hecho).length, "Pelis y series pendientes.");
  });

  parte("bienestar", () => {
    const lun = lunesDe(hoy, 0), dom = new Date(lun); dom.setDate(lun.getDate() + 6);
    fila("bienestar", "gym_dias", sumaTipo(datos, lun, dom, "gym", hoy).diasHechos, "Esta semana; la meta es 1.");
    fila("bienestar", "futbol_dias", sumaTipo(datos, lun, dom, "futbol", hoy).diasHechos, "Esta semana; la meta es 1.");
    (datosListas()?.futbol || []).filter((p) => p.fecha >= iso(lun)).forEach((p) => fila("bienestar", "partido", p.fecha + " · " + ({ G: "ganado", E: "empatado", P: "perdido" }[p.resultado] || "") + (p.goles ? " · " + p.goles + " gol" + (p.goles > 1 ? "es" : "") : ""), p.nota));
  });

  parte("proyectos", () => {
    const l = datosListas();
    (l?.proyectos || []).forEach((p) => {
      const gh = l.github?.[p.repo];
      fila("proyectos", p.nombre, p.estado || "", (gh?.fecha ? "último commit " + gh.fecha.slice(0, 10) + ": " + gh.mensaje : "sin commits leídos") + (p.proximos.length ? " · próximos: " + p.proximos.slice(0, 3).join("; ") : ""));
    });
  });

  parte("urgente", () => {
    urgentes(datos, ctx).filter((p) => p.universo !== "semanal").slice(0, 10).forEach((p) => fila("urgente", p.fecha || "", p.titulo + (p.monto ? " · " + p.monto : ""), p.nota || ""));
  });

  return filas.slice(0, FILAS_MAX);
}

// La planilla del resumen: la que ya existe en tu Drive (se busca por nombre, así celu y compu usan la misma) o una nueva.
async function idResumen() {
  const ya = leer("resumenId");
  if (ya) return ya;
  const q = `name = '${NOMBRE_RESUMEN}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`;
  const r = await api("https://www.googleapis.com/drive/v3/files?" + new URLSearchParams({ q, orderBy: "createdTime", pageSize: "1", fields: "files(id)" }));
  let id = r.files?.[0]?.id;
  if (!id) {
    const n = await api("https://sheets.googleapis.com/v4/spreadsheets", "POST", { properties: { title: NOMBRE_RESUMEN, locale: "es_AR" }, sheets: [{ properties: { title: "RESUMEN" } }] });
    id = n.spreadsheetId;
  }
  guardar("resumenId", id, true);
  return id;
}

// Se reescribe como mucho cada 2 horas (o al tocar actualizar), y solo si cambió algo.
// Hace falta el permiso de Drive: sin poder buscarla, cada dispositivo crearía la suya.
export async function escribirResumen(datos, ctx, forzar = false) {
  if (!permisos().drive) return false;
  if (!forzar && Date.now() - (leer("resumenCuando") || 0) < 2 * 3600000) return false;
  const filas = armarResumen(datos, ctx);
  const firma = JSON.stringify(filas.slice(2));
  guardar("resumenCuando", Date.now(), true);
  if (!forzar && firma === leer("resumenFirma")) return false;
  const vacias = Array.from({ length: Math.max(0, FILAS_MAX - filas.length) }, () => ["", "", "", ""]);
  const rango = "RESUMEN!A1:D" + (FILAS_MAX + 1);
  const subir = async (id) => api("https://sheets.googleapis.com/v4/spreadsheets/" + id + "/values/" + encodeURIComponent(rango) + "?valueInputOption=RAW", "PUT", { range: rango, values: [CAB, ...filas, ...vacias] });
  try { await subir(await idResumen()); }
  catch (e) { if (e.message !== "no-existe") throw e; guardar("resumenId", null, true); await subir(await idResumen()); } // la borraste: se crea de nuevo
  guardar("resumenFirma", firma, true);
  return true;
}
