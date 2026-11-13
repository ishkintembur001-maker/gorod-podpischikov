// Общий персонаж «Города подписчиков»: внешность из редактора образа
import * as THREE from './three.js';
import { GLTFLoader } from './pp/loaders/GLTFLoader.js';
import { MeshoptDecoder } from './pp/libs/meshopt_decoder.module.js';
import { clone as skClone } from './pp/utils/SkeletonUtils.js';
const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .7, ...o });
export const DEF = { g: 'm', sk: '#e0b08a', hc: '#2b1a10', hs: 0, sh: '#e8433a', pa: '#2b3a55', ac: '' };
function makeBlocky(look = {}, me = true) {
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
function walkBlocky(g, t, on) {
  const U = g.userData;
  if (on) { U.legs.forEach((l, i) => l.rotation.x = Math.sin(t * 12 + i * Math.PI) * .75); U.arms.forEach((a, i) => a.rotation.x = -Math.sin(t * 12 + i * Math.PI) * .6) }
  else { U.legs.forEach(l => l.rotation.x *= .8); U.arms.forEach(a => a.rotation.x *= .8) }
}

// ===== живые персонажи (Quaternius Ultimate Animated Characters, CC0) =====
const LOADER = new GLTFLoader(); LOADER.setMeshoptDecoder(MeshoptDecoder);
const BASE = new URL('./models/', import.meta.url).href, CACHE = {}, MIXERS = new Set(), H = 3.6;
const VAR = { m: ['Casual_Male', 'Casual2_Male', 'Casual3_Male', 'Casual_Bald', 'Casual2_Male'], f: ['Casual_Female', 'Casual2_Female', 'Casual_Female', 'Casual2_Female', 'Casual_Female'] };
function loadVar(name) { return CACHE[name] || (CACHE[name] = new Promise((res, rej) => LOADER.load(BASE + name + '.glb', res, undefined, rej))) }
export function preload(look) { const L = { ...DEF, ...(look || {}) }; return loadVar((VAR[L.g === 'f' ? 'f' : 'm'])[L.hs | 0] || 'Casual_Male').catch(() => null) }
function recolor(model, L) {
  model.traverse(o => { if (!o.isMesh) return; o.castShadow = true; o.frustumCulled = false; const ms = Array.isArray(o.material) ? o.material : [o.material];
    const nm = ms.map(m => { const c = m.clone(), n = (m.name || '').toLowerCase(); if (/skin/.test(n)) c.color.set(L.sk); else if (/hair|beard|eyebrow/.test(n)) c.color.set(L.hc); else if (/shirt|top|jacket|hood|coat|vest|dress/.test(n)) c.color.set(L.sh); else if (/pant|trouser|jean|short|skirt|leg/.test(n)) c.color.set(L.pa); c.roughness = .75; c.metalness = 0; return c });
    o.material = Array.isArray(o.material) ? nm : nm[0] });
}
function accessory(L) {
  const g = new THREE.Group(), M2 = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .6, ...o });
  if (L.ac === 'cap') { const c = new THREE.Mesh(new THREE.CylinderGeometry(.5, .52, .28, 20), M2('#e8433a')); c.position.y = .1; g.add(c); const v = new THREE.Mesh(new THREE.BoxGeometry(.55, .05, .4), M2('#e8433a')); v.position.set(0, 0, .5); g.add(v) }
  if (L.ac === 'crown') { const c = new THREE.Mesh(new THREE.CylinderGeometry(.34, .3, .3, 5, 1, true), M2('#ffc65c', { metalness: .9, roughness: .2, emissive: '#6a4a00', side: THREE.DoubleSide })); c.position.y = .2; g.add(c) }
  if (L.ac === 'tubeteika') { const c = new THREE.Mesh(new THREE.CylinderGeometry(.42, .46, .26, 4), M2('#1a1a1a')); c.rotation.y = Math.PI / 4; c.position.y = .08; g.add(c); const p = new THREE.Mesh(new THREE.CylinderGeometry(.43, .47, .07, 4), M2('#ffffff')); p.rotation.y = Math.PI / 4; p.position.y = .08; g.add(p) }
  if (L.ac === 'headphones') { const b = new THREE.Mesh(new THREE.TorusGeometry(.55, .06, 6, 20, Math.PI), M2('#222')); b.position.y = -.25; g.add(b); for (const x of [-.55, .55]) { const e = new THREE.Mesh(new THREE.CylinderGeometry(.17, .17, .14, 12), M2('#5ee6b0')); e.rotation.z = Math.PI / 2; e.position.set(x, -.3, 0); g.add(e) } }
  if (L.ac === 'glasses') { for (const x of [-.18, .18]) { const r = new THREE.Mesh(new THREE.TorusGeometry(.13, .03, 6, 14), M2('#111')); r.position.set(x, -.42, .5); g.add(r) } const br = new THREE.Mesh(new THREE.BoxGeometry(.12, .03, .03), M2('#111')); br.position.set(0, -.42, .5); g.add(br) }
  return g;
}
export function makeHero(look = {}, me = true) {
  const L = { ...DEF, ...(look || {}) };
  const g = new THREE.Group(); const dummy = () => new THREE.Object3D();
  const ring = new THREE.Mesh(new THREE.RingGeometry(.9, 1.2, 32), new THREE.MeshBasicMaterial({ color: me ? 0xffd34d : 0x4fc3ff, transparent: true, opacity: .8 }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = .08; g.add(ring);
  const ph = makeBlocky(L, me); ph.remove(ph.userData.ring); g.add(ph);
  g.userData = { legs: [dummy(), dummy()], arms: [dummy(), dummy()], head: dummy(), ring, ph, anim: 'Idle', seatH: 1.31 };
  preload(L).then(gl => {
    if (!gl) return; const model = skClone(gl.scene); recolor(model, L);
    const bx = new THREE.Box3().setFromObject(model), h = bx.max.y - bx.min.y || 1, sc = H / h; model.scale.setScalar(sc); model.position.y = -bx.min.y * sc;
    g.remove(ph); g.add(model);
    const mix = new THREE.AnimationMixer(model), acts = {}; for (const c of gl.animations) acts[c.name] = mix.clipAction(c);
    // высота сиденья по позе SitDown
    let seatH = 1.31; const sd = acts.SitDown; if (sd) { sd.play(); sd.time = sd.getClip().duration - .01; mix.update(0); model.updateMatrixWorld(true); let hips = null; model.traverse(o => { if (o.isBone && /^hips/i.test(o.name)) hips = o }); if (hips) { const v = new THREE.Vector3(); hips.getWorldPosition(v); seatH = v.y - g.position.y - .12 } sd.stop() }
    let head = null; model.traverse(o => { if (o.isBone && /^head$/i.test(o.name)) head = o });
    if (head && L.ac) { const a = accessory(L); const ws = new THREE.Vector3(); model.updateMatrixWorld(true); head.getWorldScale(ws); a.scale.setScalar(1 / ws.x * 1.0); a.position.y = .55 / ws.y; head.add(a) }
    Object.assign(g.userData, { model, mix, acts, seatH, cur: null }); MIXERS.add(mix); play(g, g.userData.anim || 'Idle');
  });
  g.scale.setScalar(1);
  return g;
}
export function play(g, name, { once = false, fade = .25 } = {}) {
  const U = g.userData; U.anim = name; if (!U.acts) return; const a = U.acts[name]; if (!a || U.cur === a) return;
  a.reset(); a.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat); a.clampWhenFinished = once; a.enabled = true; a.setEffectiveWeight(1); a.play();
  if (U.cur) U.cur.crossFadeTo(a, fade, false); U.cur = a;
}
export function tickHeroes(dt) { for (const m of MIXERS) m.update(dt) }
export function dispose(g) { if (g && g.userData && g.userData.mix) MIXERS.delete(g.userData.mix) }
export function walk(g, t, on) { const U = g.userData; if (!U.acts) { if (U.ph) walkBlocky(U.ph, t, on); return } const want = on ? 'Walk' : 'Idle'; if (U.anim === 'Walk' || U.anim === 'Idle' || U.anim === 'Victory' && !U.cur?.isRunning?.()) play(g, want) }
