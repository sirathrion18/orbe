// Si se abre desde la dirección vieja (GitHub Pages), pasa a la nueva.
if (location.hostname === "sirathrion18.github.io") {
  location.replace("https://orbe-5es.pages.dev/" + location.hash);
}
// Se ejecuta antes de pintar para que el tema no parpadee.
  try {
    var t = JSON.parse(localStorage.getItem("orbe.tema") || "{}");
    var h = new Date().getHours();
    var auto = h >= 7 && h < 19 ? "claro" : "oscuro";
    var activo = (t.modo === "claro" || t.modo === "oscuro") && (!t.hasta || Date.now() < t.hasta) ? t.modo : auto;
    document.documentElement.dataset.theme = activo;
  } catch (e) {}
// Tipografías elegidas en Ajustes (por defecto: reloj con la del logo, saludo con la serif de revista).
try {
  var f = JSON.parse(localStorage.getItem("orbe.fuentes") || "{}");
  document.documentElement.dataset.reloj = f.reloj || "logo";
  document.documentElement.dataset.saludo = f.saludo || "revista";
} catch (e) {}
