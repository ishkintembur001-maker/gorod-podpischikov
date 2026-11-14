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
const OUT = { doctor: { m: 'Doctor_Male_Young', f: 'Doctor_Female_Young' }, worker: { m: 'Worker_Male', f: 'Worker_Female' }, classic: { m: 'OldClassy_Male', f: 'OldClassy_Female' }, suit: { m: 'Suit_Male', f: 'Suit_Female' } };
const varOf = L => { const g = L.g === 'f' ? 'f' : 'm'; return OUT[L.ot] ? OUT[L.ot][g] : (VAR[g][L.hs | 0] || 'Casual_Male') };
function loadVar(name) { return CACHE[name] || (CACHE[name] = new Promise((res, rej) => LOADER.load(BASE + name + '.glb', res, undefined, rej))) }
export function preload(look) { const L = { ...DEF, ...(look || {}) }; return loadVar(varOf(L)).catch(() => null) }
function recolor(model, L) { const full = !OUT[L.ot];
  model.traverse(o => { if (!o.isMesh) return; o.castShadow = true; o.frustumCulled = false; const ms = Array.isArray(o.material) ? o.material : [o.material];
    const nm = ms.map(m => { const c = m.clone(), n = (m.name || '').toLowerCase(); if (/skin/.test(n)) c.color.set(L.sk); else if (/hair|beard|eyebrow/.test(n)) c.color.set(L.hc); else if (full && /shirt|top|jacket|hood|coat|vest|dress/.test(n)) c.color.set(L.sh); else if (full && /pant|trouser|jean|short|skirt|leg/.test(n)) c.color.set(L.pa); c.roughness = .75; c.metalness = 0; return c });
    o.material = Array.isArray(o.material) ? nm : nm[0] });
}
function accessory(L) {
  const g = new THREE.Group(), M2 = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .6, ...o });
  const m = (geo, mat, x, y, z) => { const o = new THREE.Mesh(geo, mat); o.position.set(x, y, z); o.castShadow = true; g.add(o); return o };
  const ac = L.ac, fc = L.fc;
  if (ac === 'cap') { m(new THREE.SphereGeometry(.56, 18, 8, 0, 6.3, 0, 1.4), M2('#e8433a'), 0, -.05, 0); m(new THREE.BoxGeometry(.6, .05, .45), M2('#e8433a'), 0, -.02, .55) }
  if (ac === 'beanie') { m(new THREE.SphereGeometry(.58, 18, 10, 0, 6.3, 0, 1.55), M2('#3a8bff'), 0, -.1, 0); m(new THREE.SphereGeometry(.14, 10, 8), M2('#ffffff'), 0, .5, 0) }
  if (ac === 'chef') { m(new THREE.CylinderGeometry(.48, .45, .45, 18), M2('#ffffff'), 0, .15, 0); m(new THREE.SphereGeometry(.55, 14, 10), M2('#ffffff'), 0, .55, 0) }
  if (ac === 'bandana') { m(new THREE.SphereGeometry(.57, 18, 8, 0, 6.3, 0, 1.3), M2('#c0392b'), 0, -.08, 0); m(new THREE.ConeGeometry(.15, .45, 6), M2('#c0392b'), 0, -.2, -.6).rotation.x = -1.2 }
  if (ac === 'tubeteika') { const c = m(new THREE.CylinderGeometry(.46, .5, .3, 4), M2('#1a1a1a'), 0, .08, 0); c.rotation.y = Math.PI / 4; const p = m(new THREE.CylinderGeometry(.47, .51, .08, 4), M2('#ffffff'), 0, .08, 0); p.rotation.y = Math.PI / 4 }
  if (ac === 'headphones') { const b = m(new THREE.TorusGeometry(.6, .06, 6, 20, Math.PI), M2('#222'), 0, -.35, 0); for (const x of [-.6, .6]) { const e = m(new THREE.CylinderGeometry(.18, .18, .15, 12), M2('#5ee6b0'), x, -.45, 0); e.rotation.z = Math.PI / 2 } }
  if (ac === 'cowboy') { m(new THREE.CylinderGeometry(1, 1, .06, 24), M2('#8a5a2a'), 0, 0, 0); m(new THREE.CylinderGeometry(.42, .5, .5, 18), M2('#8a5a2a'), 0, .25, 0) }
  if (ac === 'tophat') { m(new THREE.CylinderGeometry(.8, .8, .05, 24), M2('#111'), 0, 0, 0); m(new THREE.CylinderGeometry(.45, .45, .8, 20), M2('#111'), 0, .4, 0); m(new THREE.CylinderGeometry(.46, .46, .12, 20), M2('#c0392b'), 0, .1, 0) }
  if (ac === 'crown') { const c = m(new THREE.CylinderGeometry(.46, .4, .4, 5, 1, true), M2('#ffc65c', { metalness: .9, roughness: .2, emissive: '#6a4a00', side: THREE.DoubleSide }), 0, .3, 0); for (let i = 0; i < 5; i++) m(new THREE.SphereGeometry(.07, 8, 6), M2('#e8433a', { emissive: '#600' }), Math.cos(i * 1.257) * .44, .45, Math.sin(i * 1.257) * .44) }
  if (ac === 'halo') { const h = m(new THREE.TorusGeometry(.42, .06, 8, 28), M2('#fff3a0', { emissive: '#ffd34d', emissiveIntensity: 1.5 }), 0, .75, 0); h.rotation.x = Math.PI / 2; h.name = 'float' }
  if (ac === 'horns') { for (const x of [-.28, .28]) { const h = m(new THREE.ConeGeometry(.1, .45, 10), M2('#c0392b', { emissive: '#400' }), x, .35, .1); h.rotation.z = -x * 1.2 } }
  if (ac === 'wizard') { m(new THREE.CylinderGeometry(.9, .9, .05, 24), M2('#3a2a8a'), 0, 0, 0); const c = m(new THREE.ConeGeometry(.5, 1.4, 18), M2('#3a2a8a'), 0, .7, 0); c.rotation.z = .15; for (let i = 0; i < 4; i++) m(new THREE.OctahedronGeometry(.07), M2('#ffd34d', { emissive: '#aa8800' }), Math.cos(i * 1.6) * .35, .4 + i * .2, Math.sin(i * 1.6) * .3) }
  if (fc === 'glasses' || fc === 'sunglasses') { const mat = fc === 'glasses' ? M2('#111') : M2('#0a0a0a', { metalness: .6, roughness: .1 }); for (const x of [-.2, .2]) { const r = fc === 'glasses' ? m(new THREE.TorusGeometry(.14, .03, 6, 14), mat, x, -.57, .55) : m(new THREE.BoxGeometry(.3, .16, .05), mat, x, -.57, .56) } m(new THREE.BoxGeometry(.14, .03, .03), mat, 0, -.55, .56) }
  if (fc === 'mask') { m(new THREE.BoxGeometry(.8, .2, .1), M2('#1a1a8a'), 0, -.57, .54) }
  return g;
}
function backItem(L) {
  const g = new THREE.Group(), M2 = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .6, side: THREE.DoubleSide, ...o }); const bk = L.bk;
  if (bk === 'backpack') { const b = new THREE.Mesh(new THREE.BoxGeometry(.8, .9, .4), M2('#2b8a4a')); b.position.set(0, 0, -.45); g.add(b) }
  if (bk === 'cape') { const c = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.8, 1, 6), M2('#c0392b')); c.position.set(0, -.6, -.42); c.rotation.x = .12; c.name = 'cape'; g.add(c) }
  if (bk && bk.startsWith('wings')) { const col = bk === 'wings_angel' ? ['#ffffff', '#fff3d0'] : bk === 'wings_demon' ? ['#2a0a1a', '#8a1a2a'] : ['#4fc3ff', '#ff6fb5'];
    for (const s of [-1, 1]) { const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.bezierCurveTo(s * .6, .9, s * 1.6, 1, s * 1.8, .3); sh.bezierCurveTo(s * 1.4, -.2, s * .8, -.7, 0, -.3); const w = new THREE.Mesh(new THREE.ShapeGeometry(sh), M2(col[0], { emissive: col[1], emissiveIntensity: .25 })); w.position.set(s * .1, .1, -.42); w.rotation.y = s * .45; w.name = 'wing' + s; g.add(w) } }
  return g;
}
function auraItem(L) {
  const au = L.au; if (!au) return null; const g = new THREE.Group(); g.name = 'aura';
  const col = { aura_gold: '#ffd34d', aura_fire: '#ff6a2a', aura_love: '#ff5a8a', aura_snow: '#bfe8ff' }[au] || '#ffd34d';
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.1, 1.5, 40), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: .55, side: THREE.DoubleSide, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.y = .06; g.add(ring);
  const pm = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: .9 });
  for (let i = 0; i < 14; i++) { const p = new THREE.Mesh(au === 'aura_snow' ? new THREE.OctahedronGeometry(.09) : new THREE.SphereGeometry(.08, 6, 4), pm); p.userData.a = i / 14 * 6.283; p.userData.h = Math.random() * 3.4; g.add(p) }
  return g;
}
const AURAS = new Set();

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
    const ws = new THREE.Vector3(); model.updateMatrixWorld(true);
    if (head && (L.ac || L.fc)) { const a = accessory(L); head.getWorldScale(ws); a.scale.setScalar(1 / ws.x); a.position.y = .7 / ws.y; head.add(a) }
    let torso = null; model.traverse(o => { if (o.isBone && /^(torso|chest|spine2?)$/i.test(o.name) && !torso) torso = o });
    if (torso && L.bk) { const bkI = backItem(L); torso.getWorldScale(ws); bkI.scale.setScalar(1 / ws.x); bkI.position.y = .5 / ws.y; torso.add(bkI); g.userData.back = bkI }
    const au = auraItem(L); if (au) { g.add(au); AURAS.add(au) }
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
let AT = 0;
export function tickHeroes(dt) { for (const m of MIXERS) m.update(dt); AT += dt;
  for (const a of AURAS) { if (!a.parent) { AURAS.delete(a); continue } a.children.forEach((p, i) => { if (i === 0) { p.rotation.z = AT * .8; p.material.opacity = .4 + .2 * Math.sin(AT * 3); return } const an = p.userData.a + AT * 1.2; p.position.set(Math.cos(an) * 1.3, (p.userData.h + AT * .9) % 3.6, Math.sin(an) * 1.3) }) }
}
export function dispose(g) { if (g && g.userData && g.userData.mix) MIXERS.delete(g.userData.mix) }
export function walk(g, t, on) { const U = g.userData; if (!U.acts) { if (U.ph) walkBlocky(U.ph, t, on); return } const want = on ? 'Walk' : 'Idle'; if (U.anim === 'Walk' || U.anim === 'Idle' || U.anim === 'Victory' && !U.cur?.isRunning?.()) play(g, want) }
