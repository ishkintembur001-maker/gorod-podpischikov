// Боевые эффекты: у каждого класса свой удар, снаряд и вспышка попадания
import * as THREE from './three.js';
const FXL = [];
const add = (scene, o, life, upd) => { scene.add(o); FXL.push({ scene, o, t: 0, life, upd }) };
export function tickFx(dt) {
  for (let i = FXL.length - 1; i >= 0; i--) { const f = FXL[i]; f.t += dt; const k = f.t / f.life; if (k >= 1) { f.scene.remove(f.o); f.o.traverse(c => { c.geometry && c.geometry.dispose(); if (c.material) { if (c.material.map) c.material.map.dispose(); c.material.dispose && c.material.dispose() } }); FXL.splice(i, 1); continue } f.upd && f.upd(k, dt, f) }
}
const basic = (c, o = 1) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, depthWrite: false });
// вспышка попадания: кольцо + искры
export function burst(scene, p, col = 0xffd34d, size = 1) {
  const g = new THREE.Group(); g.position.copy(p); g.position.y = Math.max(.6, p.y);
  const ring = new THREE.Mesh(new THREE.RingGeometry(.2, .45, 24), basic(col, .95)); ring.lookAt(0, 1, 0); g.add(ring);
  const sp = []; for (let i = 0; i < 10; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(.07 * size, 6, 4), basic(col)); const a = Math.random() * 6.28, b = Math.random() * 1.4; s.userData.v = new THREE.Vector3(Math.cos(a) * Math.cos(b), Math.sin(b) + .3, Math.sin(a) * Math.cos(b)).multiplyScalar(3 + Math.random() * 3); g.add(s); sp.push(s) }
  add(scene, g, .45, (k, dt) => { ring.scale.setScalar(1 + k * 4 * size); ring.material.opacity = 1 - k; for (const s of sp) { s.position.addScaledVector(s.userData.v, dt); s.userData.v.y -= 9 * dt; s.material.opacity = 1 - k } });
}
// всплывающая цифра урона
export function dmgText(scene, p, txt, col = '#ffd34d', big = false) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 96; const x = c.getContext('2d'); x.font = '900 ' + (big ? 72 : 58) + 'px -apple-system,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineWidth = 10; x.strokeStyle = 'rgba(0,0,0,.75)'; x.strokeText(txt, 128, 50); x.fillStyle = col; x.fillText(txt, 128, 50);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false, transparent: true })); s.renderOrder = 20; s.scale.set(big ? 2.6 : 2, big ? 1 : .78, 1); s.position.copy(p); s.position.y += 2.6; s.position.x += (Math.random() - .5) * .6;
  add(scene, s, .9, (k, dt) => { s.position.y += dt * 1.6; s.material.opacity = k < .6 ? 1 : 1 - (k - .6) / .4 });
}
// снаряд от a к b, по прилёту вызывает hit
function projectile(scene, mesh, a, b, speed, arc, hit, spin) {
  const from = a.clone(), to = b.clone(), d = from.distanceTo(to), life = Math.max(.12, d / speed); mesh.position.copy(from);
  add(scene, mesh, life, k => { mesh.position.lerpVectors(from, to, k); mesh.position.y += Math.sin(k * Math.PI) * arc; if (spin) mesh.rotation.z += .4; else { const n = from.clone().lerp(to, Math.min(1, k + .05)); n.y += Math.sin(Math.min(1, k + .05) * Math.PI) * arc; mesh.lookAt(n) } if (k > .97 && !mesh.userData.done) { mesh.userData.done = 1; hit && hit() } });
  setTimeout(() => { if (!mesh.userData.done) { mesh.userData.done = 1; hit && hit() } }, life * 1000 + 60);
}
const arrow = () => { const g = new THREE.Group(); const sh = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, 1.1, 5), new THREE.MeshBasicMaterial({ color: 0x8a5a2a })); sh.rotation.x = Math.PI / 2; g.add(sh); const tip = new THREE.Mesh(new THREE.ConeGeometry(.07, .22, 6), new THREE.MeshBasicMaterial({ color: 0xd8dde4 })); tip.rotation.x = Math.PI / 2; tip.position.z = .6; g.add(tip); for (const r of [0, Math.PI / 2]) { const f = new THREE.Mesh(new THREE.PlaneGeometry(.18, .22), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })); f.position.z = -.5; f.rotation.z = r; g.add(f) } return g };
const orb = (col, r = .28) => { const g = new THREE.Group(); g.add(new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), basic(0xffffff))); const h = new THREE.Mesh(new THREE.SphereGeometry(r * 1.8, 14, 10), basic(col, .55)); g.add(h);  return g };
// дуга удара мечом/топором перед бойцом
function slash(scene, who, col, wide = 1, flip = false) {
  const m = new THREE.Mesh(new THREE.RingGeometry(.9, 1.5, 24, 1, -.9 * wide, 1.8 * wide), basic(col, .85)); m.material.side = THREE.DoubleSide;
  const g = new THREE.Group(); g.position.copy(who.position); g.position.y += 1.1; g.rotation.y = who.rotation.y; g.add(m); m.rotation.x = -Math.PI / 2 + (flip ? .5 : -.3); m.position.z = .3;
  add(scene, g, .28, k => { m.rotation.z = (flip ? -1 : 1) * (k * 2.2 - 1.1); m.material.opacity = .9 * (1 - k); m.scale.setScalar(1 + k * .4) });
}
// молния с неба
function bolt(scene, p, col = 0x8ae8ff) {
  const pts = []; let x = p.x, z = p.z; for (let i = 0; i <= 8; i++) { pts.push(new THREE.Vector3(x, 14 - i * 1.7, z)); x = p.x + (Math.random() - .5) * 1.2 * (1 - i / 8); z = p.z + (Math.random() - .5) * 1.2 * (1 - i / 8) } pts[8].set(p.x, .2, p.z);
  const g = new THREE.Group(); g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: col, transparent: true }))); const t = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, .08, 5), basic(col, .9)); g.add(t); const l = new THREE.PointLight(col, 30, 18, 1.5); l.position.set(p.x, 4, p.z); g.add(l);
  add(scene, g, .35, k => { t.material.opacity = (1 - k) * (Math.random() < .3 ? .3 : 1); l.intensity = 30 * (1 - k) });
}
// столб света/исцеление
export function pillar(scene, p, col = 0xfff4a0) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(.9, .9, 6, 20, 1, true), basic(col, .55)); m.material.side = THREE.DoubleSide; m.position.set(p.x, 3, p.z);
  add(scene, m, .8, k => { m.scale.set(1 - k * .5, 1, 1 - k * .5); m.material.opacity = .55 * (1 - k) });
}
export function ringFx(scene, p, col, r = 3) {
  const m = new THREE.Mesh(new THREE.RingGeometry(.3, .6, 32), basic(col, .9)); m.material.side = THREE.DoubleSide; m.rotation.x = -Math.PI / 2; m.position.set(p.x, .25, p.z);
  add(scene, m, .5, k => { m.scale.setScalar(1 + k * r * 1.6); m.material.opacity = .9 * (1 - k) });
}
// стиль удара класса: анимация, задержка до попадания, дальность
export const STYLE = {
  warrior: { an: 'SwordSlash', range: 2.6, col: 0xffe08a, kind: 'slash' },
  paladin: { an: 'SwordSlash', range: 2.6, col: 0xfff4a0, kind: 'slash' },
  berserk: { an: 'SwordSlash', range: 2.6, col: 0xff4a2a, kind: 'cleave' },
  rogue: { an: 'SwordSlash', range: 2.2, col: 0xc8d0e0, kind: 'double' },
  assassin: { an: 'SwordSlash', range: 2.2, col: 0xa06aff, kind: 'double' },
  archer: { an: 'Shoot_OneHanded', range: 16, col: 0xffffff, kind: 'arrow' },
  hunter: { an: 'Shoot_OneHanded', range: 14, col: 0xc89a4a, kind: 'arrow' },
  mage: { an: 'Shoot_OneHanded', range: 15, col: 0xff6a2a, kind: 'fire' },
  druid: { an: 'Shoot_OneHanded', range: 13, col: 0x5aff7a, kind: 'leaf' },
  shaman: { an: 'Shoot_OneHanded', range: 13, col: 0x7ae8ff, kind: 'bolt' },
  ice: { an: 'Shoot_OneHanded', range: 20, col: 0x8ad8ff, kind: 'ice' },
  axe: { an: 'Shoot_OneHanded', range: 14, col: 0xff8a4a, kind: 'axe' },
  '': { an: 'Punch', range: 2.2, col: 0xffd34d, kind: 'slash' }
};
// удар класса: визуал + вызов hit() в момент попадания
export function attack(scene, who, tgt, cls, hit, play) {
  const S = STYLE[cls] || STYLE[''], a = who.position.clone(), b = tgt.position.clone(); a.y += 1.4; b.y += 1.2;
  who.rotation.y = Math.atan2(b.x - a.x, b.z - a.z); play && play(S.an);
  const done = () => { burst(scene, b, S.col, S.kind === 'fire' ? 1.4 : 1); hit && hit() };
  if (S.kind === 'slash') setTimeout(() => { slash(scene, who, S.col); done() }, 230);
  else if (S.kind === 'cleave') setTimeout(() => { slash(scene, who, S.col, 1.5); ringFx(scene, tgt.position, S.col, 1.2); done() }, 260);
  else if (S.kind === 'double') { setTimeout(() => { slash(scene, who, S.col, .8); done() }, 150); setTimeout(() => slash(scene, who, S.col, .8, true), 300) }
  else if (S.kind === 'arrow') setTimeout(() => projectile(scene, arrow(), a, b, 34, .6, done), 220);
  else if (S.kind === 'fire') setTimeout(() => projectile(scene, orb(0xff6a2a), a, b, 20, .4, done), 250);
  else if (S.kind === 'leaf') setTimeout(() => { const l = new THREE.Mesh(new THREE.OctahedronGeometry(.25, 0), basic(0x5aff7a)); projectile(scene, l, a, b, 18, .8, done, true) }, 230);
  else if (S.kind === 'ice') setTimeout(() => projectile(scene, orb(0x6ac8ff, .24), a, b, 24, .3, done), 230);
  else if (S.kind === 'axe') setTimeout(() => { const x = new THREE.Group(); const h = new THREE.Mesh(new THREE.BoxGeometry(.08, .9, .08), new THREE.MeshBasicMaterial({ color: 0x6a4426 })); const bl = new THREE.Mesh(new THREE.BoxGeometry(.5, .35, .05), new THREE.MeshBasicMaterial({ color: 0xd8dde4 })); bl.position.y = .35; x.add(h, bl); projectile(scene, x, a, b, 20, .8, done, true) }, 230);
  else if (S.kind === 'bolt') setTimeout(() => { bolt(scene, tgt.position); done() }, 260);
  return S;
}
// особые умения (визуал)
export function skillFx(scene, cls, who, tgt) {
  const p = (tgt || who).position;
  if (cls === 'mage') { const a = who.position.clone(); a.y += 1.6; const b = p.clone(); b.y += 1; projectile(scene, orb(0xff3a0a, .5), a, b, 16, 1, () => { burst(scene, b, 0xff6a2a, 2.2); ringFx(scene, p, 0xff6a2a, 3) }) }
  else if (cls === 'shaman') { bolt(scene, p); setTimeout(() => bolt(scene, p), 120) }
  else if (cls === 'paladin') pillar(scene, who.position, 0xfff4a0);
  else if (cls === 'druid') ringFx(scene, who.position, 0x5aff7a, 6);
  else if (cls === 'archer') { for (let i = 0; i < 7; i++) setTimeout(() => { const q = p.clone().add(new THREE.Vector3((Math.random() - .5) * 5, 0, (Math.random() - .5) * 5)); const s = q.clone(); s.y = 12; projectile(scene, arrow(), s, q, 40, 0, () => burst(scene, q, 0xffe27a, .7)) }, i * 70) }
  else if (cls === 'berserk') ringFx(scene, who.position, 0xff2a2a, 2.5);
  else if (cls === 'warrior') { ringFx(scene, p, 0xffd34d, 2.5); burst(scene, p, 0xffd34d, 2) }
  else if (cls === 'assassin') { burst(scene, p, 0xa06aff, 1.8) }
  else if (cls === 'rogue') ringFx(scene, who.position, 0xaaaaaa, 5);
  else if (cls === 'hunter') ringFx(scene, p, 0xc89a4a, 1.5);
}
