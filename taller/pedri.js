// Pedri sobre el cuerpo base de MakeHuman (CC0): malla con esqueleto, ropa y rulos propios.
import * as THREE from '../vendor/three/three.module.js';
import { OrbitControls } from '../vendor/three/OrbitControls.js';
import { RoomEnvironment } from '../vendor/three/RoomEnvironment.js';
import { RoundedBoxGeometry } from '../vendor/three/RoundedBoxGeometry.js';

const stage = document.getElementById('stage');
const $ = (id) => document.getElementById(id);
const D = await fetch('pedri.json?v=4').then((r) => r.json());
const dec = (s, T) => { const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return new T(u.buffer); };

// ---------- Escena ----------
const rd = new THREE.WebGLRenderer({ antialias: true });
rd.setPixelRatio(Math.min(devicePixelRatio, 2));
rd.shadowMap.enabled = true; rd.shadowMap.type = THREE.PCFSoftShadowMap;
rd.outputColorSpace = THREE.SRGBColorSpace; rd.toneMapping = THREE.ACESFilmicToneMapping; rd.toneMappingExposure = 1.0;
stage.prepend(rd.domElement);
const sc = new THREE.Scene(); sc.background = new THREE.Color(0x1b1e24);
const pm = new THREE.PMREMGenerator(rd); sc.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
const cam = new THREE.PerspectiveCamera(30, 1, 0.02, 50);
const ctl = new OrbitControls(cam, rd.domElement); ctl.enableDamping = true; ctl.enablePan = false; ctl.minDistance = 0.5; ctl.maxDistance = 6; ctl.maxPolarAngle = 1.62;
function tam() { const w = stage.clientWidth, h = stage.clientHeight; rd.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
new ResizeObserver(tam).observe(stage); tam();
sc.add(new THREE.HemisphereLight(0xdfe6ff, 0x3a3128, 0.35));
const key = new THREE.DirectionalLight(0xfff1e2, 2.0); key.position.set(2.2, 4.2, 3.0); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0003; key.shadow.normalBias = 0.015;
Object.assign(key.shadow.camera, { left: -1.4, right: 1.4, top: 2.4, bottom: -0.3 }); sc.add(key);
const rim = new THREE.DirectionalLight(0xbfd3ff, 1.1); rim.position.set(-2.5, 2.6, -3); sc.add(rim);
const floor = new THREE.Mesh(new THREE.CircleGeometry(4, 64), new THREE.MeshStandardMaterial({ color: 0x22252b, roughness: 0.95 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; sc.add(floor);
const ringF = new THREE.Mesh(new THREE.RingGeometry(0.86, 0.88, 96), new THREE.MeshBasicMaterial({ color: 0xe24b4a })); ringF.rotation.x = -Math.PI / 2; ringF.position.y = 0.002; sc.add(ringF);

const S = (c, r = 0.6, extra = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: r, envMapIntensity: 0.6 }, extra));
const skinM = S('#ffffff', 0.5, { vertexColors: true });
const topM = new THREE.MeshPhysicalMaterial({ color: '#2f6b1f', roughness: 0.42, sheen: 0.4, sheenRoughness: 0.5, sheenColor: new THREE.Color('#9fd07a'), envMapIntensity: 0.6 });
const panM = S('#1c1c1e', 0.85), teeM = S('#3b8a14', 0.8), shoM = S('#1c1c1e', 0.8), shoeM = S('#ffffff', 0.45, { vertexColors: true });
const hairM = S('#3d2618', 0.8);

// ---------- Esqueleto ----------
const avatar = new THREE.Group(); avatar.position.y = -D.floor; sc.add(avatar);
const B = D.bones.map((n) => { const b = new THREE.Bone(); b.name = n; return b; });
const idx = Object.fromEntries(D.bones.map((n, i) => [n, i]));
const H = D.heads.map((h) => new THREE.Vector3(...h));
B.forEach((b, i) => { const p = D.parents[i]; if (p < 0) { b.position.copy(H[i]); avatar.add(b); } else { b.position.copy(H[i]).sub(H[p]); B[p].add(b); } });
avatar.updateMatrixWorld(true);
const skel = new THREE.Skeleton(B);
const bone = (n) => B[idx[n]];
const restW = (n) => H[idx[n]].clone().add(avatar.position); // posición de reposo en el mundo

function malla(m, mat) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(dec(m.pos, Float32Array), 3));
  g.setIndex(new THREE.BufferAttribute(dec(m.idx, Uint32Array), 1));
  g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(dec(m.si, Uint16Array), 4));
  g.setAttribute('skinWeight', new THREE.BufferAttribute(dec(m.sw, Float32Array), 4));
  if (m.col) { const c = dec(m.col, Float32Array); for (let i = 0; i < c.length; i++) c[i] = Math.pow(c[i], 2.2); g.setAttribute('color', new THREE.BufferAttribute(c, 3)); }
  g.computeVertexNormals();
  const o = new THREE.SkinnedMesh(g, mat); o.castShadow = o.receiveShadow = true; o.frustumCulled = false;
  avatar.add(o); o.bind(skel); return o;
}
const cuerpo = malla(D.body, skinM), campera = malla(D.top, topM), jogging = malla(D.pants, panM), remera = malla(D.tee, teeM), short = malla(D.shorts, shoM), zapas = malla(D.shoes, shoeM);

// ---------- Ojos y rulos (van pegados al hueso de la cabeza) ----------
const cabeza = bone('head'), hR = H[idx.head];
const irisTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 8, 64, 64, 64); g.addColorStop(0, '#2a180c'); g.addColorStop(0.4, '#6b4526'); g.addColorStop(0.85, '#3f2714'); g.addColorStop(1, '#140c06');
  x.fillStyle = g; x.beginPath(); x.arc(64, 64, 63, 0, Math.PI * 2); x.fill();
  x.strokeStyle = 'rgba(170,120,70,.35)'; x.lineWidth = 1.4; for (let a = 0; a < 56; a++) { const t = a / 56 * Math.PI * 2; x.beginPath(); x.moveTo(64 + Math.cos(t) * 24, 64 + Math.sin(t) * 24); x.lineTo(64 + Math.cos(t) * 56, 64 + Math.sin(t) * 56); x.stroke(); }
  x.fillStyle = '#060403'; x.beginPath(); x.arc(64, 64, 24, 0, Math.PI * 2); x.fill();
  x.fillStyle = 'rgba(255,255,255,.9)'; x.beginPath(); x.arc(50, 48, 7, 0, Math.PI * 2); x.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
D.eyes.forEach((e) => {
  const g = new THREE.Group(); g.position.set(e[0] - hR.x, e[1] - hR.y, e[2] - hR.z); cabeza.add(g);
  g.add(new THREE.Mesh(new THREE.SphereGeometry(0.0118, 32, 24), S('#f3efe8', 0.3)));
  const ir = new THREE.Mesh(new THREE.CircleGeometry(0.0056, 40), new THREE.MeshStandardMaterial({ map: irisTex, roughness: 0.2 })); ir.position.z = 0.0116; g.add(ir);
  g.add(new THREE.Mesh(new THREE.SphereGeometry(0.0121, 32, 24), new THREE.MeshPhysicalMaterial({ transparent: true, opacity: 0.1, roughness: 0.02, clearcoat: 1 })));
});
{
  const sp = dec(D.scalp.pos, Float32Array), sn = dec(D.scalp.nor, Float32Array), n = D.scalp.n;
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const per = 4, bolas = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), hairM, n * per), rul = new THREE.InstancedMesh(new THREE.TorusGeometry(1, 0.38, 8, 16), hairM, n * 2);
  bolas.castShadow = rul.castShadow = true;
  const tonos = ['#5a3a22', '#6b4529', '#4a2f1d', '#7a5232'].map((c) => new THREE.Color(c));
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), nn = new THREE.Vector3(), s3 = new THREE.Vector3();
  let k = 0, r = 0;
  for (let i = 0; i < n; i++) {
    nn.set(sn[i * 3], sn[i * 3 + 1], sn[i * 3 + 2]);
    for (let j = 0; j < per; j++) {
      p.set(sp[i * 3] - hR.x + (rnd() - 0.5) * 0.012, sp[i * 3 + 1] - hR.y + (rnd() - 0.5) * 0.012, sp[i * 3 + 2] - hR.z + (rnd() - 0.5) * 0.012).addScaledVector(nn, 0.006 + rnd() * 0.01);
      const s = 0.0075 + rnd() * 0.005; e.set(rnd() * 3, rnd() * 3, rnd() * 3); q.setFromEuler(e); m4.compose(p, q, s3.set(s, s * 0.85, s)); bolas.setMatrixAt(k, m4); bolas.setColorAt(k, tonos[k % 4]); k++;
    }
    for (let j = 0; j < 2; j++) {
      p.set(sp[i * 3] - hR.x, sp[i * 3 + 1] - hR.y, sp[i * 3 + 2] - hR.z).addScaledVector(nn, 0.013 + rnd() * 0.008);
      const s = 0.006 + rnd() * 0.003; e.set(rnd() * 6, rnd() * 6, rnd() * 6); q.setFromEuler(e); m4.compose(p, q, s3.set(s, s, s)); rul.setMatrixAt(r, m4); rul.setColorAt(r, tonos[(r + 1) % 4]); r++;
    }
  }
  cabeza.add(bolas, rul);
}
// Pulsera en la muñeca izquierda.
const pulsera = new THREE.Group(); bone('wrist.L').add(pulsera);
{ const t = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.0045, 10, 32), S('#141414', 0.5)); pulsera.add(t); const d = new THREE.Mesh(new THREE.SphereGeometry(0.0065, 12, 10), S('#e24b4a', 0.35)); d.position.set(0, 0.0, 0.032); pulsera.add(d); }

// Mancuerna y cajón.
const db = new THREE.Group(); sc.add(db);
db.add(new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.24, 14), S('#b5b5ae', 0.25, { metalness: 0.8 })));
[0.12, -0.12].forEach((y) => { const pl = new THREE.Mesh(new THREE.CylinderGeometry(0.066, 0.066, 0.055, 6), S('#2c2c2e', 0.6)); pl.position.y = y; pl.castShadow = true; db.add(pl); });
const caja = new THREE.Mesh(new RoundedBoxGeometry(0.44, 0.42, 0.34, 3, 0.015), S('#8a6136', 0.7)); caja.castShadow = caja.receiveShadow = true; sc.add(caja);

// ---------- Poses ----------
const tmpQ = new THREE.Quaternion(), tmpV = new THREE.Vector3();
function apuntar(b, restDir, dir) { b.parent.getWorldQuaternion(tmpQ); const w = new THREE.Quaternion().setFromUnitVectors(restDir.clone().normalize(), dir.clone().normalize()); b.quaternion.copy(tmpQ.invert().multiply(w)); b.updateMatrixWorld(true); }
function mundoQ(b, q) { b.parent.getWorldQuaternion(tmpQ); b.quaternion.copy(tmpQ.invert().multiply(q)); b.updateMatrixWorld(true); }
const posW = (n) => bone(n).getWorldPosition(new THREE.Vector3());
const LEG = ['L', 'R'].map((s) => ({ s, up: bone('upperleg01.' + s), lo: bone('lowerleg01.' + s), ft: bone('foot.' + s),
  dU: H[idx['lowerleg01.' + s]].clone().sub(H[idx['upperleg01.' + s]]), dL: H[idx['foot.' + s]].clone().sub(H[idx['lowerleg01.' + s]]),
  L1: H[idx['lowerleg01.' + s]].distanceTo(H[idx['upperleg01.' + s]]), L2: H[idx['foot.' + s]].distanceTo(H[idx['lowerleg01.' + s]]), ankle: restW('foot.' + s) }));
const ARMS = ['L', 'R'].map((s) => ({ s, sg: s === 'L' ? 1 : -1, up: bone('upperarm01.' + s), lo: bone('lowerarm01.' + s),
  dU: H[idx['lowerarm01.' + s]].clone().sub(H[idx['upperarm01.' + s]]), dL: H[idx['wrist.' + s]].clone().sub(H[idx['lowerarm01.' + s]]) }));
const hipRest = restW('upperleg01.L').add(restW('upperleg01.R')).multiplyScalar(0.5);
const raiz = bone('root'), raizRest = raiz.position.clone();
function ik2(P, T, L1, L2, pole) {
  const d = Math.min(P.distanceTo(T), (L1 + L2) * 0.9995), dir = T.clone().sub(P).normalize();
  const a = (L1 * L1 - L2 * L2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
  const pp = pole.clone().sub(dir.clone().multiplyScalar(pole.dot(dir))).normalize();
  return P.clone().addScaledVector(dir, a).addScaledVector(pp, h);
}
const BRAZO = { // direcciones en el marco del torso: x = hacia afuera, y = arriba, z = adelante
  abajo: { u: [0.14, -1, 0.02], f: [0.06, -1, 0.12] }, copa: { u: [0.22, -0.72, 0.55], f: [-0.6, 0.6, 0.45] },
  cintura: { u: [0.55, -0.8, -0.18], f: [-0.5, -0.35, 0.6] }, arriba: { u: [0.4, 1, 0.08], f: [0.18, 1, 0] } };
const POLE = new THREE.Vector3(0, 0, 1);
function posar(P) {
  B.forEach((b) => b.quaternion.identity());
  raiz.position.copy(raizRest).add(new THREE.Vector3(0, P.hip[1] - hipRest.y, P.hip[0] - hipRest.z));
  const spine = bone('spine05'); spine.rotation.x = P.lean; spine.updateMatrixWorld(true);
  bone('neck01').rotation.x = -P.lean * 0.45;
  avatar.updateMatrixWorld(true);
  LEG.forEach((L, i) => {
    const a = P.ank[i]; const hip = L.up.getWorldPosition(new THREE.Vector3());
    const T = new THREE.Vector3(L.ankle.x * 0.75, a[1], L.ankle.z + a[0]);
    const knee = ik2(hip, T, L.L1, L.L2, POLE.clone().add(new THREE.Vector3(L.ankle.x * 0.6, 0, 0)));
    apuntar(L.up, L.dU, knee.clone().sub(hip)); apuntar(L.lo, L.dL, T.clone().sub(knee));
    mundoQ(L.ft, new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), a[2] || 0));
  });
  const tq = spine.getWorldQuaternion(new THREE.Quaternion()), A = BRAZO[P.arm];
  ARMS.forEach((R) => {
    const u = new THREE.Vector3(A.u[0] * R.sg, A.u[1], A.u[2]).applyQuaternion(tq), f = new THREE.Vector3(A.f[0] * R.sg, A.f[1], A.f[2]).applyQuaternion(tq);
    apuntar(R.up, R.dU, u); apuntar(R.lo, R.dL, f);
  });
  bone('jaw').rotation.x = P.boca || 0;
}

// ---------- Movimientos ----------
const ease = (x) => x < 0 ? 0 : x > 1 ? 1 : (1 - Math.cos(x * Math.PI)) / 2;
const AY = LEG[0].ankle.y, HY = hipRest.y, HZ = hipRest.z;
const EJ = {
  posar: { nombre: 'Posando', dur: 4, pose(t) { const b = Math.sin(t / 4 * Math.PI * 2); return { hip: [HZ, HY - 0.012 + 0.003 * b], lean: 0.02, ank: [[0, AY], [0, AY]], arm: 'abajo', f: 'Listo para entrenar' }; } },
  sen: { nombre: 'Sentadilla al cajón', dur: 3.6, toe: true, cues: ['Pecho arriba', 'La mancuerna pegada al pecho', 'Rodillas hacia afuera, sobre el pie', 'Rozá el cajón, no te sientes'],
    pose(t) { let s, f; if (t < 0.4) { s = 0; f = 'Arriba'; } else if (t < 2.4) { s = ease((t - 0.4) / 2); f = 'Bajá · 2 s'; } else if (t < 2.6) { s = 1; f = 'Rozá el cajón'; } else { s = 1 - ease((t - 2.6) / 1); f = 'Subí · 1 s'; }
      return { hip: [HZ - 0.2 * s, HY - 0.012 - 0.37 * s], lean: 0.05 + 0.5 * s, ank: [[0, AY], [0, AY]], arm: 'copa', f }; } },
  est: { nombre: 'Estocada hacia atrás', dur: 4.6, toe: true, cues: ['Torso derecho', 'Bajá derecho, como un ascensor', 'Rodilla de adelante sobre el pie', 'La de atrás casi toca el piso'],
    pose(t) { let k = 0, d = 0, f; if (t < 0.7) { k = ease(t / 0.7); f = 'Paso atrás'; } else if (t < 2.7) { k = 1; d = ease((t - 0.7) / 2); f = 'Bajá · 2 s'; } else if (t < 2.9) { k = 1; d = 1; f = 'Abajo'; } else if (t < 3.9) { k = 1; d = 1 - ease((t - 2.9) / 1); f = 'Subí · 1 s'; } else { k = 1 - ease((t - 3.9) / 0.7); f = 'Volvé'; }
      return { hip: [HZ - 0.2 * k, HY - 0.012 - 0.05 * k - 0.3 * d], lean: 0.04, ank: [[0, AY], [-0.64 * k, AY + 0.06 * k + 0.04 * d, 0.95 * k]], arm: 'cintura', f }; } },
  fes: { nombre: '¡Logro desbloqueado!', dur: 1.4, pose(t) { const cr = t < 0.3 ? Math.sin(t / 0.3 * Math.PI) * 0.6 : 0; const j = t >= 0.3 && t < 1.0 ? Math.sin((t - 0.3) / 0.7 * Math.PI) * 0.3 : 0;
      return { hip: [HZ, HY - 0.012 - 0.16 * cr + j], lean: 0.04 + 0.2 * cr, ank: [[0, AY + j * 0.85], [0, AY + j * 0.85]], arm: j > 0 ? 'arriba' : 'abajo', jump: j, boca: j > 0 ? 0.18 : 0, f: j > 0 ? '¡Nivel 3!' : 'Preparado' }; } },
};

// ---------- Guías y papelitos ----------
const N = 80, tp = new Float32Array(N * 3), tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.BufferAttribute(tp, 3));
const trail = new THREE.Line(tg, new THREE.LineBasicMaterial({ color: 0xe24b4a })); sc.add(trail); let tn = 0;
const kg = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0.01, 0), new THREE.Vector3(0, 0.8, 0)]), new THREE.LineDashedMaterial({ color: 0x5aa32f, dashSize: 0.03, gapSize: 0.02 })); kg.computeLineDistances(); sc.add(kg);
const conf = []; const cmat = ['#e24b4a', '#2f6b1f', '#f0c040', '#f4f2ec'].map((c) => S(c, 0.5));
for (let i = 0; i < 50; i++) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.035, 0.006), cmat[i % 4]); c.visible = false; sc.add(c); conf.push({ c, v: new THREE.Vector3() }); }
let seedC = 5; const rndC = () => (seedC = (seedC * 16807) % 2147483647) / 2147483647;
const lanzar = () => conf.forEach((o) => { o.c.visible = true; o.c.position.set(0, 1.8, 0); o.v.set((rndC() - 0.5) * 2.6, rndC() * 2 + 1, (rndC() - 0.5) * 2.6); });

// ---------- Ropa ----------
const ROPAS = { calle: { top: '#2f6b1f', pan: '#1c1c1e' }, gym: { top: '#2f6b1f', pan: '#1c1c1e' }, traje: { top: '#36363b', pan: '#2c2c31' } };
let ropa = 'calle';
function vestir() { const R = ROPAS[ropa]; topM.color.set(R.top); panM.color.set(R.pan); topM.sheenColor.set(ropa === 'traje' ? '#7ab55a' : '#9fd07a');
  campera.visible = jogging.visible = ropa !== 'gym'; remera.visible = short.visible = ropa === 'gym'; }
vestir();

// ---------- Cámara y controles ----------
const VISTAS = { tres: [2.1, 0.3, 2.1], frente: [0.001, 0.25, 3.2], perfil: [3.2, 0.25, 0.001], espalda: [0.001, 0.25, -3.2], cara: [0.18, 0.02, 0.62] };
let camDest = null, modo = 'posar', vel = 1, tc = 0, reps = 0, lanz = false, ci = 0;
function irVista(v) { const [x, y, z] = VISTAS[v]; const ty = v === 'cara' ? 1.6 : modo === 'posar' ? 0.95 : 0.72; ctl.target.set(0, ty, 0); camDest = new THREE.Vector3(x, ty + y, z); }
cam.position.set(2.1, 1.25, 2.1); ctl.target.set(0, 0.95, 0); ctl.update();
function marcar(g, v) { document.querySelectorAll(`[data-grupo="${g}"] button`).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === v))); }
function elegir(m) { modo = m; tc = 0; reps = 0; tn = 0; ci = 0; const E = EJ[m]; $('h-n').textContent = E.nombre; $('h-c').textContent = E.cues ? E.cues[0] : '';
  $('reps').hidden = !E.cues; $('leyenda').hidden = !E.toe; $('h-r').textContent = '0 / 12'; caja.visible = m === 'sen';
  const vp = document.querySelector('[data-grupo="vista"] [aria-pressed="true"]').dataset.v; const v = m === 'posar' ? vp : 'perfil'; irVista(v); marcar('vista', v); }
document.querySelectorAll('.seg').forEach((seg) => seg.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; const g = seg.dataset.grupo, v = b.dataset.v; marcar(g, v);
  if (g === 'modo') elegir(v); else if (g === 'vista') irVista(v); else if (g === 'ropa') { ropa = v; vestir(); } else if (g === 'vel') vel = Number(v); }));
ctl.addEventListener('start', () => { camDest = null; });
elegir('posar');
const toeZ = LEG[0].ankle.z + 0.17;
caja.position.set(0, 0.21, HZ - 0.47);

function popXP() { const x = $('xp'); x.style.transition = 'none'; x.style.opacity = '1'; x.style.transform = 'translateY(0)'; void x.offsetWidth; x.style.transition = 'opacity 1s, transform 1s'; x.style.opacity = '0'; x.style.transform = 'translateY(-16px)'; }
const w1 = new THREE.Vector3(), w2 = new THREE.Vector3(), clk = new THREE.Clock(); let prev = 0;
function loop() {
  const now = clk.getElapsedTime(), dt = Math.min(0.05, now - prev); prev = now;
  const E = EJ[modo]; tc += dt * vel;
  if (tc >= E.dur) { tc -= E.dur; if (E.cues) { reps = reps >= 12 ? 1 : reps + 1; $('h-r').textContent = reps + ' / 12'; popXP(); ci = (ci + 1) % E.cues.length; $('h-c').textContent = E.cues[ci]; } tn = 0; }
  const P = E.pose(tc); $('h-f').textContent = P.f;
  if (modo === 'fes') { if (P.jump > 0.25 && !lanz) { lanzar(); lanz = true; } if (!P.jump) lanz = false; }
  posar(P);
  db.visible = P.arm === 'copa';
  if (db.visible) { posW('wrist.L').add(posW('wrist.R')).multiplyScalar(0.5); bone('wrist.L').getWorldPosition(w1); bone('wrist.R').getWorldPosition(w2); w1.add(w2).multiplyScalar(0.5); db.position.set(w1.x, w1.y + 0.02, w1.z + 0.05); db.rotation.set(P.lean, 0, 0); }
  kg.visible = !!E.toe; kg.position.set(0.12, 0, toeZ);
  trail.visible = !!E.cues; const hz = P.hip[0], hy = P.hip[1];
  if (tn < N) { tp.set([0.25, hy, hz], tn * 3); tn++; } else { tp.copyWithin(0, 3); tp.set([0.25, hy, hz], (N - 1) * 3); }
  tg.setDrawRange(0, tn); tg.attributes.position.needsUpdate = true;
  conf.forEach((o) => { if (!o.c.visible) return; o.v.y -= 6 * dt; o.c.position.addScaledVector(o.v, dt); o.c.rotation.x += dt * 8; o.c.rotation.y += dt * 6; if (o.c.position.y < 0) o.c.visible = false; });
  if (camDest) { cam.position.lerp(camDest, 0.08); if (cam.position.distanceTo(camDest) < 0.01) camDest = null; }
  ctl.update(); rd.render(sc, cam); requestAnimationFrame(loop);
}
loop();
