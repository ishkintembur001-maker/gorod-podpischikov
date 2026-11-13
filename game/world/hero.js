// Общий персонаж «Города подписчиков»: внешность из редактора образа
import * as THREE from './three.js';
const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .7, ...o });
export const DEF = { g: 'm', sk: '#e0b08a', hc: '#2b1a10', hs: 0, sh: '#e8433a', pa: '#2b3a55', ac: '' };
export function makeHero(look = {}, me = true) {
  const L = { ...DEF, ...(look || {}) };
  const g = new THREE.Group();
  const box = (w, h, d, c, x, y, z, p = g) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M(c)); m.position.set(x, y, z); m.castShadow = true; p.add(m); return m };
  const legs = [];
  for (const x of [-.24, .24]) { const l = new THREE.Group(); box(.32, 1, .34, L.pa, 0, -.5, 0, l); box(.36, .16, .5, '#2a2a2a', 0, -1, .06, l); l.position.set(x, 1.05, 0); g.add(l); legs.push(l) }
  const fem = L.g === 'f';
  const torso = box(fem ? .86 : .95, 1.1, .55, L.sh, 0, 1.6, 0);
  if (fem) { const sk = new THREE.Mesh(new THREE.CylinderGeometry(.42, .62, .55, 16), M(L.sh)); sk.position.y = 1.08; sk.castShadow = true; g.add(sk) }
  const arms = [];
  for (const x of [-.6, .6]) { const a = new THREE.Group(); box(.24, .7, .28, L.sh, 0, -.32, 0, a); box(.22, .3, .24, L.sk, 0, -.82, 0, a); a.position.set(x, 2.1, 0); g.add(a); arms.push(a) }
  const head = new THREE.Group(); head.position.y = 2.6; g.add(head);
  const hd = new THREE.Mesh(new THREE.SphereGeometry(.42, 20, 16), M(L.sk)); hd.castShadow = true; head.add(hd);
  for (const x of [-.14, .14]) { const e = new THREE.Mesh(new THREE.SphereGeometry(.055, 8, 8), M('#1a1020', { roughness: .3 })); e.position.set(x, .05, .38); head.add(e) }
  const mo = new THREE.Mesh(new THREE.TorusGeometry(.09, .02, 6, 12, Math.PI), M('#8a3a3a')); mo.rotation.z = Math.PI; mo.position.set(0, -.12, .39); head.add(mo);
  const hm = M(L.hc);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(.45, 20, 10, 0, 6.3, 0, [1.35, 1.6, 1.1, 1.45, .9][L.hs] || 1.35), hm); cap.position.y = .04; cap.rotation.x = -.25; head.add(cap);
  if (L.hs === 1 || (fem && L.hs !== 2 && L.hs !== 4)) { const back = new THREE.Mesh(new THREE.BoxGeometry(.8, fem ? .9 : .5, .25), hm); back.position.set(0, fem ? -.3 : -.05, -.3); head.add(back) }
  if (L.hs === 3) { const pt = new THREE.Mesh(new THREE.SphereGeometry(.2, 10, 8), hm); pt.position.set(0, .2, -.48); head.add(pt); const tail = new THREE.Mesh(new THREE.CylinderGeometry(.1, .05, .7, 8), hm); tail.position.set(0, -.2, -.55); head.add(tail) }
  if (L.hs === 4) { for (let i = 0; i < 5; i++) { const s = new THREE.Mesh(new THREE.ConeGeometry(.1, .35, 6), hm); s.position.set(-.24 + i * .12, .45, -.05); head.add(s) } }
  if (L.ac === 'cap') { const c = new THREE.Mesh(new THREE.CylinderGeometry(.46, .46, .2, 20), M('#e8433a')); c.position.y = .35; head.add(c); const v = new THREE.Mesh(new THREE.BoxGeometry(.5, .05, .35), M('#e8433a')); v.position.set(0, .28, .45); head.add(v) }
  if (L.ac === 'glasses') { for (const x of [-.15, .15]) { const r = new THREE.Mesh(new THREE.TorusGeometry(.1, .025, 6, 14), M('#111')); r.position.set(x, .05, .41); head.add(r) } }
  if (L.ac === 'crown') { const c = new THREE.Mesh(new THREE.CylinderGeometry(.3, .26, .22, 5, 1, true), M('#ffc65c', { metalness: .9, roughness: .2, emissive: '#6a4a00', side: THREE.DoubleSide })); c.position.y = .5; head.add(c) }
  if (L.ac === 'headphones') { const b = new THREE.Mesh(new THREE.TorusGeometry(.46, .05, 6, 20, Math.PI), M('#222')); b.position.y = .05; head.add(b); for (const x of [-.45, .45]) { const e = new THREE.Mesh(new THREE.CylinderGeometry(.14, .14, .12, 12), M('#5ee6b0')); e.rotation.z = Math.PI / 2; e.position.set(x, 0, 0); head.add(e) } }
  if (L.ac === 'tubeteika') { const c = new THREE.Mesh(new THREE.CylinderGeometry(.36, .4, .24, 4), M('#1a1a1a')); c.rotation.y = Math.PI / 4; c.position.y = .42; head.add(c); const p = new THREE.Mesh(new THREE.CylinderGeometry(.37, .41, .06, 4), M('#ffffff')); p.rotation.y = Math.PI / 4; p.position.y = .42; head.add(p) }
  const ring = new THREE.Mesh(new THREE.RingGeometry(.9, 1.2, 32), new THREE.MeshBasicMaterial({ color: me ? 0xffd34d : 0x4fc3ff, transparent: true, opacity: .8 }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = .08; g.add(ring);
  g.userData = { legs, arms, ring, head, torso };
  g.scale.setScalar(1.25);
  return g;
}
export function walk(g, t, on) {
  const U = g.userData;
  if (on) { U.legs.forEach((l, i) => l.rotation.x = Math.sin(t * 12 + i * Math.PI) * .75); U.arms.forEach((a, i) => a.rotation.x = -Math.sin(t * 12 + i * Math.PI) * .6) }
  else { U.legs.forEach(l => l.rotation.x *= .8); U.arms.forEach(a => a.rotation.x *= .8) }
}
