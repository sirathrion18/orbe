// Capa de datos. Hoy lee el archivo de ejemplo y el clima real de Open-Meteo.
// Próximas versiones: después de iniciar sesión con Google, lee los datos reales del Drive.
import { leer, guardar } from "./almacen.js";

export async function cargarDatos() {
  const r = await fetch("datos/ejemplo.json", { cache: "no-cache" });
  if (!r.ok) throw new Error("No pude leer los datos");
  return mezclar(await r.json());
}

// Lo real reemplaza a lo de ejemplo a medida que se conecta.
export function mezclar(datos) {
  const agenda = leer("agenda");
  const cuenta = leer("cuenta");
  if (cuenta) {
    datos.usuario = { ...datos.usuario };
    datos.cuenta = cuenta;
  }
  if (agenda) {
    datos.agenda = agenda;
    datos.pendientesEjemplo = datos.pendientes;
    datos.pendientes = agenda.pendientes;
  }
  // Lo de tu planilla (AGUS y PROYECTOS) pisa a lo de ejemplo.
  const listas = leer("listas");
  if (listas) {
    const viajes = (listas.agus || []).filter((x) => x.tipo === "viaje" && x.fecha).map((x) => ({ titulo: x.titulo, fecha: x.fecha.slice(0, 10), tipo: "viaje" }));
    if (viajes.length) datos.fechas = viajes;
    if ((listas.proyectos || []).length) datos.proyectos = listas.proyectos;
  }
  return { datos, origen: agenda ? "google" : "ejemplo" };
}

const MEDIA_HORA = 30 * 60 * 1000;

export async function cargarClima(ciudad) {
  const guardado = leer("clima");
  if (guardado && Date.now() - guardado.cuando < MEDIA_HORA) return guardado;
  const url = "https://api.open-meteo.com/v1/forecast?latitude=" + ciudad.lat + "&longitude=" + ciudad.lon +
    "&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code" +
    "&timezone=America%2FArgentina%2FBuenos_Aires&forecast_days=2";
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error("clima");
    const j = await r.json();
    const clima = {
      cuando: Date.now(), origen: "real",
      temp: Math.round(j.current.temperature_2m), codigo: j.current.weather_code,
      max: Math.round(j.daily.temperature_2m_max[0]), min: Math.round(j.daily.temperature_2m_min[0]),
      manana: { max: Math.round(j.daily.temperature_2m_max[1]), min: Math.round(j.daily.temperature_2m_min[1]), codigo: j.daily.weather_code[1] }
    };
    guardar("clima", clima);
    return clima;
  } catch (e) {
    return guardado || null; // sin internet: lo último que había
  }
}

// Códigos WMO de Open-Meteo a estado e ícono.
export function describirClima(codigo) {
  if (codigo === 0) return { estado: "Despejado", icono: "sol" };
  if (codigo <= 2) return { estado: "Parcialmente nublado", icono: "parcial" };
  if (codigo === 3) return { estado: "Nublado", icono: "nube" };
  if (codigo === 45 || codigo === 48) return { estado: "Niebla", icono: "nube" };
  if (codigo >= 51 && codigo <= 67) return { estado: "Lluvia", icono: "lluvia" };
  if (codigo >= 71 && codigo <= 77) return { estado: "Nieve", icono: "nube" };
  if (codigo >= 80 && codigo <= 82) return { estado: "Chaparrones", icono: "lluvia" };
  if (codigo >= 95) return { estado: "Tormenta", icono: "tormenta" };
  return { estado: "Variable", icono: "parcial" };
}
