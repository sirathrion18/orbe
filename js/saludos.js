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
    "Buenos días. Hoy, con calma, {f}.", "Buen día. El día recién empieza, {n}.",
    // v0.33: más saludos
    "Buen día, {n}. El día está en blanco.", "Arriba, {n}. Hoy se escribe de cero.", "Buen día. Primero el mate, después el mundo, {n}.",
    "Buenos días, {n}. Ducha, mate y a la calle.", "Buen día. La línea E ya calienta motores, {n}.", "Hola, {n}. El sol ya fichó.",
    "Buen día. Lista corta, cabeza clara, {n}.", "Buenos días. Ojos abiertos, {n}.", "Buen día, {n}. Hoy no se arruga.",
    "Arrancamos, {f}. Con orden.", "Buen día. Una buena y el resto sale, {n}.", "Buen día. Cargado al cien, {n}.",
    "Buenas, {n}. Mañana fresquita para pensar.", "Buen día. Que el café no se enfríe, {n}.", "Buen día. Hoy, primero vos, {n}.",
    "Buen día, {n}. Paso corto, paso firme.", "Buen día. A Parque Chacabuco le salió el sol, {n}.", "Buen día. El barrio ya se despertó, {n}.",
    "Hola, {n}. Hoy se juega de local.", "Buen día. Agenda clara, mate tibio, {n}.", "Buen día, {n}. Menos ruido, más foco.",
    "Buenos días. Un día más en órbita, {n}.", "Buen día. Que el día te encuentre listo, {n}.", "Buen día. Lo difícil, antes del almuerzo, {n}.",
    "Arriba, {n}. El mundo no se ordena solo.", "Buen día. Café cargado, ideas claras, {n}.", "Buen día. Hoy rinde el doble, {n}.",
    "Buen día. Abrí la ventana y arrancá, {n}.", "Buen día, {n}. Lo de hoy, hoy.", "Buenos días. Respiro largo y a la cancha, {n}.",
    // v0.41: guiños sutiles (homenajes y paráfrasis propias, nunca frases textuales)
    "Buen día, {n}. Con un gran termo viene una gran responsabilidad.", "Buen día. Variante del día: la tuya, {n}.", "Buen día, {n}. e4, y a ver qué contesta el día.", "Buen día. Доброе утро, {n}.", "Buen día, {n}. Hoy se juega como en Madrid: con paciencia.", "Buen día. Tres estrellas en el pecho y la agenda en la mano, {n}.", "Buen día, {n}. Respiración total: inhalá, exhalá, arrancá.", "Buen día. La línea temporal amaneció en orden, {n}.", "Buen día, {n}. El barrio no se cuida solo.", "Buen día. Pase al 10 y que pase algo, {n}."
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
    "Buenas tardes. Después, a descansar, {n}.",
    // v0.33: más saludos
    "Buenas tardes, {n}. Segundo tiempo.", "Buenas. La tarde también cuenta, {n}.", "Buenas tardes. Recalculando, {n}.",
    "Hola, {n}. Ya hiciste un montón.", "Buenas. Mate de media tarde, {n}.", "Buenas tardes. Se viene el sprint final, {n}.",
    "Buenas, {n}. Un vaso de agua y seguimos.", "Buenas tardes. Lo que quedó, sin drama, {n}.", "Buenas. Tarde de cerrar pendientes, {n}.",
    "Buenas tardes, {f}. Todo sigue en orden.", "Buenas. Estirá la espalda, {n}.", "Buenas tardes. Sol de tarde, cabeza fresca, {n}.",
    "Hola, {n}. Pausa corta, vuelta con todo.", "Buenas. Medialuna y seguimos, {n}.", "Buenas tardes. El día todavía da, {n}.",
    "Buenas. Tachando cosas, {n}.", "Buenas tardes. Menos pantalla, más aire, {n}.", "Buenas, {n}. Ya se ve la salida.",
    "Buenas tardes. Un pendiente menos, {n}.", "Buenas. Termo al día, {n}.", "Buenas tardes. Tarde de foco, {n}.",
    "Buenas, {n}. Tranqui, viene bien.", "Buenas tardes. La recta final, {n}.", "Hola, {n}. Bajá un cambio y seguí.",
    "Buenas tardes. Hoy rindió, {n}.", "Buenas. Revisá y cerrá, {n}.", "Buenas tardes, {n}. Agua, mate y a terminar.",
    "Buenas. A la vuelta, descanso, {n}.",
    // v0.41: guiños sutiles (homenajes y paráfrasis propias, nunca frases textuales)
    "Buenas tardes, {n}. Jaque al pendiente más viejo.", "Buenas. Segundo tiempo, {n}: se define ahora.", "Buenas tardes. Привет, {n}.", "Buenas tardes, {n}. Expansión de dominio: tu escritorio.", "Buenas. Sentido arácnido: algo vence pronto, {n}.", "Buenas tardes, {n}. Clones no tenés: de a una cosa.", "Buenas tardes. Lo-fi de fondo y a seguir, {n}.", "Buenas, {n}. Peón a peón se gana la partida.", "Buenas tardes. Ninguna rama suelta en la línea, {n}.", "Buenas, {n}. Un caño a la tarde y seguimos."
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
    "Buenas noches. Hasta mañana, {n}.",
    // v0.33: más saludos
    "Buenas noches, {n}. Misión cumplida.", "Noche, {n}. Apagá el modo laburo.", "Buenas noches. Hoy sumaste, {n}.",
    "Noche, {f}. Que descanse la cabeza.", "Buenas noches. Una serie y a la cama, {n}.", "Buenas noches. Mañana, con todo, {n}.",
    "Noche. Lo pendiente puede esperar, {n}.", "Buenas noches. Cerrá las pestañas, {n}.", "Noche, {n}. El barrio se apaga.",
    "Buenas noches. Ropa lista para mañana, {n}.", "Noche tranqui. Te lo ganaste, {n}.", "Buenas noches. Menos celu, más sueño, {n}.",
    "Noche, {n}. Que mañana sea liviano.", "Buenas noches. Cena rica y a bajar, {n}.", "Buenas noches, {f}. Día cerrado.",
    "Noche. A cargar el celu y a vos, {n}.", "Buenas noches. Hoy alcanzó, {n}.", "Noche, {n}. Luces bajas.",
    "Buenas noches. Silencio y almohada, {n}.", "Noche. Lo bueno de hoy, para mañana, {n}.", "Buenas noches. Una página y a dormir, {n}.",
    "Noche, {n}. La órbita también descansa.", "Buenas noches. Mañana arranca solo, {n}.", "Noche. Sin culpa, a descansar, {n}.",
    "Buenas noches. Gran día, {n}.", "Noche, {n}. Ya no hay nada urgente.", "Buenas noches. Mañana, mate temprano, {n}.",
    "Noche. Cortá acá, {n}.", "Buenas noches, {n}. Bien ahí.",
    // v0.41: guiños sutiles (homenajes y paráfrasis propias, nunca frases textuales)
    "Buenas noches, {n}. Hoy el barrio quedó a salvo.", "Buenas noches. Tablas con el día, {n}.", "Buenas noches, {n}. Спокойной ночи.", "Buenas noches. Misión cumplida, traje a la percha, {n}.", "Buenas noches, {n}. El multiverso puede esperar.", "Buenas noches. Llama baja, respiración larga, {n}.", "Buenas noches, {n}. Lo que faltó, en otra línea temporal.", "Buenas noches. El Monumental ya apagó las luces, {n}."
  ],
  lunes: [
    "Feliz lunes, {n}.", "Lunes, {n}. Arranca la semana.", "Lunes otra vez, {f}.", "Semana nueva, {n}.",
    "A empezar, {n}.", "Feliz lunes. Mate y a empezar, {n}.", "Lunes. La semana es tuya, {n}.",
    "Lunes. Arrancamos de cero, {n}.",
    // v0.33: más saludos
    "Lunes, {n}. Primera fecha de la semana.", "Lunes. Agenda fresca, {n}.", "Lunes, {f}. Con calma y en orden.",
    "Lunes. Se arranca de a poco, {n}.", "Lunes, {n}. A marcar el ritmo.", "Lunes. Semana en blanco, {n}.",
    "Lunes. Primer mate de la semana, {n}.", "Lunes, {n}. Vamos que es corto.",
    // v0.41: guiños sutiles (homenajes y paráfrasis propias, nunca frases textuales)
    "Lunes, {n}. Con un gran lunes viene una gran semana.", "Lunes. Arranca el torneo, {n}."
  ],
  martes: [
    "Feliz martes, {n}.", "Martes en marcha, {n}.", "Martes, {f}.", "Martes. Gym con mamá a la tarde, {n}.",
    "Martes. Seguimos con todo, {n}.",
    // v0.33: más saludos
    "Martes, {n}. Ya agarró ritmo.", "Martes. Día de gym, {n}.", "Martes. Semana en marcha, {f}.",
    "Martes, {n}. Sin vueltas.", "Martes. Hoy se entrena, {n}.", "Martes, {n}. Paso firme."
  ],
  miercoles: [
    "Mitad de semana, {n}.", "Miércoles, {n}.", "Feliz miércoles, {f}.", "Miércoles. Mitad de camino, {n}.",
    "Miércoles. Ya pasó lo peor, {n}.",
    // v0.33: más saludos
    "Miércoles, {n}. Ecuador de la semana.", "Miércoles. Se ve el finde a lo lejos, {n}.", "Miércoles, {f}. Mitad hecha.",
    "Miércoles. Ni lunes ni viernes, {n}.", "Miércoles, {n}. A sostener el ritmo.", "Miércoles. Media semana adentro, {n}."
  ],
  jueves: [
    "Jueves, {n}. Ya casi.", "Feliz jueves, {n}.", "Jueves, {f}.", "Jueves. Hoy hay fútbol, {n}.",
    "Jueves. Último tirón, {n}.",
    // v0.33: más saludos
    "Jueves, {n}. Previa del viernes.", "Jueves. Botines listos, {n}.", "Jueves, {f}. Falta poquito.",
    "Jueves. Se siente el finde, {n}.", "Jueves, {n}. A cerrar lo grande.", "Jueves. Día de fulbito, {n}."
  ],
  viernes: [
    "Feliz viernes, {n}.", "Viernes, {n}. Último esfuerzo.", "Por fin viernes, {n}.",
    "Viernes, {f}. Se viene el finde.", "Viernes. Se huele el finde, {n}.", "Viernes. Cerramos la semana, {n}.",
    "Feliz viernes. Mate y a terminar, {n}.",
    // v0.33: más saludos
    "Viernes, {n}. Último empujón.", "Viernes. Se cierra la semana, {f}.", "Viernes. Modo finde cargando, {n}.",
    "Viernes, {n}. La cabeza ya está en el finde.", "Viernes. Lo que no salió, el lunes, {n}.", "Viernes. Plan para el finde, {n}.",
    "Viernes, {n}. Semana ganada.", "Viernes. Ya casi, {n}.",
    // v0.41: guiños sutiles (homenajes y paráfrasis propias, nunca frases textuales)
    "Viernes, {n}. Último round de la semana.", "Viernes. Pitazo final a las 17, {n}."
  ],
  finde: [
    "Sábado tranqui, {n}.", "Domingo sin apuro, {n}.", "Finde, {n}.", "Hoy no hay que correr, {n}.", "Día libre, {n}.",
    "Despacio, {n}.", "Sin reloj hoy, {n}.", "Buen finde, {f}.", "Sábado. Mate largo y sin reloj, {n}.",
    "Domingo. Mate, sol y nada más, {n}.", "Finde. Termo y plan, {n}.", "Sábado. Hoy no se corre, {n}.",
    "Domingo. Recargá pilas, {n}.", "Finde. A disfrutar, {f}.",
    // v0.33: más saludos
    "Sábado, {n}. Sin alarma.", "Domingo. Pijama largo, {n}.", "Finde, {n}. Hoy no se apura nada.",
    "Sábado. Plan tranqui, {n}.", "Domingo, {f}. Para recargar.", "Finde. Mate al sol, {n}.",
    "Sábado. Salida, siesta o las dos, {n}.", "Domingo. Asado o pastas, {n}.", "Finde, {n}. El reloj descansa.",
    "Sábado. Hoy se disfruta, {n}.", "Domingo. Mañana arranca, hoy no, {n}.", "Finde. Celu en silencio, {n}.",
    // v0.41: guiños sutiles (homenajes y paráfrasis propias, nunca frases textuales)
    "Finde, {n}. Hoy el traje queda colgado.", "Finde. Partida larga y mate, {n}.", "Finde, {n}. Modo lo-fi activado.", "Finde. Sin entregas a la vista, {n}."
  ],
  libre: [
    "Día libre, {n}.", "Hoy es tuyo, {n}.", "Nada urgente, {n}.", "Tiempo para vos, {n}.", "Día para disfrutar, {n}.",
    "Día libre. Mate sin apuro, {n}.", "Hoy es tuyo. Hacé lo que te guste, {n}.", "Día libre. Proyecto o siesta, {n}.",
    "Nada urgente. Disfrutá, {n}.",
    // v0.33: más saludos
    "Día libre, {n}. Sin agenda.", "Hoy no hay que fichar, {n}.", "Día libre. Lo que pinte, {n}.",
    "Hoy, sin reloj, {f}.", "Día libre. Proyecto propio, {n}.", "Libre, {n}. Hoy se elige.",
    "Día libre. Nada que rendir, {n}.", "Hoy no se corre, {n}."
  ],
  lluvia: [
    "Llueve, {n}. Paraguas.", "Día gris, {n}.", "Día de lluvia, {f}.", "Agua afuera, {n}. Abrigate.",
    "Llueve. Mate y mantita, {n}.", "Día de lluvia. Paraguas en la mochila, {n}.", "Llueve. Ideal para el mate, {n}.",
    // v0.33: más saludos
    "Llueve, {n}. Día de techo.", "Lluvia. Zapatillas que aguanten, {n}.", "Día gris. Mate y algo rico, {n}.",
    "Llueve, {f}. Salí con tiempo.", "Lluvia. El subte va a estar lleno, {n}.", "Día de lluvia. Ideal para ordenar, {n}."
  ],
  calor: [
    "Hace calor, {n}. Agua.", "Día caluroso, {n}.", "Calor. Hoy va tereré, {n}.", "Mucho calor. Agua y sombra, {n}.",
    "Calor. Tereré bien frío, {n}.",
    // v0.33: más saludos
    "Calor, {n}. Botella de agua a mano.", "Hace calor. Ropa liviana, {n}.", "Calor. Sombra y agua fresca, {n}.",
    "Día pesado, {n}. Tomá agua.", "Calor, {f}. Hoy, despacio."
  ],
  frio: [
    "Hace frío, {n}. Abrigate.", "Día fresco, {n}.", "Frío. Mate caliente y abrigo, {n}.",
    "Hace frío. Bufanda y termo, {n}.", "Fresco. Abrigate bien, {n}.",
    // v0.33: más saludos
    "Frío, {n}. Campera y a la calle.", "Hace frío. Mate bien caliente, {n}.", "Frío, {f}. Capas, capas, capas.",
    "Fresquito, {n}. Bufanda en la mochila.", "Frío. Hoy va sopa, {n}."
  ],
  river: [
    "Hoy juega el Millo, {n}.", "Día de River, {n}.", "Hoy hay River, {f}.", "Se juega, {n}.",
    "Noche millonaria, {n}.", "Hoy juega River. Mate y a alentar, {n}.", "Día de River. Camiseta puesta, {n}.",
    "Hoy hay River. Vamos Millo, {n}.", "Juega el Más Grande. A alentar, {n}.",
    // v0.33: más saludos
    "Hoy juega River, {n}. Corazón millonario.", "Día de River. Hoy se alienta, {n}.", "Juega el Millo, {f}.",
    "Hoy hay River. Que ruede la pelota, {n}.", "Día millonario, {n}.", "Hoy juega River. Cábala en su lugar, {n}.",
    "River en la cancha. Vos, a alentar, {n}.", "Hoy hay partido, {n}. Banda roja puesta.", "Juega River. De local o de visita, {n}.",
    "Día de River, {n}. Todo lo demás, después."
  ],
  marvel: [
    "Tu amigo y vecino, {n}.", "Un gran poder, {n}.", "Hola, vecino {n}.", "Otro día en el barrio, {n}.",
    "Con poderes, {n}.", "Un gran poder. Una gran agenda, {n}.", "Tu amigo y vecino. Mate en mano, {n}.",
    "Spidey sense activado. Vamos, {n}.",
    // v0.33: más saludos
    "Hola, vecino. El barrio te necesita, {n}.", "Sentido arácnido en alerta, {n}.", "Otro día salvando la agenda, {n}.",
    "Máscara puesta, {n}. A la calle."
  ],
  lab: [
    "Modo Stark activado, {n}.", "Sistemas en línea, {n}.", "Orbe, a lo J.A.R.V.I.S. Buen día, {n}.",
    "Escaneo completo. Todo listo, {n}.", "Traje puesto. Vamos, {n}.", "Reactor al cien. Arrancamos, {n}.",
    // v0.33: más saludos
    "Diagnóstico completo. Todo verde, {n}.", "Taller abierto, {n}.", "Prototipo del día en marcha, {n}.",
    "Sistemas al cien, {f}."
  ],
  decreto: [
    "Doom no saluda, {n}. Doom convoca.", "Por decreto real, hoy se rinde, {n}.", "Latveria aprueba tu agenda, {n}.",
    "El soberano te recibe, {n}.", "Doom decreta: hoy se gana, {n}.",
    // v0.33: más saludos
    "Por orden del soberano: buen día, {n}.", "El trono aprueba tu agenda, {n}.", "Decreto del día: hoy se gana, {n}."
  ],
  tva: [
    "Variante {n}, presentate.", "Por todo el tiempo. Siempre, {n}.", "Propósito glorioso, {n}.",
    "La línea temporal te espera, {n}.", "Expediente abierto, {n}.",
    // v0.33: más saludos
    "Variante {n}, tu línea está estable.", "Expediente al día, {n}.", "Sin ramas a la vista, {n}."
  ],
  entrega: [
    "Hoy se entrega, {n}. Vos podés.", "Día de entrega, {n}.", "Último empujón, {f}.",
    // v0.33: más saludos
    "Hoy se entrega. Revisá y mandá, {n}.", "Entrega hoy, {f}. Último repaso.", "Día de entrega. Se puede, {n}.",
    "Hoy se sube, {n}. Respirá y dale."
  ],
  madrugada: [
    "Todavía despierto, {n}.", "Madrugada, {n}.", "Es tarde, {n}.", "Hora de dormir, {n}.", "Todavía en pie, {f}.",
    // v0.33: más saludos
    "Madrugada, {n}. Mañana te vas a acordar.", "Es tarde, {n}. El sueño también suma.", "Todavía en vela, {n}.",
    "Madrugada. Cerrá todo y a dormir, {n}.", "Es tardísimo, {f}.", "Madrugada. Lo de mañana, mañana, {n}.",
    "Hora de apagar, {n}.", "Madrugada, {n}. Ya no hay nada que no espere.", "Es tarde. Tu yo de mañana te lo pide, {n}.",
    "Madrugada. Celu a cargar, {n}.", "Sigue la luz prendida, {n}.", "Madrugada, {n}. Unas horas de sueño valen oro.",
    "Es tarde. A la cucha, {n}.",
    // v0.41: guiños sutiles (homenajes y paráfrasis propias, nunca frases textuales)
    "Madrugada, {n}. Ni los ninjas entrenan a esta hora.", "Es tarde, {n}. Hasta los héroes duermen.", "Madrugada. El reloj de la TVA dice: a dormir, {n}.", "Madrugada, {n}. Jaque mate al insomnio."
  ],
  cumple: [
    "¡Feliz cumpleaños, {n}!", "Feliz cumple, {f}.",
    // v0.33: más saludos
    "¡Feliz cumple, {n}! Hoy, todo tuyo.", "¡Feliz vuelta al sol, {n}!"
  ],
  // v0.40: guiños especiales (frases propias)
  venom: [
    "Buenas noches, {n}. Nosotros también.", "Acá estamos, {n}. Los dos.", "Nosotros nos quedamos despiertos, {n}.",
    "Somos dos esta noche, {n}.", "Llegamos, {n}. Juntos.", "Nosotros te cuidamos la agenda, {n}."
  ],
  millo: [
    "Banda roja puesta, {n}.", "El Millo te saluda, {n}.", "Corazón millonario, {n}.", "Hoy se piensa en rojo y blanco, {n}."
  ],
  ninja: [
    "Sin ruido y a fondo, {n}.", "Paso rápido, {n}. Nadie te ve venir.", "Entrenamiento del día, {n}.", "Hoy se avanza en silencio, {n}."
  ],
  diez: [
    "Hoy jugás de 10, {n}.", "Cabeza levantada, {n}.", "La diez es tuya hoy, {n}.", "Pase corto y adelante, {n}."
  ],
  cazador: [
    "Respirá hondo, {n}.", "Filo y calma, {n}.", "Un corte limpio a la vez, {n}.", "Hoy se respira en cuatro tiempos, {n}."
  ],
  maldicion: [
    "Tu círculo, tus reglas, {n}.", "Adentro del círculo mandás vos, {n}.", "Hoy nada pesado entra, {n}.", "Espacio propio abierto, {n}."
  ]
};
