// UFASTA (v0.31): lo que dice el campus, jerarquizado. Arriba lo próximo; después Ahora, Esta semana,
// Más adelante, el plan de Marketing, las materias y lo hecho. Cada cosa: abrir en el campus y «ya lo hice».
import { esc } from "./inicio.js";
import { cuandoTexto, DIAS_CORTOS } from "./contexto.js";
import { MATERIAS, itemsCampus, gruposCampus, idPlan } from "./campus.js";

const IR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const mat = (id) => MATERIAS[id] || { corto: id || "", color: "#8A8A93" };
const chipMat = (id) => `<span class="uf-mat" style="--c:${mat(id).color}">${esc(mat(id).corto)}</span>`;

function fechaCorta(vence) {
  if (!vence) return "";
  const d = new Date(vence);
  const h = String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  return (DIAS_CORTOS?.[d.getDay()] || "") + " " + d.getDate() + "/" + (d.getMonth() + 1) + (h !== "00:00" ? " · " + h : "");
}

function cuando(it) {
  if (it.vista === "vencido") return { txt: it.dias !== null ? cuandoTexto(it.dias) : "venció", rojo: true };
  if (it.dias === null) return { txt: "sin fecha", rojo: false };
  return { txt: (it.estimado ? "≈ " : "") + cuandoTexto(it.dias), rojo: it.dias <= 3 };
}

function hace(ts) {
  const m = Math.round((Date.now() - ts) / 60000);
  if (m < 60) return "hace " + Math.max(1, m) + " min";
  const h = Math.round(m / 60);
  return h < 24 ? "hace " + h + " h" : "hace " + Math.round(h / 24) + " días";
}

function fila(it) {
  const c = cuando(it);
  const check = it.tildable || it.vista === "marcado"
    ? `<label class="uf-check" title="Ya lo hice"><input type="checkbox" data-accion="campus-tilde" data-id="${esc(it.id)}" ${it.marcado ? "checked" : ""}><span></span></label>`
    : `<span class="uf-check vacio-check" aria-hidden="true"></span>`;
  const sello = it.vista === "confirmado" ? '<span class="uf-sello ok">Confirmado por el campus</span>'
    : it.vista === "marcado" ? '<span class="uf-sello">Lo marcaste vos · el campus todavía no lo muestra</span>' : "";
  return `<li class="uf-it ${it.vista}">${check}
    <div class="uf-tx">${chipMat(it.materia)}<b>${esc(it.titulo)}</b>
      ${it.detalle && it.vista !== "confirmado" ? `<small>${esc(it.detalle)}</small>` : ""}${sello}</div>
    <div class="uf-der">${it.vista === "confirmado" || it.vista === "marcado" ? "" : `<span class="uf-cuando ${c.rojo ? "rojo" : ""}">${esc(c.txt)}</span>${it.vence ? `<span class="uf-fecha">${esc(fechaCorta(it.vence))}${it.estimado ? " · estimada" : ""}</span>` : ""}`}
      ${it.url ? `<a class="uf-ir" href="${esc(it.url)}" target="_blank" rel="noopener" aria-label="Abrir en el campus">${IR}</a>` : ""}</div></li>`;
}

function hero(it) {
  const c = cuando(it);
  return `<section class="uf-hero" style="--c:${mat(it.materia).color}">
    <div class="uf-k">${it.vista === "vencido" ? "Se te pasó" : "Lo próximo"} · ${esc(mat(it.materia).corto)}</div>
    <h3>${esc(it.titulo)}</h3>
    <p class="uf-hcuando ${c.rojo ? "rojo-txt" : ""}">${esc(c.txt)}${it.vence ? ` · ${esc(fechaCorta(it.vence))}` : ""}${it.estimado ? " · fecha estimada" : ""}</p>
    ${it.detalle ? `<p class="uf-hdet">${esc(it.detalle)}</p>` : ""}
    <div class="uf-hbtn">${it.url ? `<a class="uf-btn" href="${esc(it.url)}" target="_blank" rel="noopener">Abrir en el campus ${IR}</a>` : ""}
      ${it.tildable ? `<button class="uf-btn sec" data-accion="campus-hecho" data-id="${esc(it.id)}">Ya lo hice</button>` : ""}</div></section>`;
}

function bloquePlan(plan, tildes) {
  if (!plan || !plan.length) return "";
  const pasos = plan.slice().sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0)).map((p) => {
    const tareas = (p.tareas || []).map((t, i) => ({ ...t, id: idPlan(p.id, i), hecho: !!tildes[idPlan(p.id, i)]?.hecho }));
    return { ...p, tareas, listas: tareas.filter((t) => t.hecho).length };
  });
  const actual = pasos.find((p) => p.listas < p.tareas.length);
  const total = pasos.reduce((s, p) => s + p.tareas.length, 0), listas = pasos.reduce((s, p) => s + p.listas, 0);
  return `<section class="bloque uf-plan"><h2>Marketing · camino al final</h2>
    <p class="uf-plan-res"><span class="cifra-chica">${listas}/${total}</span> tareas · ${actual ? `ahora: <b>${esc(actual.titulo.replace(/^\d+\.\s*/, ""))}</b>` : "<b>listo para rendir</b>"}</p>
    <div class="barra" style="margin:10px 0 6px"><i style="width:${total ? Math.round(listas / total * 100) : 0}%;background:${MATERIAS.MKT.color}"></i></div>
    ${pasos.map((p) => `<details class="uf-paso" ${p === actual ? "open" : ""}><summary><span>${esc(p.titulo)}</span><span class="tag">${esc(p.fechas || "")} · ${p.listas}/${p.tareas.length}</span></summary>
      <ul class="uf-tareas">${p.tareas.map((t) => `<li class="${t.hecho ? "hecha" : ""}"><label class="uf-check"><input type="checkbox" data-accion="campus-tilde" data-id="${esc(t.id)}" ${t.hecho ? "checked" : ""}><span></span></label>
        <span class="uf-ttx">${esc(t.t)}${t.min ? ` <small>${t.min} min</small>` : ""}</span>${t.url ? `<a class="uf-ir" href="${esc(t.url)}" target="_blank" rel="noopener" aria-label="Abrir">${IR}</a>` : ""}</li>`).join("")}</ul></details>`).join("")}
    <p class="fuente-dato">Las actividades de Marketing van sin IA. El plan es para leer y estudiar a tu ritmo.</p></section>`;
}

export function paginaCampus(c, ctx, extras = "") {
  const d = c.datos;
  const items = itemsCampus(c, ctx.fecha);
  const g = gruposCampus(items);
  const primero = g.ahora.find((x) => x.vista !== "vencido") || g.semana[0] || g.ahora[0] || g.despues.find((x) => x.vence);
  const sin = (lista) => lista.filter((x) => x !== primero);
  const viejo = d.actualizado ? Date.now() - new Date(d.actualizado).getTime() > 36 * 3600000 : true;
  const estado = `<section class="uf-estado ${viejo ? "viejo" : ""}"><p><b>${d.actualizado ? "Revisado " + hace(new Date(d.actualizado).getTime()) : "Sin fecha de revisión"}</b> · ${d.fuente === "gmail" ? "solo con los mails (el campus pidió entrar)" : "desde el campus"}</p>
    ${d.resumen ? `<p class="uf-res">${esc(d.resumen)}</p>` : ""}${viejo ? '<p class="rojo-txt">La revisión de hoy todavía no llegó. Lo de abajo puede estar atrasado.</p>' : ""}</section>`;
  const seccion = (titulo, lista, vacio) => lista.length || vacio ? `<section class="bloque uf-grupo"><h2>${titulo}${lista.length ? ` <span class="uf-n">${lista.length}</span>` : ""}</h2>
    ${lista.length ? `<ul class="uf-lista">${lista.map(fila).join("")}</ul>` : `<p class="vacio">${vacio}</p>`}</section>` : "";
  const materias = (d.materias || []).length ? `<section class="bloque"><h2>Materias</h2><div class="uf-materias">${d.materias.slice().sort((a, b) => (a.orden ?? 9) - (b.orden ?? 9)).map((m) => {
    const pend = items.filter((x) => x.materia === m.id && (x.vista === "pendiente" || x.vista === "vencido") && x.tipo !== "info").length;
    return `<a class="uf-materia" style="--c:${mat(m.id).color}" href="${esc(m.url || "https://ead01.ufasta.edu.ar")}" target="_blank" rel="noopener">
      <span class="uf-mnom">${esc(m.nombre)}</span><span class="uf-mpend">${pend ? pend + " pendiente" + (pend === 1 ? "" : "s") : "al día"}</span>
      <span class="uf-mest">${esc(m.estado || "")}</span></a>`;
  }).join("")}</div></section>` : "";
  const hechos = g.hecho.length ? `<section class="bloque"><details class="mas uf-hechos"><summary>Hecho (${g.hecho.length})</summary><ul class="uf-lista">${g.hecho.map(fila).join("")}</ul></details></section>` : "";
  return `${estado}${primero ? hero(primero) : '<section class="uf-hero"><div class="uf-k">Todo al día</div><h3>No hay nada pendiente con fecha.</h3></section>'}
    ${seccion("Ahora", sin(g.ahora), "Nada para los próximos 3 días.")}
    ${seccion("Esta semana", sin(g.semana), "")}
    ${seccion("Más adelante", sin(g.despues), "")}
    ${g.sinFecha.length ? `<section class="bloque"><details class="mas uf-sinfecha"><summary>Para leer y sin fecha (${g.sinFecha.length})</summary><ul class="uf-lista">${g.sinFecha.map(fila).join("")}</ul></details></section>` : ""}
    ${bloquePlan(d.plan, c.tildes || {})}
    ${materias}${hechos}${extras}
    <section class="bloque"><h2>Accesos</h2><div class="chips"><a class="chip" href="https://ead01.ufasta.edu.ar/my/" target="_blank" rel="noopener">Aula virtual</a><a class="chip" href="https://www.ufasta.edu.ar" target="_blank" rel="noopener">Sitio de UFASTA</a></div>
      <p class="fuente-dato">Claude revisa el campus todos los días a las 8:20 y deja lo que encontró en tu Drive. Los tildes son tuyos: si el campus confirma la entrega, queda en verde.</p></section>`;
}
