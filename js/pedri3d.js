// Pedri en 3D dentro de Bienestar: el modelo real (Ara 3D Gen sobre MakeHuman CC0), respirando y saludando.
// Se carga solo cuando hace falta porque three.js y el modelo pesan.
import * as THREE from '../vendor/three/three.module.js';
import { OrbitControls } from '../vendor/three/OrbitControls.js';
import { RoomEnvironment } from '../vendor/three/RoomEnvironment.js';
import { cargarPedri } from './pedri-motor.js';

export async function montar(el0, { ropa = 'calle', festejo = false } = {}) {
  let el = el0;
  const P = await cargarPedri();
  const rd = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  rd.setPixelRatio(Math.min(devicePixelRatio, 2)); rd.shadowMap.enabled = true; rd.shadowMap.type = THREE.PCFSoftShadowMap;
  rd.outputColorSpace = THREE.SRGBColorSpace; rd.toneMapping = THREE.ACESFilmicToneMapping;
  el.appendChild(rd.domElement);
  const sc = new THREE.Scene(); sc.environment = new THREE.PMREMGenerator(rd).fromScene(new RoomEnvironment(), 0.04).texture;
  const cam = new THREE.PerspectiveCamera(24, 1, 0.05, 30); cam.position.set(1.5, 1.15, 4.1);
  const ctl = new OrbitControls(cam, rd.domElement); ctl.enableDamping = true; ctl.enablePan = false; ctl.enableZoom = false; ctl.target.set(0, 0.9, 0);
  ctl.minPolarAngle = 1.2; ctl.maxPolarAngle = 1.6; ctl.autoRotate = true; ctl.autoRotateSpeed = 0.5; ctl.update();
  const tam = () => { const w = el.clientWidth || 300, h = el.clientHeight || 320; rd.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
  const ro = new ResizeObserver(tam); ro.observe(el); tam();
  sc.add(new THREE.HemisphereLight(0xe6ecff, 0x40372e, 0.5));
  const key = new THREE.DirectionalLight(0xfff3e6, 2.1); key.position.set(1.4, 3.6, 3.0); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.normalBias = 0.02;
  Object.assign(key.shadow.camera, { left: -1, right: 1, top: 2.2, bottom: -0.2 }); sc.add(key);
  const rim = new THREE.DirectionalLight(0xc9d8ff, 1.2); rim.position.set(-1.5, 2.8, -3.2); sc.add(rim);
  const piso = new THREE.Mesh(new THREE.CircleGeometry(0.9, 48), new THREE.ShadowMaterial({ opacity: 0.25 })); piso.rotation.x = -Math.PI / 2; piso.receiveShadow = true; sc.add(piso);
  sc.add(P.raiz); P.ropa(ropa);

  let actual = null;
  const jugar = (n) => { const a = P.clips[n]; if (!a || a === actual) return; a.reset().play(); if (actual) actual.crossFadeTo(a, 0.35, false); actual = a; };
  let fest = 0;
  const festejar = () => { fest = 2.6; jugar('Cheer'); };
  jugar('Idle'); if (festejo) festejar();
  // un toque en Pedri: saluda
  rd.domElement.addEventListener('dblclick', () => { if (!fest) { fest = 1.8; jugar('Wave'); } });

  const clk = new THREE.Clock(); let vivo = true;
  (function loop() {
    if (!vivo) return; const dt = Math.min(0.1, clk.getDelta());
    if (fest > 0) { fest -= dt; if (fest <= 0) { fest = 0; jugar('Idle'); } }
    P.mixer.update(dt); P.cara(fest > 0 ? 'festejo' : 'sonriente', dt);
    ctl.update(); rd.render(sc, cam); requestAnimationFrame(loop);
  })();
  return {
    ropa,
    mover(nuevo) { ro.unobserve(el); el = nuevo; el.appendChild(rd.domElement); ro.observe(el); tam(); },
    festejar,
    destruir() { vivo = false; ro.disconnect(); rd.dispose(); rd.domElement.remove(); },
  };
}
