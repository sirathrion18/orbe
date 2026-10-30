// Proyectos en 3D: Orbe en el centro, los proyectos girando alrededor, los rayos que salen de Orbe
// y las piedras que aparecen sueltas (sin representar a ningún proyecto). Hay un modo sobrio,
// visto desde arriba y sin efectos, para mirar todo con calma.
// Cuida la batería: solo dibuja mientras la pantalla de Proyectos está a la vista.
import * as THREE from "../vendor/three/build/three.module.min.js";
import { EffectComposer } from "../vendor/three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "../vendor/three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "../vendor/three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "../vendor/three/addons/postprocessing/OutputPass.js";
import { RoomEnvironment } from "../vendor/three/addons/environments/RoomEnvironment.js";
import { Line2 } from "../vendor/three/addons/lines/Line2.js";
import { LineMaterial } from "../vendor/three/addons/lines/LineMaterial.js";
import { LineGeometry } from "../vendor/three/addons/lines/LineGeometry.js";
import { identidad } from "./proyectosid.js";
import { leer, guardar } from "./almacen.js";
import { avancesPendientes, avanceVisto } from "./central.js";

const quieto = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const azar = (a, b) => a + Math.random() * (b - a);
const uno = (l) => l[Math.floor(Math.random() * l.length)];
const escHtml = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

let E = null;          // la escena, una sola vez por sesión
let caja = null;       // el contenedor actual en la página
let vivo = false, visible = true, raf = 0;
let sobrio = !!leer("cosmosSobrio");

// ---------- Texturas ----------
function lienzo2d(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")]; }
function tex(c) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
function puntoSuave() {
  const [c, x] = lienzo2d(128, 128); const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(.25, "rgba(255,255,255,.5)"); g.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = g; x.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c);
}
function aroTex() { const [c, x] = lienzo2d(256, 256); x.strokeStyle = "#fff"; x.lineWidth = 10; x.filter = "blur(4px)"; x.beginPath(); x.arc(128, 128, 100, 0, 7); x.stroke(); return new THREE.CanvasTexture(c); }
function discoTex() {
  const [c, x] = lienzo2d(512, 512); const g = x.createRadialGradient(256, 256, 0, 256, 256, 256);
  g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(.36, "rgba(0,0,0,0)"); g.addColorStop(.4, "rgba(255,236,210,1)");
  g.addColorStop(.55, "rgba(255,150,70,.7)"); g.addColorStop(.8, "rgba(170,50,40,.25)"); g.addColorStop(1, "rgba(0,0,0,0)");
  x.fillStyle = g; x.fillRect(0, 0, 512, 512); x.globalCompositeOperation = "destination-out";
  for (let i = 0; i < 60; i++) { x.beginPath(); x.arc(256, 256, 110 + Math.random() * 140, Math.random() * 7, Math.random() * 7 + .6); x.lineWidth = 1 + Math.random() * 3; x.strokeStyle = "rgba(0,0,0,.35)"; x.stroke(); }
  return new THREE.CanvasTexture(c);
}
function superficie(base, acc, semilla) {
  const [c, x] = lienzo2d(512, 256);
  let s = semilla * 7919 + 13; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  x.fillStyle = base; x.fillRect(0, 0, 512, 256); x.filter = "blur(3px)";
  for (let i = 0; i < 30; i++) { x.globalAlpha = .04 + r() * .1; x.fillStyle = r() < .5 ? "#fff" : "#000"; x.fillRect(0, r() * 256, 512, 3 + r() * 20); }
  x.globalAlpha = .2; x.fillStyle = acc;
  for (let i = 0; i < 7; i++) { x.beginPath(); x.ellipse(r() * 512, 40 + r() * 176, 14 + r() * 50, 4 + r() * 9, 0, 0, 7); x.fill(); }
  return tex(c);
}
// La insignia: un disco del color del proyecto con su logo (el mismo SVG que se ve en las páginas).
function insigniaTex(id, nombre) {
  const i = identidad(id, nombre);
  const [c, x] = lienzo2d(256, 256);
  const t = tex(c);
  const pintar = (img) => {
    x.clearRect(0, 0, 256, 256);
    x.beginPath(); x.arc(128, 128, 92, 0, 7); x.fillStyle = i.base; x.fill();
    x.lineWidth = 3; x.strokeStyle = "rgba(255,255,255,.18)"; x.stroke();
    if (img) x.drawImage(img, 128 - 66, 128 - 66, 132, 132);
    t.needsUpdate = true;
  };
  pintar(null);
  const img = new Image();
  img.onload = () => pintar(img);
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(i.logo.replace("<svg ", '<svg width="132" height="132" '));
  return t;
}

// ---------- Armado de la escena (una vez) ----------
function armar() {
  const lienzo = document.createElement("canvas");
  lienzo.className = "cosmos-lienzo";
  lienzo.setAttribute("aria-label", "Tus proyectos girando alrededor de Orbe. Deslizá para girar, tocá un planeta para acercarte.");
  let render;
  try { render = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true, powerPreference: "low-power" }); }
  catch (e) { return null; }
  render.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  render.toneMapping = THREE.ACESFilmicToneMapping; render.toneMappingExposure = .95;
  const escena = new THREE.Scene(); escena.background = new THREE.Color("#050507");
  const cam = new THREE.PerspectiveCamera(55, 1, .1, 200);
  const halo = puntoSuave(), aroT = aroTex();
  const ambiente = new THREE.PMREMGenerator(render).fromScene(new RoomEnvironment(), .04).texture;

  const estrellas = (n, tam, op) => {
    const g = new THREE.BufferGeometry(), pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, rr = 35 + Math.random() * 40, q = Math.sqrt(1 - u * u);
      pos.set([rr * q * Math.cos(th), rr * u, rr * q * Math.sin(th)], i * 3);
      const k = Math.random(); col.set(k < .1 ? [1, .75, .78] : k < .2 ? [.8, .85, 1] : [.85, .85, .85], i * 3);
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return new THREE.Points(g, new THREE.PointsMaterial({ size: tam, map: halo, vertexColors: true, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending }));
  };
  const cielo = new THREE.Group(); cielo.add(estrellas(1200, .2, .7), estrellas(220, .45, .8)); escena.add(cielo);
  const nebulosas = [["#e8364f", -14, 6, -30, 34, .12], ["#6d28d9", 16, -8, -34, 40, .11], ["#e8364f", 4, -18, -40, 30, .06]].map(([c, x, y, z, s, o]) => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: halo, color: c, transparent: true, opacity: o, depthWrite: false, blending: THREE.AdditiveBlending }));
    sp.position.set(x, y, z); sp.scale.set(s, s, 1); sp.userData.c = new THREE.Color(c); escena.add(sp); return sp;
  });
  escena.add(new THREE.AmbientLight("#8890a8", .4));
  const sol = new THREE.PointLight("#fff4ee", 40, 0, 1.6); escena.add(sol);
  const relleno = new THREE.DirectionalLight("#c9d4ff", .7); relleno.position.set(0, 6, 10); escena.add(relleno);
  const sistema = new THREE.Group(); escena.add(sistema);

  const nucleo = new THREE.Group(); sistema.add(nucleo);
  const esfera = new THREE.Mesh(new THREE.SphereGeometry(.5, 48, 32), new THREE.MeshStandardMaterial({ color: "#0b0b0e", roughness: .25, metalness: .6, emissive: "#1a0a0e", emissiveIntensity: .5 }));
  nucleo.add(esfera);
  const aroMat = new THREE.MeshBasicMaterial({ color: new THREE.Color("#e9e9e6"), toneMapped: false });
  const aro = new THREE.Mesh(new THREE.TorusGeometry(.78, .055, 24, 128), aroMat);
  const puntoMat = new THREE.MeshBasicMaterial({ color: new THREE.Color("#ff2848"), toneMapped: false });
  const puntoRojo = new THREE.Mesh(new THREE.SphereGeometry(.11, 24, 16), puntoMat);
  puntoRojo.position.set(.62, .62, .1); puntoRojo.scale.setScalar(1.25);
  const caraNucleo = new THREE.Group(); caraNucleo.add(aro, puntoRojo); nucleo.add(caraNucleo);
  const auraN = new THREE.Sprite(new THREE.SpriteMaterial({ map: halo, color: "#ff5a70", transparent: true, opacity: .22, depthWrite: false, blending: THREE.AdditiveBlending }));
  auraN.scale.set(3.4, 3.4, 1); nucleo.add(auraN);

  const comp = new EffectComposer(render);
  comp.addPass(new RenderPass(escena, cam));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), .55, .45, .82);
  comp.addPass(bloom); comp.addPass(new OutputPass());

  return { lienzo, render, escena, cam, halo, aroT, ambiente, cielo, nebulosas, sol, sistema, nucleo, esfera, aro, aroMat, puntoMat, caraNucleo, auraN, comp, bloom,
    planetas: [], orbitas: [], rayos: [], agenda: [], activos: [], piedras: [], giro: [.4, 1.2], incl: .38, inclObj: .38, roll: 0, rollObj: 0, eclipse: 0, meteoros: [], hilosL: [],
    carga: 0, soberano: 0, sel: null, giroObj: null, t: 0, tam: new THREE.Vector2(1, 1), firma: "" };
}

// ---------- Planetas ----------
const ANILLOS = [{ R: 2.5, vel: .07, tam: .48 }, { R: 3.7, vel: -.045, tam: .38 }];
const atmosfera = (color) => new THREE.ShaderMaterial({
  uniforms: { c: { value: new THREE.Color(color) }, f: { value: 1 } },
  vertexShader: "varying vec3 n; varying vec3 v; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); n = normalize(normalMatrix*normal); v = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }",
  fragmentShader: "uniform vec3 c; uniform float f; varying vec3 n; varying vec3 v; void main(){ float k = pow(1. - abs(dot(n,v)), 3.2); gl_FragColor = vec4(c*k*.75*f, k*f*.8); }",
  transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.BackSide
});
function ponerPlanetas(lista) {
  const firma = lista.map((p) => [p.id, p.nombre, p.anillo, p.sub, p.logo].join("|")).join("~");
  if (firma === E.firma) return;
  E.firma = firma;
  E.planetas.forEach((pl) => { E.sistema.remove(pl.g); pl.g.traverse((o) => { o.geometry?.dispose(); o.material?.map?.dispose(); o.material?.dispose(); }); });
  E.orbitas.forEach((o) => { E.sistema.remove(o); o.geometry.dispose(); o.material.dispose(); });
  E.orbitas = []; E.planetas = []; E.sel = null;
  const porAnillo = [0, 1].map((k) => lista.filter((p) => p.anillo === k));
  porAnillo.forEach((l, k) => {
    if (!l.length) return;
    const A = ANILLOS[k], g = new THREE.RingGeometry(A.R - .006, A.R + .006, 160); g.rotateX(-Math.PI / 2);
    const o = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: .1, side: THREE.DoubleSide, depthWrite: false }));
    E.sistema.add(o); E.orbitas.push(o);
  });
  E.planetas = lista.map((p, i) => {
    const A = ANILLOS[p.anillo], l = porAnillo[p.anillo], idx = l.indexOf(p), id = identidad(p.id, p.nombre);
    const g = new THREE.Group();
    const cuerpo = new THREE.Mesh(new THREE.SphereGeometry(A.tam, 40, 28), new THREE.MeshStandardMaterial({ map: superficie(id.base, id.acc, i + 1), roughness: .8, metalness: .05, emissive: new THREE.Color(id.glow), emissiveIntensity: .02 }));
    const atm = new THREE.Mesh(new THREE.SphereGeometry(A.tam * 1.22, 32, 20), atmosfera(id.glow));
    const ins = new THREE.Sprite(new THREE.SpriteMaterial({ map: insigniaTex(p.id, p.nombre), transparent: true, depthWrite: false, color: new THREE.Color(.92, .92, .92) }));
    ins.scale.set(A.tam * 1.5, A.tam * 1.5, 1); ins.visible = false; // el logo va en el DOM, encima (nítido en cualquier celu)
    const toque = new THREE.Mesh(new THREE.SphereGeometry(A.tam * 1.9, 12, 8), new THREE.MeshBasicMaterial({ visible: false }));
    toque.userData.i = i;
    g.add(cuerpo, atm, ins, toque);
    if (id.anillo) {
      const ar = new THREE.Mesh(new THREE.RingGeometry(A.tam * 1.5, A.tam * 1.85, 64), new THREE.MeshBasicMaterial({ color: id.acc, transparent: true, opacity: .1, side: THREE.DoubleSide, depthWrite: false }));
      ar.rotation.x = -Math.PI / 2 + .3; g.add(ar);
    }
    E.sistema.add(g);
    return { p, id, g, cuerpo, atm, ins, toque, A, i0: i, fase: idx / l.length * Math.PI * 2, esc: 1, flash: 0, etq: null, insD: null };
  });
}

// ---------- Rayos, chispas y cosas que pasan ----------
const luego = (s, fn) => E.agenda.push({ at: E.t + s, fn });
function trazo(a, b, disp) {
  let pts = [a.clone(), b.clone()];
  for (let it = 0; it < 5; it++) {
    const np = [pts[0]];
    for (let k = 0; k < pts.length - 1; k++) {
      const m = pts[k].clone().add(pts[k + 1]).multiplyScalar(.5);
      m.add(new THREE.Vector3(azar(-1, 1), azar(-1, 1), azar(-1, 1)).multiplyScalar(disp)); np.push(m, pts[k + 1]);
    }
    pts = np; disp *= .52;
  }
  return pts;
}
function linea(color, ancho, op) {
  const m = new LineMaterial({ color, linewidth: ancho, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  m.resolution.copy(E.tam);
  const l = new Line2(new LineGeometry(), m); l.frustumCulled = false; E.sistema.add(l); return l;
}
const VERDE = "#3ddc84", ACERO = "#cfd8dc";
function rayo(desde, hasta, color, dur, grosor = 1) {
  if (E.soberano > 0) color = Math.random() < .6 ? VERDE : ACERO;
  const r = { desde, hasta, vida: 0, dur: dur || azar(.45, .8), t: 0,
    lineas: [linea(new THREE.Color(color).multiplyScalar(2.1), 3 * grosor, 1), linea(new THREE.Color("#ffffff").multiplyScalar(2.6), 1.15 * grosor, 1), linea(new THREE.Color(color).multiplyScalar(1.6), 1.5, .8)] };
  rehacer(r); E.rayos.push(r);
}
function rehacer(r) {
  const a = r.desde(), b = r.hasta(), largo = a.distanceTo(b);
  const pts = trazo(a, b, largo * .2), plano = pts.flatMap((v) => [v.x, v.y, v.z]);
  r.lineas[0].geometry.setPositions(plano); r.lineas[1].geometry.setPositions(plano);
  const o = pts[8 + Math.floor(Math.random() * (pts.length - 16))];
  const fin = o.clone().add(new THREE.Vector3(azar(-1, 1), azar(-1, 1), azar(-1, 1)).multiplyScalar(largo * .28));
  r.lineas[2].geometry.setPositions(trazo(o, fin, largo * .07).flatMap((v) => [v.x, v.y, v.z]));
}
const enSistema = (obj) => () => E.sistema.worldToLocal(obj.getWorldPosition(new THREE.Vector3()));
const borde = (hacia) => () => { const d = hacia(); return d.lengthSq() ? d.setLength(.8) : d; };

const NCH = 300;
let ch = null;
function chispas() {
  if (ch) return ch;
  const pos = new Float32Array(NCH * 3), col = new Float32Array(NCH * 3), vel = new Float32Array(NCH * 3), vida = new Float32Array(NCH);
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: .13, map: E.halo, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  pts.frustumCulled = false; E.escena.add(pts);
  ch = { pos, col, vel, vida, geo, k: 0 };
  return ch;
}
function chispa(p, color, v, brillo = 1.2) {
  const c = chispas(), cc = new THREE.Color(color);
  c.pos.set([p.x, p.y, p.z], c.k * 3); c.col.set([cc.r * brillo, cc.g * brillo, cc.b * brillo], c.k * 3);
  c.vel.set(v ? [v.x, v.y, v.z] : [0, -.12, 0], c.k * 3); c.vida[c.k] = 1; c.k = (c.k + 1) % NCH;
}
function cargar(s, fuerza = 1) {
  E.activos.push({ v: 0, update(dt) {
    this.v += dt; E.carga = Math.max(E.carga, Math.min(1, this.v / s) * fuerza);
    if (!quieto() && Math.random() < .7 * fuerza) {
      const centro = E.nucleo.getWorldPosition(new THREE.Vector3());
      const d = new THREE.Vector3(azar(-1, 1), azar(-1, 1), azar(-1, 1)).normalize().multiplyScalar(azar(1.4, 2.2));
      chispa(centro.clone().add(d), E.soberano > 0 ? VERDE : "#ffd6dc", d.clone().multiplyScalar(-1 / .55), 1);
    }
    return this.v < s;
  } });
}
function onda(pl, color) {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: E.aroT, color, transparent: true, opacity: .8, depthWrite: false, blending: THREE.AdditiveBlending }));
  pl.g.add(sp);
  E.activos.push({ v: 0, update(dt) {
    this.v += dt; const k = this.v / .9, s = pl.A.tam * (1.2 + k * 3.2); sp.scale.set(s, s, 1); sp.material.opacity = .7 * (1 - k);
    if (k >= 1) { pl.g.remove(sp); sp.material.dispose(); return false; } return true;
  } });
}
const libres = () => E.planetas.map((_, i) => i).filter((i) => E.sel === null || i !== E.sel);
function golpe(i, s = .32) {
  const pl = E.planetas[i]; if (!pl) return; cargar(s, .8);
  luego(s, () => rayo(borde(enSistema(pl.g)), enSistema(pl.g), pl.id.glow));
  luego(s + .12, () => { pl.flash = 1; onda(pl, pl.id.glow); });
}
function cadena() {
  const orden = [...E.planetas.keys()].sort(() => Math.random() - .5).slice(0, Math.min(E.planetas.length, 3 + Math.floor(Math.random() * 2)));
  cargar(.45, 1);
  orden.forEach((i, k) => luego(.45 + k * .16, () => {
    const pl = E.planetas[i]; if (!pl) return;
    rayo(k === 0 ? borde(enSistema(pl.g)) : enSistema(E.planetas[orden[k - 1]].g), enSistema(pl.g), k === 0 ? "#ffffff" : pl.id.glow, .5); pl.flash = .8;
  }));
}
function triple() {
  cargar(.9, 1.4);
  const tres = [...E.planetas.keys()].sort(() => Math.random() - .5).slice(0, 3);
  luego(.9, () => tres.forEach((i) => { const pl = E.planetas[i]; if (!pl) return; rayo(borde(enSistema(pl.g)), enSistema(pl.g), pl.id.glow, .7, 1.2); pl.flash = 1; onda(pl, pl.id.glow); }));
}
function pulso() {
  const l = libres(); if (!l.length) return;
  const pl = E.planetas[uno(l)]; cargar(.3, .6);
  const bola = new THREE.Sprite(new THREE.SpriteMaterial({ map: E.halo, color: pl.id.glow, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  bola.scale.set(.5, .5, 1); E.sistema.add(bola);
  luego(.3, () => E.activos.push({ v: 0, update(dt) {
    this.v += dt; const k = Math.min(1, this.v / 1.1);
    const b = enSistema(pl.g)(), m = b.clone().multiplyScalar(.5); m.y += 1.4;
    const c = new THREE.QuadraticBezierCurve3(new THREE.Vector3(), m, b).getPoint(k * k * (3 - 2 * k));
    bola.position.copy(c);
    if (!quieto()) chispa(E.sistema.localToWorld(c.clone()), pl.id.glow, new THREE.Vector3(azar(-.2, .2), azar(-.2, .2), azar(-.2, .2)), .9);
    if (k >= 1) { E.sistema.remove(bola); bola.material.dispose(); pl.flash = 1; onda(pl, pl.id.glow); return false; }
    return true;
  } }));
}

// ---------- Piedras: talles tranquilos ----------
function talle(n, rt, rg, rb, yt, yb, sx = 1) {
  const v = [], tri = (a, b, c) => v.push(...a, ...b, ...c), quad = (a, b, c, d) => { tri(a, b, c); tri(a, c, d); };
  const ring = (r, y, k) => { const a = k / n * Math.PI * 2 + Math.PI / n; return [r * Math.cos(a) * sx, y, r * Math.sin(a)]; };
  const ym = yb * .45, rm = (rg + rb) / 2 + .04;
  for (let k = 0; k < n; k++) {
    tri([0, yt, 0], ring(rt, yt, k + 1), ring(rt, yt, k));
    quad(ring(rt, yt, k), ring(rt, yt, k + 1), ring(rg, .05, k + 1), ring(rg, .05, k));
    quad(ring(rg, .05, k), ring(rg, .05, k + 1), ring(rg, -.05, k + 1), ring(rg, -.05, k));
    quad(ring(rg, -.05, k), ring(rg, -.05, k + 1), ring(rm, ym, k + 1), ring(rm, ym, k));
    quad(ring(rm, ym, k), ring(rm, ym, k + 1), ring(rb, yb, k + 1), ring(rb, yb, k));
    tri([0, yb, 0], ring(rb, yb, k), ring(rb, yb, k + 1));
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(v, 3)); g.computeVertexNormals(); return g;
}
function armarPiedras() {
  const T = { hexagono: talle(6, .5, .82, .4, .26, -.4), octogono: talle(8, .48, .78, .36, .24, -.36, 1.3),
    cabujon: (() => { const g = new THREE.SphereGeometry(.8, 40, 24, 0, Math.PI * 2, 0, Math.PI / 2); g.scale(1.1, .6, .8); return g; })() };
  E.piedras = [["#ff2d4f", "octogono"], ["#ff7a1a", "hexagono"], ["#f2b51c", "cabujon"], ["#2fd07a", "octogono"], ["#4c8df6", "hexagono"], ["#a855f7", "cabujon"]].map(([c, forma]) => {
    const g = new THREE.Group(), geo = T[forma];
    const capa = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ color: c, emissive: c, emissiveIntensity: .35, roughness: .1, metalness: 0, clearcoat: 1, clearcoatRoughness: .05,
      flatShading: forma !== "cabujon", transparent: true, opacity: .92, side: THREE.DoubleSide, envMap: E.ambiente, envMapIntensity: 1.3 }));
    const corazon = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(1.05), toneMapped: false, transparent: true, opacity: .85 }));
    corazon.scale.setScalar(.5);
    const brillo = new THREE.Sprite(new THREE.SpriteMaterial({ map: E.halo, color: c, transparent: true, opacity: .28, depthWrite: false, blending: THREE.AdditiveBlending }));
    brillo.scale.set(3, 3, 1);
    const cuerpo = new THREE.Group(); cuerpo.add(capa, corazon); cuerpo.rotation.x = 1.05;
    g.add(brillo, cuerpo); g.visible = false; E.escena.add(g);
    return { g, cuerpo, capa, corazon, brillo, c, ocupada: false };
  });
}
function piedraLibre() { const l = E.piedras.filter((p) => !p.ocupada); if (!l.length) return null; const p = uno(l); p.ocupada = true; p.g.visible = true; return p; }
function soltarPiedra(p, extra) { p.ocupada = false; p.g.visible = false; extra?.forEach((o) => { E.escena.remove(o); o.material?.dispose(); }); }
function brilloPiedra(p, k, extra = 0) {
  p.capa.material.opacity = .92 * k; p.corazon.material.opacity = .85 * k; p.brillo.material.opacity = (.28 + extra) * k; p.capa.material.emissiveIntensity = .35 + extra * 1.5;
}
function piedraLejana() {
  const p = piedraLibre(); if (!p) return;
  const pos = new THREE.Vector3(azar(-9, 9), azar(1.5, 7), azar(-24, -15));
  const h1 = new THREE.Sprite(new THREE.SpriteMaterial({ map: E.halo, color: p.c, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  const h2 = new THREE.Sprite(new THREE.SpriteMaterial({ map: E.halo, color: "#6d28d9", transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  h1.position.copy(pos); h1.scale.set(9, 9, 1); h2.position.copy(pos).add(new THREE.Vector3(1.5, -1, -2)); h2.scale.set(15, 15, 1);
  E.escena.add(h1, h2); p.g.position.copy(pos); p.g.scale.setScalar(1.6);
  const dur = 11; let tocada = false;
  E.activos.push({ v: 0, update(dt) {
    this.v += dt; const k = Math.max(0, Math.min(1, this.v / 2.5, (dur - this.v) / 2.5));
    p.cuerpo.rotation.y += dt * .5; p.cuerpo.rotation.z = Math.sin(this.v * .7) * .25; p.g.position.y = pos.y + Math.sin(this.v * .8) * .3;
    brilloPiedra(p, k); h1.material.opacity = .2 * k; h2.material.opacity = .08 * k;
    if (!tocada && this.v > 5) { tocada = true; if (!quieto() && !sobrio) { cargar(.4, .8); luego(.4, () => rayo(borde(enSistema(p.g)), enSistema(p.g), p.c, .9, .8)); } }
    if (this.v >= dur) { soltarPiedra(p, [h1, h2]); return false; } return true;
  } });
}
function piedraCruza() {
  const p = piedraLibre(); if (!p) return;
  const lado = Math.random() < .5 ? -1 : 1;
  const curva = new THREE.CatmullRomCurve3([new THREE.Vector3(-11 * lado, azar(-2, 2), azar(-3, 1)), new THREE.Vector3(-3 * lado, azar(-.5, 1), azar(1, 3)),
    new THREE.Vector3(3 * lado, azar(-.5, 1.2), azar(.5, 2.5)), new THREE.Vector3(11 * lado, azar(1, 4), azar(-4, -1))]);
  const dur = 10; let espera = 0; p.g.scale.setScalar(.42);
  E.activos.push({ v: 0, update(dt) {
    this.v += dt; const u = this.v / dur; if (u >= 1) { soltarPiedra(p); return false; }
    curva.getPoint(u, p.g.position); p.cuerpo.rotation.y += dt * 1.1; p.cuerpo.rotation.z = Math.sin(this.v * 1.3) * .3;
    brilloPiedra(p, Math.min(1, u * 10, (1 - u) * 10));
    if (Math.random() < .35) chispa(p.g.position.clone(), p.c, new THREE.Vector3(azar(-.1, .1), azar(-.15, .05), azar(-.1, .1)), .8);
    espera -= dt;
    if (espera <= 0 && !sobrio) {
      const w = new THREE.Vector3(); let mejor = null, dmin = 1.8;
      E.planetas.forEach((pl) => { pl.g.getWorldPosition(w); const d = w.distanceTo(p.g.position); if (d < dmin) { dmin = d; mejor = pl; } });
      if (mejor) { rayo(enSistema(p.g), enSistema(mejor.g), p.c, .35, .8); mejor.flash = .7; espera = 1.1; }
    }
    return true;
  } });
}
function agujero() {
  const g = new THREE.Group(); g.position.set(azar(-7, 7), azar(3, 8), -30); E.escena.add(g);
  const disco = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.MeshBasicMaterial({ map: discoTex(), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
  disco.rotation.x = -1.25;
  const sombra = new THREE.Mesh(new THREE.SphereGeometry(2.2, 32, 24), new THREE.MeshBasicMaterial({ color: "#000000", transparent: true, opacity: 0 }));
  const lente = new THREE.Sprite(new THREE.SpriteMaterial({ map: E.aroT, color: "#ffcf9e", transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); lente.scale.set(6.2, 6.2, 1);
  const resp = new THREE.Sprite(new THREE.SpriteMaterial({ map: E.halo, color: "#ff7a3a", transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); resp.scale.set(22, 22, 1);
  g.add(resp, disco, sombra, lente);
  const dur = 16;
  E.activos.push({ v: 0, update(dt) {
    this.v += dt; const k = Math.max(0, Math.min(1, this.v / 4, (dur - this.v) / 4));
    disco.rotation.z += dt * .15; disco.material.opacity = .55 * k; sombra.material.opacity = k; lente.material.opacity = .45 * k; resp.material.opacity = .1 * k;
    if (this.v >= dur) { E.escena.remove(g); g.traverse((o) => { o.geometry?.dispose(); o.material?.map && o.material.map !== E.halo && o.material.map !== E.aroT && o.material.map.dispose(); o.material?.dispose(); }); return false; }
    return true;
  } });
}
function avance(i) {
  const pl = E.planetas[i]; if (!pl) return;
  const p = piedraLibre();
  cargar(.7, 1.5);
  luego(.7, () => { rayo(borde(enSistema(pl.g)), enSistema(pl.g), pl.id.glow, .8, 1.5); pl.flash = 1.2; onda(pl, pl.id.glow); });
  avisarCaja(`${pl.p.nombre} avanzó un paso`);
  if (!p) return;
  const desde = new THREE.Vector3(azar(-8, 8), azar(4, 7), azar(-10, -6));
  p.g.position.copy(desde); p.g.scale.setScalar(.38);
  const der = new THREE.Vector3(), arr = new THREE.Vector3(), w = new THREE.Vector3();
  E.activos.push({ v: 0, festejo: false, update(dt) {
    this.v += dt; pl.g.getWorldPosition(w);
    der.set(1, 0, 0).applyQuaternion(E.cam.quaternion); arr.set(0, 1, 0).applyQuaternion(E.cam.quaternion);
    const r0 = pl.A.tam * pl.esc * 1.9; p.cuerpo.rotation.y += dt * 2;
    if (this.v < 1.3) { const k = this.v / 1.3, e = k * k * (3 - 2 * k); p.g.position.copy(desde).lerp(w.clone().addScaledVector(der, r0), e); brilloPiedra(p, Math.min(1, k * 3)); }
    else if (this.v < 3.6) {
      const k = (this.v - 1.3) / 2.3, a = k * Math.PI * 2;
      p.g.position.copy(w).addScaledVector(der, Math.cos(a) * r0).addScaledVector(arr, Math.sin(a) * r0 * .75); brilloPiedra(p, 1, k * .6);
      if (Math.random() < .5) chispa(p.g.position.clone(), p.c, null, .9);
      if (!this.festejo && k > .92) { this.festejo = true; pl.flash = 1.4; onda(pl, p.c); rayo(enSistema(p.g), enSistema(pl.g), p.c, .5); }
    } else if (this.v < 4.8) { const k = (this.v - 3.6) / 1.2; p.g.position.addScaledVector(arr, dt * 6 * (k + .3)); brilloPiedra(p, 1 - k, .6 * (1 - k)); }
    else { soltarPiedra(p); return false; }
    return true;
  } });
}
function modoSoberano() {
  E.soberano = 9; avisarCaja("Orbe obedece a uno solo.");
  cargar(1, 1.6);
  luego(1, () => E.planetas.forEach((pl, k) => luego(k * .08, () => { rayo(borde(enSistema(pl.g)), enSistema(pl.g), VERDE, .6); pl.flash = .8; })));
}

// ---------- La capa de arriba: nombres, controles y la ficha corta ----------
let tAviso;
function avisarCaja(t, ms = 2400) {
  const a = caja?.querySelector(".cz-aviso"); if (!a) return;
  a.textContent = t; a.classList.add("ver"); clearTimeout(tAviso); tAviso = setTimeout(() => a.classList.remove("ver"), ms);
}
function capa() {
  caja.querySelectorAll(".cz-capa").forEach((n) => n.remove());
  const c = document.createElement("div"); c.className = "cz-capa";
  c.innerHTML = `<div class="cz-inss" aria-hidden="true"></div><div class="cz-etqs"></div><div class="cz-aviso" role="status" aria-live="polite"></div>
    <div class="cz-ctrl"><button type="button" class="cz-chip" data-cz="tirar" aria-pressed="${lanzar}">◆ Tirar</button><button type="button" class="cz-chip" data-cz="chiches" aria-label="Qué se puede hacer acá">?</button><button type="button" class="cz-chip" data-cz="sobrio" aria-pressed="${sobrio}">${sobrio ? "Cosmos" : "Sobrio"}</button></div>
    <div class="cz-chiches" hidden><b>Para jugar</b><ul>
      <li><b>Girar:</b> un dedo, de costado. <b>Dos dedos:</b> pellizcá para acercar, subí o bajá los dos para verlo de canto o desde abajo, y giralos como una perilla.</li>
      <li><b>◆ Tirar:</b> prendelo, arrastrá y soltá una piedra contra un planeta.</li>
      <li><b>Lluvia de ideas:</b> deslizá dos dedos rápido para arriba. Tocá un meteorito y te tira una idea tuya.</li>
      <li><b>Hilos:</b> mantené apretado un planeta y soltá sobre otro. Lo mismo otra vez lo borra.</li>
      <li><b>Eclipses:</b> girá hasta que un planeta tape a Orbe.</li>
      <li><b>Agujero negro:</b> mantené apretado el vacío.</li>
      <li><b>Doble toque</b> en el vacío: vuelve a la vista de siempre.</li></ul><button type="button" class="cz-chip" data-cz="cerrar-chiches">Listo</button></div>
    <div class="cz-zoom" role="group" aria-label="Zoom"><button type="button" data-cz="lejos" aria-label="Alejar">−</button><button type="button" data-cz="todo">Ver todo</button><button type="button" data-cz="cerca" aria-label="Acercar">+</button></div>
    <div class="cz-hoja" aria-hidden="true"><div class="cz-caja"><div class="cz-ceja"></div><h3 class="cz-nombre"></h3><p class="cz-que"></p>
      <div class="cz-paso"><span>Próximo paso</span><div></div></div>
      <div class="cz-acc"><a class="btn cz-entrar" href="#/u/proyectos">Ver ficha</a><button type="button" class="btn sec" data-cz="volver">Volver</button><span class="cz-esp"></span>
      <button type="button" class="btn sec cz-fl" data-cz="ant" aria-label="Planeta anterior">‹</button><button type="button" class="btn sec cz-fl" data-cz="sig" aria-label="Planeta siguiente">›</button></div></div></div>`;
  caja.appendChild(c);
  const etqs = c.querySelector(".cz-etqs");
  const inss = c.querySelector(".cz-inss");
  E.planetas.forEach((pl) => { const d = document.createElement("div"); d.className = "cz-ins"; d.style.background = identidad(pl.p.id, pl.p.nombre).base; d.innerHTML = identidad(pl.p.id, pl.p.nombre).logo; inss.appendChild(d); pl.insD = d; });
  E.planetas.forEach((pl) => { const e = document.createElement("div"); e.className = "cz-etq"; e.innerHTML = `<b>${escHtml(pl.p.nombre)}</b><small>${escHtml(pl.p.sub || "")}</small>`; etqs.appendChild(e); pl.etq = e; });
  c.addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-cz]"); if (!b) return;
    const q = b.dataset.cz;
    if (q === "sobrio") ponerSobrio(!sobrio);
    else if (q === "tirar") { lanzar = !lanzar; b.setAttribute("aria-pressed", String(lanzar)); caja.classList.toggle("lanzando", lanzar); avisarCaja(lanzar ? "Arrastrá y soltá: la piedra sale volando" : "Listo, se guardaron las piedras"); }
    else if (q === "chiches") { const p = caja.querySelector(".cz-chiches"); p.hidden = !p.hidden; }
    else if (q === "cerrar-chiches") caja.querySelector(".cz-chiches").hidden = true;
    else if (q === "lejos") ponerZoom(zoomObj * 1.3);
    else if (q === "cerca") ponerZoom(zoomObj / 1.3);
    else if (q === "todo") { if (E.sel !== null) soltar(); ponerZoom(1.7); }
    else if (q === "volver") soltar();
    else if (q === "ant" || q === "sig") paso(q === "ant" ? -1 : 1);
  });
  if (E.sel !== null) mostrarHoja();
}
function mostrarHoja() {
  const pl = E.planetas[E.sel], h = caja?.querySelector(".cz-hoja"); if (!pl || !h) return;
  h.style.setProperty("--tono", pl.id.glow);
  h.querySelector(".cz-ceja").textContent = [pl.p.estado, pl.p.sub].filter(Boolean).join(" · ");
  h.querySelector(".cz-nombre").textContent = pl.p.nombre;
  h.querySelector(".cz-que").textContent = pl.p.que || "";
  h.querySelector(".cz-paso").hidden = !pl.p.paso; h.querySelector(".cz-paso div").textContent = pl.p.paso || "";
  h.querySelector(".cz-entrar").href = "#/p/" + encodeURIComponent(pl.p.id);
  h.classList.add("abierta"); h.setAttribute("aria-hidden", "false");
  caja.classList.add("con-hoja");
}
function elegir(i) {
  E.sel = i; const pl = E.planetas[i];
  const g = E.giro[pl.p.anillo]; const meta = Math.PI / 2 - pl.fase; E.giroObj = g + Math.atan2(Math.sin(meta - g), Math.cos(meta - g));
  mostrarHoja();
  if (!quieto() && !sobrio) golpe(i, .4);
}
function soltar() {
  E.sel = null; E.giroObj = null;
  const h = caja?.querySelector(".cz-hoja"); if (h) { h.classList.remove("abierta"); h.setAttribute("aria-hidden", "true"); }
  caja?.classList.remove("con-hoja");
}
const paso = (d) => { if (E.sel !== null) elegir((E.sel + d + E.planetas.length) % E.planetas.length); };
function ponerSobrio(v) {
  sobrio = v; guardar("cosmosSobrio", v); E.inclObj = v ? 0 : .38; E.rollObj = 0;
  const b = caja?.querySelector('[data-cz="sobrio"]'); if (b) { b.setAttribute("aria-pressed", String(v)); b.textContent = v ? "Cosmos" : "Sobrio"; }
  caja?.classList.toggle("sobrio", v);
  if (v) { E.rayos.forEach((r) => { r.vida = r.dur; }); E.agenda.length = 0; }
}

// ---------- Tocar y arrastrar ----------
// Un dedo: gira de costado (como siempre). Dos dedos: pellizcar acerca o aleja, subir o bajar los dos lo inclina
// (de frente, de canto, desde abajo) y girarlos como una perilla lo rota. Doble toque en el vacío: vista de siempre.
const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
let arrastre = null, inercia = 0, apretado = null, ultimoToque = 0, lanzar = false;
let zoom = 1, zoomObj = 1;
const dedos = new Map();
let pellizco = null;
const ponerZoom = (z) => { zoomObj = Math.min(2.4, Math.max(.55, z)); };
const lim = (v, a, b) => Math.max(a, Math.min(b, v));
function apuntar(e) { const r = E.lienzo.getBoundingClientRect(); ptr.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ptr, E.cam); }
const tocaNucleo = (e) => { apuntar(e); return !!ray.intersectObject(E.esfera)[0] || !!ray.intersectObject(E.aro)[0]; };
const planetaEn = (e) => { apuntar(e); const h = ray.intersectObjects(E.planetas.map((p) => p.toque))[0]; return h ? h.object.userData.i : -1; };
// El punto del espacio bajo el dedo, a la profundidad de Orbe.
function puntoEn(e) { apuntar(e); return ray.origin.clone().addScaledVector(ray.direction, E.cam.position.length()); }
const dosDedos = () => { const [a, b] = [...dedos.values()]; return { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, ang: Math.atan2(b.y - a.y, b.x - a.x), my: (a.y + b.y) / 2 }; };
function vistaDeSiempre() { E.inclObj = sobrio ? 0 : .38; E.rollObj = 0; ponerZoom(1); if (E.sel !== null) soltar(); }

function conectarToques() {
  const L = E.lienzo;
  L.addEventListener("wheel", (e) => { e.preventDefault(); ponerZoom(zoomObj * Math.exp(e.deltaY * .0012)); }, { passive: false });
  L.addEventListener("pointerdown", (e) => {
    dedos.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (dedos.size === 2) {
      const g = dosDedos();
      pellizco = { ...g, z: zoomObj, incl: E.inclObj, roll: E.rollObj, t: performance.now(), y0: g.my }; clearTimeout(apretado);
      if (arrastre) { arrastre.mov = 99; if (arrastre.piedra) soltarLanzada(arrastre.piedra, null); arrastre.piedra = null; }
      return;
    }
    arrastre = { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, mov: 0, largo: false, t: performance.now() }; inercia = 0;
    // Modo tirar: aparece una piedra bajo el dedo.
    if (lanzar) { arrastre.piedra = tomarPiedra(e); return; }
    const pi = planetaEn(e);
    if (pi >= 0) { apretado = setTimeout(() => { if (arrastre && arrastre.mov < 10) { arrastre.largo = true; arrastre.hilo = pi; E.planetas[pi].flash = 1; avisarCaja("Soltá sobre otro planeta para unirlos"); } }, 550); return; }
    if (!sobrio && tocaNucleo(e)) { apretado = setTimeout(() => { if (arrastre && arrastre.mov < 10) { arrastre.largo = true; modoSoberano(); } }, 650); return; }
    apretado = setTimeout(() => { if (arrastre && arrastre.mov < 10) { arrastre.largo = true; agujero(); avisarCaja("Lo llamaste vos."); } }, 700);
  });
  L.addEventListener("pointermove", (e) => {
    if (dedos.has(e.pointerId)) dedos.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pellizco && dedos.size >= 2) {
      const g = dosDedos();
      ponerZoom(pellizco.z * pellizco.d / g.d);
      E.rollObj = pellizco.roll + (g.ang - pellizco.ang);
      E.inclObj = lim(pellizco.incl + (g.my - pellizco.my) * .008, -1.45, 1.45);
      // Dos dedos rápido para arriba: lluvia de ideas.
      if (!pellizco.lluvia && pellizco.y0 - g.my > 120 && performance.now() - pellizco.t < 380 && Math.abs(g.d - pellizco.d) < 60) { pellizco.lluvia = true; E.inclObj = pellizco.incl; lluvia(); }
      return;
    }
    if (!arrastre) return;
    const dx = e.clientX - arrastre.x, dy = e.clientY - arrastre.y; arrastre.x = e.clientX; arrastre.y = e.clientY; arrastre.mov += Math.abs(dx) + Math.abs(dy);
    if (arrastre.piedra) { moverLanzada(arrastre.piedra, e); return; }
    if (arrastre.hilo != null || E.sel !== null) return;
    if (arrastre.mov > 10) clearTimeout(apretado);
    // El lienzo no deja que el navegador mueva la página (para poder usar dos dedos): un dedo vertical la mueve a mano.
    if (!arrastre.eje && arrastre.mov > 8) arrastre.eje = Math.abs(e.clientX - arrastre.x0) >= Math.abs(e.clientY - arrastre.y0) ? "x" : "y";
    if (arrastre.eje === "y") { window.scrollBy(0, -dy); return; }
    E.giro[0] += dx * .006; E.giro[1] += dx * .006; inercia = dx * .006 * 60;
  });
  const soltarDedo = (e) => { dedos.delete(e.pointerId); if (dedos.size < 2) pellizco = null; };
  L.addEventListener("pointercancel", (e) => { soltarDedo(e); clearTimeout(apretado); if (arrastre?.piedra) soltarLanzada(arrastre.piedra, null); arrastre = null; });
  L.addEventListener("pointerup", (e) => {
    const eraPellizco = !!pellizco || dedos.size > 1; soltarDedo(e);
    clearTimeout(apretado); if (!arrastre) return;
    if (eraPellizco || dedos.size) { arrastre = null; return; } const a = arrastre; arrastre = null;
    if (a.piedra) { soltarLanzada(a.piedra, e); return; }
    if (a.hilo != null) { const pj = planetaEn(e); if (pj >= 0 && pj !== a.hilo) cambiarHilo(a.hilo, pj); else avisarCaja("Soltalo arriba de otro planeta"); return; }
    if (a.largo) return;
    if (E.sel !== null && Math.abs(e.clientX - a.x0) > 50) { paso(e.clientX < a.x0 ? 1 : -1); return; }
    if (a.mov > 8) return;
    if (tocarMeteoro(e)) return;
    apuntar(e);
    const hit = ray.intersectObjects(E.planetas.map((p) => p.toque))[0];
    if (hit) { elegir(hit.object.userData.i); return; }
    if (!sobrio && tocaNucleo(e)) { uno([piedraCruza, piedraLejana, triple, cadena])(); return; }
    // Doble toque en el vacío: vuelve a la vista de siempre.
    const ahora = performance.now();
    if (ahora - ultimoToque < 320) { vistaDeSiempre(); ultimoToque = 0; return; }
    ultimoToque = ahora;
    if (E.sel !== null) soltar();
  });
}

// ---------- Chiche: tirar piedras ----------
function tomarPiedra(e) {
  const p = piedraLibre(); if (!p) return null;
  const pos = puntoEn(e);
  p.g.position.copy(pos); p.g.scale.setScalar(.36); brilloPiedra(p, 1, .3);
  return { p, hist: [{ pos: pos.clone(), t: performance.now() }] };
}
function moverLanzada(l, e) {
  if (!l) return;
  const pos = puntoEn(e); l.p.g.position.copy(pos);
  l.hist.push({ pos: pos.clone(), t: performance.now() }); if (l.hist.length > 6) l.hist.shift();
  if (Math.random() < .5) chispa(pos.clone(), l.p.c, null, .8);
}
function soltarLanzada(l, e) {
  if (!l) return;
  const p = l.p;
  const a = l.hist[0], b = l.hist[l.hist.length - 1], dt = Math.max(16, b.t - a.t) / 1000;
  const vel = b.pos.clone().sub(a.pos).divideScalar(dt);
  if (!e || vel.length() < 1.5) { soltarPiedra(p); return; }
  vel.clampLength(0, 30);
  const w = new THREE.Vector3();
  E.activos.push({ v: 0, update(dt) {
    this.v += dt;
    p.g.position.addScaledVector(vel, dt); vel.multiplyScalar(Math.exp(-dt * .6));
    p.cuerpo.rotation.y += dt * 8; p.cuerpo.rotation.x += dt * 5;
    if (Math.random() < .7) chispa(p.g.position.clone(), p.c, null, .9);
    for (const pl of E.planetas) {
      pl.g.getWorldPosition(w);
      if (w.distanceTo(p.g.position) < pl.A.tam * pl.esc * 1.5) { impacto(pl, p); soltarPiedra(p); return false; }
    }
    if (this.v > 2.6 || p.g.position.length() > 30) { soltarPiedra(p); return false; }
    brilloPiedra(p, Math.min(1, (2.6 - this.v) * 2), .3);
    return true;
  } });
}
function impacto(pl, p) {
  const w = pl.g.getWorldPosition(new THREE.Vector3());
  for (let k = 0; k < 40; k++) chispa(w.clone(), k % 2 ? p.c : pl.id.glow, new THREE.Vector3(azar(-1, 1), azar(-1, 1), azar(-1, 1)).normalize().multiplyScalar(azar(1.5, 4)), 1.4);
  pl.flash = 1.6; onda(pl, p.c); onda(pl, pl.id.glow);
  if (!sobrio) { cargar(.2, .6); luego(.2, () => rayo(borde(enSistema(pl.g)), enSistema(pl.g), pl.id.glow, .6)); }
  avisarCaja(pl.p.paso ? `${pl.p.nombre} · próximo: ${pl.p.paso}` : `¡Pleno en ${pl.p.nombre}!`, 3600);
}

// ---------- Chiche: lluvia de ideas ----------
const IDEAS_RELLENO = ["Anotá una idea con el + y aparece acá.", "Las ideas que no se anotan se las lleva el viento solar."];
function lluvia() {
  avisarCaja("Lluvia de ideas: tocá un meteorito");
  for (let k = 0; k < 12; k++) luego(k * .18, () => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: E.halo, color: "#ffe6c7", transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
    sp.scale.set(.55, .55, 1);
    const desde = new THREE.Vector3(azar(-7, 9), azar(5, 8), azar(-4, 3));
    const vel = new THREE.Vector3(azar(-3.5, -1.5), azar(-5, -3.5), azar(-.5, .5));
    sp.position.copy(desde); E.escena.add(sp);
    const m = { sp, vel, vivo: true };
    E.meteoros.push(m);
    E.activos.push({ v: 0, update(dt) {
      this.v += dt; sp.position.addScaledVector(vel, dt);
      if (Math.random() < .8) chispa(sp.position.clone(), "#ffb27a", vel.clone().multiplyScalar(-.08), .7);
      if (!m.vivo || this.v > 4) { m.vivo = false; E.escena.remove(sp); sp.material.dispose(); E.meteoros = E.meteoros.filter((x) => x !== m); return false; }
      return true;
    } });
  });
}
function tocarMeteoro(e) {
  if (!E.meteoros.length) return false;
  apuntar(e);
  const m = E.meteoros.find((x) => ray.ray.distanceToPoint(x.sp.position) < .9);
  if (!m) return false;
  m.vivo = false;
  for (let k = 0; k < 24; k++) chispa(m.sp.position.clone(), "#ffd6a8", new THREE.Vector3(azar(-1, 1), azar(-1, 1), azar(-1, 1)).multiplyScalar(2.4), 1.3);
  const l = extras.ideas?.length ? extras.ideas : IDEAS_RELLENO;
  avisarCaja("Idea: " + uno(l), 5200);
  return true;
}

// ---------- Chiche: hilos entre proyectos ----------
function cambiarHilo(i, j) {
  const a = E.planetas[i].p.id, b = E.planetas[j].p.id;
  const hilos = leer("cosmosHilos", []).filter((h) => Array.isArray(h) && h.length === 2);
  const k = hilos.findIndex(([x, y]) => (x === a && y === b) || (x === b && y === a));
  if (k >= 0) { hilos.splice(k, 1); avisarCaja(`Se cortó el hilo entre ${E.planetas[i].p.nombre} y ${E.planetas[j].p.nombre}`); }
  else { hilos.push([a, b]); avisarCaja(`${E.planetas[i].p.nombre} y ${E.planetas[j].p.nombre}, unidos`); E.planetas[j].flash = 1; if (!sobrio) rayo(enSistema(E.planetas[i].g), enSistema(E.planetas[j].g), "#ffffff", .5); }
  guardar("cosmosHilos", hilos.slice(-20));
  armarHilos();
}
function armarHilos() {
  E.hilosL.forEach((h) => { E.sistema.remove(h.l); h.l.geometry.dispose(); h.l.material.dispose(); });
  E.hilosL = [];
  const idx = (id) => E.planetas.findIndex((pl) => pl.p.id === id);
  for (const [a, b] of leer("cosmosHilos", [])) {
    const i = idx(a), j = idx(b); if (i < 0 || j < 0) continue;
    const c = new THREE.Color(E.planetas[i].id.glow).lerp(new THREE.Color(E.planetas[j].id.glow), .5).multiplyScalar(1.2);
    const m = new LineMaterial({ color: c, linewidth: 1.4, transparent: true, opacity: .55, dashed: true, dashSize: .18, gapSize: .14, depthWrite: false, toneMapped: false });
    m.resolution.copy(E.tam);
    const l = new Line2(new LineGeometry(), m); l.frustumCulled = false; E.sistema.add(l);
    E.hilosL.push({ l, i, j });
  }
}
function moverHilos(dt) {
  for (const h of E.hilosL) {
    const a = E.planetas[h.i]?.g.position, b = E.planetas[h.j]?.g.position; if (!a || !b) continue;
    const mid = a.clone().add(b).multiplyScalar(.5); mid.y += .35;
    const pts = new THREE.QuadraticBezierCurve3(a, mid, b).getPoints(16).flatMap((v) => [v.x, v.y, v.z]);
    h.l.geometry.setPositions(pts); h.l.computeLineDistances();
    h.l.material.dashOffset -= dt * .3;
  }
}

// ---------- Chiche: eclipses ----------
const FRASES_ECLIPSE = ["Por un momento, todo gira alrededor de {p}.", "Eclipse de {p}: hasta Orbe le hace sombra.", "{p} se puso delante. Raro, pero lindo.",
  "Alineación perfecta: Orbe, {p} y vos.", "Dicen que cuando {p} tapa a Orbe, el próximo paso sale solo.", "Cosas que pasan una vez cada tanto: {p} en eclipse."];
const vistoEclipse = {};
const pa = new THREE.Vector3(), pb = new THREE.Vector3();
function revisarEclipse() {
  if (E.sel !== null) return;
  E.nucleo.getWorldPosition(pa); const dNuc = pa.distanceTo(E.cam.position); pa.project(E.cam);
  for (const pl of E.planetas) {
    pl.g.getWorldPosition(pb); if (pb.distanceTo(E.cam.position) > dNuc - .5) continue;
    pb.project(E.cam);
    if (Math.hypot((pb.x - pa.x) * E.cam.aspect, pb.y - pa.y) < .07) {
      const ahora = performance.now();
      if (vistoEclipse[pl.p.id] && ahora - vistoEclipse[pl.p.id] < 60000) continue;
      vistoEclipse[pl.p.id] = ahora;
      E.eclipse = 1; pl.flash = 1.4;
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: E.aroT, color: "#fff4e0", transparent: true, opacity: .9, depthWrite: false, blending: THREE.AdditiveBlending }));
      pl.g.add(sp);
      E.activos.push({ v: 0, update(dt) { this.v += dt; const s = pl.A.tam * (2.1 + this.v * .6); sp.scale.set(s, s, 1); sp.material.opacity = .9 * Math.max(0, 1 - this.v / 2.4); if (this.v > 2.4) { pl.g.remove(sp); sp.material.dispose(); return false; } return true; } });
      const vistos = leer("eclipsesVistos", []);
      if (!vistos.includes(pl.p.id)) guardar("eclipsesVistos", [...vistos, pl.p.id], true);
      avisarCaja("Eclipse · " + uno(FRASES_ECLIPSE).replace("{p}", pl.p.nombre), 4200);
      return;
    }
  }
}

// ---------- Tamaño y bucle ----------
let D = 14, alto = 4.4, ancho0 = 0, alto0 = 0;
function medir() {
  const w = caja.clientWidth || 360, h = caja.clientHeight || 520;
  if (w === ancho0 && h === alto0) return;
  ancho0 = w; alto0 = h;
  E.tam.set(w * E.render.getPixelRatio(), h * E.render.getPixelRatio());
  E.render.setSize(w, h, false); E.comp.setSize(w, h); E.bloom.resolution.set(w, h);
  E.cam.aspect = w / h; E.cam.fov = E.cam.aspect < .8 ? 58 : 45; E.cam.updateProjectionMatrix();
  D = E.cam.aspect < .8 ? 11.6 / Math.max(E.cam.aspect / .5, .8) : 10.5; alto = D * .3;
  E.rayos.forEach((r) => r.lineas.forEach((l) => l.material.resolution.copy(E.tam)));
  E.hilosL.forEach((h) => h.l.material.resolution.copy(E.tam));
}
let ultimo = 0, proxRayo = 1.4, proxPiedra = 2.5, proxAgujero = 38, ultimoTipo = "", alterna = 0, proxAvance = 1.2;
const tmp = new THREE.Vector3(), haciaCam = new THREE.Vector3(), qInv = new THREE.Quaternion();
const camPos = new THREE.Vector3(0, 4, 14), camMira = new THREE.Vector3(), objPos = new THREE.Vector3(), objMira = new THREE.Vector3();
const VERDE_C = new THREE.Color(VERDE), ARO = new THREE.Color("#c4c4c0"), ROJO = new THREE.Color("#ff2848");
function ambiente0() {
  if (E.sel !== null) { golpe(E.sel); return; }
  const T = [["golpe", .38], ["cadena", .2], ["pulso", .27], ["triple", .15]];
  let r = Math.random(), tipo = "golpe";
  for (const [n, w] of T) { if ((r -= w) <= 0) { tipo = n; break; } }
  if (tipo === ultimoTipo && tipo !== "golpe") tipo = "golpe";
  ultimoTipo = tipo;
  ({ golpe: () => { const l = libres(); if (l.length) golpe(uno(l)); }, cadena, pulso, triple })[tipo]();
}
function cuadro(ahora) {
  if (!vivo || !visible || document.hidden) { raf = 0; return; }
  raf = requestAnimationFrame(cuadro);
  medir();
  const dt = Math.min(.05, (ahora - (ultimo || ahora)) / 1000); ultimo = ahora; E.t += dt;
  const sig = (k) => 1 - Math.exp(-dt * k), q = quieto(), calma = q || sobrio;

  for (let k = E.agenda.length - 1; k >= 0; k--) if (E.agenda[k].at <= E.t) { const f = E.agenda[k].fn; E.agenda.splice(k, 1); f(); }
  E.carga *= Math.exp(-dt * 3);
  for (let k = E.activos.length - 1; k >= 0; k--) if (E.activos[k].update(dt) === false) E.activos.splice(k, 1);
  E.soberano = Math.max(0, E.soberano - dt);

  if (E.sel === null) {
    if (!arrastre) { const auto = q ? 0 : sobrio ? .25 : 1; E.giro[0] += (ANILLOS[0].vel * auto + inercia * .02) * dt; E.giro[1] += (ANILLOS[1].vel * auto + inercia * .02) * dt; inercia *= Math.exp(-dt * 2.2); }
  } else { const k = E.planetas[E.sel].p.anillo; E.giro[k] += (E.giroObj - E.giro[k]) * sig(3.2); }
  E.incl += (E.inclObj - E.incl) * sig(4); E.roll += (E.rollObj - E.roll) * sig(5);
  E.sistema.rotation.set(E.incl, 0, E.roll);
  E.cielo.rotation.y += dt * .004;

  qInv.copy(E.sistema.quaternion).invert();
  E.planetas.forEach((pl, i) => {
    const a = pl.fase + E.giro[pl.p.anillo];
    pl.g.position.set(pl.A.R * Math.cos(a), calma ? 0 : Math.sin(E.t * .9 + i) * .06, pl.A.R * Math.sin(a));
    pl.cuerpo.rotation.y += dt * .25;
    const meta = E.sel === null ? 1 : E.sel === i ? 1.35 : .8;
    pl.esc += (meta - pl.esc) * sig(4); pl.g.scale.setScalar(pl.esc * (1 + pl.flash * .08));
    pl.atm.material.uniforms.f.value = ((E.sel === null || E.sel === i ? 1 : .4) + pl.flash * 1.2) * (sobrio ? .45 : 1);
    pl.cuerpo.material.emissiveIntensity = .02 + pl.flash * .35;
    pl.flash *= Math.exp(-dt * 3.2);
    pl.g.getWorldPosition(tmp); haciaCam.copy(E.cam.position).sub(tmp).normalize();
    pl.ins.position.copy(haciaCam).applyQuaternion(qInv).multiplyScalar(pl.A.tam * 1.02);
    pl.ins.material.opacity = E.sel === null || E.sel === i ? 1 : .45;
  });
  E.caraNucleo.quaternion.copy(qInv).multiply(E.cam.quaternion);
  if (!calma) E.caraNucleo.rotateZ(Math.sin(E.t * .5) * .05);
  const sob = E.soberano > 0 ? Math.min(1, E.soberano, 9 - E.soberano + .01) : 0;
  E.aroMat.color.copy(ARO).lerp(VERDE_C, sob * .7).multiplyScalar(1 + E.carga * .9);
  E.puntoMat.color.copy(ROJO).lerp(VERDE_C, sob).multiplyScalar(1.1 + E.carga * .8);
  E.auraN.material.color.set("#ff5a70").lerp(VERDE_C, sob);
  E.auraN.material.opacity = .2 + E.carga * .3 + (calma ? 0 : Math.sin(E.t * 1.6) * .03);
  E.nebulosas.forEach((n, k) => n.material.color.copy(n.userData.c).lerp(new THREE.Color(k === 1 ? "#5c6b73" : "#1f7a46"), sob));

  proxRayo -= dt; proxPiedra -= dt; proxAgujero -= dt; proxAvance -= dt;
  if (!calma && E.planetas.length) {
    if (proxAvance <= 0) {
      proxAvance = 6;
      const pend = avancesPendientes().map((id) => E.planetas.findIndex((pl) => pl.p.id === id)).filter((i) => i >= 0);
      if (pend.length) { avance(pend[0]); avanceVisto(E.planetas[pend[0]].p.id); proxPiedra = Math.max(proxPiedra, 6); }
    }
    if (proxRayo <= 0) { ambiente0(); proxRayo = azar(1.1, 2.6); }
    if (proxPiedra <= 0) { (alterna++ % 2 ? piedraCruza : piedraLejana)(); proxPiedra = azar(9, 18); }
    if (proxAgujero <= 0) { agujero(); proxAgujero = azar(70, 110); }
  }
  for (let k = E.rayos.length - 1; k >= 0; k--) {
    const r = E.rayos[k]; r.vida += dt; r.t += dt;
    if (r.t > .055 && r.vida < r.dur) { r.t = 0; rehacer(r); }
    const f = 1 - r.vida / r.dur, parp = .55 + Math.random() * .45;
    r.lineas.forEach((l, j) => { l.material.opacity = Math.max(0, f) * parp * (j === 2 ? .7 : 1); });
    if (r.vida >= r.dur) { r.lineas.forEach((l) => { E.sistema.remove(l); l.geometry.dispose(); l.material.dispose(); }); E.rayos.splice(k, 1); }
  }
  moverHilos(dt);
  if ((E.cuadros = (E.cuadros || 0) + 1) % 8 === 0) revisarEclipse();
  E.eclipse *= Math.exp(-dt * 1.2);
  E.sol.intensity = (40 + E.rayos.length * 8 + E.carga * 30) * (1 - E.eclipse * .7);
  if (ch) {
    for (let k = 0; k < NCH; k++) if (ch.vida[k] > 0) {
      ch.vida[k] -= dt * 1.1;
      ch.pos[k * 3] += ch.vel[k * 3] * dt; ch.pos[k * 3 + 1] += ch.vel[k * 3 + 1] * dt; ch.pos[k * 3 + 2] += ch.vel[k * 3 + 2] * dt;
      const f = ch.vida[k] <= 0 ? 0 : .97; ch.col[k * 3] *= f; ch.col[k * 3 + 1] *= f; ch.col[k * 3 + 2] *= f;
    }
    ch.geo.attributes.position.needsUpdate = true; ch.geo.attributes.color.needsUpdate = true;
  }

  const apaisado = E.cam.aspect >= .8;
  zoom += (zoomObj - zoom) * sig(6);
  if (E.sel === null && sobrio) { objPos.set(0, D * (apaisado ? .9 : 1.3) * zoom, .01); objMira.set(0, 0, 0); }
  else if (E.sel === null) { objPos.set(0, alto * zoom, D * zoom); objMira.set(0, (apaisado ? -.3 : .35) * Math.max(0, Math.min(1, 2 - zoom)), 0); }
  else {
    E.planetas[E.sel].g.getWorldPosition(tmp);
    const z = E.planetas[E.sel].A.tam * (apaisado ? 8 : 11);
    objPos.set(tmp.x * .85, tmp.y + z * .3, tmp.z + z); objMira.set(tmp.x, tmp.y - z * .16, tmp.z);
  }
  camPos.lerp(objPos, sig(2.6)); camMira.lerp(objMira, sig(3)); E.cam.position.copy(camPos); E.cam.lookAt(camMira);

  const W = ancho0, H = alto0;
  const dCam = E.cam.position.length();
  E.planetas.forEach((pl) => {
    if (!pl.insD) return;
    pl.g.getWorldPosition(tmp);
    const dist = tmp.distanceTo(E.cam.position);
    const rpx = (pl.A.tam * pl.esc) / (dist * Math.tan(E.cam.fov * Math.PI / 360)) * (H / 2);
    tmp.project(E.cam);
    const x = (tmp.x + 1) / 2 * W, y = (1 - tmp.y) / 2 * H, tam2 = Math.max(10, rpx * 1.15);
    pl.insD.style.transform = `translate(${(x - tam2 / 2).toFixed(1)}px, ${(y - tam2 / 2).toFixed(1)}px)`;
    pl.insD.style.width = pl.insD.style.height = tam2.toFixed(1) + "px";
    pl.insD.style.zIndex = String(Math.round(1000 - dist * 20));
    pl.insD.style.opacity = tmp.z > 1 ? 0 : (E.sel === null || E.sel === pl.i0 ? 1 : .45) * (dist > dCam + 1.5 ? .55 : 1);
  });
  E.planetas.forEach((pl) => {
    if (!pl.etq) return;
    pl.g.getWorldPosition(tmp); tmp.y -= pl.A.tam * pl.esc * 1.25; tmp.project(E.cam);
    const x = (tmp.x + 1) / 2 * W, y = (1 - tmp.y) / 2 * H;
    const prof = THREE.MathUtils.clamp((pl.g.position.z / pl.A.R + 1) / 2, 0, 1);
    pl.etq.style.transform = `translate(${x.toFixed(1)}px, ${(y + 6).toFixed(1)}px) translateX(-50%)`;
    pl.etq.style.opacity = E.sel === null ? (sobrio ? 1 : prof < .4 ? .22 : .5 + prof * .5) : 0;
  });
  E.comp.render();
}
function arrancar() { if (!raf && vivo && visible && !document.hidden) { ultimo = 0; raf = requestAnimationFrame(cuadro); } }
document.addEventListener("visibilitychange", arrancar);
let mirador = null;

// ---------- Lo que usa la página ----------
// Monta el cosmos en el contenedor (o lo mueve ahí si ya existía). Devuelve false si el celu no tiene 3D.
let extras = {};
export function montar(contenedor, proyectos, mas = {}) {
  extras = mas;
  if (!E) { E = armar(); if (!E) return false; armarPiedras(); conectarToques(); }
  caja = contenedor; ancho0 = alto0 = 0;
  caja.classList.toggle("sobrio", sobrio);
  caja.prepend(E.lienzo);
  ponerPlanetas(proyectos);
  armarHilos();
  if (E.sel !== null && E.sel >= E.planetas.length) E.sel = null;
  capa();
  mirador?.disconnect();
  mirador = new IntersectionObserver((es) => { visible = es[0].isIntersecting; arrancar(); }, { threshold: .05 });
  mirador.observe(caja);
  vivo = true; visible = true; arrancar();
  return true;
}
export function parar() { vivo = false; mirador?.disconnect(); if (raf) cancelAnimationFrame(raf); raf = 0; }
export const probar = { inclinar: (x, r = 0) => { E.inclObj = x; E.rollObj = r; }, lluvia: () => lluvia(), hilo: (i, j) => cambiarHilo(i, j), impacto: (i) => impacto(E.planetas[i], E.piedras[0]), vista: () => vistaDeSiempre(), elegir: (i) => elegir(i), avance: (i) => avance(i), piedraLejana: () => piedraLejana(), piedraCruza: () => piedraCruza(), agujero: () => agujero(), modoSoberano: () => modoSoberano() };
