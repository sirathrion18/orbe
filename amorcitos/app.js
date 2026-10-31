// Amorcitos para Agus: solo esto. No carga Orbe ni ve nada de Nacho fuera de lo que comparten.
import { usarClave, docLocal, traer, render, conectar } from "/js/amor.js";

usarClave("amor.doc");
const app = document.getElementById("app");
const tema = () => { const o = matchMedia("(prefers-color-scheme: dark)").matches; document.documentElement.dataset.theme = o ? "oscuro" : "claro"; document.querySelector('meta[name="theme-color"]').content = o ? "#0B0B0C" : "#FFFFFF"; };
tema(); matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", tema);

let doc = docLocal();
const cab = `<header class="amor-cab"><h1><span class="amor-cor" aria-hidden="true">♥</span> Amorcitos</h1><button class="chip" id="salir">Salir</button></header>
  <p class="bajada">Lo de los dos: súper, menú, planes, pelis y fechas.</p>`;
function pintar() { app.innerHTML = cab + render(doc, new Date(), { puedeTodo: doc?.yo === "nacho" }); }
function entrar(error) {
  const txt = error === "cuenta" ? "Esa cuenta de Google no tiene acceso a Amorcitos." : error ? "No se pudo entrar. Probá de nuevo." : "";
  app.innerHTML = `<header class="amor-cab"><h1><span class="amor-cor" aria-hidden="true">♥</span> Amorcitos</h1></header>
    <p class="bajada">Lo de los dos: súper, menú, planes, pelis y fechas.</p>
    ${txt ? `<p class="amor-error">${txt}</p>` : ""}
    <a class="btn" href="/api/amor/login" style="display:inline-flex;margin-top:12px">Entrar con Google</a>
    <p class="fuente-dato" style="margin-top:14px">Google solo le pasa tu mail. Nada de tu Gmail, Drive ni calendario.</p>`;
}
let tAviso;
function aviso(t) { const a = document.getElementById("aviso"); a.textContent = t; a.classList.add("ver"); clearTimeout(tAviso); tAviso = setTimeout(() => a.classList.remove("ver"), 2200); }

conectar({ cambio: (d) => { doc = d; pintar(); }, aviso });
document.addEventListener("click", (e) => {
  if (e.target.id !== "salir") return;
  fetch("/api/amor/salir", { method: "POST", credentials: "same-origin" }).finally(() => { try { localStorage.removeItem("amor.doc"); } catch (x) { /* nada */ } doc = null; entrar(); });
});

const err = new URLSearchParams(location.search).get("error");
if (err) { history.replaceState(null, "", "/amorcitos/"); entrar(err); }
else {
  if (doc) pintar();
  traer().then((d) => { doc = d; pintar(); }).catch((e) => { if (e.message === "sin-sesion") { doc = null; try { localStorage.removeItem("amor.doc"); } catch (x) { /* nada */ } entrar(); } else if (!doc) app.innerHTML = cab + '<p class="vacio">Sin señal: probá de nuevo en un rato.</p>'; });
  // Si Nacho cambia algo, se ve al volver a la app.
  document.addEventListener("visibilitychange", () => { if (!document.hidden) traer().then((d) => { doc = d; pintar(); }).catch(() => {}); });
}
