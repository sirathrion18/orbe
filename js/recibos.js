// Recibos de sueldo: Orbe busca en tu Drive la carpeta BNA → año, lee cada PDF ("MM/AA") y saca
// el neto y el talón complementario. Disponible real = neto − talón, y va al mes siguiente (el recibo
// se deposita el 28 y es la plata con la que vivís el mes que viene). Se anota en la hoja MES de tu planilla.
import { api, permisos, pedirPase } from "./google.js";
import { leer, guardar } from "./almacen.js";
import { leerRangos, agregar, escribir } from "./hoja.js";

const DRIVE = "https://www.googleapis.com/drive/v3/files";
const num = (t) => Number(String(t).replace(/\./g, "").replace(",", "."));

let cargando = null;
function cargarPdfjs() {
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  if (cargando) return cargando;
  cargando = new Promise((ok, mal) => {
    const s = document.createElement("script");
    s.src = "vendor/pdfjs/pdf.min.js";
    s.onload = () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = "vendor/pdfjs/pdf.worker.min.js"; ok(window.pdfjsLib); };
    s.onerror = () => mal(new Error("pdfjs"));
    document.head.appendChild(s);
  });
  return cargando;
}

async function textoPdf(buffer) {
  const pdfjs = await cargarPdfjs();
  const doc = await pdfjs.getDocument({ data: buffer, isEvalSupported: false }).promise;
  let t = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const p = await doc.getPage(i);
    t += (await p.getTextContent()).items.map((x) => x.str).join(" ") + "\n";
  }
  return t.replace(/\s+/g, " ");
}

// Del texto del recibo: mes, neto y total del talón complementario.
export function leerRecibo(texto) {
  const mes = texto.match(/Mes\/Año:\s*(\d{2})\/(\d{4})/);
  const neto = texto.match(/Sueldo Neto\s*([\d.]+,\d{2})/i);
  const talon = texto.match(/TAL[ÓO]N COMPLEMENTARIO[\s\S]*?Total Descuentos[\s\S]*?([\d.]+,\d{2})\s*(?:PARA|$)/i) || texto.match(/TAL[ÓO]N COMPLEMENTARIO[\s\S]*([\d.]{5,},\d{2})/i);
  if (!mes || !neto) return null;
  return { mes: Number(mes[1]), anio: Number(mes[2]), neto: num(neto[1]), talon: talon ? num(talon[1]) : 0 };
}

async function carpetaRecibos() {
  const q = (s) => DRIVE + "?fields=files(id,name)&pageSize=20&q=" + encodeURIComponent(s);
  const bna = (await api(q("name = 'BNA' and mimeType = 'application/vnd.google-apps.folder' and trashed = false"))).files || [];
  const anio = String(new Date().getFullYear());
  for (const b of bna) {
    const hijos = (await api(q(`'${b.id}' in parents and name = '${anio}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`))).files || [];
    if (hijos[0]) return hijos[0].id;
  }
  return null;
}

// Lee los recibos nuevos y completa la hoja MES. Devuelve cuántos meses agregó.
export async function leerRecibos() {
  if (!permisos().drive) return 0;
  const ya = leer("recibosLeidos", {});
  const carpeta = leer("carpetaRecibos") || await carpetaRecibos();
  if (!carpeta) return 0;
  guardar("carpetaRecibos", carpeta, true);
  const todos = (await api(DRIVE + "?fields=files(id,name,modifiedTime)&pageSize=50&orderBy=name desc&q=" +
    encodeURIComponent(`'${carpeta}' in parents and mimeType = 'application/pdf' and trashed = false`))).files || [];
  const [filas] = await leerRangos(["MES!A2:C"]);
  const existentes = new Map(filas.map((f, i) => [String(f[0]).slice(0, 7), i + 2]));
  // El mes que paga cada archivo, por su nombre («10/26» → el recibo de octubre va a noviembre).
  const claveDe = (nombre) => { const m = /(\d{1,2})\s*[\/_.-]\s*(\d{2,4})/.exec(nombre || ""); if (!m) return null; const y = Number(m[2].length === 2 ? "20" + m[2] : m[2]); const d = new Date(y, Number(m[1]), 1); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); };
  // Nuevos o cambiados, y también los recientes cuyo mes todavía falta en la planilla (por si una vez no se pudo leer).
  const pdfs = todos.filter((f, i) => !ya[f.id + f.modifiedTime] || (i < 3 && claveDe(f.name) && !existentes.has(claveDe(f.name))));
  if (!pdfs.length) return 0;
  let agregados = 0;
  for (const f of pdfs.slice(0, 6)) {
    const t = await (await fetch(DRIVE + "/" + f.id + "?alt=media", { headers: { Authorization: "Bearer " + await pedirPase() } })).arrayBuffer();
    const r = leerRecibo(await textoPdf(t));
    ya[f.id + f.modifiedTime] = r ? r.mes + "/" + r.anio : "ilegible";
    if (!r) continue;
    const sig = new Date(r.anio, r.mes, 1); // mes siguiente al del recibo
    const clave = sig.getFullYear() + "-" + String(sig.getMonth() + 1).padStart(2, "0");
    const fila = [clave, Math.round((r.neto - r.talon) * 100) / 100,
      `Recibo ${String(r.mes).padStart(2, "0")}/${r.anio}: neto $${Math.round(r.neto).toLocaleString("es-AR")} − talón $${Math.round(r.talon).toLocaleString("es-AR")} (leído por Orbe)`];
    if (existentes.has(clave)) await escribir("MES!A" + existentes.get(clave) + ":C" + existentes.get(clave), [fila]);
    else { await agregar("MES!A:C", [fila]); existentes.set(clave, -1); }
    agregados++;
  }
  guardar("recibosLeidos", ya, true);
  return agregados;
}
