// Sincronización entre el celu y la compu, a través de la hoja ESTADO de tu planilla.
// Cada dato guarda cuándo cambió; gana el cambio más nuevo. Se trae al abrir y al volver a Orbe,
// y se manda un par de segundos después de cada cambio.
import { leer, guardar, alGuardar } from "./almacen.js";
import { idHoja, leerRangos, escribir } from "./hoja.js";
import { permisos } from "./google.js";

export const SINCRO = ["hechos", "horario", "ideas", "super", "menu", "gastos", "futbol", "alarmaManual", "fuentes", "plataOculta", "pin"];
const meta = () => leer("sincro", { cuando: {}, ultima: 0 });
let listo = false;       // no se manda nada hasta haber traído lo de la planilla
let timer = null;
let enCurso = null;

export const activa = () => !!(idHoja() && permisos().sheets);

alGuardar((clave) => {
  if (!SINCRO.includes(clave)) return;
  const m = meta(); m.cuando[clave] = Date.now(); guardar("sincro", m, true);
  programar();
});

function programar() {
  if (!activa() || !listo) return;
  clearTimeout(timer);
  timer = setTimeout(() => mandar().catch(() => { /* reintenta en el próximo cambio o al volver */ }), 1500);
}

async function mandar() {
  const m = meta();
  const filas = SINCRO.map((k) => [k, JSON.stringify(leer(k)), m.cuando[k] || 0]);
  await escribir("ESTADO!A2:C" + (SINCRO.length + 1), filas);
  m.ultima = Date.now(); guardar("sincro", m, true);
}

// Trae la planilla, se queda con lo más nuevo de cada lado y devuelve si cambió algo acá.
export async function sincronizar() {
  if (!activa()) return false;
  if (enCurso) return enCurso;
  enCurso = (async () => {
    try {
      const [filas] = await leerRangos(["ESTADO!A2:C"]);
      const m = meta();
      let cambio = false, hayQueMandar = false;
      const remotos = Object.fromEntries(filas.filter((f) => f[0]).map((f) => [f[0], { valor: f[1], cuando: Number(f[2]) || 0 }]));
      for (const k of SINCRO) {
        const r = remotos[k], local = m.cuando[k] || 0;
        const mio = leer(k);
        if (r && r.cuando > local) {
          let v = null; try { v = JSON.parse(r.valor); } catch (e) { continue; }
          // Primera vez en este dispositivo: las listas se juntan en vez de pisarse.
          if (!local && Array.isArray(mio) && mio.length && Array.isArray(v)) {
            const vistos = new Set(v.map((x) => JSON.stringify(x)));
            const extra = mio.filter((x) => !vistos.has(JSON.stringify(x)));
            if (extra.length) { v = v.concat(extra); m.cuando[k] = Date.now(); hayQueMandar = true; } else m.cuando[k] = r.cuando;
          } else m.cuando[k] = r.cuando;
          if (v === null) localStorage.removeItem("orbe." + k); else guardar(k, v, true);
          cambio = true;
        } else if (local > (r ? r.cuando : 0)) hayQueMandar = true;
        else if ((!r || !r.cuando) && mio != null) { m.cuando[k] = Date.now(); hayQueMandar = true; } // nunca subido
      }
      guardar("sincro", m, true);
      listo = true;
      if (hayQueMandar) await mandar();
      return cambio;
    } finally { enCurso = null; }
  })();
  return enCurso;
}

export const ultimaSincro = () => meta().ultima || null;
