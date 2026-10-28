// Estructura de Orbe: qué universos hay y qué trae cada uno.
// Esto es diseño, no datos: no hay nada personal acá.
export const VERSION = "0.21.0";

// ID de cliente de Google (es público por diseño: no es una contraseña).
// Se crea en Google Cloud con el origen https://orbe-5es.pages.dev
export const GOOGLE_CLIENT_ID = "775947921311-t5edjab9rq99eng3fd3dh1bs5c1jd8e7.apps.googleusercontent.com";

export const UNIVERSOS = [
  { id: "agus", nombre: "Amorcitos", corto: "Amorcitos", color: "#E46A7E",
    bajada: "Lo de los dos: compras, comidas, planes y fechas.",
    palabras: "pareja super compras menu comidas planes" },
  { id: "bna", nombre: "BNA", corto: "BNA", color: "tipo:bna", bloqueo: true,
    bajada: "Tu productividad, tus horarios y tu sueldo.",
    palabras: "trabajo laburo horario recibo sueldo turnos" },
  { id: "ufasta", nombre: "UFASTA", corto: "UFASTA", color: "tipo:ufasta",
    bajada: "Tus materias, entregas, notas y lo nuevo del campus.",
    palabras: "facu facultad tp entregas campus notas materias" },
  { id: "bienestar", nombre: "Bienestar", corto: "Bienestar", color: "tipo:gym",
    bajada: "Pasos, fútbol, gym, comida y un rato para respirar.",
    palabras: "pasos futbol gym salud meditar meditacion sueño" },
  { id: "finanzas", nombre: "Finanzas", corto: "Finanzas", color: "#EE7B30", bloqueo: true,
    bajada: "Tu plata al día: disponible, tarjetas, gastos y promos.",
    palabras: "plata gastos tarjetas deuda promos disponible pizarra" },
  { id: "proyectos", nombre: "Proyectos", corto: "Proyectos", color: "texto",
    bajada: "El hangar: todo lo que estás creando.",
    palabras: "a64 nexus mateshka linea ntn sur repos" }
];

export const SECCIONES = [
  { ruta: "#/semanal", nombre: "El Semanal", palabras: "revista diario edicion semanal tapa" },
  { ruta: "#/ideas", nombre: "Ideas", palabras: "notas ideas anotar" },
  { ruta: "#/agenda", nombre: "Agenda del día", palabras: "agenda hoy mañana calendario anillo" },
  { ruta: "#/respiro", nombre: "Respiro", palabras: "respirar zona libre calma" },
  { ruta: "#/datos", nombre: "Mis datos", palabras: "datos exportar borrar privacidad" },
  { ruta: "#/ajustes", nombre: "Ajustes", palabras: "ajustes tema oscuro claro pin modos" },
  { ruta: "#/novedades", nombre: "Novedades de la versión", palabras: "version cambios novedades changelog" }
];

// Promociones por día (información pública, verificar topes porque cambian seguido).
export const PROMOS = {
  1: ["BNA+ MODO: ChangoMás 20%", "Buepp: ferias y gastronomía 30%"],
  2: ["BNA+ MODO: Jumbo 20%", "Mercado Pago: ChangoMás 15%", "Personal Pay: YPF 10% con Visa", "Buepp: ferias y gastronomía 30%"],
  3: ["BNA+ MODO: Maxiconsumo 30%", "Mercado Pago: Farmacity 30%", "Personal Pay: Diarco 25%"],
  4: ["Mercado Pago: tarjeta de crédito MP 20%", "Personal Pay: Diarco 25%", "Buepp: ferias y gastronomía 30%"],
  5: ["BNA+ MODO: combustible 20%; La Anónima, Disco y Vea 20%", "Mercado Pago: Coto 25%", "Personal Pay: Diarco 25%", "Buepp: Carrefour Maxi 10%"],
  6: ["Mercado Pago: Coto 20%, Diarco 15%", "Buepp: ferias y gastronomía 30%"],
  0: ["BNA+ MODO: Disco y Vea 20%", "Mercado Pago: Coto 20%, Diarco 15%"]
};
export const PROMOS_SIEMPRE = ["Mercado Pago: Mercado Libre Súper 35%", "Buepp: expensas y ABL 20%"];
