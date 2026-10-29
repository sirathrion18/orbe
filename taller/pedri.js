// Pedri v2 sobre el cuerpo base de MakeHuman (CC0): piel texturada, expresiones, pelo por capas y ropa.
import * as THREE from '../vendor/three/three.module.js';
import { OrbitControls } from '../vendor/three/OrbitControls.js';
import { RoomEnvironment } from '../vendor/three/RoomEnvironment.js';
import { RoundedBoxGeometry } from '../vendor/three/RoundedBoxGeometry.js';

const stage = document.getElementById('stage');
const $ = (id) => document.getElementById(id);
const V = '?v=26';
const D = await fetch('pedri2.json' + V).then((r) => r.json());
const dec = (s, T) => { const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return new T(u.buffer); };
const carga = new THREE.TextureLoader();

// ---------- Escena ----------
const rd = new THREE.WebGLRenderer({ antialias: true });
rd.setPixelRatio(Math.min(devicePixelRatio, 2));
rd.shadowMap.enabled = true; rd.shadowMap.type = THREE.PCFSoftShadowMap;
rd.outputColorSpace = THREE.SRGBColorSpace; rd.toneMapping = THREE.ACESFilmicToneMapping; rd.toneMappingExposure = 1.05;
stage.prepend(rd.domElement);
const sc = new THREE.Scene(); sc.background = new THREE.Color(0x272c33);
const pm = new THREE.PMREMGenerator(rd); sc.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
const cam = new THREE.PerspectiveCamera(28, 1, 0.02, 50);
const ctl = new OrbitControls(cam, rd.domElement); ctl.enableDamping = true; ctl.enablePan = false; ctl.minDistance = 0.45; ctl.maxDistance = 6; ctl.maxPolarAngle = 1.62;
function tam() { const w = stage.clientWidth, h = stage.clientHeight; rd.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
new ResizeObserver(tam).observe(stage); tam();
sc.add(new THREE.HemisphereLight(0xe6ecff, 0x40372e, 0.45));
const key = new THREE.DirectionalLight(0xfff3e6, 2.1); key.position.set(1.6, 3.6, 3.2); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0002; key.shadow.normalBias = 0.012; key.shadow.radius = 4;
Object.assign(key.shadow.camera, { left: -1.3, right: 1.3, top: 2.3, bottom: -0.3 }); sc.add(key);
const fill = new THREE.DirectionalLight(0xdfe7ff, 0.55); fill.position.set(-3, 1.6, 2.2); sc.add(fill);
const rim = new THREE.DirectionalLight(0xc9d8ff, 1.2); rim.position.set(-1.5, 2.8, -3.2); sc.add(rim);
const floor = new THREE.Mesh(new THREE.CircleGeometry(4, 64), new THREE.MeshStandardMaterial({ color: 0x30353d, roughness: 0.95 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; sc.add(floor);
const ringF = new THREE.Mesh(new THREE.RingGeometry(0.86, 0.875, 96), new THREE.MeshBasicMaterial({ color: 0xe24b4a })); ringF.rotation.x = -Math.PI / 2; ringF.position.y = 0.002; sc.add(ringF);

const S = (c, r = 0.6, extra = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: r, envMapIntensity: 0.55 }, extra));
const pielTex = carga.load('pedri2-piel.jpg' + V); pielTex.colorSpace = THREE.SRGBColorSpace; pielTex.anisotropy = 8;
const skinM = new THREE.MeshPhysicalMaterial({ map: pielTex, roughness: 0.52, sheen: 0.35, sheenRoughness: 0.6, sheenColor: new THREE.Color('#ffb59a'), envMapIntensity: 0.45 });
const denim = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'); x.fillStyle = '#34507e'; x.fillRect(0, 0, 256, 256);
  for (let i = -256; i < 512; i += 3) { x.strokeStyle = i % 2 ? 'rgba(160,185,220,.18)' : 'rgba(10,20,40,.22)'; x.lineWidth = 1.2; x.beginPath(); x.moveTo(i, 0); x.lineTo(i + 256, 256); x.stroke(); }
  for (let k = 0; k < 2500; k++) { x.fillStyle = `rgba(${200 + Math.random() * 55},${210 + Math.random() * 45},255,${Math.random() * 0.08})`; x.fillRect(Math.random() * 256, Math.random() * 256, 2, 1); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(14, 14); return t; })();
const hoodM = new THREE.MeshPhysicalMaterial({ color: '#ffffff', vertexColors: true, roughness: 0.85, sheen: 0.6, sheenRoughness: 0.8, sheenColor: new THREE.Color('#6a6a72'), envMapIntensity: 0.4 });
const trajeM = new THREE.MeshPhysicalMaterial({ color: '#3a3a3f', roughness: 0.4, sheen: 0.4, sheenColor: new THREE.Color('#8fd06a'), envMapIntensity: 0.6 });
const teeM = S('#ecebe7', 0.9), jeanM = S('#ffffff', 0.85, { map: denim }), shoM = S('#1c1c1e', 0.8), shoeM = S('#ffffff', 0.55, { vertexColors: true });

// ---------- Esqueleto ----------
const avatar = new THREE.Group(); avatar.position.y = -D.floor; sc.add(avatar);
const B = D.bones.map((n) => { const b = new THREE.Bone(); b.name = n; return b; });
const idx = Object.fromEntries(D.bones.map((n, i) => [n, i]));
const H = D.heads.map((h) => new THREE.Vector3(...h));
B.forEach((b, i) => { const p = D.parents[i]; if (p < 0) { b.position.copy(H[i]); avatar.add(b); } else { b.position.copy(H[i]).sub(H[p]); B[p].add(b); } });
avatar.updateMatrixWorld(true);
const skel = new THREE.Skeleton(B);
const bone = (n) => B[idx[n]];
const restW = (n) => H[idx[n]].clone().add(avatar.position);
const local = (n, p) => new THREE.Vector3(...p).sub(H[idx[n]]);

function malla(m, mat, idxKey = 'idx') {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(dec(m.pos, Float32Array), 3));
  g.setIndex(new THREE.BufferAttribute(dec(m[idxKey], Uint32Array), 1));
  g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(dec(m.si, Uint16Array), 4));
  g.setAttribute('skinWeight', new THREE.BufferAttribute(dec(m.sw, Float32Array), 4));
  if (m.uv) g.setAttribute('uv', new THREE.BufferAttribute(dec(m.uv, Float32Array), 2));
  if (m.col) { const c = dec(m.col, Float32Array); for (let i = 0; i < c.length; i++) c[i] = Math.pow(c[i], 2.2); g.setAttribute('color', new THREE.BufferAttribute(c, 3)); }
  g.computeVertexNormals();
  const o = new THREE.SkinnedMesh(g, mat); o.castShadow = o.receiveShadow = true; o.frustumCulled = false;
  avatar.add(o); o.bind(skel); return o;
}
const cuerpo = malla(D.body, skinM);
const IDX = Object.fromEntries(['calle', 'gym', 'traje'].map((k) => [k, new THREE.BufferAttribute(dec(D.body['idx_' + k], Uint32Array), 1)]));
// expresiones como morphs de la piel
const MN = Object.keys(D.morphs);
{
  const n = D.body.n;
  cuerpo.geometry.morphAttributes.position = MN.map((k) => { const a = new Float32Array(n * 3), ii = dec(D.morphs[k].i, Uint32Array), dd = dec(D.morphs[k].d, Float32Array);
    for (let j = 0; j < ii.length; j++) { a[ii[j] * 3] = dd[j * 3]; a[ii[j] * 3 + 1] = dd[j * 3 + 1]; a[ii[j] * 3 + 2] = dd[j * 3 + 2]; } return new THREE.BufferAttribute(a, 3); });
  cuerpo.geometry.morphTargetsRelative = true; cuerpo.updateMorphTargets();
}
const campera = malla(D.hood, hoodM), camperaC = malla(D.hoodc, trajeM), remera = malla(D.tee, teeM), jean = malla(D.jean, jeanM), short = malla(D.shorts, shoM), zapas = malla(D.shoes, shoeM);
D.lashes.forEach((l, i) => { const o = malla(l, S('#2a1c14', 0.8, { side: THREE.DoubleSide, transparent: true, opacity: i % 2 ? 0.25 : 0.6, depthWrite: false })); o.castShadow = false; });
D.teeth.forEach((t) => malla(t, S('#ece6da', 0.35)));

// ---------- Ojos, boca y pelo (pegados a la cabeza) ----------
const cabeza = bone('head'), hR = H[idx.head];
const irisTex = (() => { const c = document.createElement('canvas'); c.width = 512; c.height = 256; const x = c.getContext('2d');
  // textura equirectangular: el centro (u=0.5) queda mirando a +z después de rotar la esfera
  x.fillStyle = '#f2ede6'; x.fillRect(0, 0, 512, 256);
  const cx = 256, cy = 128, R = 34;
  const g = x.createRadialGradient(cx, cy, 6, cx, cy, R); g.addColorStop(0, '#24150b'); g.addColorStop(0.4, '#5e3b1f'); g.addColorStop(0.85, '#3e2513'); g.addColorStop(1, '#120a05');
  x.fillStyle = g; x.beginPath(); x.ellipse(cx, cy, R, R, 0, 0, Math.PI * 2); x.fill();
  x.strokeStyle = 'rgba(170,120,70,.35)'; x.lineWidth = 1; for (let a = 0; a < 48; a++) { const t = a / 48 * Math.PI * 2; x.beginPath(); x.moveTo(cx + Math.cos(t) * 13, cy + Math.sin(t) * 13); x.lineTo(cx + Math.cos(t) * 31, cy + Math.sin(t) * 31); x.stroke(); }
  x.fillStyle = '#050302'; x.beginPath(); x.arc(cx, cy, 12, 0, Math.PI * 2); x.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
D.eyes.forEach((e) => {
  const g = new THREE.Group(); g.position.set(e[0] - hR.x, e[1] - hR.y, e[2] - hR.z); cabeza.add(g);
  const r = e[3] * 0.86;
  const geo = new THREE.SphereGeometry(r, 48, 32); geo.rotateY(-Math.PI / 2);
  g.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: irisTex, roughness: 0.25 })));
  g.add(new THREE.Mesh(new THREE.SphereGeometry(r * 1.03, 48, 32), new THREE.MeshPhysicalMaterial({ transparent: true, opacity: 0.08, roughness: 0.02, clearcoat: 1, clearcoatRoughness: 0.02 })));
});
const bocaInt = new THREE.Mesh(new THREE.SphereGeometry(0.02, 20, 14), S('#3a1714', 0.9)); bocaInt.position.set(D.mid[0] - hR.x, D.mid[1] - 0.07 - hR.y, D.mid[2] - 0.035 - hR.z); bocaInt.scale.set(1.3, 0.7, 1); cabeza.add(bocaInt);

const peloTex = carga.load('pedri2-pelo.png' + V); peloTex.colorSpace = THREE.SRGBColorSpace; peloTex.wrapS = peloTex.wrapT = THREE.RepeatWrapping; peloTex.repeat.set(9, 9); peloTex.anisotropy = 8;
const pelo = new THREE.Group(); cabeza.add(pelo);
{
  const hp = dec(D.hair.pos, Float32Array), hn = dec(D.hair.nor, Float32Array), hl = dec(D.hair.len, Float32Array), hf = dec(D.hair.flow, Float32Array), huv = dec(D.hair.uv, Float32Array), hi = dec(D.hair.idx, Uint32Array), n = D.hair.n;
  const o0 = [hR.x, hR.y, hR.z];
  const capa = (t, mat) => { const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const L = hl[i];
      for (let c = 0; c < 3; c++) pos[i * 3 + c] = hp[i * 3 + c] - o0[c] + hn[i * 3 + c] * L * t * 0.55 + hf[i * 3 + c] * L * 0.55 * Math.pow(t, 1.3) - (c === 1 ? L * 0.12 * t * t : 0); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(huv, 2)); g.setIndex(new THREE.BufferAttribute(hi, 1)); g.computeVertexNormals();
    const o = new THREE.Mesh(g, mat); pelo.add(o); return o; };
  const colTex = carga.load('pedri2-pelo-c.jpg' + V), norTex = carga.load('pedri2-pelo-n.jpg' + V);
  colTex.colorSpace = THREE.SRGBColorSpace; [colTex, norTex].forEach((t) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(9, 9); t.anisotropy = 8; });
  const nucleo = capa(0.62, new THREE.MeshPhysicalMaterial({ map: colTex, normalMap: norTex, normalScale: new THREE.Vector2(1.4, 1.4), roughness: 0.45, sheen: 0.8, sheenRoughness: 0.35, sheenColor: new THREE.Color('#8a6a52'), envMapIntensity: 0.7 }));
  nucleo.castShadow = true;
  const FUZZ = 12;
  for (let k = 1; k <= FUZZ; k++) { const t = k / FUZZ;
    capa(0.62 + 0.38 * t, new THREE.MeshStandardMaterial({ map: peloTex, alphaTest: 0.25 + 0.6 * t, roughness: 0.5, envMapIntensity: 0.6, color: new THREE.Color().setScalar(1.1 + 0.4 * t), side: THREE.DoubleSide })); }
}
// pulsera en la muñeca izquierda
const pulsera = new THREE.Group(); bone('wrist.L').add(pulsera); pulsera.rotation.x = Math.PI / 2;
{ pulsera.add(new THREE.Mesh(new THREE.TorusGeometry(0.031, 0.0045, 10, 32), S('#141414', 0.5))); const d = new THREE.Mesh(new THREE.SphereGeometry(0.0062, 12, 10), S('#e24b4a', 0.35)); d.position.set(0, 0.032, 0); pulsera.add(d); }
// capucha caída sobre la espalda y cordones
const capucha = new THREE.Group(); bone('spine01').add(capucha);
{ const nk = local('spine01', D.heads[idx.neck01]); const tela = S('#1c1c20', 0.85);
  const fondo = new THREE.Mesh(new THREE.SphereGeometry(0.12, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.62), tela);
  fondo.position.set(nk.x, nk.y - 0.06, nk.z - 0.075); fondo.scale.set(1.25, 0.6, 0.55); fondo.rotation.x = -2.2; fondo.castShadow = true; capucha.add(fondo);
  const aro = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.016, 14, 40, Math.PI * 1.15), tela); aro.position.set(nk.x, nk.y - 0.035, nk.z - 0.02); aro.rotation.set(Math.PI / 2 - 0.35, 0, Math.PI + Math.PI * 0.075); aro.scale.set(1.15, 1, 1); aro.castShadow = true; capucha.add(aro);
  [0.035, -0.035].forEach((x) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.17, 8), S('#2a2a2e', 0.7)); c.position.set(x, nk.y - 0.1, nk.z + 0.075); c.rotation.x = 0.12; capucha.add(c); });
}
const emblema = new THREE.Group(); bone('spine02').add(emblema);
{ const ch = local('spine02', [0, D.heads[idx.spine02][1] + 0.12, D.heads[idx.spine02][2] + 0.13]);
  const r = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.009, 14, 36), S('#f4f2ec', 0.3)); r.position.copy(ch); emblema.add(r);
  const p = new THREE.Mesh(new THREE.SphereGeometry(0.013, 14, 10), S('#e24b4a', 0.35)); p.position.copy(ch).add(new THREE.Vector3(0.028, 0.028, 0.004)); emblema.add(p); }

// mancuerna y cajón
const db = new THREE.Group(); sc.add(db);
db.add(new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.22, 14), S('#b5b5ae', 0.25, { metalness: 0.8 })));
[0.11, -0.11].forEach((y) => { const pl = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.05, 6), S('#2c2c2e', 0.6)); pl.position.y = y; pl.castShadow = true; db.add(pl); });
const caja = new THREE.Mesh(new RoundedBoxGeometry(0.44, 0.42, 0.34, 3, 0.015), S('#8a6136', 0.7)); caja.castShadow = caja.receiveShadow = true; sc.add(caja);

// ---------- Expresiones ----------
const CARAS = {
  neutra: {},
  sonriente: { 'mouth-corner-puller': 0.9, 'mouth-elevation': 0.2, 'eye-left-slit': 0.25, 'eye-right-slit': 0.25 },
  sorprendido: { 'eyebrows-left-up': 1, 'eyebrows-right-up': 1, 'eye-left-opened-up': 0.7, 'eye-right-opened-up': 0.7, 'mouth-open': 0.55 },
  enojado: { 'eyebrows-left-down': 1, 'eyebrows-right-down': 1, 'nose-compression': 0.4, 'mouth-compression': 0.6, 'eye-left-slit': 0.35, 'eye-right-slit': 0.35 },
  serio: { 'mouth-compression': 0.3, 'eyebrows-left-down': 0.3, 'eyebrows-right-down': 0.3 },
  triste: { 'eyebrows-left-inner-up': 1, 'eyebrows-right-inner-up': 1, 'mouth-depression': 0.75 },
  guino: { 'eye-left-closure': 1, 'mouth-corner-puller': 0.55 },
  foco: { 'mouth-compression': 0.45, 'eyebrows-left-down': 0.45, 'eyebrows-right-down': 0.45, 'eye-left-slit': 0.2, 'eye-right-slit': 0.2 },
  festejo: { 'mouth-corner-puller': 1, 'mouth-open': 0.35, 'eyebrows-left-up': 0.5, 'eyebrows-right-up': 0.5 },
};
const actual = Object.fromEntries(MN.map((k) => [k, 0]));
let cara = 'neutra', parp = 2;
function aplicarCara(dt) {
  const obj = CARAS[cara]; parp -= dt; const bl = parp < 0.13 && parp > 0; if (parp <= 0) parp = 2.5 + Math.random() * 3;
  MN.forEach((k, i) => { let d = obj[k] || 0; if (bl && (k === 'eye-left-closure' || k === 'eye-right-closure')) d = 1; actual[k] += (d - actual[k]) * Math.min(1, dt * (bl ? 30 : 9)); cuerpo.morphTargetInfluences[i] = actual[k]; });
}

// ---------- Poses ----------
const tmpQ = new THREE.Quaternion();
function apuntar(b, restDir, dir) { b.parent.getWorldQuaternion(tmpQ); const w = new THREE.Quaternion().setFromUnitVectors(restDir.clone().normalize(), dir.clone().normalize()); b.quaternion.copy(tmpQ.invert().multiply(w)); b.updateMatrixWorld(true); }
function mundoQ(b, q) { b.parent.getWorldQuaternion(tmpQ); b.quaternion.copy(tmpQ.invert().multiply(q)); b.updateMatrixWorld(true); }
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
const BRAZO = { abajo: { u: [0.13, -1, 0.0], f: [0.05, -1, 0.1] }, copa: { u: [0.2, -0.88, 0.32], f: [-0.62, 0.62, 0.3] },
  cintura: { u: [0.55, -0.8, -0.18], f: [-0.5, -0.35, 0.6] }, arriba: { u: [0.4, 1, 0.08], f: [0.18, 1, 0] } };
const POLE = new THREE.Vector3(0, 0, 1), EJE_X = new THREE.Vector3(1, 0, 0);
function posar(P) {
  B.forEach((b) => b.quaternion.identity());
  raiz.position.copy(raizRest).add(new THREE.Vector3(0, P.hip[1] - hipRest.y, P.hip[0] - hipRest.z));
  const spine = bone('spine05'); spine.rotation.x = P.lean; spine.updateMatrixWorld(true);
  bone('neck01').rotation.x = -P.lean * 0.45 + (P.cabeza || 0);
  avatar.updateMatrixWorld(true);
  LEG.forEach((L, i) => {
    const a = P.ank[i]; const hip = L.up.getWorldPosition(new THREE.Vector3());
    const T = new THREE.Vector3(L.ankle.x * 0.78, a[1], L.ankle.z + a[0]);
    const knee = ik2(hip, T, L.L1, L.L2, POLE.clone().add(new THREE.Vector3(L.ankle.x * 0.6, 0, 0)));
    apuntar(L.up, L.dU, knee.clone().sub(hip)); apuntar(L.lo, L.dL, T.clone().sub(knee));
    mundoQ(L.ft, new THREE.Quaternion().setFromAxisAngle(EJE_X, a[2] || 0));
  });
  const tq = new THREE.Quaternion().setFromAxisAngle(EJE_X, P.lean * 0.35), A = BRAZO[P.arm];
  ARMS.forEach((R) => { apuntar(R.up, R.dU, new THREE.Vector3(A.u[0] * R.sg, A.u[1], A.u[2]).applyQuaternion(tq)); apuntar(R.lo, R.dL, new THREE.Vector3(A.f[0] * R.sg, A.f[1], A.f[2]).applyQuaternion(tq)); });
}

// ---------- Movimientos ----------
const ease = (x) => x < 0 ? 0 : x > 1 ? 1 : (1 - Math.cos(x * Math.PI)) / 2;
const AY = LEG[0].ankle.y, HY = hipRest.y, HZ = hipRest.z;
const EJ = {
  posar: { nombre: 'Posando', dur: 4.5, pose(t) { const b = Math.sin(t / 4.5 * Math.PI * 2); return { hip: [HZ, HY - 0.01 + 0.003 * b], lean: 0.015 + 0.006 * b, ank: [[0, AY], [0, AY]], arm: 'abajo', f: 'Listo para entrenar' }; } },
  sen: { nombre: 'Sentadilla al cajón', dur: 3.6, toe: true, cues: ['Pecho arriba', 'La mancuerna pegada al pecho', 'Rodillas hacia afuera, sobre el pie', 'Rozá el cajón, no te sientes'],
    pose(t) { let s, f; if (t < 0.4) { s = 0; f = 'Arriba'; } else if (t < 2.4) { s = ease((t - 0.4) / 2); f = 'Bajá · 2 s'; } else if (t < 2.6) { s = 1; f = 'Rozá el cajón'; } else { s = 1 - ease((t - 2.6) / 1); f = 'Subí · 1 s'; }
      return { hip: [HZ - 0.2 * s, HY - 0.01 - 0.37 * s], lean: 0.05 + 0.5 * s, ank: [[0, AY], [0, AY]], arm: 'copa', f }; } },
  est: { nombre: 'Estocada hacia atrás', dur: 4.6, toe: true, cues: ['Torso derecho', 'Bajá derecho, como un ascensor', 'Rodilla de adelante sobre el pie', 'La de atrás casi toca el piso'],
    pose(t) { let k = 0, d = 0, f; if (t < 0.7) { k = ease(t / 0.7); f = 'Paso atrás'; } else if (t < 2.7) { k = 1; d = ease((t - 0.7) / 2); f = 'Bajá · 2 s'; } else if (t < 2.9) { k = 1; d = 1; f = 'Abajo'; } else if (t < 3.9) { k = 1; d = 1 - ease((t - 2.9) / 1); f = 'Subí · 1 s'; } else { k = 1 - ease((t - 3.9) / 0.7); f = 'Volvé'; }
      return { hip: [HZ - 0.2 * k, HY - 0.01 - 0.05 * k - 0.3 * d], lean: 0.04, ank: [[0, AY], [-0.64 * k, AY + 0.06 * k + 0.04 * d, 0.95 * k]], arm: 'cintura', f }; } },
  fes: { nombre: '¡Logro desbloqueado!', dur: 1.4, pose(t) { const cr = t < 0.3 ? Math.sin(t / 0.3 * Math.PI) * 0.6 : 0; const j = t >= 0.3 && t < 1.0 ? Math.sin((t - 0.3) / 0.7 * Math.PI) * 0.3 : 0;
      return { hip: [HZ, HY - 0.01 - 0.16 * cr + j], lean: 0.04 + 0.2 * cr, ank: [[0, AY + j * 0.85], [0, AY + j * 0.85]], arm: j > 0 ? 'arriba' : 'abajo', jump: j, cabeza: j > 0 ? -0.15 : 0, f: j > 0 ? '¡Nivel 3!' : 'Preparado' }; } },
};

// ---------- Guías y papelitos ----------
const N = 80, tp = new Float32Array(N * 3), tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.BufferAttribute(tp, 3));
const trail = new THREE.Line(tg, new THREE.LineBasicMaterial({ color: 0xe24b4a })); sc.add(trail); let tn = 0;
const kg = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0.01, 0), new THREE.Vector3(0, 0.8, 0)]), new THREE.LineDashedMaterial({ color: 0x5aa32f, dashSize: 0.03, gapSize: 0.02 })); kg.computeLineDistances(); sc.add(kg);
const conf = []; const cmat = ['#e24b4a', '#2f6b1f', '#f0c040', '#f4f2ec'].map((c) => S(c, 0.5));
for (let i = 0; i < 50; i++) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.035, 0.006), cmat[i % 4]); c.visible = false; sc.add(c); conf.push({ c, v: new THREE.Vector3() }); }
const lanzar = () => conf.forEach((o) => { o.c.visible = true; o.c.position.set(0, 1.8, 0); o.v.set((Math.random() - 0.5) * 2.6, Math.random() * 2 + 1, (Math.random() - 0.5) * 2.6); });

// ---------- Ropa ----------
let ropa = 'calle';
function vestir() {
  campera.visible = ropa === 'calle'; camperaC.visible = ropa === 'traje'; capucha.visible = ropa !== 'gym'; emblema.visible = ropa === 'traje';
  remera.visible = ropa !== 'traje'; teeM.color.set(ropa === 'gym' ? '#3b8a14' : '#ecebe7');
  jean.visible = ropa !== 'gym'; jeanM.color.set(ropa === 'traje' ? '#555a66' : '#ffffff'); short.visible = ropa === 'gym';
  cuerpo.geometry.setIndex(IDX[ropa]);
}
vestir();

// ---------- Cámara y controles ----------
const VISTAS = { tres: [2.2, 0.25, 2.2], frente: [0.001, 0.15, 3.9], perfil: [3.9, 0.15, 0.001], espalda: [0.001, 0.15, -3.9], cara: [0.12, 0.0, 0.55] };
let camDest = null, modo = 'posar', vel = 1, tc = 0, reps = 0, lanz = false, ci = 0;
function irVista(v) { const [x, y, z] = VISTAS[v]; const ty = v === 'cara' ? 1.6 : 0.9; ctl.target.set(0, ty, 0); camDest = new THREE.Vector3(x, ty + y, z); }
cam.position.set(2.2, 1.15, 2.2); ctl.target.set(0, 0.9, 0); ctl.update();
function marcar(g, v) { document.querySelectorAll(`[data-grupo="${g}"] button`).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === v))); }
let caraElegida = 'neutra';
function elegir(m) { modo = m; tc = 0; reps = 0; tn = 0; ci = 0; const E = EJ[m]; $('h-n').textContent = E.nombre; $('h-c').textContent = E.cues ? E.cues[0] : '';
  $('reps').hidden = !E.cues; $('leyenda').hidden = !E.toe; $('h-r').textContent = '0 / 12'; caja.visible = m === 'sen';
  cara = m === 'posar' ? caraElegida : m === 'fes' ? 'festejo' : 'foco';
  const vp = document.querySelector('[data-grupo="vista"] [aria-pressed="true"]').dataset.v; const v = m === 'posar' ? vp : (vp === 'cara' ? 'cara' : 'perfil'); irVista(v); marcar('vista', v); }
document.querySelectorAll('.seg').forEach((seg) => seg.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; const g = seg.dataset.grupo, v = b.dataset.v; marcar(g, v);
  if (g === 'modo') elegir(v); else if (g === 'vista') irVista(v); else if (g === 'ropa') { ropa = v; vestir(); } else if (g === 'vel') vel = Number(v);
  else if (g === 'cara') { caraElegida = v; if (modo === 'posar') cara = v; } }));
ctl.addEventListener('start', () => { camDest = null; });
elegir('posar');
// estado inicial por la dirección (?vista=cara&ropa=gym&cara=sonriente&modo=sen), útil para revisar
{ const q = new URLSearchParams(location.search); const set = (g, v) => { const b = document.querySelector(`[data-grupo="${g}"] [data-v="${v}"]`); if (b) b.click(); };
  ['ropa', 'cara', 'modo', 'vista'].forEach((g) => { const v = q.get(g); if (v) set(g, v); }); if (camDest) { cam.position.copy(camDest); camDest = null; ctl.update(); } }
const toeZ = LEG[0].ankle.z + 0.17;
caja.position.set(0, 0.21, HZ - 0.33);

function popXP() { const x = $('xp'); x.style.transition = 'none'; x.style.opacity = '1'; x.style.transform = 'translateY(0)'; void x.offsetWidth; x.style.transition = 'opacity 1s, transform 1s'; x.style.opacity = '0'; x.style.transform = 'translateY(-16px)'; }
const w1 = new THREE.Vector3(), w2 = new THREE.Vector3(), clk = new THREE.Clock(); let prev = 0;
function loop() {
  const now = clk.getElapsedTime(), dt = Math.min(0.05, now - prev); prev = now;
  const E = EJ[modo]; tc += dt * vel;
  if (tc >= E.dur) { tc -= E.dur; if (E.cues) { reps = reps >= 12 ? 1 : reps + 1; $('h-r').textContent = reps + ' / 12'; popXP(); ci = (ci + 1) % E.cues.length; $('h-c').textContent = E.cues[ci]; } tn = 0; }
  const P = E.pose(tc); $('h-f').textContent = P.f;
  if (modo === 'fes') { if (P.jump > 0.25 && !lanz) { lanzar(); lanz = true; } if (!P.jump) lanz = false; }
  posar(P); aplicarCara(dt);
  db.visible = P.arm === 'copa';
  if (db.visible) { bone('wrist.L').getWorldPosition(w1); bone('wrist.R').getWorldPosition(w2); w1.add(w2).multiplyScalar(0.5); db.position.set(w1.x, w1.y + 0.03, w1.z + 0.045); db.rotation.set(P.lean * 0.35, 0, 0); }
  kg.visible = !!E.toe; kg.position.set(0.12, 0, toeZ);
  trail.visible = !!E.cues; const hz = P.hip[0], hy = P.hip[1];
  if (tn < N) { tp.set([0.32, hy, hz], tn * 3); tn++; } else { tp.copyWithin(0, 3); tp.set([0.32, hy, hz], (N - 1) * 3); }
  tg.setDrawRange(0, tn); tg.attributes.position.needsUpdate = true;
  conf.forEach((o) => { if (!o.c.visible) return; o.v.y -= 6 * dt; o.c.position.addScaledVector(o.v, dt); o.c.rotation.x += dt * 8; o.c.rotation.y += dt * 6; if (o.c.position.y < 0) o.c.visible = false; });
  if (camDest) { cam.position.lerp(camDest, 0.08); if (cam.position.distanceTo(camDest) < 0.01) camDest = null; }
  ctl.update(); rd.render(sc, cam); requestAnimationFrame(loop);
}
loop();
