// Saludos de Orbe. {n} es el nombre corto (Nacho) y {f} el formal (Ignacio).
// Editalos libremente: agregá, borrá o cambiá. Orbe elige según el momento del día,
// el día de la semana y el modo, y rota para no repetir dos días seguidos.
// Una oración por renglón: si el saludo tiene dos oraciones, la primera va arriba y la segunda abajo.
export const SALUDOS = {
  manana: [
    "Buen día, {n}.", "Arrancamos, {n}.", "Buenos días, {f}.", "Arriba, {n}.", "Buen día. Café y a la cancha, {n}.",
    "Hola, {n}. Día nuevo.", "Buenas, {n}.", "Mañana en marcha, {n}.", "Despierto y en órbita, {n}.",
    "Buen día, {f}. Todo en orden.", "Hola de nuevo, {n}.", "Primera mirada del día, {n}.",
    "Buen día. Vamos de a una, {n}.", "Hola, {n}. Mirá lo que viene.", "A paso firme, {n}.",
    "Buen día, {n}. Sin apuro.", "Hola, {f}. Arrancamos.", "Bienvenido al día, {n}.",
    "Buen día. Mate y a la cancha, {n}.", "Buen día. Pavita al fuego, {n}.", "Arrancamos. Primer mate del día, {n}.",
    "Buen día. Termo lleno, {n}.", "Buen día. Un mate y vemos, {n}.", "Buenos días. Cebá tranquilo, {n}.",
    "Buen día. Mate amargo y a laburar, {n}.", "Arriba. Que el mate no se lave, {n}.",
    "Buen día. Yerba nueva, día nuevo, {n}.", "Buen día. Mate en mano, {n}.",
    "Buen día. Café o mate, vos elegís, {n}.", "Buen día. Hoy rinde, {n}.", "Arrancó el día. Vamos, {n}.",
    "Buen día. Paso a paso, {n}.", "Buen día. Agenda a la vista, {n}.", "Buenos días. Hoy se puede, {n}.",
    "Buen día. Primero lo importante, {n}.", "Buen día. Que salga lindo, {n}.", "Buen día. Mate y agenda, {n}.",
    "Buen día. El agua a 80 grados, {n}.", "Buen día. Sin hervir el agua, {n}.",
    "Arrancamos. Termo, llaves y celu, {n}.", "Buen día. A cebar y a planear, {n}.",
    "Buenos días. Todo listo para salir, {f}.", "Buen día. Una cosa a la vez, {n}.",
    "Buen día. Respirá y arrancá, {n}.", "Hola. Mañana con mate, {n}.", "Buen día. Vamos que se puede, {n}.",
    "Buenos días. Hoy, con calma, {f}.", "Buen día. El día recién empieza, {n}."
  ],
  tarde: [
    "Buenas tardes, {n}.", "Mitad del día, {n}.", "Seguimos, {n}.", "Hola, {n}. ¿Cómo viene?", "Buenas, {f}.",
    "La tarde es tuya, {n}.", "Tarde en curso, {n}.", "Vamos bien, {n}.", "Un respiro, {n}.", "Hola, {n}. Repasemos.",
    "Buenas tardes, {f}.", "Media jornada, {n}.", "Ya pasó lo más pesado, {n}.", "Hola, {n}. Un vistazo.",
    "Seguimos en órbita, {n}.", "Buenas tardes. Un mate y seguimos, {n}.", "Buenas. Pausa para el mate, {n}.",
    "Buenas tardes. Termo recargado, {n}.", "Media tarde. Otro mate, {n}.",
    "Buenas tardes. Vamos cerrando cosas, {n}.", "Buenas. Lo que queda, sale, {n}.",
    "Buenas tardes. Un respiro y seguimos, {n}.", "Hola. Tarde productiva, {n}.",
    "Buenas tardes. Mate con algo dulce, {n}.", "Buenas. Ya falta menos, {n}.",
    "Buenas tardes. Ordenemos lo que viene, {n}.", "Buenas. Seguimos en órbita, {f}.",
    "Buenas tardes. Agua caliente y a seguir, {n}.", "Hola. La tarde rinde, {n}.",
    "Buenas tardes. Un vistazo rápido, {n}.", "Buenas. Pavita en la mochila, {n}.",
    "Buenas tardes. A paso firme, {n}.", "Buenas. Que no se enfríe el mate, {n}.",
    "Buenas tardes. Todo bajo control, {n}.", "Buenas. Lo urgente primero, {n}.", "Buenas tardes. Mate y foco, {n}.",
    "Buenas. Vamos bien, {f}.", "Buenas tardes. Un rato más, {n}.", "Buenas. A cerrar la jornada, {n}.",
    "Buenas tardes. Después, a descansar, {n}."
  ],
  noche: [
    "Buenas noches, {n}.", "Cerraste el día, {n}.", "Hora de bajar, {n}.", "Buenas noches, {f}.",
    "Mañana se sigue, {n}.", "Día terminado, {n}.", "A descansar, {n}.", "Noche tranquila, {n}.",
    "Buenas noches. Bien hecho, {n}.", "Se apaga el día, {n}.", "Hasta mañana, {n}.", "Noche, {f}. A recargar.",
    "Último vistazo, {n}.", "Buenas noches. El último mate, {n}.", "Buenas noches. Se lavó la yerba, {n}.",
    "Buenas noches. Bien jugado hoy, {n}.", "Noche. A guardar el termo, {n}.", "Buenas noches. Mañana seguimos, {n}.",
    "Buenas noches. Descanso merecido, {n}.", "Noche tranquila. A desconectar, {n}.",
    "Buenas noches. Un capítulo y a dormir, {n}.", "Buenas noches. Hoy rindió, {f}.",
    "Noche. Celu lejos de la cama, {n}.", "Buenas noches. Lo que quedó, mañana, {n}.",
    "Buenas noches. Alarma lista, {n}.", "Noche. A recargar energía, {n}.", "Buenas noches. Bien hecho, {f}.",
    "Buenas noches. Hasta mañana, {n}."
  ],
  lunes: [
    "Feliz lunes, {n}.", "Lunes, {n}. Arranca la semana.", "Lunes otra vez, {f}.", "Semana nueva, {n}.",
    "A empezar, {n}.", "Feliz lunes. Mate y a empezar, {n}.", "Lunes. La semana es tuya, {n}.",
    "Lunes. Arrancamos de cero, {n}."
  ],
  martes: [
    "Feliz martes, {n}.", "Martes en marcha, {n}.", "Martes, {f}.", "Martes. Gym con mamá a la tarde, {n}.",
    "Martes. Seguimos con todo, {n}."
  ],
  miercoles: [
    "Mitad de semana, {n}.", "Miércoles, {n}.", "Feliz miércoles, {f}.", "Miércoles. Mitad de camino, {n}.",
    "Miércoles. Ya pasó lo peor, {n}."
  ],
  jueves: [
    "Jueves, {n}. Ya casi.", "Feliz jueves, {n}.", "Jueves, {f}.", "Jueves. Hoy hay fútbol, {n}.",
    "Jueves. Último tirón, {n}."
  ],
  viernes: [
    "Feliz viernes, {n}.", "Viernes, {n}. Último esfuerzo.", "Por fin viernes, {n}.",
    "Viernes, {f}. Se viene el finde.", "Viernes. Se huele el finde, {n}.", "Viernes. Cerramos la semana, {n}.",
    "Feliz viernes. Mate y a terminar, {n}."
  ],
  finde: [
    "Sábado tranqui, {n}.", "Domingo sin apuro, {n}.", "Finde, {n}.", "Hoy no hay que correr, {n}.", "Día libre, {n}.",
    "Despacio, {n}.", "Sin reloj hoy, {n}.", "Buen finde, {f}.", "Sábado. Mate largo y sin reloj, {n}.",
    "Domingo. Mate, sol y nada más, {n}.", "Finde. Termo y plan, {n}.", "Sábado. Hoy no se corre, {n}.",
    "Domingo. Recargá pilas, {n}.", "Finde. A disfrutar, {f}."
  ],
  libre: [
    "Día libre, {n}.", "Hoy es tuyo, {n}.", "Nada urgente, {n}.", "Tiempo para vos, {n}.", "Día para disfrutar, {n}.",
    "Día libre. Mate sin apuro, {n}.", "Hoy es tuyo. Hacé lo que te guste, {n}.", "Día libre. Proyecto o siesta, {n}.",
    "Nada urgente. Disfrutá, {n}."
  ],
  lluvia: [
    "Llueve, {n}. Paraguas.", "Día gris, {n}.", "Día de lluvia, {f}.", "Agua afuera, {n}. Abrigate.",
    "Llueve. Mate y mantita, {n}.", "Día de lluvia. Paraguas en la mochila, {n}.", "Llueve. Ideal para el mate, {n}."
  ],
  calor: [
    "Hace calor, {n}. Agua.", "Día caluroso, {n}.", "Calor. Hoy va tereré, {n}.", "Mucho calor. Agua y sombra, {n}.",
    "Calor. Tereré bien frío, {n}."
  ],
  frio: [
    "Hace frío, {n}. Abrigate.", "Día fresco, {n}.", "Frío. Mate caliente y abrigo, {n}.",
    "Hace frío. Bufanda y termo, {n}.", "Fresco. Abrigate bien, {n}."
  ],
  river: [
    "Hoy juega el Millo, {n}.", "Día de River, {n}.", "Hoy hay River, {f}.", "Se juega, {n}.",
    "Noche millonaria, {n}.", "Hoy juega River. Mate y a alentar, {n}.", "Día de River. Camiseta puesta, {n}.",
    "Hoy hay River. Vamos Millo, {n}.", "Juega el Más Grande. A alentar, {n}."
  ],
  marvel: [
    "Tu amigo y vecino, {n}.", "Un gran poder, {n}.", "Hola, vecino {n}.", "Otro día en el barrio, {n}.",
    "Con poderes, {n}.", "Un gran poder. Una gran agenda, {n}.", "Tu amigo y vecino. Mate en mano, {n}.",
    "Spidey sense activado. Vamos, {n}."
  ],
  entrega: [
    "Hoy se entrega, {n}. Vos podés.", "Día de entrega, {n}.", "Último empujón, {f}."
  ],
  madrugada: [
    "Todavía despierto, {n}.", "Madrugada, {n}.", "Es tarde, {n}.", "Hora de dormir, {n}.", "Todavía en pie, {f}."
  ],
  cumple: [
    "¡Feliz cumpleaños, {n}!", "Feliz cumple, {f}."
  ]
};
