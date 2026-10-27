// Salida y puesta del sol (ecuación de salida del sol, precisión de un par de minutos).
const rad = Math.PI / 180;

export function sol(fecha, lat, lon) {
  const jd = fecha.getTime() / 86400000 + 2440587.5;
  const n = Math.ceil(jd - 2451545.0 + 0.0008);
  const jEstrella = n - lon / 360;
  const M = (357.5291 + 0.98560028 * jEstrella) % 360;
  const C = 1.9148 * Math.sin(M * rad) + 0.02 * Math.sin(2 * M * rad) + 0.0003 * Math.sin(3 * M * rad);
  const lambda = (M + C + 180 + 102.9372) % 360;
  const jTransito = 2451545.0 + jEstrella + 0.0053 * Math.sin(M * rad) - 0.0069 * Math.sin(2 * lambda * rad);
  const sinDec = Math.sin(lambda * rad) * Math.sin(23.4397 * rad);
  const cosDec = Math.cos(Math.asin(sinDec));
  const cosW = (Math.sin(-0.833 * rad) - Math.sin(lat * rad) * sinDec) / (Math.cos(lat * rad) * cosDec);
  const w = Math.acos(Math.max(-1, Math.min(1, cosW))) / rad;
  const aFecha = (j) => new Date((j - 2440587.5) * 86400000);
  return { sale: aFecha(jTransito - w / 360), pone: aFecha(jTransito + w / 360) };
}
