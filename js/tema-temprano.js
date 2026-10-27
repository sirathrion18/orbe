// Se ejecuta antes de pintar para que el tema no parpadee.
  try {
    var t = JSON.parse(localStorage.getItem("orbe.tema") || "{}");
    var h = new Date().getHours();
    var auto = h >= 7 && h < 19 ? "claro" : "oscuro";
    var activo = (t.modo === "claro" || t.modo === "oscuro") && (!t.hasta || Date.now() < t.hasta) ? t.modo : auto;
    document.documentElement.dataset.theme = activo;
  } catch (e) {}
