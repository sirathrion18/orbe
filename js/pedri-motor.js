// Motor de Pedri: carga el modelo (Ara 3D Gen, cuerpo MakeHuman CC0), lo anima y lo pone en pose.
// Lo usan la ficha (taller/pedri.html) y Bienestar.
import * as THREE from '../vendor/three/build/three.module.min.js';
import { GLTFLoader } from '../vendor/three/addons/loaders/GLTFLoader.js';

export const MODELO = '/taller/pedri.glb?v=2';


const ease = (x) => x < 0 ? 0 : x > 1 ? 1 : (1 - Math.cos(x * Math.PI)) / 2;
const EJE_X = new THREE.Vector3(1, 0, 0);

// Expresiones con las formas de la cara del modelo.
export const CARAS = {
  neutra: {},
  sonriente: { mouthSmile: 0.75, eyeSquintLeft: 0.25, eyeSquintRight: 0.25 },
  sorprendido: { eyeWideLeft: 0.8, eyeWideRight: 0.8, browInnerUp: 0.7, browOuterUpLeft: 0.7, browOuterUpRight: 0.7, jawOpen: 0.3 },
  enojado: { browDownLeft: 1, browDownRight: 1, noseSneerLeft: 0.35, noseSneerRight: 0.35, mouthPress: 0.5, eyeSquintLeft: 0.3, eyeSquintRight: 0.3 },
  serio: { mouthPress: 0.35, browDownLeft: 0.25, browDownRight: 0.25 },
  triste: { browInnerUp: 0.85, mouthFrown: 0.75 },
  guino: { eyeBlinkLeft: 1, mouthSmile: 0.5, eyeSquintRight: 0.2 },
  foco: { browDownLeft: 0.4, browDownRight: 0.4, mouthPress: 0.4, eyeSquintLeft: 0.2, eyeSquintRight: 0.2 },
  festejo: { mouthSmile: 1, jawOpen: 0.3, browOuterUpLeft: 0.4, browOuterUpRight: 0.4 },
};

// Ejercicios: cada uno devuelve la pose para un instante del ciclo (en metros, z = adelante).
export const EJERCICIOS = {
  sen: { nombre: 'Sentadilla al cajón', dur: 3.6, guias: true, caja: true, cara: 'foco',
    claves: ['Pecho arriba', 'La mancuerna pegada al pecho', 'Rodillas hacia afuera, sobre el pie', 'Rozá el cajón, no te sientes'],
    pose(t) { let s, f; if (t < 0.4) { s = 0; f = 'Arriba'; } else if (t < 2.4) { s = ease((t - 0.4) / 2); f = 'Bajá · 2 s'; } else if (t < 2.6) { s = 1; f = 'Rozá el cajón'; } else { s = 1 - ease((t - 2.6) / 1); f = 'Subí · 1 s'; }
      return { cad: [-0.2 * s, -0.4 * s], incl: 0.06 + 0.5 * s, pies: [[0, 0, 0], [0, 0, 0]], brazos: 'copa', fase: f }; } },
  est: { nombre: 'Estocada hacia atrás', dur: 4.6, guias: true, cara: 'foco',
    claves: ['Torso derecho', 'Bajá derecho, como un ascensor', 'Rodilla de adelante sobre el pie', 'La de atrás casi toca el piso'],
    pose(t) { let k = 0, d = 0, f; if (t < 0.7) { k = ease(t / 0.7); f = 'Paso atrás'; } else if (t < 2.7) { k = 1; d = ease((t - 0.7) / 2); f = 'Bajá · 2 s'; } else if (t < 2.9) { k = 1; d = 1; f = 'Abajo'; } else if (t < 3.9) { k = 1; d = 1 - ease((t - 2.9) / 1); f = 'Subí · 1 s'; } else { k = 1 - ease((t - 3.9) / 0.7); f = 'Volvé'; }
      return { cad: [-0.18 * k, -0.06 * k - 0.32 * d], incl: 0.03, pies: [[0, 0, 0], [-0.66 * k, 0.07 * k + 0.04 * d, 0.95 * k]], brazos: 'cintura', fase: f }; } },
};
const BRAZOS = { // direcciones en el marco del cuerpo: x = hacia afuera, y = arriba, z = adelante
  copa: { u: [0.22, -0.85, 0.42], f: [-0.62, 0.62, 0.28] },
  cintura: { u: [0.45, -0.85, -0.2], f: [-0.55, -0.3, 0.55] },
};

export async function cargarPedri() {
  const gltf = await new GLTFLoader().loadAsync(MODELO);
  const raiz = gltf.scene;
  let malla = null;
  raiz.traverse((o) => {
    if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false; if (o.morphTargetDictionary) malla = o;
      const ms = Array.isArray(o.material) ? o.material : [o.material];
      ms.forEach((m) => { m.envMapIntensity = 0.6; if (m.name === 'Skin') { m.roughness = 0.55; } if (m.name === 'Hair') { m.roughness = 0.5; m.alphaTest = 0.4; } }); }
  });
  const hueso = (n) => raiz.getObjectByName(n);
  // Pulsera con el punto rojo en la muñeca izquierda.
  {
    const mano = hueso('LeftHand'); const p = new THREE.Group(); mano.add(p);
    const neg = new THREE.MeshStandardMaterial({ color: '#141414', roughness: 0.45 }), rojo = new THREE.MeshStandardMaterial({ color: '#e24b4a', roughness: 0.3 });
    const aro = new THREE.Mesh(new THREE.TorusGeometry(0.034, 0.005, 12, 36), neg); aro.rotation.x = Math.PI / 2; p.add(aro);
    const d = new THREE.Mesh(new THREE.SphereGeometry(0.007, 14, 10), rojo); d.position.set(0, 0, 0.036); p.add(d);
    p.position.set(0, -0.015, 0); p.traverse((o) => { o.castShadow = true; });
  }
  const mixer = new THREE.AnimationMixer(raiz);
  const clips = Object.fromEntries(gltf.animations.map((a) => {
    // Las caras las manejamos nosotros: afuera las pistas de formas de la cara.
    a.tracks = a.tracks.filter((t) => !t.name.endsWith('.morphTargetInfluences')); return [a.name, mixer.clipAction(a)];
  }));

  // Pose de reposo (A-pose) para volver a ella antes de cada pose de ejercicio.
  raiz.updateMatrixWorld(true);
  const huesos = []; raiz.traverse((o) => { if (o.isBone) huesos.push(o); });
  const reposo = new Map(huesos.map((b) => [b, { q: b.quaternion.clone(), p: b.position.clone() }]));
  const wpos = (n) => hueso(n).getWorldPosition(new THREE.Vector3());
  const dirReposo = (a, b) => wpos(b).sub(wpos(a)).normalize();
  const PIERNAS = ['Left', 'Right'].map((s) => ({ up: hueso(s + 'UpLeg'), lo: hueso(s + 'Leg'), ft: hueso(s + 'Foot'),
    dU: dirReposo(s + 'UpLeg', s + 'Leg'), dL: dirReposo(s + 'Leg', s + 'Foot'),
    L1: wpos(s + 'UpLeg').distanceTo(wpos(s + 'Leg')), L2: wpos(s + 'Leg').distanceTo(wpos(s + 'Foot')), tobillo: wpos(s + 'Foot'),
    qPie: hueso(s + 'Foot').getWorldQuaternion(new THREE.Quaternion()) }));
  const BRZ = ['Left', 'Right'].map((s) => ({ sg: s === 'Left' ? 1 : -1, up: hueso(s + 'Arm'), lo: hueso(s + 'ForeArm'), dU: dirReposo(s + 'Arm', s + 'ForeArm'), dL: dirReposo(s + 'ForeArm', s + 'Hand') }));
  const cadera = hueso('Hips'), cad0 = cadera.position.clone(), cadW0 = wpos('Hips');
  const espalda = hueso('Spine'), cuello = hueso('Neck');
  const qW = new Map(); [espalda, cuello, ...PIERNAS.flatMap((p) => [p.up, p.lo]), ...BRZ.flatMap((b) => [b.up, b.lo])].forEach((b) => qW.set(b, b.getWorldQuaternion(new THREE.Quaternion())));
  // el lado del cuerpo: el modelo mira a +z y su izquierda queda en +x
  const lado = Math.sign(wpos('LeftArm').x - wpos('RightArm').x) || 1;

  const tq = new THREE.Quaternion();
  function aMundo(b, qMundo) { b.parent.getWorldQuaternion(tq); b.quaternion.copy(tq.invert().multiply(qMundo)); b.updateMatrixWorld(true); }
  function apuntar(b, restDir, dir) { aMundo(b, new THREE.Quaternion().setFromUnitVectors(restDir, dir.clone().normalize()).multiply(qW.get(b))); }
  function ik2(P, T, L1, L2, polo) {
    const d = Math.min(P.distanceTo(T), (L1 + L2) * 0.9995), dir = T.clone().sub(P).normalize();
    const a = (L1 * L1 - L2 * L2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
    const pp = polo.clone().sub(dir.clone().multiplyScalar(polo.dot(dir))).normalize();
    return P.clone().addScaledVector(dir, a).addScaledVector(pp, h);
  }
  function aReposo() { reposo.forEach((r, b) => { b.quaternion.copy(r.q); b.position.copy(r.p); }); raiz.updateMatrixWorld(true); }

  // Pone a Pedri en la pose de un ejercicio. Devuelve dónde quedó la cadera (para la guía).
  function posar(P) {
    aReposo();
    // la cadera se mueve en el mundo; pasamos el desplazamiento al espacio del padre
    const destino = cadW0.clone().add(new THREE.Vector3(0, P.cad[1], P.cad[0]));
    cadera.position.copy(cadera.parent.worldToLocal(destino)); raiz.updateMatrixWorld(true);
    aMundo(espalda, new THREE.Quaternion().setFromAxisAngle(EJE_X, P.incl).multiply(qW.get(espalda)));
    aMundo(cuello, new THREE.Quaternion().setFromAxisAngle(EJE_X, -P.incl * 0.5).multiply(cuello.getWorldQuaternion(new THREE.Quaternion())));
    const cab = hueso('Head'); aMundo(cab, new THREE.Quaternion().setFromAxisAngle(EJE_X, -P.incl * 0.35).multiply(cab.getWorldQuaternion(new THREE.Quaternion())));
    PIERNAS.forEach((L, i) => {
      const [dz, dy, giro] = P.pies[i]; const hip = L.up.getWorldPosition(new THREE.Vector3());
      const T = new THREE.Vector3(L.tobillo.x, L.tobillo.y + dy, L.tobillo.z + dz);
      const rod = ik2(hip, T, L.L1, L.L2, new THREE.Vector3(L.tobillo.x * 0.5, 0, 1));
      apuntar(L.up, L.dU, rod.clone().sub(hip)); apuntar(L.lo, L.dL, T.clone().sub(rod));
      aMundo(L.ft, new THREE.Quaternion().setFromAxisAngle(EJE_X, giro || 0).multiply(L.qPie));
    });
    const A = BRAZOS[P.brazos], qT = new THREE.Quaternion().setFromAxisAngle(EJE_X, P.incl * 0.4);
    if (A) BRZ.forEach((R) => {
      const s = R.sg * lado;
      apuntar(R.up, R.dU, new THREE.Vector3(A.u[0] * s, A.u[1], A.u[2]).applyQuaternion(qT));
      apuntar(R.lo, R.dL, new THREE.Vector3(A.f[0] * s, A.f[1], A.f[2]).applyQuaternion(qT));
    });
    return wpos('Hips');
  }

  // Caras: se acercan de a poco a la elegida y parpadea solo.
  const dic = malla?.morphTargetDictionary || {}, inf = malla?.morphTargetInfluences || [];
  const actual = {}; let parp = 2;
  function cara(nombre, dt) {
    const obj = CARAS[nombre] || {}; parp -= dt; const bl = parp > 0 && parp < 0.13; if (parp <= 0) parp = 2.5 + Math.random() * 3;
    for (const k in dic) {
      let d = obj[k] || 0; if (bl && (k === 'eyeBlinkLeft' || k === 'eyeBlinkRight')) d = Math.max(d, 1);
      const a = actual[k] || 0; actual[k] = a + (d - a) * Math.min(1, dt * (bl ? 30 : 8)); inf[dic[k]] = actual[k];
    }
  }

  // Traje de logro: el mismo modelo con la campera en grafito y verde.
  const outfit = []; raiz.traverse((o) => { if (o.isMesh) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { if (m.name === 'Outfit') outfit.push(m); }); });
  function ropa(cual) { outfit.forEach((m) => m.color.set(cual === 'traje' ? '#5b6b5c' : '#ffffff')); }

  return { raiz, mixer, clips, hueso, posar, aReposo, cara, ropa, wpos, alto: new THREE.Box3().setFromObject(raiz).max.y };
}
