// 3D-примерочная в магазине: персонаж крутится, вещи примеряются на нём
import * as THREE from './world/three.js';
import { makeHero, tickHeroes, dispose } from './world/hero.js';
let R = null, S, C, H = null, cv = null, last = 0, ang = 0, key = '';
function init(c) {
  cv = c; R = new THREE.WebGLRenderer({ canvas: c, antialias: true, alpha: true });
  R.setPixelRatio(Math.min(2, devicePixelRatio)); R.outputColorSpace = THREE.SRGBColorSpace; R.toneMapping = THREE.ACESFilmicToneMapping;
  S = new THREE.Scene(); S.add(new THREE.HemisphereLight('#ffffff', '#5a4a8a', 1.3));
  const d = new THREE.DirectionalLight('#fff4e0', 2); d.position.set(3, 6, 5); S.add(d);
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.6, .15, 40), new THREE.MeshStandardMaterial({ color: '#ffc65c', roughness: .4, metalness: .3 })); disc.position.y = -.08; S.add(disc);
  C = new THREE.PerspectiveCamera(30, 1, .1, 60);
  requestAnimationFrame(loop);
}
function loop(t) {
  if (!cv || !cv.isConnected) { R && R.dispose(); R = null; cv = null; if (H) { dispose(H); H = null } return }
  const dt = Math.min(.05, (t - last) / 1000 || 0); last = t; ang += dt * .7;
  const w = cv.clientWidth, h = cv.clientHeight; if (cv.width !== Math.round(w * R.getPixelRatio())) { R.setSize(w, h, false); C.aspect = w / h; C.updateProjectionMatrix() }
  if (H) { H.rotation.y = ang; const b = new THREE.Box3().setFromObject(H), hh = Math.max(1, b.max.y); C.position.set(0, hh * .62, hh * 2.6); C.lookAt(0, hh * .5, 0) }
  tickHeroes(dt); R.render(S, C); requestAnimationFrame(loop);
}
window.P3 = {
  show(c, look) {
    if (cv !== c) { if (R) { R.dispose(); R = null } init(c) }
    const k = JSON.stringify(look || {}); if (k === key && H) return; key = k;
    if (H) { S.remove(H); dispose(H) } H = makeHero(look || {}, false); S.add(H);
  }
};
