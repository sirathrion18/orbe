// El mundito de Amorcitos: un globo chiquito en la portada que, al tocarlo, se abre en grande.
// Los países donde estuvieron llevan su bandera («desbloqueados»); las ciudades, un pin chiquito;
// donde quieren ir, rayado violeta con un candadito. Con uno o dos dedos se gira para todos lados,
// se pellizca para acercar, y con un botón se aplana en planisferio.
// Lo usan Orbe y la página de Agus. Los lugares vienen de lo compartido (servidor), no de este código.

let THREE = null, GEO = null, COD = null;
async function cargar() {
  if (!THREE) THREE = await import("/vendor/three/build/three.module.min.js");
  if (!GEO) GEO = await fetch("/vendor/mundo/paises-110m.json").then((r) => r.json());
  if (!COD) COD = await fetch("/vendor/banderas/codigos.json").then((r) => r.json()).catch(() => ({}));
}
// Banderas oficiales (las de Wikipedia, vía flag-icons): se cargan solo las que hacen falta.
const IMG = {};
const a2 = (iso) => COD?.[iso]?.[0] || "";
const urlBandera = (iso) => a2(iso) ? "/vendor/banderas/" + a2(iso) + ".svg" : "";
function imagenBandera(iso) {
  if (IMG[iso]) return IMG[iso];
  IMG[iso] = new Promise((ok) => { const u = urlBandera(iso); if (!u) return ok(null); const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = u; });
  return IMG[iso];
}
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const oscuro = () => document.documentElement.dataset.theme === "oscuro";
const quieto = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const CASA = [-34.62, -58.43];
const PR = 0.64; // tamaño del planisferio

// ---------- Datos ----------
export function lugaresDe(doc) {
  const l = (doc?.items || []).filter((x) => x.tipo === "lugar" && Number.isFinite(x.lat) && Number.isFinite(x.lon));
  const fui = new Set(l.filter((x) => x.hecho && x.iso).map((x) => x.iso));
  const ir = new Set(l.filter((x) => !x.hecho && x.iso && !fui.has(x.iso)).map((x) => x.iso));
  const paises = {};
  l.forEach((x) => { if (!x.iso) return; (paises[x.iso] ||= { iso: x.iso, nombre: x.pais || x.iso, fuimos: [], ir: [] })[x.hecho ? "fuimos" : "ir"].push(x); });
  return { l, fui, ir, paises };
}

// ---------- Un país sin bandera cargada: rosa con un corazón (desbloqueado igual) ----------
function corazon(g, x, y, s, col) {
  g.fillStyle = col; g.beginPath(); g.moveTo(x, y + s * .3);
  g.bezierCurveTo(x, y, x - s * .5, y, x - s * .5, y + s * .3); g.bezierCurveTo(x - s * .5, y + s * .6, x, y + s * .75, x, y + s);
  g.bezierCurveTo(x, y + s * .75, x + s * .5, y + s * .6, x + s * .5, y + s * .3); g.bezierCurveTo(x + s * .5, y, x, y, x, y + s * .3); g.fill();
}
// La bandera tapa el territorio sin deformarse (como una foto «cubriendo» el recuadro), centrada.
function pintarBandera(g, img, x, y, w, h) {
  if (!img) { g.fillStyle = "#E46A7E"; g.fillRect(x, y, w, h); corazon(g, x + w / 2, y + h * .3, Math.min(w, h) * .4, "#FFFFFF"); return; }
  const r = img.naturalWidth / img.naturalHeight || 4 / 3, e = Math.max(w / r, h);
  g.drawImage(img, x + w / 2 - e * r / 2, y + h / 2 - e / 2, e * r, e);
}

// ---------- Textura del mundo ----------
const TW = 2048, TH = 1024;
const px = (lon) => (lon + 180) / 360 * TW, py = (lat) => (90 - lat) / 180 * TH;
function anillos(f) { return f.p.map((r) => { const pts = []; for (let k = 0; k < r.length; k += 2) pts.push([r[k], r[k + 1]]); return pts; }); }
function camino(g, pts) {
  g.moveTo(px(pts[0][0]), py(pts[0][1]));
  for (let k = 1; k < pts.length; k++) {
    // Si un anillo cruza el borde del mapa (±180°), se corta el trazo para no dibujar una franja.
    if (Math.abs(pts[k][0] - pts[k - 1][0]) > 180) g.moveTo(px(pts[k][0]), py(pts[k][1])); else g.lineTo(px(pts[k][0]), py(pts[k][1]));
  }
  g.closePath();
}
const areaDe = (pts) => { let a = 0; for (let i = 0; i < pts.length; i++) { const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length]; a += x1 * y2 - x2 * y1; } return Math.abs(a) / 2; };
export function principal(f) {
  // El territorio más grande, sin los pedazos que cruzan el borde (así la bandera se ve entera y no estirada).
  const rs = anillos(f).filter((r) => r.every((q, k) => !k || Math.abs(q[0] - r[k - 1][0]) < 180));
  return rs.sort((a, b) => areaDe(b) - areaDe(a))[0] || anillos(f)[0];
}
async function textura(datos, os) {
  const imgs = {}; await Promise.all([...datos.fui].map(async (iso) => { imgs[iso] = await imagenBandera(iso); }));
  const c = document.createElement("canvas"); c.width = TW; c.height = TH;
  const g = c.getContext("2d");
  const mar = os ? "#0B1422" : "#A9C9E4", tierra = os ? "#4A6470" : "#FBF8F2", borde = os ? "rgba(255,255,255,.07)" : "rgba(60,80,100,.12)";
  g.fillStyle = mar; g.fillRect(0, 0, TW, TH);
  g.fillStyle = tierra; g.strokeStyle = borde; g.lineWidth = 1;
  GEO.forEach((f) => { g.beginPath(); anillos(f).forEach((r) => camino(g, r)); g.fill(); g.stroke(); });
  GEO.forEach((f) => {
    const fui = datos.fui.has(f.i), ir = datos.ir.has(f.i);
    if (!fui && !ir) return;
    g.save(); g.beginPath(); anillos(f).forEach((r) => camino(g, r)); g.clip();
    const p = principal(f), xs = p.map((q) => px(q[0])), ys = p.map((q) => py(q[1]));
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    if (fui) {
      // Las islas lejanas toman los colores de la bandera agrandada; el territorio principal, la bandera justa.
      pintarBandera(g, imgs[f.i], x0 - (x1 - x0), y0 - (y1 - y0), (x1 - x0) * 3, (y1 - y0) * 3);
      pintarBandera(g, imgs[f.i], x0, y0, x1 - x0, y1 - y0);
    } else {
      g.fillStyle = os ? "rgba(125,111,214,.45)" : "rgba(156,139,234,.35)"; g.fillRect(0, 0, TW, TH);
      g.strokeStyle = os ? "rgba(156,139,234,.8)" : "rgba(110,95,200,.55)"; g.lineWidth = 3;
      for (let k = -TH; k < TW; k += 13) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k + TH, TH); g.stroke(); }
    }
    g.restore();
  });
  return c;
}

// ---------- Íconos (sprites) ----------
function lienzo(dib, w = 128, h = 160) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; dib(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
let ICON = null;
function iconos() {
  if (ICON) return ICON;
  ICON = {
    pin: lienzo((g, w, h) => { g.fillStyle = "#E46A7E"; g.beginPath(); g.arc(w / 2, 52, 40, Math.PI, 0); g.quadraticCurveTo(w / 2 + 40, 90, w / 2, h - 6); g.quadraticCurveTo(w / 2 - 40, 90, w / 2 - 40, 52); g.fill(); g.fillStyle = "#fff"; g.beginPath(); g.arc(w / 2, 52, 15, 0, 7); g.fill(); }),
    ir: lienzo((g, w, h) => { g.strokeStyle = "#9C8BEA"; g.lineWidth = 10; g.setLineDash([14, 10]); g.beginPath(); g.arc(w / 2, h / 2, 44, 0, 7); g.stroke(); }, 128, 128),
    candado: lienzo((g, w) => { g.fillStyle = g.strokeStyle = "#9C8BEA"; g.lineWidth = 11; g.beginPath(); g.arc(w / 2, 54, 24, Math.PI, 0); g.stroke(); g.beginPath(); g.roundRect ? g.roundRect(w / 2 - 38, 52, 76, 62, 12) : g.rect(w / 2 - 38, 52, 76, 62); g.fill(); g.fillStyle = "#1b1530"; g.beginPath(); g.arc(w / 2, 80, 8, 0, 7); g.fill(); g.fillRect(w / 2 - 3, 82, 6, 16); }, 128, 128),
    casa: lienzo((g, w, h) => { g.fillStyle = "#F2F2F0"; g.beginPath(); g.arc(w / 2, h / 2, 22, 0, 7); g.fill(); g.strokeStyle = "#E46A7E"; g.lineWidth = 8; g.beginPath(); g.arc(w / 2, h / 2, 34, 0, 7); g.stroke(); }, 128, 128),
  };
  return ICON;
}

// ---------- Un globo ----------
const enEsfera = (la, lo, r = 1) => { const f = (90 - la) * Math.PI / 180, t = (lo + 180) * Math.PI / 180; return new THREE.Vector3(-r * Math.sin(f) * Math.cos(t), r * Math.cos(f), r * Math.sin(f) * Math.sin(t)); };
const enPlano = (la, lo) => new THREE.Vector3(((lo + 180) / 360 - .5) * Math.PI * 2 * PR, ((la + 90) / 180 - .5) * Math.PI * PR, .006);
const VS = `uniform float morf;varying vec2 vu;varying vec3 vn;varying vec3 vv;
void main(){vu=uv;vec3 pl=vec3((uv.x-.5)*6.28318*${PR},(uv.y-.5)*3.14159*${PR},0.);vec3 p=mix(position,pl,morf);
vn=normalize(normalMatrix*mix(normal,vec3(0.,0.,1.),morf));vec4 mv=modelViewMatrix*vec4(p,1.);vv=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}`;
const FS = (os) => `uniform sampler2D m;uniform float morf;varying vec2 vu;varying vec3 vn;varying vec3 vv;
void main(){vec3 c=texture2D(m,vu).rgb;float l=mix(.62+.45*max(dot(vn,normalize(vec3(-.4,.5,1.))),0.),1.,morf);
float rim=pow(1.-max(dot(vn,vv),0.),3.)*(1.-morf);gl_FragColor=vec4(c*l+rim*${os ? "vec3(.9,.45,.55)*.45" : "vec3(.55,.7,.95)*.35"},1.);}`;

class Globo {
  constructor(caja, datos, { grande = false, alTocarPais } = {}) {
    this.caja = caja; this.datos = datos; this.grande = grande; this.alTocarPais = alTocarPais;
    this.os = oscuro(); this.morf = 0; this.morfObj = 0;
    this.rx = .3; this.ry = -1.55; this.rz = 0; this.z = grande ? 4.9 : 3.75; this.zObj = this.z;
    this.vel = grande ? .0012 : .0035; this.pins = []; this.arcos = []; this.vx = this.vy = 0;
    const W = caja.clientWidth || 300, H = caja.clientHeight || 300;
    const r = this.r = new THREE.WebGLRenderer({ antialias: true, alpha: !this.os });
    r.setPixelRatio(Math.min(2, devicePixelRatio)); r.setSize(W, H);
    r.setClearColor(this.os ? "#05070D" : "#000000", this.os ? 1 : 0);
    r.domElement.className = "mu-lienzo"; caja.prepend(r.domElement);
    this.esc = new THREE.Scene(); this.cam = new THREE.PerspectiveCamera(32, W / H, .1, 200); this.cam.position.set(0, 0, this.z);
    if (this.os) {
      // Estrellas: cada una con su ritmo; algunas titilan más que otras.
      const n = grande ? 1500 : 500, p = new Float32Array(n * 3), fa = new Float32Array(n), br = new Float32Array(n);
      for (let i = 0; i < n; i++) { const u = Math.random() * 2 - 1, a = Math.random() * 6.283, rr = 40 + Math.random() * 30; p[i * 3] = rr * Math.sqrt(1 - u * u) * Math.cos(a); p[i * 3 + 1] = rr * u; p[i * 3 + 2] = rr * Math.sqrt(1 - u * u) * Math.sin(a) - 20; fa[i] = Math.random() * 6.283; br[i] = Math.random() < .14 ? 1 : .25; }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(p, 3)); g.setAttribute("fase", new THREE.BufferAttribute(fa, 1)); g.setAttribute("brillo", new THREE.BufferAttribute(br, 1));
      this.estrellas = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { t: { value: 0 }, tam: { value: grande ? 2.6 : 2.2 } },
        vertexShader: "attribute float fase;attribute float brillo;uniform float t,tam;varying float a;void main(){a=.45+brillo*.55*(.5+.5*sin(t*(1.2+fase*.4)+fase*7.));vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=tam*(1.+brillo*.8*(.5+.5*sin(t*1.7+fase*5.)))*" + Math.min(2, devicePixelRatio).toFixed(1) + ";gl_Position=projectionMatrix*mv;}",
        fragmentShader: "varying float a;void main(){vec2 c=gl_PointCoord-.5;float d=length(c);if(d>.5)discard;gl_FragColor=vec4(.86,.89,1.,a*(1.-d*1.6));}" });
      this.esc.add(new THREE.Points(g, this.estrellas));
      this.cometas = []; this.proxCometa = 1.5 + Math.random() * 3;
    }
    const tex = new THREE.CanvasTexture(datos.lienzo); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    this.mat = new THREE.ShaderMaterial({ side: THREE.DoubleSide, uniforms: { m: { value: tex }, morf: { value: 0 } }, vertexShader: VS, fragmentShader: FS(this.os) });
    this.globo = new THREE.Group(); this.esc.add(this.globo);
    this.malla = new THREE.Mesh(new THREE.SphereGeometry(1, grande ? 128 : 64, grande ? 96 : 48), this.mat); this.globo.add(this.malla);
    this.halo = new THREE.Mesh(new THREE.SphereGeometry(1.1, 48, 24), new THREE.ShaderMaterial({ transparent: true, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: "varying vec3 n;void main(){n=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
      fragmentShader: "uniform float a;varying vec3 n;void main(){float k=pow(max(.6-dot(n,vec3(0,0,1.)),0.),2.);gl_FragColor=vec4(" + (this.os ? ".9,.42,.5" : ".45,.62,.95") + ",k*a);}", uniforms: { a: { value: this.os ? .4 : .35 } } }));
    this.esc.add(this.halo);
    this.ponerPines();
    this.t = 0; this.vivo = true; this.ver = true;
    this.io = new IntersectionObserver(([e]) => { this.ver = e.isIntersecting; }); this.io.observe(caja);
    this.cuadro = this.cuadro.bind(this); requestAnimationFrame(this.cuadro);
    if (grande) this.gestos();
  }
  ponerPines() {
    const I = iconos(), s = this.grande ? .045 : .07;
    const sp = (map, la, lo, w, h, cy = 0) => { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map, transparent: true })); m.center.set(.5, cy); m.scale.set(w, h, 1); m.userData = { la, lo }; this.globo.add(m); this.pins.push(m); return m; };
    sp(I.casa, CASA[0], CASA[1], s * .6, s * .6, .5);
    this.datos.l.forEach((x) => {
      if (x.hecho) sp(I.pin, x.lat, x.lon, s * .8 * .6, s * .6);
      else if (this.datos.fui.has(x.iso)) sp(I.ir, x.lat, x.lon, s * .6, s * .6, .5);
      else sp(I.candado, x.lat, x.lon, s * 1.1, s * 1.1, .5);
    });
    // Líneas punteadas de casa a donde quieren ir.
    if (this.grande) this.datos.l.filter((x) => !x.hecho).forEach((x) => {
      const g = new THREE.BufferGeometry(); const l = new THREE.Line(g, new THREE.LineDashedMaterial({ color: "#9C8BEA", dashSize: .03, gapSize: .022, transparent: true, opacity: .8 }));
      l.userData = { la: x.lat, lo: x.lon }; this.globo.add(l); this.arcos.push(l);
    });
    this.ubicar();
  }
  ubicar() {
    const m = this.morf;
    this.pins.forEach((p) => { const { la, lo } = p.userData; p.position.copy(enEsfera(la, lo, 1.003)).lerp(enPlano(la, lo), m); });
    const a = enEsfera(CASA[0], CASA[1]), ap = enPlano(CASA[0], CASA[1]);
    this.arcos.forEach((l) => {
      const { la, lo } = l.userData, b = enEsfera(la, lo), bp = enPlano(la, lo);
      const mid = a.clone().add(b).normalize().multiplyScalar(1 + a.distanceTo(b) * .28), midp = ap.clone().add(bp).multiplyScalar(.5).add(new THREE.Vector3(0, ap.distanceTo(bp) * .18, .01));
      const c = new THREE.QuadraticBezierCurve3(a.clone().lerp(ap, m), mid.lerp(midp, m), b.clone().lerp(bp, m));
      l.geometry.setFromPoints(c.getPoints(60)); l.computeLineDistances();
    });
  }
  zPlano() {
    // Que el planisferio entre entero a lo ancho (con un poco de aire).
    const asp = this.cam.aspect, ancho = Math.PI * 2 * PR * 1.06, alto = Math.PI * PR * 1.1, t = Math.tan(this.cam.fov * Math.PI / 360);
    return Math.max(ancho / 2 / (t * asp), alto / 2 / t);
  }
  plano(si) {
    this.morfObj = si ? 1 : 0; this.zObj = si ? this.zPlano() : 4.9;
    if (si) this.ryPlano = Math.round(this.ry / (Math.PI * 2)) * Math.PI * 2;
    if (si) { this.rx0 = this.rx; this.ry0 = this.ry; this.rz0 = this.rz; }
  }
  mirar(la, lo) {
    // Gira para poner ese lugar de frente (y se acerca un poco).
    // El giro más corto hasta ahí (sin dar vueltas de más).
    const meta = -(lo + 90) * Math.PI / 180, v = Math.PI * 2;
    this.ryObj = meta + Math.round((this.ry - meta) / v) * v; this.rxObj = la * Math.PI / 180 * .9; this.rzObj = 0; this.zObj = this.morf > .5 ? this.zPlano() : 3.4;
  }
  cuadro() {
    if (!this.vivo) return;
    requestAnimationFrame(this.cuadro);
    if (!this.ver || document.hidden) return;
    this.t += 1 / 60;
    const k = .12;
    if (this.estrellas) { this.estrellas.uniforms.t.value = this.t; this.cometa(); }
    // Envión: después de soltar, sigue girando un poco y frena solo.
    if (!this.toques && (Math.abs(this.vx) > .00005 || Math.abs(this.vy) > .00005)) { this.ry += this.vx; this.rx = Math.max(-1.45, Math.min(1.45, this.rx + this.vy)); this.vx *= .93; this.vy *= .93; }
    if (Math.abs(this.morfObj - this.morf) > .001) {
      this.morf += (this.morfObj - this.morf) * .09; if (Math.abs(this.morfObj - this.morf) < .002) this.morf = this.morfObj;
      this.mat.uniforms.morf.value = this.morf; this.halo.visible = this.morf < .3; this.ubicar();
    }
    if (this.morf > .01) { this.rx += (0 - this.rx) * k; this.ry += ((this.ryPlano || 0) - this.ry) * k; this.rz += (0 - this.rz) * k; }
    else if (this.ryObj != null) {
      this.ry += (this.ryObj - this.ry) * k; this.rx += (this.rxObj - this.rx) * k; this.rz += (this.rzObj - this.rz) * k;
      if (Math.abs(this.ryObj - this.ry) < .002) this.ryObj = null;
    } else if (!this.toques && !quieto()) this.ry += this.vel;
    this.z += (this.zObj - this.z) * k; this.cam.position.z = this.z;
    this.globo.rotation.set(this.rx, this.ry, this.rz);
    this.pins.forEach((p) => { if (p.material.map === ICON.ir) p.scale.setScalar((this.grande ? .027 : .042) * (1 + .22 * Math.sin(this.t * 3 + p.userData.lo))); });
    this.r.render(this.esc, this.cam);
  }
  gestos() {
    const el = this.r.domElement, pts = new Map();
    let ini = null, dos = null, toqueEn = 0;
    const dd = () => { const [a, b] = [...pts.values()]; return { d: Math.hypot(a.x - b.x, a.y - b.y), ang: Math.atan2(b.y - a.y, b.x - a.x), my: (a.y + b.y) / 2 }; };
    el.addEventListener("pointerdown", (e) => {
      el.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); this.toques = pts.size; this.ryObj = null;
      if (pts.size === 1) { ini = { x: e.clientX, y: e.clientY, t: Date.now(), mov: 0 }; this.vx = this.vy = 0; }
      if (pts.size === 2) { dos = { ...dd(), z: this.zObj, rz: this.rz, rx: this.rx }; ini = null; }
    });
    el.addEventListener("pointermove", (e) => {
      if (!pts.has(e.pointerId)) return;
      const ant = pts.get(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 1 && ini) {
        const dx = e.clientX - ant.x, dy = e.clientY - ant.y; ini.mov += Math.abs(dx) + Math.abs(dy);
        if (this.morf > .5) { this.globo.position.x = Math.max(-2, Math.min(2, this.globo.position.x + dx * .006)); this.globo.position.y = Math.max(-1, Math.min(1, this.globo.position.y - dy * .006)); }
        else { const f = .0032 * this.z / 4.4; this.ry += dx * f; this.rx = Math.max(-1.45, Math.min(1.45, this.rx + dy * f)); this.vx = dx * f * .6; this.vy = dy * f * .6; }
      } else if (pts.size === 2 && dos) {
        const n = dd();
        this.zObj = this.z = Math.max(this.morf > .5 ? 2.5 : 1.9, Math.min(this.morf > .5 ? this.zPlano() * 1.2 : 7, dos.z * dos.d / n.d));
        if (this.morf < .5) { this.rz = dos.rz + (n.ang - dos.ang) * .7; this.rx = Math.max(-1.45, Math.min(1.45, dos.rx + (n.my - dos.my) * .005)); }
      }
    });
    const fin = (e) => {
      if (!pts.has(e.pointerId)) return;
      pts.delete(e.pointerId); this.toques = pts.size;
      if (ini && pts.size === 0 && ini.mov < 8 && Date.now() - ini.t < 350) {
        const ahora = Date.now();
        if (ahora - toqueEn < 320) { this.rx = .3; this.rz = 0; this.zObj = this.morf > .5 ? this.zPlano() : 4.9; this.globo.position.set(0, 0, 0); }
        else this.tocar(e);
        toqueEn = ahora;
      }
      if (pts.size < 2) dos = null;
      if (pts.size === 0) ini = null;
    };
    el.addEventListener("pointerup", fin); el.addEventListener("pointercancel", fin);
    el.addEventListener("wheel", (e) => { e.preventDefault(); this.zObj = Math.max(1.9, Math.min(this.morf > .5 ? 9 : 7, this.zObj * (1 + Math.sign(e.deltaY) * .1))); }, { passive: false });
  }
  tocar(e) {
    const rect = this.r.domElement.getBoundingClientRect();
    const v = new THREE.Vector2((e.clientX - rect.left) / rect.width * 2 - 1, -(e.clientY - rect.top) / rect.height * 2 + 1);
    const ray = new THREE.Raycaster(); ray.setFromCamera(v, this.cam);
    let lon, lat;
    if (this.morf > .5) {
      // Planisferio: donde el rayo cruza el plano del mapa.
      const inv = this.globo.matrixWorld.clone().invert(), o = ray.ray.origin.clone().applyMatrix4(inv), d = ray.ray.direction.clone().transformDirection(inv);
      if (Math.abs(d.z) < 1e-6) return;
      const p = o.add(d.multiplyScalar(-o.z / d.z));
      lon = (p.x / (Math.PI * 2 * PR) + .5) * 360 - 180; lat = (p.y / (Math.PI * PR) + .5) * 180 - 90;
      if (Math.abs(lon) > 180 || Math.abs(lat) > 90) return;
    } else {
      const hit = ray.intersectObject(this.malla)[0];
      if (!hit?.uv) return;
      lon = hit.uv.x * 360 - 180; lat = hit.uv.y * 180 - 90;
    }
    const f = GEO.find((p) => anillos(p).some((r) => dentro(lon, lat, r)));
    this.alTocarPais?.(f ? f.i : null, f ? f.n : null);
  }
  // Cometas: cada tanto cruza uno por el fondo (solo de noche).
  cometa() {
    if (quieto()) return;
    const ahora = performance.now(), dt = Math.min(.25, ((ahora - (this.tCometa || ahora)) / 1000)); this.tCometa = ahora;
    this.proxCometa -= dt;
    if (this.proxCometa <= 0) {
      this.proxCometa = 7 + Math.random() * 9;
      // Una cabeza brillante y una cola de puntitos que se achican y se apagan.
      const N = 40, g = new THREE.BufferGeometry(), pos = new Float32Array(N * 3), a = new Float32Array(N), t = new Float32Array(N);
      for (let i = 0; i < N; i++) t[i] = 1 - i / N;
      g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("alfa", new THREE.BufferAttribute(a, 1)); g.setAttribute("tam", new THREE.BufferAttribute(t, 1));
      const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        vertexShader: "attribute float alfa,tam;varying float va;void main(){va=alfa;gl_PointSize=(1.+tam*tam*7.)*" + Math.min(2, devicePixelRatio).toFixed(1) + ";gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
        fragmentShader: "varying float va;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(1.,.93,.97,va*smoothstep(.5,.0,d));}" });
      const pts = new THREE.Points(g, m);
      // Cruza en diagonal por la parte de arriba de lo que se ve (detrás del globo), calculado para la pantalla que haya.
      const zc = -10, d = this.z - zc, hh = d * Math.tan(this.cam.fov * Math.PI / 360), hw = hh * this.cam.aspect, lado = Math.random() < .5 ? -1 : 1;
      const desde = new THREE.Vector3(lado * hw * 1.15, hh * (.45 + Math.random() * .45), zc), hacia = new THREE.Vector3(-lado * hw * (.1 + Math.random() * .7), hh * (-.15 + Math.random() * .4), zc);
      this.esc.add(pts); this.cometas.push({ pts, desde, hacia, v: 0, dur: 1.6 + Math.random() * .8 });
    }
    this.cometas = this.cometas.filter((c) => {
      c.v += dt; const k = c.v / c.dur;
      if (k > 1.3) { this.esc.remove(c.pts); c.pts.geometry.dispose(); c.pts.material.dispose(); return false; }
      const pos = c.pts.geometry.attributes.position.array, al = c.pts.geometry.attributes.alfa.array, N = al.length;
      for (let i = 0; i < N; i++) {
        const q = Math.max(0, Math.min(1, k - i * .009)), p = c.desde.clone().lerp(c.hacia, q);
        pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z;
        al[i] = (1 - i / N) * Math.min(1, (1.3 - k) * 3, k * 6);
      }
      c.pts.geometry.attributes.position.needsUpdate = c.pts.geometry.attributes.alfa.needsUpdate = true;
      return true;
    });
  }
  parar() {
    this.vivo = false; this.io.disconnect();
    this.esc.traverse((o) => { o.geometry?.dispose(); o.material?.map?.dispose?.(); o.material?.dispose?.(); });
    this.mat.uniforms.m.value.dispose(); this.r.dispose(); this.r.forceContextLoss?.(); this.r.domElement.remove();
  }
}
function dentro(x, y, r) {
  let si = false;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const [xi, yi] = r[i], [xj, yj] = r[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) si = !si;
  }
  return si;
}

// ---------- Nombres y banderitas ----------
const nombrePais = (iso, d, en) => d.paises[iso]?.nombre || COD?.[iso]?.[1] || en || "";
const banderita = (iso, w = 44, h = 33) => urlBandera(iso) ? `<img class="mu-flag" src="${urlBandera(iso)}" width="${w}" height="${h}" alt="">` : `<span class="mu-flag sin" style="width:${w}px;height:${h}px">♥</span>`;

// ---------- Portada (chiquito) ----------
let portada = null;
export async function montarPortada(caja, doc, alAbrir) {
  if (!caja) { portada?.parar(); portada = null; return; }
  const datos = lugaresDe(doc);
  const firma = JSON.stringify([...datos.fui, "|", ...datos.ir, datos.l.length, oscuro()]);
  if (portada && portada.caja === caja && portada.firma === firma) return;
  try { await cargar(); } catch (e) { caja.classList.add("sin-3d"); return; }
  if (!document.body.contains(caja)) return;
  portada?.parar();
  datos.lienzo = await textura(datos, oscuro());
  if (!document.body.contains(caja)) return;
  try { portada = new Globo(caja, datos); portada.firma = firma; } catch (e) { caja.classList.add("sin-3d"); portada = null; return; }
  caja.onclick = () => alAbrir?.();
}

// ---------- Abierto en grande ----------
let grande = null;
export async function abrir(doc, desde, extra = "") {
  await cargar();
  const datos = lugaresDe(doc);
  const capa = document.createElement("div");
  capa.className = "mu-capa " + (oscuro() ? "os" : "cl");
  const r = desde?.getBoundingClientRect?.();
  capa.style.setProperty("--cx", r ? r.left + r.width / 2 + "px" : "50%"); capa.style.setProperty("--cy", r ? r.top + r.height / 2 + "px" : "30%");
  const fuimos = Object.values(datos.paises).filter((p) => p.fuimos.length), quieren = datos.l.filter((x) => !x.hecho);
  const nCiud = datos.l.filter((x) => x.hecho).length;
  capa.innerHTML = `<div class="mu-top"><button class="mu-cerrar" aria-label="Cerrar">✕</button><b>Nuestro mundo</b><button class="mu-plano" aria-pressed="false">Planisferio</button></div>
    <div class="mu-escena"><div class="mu-info" hidden></div><p class="mu-ayuda">Un dedo gira · dos dedos inclinan y acercan · doble toque vuelve</p></div>
    <div class="mu-panel">
      <div class="mu-cnt"><div><b>${nCiud}</b><span>lugares en ${fuimos.length} ${fuimos.length === 1 ? "país" : "países"}</span></div><div><b>${quieren.length}</b><span>por conocer</span></div></div>
      ${extra}
      <h3>Desbloqueados</h3><div class="mu-paises">${fuimos.map((p) => `<button class="mu-pais" data-iso="${esc(p.iso)}">${banderita(p.iso, 26, 18)}<span><b>${esc(p.nombre)}</b><small>${p.fuimos.map((x) => esc(x.titulo)).join(", ")}</small></span></button>`).join("")}</div>
      <h3>Queremos ir</h3><div class="mu-paises">${quieren.map((x) => `<button class="mu-pais ir" data-iso="${esc(x.iso)}" data-la="${x.lat}" data-lo="${x.lon}"><span class="mu-lock" aria-hidden="true">🔒</span><span><b>${esc(x.titulo)}</b><small>${esc(datos.fui.has(x.iso) ? x.pais : "por desbloquear")}${x.nota ? " · " + esc(x.nota) : ""}</small></span></button>`).join("") || '<p class="vacio">Nada anotado todavía.</p>'}</div>
    </div>`;
  document.body.appendChild(capa); document.body.classList.add("mu-abierto");
  requestAnimationFrame(() => capa.classList.add("ver"));
  const escena = capa.querySelector(".mu-escena"), info = capa.querySelector(".mu-info");
  const mostrar = (iso, en) => {
    if (!iso) { info.hidden = true; return; }
    const p = datos.paises[iso], nom = nombrePais(iso, datos, en);
    const fue = datos.fui.has(iso);
    info.innerHTML = `${fue ? banderita(iso) : '<span class="mu-lock grande" aria-hidden="true">🔒</span>'}<div><b>${esc(nom)}</b><small>${fue ? "Fuimos a " + p.fuimos.map((x) => esc(x.titulo)).join(", ") : p?.ir.length ? "Por desbloquear · queremos ir" : "Todavía no fuimos"}</small>${fue && p.ir.length ? `<small>Nos falta: ${p.ir.map((x) => esc(x.titulo)).join(", ")}</small>` : ""}</div><button class="mu-x" aria-label="Cerrar">✕</button>`;
    info.hidden = false;
  };
  datos.lienzo = await textura(datos, oscuro());
  await new Promise((ok) => setTimeout(ok, 60));
  grande = new Globo(escena, datos, { grande: true, alTocarPais: (iso, en) => mostrar(iso, en) });
  const cerrar = () => {
    capa.classList.remove("ver"); document.body.classList.remove("mu-abierto");
    setTimeout(() => { grande?.parar(); grande = null; capa.remove(); }, quieto() ? 0 : 420);
    removeEventListener("keydown", tecla);
  };
  const tecla = (e) => { if (e.key === "Escape") cerrar(); };
  addEventListener("keydown", tecla);
  capa.addEventListener("click", (e) => {
    if (e.target.closest(".mu-cerrar")) cerrar();
    else if (e.target.closest(".mu-x")) info.hidden = true;
    else if (e.target.closest(".mu-plano")) { const b = e.target.closest(".mu-plano"); const si = b.getAttribute("aria-pressed") !== "true"; b.setAttribute("aria-pressed", String(si)); b.textContent = si ? "Globo" : "Planisferio"; grande.plano(si); }
    else if (e.target.closest(".mu-pais")) {
      const b = e.target.closest(".mu-pais"), iso = b.dataset.iso;
      const lugar = b.dataset.la ? { lat: Number(b.dataset.la), lon: Number(b.dataset.lo) } : datos.paises[iso]?.fuimos[0];
      if (lugar) grande.mirar(lugar.lat, lugar.lon);
      mostrar(iso); escena.scrollIntoView({ behavior: quieto() ? "auto" : "smooth", block: "start" });
    }
  });
  return cerrar;
}
