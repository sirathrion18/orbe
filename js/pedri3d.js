// Pedri en 3D dentro de Orbe (Bienestar). Se carga solo cuando hace falta: three.js y el modelo pesan.
// El modelo sale del cuerpo base de MakeHuman (CC0); los archivos viven en /taller/.
import * as THREE from '../vendor/three/three.module.js';
import { OrbitControls } from '../vendor/three/OrbitControls.js';
import { RoomEnvironment } from '../vendor/three/RoomEnvironment.js';

const V = '?v=28', BASE = '/taller/';
let datos = null;
const dec = (s, T) => { const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return new T(u.buffer); };

export async function montar(el0, { ropa = 'calle', festejo = false } = {}) {
  let el = el0;
  if (!datos) datos = await fetch(BASE + 'pedri2.json' + V).then((r) => r.json());
  const D = datos, carga = new THREE.TextureLoader();
  const rd = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  rd.setPixelRatio(Math.min(devicePixelRatio, 2)); rd.shadowMap.enabled = true; rd.shadowMap.type = THREE.PCFSoftShadowMap;
  rd.outputColorSpace = THREE.SRGBColorSpace; rd.toneMapping = THREE.ACESFilmicToneMapping; rd.toneMappingExposure = 1.05;
  el.appendChild(rd.domElement);
  const sc = new THREE.Scene(); const pm = new THREE.PMREMGenerator(rd); sc.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  const cam = new THREE.PerspectiveCamera(26, 1, 0.05, 30); cam.position.set(1.7, 1.25, 3.2);
  const ctl = new OrbitControls(cam, rd.domElement); ctl.enableDamping = true; ctl.enablePan = false; ctl.enableZoom = false; ctl.target.set(0, 0.92, 0);
  ctl.minPolarAngle = 1.2; ctl.maxPolarAngle = 1.6; ctl.autoRotate = true; ctl.autoRotateSpeed = 0.6; ctl.update();
  const tam = () => { const w = el.clientWidth || 300, h = el.clientHeight || 320; rd.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
  const ro = new ResizeObserver(tam); ro.observe(el); tam();
  sc.add(new THREE.HemisphereLight(0xe6ecff, 0x40372e, 0.5));
  const key = new THREE.DirectionalLight(0xfff3e6, 2.0); key.position.set(1.6, 3.6, 3.2); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.normalBias = 0.012;
  Object.assign(key.shadow.camera, { left: -1, right: 1, top: 2.2, bottom: -0.2 }); sc.add(key);
  const rim = new THREE.DirectionalLight(0xc9d8ff, 1.1); rim.position.set(-1.5, 2.8, -3.2); sc.add(rim);
  const piso = new THREE.Mesh(new THREE.CircleGeometry(0.9, 48), new THREE.ShadowMaterial({ opacity: 0.25 })); piso.rotation.x = -Math.PI / 2; piso.receiveShadow = true; sc.add(piso);

  const S = (c, r = 0.6, extra = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: r, envMapIntensity: 0.55 }, extra));
  const piel = carga.load(BASE + 'pedri2-piel.jpg' + V); piel.colorSpace = THREE.SRGBColorSpace;
  const skinM = new THREE.MeshPhysicalMaterial({ map: piel, roughness: 0.52, sheen: 0.35, sheenRoughness: 0.6, sheenColor: new THREE.Color('#ffb59a'), envMapIntensity: 0.45 });
  const denim = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); x.fillStyle = '#34507e'; x.fillRect(0, 0, 128, 128);
    for (let i = -128; i < 256; i += 3) { x.strokeStyle = i % 2 ? 'rgba(160,185,220,.18)' : 'rgba(10,20,40,.22)'; x.beginPath(); x.moveTo(i, 0); x.lineTo(i + 128, 128); x.stroke(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(14, 14); return t; })();
  const hoodM = new THREE.MeshPhysicalMaterial({ color: '#ffffff', vertexColors: true, roughness: 0.85, sheen: 0.6, sheenRoughness: 0.8, sheenColor: new THREE.Color('#6a6a72') });
  const trajeM = new THREE.MeshPhysicalMaterial({ color: '#3a3a3f', roughness: 0.4, sheen: 0.4, sheenColor: new THREE.Color('#8fd06a') });
  const teeM = S('#ecebe7', 0.9), jeanM = S('#ffffff', 0.85, { map: denim }), shoM = S('#1c1c1e', 0.8), shoeM = S('#ffffff', 0.55, { vertexColors: true });

  const avatar = new THREE.Group(); avatar.position.y = -D.floor; sc.add(avatar);
  const B = D.bones.map((n) => { const b = new THREE.Bone(); b.name = n; return b; });
  const idx = Object.fromEntries(D.bones.map((n, i) => [n, i])), H = D.heads.map((h) => new THREE.Vector3(...h));
  B.forEach((b, i) => { const p = D.parents[i]; if (p < 0) { b.position.copy(H[i]); avatar.add(b); } else { b.position.copy(H[i]).sub(H[p]); B[p].add(b); } });
  avatar.updateMatrixWorld(true);
  const skel = new THREE.Skeleton(B), bone = (n) => B[idx[n]], restW = (n) => H[idx[n]].clone().add(avatar.position), local = (n, p) => new THREE.Vector3(...p).sub(H[idx[n]]);
  function malla(m, mat) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(dec(m.pos, Float32Array), 3)); g.setIndex(new THREE.BufferAttribute(dec(m.idx, Uint32Array), 1));
    g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(dec(m.si, Uint16Array), 4)); g.setAttribute('skinWeight', new THREE.BufferAttribute(dec(m.sw, Float32Array), 4));
    if (m.uv) g.setAttribute('uv', new THREE.BufferAttribute(dec(m.uv, Float32Array), 2));
    if (m.col) { const c = dec(m.col, Float32Array); for (let i = 0; i < c.length; i++) c[i] = Math.pow(c[i], 2.2); g.setAttribute('color', new THREE.BufferAttribute(c, 3)); }
    g.computeVertexNormals(); const o = new THREE.SkinnedMesh(g, mat); o.castShadow = true; o.frustumCulled = false; avatar.add(o); o.bind(skel); return o;
  }
  const cuerpo = malla(D.body, skinM);
  cuerpo.geometry.setIndex(new THREE.BufferAttribute(dec(D.body['idx_' + ropa], Uint32Array), 1));
  const MN = Object.keys(D.morphs), n0 = D.body.n;
  cuerpo.geometry.morphAttributes.position = MN.map((k) => { const a = new Float32Array(n0 * 3), ii = dec(D.morphs[k].i, Uint32Array), dd = dec(D.morphs[k].d, Float32Array);
    for (let j = 0; j < ii.length; j++) { a[ii[j] * 3] = dd[j * 3]; a[ii[j] * 3 + 1] = dd[j * 3 + 1]; a[ii[j] * 3 + 2] = dd[j * 3 + 2]; } return new THREE.BufferAttribute(a, 3); });
  cuerpo.geometry.morphTargetsRelative = true; cuerpo.updateMorphTargets();
  if (ropa === 'calle') malla(D.hood, hoodM); if (ropa === 'traje') malla(D.hoodc, trajeM);
  if (ropa !== 'traje') { teeM.color.set(ropa === 'gym' ? '#3b8a14' : '#ecebe7'); malla(D.tee, teeM); }
  if (ropa === 'gym') malla(D.shorts, shoM); else { if (ropa === 'traje') jeanM.color.set('#555a66'); malla(D.jean, jeanM); }
  malla(D.shoes, shoeM);
  D.lashes.forEach((l, i) => { const o = malla(l, S('#2a1c14', 0.8, { side: THREE.DoubleSide, transparent: true, opacity: i % 2 ? 0.25 : 0.6, depthWrite: false })); o.castShadow = false; });
  D.teeth.forEach((t) => malla(t, S('#ece6da', 0.35)));

  const cabeza = bone('head'), hR = H[idx.head];
  const iris = (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 128; const x = c.getContext('2d'); x.fillStyle = '#f2ede6'; x.fillRect(0, 0, 256, 128);
    const g = x.createRadialGradient(128, 64, 3, 128, 64, 17); g.addColorStop(0, '#24150b'); g.addColorStop(0.4, '#5e3b1f'); g.addColorStop(1, '#120a05'); x.fillStyle = g; x.beginPath(); x.arc(128, 64, 17, 0, 7); x.fill();
    x.fillStyle = '#050302'; x.beginPath(); x.arc(128, 64, 6, 0, 7); x.fill(); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  D.eyes.forEach((e) => { const geo = new THREE.SphereGeometry(e[3] * 0.86, 32, 24); geo.rotateY(-Math.PI / 2); const o = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: iris, roughness: 0.25 })); o.position.set(e[0] - hR.x, e[1] - hR.y, e[2] - hR.z); cabeza.add(o); });
  const boca = new THREE.Mesh(new THREE.SphereGeometry(0.02, 16, 12), S('#3a1714', 0.9)); boca.position.set(D.mid[0] - hR.x, D.mid[1] - 0.07 - hR.y, D.mid[2] - 0.035 - hR.z); boca.scale.set(1.3, 0.7, 1); cabeza.add(boca);
  // pelo: volumen sólido con relieve y pelusa encima
  {
    const hp = dec(D.hair.pos, Float32Array), hn = dec(D.hair.nor, Float32Array), hl = dec(D.hair.len, Float32Array), hf = dec(D.hair.flow, Float32Array), huv = dec(D.hair.uv, Float32Array), hi = dec(D.hair.idx, Uint32Array), n = D.hair.n, o0 = [hR.x, hR.y, hR.z];
    const capa = (t, mat) => { const pos = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { const L = hl[i]; for (let c = 0; c < 3; c++) pos[i * 3 + c] = hp[i * 3 + c] - o0[c] + hn[i * 3 + c] * L * t * 0.55 + hf[i * 3 + c] * L * 0.55 * Math.pow(t, 1.3) - (c === 1 ? L * 0.12 * t * t : 0); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(huv, 2)); g.setIndex(new THREE.BufferAttribute(hi, 1)); g.computeVertexNormals();
      const o = new THREE.Mesh(g, mat); cabeza.add(o); return o; };
    const col = carga.load(BASE + 'pedri2-pelo-c.jpg' + V), nor = carga.load(BASE + 'pedri2-pelo-n.jpg' + V), alfa = carga.load(BASE + 'pedri2-pelo.png' + V);
    col.colorSpace = alfa.colorSpace = THREE.SRGBColorSpace; [col, nor, alfa].forEach((t) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(9, 9); });
    capa(0.62, new THREE.MeshPhysicalMaterial({ map: col, normalMap: nor, normalScale: new THREE.Vector2(1.4, 1.4), roughness: 0.45, sheen: 0.8, sheenRoughness: 0.35, sheenColor: new THREE.Color('#8a6a52') })).castShadow = true;
    for (let k = 1; k <= 8; k++) { const t = k / 8; capa(0.62 + 0.38 * t, new THREE.MeshStandardMaterial({ map: alfa, alphaTest: 0.25 + 0.6 * t, roughness: 0.5, color: new THREE.Color().setScalar(1.1 + 0.4 * t), side: THREE.DoubleSide })); }
  }
  // pulsera y capucha o emblema
  { const p = new THREE.Group(); bone('wrist.L').add(p); p.rotation.x = Math.PI / 2; p.add(new THREE.Mesh(new THREE.TorusGeometry(0.031, 0.0045, 10, 32), S('#141414', 0.5))); const d = new THREE.Mesh(new THREE.SphereGeometry(0.0062, 12, 10), S('#e24b4a', 0.35)); d.position.set(0, 0.032, 0); p.add(d); }
  if (ropa !== 'gym') { const g = new THREE.Group(); bone('spine01').add(g); const nk = local('spine01', D.heads[idx.neck01]); const tela = S(ropa === 'traje' ? '#3a3a3f' : '#1c1c20', 0.85);
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.12, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.62), tela); f.position.set(nk.x, nk.y - 0.06, nk.z - 0.075); f.scale.set(1.25, 0.6, 0.55); f.rotation.x = -2.2; g.add(f);
    const a = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.016, 12, 36, Math.PI * 1.15), tela); a.position.set(nk.x, nk.y - 0.035, nk.z - 0.02); a.rotation.set(Math.PI / 2 - 0.35, 0, Math.PI + Math.PI * 0.075); a.scale.set(1.15, 1, 1); g.add(a); }
  if (ropa === 'traje') { const g = new THREE.Group(); bone('spine02').add(g); const ch = local('spine02', [0, D.heads[idx.spine02][1] + 0.12, D.heads[idx.spine02][2] + 0.13]);
    const r = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.009, 14, 36), S('#f4f2ec', 0.3)); r.position.copy(ch); g.add(r); const p = new THREE.Mesh(new THREE.SphereGeometry(0.013, 12, 10), S('#e24b4a', 0.35)); p.position.copy(ch).add(new THREE.Vector3(0.028, 0.028, 0.004)); g.add(p); }

  // pose: parado respirando; el festejo salta con los brazos arriba
  const tmpQ = new THREE.Quaternion();
  const apuntar = (b, r, d) => { b.parent.getWorldQuaternion(tmpQ); const w = new THREE.Quaternion().setFromUnitVectors(r.clone().normalize(), d.clone().normalize()); b.quaternion.copy(tmpQ.invert().multiply(w)); b.updateMatrixWorld(true); };
  const LEG = ['L', 'R'].map((s) => ({ up: bone('upperleg01.' + s), lo: bone('lowerleg01.' + s), ft: bone('foot.' + s), dU: H[idx['lowerleg01.' + s]].clone().sub(H[idx['upperleg01.' + s]]), dL: H[idx['foot.' + s]].clone().sub(H[idx['lowerleg01.' + s]]),
    L1: H[idx['lowerleg01.' + s]].distanceTo(H[idx['upperleg01.' + s]]), L2: H[idx['foot.' + s]].distanceTo(H[idx['lowerleg01.' + s]]), ankle: restW('foot.' + s) }));
  const ARMS = ['L', 'R'].map((s) => ({ sg: s === 'L' ? 1 : -1, up: bone('upperarm01.' + s), lo: bone('lowerarm01.' + s), dU: H[idx['lowerarm01.' + s]].clone().sub(H[idx['upperarm01.' + s]]), dL: H[idx['wrist.' + s]].clone().sub(H[idx['lowerarm01.' + s]]) }));
  const hip0 = restW('upperleg01.L').add(restW('upperleg01.R')).multiplyScalar(0.5), raiz = bone('root'), raiz0 = raiz.position.clone();
  const POLE = new THREE.Vector3(0, 0, 1);
  const ik2 = (P, T, L1, L2, pole) => { const d = Math.min(P.distanceTo(T), (L1 + L2) * 0.9995), dir = T.clone().sub(P).normalize(); const a = (L1 * L1 - L2 * L2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, L1 * L1 - a * a)); const pp = pole.clone().sub(dir.clone().multiplyScalar(pole.dot(dir))).normalize(); return P.clone().addScaledVector(dir, a).addScaledVector(pp, h); };
  const BR = { abajo: { u: [0.13, -1, 0], f: [0.05, -1, 0.1] }, arriba: { u: [0.4, 1, 0.08], f: [0.18, 1, 0] } };
  const caras = { neutra: {}, festejo: { 'mouth-corner-puller': 1, 'mouth-open': 0.35, 'eyebrows-left-up': 0.5, 'eyebrows-right-up': 0.5 }, sonrisa: { 'mouth-corner-puller': 0.6 } };
  const act = Object.fromEntries(MN.map((k) => [k, 0]));
  let fest = festejo ? 2.8 : 0, parp = 2, alive = true;
  function posar(t, dt) {
    B.forEach((b) => b.quaternion.identity());
    const cr = fest > 0 ? Math.max(0, Math.sin(((2.8 - fest) % 1.4) / 1.4 * Math.PI * 2)) : 0, j = fest > 0 ? Math.max(0, Math.sin(((2.8 - fest) % 1.4) / 1.4 * Math.PI)) * 0.25 : 0;
    const b = Math.sin(t * 1.4);
    raiz.position.copy(raiz0).add(new THREE.Vector3(0, -0.01 + 0.003 * b + j, 0));
    bone('spine05').rotation.x = 0.015 + 0.006 * b; avatar.updateMatrixWorld(true);
    LEG.forEach((L) => { const hip = L.up.getWorldPosition(new THREE.Vector3()); const T = new THREE.Vector3(L.ankle.x * 0.78, L.ankle.y + j * 0.85, L.ankle.z);
      const k = ik2(hip, T, L.L1, L.L2, POLE.clone().add(new THREE.Vector3(L.ankle.x * 0.6, 0, 0))); apuntar(L.up, L.dU, k.clone().sub(hip)); apuntar(L.lo, L.dL, T.clone().sub(k)); });
    const A = BR[fest > 0 ? 'arriba' : 'abajo']; ARMS.forEach((R) => { apuntar(R.up, R.dU, new THREE.Vector3(A.u[0] * R.sg, A.u[1], A.u[2])); apuntar(R.lo, R.dL, new THREE.Vector3(A.f[0] * R.sg, A.f[1], A.f[2])); });
    const obj = caras[fest > 0 ? 'festejo' : 'sonrisa']; parp -= dt; const bl = parp < 0.13 && parp > 0; if (parp <= 0) parp = 2.5 + Math.random() * 3;
    MN.forEach((k, i) => { let d = obj[k] || 0; if (bl && /eye-(left|right)-closure/.test(k)) d = 1; act[k] += (d - act[k]) * Math.min(1, dt * 10); cuerpo.morphTargetInfluences[i] = act[k]; });
    if (fest > 0) fest -= dt; void cr;
  }
  const clk = new THREE.Clock(); let prev = 0;
  (function loop() { if (!alive) return; const t = clk.getElapsedTime(), dt = Math.min(0.05, t - prev); prev = t; posar(t, dt); ctl.update(); rd.render(sc, cam); requestAnimationFrame(loop); })();
  return {
    ropa,
    mover(nuevo) { ro.unobserve(el); el = nuevo; el.appendChild(rd.domElement); ro.observe(el); tam(); },
    festejar() { fest = 2.8; },
    destruir() { alive = false; ro.disconnect(); rd.dispose(); rd.domElement.remove(); },
  };
}
