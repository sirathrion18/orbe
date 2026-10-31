// Ficha de Pedri: el modelo real con vistas, caras, ropa y ejercicios con guías.
import * as THREE from '../vendor/three/build/three.module.min.js';
import { OrbitControls } from '../vendor/three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from '../vendor/three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from '../vendor/three/addons/geometries/RoundedBoxGeometry.js';
import { cargarPedri, EJERCICIOS } from '../js/pedri-motor.js';

const stage = document.getElementById('stage');
const $ = (id) => document.getElementById(id);

const rd = new THREE.WebGLRenderer({ antialias: true });
rd.setPixelRatio(Math.min(devicePixelRatio, 2));
rd.shadowMap.enabled = true; rd.shadowMap.type = THREE.PCFSoftShadowMap;
rd.outputColorSpace = THREE.SRGBColorSpace; rd.toneMapping = THREE.ACESFilmicToneMapping; rd.toneMappingExposure = 1.0;
stage.prepend(rd.domElement);
const sc = new THREE.Scene(); sc.background = new THREE.Color(0x272c33);
sc.environment = new THREE.PMREMGenerator(rd).fromScene(new RoomEnvironment(), 0.04).texture;
const cam = new THREE.PerspectiveCamera(28, 1, 0.02, 50);
const ctl = new OrbitControls(cam, rd.domElement); ctl.enableDamping = true; ctl.enablePan = false; ctl.minDistance = 0.4; ctl.maxDistance = 6; ctl.maxPolarAngle = 1.62;
function tam() { const w = stage.clientWidth, h = stage.clientHeight; rd.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
new ResizeObserver(tam).observe(stage); tam();
sc.add(new THREE.HemisphereLight(0xe6ecff, 0x40372e, 0.5));
const key = new THREE.DirectionalLight(0xfff3e6, 2.2); key.position.set(1.4, 3.6, 3.0); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0002; key.shadow.normalBias = 0.02;
Object.assign(key.shadow.camera, { left: -1.3, right: 1.3, top: 2.3, bottom: -0.3 }); sc.add(key);
const fill = new THREE.DirectionalLight(0xdfe7ff, 0.6); fill.position.set(-3, 1.6, 2.2); sc.add(fill);
const rim = new THREE.DirectionalLight(0xc9d8ff, 1.3); rim.position.set(-1.5, 2.8, -3.2); sc.add(rim);
const piso = new THREE.Mesh(new THREE.CircleGeometry(4, 64), new THREE.MeshStandardMaterial({ color: 0x30353d, roughness: 0.95 })); piso.rotation.x = -Math.PI / 2; piso.receiveShadow = true; sc.add(piso);
const aro = new THREE.Mesh(new THREE.RingGeometry(0.86, 0.875, 96), new THREE.MeshBasicMaterial({ color: 0xe24b4a })); aro.rotation.x = -Math.PI / 2; aro.position.y = 0.002; sc.add(aro);

const cargando = document.createElement('div'); cargando.className = 'lab'; cargando.style.cssText = 'position:absolute;inset:auto 0 48%;text-align:center'; cargando.textContent = 'Cargando a Pedri…'; stage.append(cargando);
const P = await cargarPedri(); sc.add(P.raiz); cargando.remove();

// mancuerna y cajón
const S = (c, r = 0.6, x = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: r }, x));
const db = new THREE.Group(); sc.add(db);
db.add(new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.22, 14), S('#b5b5ae', 0.25, { metalness: 0.8 })));
[0.11, -0.11].forEach((y) => { const pl = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.05, 6), S('#2c2c2e', 0.6)); pl.position.y = y; pl.castShadow = true; db.add(pl); });
const caja = new THREE.Mesh(new RoundedBoxGeometry(0.44, 0.42, 0.34, 3, 0.015), S('#8a6136', 0.7)); caja.castShadow = caja.receiveShadow = true; sc.add(caja);
const cad0 = P.wpos('Hips'); caja.position.set(0, 0.21, cad0.z - 0.36);

// guías: recorrido de la cadera (rojo) y tope de la rodilla (verde, sobre la punta del pie)
const N = 80, tp = new Float32Array(N * 3), tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.BufferAttribute(tp, 3));
const trazo = new THREE.Line(tg, new THREE.LineBasicMaterial({ color: 0xe24b4a })); sc.add(trazo); let tn = 0;
const tope = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0.01, 0), new THREE.Vector3(0, 0.8, 0)]), new THREE.LineDashedMaterial({ color: 0x5aa32f, dashSize: 0.03, gapSize: 0.02 })); tope.computeLineDistances(); sc.add(tope);
const punta = P.wpos('LeftToe_End'); tope.position.set(punta.x + 0.06, 0, punta.z);
// papelitos del festejo
const conf = []; const cmat = ['#e24b4a', '#2f6b1f', '#f0c040', '#f4f2ec'].map((c) => S(c, 0.5));
for (let i = 0; i < 50; i++) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.035, 0.006), cmat[i % 4]); c.visible = false; sc.add(c); conf.push({ c, v: new THREE.Vector3() }); }
const lanzar = () => conf.forEach((o) => { o.c.visible = true; o.c.position.set(0, 1.9, 0); o.v.set((Math.random() - 0.5) * 2.6, Math.random() * 2 + 1, (Math.random() - 0.5) * 2.6); });

// ---------- estado ----------
let modo = 'posar', cara = 'neutra', vel = 1, tc = 0, reps = 0, ci = 0, camDest = null, accion = null;
const VISTAS = { tres: [2.4, 0.15, 3.3], frente: [0.001, 0.1, 4.3], perfil: [4.3, 0.1, 0.001], espalda: [0.001, 0.1, -4.3], cara: [0.12, 0.02, 0.62] };
function irVista(v) { const [x, y, z] = VISTAS[v]; const ty = v === 'cara' ? P.wpos('Head').y + 0.06 : 0.9; ctl.target.set(0, ty, 0); camDest = new THREE.Vector3(x, ty + y, z); }
function marcar(g, v) { document.querySelectorAll(`[data-grupo="${g}"] button`).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === v))); }
function clip(nombre) {
  const a = P.clips[nombre]; if (!a || accion === a) return;
  a.reset().setEffectiveWeight(1).play(); if (accion) accion.crossFadeTo(a, 0.35, false); accion = a;
}
function elegir(m) {
  modo = m; tc = 0; reps = 0; tn = 0; ci = 0;
  const E = EJERCICIOS[m];
  $('h-n').textContent = E ? E.nombre : m === 'fes' ? '¡Logro desbloqueado!' : m === 'saludo' ? 'Saludando' : 'Posando';
  $('h-f').textContent = E ? '' : m === 'fes' ? '¡Nivel 3!' : 'Listo para entrenar';
  $('h-c').textContent = E ? E.claves[0] : '';
  $('reps').hidden = !E; $('leyenda').hidden = !E; $('h-r').textContent = '0 / 12';
  caja.visible = !!E?.caja; trazo.visible = tope.visible = !!E;
  if (E) { if (accion) { accion.stop(); accion = null; } P.mixer.stopAllAction(); }
  else { clip(m === 'fes' ? 'Cheer' : m === 'saludo' ? 'Wave' : 'Idle'); if (m === 'fes') lanzar(); }
  const vp = document.querySelector('[data-grupo="vista"] [aria-pressed="true"]').dataset.v; const v = E && vp !== 'cara' ? 'perfil' : vp; irVista(v); marcar('vista', v);
}
document.querySelectorAll('.seg').forEach((seg) => seg.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; const g = seg.dataset.grupo, v = b.dataset.v; marcar(g, v);
  if (g === 'modo') elegir(v); else if (g === 'vista') irVista(v); else if (g === 'ropa') P.ropa(v); else if (g === 'vel') vel = Number(v); else if (g === 'cara') cara = v; }));
ctl.addEventListener('start', () => { camDest = null; });
cam.position.set(2.4, 1.05, 3.3); ctl.target.set(0, 0.9, 0); ctl.update();
elegir('posar');
{ const q = new URLSearchParams(location.search); ['ropa', 'cara', 'modo', 'vista'].forEach((g) => { const v = q.get(g); const b = v && document.querySelector(`[data-grupo="${g}"] [data-v="${v}"]`); if (b) b.click(); });
  if (camDest) { cam.position.copy(camDest); camDest = null; ctl.update(); }
  // ?t=2.4 congela el ejercicio en ese segundo (para revisar una fase)
  if (q.get('t')) { tc = Number(q.get('t')); vel = 0; } }

function popXP() { const x = $('xp'); x.style.transition = 'none'; x.style.opacity = '1'; x.style.transform = 'translateY(0)'; void x.offsetWidth; x.style.transition = 'opacity 1s, transform 1s'; x.style.opacity = '0'; x.style.transform = 'translateY(-16px)'; }
const w1 = new THREE.Vector3(), w2 = new THREE.Vector3(), clk = new THREE.Clock();
function loop() {
  const dt = Math.min(0.2, clk.getDelta()), E = EJERCICIOS[modo];
  if (E) {
    tc += dt * vel;
    if (tc >= E.dur) { tc -= E.dur; reps = reps >= 12 ? 1 : reps + 1; $('h-r').textContent = reps + ' / 12'; popXP(); ci = (ci + 1) % E.claves.length; $('h-c').textContent = E.claves[ci]; tn = 0; }
    const pose = E.pose(tc); $('h-f').textContent = pose.fase;
    const c = P.posar(pose);
    if (tn < N) { tp.set([0.3, c.y, c.z], tn * 3); tn++; } else { tp.copyWithin(0, 3); tp.set([0.3, c.y, c.z], (N - 1) * 3); }
    tg.setDrawRange(0, tn); tg.attributes.position.needsUpdate = true;
    db.visible = pose.brazos === 'copa';
    if (db.visible) { P.hueso('LeftHand').getWorldPosition(w1); P.hueso('RightHand').getWorldPosition(w2); w1.add(w2).multiplyScalar(0.5); db.position.set(w1.x, w1.y + 0.02, w1.z + 0.03); db.rotation.set(pose.incl * 0.4, 0, 0); }
    P.cara(E.cara, dt);
  } else {
    P.mixer.update(dt * vel); db.visible = false;
    P.cara(modo === 'fes' ? 'festejo' : cara, dt);
  }
  conf.forEach((o) => { if (!o.c.visible) return; o.v.y -= 6 * dt; o.c.position.addScaledVector(o.v, dt); o.c.rotation.x += dt * 8; o.c.rotation.y += dt * 6; if (o.c.position.y < 0) o.c.visible = false; });
  if (camDest) { cam.position.lerp(camDest, 0.08); if (cam.position.distanceTo(camDest) < 0.01) camDest = null; }
  ctl.update(); rd.render(sc, cam); requestAnimationFrame(loop);
}
loop();
