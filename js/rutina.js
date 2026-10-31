// La rutina de Nacho: martes en el gym (60 min) y 15 min en casa otro día.
// Objetivos: más aire y rendimiento en el fútbol, algo de músculo, cuidar espalda baja, hombros y cuello.
// En el gym nada de piso "raro": gato-camello y bird dog quedan para casa.
// Cada ejercicio tiene su animación de Pedri con el mismo id (js/pedri-ejercicios.js).
// No reemplaza a un profe ni a un kinesiólogo: si algo duele de verdad, se corta y se consulta.

export const RUTINA_GYM = [
  { bloque: "Entrada en calor", min: "7 min", items: [
    { id: "bici", nombre: "Bici fija suave", dosis: "4 min", descanso: "—",
      claves: ["Asiento a la altura de la cadera: abajo, la rodilla queda apenas flexionada.", "Ritmo en el que puedas hablar."],
      error: "Asiento bajo: las rodillas suben de más y cargan.", alternativa: "Cinta caminando rápido." },
    { id: "sentadillalibre", nombre: "Sentadillas sin peso", dosis: "10", descanso: "—",
      claves: ["Brazos adelante para equilibrarte.", "Cola atrás, pecho arriba, hasta donde estés cómodo."],
      error: "Talones que se despegan.", alternativa: "Sentarse y pararse de un banco." },
    { id: "rotacionsentado", nombre: "Rotación de pecho sentado en un banco", dosis: "6 por lado", descanso: "—",
      claves: ["Brazos cruzados sobre el pecho.", "Girá el pecho; la cadera queda quieta en el banco."],
      error: "Girar con fuerza o de golpe.", alternativa: "De pie, con las manos en la cintura." },
  ] },
  { bloque: "Piernas y espalda · 3 vueltas", min: "uno atrás del otro · 75 s de descanso por vuelta", items: [
    { id: "sentadilla", nombre: "Sentadilla con mancuerna al pecho, al cajón", dosis: "3 × 10–12", descanso: "—", peso: true,
      claves: ["Mancuerna pegada al pecho, pecho arriba.", "Bajá en 2 tiempos mandando la cola atrás; rozá el cajón sin sentarte.", "Rodillas en la línea de los pies."],
      error: "Rodillas que se cierran hacia adentro al subir.", alternativa: "Sentadilla al cajón sin peso." },
    { id: "remo", nombre: "Remo sentado en polea", dosis: "3 × 10–12", descanso: "75 s", peso: true,
      claves: ["Espalda derecha, sin balancearte.", "Llevá los codos atrás pegados al cuerpo hasta la panza.", "Hombros lejos de las orejas."],
      error: "Tirar con la espalda baja hacia atrás para mover más peso.", alternativa: "Remo en máquina con pecho apoyado." },
  ] },
  { bloque: "Pecho y espalda · 3 vueltas", min: "75 s de descanso por vuelta", items: [
    { id: "press", nombre: "Press de pecho en máquina, agarre neutro", dosis: "3 × 10–12", descanso: "—", peso: true,
      claves: ["Manijas a la altura del medio del pecho, palmas enfrentadas.", "Empujá sin trabar los codos.", "Volvé lento, sin pasar la línea del cuerpo."],
      error: "Asiento bajo: las manijas quedan altas y cargan el hombro.", alternativa: "Flexiones de brazos con las manos en un banco." },
    { id: "jalon", nombre: "Jalón al pecho, agarre neutro", dosis: "3 × 10–12", descanso: "75 s", peso: true,
      claves: ["Muslos trabados bajo el rodillo.", "Bajá la manija al pecho llevando los codos hacia abajo.", "Siempre por delante de la cabeza."],
      error: "Tirarse muy atrás o bajar la barra detrás de la nuca.", alternativa: "Jalón con banda elástica de rodillas." },
  ] },
  { bloque: "Cola y hombros · 2 vueltas", min: "60 s de descanso por vuelta", items: [
    { id: "puente", nombre: "Puente de glúteo con la espalda en un banco", dosis: "2 × 12", descanso: "—", peso: true,
      claves: ["Borde del banco debajo de los omóplatos.", "Empujá con los talones; arriba, rodilla, cadera y hombro en línea.", "Mentón adentro, mirando hacia adelante."],
      error: "Arquear la espalda baja arriba en vez de apretar la cola.", alternativa: "Puente de glúteo en el piso." },
    { id: "facepull", nombre: "Face pull con soga en polea alta", dosis: "2 × 15", descanso: "60 s", peso: true,
      claves: ["Polea a la altura de la cara.", "Tirá hacia la frente abriendo la soga, codos altos.", "Liviano: es de postura, no de fuerza."],
      error: "Peso alto que te hace tirar con la espalda.", alternativa: "Separar una banda elástica a la altura del pecho." },
  ] },
  { bloque: "Brazos · 2 vueltas", min: "60 s de descanso por vuelta", items: [
    { id: "curl", nombre: "Curl de bíceps con mancuernas", dosis: "2 × 12", descanso: "—", peso: true,
      claves: ["Codos pegados al cuerpo, quietos.", "Subí en 1, bajá en 2.", "Sin balancear el torso."],
      error: "Usar la espalda para subir el peso.", alternativa: "Curl en polea baja." },
    { id: "triceps", nombre: "Tríceps en polea alta", dosis: "2 × 12", descanso: "60 s", peso: true,
      claves: ["Codos pegados a los costados.", "Estirá los brazos hacia abajo hasta el final.", "Volvé lento hasta el pecho."],
      error: "Que los codos se abran o se adelanten.", alternativa: "Fondos con las manos en un banco, rodillas flexionadas." },
  ] },
  { bloque: "Para el fútbol · 2 vueltas", min: "60 s de descanso por vuelta", items: [
    { id: "estocada", nombre: "Estocada hacia atrás", dosis: "2 × 8 por pierna", descanso: "—", peso: true,
      claves: ["Paso largo hacia atrás, torso derecho.", "Bajá derecho, como un ascensor; la rodilla de atrás casi toca el piso.", "La rodilla de adelante sobre el pie."],
      error: "Paso corto: la rodilla de adelante se va muy adelante.", alternativa: "Agarrado de una máquina o la pared, sin peso." },
    { id: "aductores", nombre: "Aductores en máquina", dosis: "2 × 12", descanso: "—", peso: true,
      claves: ["Espalda apoyada, rango cómodo para arrancar.", "Cerrá las piernas en 1 tiempo, abrí en 3."],
      error: "Abrir más de lo cómodo con mucho peso.", alternativa: "Apretar una pelota entre las rodillas acostado, 20 s." },
    { id: "talones", nombre: "Elevación de talones", dosis: "2 × 15", descanso: "60 s",
      claves: ["Subí rápido hasta la punta, arriba un segundo.", "Bajá lento, en 3 tiempos.", "Apoyate solo para el equilibrio."],
      error: "Rebotar abajo sin control.", alternativa: "En un escalón, para más recorrido." },
  ] },
  { bloque: "Cardio · 8 min", min: "para el aire en el fútbol", items: [
    { id: "intervalos", nombre: "Intervalos en bici", dosis: "6 × (30 s fuerte + 50 s suave)", descanso: "—",
      claves: ["Fuerte: que no puedas hablar, pero sin perder la técnica.", "Suave: pedaleo liviano hasta recuperar el aire.", "Las primeras semanas, 4 intervalos."],
      error: "Arrancar a fondo el primero y no llegar al último.", alternativa: "Cinta: 30 s caminata rápida en subida, 50 s plana." },
  ] },
  { bloque: "Zona media · 5 min", min: "45 s de descanso", items: [
    { id: "plancha", nombre: "Plancha", dosis: "3 × 20–30 s", descanso: "45 s",
      claves: ["Codos debajo de los hombros.", "Apretá la cola y la panza; el cuerpo en línea.", "Respirá normal."],
      error: "Cadera caída o muy arriba.", alternativa: "Plancha con las rodillas apoyadas." },
    { id: "deadbug", nombre: "Dead bug", dosis: "2 × 8 por lado", descanso: "45 s",
      claves: ["Espalda baja pegada al piso todo el tiempo.", "Brazo y pierna contrarios, lento.", "Exhalá mientras estirás."],
      error: "Que la espalda se despegue del piso al estirar la pierna.", alternativa: "Mover solo las piernas, de a una." },
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
  { semanas: "1 y 2", texto: "Técnica. Peso con el que hacés 12 repeticiones y te sobran 4. 2 vueltas en todo, 4 intervalos de cardio." },
  { semanas: "3 y 4", texto: "3 vueltas en piernas, espalda y pecho. Cuando las 12 salen cómodas, la próxima vez un escalón más (2,5 kg o una placa)." },
  { semanas: "5 y 6", texto: "Puente, face pull y brazos pasan a 3 vueltas. Cardio: 6 intervalos." },
  { semanas: "7 y 8", texto: "Misma regla: 3 × 12 cómodas → subís. Plancha a 3 × 40 s. Cardio: 8 intervalos. Si algo molesta, volvés al peso anterior y lo anotás." },
];

export const TODOS_GYM = RUTINA_GYM.flatMap((b) => b.items);
export const TODOS_CASA = RUTINA_CASA.flatMap((b) => b.items);
// Los que cuentan para "rutina completa" y XP por ejercicio: fuerza, fútbol y zona media.
export const CUENTAN = RUTINA_GYM.filter((b) => !/calor/.test(b.bloque)).flatMap((b) => b.items);
