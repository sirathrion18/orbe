// Huevitos: los guiños de Orbe, en chiquito. Detalles mínimos y escondidos (una copita, tres estrellitas,
// una palabra en ruso, una telita en una esquina) que aparecen en su momento y se van. Nunca más de 2 a la vez.
// Lugares de Inicio: «fecha» (al lado de la fecha de arriba), «saludo» (al final del saludo), «reloj» (debajo
// de la hora, adentro del anillo), «pie» (una línea mínima abajo de todo) y «vacio» (frase para listas vacías).
// Además hay interactivos: palabras secretas en el buscador, toques escondidos y una tecla famosa.
// Todo con formas, colores y frases propias: ningún personaje, persona, cara, logo ni escudo; ninguna cita textual.
import { leer, guardar, sesion } from "./almacen.js";
import { nivelGuinos } from "./guinos.js";

export const huevosPrendidos = () => nivelGuinos() !== "ninguno";
const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const dos = (n) => String(n).padStart(2, "0");

// ---------- Dibujitos (12 px, genéricos) ----------
const svg = (cuerpo, clase = "") => `<svg class="hv-svg ${clase}" viewBox="0 0 12 12" aria-hidden="true">${cuerpo}</svg>`;
const D = {
  copa: svg('<path d="M3 1h6v2.6A3 3 0 0 1 3 3.6z" fill="currentColor"/><path d="M3 2H1.4v.8A1.8 1.8 0 0 0 3.2 4.6M9 2h1.6v.8a1.8 1.8 0 0 1-1.8 1.8" fill="none" stroke="currentColor" stroke-width=".9"/><path d="M5.3 6.4h1.4v2.2H5.3zM3.8 9.2h4.4v1.4H3.8z" fill="currentColor"/>', "hv-oro"),
  copaRoja: svg('<path d="M3 1h6v2.6A3 3 0 0 1 3 3.6z" fill="currentColor"/><path d="M3 2H1.4v.8A1.8 1.8 0 0 0 3.2 4.6M9 2h1.6v.8a1.8 1.8 0 0 1-1.8 1.8" fill="none" stroke="currentColor" stroke-width=".9"/><path d="M5.3 6.4h1.4v2.2H5.3zM3.8 9.2h4.4v1.4H3.8z" fill="currentColor"/>', "hv-rojo"),
  estrellas: `<svg class="hv-svg hv-ancho" viewBox="0 0 30 12" aria-hidden="true">${[5, 15, 25].map((x) => `<path transform="translate(${x - 5} 1)" d="M5 0l1.2 3.4H9.8L6.9 5.5 8 9 5 6.9 2 9l1.1-3.5L.2 3.4h3.6z" fill="currentColor"/>`).join("")}</svg>`,
  tela: svg('<path d="M0 0h12M0 0l11 7M0 0l5 12M0 0v12M4 0Q3.5 2.5 0 3M8 0Q7 4.5 2.6 6Q1 6.6 0 6.6" fill="none" stroke="currentColor" stroke-width=".6"/>', "hv-tela"),
  banda: svg('<rect width="12" height="12" rx="2.4" fill="#fff" stroke="currentColor" stroke-width=".5" stroke-opacity=".25"/><path d="M-1 8.6L8.6-1l2.6 2.6-9.6 9.6z" fill="#E30613"/>'),
  mate: svg('<path d="M3.2 4.4h5.6c.3 3.8-1 6.6-2.8 6.6S2.9 8.2 3.2 4.4z" fill="currentColor"/><path d="M6.6 4.4L9.6.6" stroke="currentColor" stroke-width=".9" fill="none"/><path d="M3 4.4h6" stroke="currentColor" stroke-width=".8"/>', "hv-verde"),
  espiral: svg('<path d="M6 6.2a.8.8 0 1 1 .9-.9 1.7 1.7 0 0 1-1.8 1.9A2.6 2.6 0 0 1 3.4 4.5 3.4 3.4 0 0 1 7 1.6a4.4 4.4 0 0 1 3.6 4.6A5 5 0 0 1 6 11" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>', "hv-naranja"),
  cuadros: svg('<rect x="1" y="1" width="5" height="5" fill="#1F7A46"/><rect x="6" y="6" width="5" height="5" fill="#1F7A46"/><rect x="6" y="1" width="5" height="5" fill="currentColor"/><rect x="1" y="6" width="5" height="5" fill="currentColor"/>'),
  circulo: svg('<circle cx="6" cy="6" r="4.6" fill="none" stroke="currentColor" stroke-width="1.1"/><circle cx="6" cy="6" r="1.4" fill="currentColor"/>', "hv-violeta"),
  pelota: svg('<circle cx="6" cy="6" r="5" fill="none" stroke="currentColor" stroke-width=".9"/><path d="M6 3.4l2.2 1.6-.8 2.6H4.6l-.8-2.6z" fill="currentColor"/>'),
  escarapela: svg('<circle cx="6" cy="6" r="5.4" fill="#75AADB"/><circle cx="6" cy="6" r="3.6" fill="#fff"/><circle cx="6" cy="6" r="1.9" fill="#75AADB"/>'),
  bandera: `<svg class="hv-svg hv-ancho" viewBox="0 0 18 12" aria-hidden="true"><rect width="18" height="4" fill="#75AADB"/><rect y="4" width="18" height="4" fill="#fff"/><rect y="8" width="18" height="4" fill="#75AADB"/><rect width="18" height="12" fill="none" stroke="currentColor" stroke-opacity=".2" stroke-width=".6"/></svg>`,
  estrella: svg('<path d="M6 .8l1.4 3.6h3.8L8.2 6.7l1.1 3.8L6 8.3l-3.3 2.2 1.1-3.8L.8 4.4h3.8z" fill="currentColor"/>'),
  orbita: svg('<circle cx="5.4" cy="6.6" r="3.6" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="9.4" cy="2.6" r="1.6" fill="#C8102E"/>'),
  nota: svg('<path d="M4.4 9.4V2.2l5.6-1.2v7" fill="none" stroke="currentColor" stroke-width=".9"/><circle cx="3.2" cy="9.4" r="1.4" fill="currentColor"/><circle cx="8.8" cy="8" r="1.4" fill="currentColor"/>')
};
const subte = (l, color) => `<span class="hv-subte" style="background:${color}" aria-hidden="true">${l}</span>`;
const txt = (t, clase = "") => `<span class="hv-txt ${clase}">${esc(t)}</span>`;
const diez = '<span class="hv-diez" aria-hidden="true">10</span>';
const cir = (t) => `<span class="hv-txt hv-cir" lang="ru">${esc(t)}</span>`;

// ---------- El catálogo ----------
// Cada huevito: id único, lugar, qué se ve (html), qué significa (lo que muestra al tocarlo) y prioridad.
const H = [];
const sumar = (id, lugar, html, que, prio, cuando) => H.push({ id, lugar, html, que, prio, cuando });

// Horas con guiño (debajo de la hora del anillo).
const HORAS = [
  ["00:00", txt("día nuevo"), "Medianoche: cuenta nueva."],
  ["03:00", txt("hora rara"), "Las 3 de la mañana. Hora de dormir, en serio."],
  ["04:04", txt("404: sueño no encontrado", "hv-mono"), "Las 4:04 y despierto."],
  ["05:00", D.mate, "El mate de los valientes."],
  ["09:12", '<span class="hv-banda" aria-hidden="true"></span>', "9/12: la banda roja, por Madrid."],
  ["10:10", diez, "10:10, la hora del 10."],
  ["11:11", txt("pedí uno"), "11:11: se pide un deseo."],
  ["12:00", txt("en punto"), "Mediodía exacto."],
  ["12:34", txt("1·2·3·4", "hv-mono"), "Uno, dos, tres, cuatro."],
  ["13:37", txt("leet", "hv-mono"), "13:37, la hora de los que programan."],
  ["15:00", D.mate, "Mate de las tres."],
  ["17:00", txt("¿té o mate?"), "Las cinco: hora del té. O del mate, acá."],
  ["18:12", D.estrellas, "18:12, por el 18/12: tres estrellas."],
  ["18:18", txt("18·18", "hv-mono"), "Hora doble."],
  ["19:01", txt("1901", "hv-rojo hv-mono"), "1901: el año en que nació River."],
  ["19:38", txt("1938", "hv-rojo hv-mono"), "1938: el año del Monumental."],
  ["20:20", txt("20/20"), "Visión perfecta."],
  ["22:06", D.pelota, "22/6: media cancha y un país corriendo atrás."],
  ["22:22", txt("22:22", "hv-mono"), "Hora espejo."],
  ["23:59", txt("último minuto"), "El último minuto del día."],
  ["16:00", D.nota, "Las cuatro: lo-fi de fondo."],
  ["07:07", txt("777", "hv-mono"), "Siete, siete, siete."],
  ["08:08", D.orbita, "Orbe, despierto con vos."]
];
for (const [hh, html, que] of HORAS) sumar("h" + hh.replace(":", ""), "reloj", html, que, 3, (c) => c.hhmm === hh);

// Horas capicúa (las que no tienen guiño propio).
const CAPI = ["capicúa", "ida y vuelta", "espejo", "se lee igual", "palíndromo", "de atrás para adelante"];
const capicuas = [];
for (let h = 0; h < 24; h++) for (let m = 0; m < 60; m++) { const s = dos(h) + dos(m); if (s === [...s].reverse().join("")) capicuas.push(dos(h) + ":" + dos(m)); }
capicuas.filter((hh) => !HORAS.some(([x]) => x === hh)).forEach((hh, i) =>
  sumar("c" + hh.replace(":", ""), "reloj", txt(CAPI[i % CAPI.length]), `Las ${hh}: se lee igual de los dos lados.`, 3, (c) => c.hhmm === hh));

// Fechas (al lado de la fecha de arriba, todo el día).
const FECHAS = [
  ["1/1", D.orbita, "Año nuevo, órbita nueva."],
  ["6/1", txt("reyes"), "Reyes: pasto y agua en la ventana."],
  ["14/2", txt("♡"), "San Valentín."],
  ["29/2", txt("bisiesto"), "Un día que aparece cada cuatro años."],
  ["14/3", txt("π", "hv-serif"), "Día de pi: 3,14."],
  ["2/4", D.escarapela, "2 de abril: Malvinas."],
  ["22/4", D.orbita, "Día de la Tierra: la órbita de todos."],
  ["23/4", txt("un capítulo"), "Día del libro: un capítulo hoy."],
  ["27/4", txt("diseño"), "Día mundial del diseño."],
  ["28/4", D.tela, "Día de los superhéroes."],
  ["29/4", txt("un mimo"), "Día del animal."],
  ["1/5", txt("hoy no se ficha"), "Día del trabajador."],
  ["25/5", D.escarapela, "25 de mayo. Y además, River cumple años: desde 1901."],
  ["26/5", D.banda, "El Monumental se inauguró un 26 de mayo."],
  ["6/6", cir("Привет"), "Día del idioma ruso: привет quiere decir hola."],
  ["7/6", txt("al aire"), "Día del periodista."],
  ["20/6", D.bandera, "Día de la bandera."],
  ["22/6", D.pelota, "22 de junio: el gol de media cancha."],
  ["24/6", diez, "24 de junio: el otro 10 cumple años."],
  ["25/6", D.copa, "25 de junio: la primera copa del mundo."],
  ["26/6", D.copaRoja, "26 de junio: una Libertadores de River."],
  ["29/6", D.copa, "29 de junio: la segunda copa del mundo."],
  ["9/7", D.escarapela, "9 de julio: Independencia."],
  ["10/7", D.copa, "10 de julio: una Copa América."],
  ["14/7", D.copa, "14 de julio: otra Copa América."],
  ["20/7", txt("♞ + amigos", "hv-serif"), "20 de julio: día del ajedrez y del amigo."],
  ["22/7", txt("22/7 ≈ π", "hv-mono"), "22 dividido 7 se parece a pi."],
  ["5/8", D.copaRoja, "5 de agosto: otra Libertadores de River."],
  ["27/8", txt("al aire"), "Día de la radiodifusión."],
  ["11/9", txt("gracias, maestros"), "Día del maestro."],
  ["13/9", txt("256", "hv-mono"), "Día del programador (el día 256 del año)."],
  ["21/9", txt("✎ primavera"), "Día del estudiante y primavera."],
  ["10/10", txt("10·10", "hv-mono"), "Diez del diez."],
  ["26/10", txt("1891", "hv-mono"), "26 de octubre: el Banco Nación cumple años, desde 1891."],
  ["29/10", D.copaRoja, "29 de octubre: la primera Libertadores de River."],
  ["30/10", diez, "30 de octubre: el Diez."],
  ["31/10", txt("boo"), "Noche de brujas."],
  ["6/11", txt("bancario"), "Día del bancario."],
  ["10/11", D.mate, "Día de la tradición."],
  ["11/11", txt("11·11", "hv-mono"), "Once del once."],
  ["22/11", D.nota, "Día de la música."],
  ["30/11", D.mate, "Día nacional del mate."],
  ["1/12", subte("A", "#18A5E0"), "1 de diciembre: el subte cumple años (la línea A, desde 1913)."],
  ["4/12", txt("publicidad"), "Día de la publicidad."],
  ["9/12", D.banda, "9 de diciembre: Madrid."],
  ["12/12", txt("12·12", "hv-mono"), "Doce del doce."],
  ["18/12", D.estrellas, "18 de diciembre: la tercera."],
  ["24/12", D.estrella, "Nochebuena."],
  ["25/12", D.estrella, "Navidad."],
  ["28/12", txt("inocente"), "Día de los inocentes: no creas todo lo que ves hoy."],
  ["31/12", txt("último"), "El último día del año."]
];
for (const [dm, html, que] of FECHAS) {
  const [d, m] = dm.split("/").map(Number);
  sumar("f" + d + "-" + m, "fecha", html, que, 2, (c) => c.d === d && c.m === m);
}

// Momentos de la semana y del mes.
sumar("lunes", "saludo", txt("· uno a la vez"), "Lunes temprano: de a una cosa.", 1, (c) => c.dow === 1 && c.hh >= 6 && c.hh < 10);
sumar("viernes", "saludo", txt("· al fin"), "Viernes a la tarde.", 1, (c) => c.dow === 5 && c.hh >= 17);
sumar("sabado-ajedrez", "pie", txt("sábado: partida larga ♞"), "Sábado a la mañana, día de ajedrez.", 1, (c) => c.dow === 6 && c.hh >= 10 && c.hh < 13);
sumar("semanal", "pie", txt("a las 20, tinta fresca"), "Los domingos a las 20 sale El Semanal.", 1, (c) => c.dow === 0 && c.min >= 19 * 60 && c.min < 20 * 60);
sumar("viernes13", "fecha", D.tela, "Viernes 13.", 2, (c) => c.dow === 5 && c.d === 13);
sumar("noquis", "saludo", txt("· ñoquis del 29"), "El 29 se comen ñoquis.", 1, (c) => c.d === 29);
sumar("buho", "saludo", txt("· los búhos también cuentan"), "Madrugada: hora de los búhos.", 1, (c) => c.hh >= 2 && c.hh < 5);
sumar("mes-nuevo", "fecha", txt("mes nuevo"), "Primer día del mes.", 1, (c) => c.d === 1);
sumar("fin-de-mes", "pie", txt("último del mes"), "Último día del mes.", 1, (c) => c.ultimoDelMes);
sumar("domingo-mate", "saludo", txt("· mate largo"), "Domingo a la mañana.", 1, (c) => c.dow === 0 && c.hh >= 9 && c.hh < 12);

// Días de River (de los datos de River que ya trae Orbe).
sumar("river-dia", "fecha", D.banda, "Hoy juega River.", 2.5, (c) => c.partido && c.minPartido > 60);
sumar("river-previa", "reloj", txt("previa", "hv-rojo"), "Falta menos de una hora para que juegue River.", 3.5, (c) => c.partido && c.minPartido > 0 && c.minPartido <= 60);
sumar("river-juega", "reloj", D.pelota, "River está jugando.", 3.5, (c) => c.partido && c.minPartido <= 0 && c.minPartido > -115);

// Al azar: de a uno, más o menos la mitad de los ratos de 2 horas, nunca el mismo dos ratos seguidos.
const AZAR = [
  ["pie", txt("Orbe gira a 0,0001 rpm"), "Gira despacito, pero gira."],
  ["pie", txt("hecho a mano, sin apuro"), "Orbe se arma de a poco."],
  ["pie", txt("e4 e5, y a laburar", "hv-mono"), "La apertura más clásica."],
  ["pie", `${subte("E", "#6D2B90")} ${txt("subte en hora")}`, "La línea E."],
  ["pie", `${subte("H", "#F4C200")} ${txt("subte en hora")}`, "La línea H."],
  ["pie", `${subte("A", "#18A5E0")} ${txt("subte en hora")}`, "La línea A."],
  ["pie", `${D.nota} ${txt("lo-fi de fondo")}`, "Música para concentrarse."],
  ["pie", txt("variante estable"), "Tu línea temporal está en orden."],
  ["pie", txt("sin ramas en la línea temporal"), "Nada se desvió."],
  ["pie", txt("con un gran Orbe viene una gran agenda"), "Un homenaje, con mate."],
  ["pie", txt("el barrio está tranquilo"), "Ningún villano a la vista."],
  ["pie", cir("спасибо, что зашёл"), "En ruso: gracias por pasar."],
  ["pie", `${D.estrellas}`, "Tres estrellas."],
  ["pie", txt("1901·1938·1986·1996·2015·2018", "hv-mono hv-rojo"), "Fechas que un hincha no olvida."],
  ["pie", txt("100% sin publicidad (y eso que sos publicista)"), "Orbe no tiene anuncios."],
  ["pie", txt("modo sigilo"), "Paso corto, sin ruido."],
  ["pie", txt("respirá en cuatro tiempos"), "Inhalá, sostené, exhalá, sostené."],
  ["pie", txt("otro día en el multiverso"), "En todas las líneas, igual de ocupado."],
  ["pie", txt("versión beta de vos: estable"), "Vos, siempre en desarrollo."],
  ["pie", txt("jaque al día"), "El día no se gana solo."],
  ["saludo", txt("· ♞", "hv-serif"), "Un caballito, por Archivo 64."],
  ["saludo", cir("· привет"), "Hola, en ruso."],
  ["saludo", cir("· мате"), "Mate, escrito en ruso."],
  ["saludo", txt("· e4", "hv-mono"), "La primera jugada."],
  ["saludo", txt("· vamos"), "Vamos."],
  ["saludo", txt("· tierra 616", "hv-mono"), "Tu tierra, en el multiverso."],
  ["saludo", txt("· vecino"), "Tu vecino, siempre."],
  ["saludo", txt("· lo-fi"), "Algo suave de fondo."],
  ["saludo", txt("· modo zen"), "Despacio."],
  ["saludo", D.estrella, "Una estrellita."],
  ["reloj", D.tela, "Una telita en el reloj."],
  ["reloj", D.espiral, "Un remolino naranja, de ninja."],
  ["reloj", D.cuadros, "Cuadros verde y negro: respiración total."],
  ["reloj", D.circulo, "Un círculo violeta: tu dominio."],
  ["reloj", txt("♞", "hv-serif"), "Un caballito de ajedrez."],
  ["reloj", D.mate, "Un mate."],
  ["reloj", D.nota, "Una nota de lo-fi."],
  ["reloj", D.copa, "Una copita del mundo."],
  ["reloj", D.estrella, "Una estrella."],
  ["reloj", D.orbita, "El logo de Orbe, en chiquito."],
  ["fecha", D.estrella, "Una estrella al lado de la fecha."],
  ["fecha", D.tela, "Una telita en la esquina."],
  ["fecha", cir("окт"), "El mes, en ruso."],
  ["fecha", D.espiral, "Un remolino."],
  ["fecha", D.pelota, "Una pelotita."]
];
AZAR.forEach(([lugar, html, que], i) => sumar("a" + i, lugar, html, que, 0, null));
const AZARES = H.filter((h) => h.cuando === null);

// Frases para listas vacías (una de cada tanto, en vez del texto de siempre).
export const VACIOS = [
  "Nada pendiente. Ni en esta línea temporal.", "Todo en orden. El barrio, tranquilo.", "Libre como un domingo sin partido.",
  "Ni un TP a la vista. Mate y a otra cosa.", "Tablero limpio: tablas con el día.", "Cero pendientes. Modo lo-fi.",
  "Nada por acá. Ni una rama suelta.", "Silencio total. Sigilo de ninja.", "Todo tildado. Sentido arácnido en reposo.",
  "Nada que hacer. Disfrutalo, que no dura.", "Lista vacía. Как хорошо.", "Agenda limpia. Respirá en cuatro tiempos.",
  "Nada urgente. El 10 descansa.", "Ningún vencimiento. Ni una estrella de más.", "Todo al día. Variante estable.",
  "Pendientes: cero. Mates: a discreción.", "Ni una tarea. Ni un jaque.", "Despejado como cielo de octubre.",
  "Nada. Nadita. Nadísima.", "Vacío como una cancha a las 7 de la mañana."
];
VACIOS.forEach((t, i) => sumar("v" + i, "vacio", esc(t), "Una frase escondida para las listas vacías.", 0, null));

// Palabras secretas del buscador de Inicio.
const PALABRAS = [
  [["dale river", "vamos river"], `${D.banda} Banda roja puesta.`],
  [["millo"], "El más grande, dicen por ahí."],
  [["1901"], "Desde 1901."],
  [["monumental"], "La casa."],
  [["madrid"], `${D.banda} 9/12. No hace falta decir más.`],
  [["tercera", "la tercera"], `${D.estrellas} 18/12.`],
  [["diego", "diez", "10"], `${diez} Para siempre.`],
  [["messi"], `${D.estrellas} Gracias.`],
  [["copa"], `${D.copa} Una copita, la que quieras.`],
  [["konami"], "↑↑↓↓←→←→BA. Modo leyenda: no hace nada, pero qué lindo."],
  [["jaque"], "Y mate."],
  [["jaque mate"], "♞ Partida cerrada."],
  [["e4"], "e5. Tu turno."],
  [["mate"], `${D.mate} ¿Amargo o con jaque?`],
  [["privet", "привет"], `<span lang="ru">Привет!</span> Hola, en ruso.`],
  [["spasibo", "спасибо"], `<span lang="ru">Пожалуйста.</span> De nada, en ruso.`],
  [["araña", "spidey", "telaraña"], `${D.tela} Sentido arácnido: nada raro por ahora.`],
  [["tva"], "Tu línea temporal está en orden."],
  [["variante"], "Variante detectada: vos. Todo bien."],
  [["multiverso"], "En todas las líneas pediste lo mismo."],
  [["ninja"], `${D.espiral} Paso corto, paso rápido, sin ruido.`],
  [["respiracion", "respiración"], `${D.cuadros} Inhalá cuatro, exhalá cuatro.`],
  [["dominio"], `${D.circulo} Tu escritorio, tus reglas.`],
  [["lofi", "lo-fi"], `${D.nota} Bajá un cambio.`],
  [["subte"], `${subte("E", "#6D2B90")} Vos sabés cuál.`],
  [["42"], "La respuesta. Ahora falta la pregunta."],
  [["xyzzy"], "No pasa nada. Como en las aventuras de texto."],
  [["sudo"], "Acá el sudo sos vos."],
  [["404"], "Página no encontrada. Vos sí."],
  [["gracias"], "De nada. Para eso giro."],
  [["ñ"], "La letra más nuestra."],
  [["orbe gira"], `${D.orbita} Y gira.`]
];
PALABRAS.forEach(([ps, html], i) => sumar("p" + i, "buscador", html, "Escribí «" + ps[0] + "» en el buscador de Inicio.", 0, null));

// Toques escondidos.
const TOQUES = [
  ["t-fecha", "Tocá siete veces la fecha de arriba."],
  ["t-marca", "Mantené apretado el punto rojo del logo de abajo."],
  ["t-konami", "En la compu: ↑↑↓↓←→←→ B A."],
  ["t-revela", "Tocá un huevito y te dice qué es."]
];
TOQUES.forEach(([id, que]) => sumar(id, "toque", "", que, 0, null));

export const HUEVOS = H.map(({ id, lugar, que }) => ({ id, lugar, que }));

// ---------- Elegir los de ahora ----------
function hash(s) { let h = 2166136261; for (const ch of s) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function contexto(ctx) {
  const f = ctx?.fecha instanceof Date ? ctx.fecha : new Date();
  const min = Number.isFinite(ctx?.min) ? ctx.min : f.getHours() * 60 + f.getMinutes();
  const hh = Math.floor(min / 60), mm = min % 60;
  const c = { f, d: f.getDate(), m: f.getMonth() + 1, a: f.getFullYear(), dow: f.getDay(), min, hh, hhmm: dos(hh) + ":" + dos(mm),
    ultimoDelMes: new Date(f.getFullYear(), f.getMonth(), f.getDate() + 1).getDate() === 1, partido: false, minPartido: 0 };
  // El partido: el de los datos de River ({fecha}) o el de la agenda de hoy ({ini} en minutos).
  const p = ctx?.partido !== undefined && ctx?.partido !== null ? ctx.partido : leer("river")?.proximo;
  if (p && Number.isFinite(p.ini) && !p.fecha) { c.partido = true; c.minPartido = p.ini - min; }
  else if (p?.fecha) {
    const t = new Date(p.fecha);
    if (t.getFullYear() === c.a && t.getMonth() + 1 === c.m && t.getDate() === c.d) {
      c.partido = true;
      c.minPartido = t.getHours() * 60 + t.getMinutes() - min;
    }
  }
  c.dia = c.a + "-" + c.m + "-" + c.d;
  c.rato = Math.floor(min / 120);
  return c;
}
// Uno de los «al azar» para este rato de 2 horas (o ninguno): nunca el mismo que en el rato anterior.
function azarDe(dia, rato) {
  if (hash(dia + "#" + rato + "?") % 100 >= 50) return null;
  const n = AZARES.length;
  let i = hash(dia + "#" + rato) % n;
  const antes = rato > 0 ? hash(dia + "#" + (rato - 1)) % n : -1;
  if (i === antes) i = (i + 1) % n;
  return AZARES[i];
}
let memo = { clave: "", activos: [] };
export function activos(ctx) {
  const c = contexto(ctx);
  const forzado = sesion("demoHuevo");
  const clave = c.dia + "-" + c.min + "-" + c.partido + "-" + c.minPartido + "-" + (forzado || "") + "-" + nivelGuinos();
  if (memo.clave === clave) return memo.activos;
  let lista = [];
  if (huevosPrendidos()) {
    const f = forzado && H.find((h) => h.id === forzado && ["fecha", "saludo", "reloj", "pie"].includes(h.lugar));
    const cand = H.filter((h) => h.cuando && ["fecha", "saludo", "reloj", "pie"].includes(h.lugar) && h.cuando(c));
    const az = azarDe(c.dia, c.rato);
    if (az) cand.push(az);
    cand.sort((x, y) => y.prio - x.prio);
    if (f) cand.unshift(f);
    for (const h of cand) {
      if (lista.length >= 2) break;
      if (lista.some((x) => x.lugar === h.lugar || x.id === h.id)) continue;
      lista.push(h);
    }
  }
  memo = { clave, activos: lista };
  return lista;
}

// ---------- Lo que usa Inicio ----------
// huevo("fecha" | "saludo" | "reloj" | "pie" | "vacio", ctx) → un pedacito de HTML, o "" si ahora no toca.
export function huevo(lugar, ctx) {
  if (!huevosPrendidos()) return "";
  if (lugar === "vacio") {
    const c = contexto(ctx);
    const forz = sesion("demoHuevo");
    const v = H.find((h) => h.id === forz && h.lugar === "vacio") ||
      (hash(c.dia + "@" + c.rato) % 100 < 40 ? H.filter((h) => h.lugar === "vacio")[hash(c.dia + "@" + c.rato + "v") % VACIOS.length] : null);
    if (!v) return "";
    visto(v.id);
    return v.html;
  }
  const h = activos(ctx).find((x) => x.lugar === lugar);
  if (!h) return "";
  visto(h.id);
  return `<span class="hv hv-${lugar}" data-hv="${h.id}" role="img" aria-label="${esc(h.que)}">${h.html}</span>`;
}

// Los que ya encontraste (se sincronizan entre el celu y la compu).
export const huevosVistos = () => leer("huevosVistos", []);
function visto(id) {
  const v = huevosVistos();
  if (v.includes(id)) return;
  guardar("huevosVistos", [...v, id].slice(-600));
}

// ---------- Interactivos ----------
let timerEco;
function eco(html, id) {
  if (typeof document === "undefined") return;
  let el = document.querySelector(".hv-eco");
  if (!el) { el = document.createElement("div"); el.className = "hv-eco"; el.setAttribute("role", "status"); el.setAttribute("aria-live", "polite"); document.body.appendChild(el); }
  el.innerHTML = `<span class="hv-eco-t">${html}</span>`;
  el.classList.remove("on"); void el.offsetWidth; el.classList.add("on");
  clearTimeout(timerEco);
  timerEco = setTimeout(() => el.classList.remove("on"), 3800);
  if (id) visto(id);
}
const norm = (s) => String(s || "").trim().toLowerCase().replace(/\s+/g, " ");
const normSinAcento = (s) => norm(s).normalize("NFD").replace(/[̀-ͯ]/g, "");
export function palabraSecreta(texto) {
  const t = norm(texto), u = normSinAcento(texto);
  const i = PALABRAS.findIndex(([ps]) => ps.some((p) => p === t || normSinAcento(p) === u));
  return i < 0 ? null : { id: "p" + i, html: PALABRAS[i][1] };
}

const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
let konami = 0, tecladoListo = false;

// Se llama después de pintar Inicio (una vez por pintada; no duplica escuchas).
export function huevosDespues(raiz) {
  if (!raiz || typeof document === "undefined" || !huevosPrendidos()) return;
  if (raiz.dataset.hvListo === "1") return;
  raiz.dataset.hvListo = "1";
  // Tocar un huevito: te dice qué es.
  raiz.addEventListener("click", (e) => {
    const h = e.target.closest?.(".hv[data-hv]");
    if (!h) return;
    eco(esc(h.getAttribute("aria-label")), "t-revela");
  });
  // Siete toques en la fecha.
  let toques = [];
  raiz.addEventListener("click", (e) => {
    if (!e.target.closest?.('[data-hv-fecha], .fecha-hora, .top .fecha')) return;
    const ahora = Date.now();
    toques = toques.filter((t) => ahora - t < 3500); toques.push(ahora);
    if (toques.length >= 7) { toques = []; eco('<span lang="ru">Семь</span>: siete, en ruso.', "t-fecha"); }
  });
  // Mantener apretado el punto rojo del logo de abajo.
  let apretar = null;
  raiz.addEventListener("pointerdown", (e) => {
    const m = e.target.closest?.('[data-hv-marca], .pie .marca');
    if (!m) return;
    apretar = setTimeout(() => { m.classList.add("hv-gira"); setTimeout(() => m.classList.remove("hv-gira"), 1400); eco(`${D.orbita} Orbe gira desde la v0.1.`, "t-marca"); }, 700);
  });
  ["pointerup", "pointercancel", "pointerleave"].forEach((ev) => raiz.addEventListener(ev, () => clearTimeout(apretar)));
  // Palabras secretas en el buscador.
  const q = raiz.querySelector("#q");
  if (q && q.dataset.hvListo !== "1") {
    q.dataset.hvListo = "1";
    let ultima = "";
    q.addEventListener("input", () => {
      const p = palabraSecreta(q.value);
      if (p && p.id !== ultima) { ultima = p.id; eco(p.html, p.id); }
      if (!p) ultima = "";
    });
  }
  // La tecla famosa, en la compu.
  if (!tecladoListo) {
    tecladoListo = true;
    document.addEventListener("keydown", (e) => {
      if (e.target?.closest?.("input, textarea, select, [contenteditable]")) { konami = 0; return; }
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      konami = k === KONAMI[konami] ? konami + 1 : (k === KONAMI[0] ? 1 : 0);
      if (konami === KONAMI.length) { konami = 0; if (huevosPrendidos()) eco("↑↑↓↓←→←→BA. Treinta vidas no, pero el día rinde.", "t-konami"); }
    });
  }
}

// Para Ajustes: cuántos hay y cuántos encontraste.
export function cuentaHuevos() {
  const ids = new Set(H.map((h) => h.id));
  return { total: ids.size, vistos: huevosVistos().filter((x) => ids.has(x)).length };
}
// Algunos para probar desde Ajustes (se fuerzan con sesion("demoHuevo")).
export const HUEVOS_PRUEBA = [["f30-10", "Diez"], ["f18-12", "Tercera"], ["f9-12", "Madrid"], ["h1010", "10:10"], ["h1812", "18:12"], ["a30", "Telita"], ["a21", "Привет"], ["a12", "Estrellas"], ["v0", "Lista vacía"]];
