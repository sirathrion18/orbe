// Guardado local (en este dispositivo). Todo lo de Orbe usa el prefijo "orbe.".
const P = "orbe.";

export function leer(clave, porDefecto = null) {
  try {
    const v = localStorage.getItem(P + clave);
    return v === null ? porDefecto : JSON.parse(v);
  } catch (e) { return porDefecto; }
}

// Avisos para la sincronización: quien quiera enterarse de cada cambio se anota acá.
const oyentes = [];
export const alGuardar = (fn) => oyentes.push(fn);

export function guardar(clave, valor, silencioso = false) {
  try {
    localStorage.setItem(P + clave, JSON.stringify(valor));
    if (!silencioso) oyentes.forEach((fn) => fn(clave));
    return true;
  } catch (e) { return false; }
}

export function borrar(clave) {
  try { localStorage.removeItem(P + clave); } catch (e) { /* nada */ }
}

export function todo() {
  const out = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(P)) out[k.slice(P.length)] = leer(k.slice(P.length));
    }
  } catch (e) { /* nada */ }
  return out;
}

export function borrarTodo() {
  Object.keys(todo()).forEach(borrar);
  try { sessionStorage.clear(); } catch (e) { /* nada */ }
}

// Sesión (se olvida al cerrar la app): desbloqueos y modo de prueba.
export function sesion(clave, valor) {
  try {
    if (valor === undefined) { const v = sessionStorage.getItem(P + clave); return v === null ? null : JSON.parse(v); }
    if (valor === null) sessionStorage.removeItem(P + clave); else sessionStorage.setItem(P + clave, JSON.stringify(valor));
  } catch (e) { return null; }
}
