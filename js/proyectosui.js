// Proyectos: el cosmos, la lista, la ficha de cada proyecto, las propuestas de Claude y el reservorio de ideas.
import { esc } from "./inicio.js";
import { ICONOS } from "./iconos.js";
import { leer, sesion } from "./almacen.js";
import { datosListas } from "./listas.js";
import { ultimaEdicion } from "./semanal.js";
import { datosCentral, datosPropuestas, respuestas, propuestasNuevas } from "./central.js";
import { identidad, insigniaHtml, slug, NOMBRES, opcionesLogo, logoElegido } from "./proyectosid.js";
import { UNIVERSOS } from "./config.js";
import { permisos } from "./google.js";

const volverA = (href, texto) => `<a class="volver" href="${href}">${ICONOS.volver} ${esc(texto)}</a>`;
const corto = (s) => String(s || "").split(/[,;(]/)[0].trim();
const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
const hace = (iso) => { const d = Math.round((Date.now() - new Date(iso)) / 86400000); return d <= 0 ? "hoy" : d === 1 ? "ayer" : "hace " + d + " días"; };
const repoUrl = (r) => !r ? "" : /^https?:/.test(r) ? r : "https://github.com/" + r;

// ---------- La lista de proyectos: tu planilla + la central ----------
// La hoja PROYECTOS manda en nombre, links y próximos pasos; la ficha de la central suma estado, versión y lo demás.
// Si en la central aparece una ficha nueva (un proyecto que arrancaste en otro chat), entra sola.
export function proyectos(datos) {
  const l = datosListas(), c = datosCentral()?.fichas || {};
  const base = (l?.proyectos?.length ? l.proyectos : (datos?.proyectos || []).map((p) => ({ ...p, proximos: p.proximo ? [p.proximo] : [] })))
    .filter((p) => !/^(ntn|orbe)$/i.test(p.id));
  const lista = base.map((p) => ({ ...p, ficha: c[p.id] || null }));
  for (const [id, f] of Object.entries(c)) {
    if (id === "orbe" || lista.some((p) => p.id === id)) continue;
    lista.push({ id, nombre: NOMBRES[id] || f.nombre, estado: corto(f.estado), repo: "", url: "", proximos: [], ficha: f, desdeCentral: !identidad(id).nuevo ? false : true });
  }
  return lista.map((p) => {
    const f = p.ficha;
    const estado = corto(f?.estado) || p.estado || "";
    const paso = p.proximos?.[0] || f?.secciones?.falta?.[0] || "";
    const ver = f?.version && f.version !== "—" ? (/^\d/.test(f.version) ? "v" + f.version : f.version) : "";
    return { ...p, estado, version: ver, sub: ver || estado,
      que: f?.secciones?.que?.[0]?.split(/(?<=\.)\s/)[0] || "", paso, anillo: /pausa|archiv|gemini|cerrad/i.test((f?.estado || "") + " " + estado + " " + (f?.dondeTrabaja || "")) ? 1 : 0 };
  });
}
// Para el cosmos: como mucho seis en el anillo de adentro.
export function paraCosmos(lista) {
  let adentro = 0;
  return lista.map((p) => {
    let anillo = p.anillo;
    if (anillo === 0 && ++adentro > 6) anillo = 1;
    return { id: p.id, nombre: p.nombre, estado: p.estado, sub: p.sub, que: p.que, paso: p.paso, anillo, logo: logoElegido(p.id) };
  });
}

// ---------- Universo Proyectos ----------
export function cuerpoProyectos(datos) {
  const lista = proyectos(datos);
  const l = datosListas(), gh = l?.github || {};
  const nuevas = propuestasNuevas();
  const ideas = contarIdeas();
  const prop = datosPropuestas()?.lista?.length
    ? `<a class="tarjeta-prop" href="#/propuestas"><span><span class="k">Propuestas de Claude${nuevas.length ? " · nuevas" : ""}</span>
        <span class="t">${nuevas.length ? "«" + esc(nuevas[0].titulo) + "»" + (nuevas.length > 1 ? ` y ${nuevas.length - 1} más` : "") : "Ya respondiste todas. Las próximas llegan martes o viernes a la noche."}</span></span>
        ${nuevas.length ? `<span class="n">${nuevas.length}</span>` : '<span class="ir">›</span>'}</a>`
    : `<a class="tarjeta-prop" href="#/propuestas"><span><span class="k">Propuestas de Claude</span><span class="t">Martes y viernes a la noche Claude mira tus proyectos y te deja de 3 a 5 ideas para decidir.</span></span><span class="ir">›</span></a>`;
  const cartas = lista.map((p) => {
    const g = gh[p.repo];
    let ultimo = g?.fecha ? `Último cambio ${hace(g.fecha)}: ${esc(g.mensaje)}${g.semana ? ` · ${g.semana} ${g.semana === 1 ? "cambio" : "cambios"} esta semana` : ""}` : "";
    if (p.id === "semanal") { const e = ultimaEdicion(); ultimo = e ? `Última edición: ${esc(e.nombre)}${e.numero ? " N.º " + esc(e.numero) : ""}` : "Sale los domingos a las 20:00."; }
    if (!ultimo && p.ficha?.actualizada) ultimo = "Ficha actualizada el " + esc(p.ficha.actualizada);
    const i = identidad(p.id, p.nombre);
    return `<a class="proy" href="#/p/${encodeURIComponent(p.id)}" style="--tono:${i.glow}">${insigniaHtml(p.id, p.nombre, 40)}
      <span class="proy-txt"><b>${esc(p.nombre)}</b><span class="proy-est">${esc([p.estado, p.version].filter(Boolean).join(" · "))}${p.desdeCentral ? ' <span class="tag">nuevo en la central</span>' : ""}</span>
      ${ultimo ? `<span class="proy-ult">${ultimo}</span>` : ""}${p.paso ? `<span class="proy-paso">Próximo: ${esc(p.paso)}</span>` : ""}</span><span class="ir">›</span></a>`;
  }).join("");
  const aviso = !permisos().drive ? '<p class="fuente-dato">Con Drive conectado (Ajustes › Google), Orbe lee las fichas de la central de proyectos y suma los proyectos nuevos solos.</p>'
    : datosCentral()?.error === "sin-carpeta" ? '<p class="fuente-dato">No encontré la carpeta «Central de proyectos» en tu Drive.</p>' : "";
  return `<div class="cosmos" id="cosmos"><noscript>El cosmos necesita JavaScript.</noscript></div>
    ${prop}
    <div class="chips" style="margin:14px 0 4px"><a class="chip" href="#/ideas">Ideas${ideas ? " · " + ideas : ""} ›</a><a class="chip" href="#/propuestas">Propuestas ›</a></div>
    <h2 class="fz-titulo">Todos los proyectos</h2><div class="proys">${cartas || '<p class="vacio">Todavía no hay proyectos.</p>'}</div>
    ${(() => { const con = lista.filter((p) => opcionesLogo(p.id).length); if (!con.length) return "";
      return `<details class="bloque plegable logos-todos" ${sesion("logosAbierto") ? "open" : ""}><summary>Elegir logos</summary>${con.map((p) => { const i = identidad(p.id, p.nombre);
        return `<div class="logo-proy"><b>${esc(p.nombre)}</b><div class="logos-op">${opcionesLogo(p.id).map((l, k) => `<button class="logo-op ${logoElegido(p.id) === k ? "on" : ""}" data-accion="logo-elegir" data-id="${esc(p.id)}" data-i="${k}" aria-label="${esc(p.nombre)}, logo ${k + 1}" aria-pressed="${logoElegido(p.id) === k}"><span class="insignia" style="width:48px;height:48px;background:${i.base}">${l}</span><small>${k + 1}</small></button>`).join("")}</div></div>`; }).join("")}</details>`; })()}${aviso}`;
}

// ---------- Ficha de un proyecto ----------
const PESTANAS = [["ahora", "Ahora"], ["proximos", "Próximos"], ["ideas", "Ideas"], ["historia", "Historia"], ["conectado", "Conectado"]];
export function renderFicha(id, datos) {
  const p = proyectos(datos).find((x) => x.id === id)
    || (id === "orbe" ? { id: "orbe", nombre: "Orbe", estado: corto(datosCentral()?.fichas?.orbe?.estado), proximos: [], ficha: datosCentral()?.fichas?.orbe || null, repo: "sirathrion18/orbe", url: "" } : null);
  if (!p) return `<div class="pagina">${volverA("#/u/proyectos", "Proyectos")}<h1>No encontré ese proyecto</h1><p class="bajada">Puede que lo hayan renombrado en la central.</p></div>`;
  const f = p.ficha, s = f?.secciones || {}, i = identidad(p.id, p.nombre);
  const tab = PESTANAS.some(([k]) => k === sesion("fichaTab")) ? sesion("fichaTab") : "ahora";
  const lista = (items, vacio) => items?.length ? `<ul class="ficha-l">${items.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : `<p class="vacio">${vacio}</p>`;
  const proximos = [...(p.proximos || []), ...(s.falta || []).filter((x) => !(p.proximos || []).some((y) => norm(y) === norm(x)))];
  const contenido = {
    ahora: lista(s.ahora, f ? "La ficha no tiene «Estado actual» todavía." : "Todavía no leí la ficha de la central."),
    proximos: lista(proximos, "Sin próximos pasos anotados.") + (datosListas()?.proyectos?.some((x) => x.id === p.id) ? `<button class="chip" data-accion="proyecto-pasos" data-id="${esc(p.id)}" style="margin-top:12px">Editar pasos</button>` : ""),
    ideas: ideasDe(p),
    historia: lista(s.historia, "La ficha todavía no tiene historial de versiones."),
    conectado: lista(s.conexiones, "Sin conexiones anotadas.") + (s.donde?.length ? `<h3 class="ficha-h3">Dónde está cada cosa</h3>${lista(s.donde)}` : "")
  }[tab];
  const meta = [f?.estado || p.estado, f?.version && "Versión " + f.version, f?.actualizada && "actualizada " + f.actualizada].filter(Boolean).join(" · ");
  const links = [p.url && `<a class="chip" href="${esc(p.url)}"${/^#\//.test(p.url) ? "" : ' target="_blank" rel="noopener"'}>${/^#\//.test(p.url) ? "Leer" : "Abrir"}</a>`,
    p.repo && `<a class="chip" href="${esc(repoUrl(p.repo))}" target="_blank" rel="noopener">Repo</a>`,
    f?.doc && `<a class="chip" href="https://docs.google.com/document/d/${esc(f.doc)}/edit" target="_blank" rel="noopener">Ficha en Drive</a>`].filter(Boolean).join("");
  return `<div class="pagina ficha-p" style="--tono:${i.glow}">${volverA("#/u/proyectos", "Proyectos")}
    <header class="ficha-cab">${insigniaHtml(p.id, p.nombre, 64)}<div><h1>${esc(p.nombre)}</h1>${meta ? `<p class="ficha-meta">${esc(meta)}</p>` : ""}</div></header>
    ${s.que?.length ? `<p class="bajada">${esc(s.que.join(" ")).slice(0, 600)}</p>` : ""}
    ${f?.dondeTrabaja ? `<p class="fuente-dato" style="margin-top:4px">Se trabaja en: ${esc(f.dondeTrabaja)}</p>` : ""}
    <div class="pestanas" role="tablist">${PESTANAS.map(([k, t]) => `<button class="pestana ${tab === k ? "on" : ""}" role="tab" aria-selected="${tab === k}" data-accion="ficha-tab" data-tab="${k}">${t}</button>`).join("")}</div>
    <section class="bloque ficha-cuerpo">${contenido}</section>
    ${links ? `<div class="chips" style="margin-top:14px">${links}</div>` : ""}
    ${opcionesLogo(p.id).length ? `<details class="bloque plegable logos-p" ${sesion("logosAbierto") ? "open" : ""}><summary>Logo</summary><div class="logos-op">${opcionesLogo(p.id).map((l, k) => `<button class="logo-op ${logoElegido(p.id) === k ? "on" : ""}" data-accion="logo-elegir" data-id="${esc(p.id)}" data-i="${k}" aria-label="Logo ${k + 1}" aria-pressed="${logoElegido(p.id) === k}"><span class="insignia" style="width:52px;height:52px;background:${i.base}">${l}</span><small>${k + 1}</small></button>`).join("")}</div></details>` : ""}
    ${f ? "" : `<p class="fuente-dato">La ficha de este proyecto vive en la central de Drive; ${permisos().drive ? "se trae sola cada media hora." : "conectá Drive en Ajustes para verla acá."}</p>`}</div>`;
}

// ---------- Propuestas de Claude ----------
const TIPO = { mejora: "Mejora", area: "Área para encarar", "punto-ciego": "Algo que no estás viendo" };
const RESP = { dale: "Dale", despues: "Después", no: "No" };
export function renderPropuestas(datos) {
  const pr = datosPropuestas(), r = respuestas();
  const lista = pr?.lista || [];
  const nombre = (id) => proyectos(datos).find((p) => p.id === id)?.nombre || (id === "orbe" ? "Orbe" : "");
  const carta = (p) => {
    const resp = r[p.id]?.r;
    return `<article class="prop-c ${resp ? "resp" : ""}">
      <p class="prop-k">${esc(TIPO[p.tipo] || "Mejora")}${nombre(p.proyecto) ? " · " + esc(nombre(p.proyecto)) : ""}${p.esfuerzo ? " · esfuerzo " + esc(p.esfuerzo) : ""}</p>
      <h3>${esc(p.titulo)}</h3>${p.porque ? `<p class="prop-p">${esc(p.porque)}</p>` : ""}
      ${resp ? `<p class="prop-r">Respondiste: <b>${RESP[resp]}</b> <button class="link" data-accion="prop-resp" data-id="${esc(p.id)}" data-r="">Cambiar</button></p>`
        : `<div class="prop-b">${["dale", "despues", "no"].map((k) => `<button class="btn ${k === "dale" ? "" : "sec"}" data-accion="prop-resp" data-id="${esc(p.id)}" data-r="${k}">${RESP[k]}</button>`).join("")}</div>`}</article>`;
  };
  const sin = lista.filter((p) => !r[p.id]), con = lista.filter((p) => r[p.id]);
  return `<div class="pagina">${volverA("#/u/proyectos", "Proyectos")}<h1>Propuestas</h1>
    <p class="bajada">Martes y viernes a la noche Claude mira la central, tus ideas y cómo viene Orbe, y te deja de 3 a 5 propuestas: mejoras, áreas para encarar y cosas que no estás viendo.</p>
    ${pr?.fecha ? `<p class="fuente-dato" style="margin-top:0">Tanda del ${esc(pr.fecha.split("-").reverse().join("/"))}.</p>` : ""}
    ${sin.map(carta).join("") || `<p class="vacio">${lista.length ? "Respondiste todas." : permisos().drive ? "Todavía no llegó ninguna tanda." : "Conectá Drive en Ajustes para recibirlas."}</p>`}
    ${con.length ? `<details class="bloque plegable"><summary>Ya respondidas (${con.length})</summary>${con.map(carta).join("")}</details>` : ""}
    <p class="fuente-dato">«Dale» la pasa a la Bandeja de la central para hacerla. «Después» puede volver en unas semanas. «No» no vuelve.</p></div>`;
}

// ---------- Reservorio de ideas ----------
// Una sola lista: las ideas que anotás en Orbe y las de la Bandeja de la central.
// Las de Orbe viajan a la Bandeja en el cierre de la noche; de ahí Claude las pasa a la ficha que corresponde.
function todasLasIdeas() {
  const b = datosCentral()?.bandeja || { sin: [], procesadas: [], para: [] };
  const sinN = b.sin.map((x) => norm(x.t)), procN = b.procesadas.map((x) => norm(x.t));
  const contiene = (lista, t) => { const n = norm(t); return n.length > 6 ? lista.findIndex((x) => x.includes(n.slice(0, 60))) : -1; };
  const usadasSin = new Set(), usadasProc = new Set();
  const orbe = leer("ideas", []).map((i, k) => {
    const s = contiene(sinN, i.t), p = contiene(procN, i.t);
    if (s >= 0) usadasSin.add(s); if (p >= 0) usadasProc.add(p);
    const estado = p >= 0 ? (b.procesadas[p].ficha ? "En la ficha de " + b.procesadas[p].ficha : "Procesada") : s >= 0 ? "En la Bandeja" : datosCentral()?.bandeja ? "Viaja a la central esta noche" : "En Orbe";
    return { t: i.t, destino: i.u || "", fecha: i.f, tags: i.tags || [], estado, orden: k, origen: "orbe" };
  });
  const separar = (t) => { const m = /^(.{2,40}?)\s+[—–-]\s+(.+)$/.exec(t); return m ? [m[1], m[2]] : ["", t]; };
  const bandeja = b.sin.filter((_, k) => !usadasSin.has(k)).map((x) => { const [d, t] = separar(x.t); return { t, destino: d, estado: "En la Bandeja", origen: "bandeja" }; });
  const procesadas = b.procesadas.filter((_, k) => !usadasProc.has(k)).map((x) => { const [d, t] = separar(x.t); return { t, destino: d || x.ficha, fecha: x.fecha, estado: x.ficha ? "En la ficha de " + x.ficha : "Procesada", origen: "procesada" }; });
  return { lista: [...orbe.reverse(), ...bandeja, ...procesadas], para: b.para || [] };
}
export function textosIdeas() { try { return todasLasIdeas().lista.map((i) => (i.destino ? i.destino + ": " : "") + i.t).slice(0, 80); } catch (e) { return []; } }
const contarIdeas = () => { try { return todasLasIdeas().lista.length; } catch (e) { return 0; } };
function ideasDe(p) {
  const n = norm(p.nombre), id = p.id;
  const mias = todasLasIdeas().lista.filter((i) => norm(i.destino).includes(n) || n.includes(norm(i.destino) || "\u0000") || i.tags?.includes(id) || norm(i.t).startsWith(n));
  return mias.length ? `<ul class="ideas-l">${mias.map(filaIdea).join("")}</ul>` : `<p class="vacio">Sin ideas para ${esc(p.nombre)} todavía. Anotá una con el + y elegí el proyecto.</p>`;
}
const filaIdea = (i) => `<li><span class="idea-t">${esc(i.t)}</span><span class="idea-m">${i.destino ? `<span class="tag">${esc(i.destino)}</span>` : ""}<span class="idea-e ${/ficha/i.test(i.estado) ? "ok" : ""}">${esc(i.estado)}</span>${i.fecha ? `<span>${esc(i.fecha)}</span>` : ""}</span></li>`;
export function destinosIdea(datos) {
  return [...UNIVERSOS.map((u) => u.nombre), ...proyectos(datos).map((p) => p.nombre), "Orbe"].filter((x, k, a) => a.indexOf(x) === k);
}
export function renderIdeas(datos) {
  const { lista, para } = todasLasIdeas();
  const filtro = sesion("destIdea");
  const destinos = [...new Set(lista.map((i) => i.destino).filter(Boolean))].sort((a, b) => a.localeCompare(b, "es"));
  const ver = lista.filter((i) => !filtro || (filtro === "_sin" ? !i.destino : i.destino === filtro));
  const dictar = ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)
    ? `<button type="button" class="btn sec" data-accion="dictar" aria-label="Dictar una idea" style="display:inline-flex;align-items:center;gap:6px;padding:0 14px"><span style="width:18px;height:18px;display:inline-flex">${ICONOS.mic}</span><span>Dictar</span></button>` : "";
  const chip = (v, t, n) => `<button class="chip ${(filtro || "") === v ? "on" : ""}" data-accion="idea-dest" data-dest="${esc(v)}">${esc(t)}${n != null ? " " + n : ""}</button>`;
  return `<div class="pagina">${volverA("#/u/proyectos", "Proyectos")}<h1>Ideas</h1>
    <p class="bajada">Las que anotás en Orbe y las de la Bandeja de la central, juntas. Cada noche Claude pasa las nuevas a la ficha del proyecto que corresponde.</p>
    <form class="form form-idea" data-form="idea-dest"><input name="t" placeholder="Anotá algo" aria-label="Nueva idea" required>${dictar}<button class="btn">Guardar</button>
      <label class="sr" for="idea-d">Para qué es</label><select id="idea-d" name="u"><option value="">Sin ubicar</option>${destinosIdea(datos).map((d) => `<option ${filtro === d ? "selected" : ""}>${esc(d)}</option>`).join("")}</select></form>
    <div class="chips" style="margin-top:14px">${chip("", "Todas", lista.length)}${lista.some((i) => !i.destino) ? chip("_sin", "Sin ubicar", lista.filter((i) => !i.destino).length) : ""}${destinos.map((d) => chip(d, d, lista.filter((i) => i.destino === d).length)).join("")}</div>
    <ul class="ideas-l" style="margin-top:16px">${ver.map(filaIdea).join("") || '<li class="vacio">No hay ideas acá.</li>'}</ul>
    ${para.length ? `<section class="bloque"><h2>Para hacer (vos)</h2><p class="fuente-dato" style="margin-top:0">La lista de arriba de la Bandeja. Se tilda en el Doc.</p><ul class="lista">${para.map((x) => `<li><span>${x.hecho ? "☑" : "☐"} ${esc(x.t)}</span></li>`).join("")}</ul>
      ${datosCentral()?.bandejaDoc ? `<div class="chips" style="margin-top:12px"><a class="chip" href="https://docs.google.com/document/d/${esc(datosCentral().bandejaDoc)}/edit" target="_blank" rel="noopener">Abrir la Bandeja</a></div>` : ""}</section>` : ""}
    ${datosCentral()?.bandeja ? "" : `<p class="fuente-dato">${permisos().drive ? "Todavía no leí la Bandeja de la central." : "Con Drive conectado se suman las ideas de la Bandeja de la central."}</p>`}</div>`;
}
export { slug };
