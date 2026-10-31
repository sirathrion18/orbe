// La rutina de Nacho: martes en el gym (60 min) y 15 min en casa otro día.
// Pensada para arrancar, cuidar espalda baja, hombros y cuello, y rendir en el fútbol.
// Cada ejercicio tiene su animación de Pedri con el mismo id (js/pedri-ejercicios.js).
// No reemplaza a un profe ni a un kinesiólogo: si algo duele de verdad, se corta y se consulta.

export const RUTINA_GYM = [
  { bloque: "Entrada en calor", min: "8 min", items: [
    { id: "bici", nombre: "Bici fija", dosis: "5 min suave", descanso: "—",
      claves: ["Asiento a la altura de la cadera: abajo, la rodilla queda apenas flexionada.", "Ritmo en el que puedas hablar."],
      error: "Asiento bajo: las rodillas suben de más y cargan.", alternativa: "Cinta caminando rápido." },
    { id: "gato", nombre: "Gato-camello", dosis: "8 lentos", descanso: "—",
      claves: ["Manos debajo de los hombros, rodillas debajo de la cadera.", "Redondeá exhalando, arqueá inhalando.", "Movimiento chico y lento."],
      error: "Mover solo el cuello: la que se mueve es la espalda entera.", alternativa: "De pie, con las manos en las rodillas." },
    { id: "rotacion", nombre: "Rotación de espalda alta en cuatro patas", dosis: "6 por lado", descanso: "—",
      claves: ["La cadera no se mueve.", "El brazo sube siguiendo al pecho; la mirada acompaña la mano."],
      error: "Girar desde la cadera o la cintura.", alternativa: "Sentado en un banco, brazos cruzados, girando el pecho." },
  ] },
  { bloque: "Fuerza", min: "2 series · 90 s de descanso", items: [
    { id: "sentadilla", nombre: "Sentadilla con mancuerna al pecho, al cajón", dosis: "2 × 10–12", descanso: "90 s", peso: true,
      claves: ["Mancuerna pegada al pecho, pecho arriba.", "Bajá en 2 tiempos mandando la cola atrás; rozá el cajón sin sentarte.", "Rodillas en la línea de los pies."],
      error: "Rodillas que se cierran hacia adentro al subir.", alternativa: "Sentadilla al cajón sin peso." },
    { id: "remo", nombre: "Remo sentado en polea", dosis: "2 × 10–12", descanso: "90 s", peso: true,
      claves: ["Espalda derecha, sin balancearte.", "Llevá los codos atrás pegados al cuerpo hasta la panza.", "Hombros lejos de las orejas."],
      error: "Tirar con la espalda baja hacia atrás para mover más peso.", alternativa: "Remo en máquina con pecho apoyado." },
    { id: "puente", nombre: "Puente de glúteo con la espalda en un banco", dosis: "2 × 10–12", descanso: "90 s", peso: true,
      claves: ["Borde del banco debajo de los omóplatos.", "Empujá con los talones; arriba, rodilla, cadera y hombro en línea.", "Mentón adentro, mirando hacia adelante."],
      error: "Arquear la espalda baja arriba en vez de apretar la cola.", alternativa: "Puente de glúteo en el piso." },
    { id: "press", nombre: "Press de pecho en máquina, agarre neutro", dosis: "2 × 10–12", descanso: "90 s", peso: true,
      claves: ["Manijas a la altura del medio del pecho, palmas enfrentadas.", "Empujá sin trabar los codos.", "Volvé lento, sin pasar la línea del cuerpo."],
      error: "Asiento bajo: las manijas quedan altas y cargan el hombro.", alternativa: "Flexiones de brazos en la pared o en un banco." },
    { id: "jalon", nombre: "Jalón al pecho, agarre neutro", dosis: "2 × 10–12", descanso: "90 s", peso: true,
      claves: ["Muslos trabados bajo el rodillo.", "Bajá la manija al pecho llevando los codos hacia abajo.", "Siempre por delante de la cabeza."],
      error: "Tirarse muy atrás o bajar la barra detrás de la nuca.", alternativa: "Jalón con banda elástica de rodillas." },
    { id: "facepull", nombre: "Face pull con soga en polea alta", dosis: "2 × 12–15", descanso: "60 s", peso: true,
      claves: ["Polea a la altura de la cara.", "Tirá hacia la frente abriendo la soga, codos altos.", "Liviano: es de postura, no de fuerza."],
      error: "Peso alto que te hace tirar con la espalda.", alternativa: "Separar una banda elástica a la altura del pecho." },
    { id: "estocada", nombre: "Estocada hacia atrás", dosis: "2 × 8 por pierna", descanso: "90 s", peso: true,
      claves: ["Paso largo hacia atrás, torso derecho.", "Bajá derecho, como un ascensor; la rodilla de atrás casi toca el piso.", "La rodilla de adelante sobre el pie."],
      error: "Paso corto: la rodilla de adelante se va muy adelante.", alternativa: "Agarrado de una máquina o la pared, sin peso." },
  ] },
  { bloque: "Para el fútbol", min: "60 s de descanso", items: [
    { id: "talones", nombre: "Elevación de talones", dosis: "2 × 15", descanso: "60 s",
      claves: ["Subí rápido hasta la punta, arriba un segundo.", "Bajá lento, en 3 tiempos.", "Apoyate en la pared solo para el equilibrio."],
      error: "Rebotar abajo sin control.", alternativa: "En un escalón, para más recorrido." },
    { id: "aductores", nombre: "Aductores en máquina", dosis: "2 × 12", descanso: "60 s", peso: true,
      claves: ["Espalda apoyada, rango cómodo para arrancar.", "Cerrá las piernas en 1 tiempo, abrí en 3.", "Peso liviano las primeras semanas."],
      error: "Abrir más de lo cómodo con mucho peso.", alternativa: "Apretar una pelota entre las rodillas acostado, 20 s." },
  ] },
  { bloque: "Zona media", min: "45 s de descanso", items: [
    { id: "deadbug", nombre: "Dead bug", dosis: "2 × 8 por lado", descanso: "45 s",
      claves: ["Espalda baja pegada al piso todo el tiempo.", "Brazo y pierna contrarios, lento.", "Exhalá mientras estirás."],
      error: "Que la espalda se despegue del piso al estirar la pierna.", alternativa: "Mover solo las piernas, de a una." },
    { id: "birddog", nombre: "Bird dog", dosis: "2 × 8 por lado", descanso: "45 s",
      claves: ["Brazo y pierna contrarios, hasta la línea del cuerpo.", "La cadera no rota: imaginá un vaso en la espalda.", "Arriba, 2 segundos."],
      error: "Levantar la pierna más alto que la cadera.", alternativa: "Solo la pierna, o solo el brazo." },
    { id: "plancha", nombre: "Plancha", dosis: "3 × 20–30 s", descanso: "45 s",
      claves: ["Codos debajo de los hombros.", "Apretá la cola y la panza; el cuerpo en línea.", "Respirá normal."],
      error: "Cadera caída o muy arriba.", alternativa: "Plancha con las rodillas apoyadas." },
  ] },
  { bloque: "Cierre", min: "4 min", items: [
    { id: "estiramiento", nombre: "Estiramiento de cadera arrodillado", dosis: "30 s por lado", descanso: "—",
      claves: ["Una rodilla en el piso, la otra adelante.", "Apretá la cola de la pierna de atrás y llevá la cadera apenas adelante.", "Torso derecho."],
      error: "Arquear la espalda en vez de mover la cadera.", alternativa: "De pie, con una pierna atrás apoyada en la punta." },
    { id: "respiracion", nombre: "Respiración lenta", dosis: "2 min", descanso: "—",
      claves: ["Inhalá por la nariz en 4.", "Exhalá por la boca en 6.", "Hombros quietos, se mueve la panza."],
      error: "Levantar los hombros al inhalar.", alternativa: "Acostado boca arriba con las rodillas flexionadas." },
  ] },
];

export const RUTINA_CASA = [
  { bloque: "En casa · 15 min, otro día de la semana", min: "sin descanso largo", items: [
    { id: "papada", nombre: "Mentón hacia atrás (papada)", dosis: "10 × 3 s", descanso: "—",
      claves: ["Mirada al frente.", "Llevá la cabeza atrás como haciendo papada, sin bajar la vista.", "Sostené 3 segundos."],
      error: "Bajar la cabeza en vez de llevarla atrás.", alternativa: "Acostado, apretando la nuca contra el piso." },
    { id: "gato", nombre: "Gato-camello", dosis: "10 lentos", descanso: "—",
      claves: ["Redondeá exhalando, arqueá inhalando.", "Movimiento chico y lento."],
      error: "Mover solo el cuello.", alternativa: "De pie, manos en las rodillas." },
    { id: "banda", nombre: "Separar la banda elástica", dosis: "2 × 15", descanso: "30 s",
      claves: ["Brazos estirados a la altura del pecho.", "Abrí juntando los omóplatos, hombros abajo.", "Volvé lento."],
      error: "Subir los hombros hacia las orejas.", alternativa: "Sin banda: juntar los omóplatos 3 s." },
    { id: "puentepiso", nombre: "Puente de glúteo en el piso", dosis: "2 × 15", descanso: "30 s",
      claves: ["Pies cerca de la cola, al ancho de la cadera.", "Subí apretando la cola hasta la línea rodilla-cadera-hombro.", "Bajá lento."],
      error: "Empujar con la espalda baja.", alternativa: "Sostener arriba 20 s." },
    { id: "birddog", nombre: "Bird dog", dosis: "2 × 8 por lado", descanso: "30 s",
      claves: ["La cadera no rota.", "Arriba, 2 segundos."],
      error: "Levantar la pierna de más.", alternativa: "Solo la pierna." },
    { id: "respiracion", nombre: "Respiración lenta", dosis: "2 min", descanso: "—",
      claves: ["Inhalá en 4, exhalá en 6."],
      error: "Levantar los hombros al inhalar.", alternativa: "Acostado." },
  ] },
];

// Cómo sigue: 8 semanas.
export const PROGRESION = [
  { semanas: "1 y 2", texto: "Técnica. Peso con el que hacés 12 repeticiones y te sobran 4. 2 series." },
  { semanas: "3 y 4", texto: "Subí el peso de a poco: cuando las 2 series de 12 salen cómodas, la próxima vez un escalón más (2,5 kg o una placa)." },
  { semanas: "5 y 6", texto: "3 series en sentadilla, remo, puente, press y jalón. Para que entre en 60 min: remo con press y jalón con face pull, uno atrás del otro." },
  { semanas: "7 y 8", texto: "Misma regla: 3 × 12 cómodas → subís. Plancha a 3 × 40 s. Si algo molesta, volvés al peso anterior y lo anotás." },
];

export const TODOS_GYM = RUTINA_GYM.flatMap((b) => b.items);
export const TODOS_CASA = RUTINA_CASA.flatMap((b) => b.items);
// Los que cuentan para "rutina completa" y XP por ejercicio: fuerza, fútbol y zona media.
export const CUENTAN = RUTINA_GYM.filter((b) => !/calor|Cierre/.test(b.bloque)).flatMap((b) => b.items);
