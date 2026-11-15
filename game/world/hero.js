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
  if (ac === 'panama') { m(new THREE.CylinderGeometry(.85, .95, .08, 24), M2('#c9b07a'), 0, -.02, 0); m(new THREE.CylinderGeometry(.5, .56, .4, 20), M2('#c9b07a'), 0, .18, 0); m(new THREE.CylinderGeometry(.57, .57, .1, 20), M2('#5a7a3a'), 0, .06, 0); m(new THREE.BoxGeometry(.06, .25, .02), M2('#ff6a2a'), .45, .2, .3) }
  if (ac === 'santa') { m(new THREE.CylinderGeometry(.62, .62, .2, 20), M2('#ffffff'), 0, 0, 0); const c = m(new THREE.ConeGeometry(.55, 1.1, 16), M2('#d62828'), .12, .6, 0); c.rotation.z = -.35; m(new THREE.SphereGeometry(.16, 10, 8), M2('#ffffff'), .42, 1.08, 0) }
  if (ac === 'antlers') { for (const sx of [-1, 1]) { const a = m(new THREE.CylinderGeometry(.06, .08, .8, 6), M2('#8a5a2b'), sx * .35, .35, 0); a.rotation.z = -sx * .4; const b = m(new THREE.CylinderGeometry(.05, .06, .4, 6), M2('#8a5a2b'), sx * .58, .62, .05); b.rotation.z = -sx * 1.1 } }
  if (ac === 'beret') { const b = m(new THREE.CylinderGeometry(.62, .55, .18, 24), M2('#c0392b'), .08, .05, 0); b.rotation.z = -.2; m(new THREE.SphereGeometry(.06, 8, 6), M2('#c0392b'), .1, .17, 0) }
  if (ac === 'pirate') { const h = m(new THREE.CylinderGeometry(.55, .6, .4, 3), M2('#1a1a1a'), 0, .2, 0); h.rotation.y = Math.PI / 2; h.scale.set(1.6, 1, 1); m(new THREE.CircleGeometry(.14, 12), M2('#ffffff'), 0, .25, .5); m(new THREE.BoxGeometry(.5, .04, .02), M2('#ffd34d'), 0, .05, .48) }
  if (ac === 'viking') { m(new THREE.SphereGeometry(.6, 18, 10, 0, 6.3, 0, 1.6), M2('#9aa3ad', { metalness: .8, roughness: .3 }), 0, -.12, 0); m(new THREE.TorusGeometry(.6, .05, 6, 24), M2('#b8862a', { metalness: .8 }), 0, -.12, 0).rotation.x = Math.PI / 2; for (const x of [-1, 1]) { const h = m(new THREE.ConeGeometry(.12, .7, 10), M2('#f4ead2'), x * .62, .2, 0); h.rotation.z = -x * .9 } }
  if (fc === 'mask') { m(new THREE.BoxGeometry(.8, .2, .1), M2('#1a1a8a'), 0, -.57, .54) }
  return g;
}

const FLD = { ru: [['#fff', '#0039a6', '#d52b1e']], kz: ['#00afca', 'sun', '#fec50c'], kg: ['#e8112d', 'sun', '#ffef00'], uz: [['#0099b5', '#fff', '#1eb53a']], tj: [['#cc0000', '#fff', '#006600'], 'dot', '#f8c300'], az: [['#00b5e2', '#ef3340', '#509e2f'], 'cres', '#fff'], tr: ['#e30a17', 'cres', '#fff'], dag: [['#1e9e3a', '#1c5fb8', '#d52b1e']], che: [['#1e9e3a', '#1e9e3a', '#1e9e3a', '#fff', '#d52b1e', '#d52b1e']], ing: [['#1e9e3a', '#fff', '#fff', '#fff', '#1e9e3a'], 'sun', '#d52b1e'], am: [['#d90012', '#0033a0', '#f2a800']], by: [['#cf101a', '#cf101a', '#007d2c']], city: ['#5b3fd8', 'txt', '🏙'], pirate: ['#111', 'txt', '☠️'] };
const FLT = {};
function flagTex(k) { if (FLT[k]) return FLT[k]; const d = FLD[k] || FLD.city, c = document.createElement('canvas'); c.width = 192; c.height = 128; const g = c.getContext('2d');
  if (Array.isArray(d[0])) { const n = d[0].length; d[0].forEach((col, i) => { g.fillStyle = col; g.fillRect(0, i * 128 / n, 192, 128 / n + 1) }) } else { g.fillStyle = d[0]; g.fillRect(0, 0, 192, 128) }
  if (d[1] === 'sun') { g.fillStyle = d[2]; g.beginPath(); g.arc(96, 64, 26, 0, 7); g.fill() } else if (d[1] === 'dot') { g.fillStyle = d[2]; g.beginPath(); g.arc(96, 64, 10, 0, 7); g.fill() } else if (d[1] === 'cres') { g.fillStyle = d[2]; g.beginPath(); g.arc(80, 64, 26, 0, 7); g.fill(); g.fillStyle = k === 'tr' ? '#e30a17' : '#ef3340'; g.beginPath(); g.arc(88, 64, 21, 0, 7); g.fill(); g.fillStyle = d[2]; g.beginPath(); g.arc(118, 64, 8, 0, 7); g.fill() } else if (d[1] === 'txt') { g.font = '80px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(d[2], 96, 68) }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return FLT[k] = t }
function armorItem(L) { const k = L.ar; const C = { ar_leather: ['#6a4020', { roughness: .85 }, '#3a2410'], ar_chain: ['#b4bcc6', { metalness: .35, roughness: .45 }, '#6a7078'], ar_plate: ['#eef2f6', { metalness: .4, roughness: .25 }, '#c9a227'], ar_skard: ['#3a0e16', { metalness: .3, roughness: .4 }, '#ff2a4a'], ar_gold: ['#ffcc40', { metalness: .45, roughness: .2, emissive: '#5a3a00', emissiveIntensity: .4 }, '#fff0a0'] }[k]; if (!C) return null;
  const g = new THREE.Group(), M = new THREE.MeshStandardMaterial({ color: C[0], ...C[1] }), M2 = new THREE.MeshStandardMaterial({ color: C[2], metalness: .35, roughness: .35, emissive: k === 'ar_skard' ? '#a00018' : '#000', emissiveIntensity: .7 });
  const add = (geo, m, x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); o.scale.set(sx, sy, sz); o.castShadow = true; g.add(o); return o };
  const cyl = new THREE.CylinderGeometry(.5, .46, .78, 18, 1, true); add(cyl, new THREE.MeshStandardMaterial({ color: C[0], ...C[1], side: THREE.DoubleSide }), 0, -.5, 0, 0, 0, 0, .86, 1, .62);
  add(new THREE.BoxGeometry(.5, .5, .06), M, 0, -.42, .31, -.08); add(new THREE.BoxGeometry(.06, .5, .02), M2, 0, -.42, .35, -.08);
  for (const sx of [-1, 1]) { const sh = add(new THREE.SphereGeometry(.2, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), M, sx * .44, -.08, 0, 0, 0, sx * -.35, 1, .8, 1.05); if (k === 'ar_skard') for (let i = 0; i < 3; i++) add(new THREE.ConeGeometry(.04, .2, 6), M2, sx * (.42 + i * .05), .05 + i * .02, -.06 + i * .06, 0, 0, sx * -.6); if (k === 'ar_plate' || k === 'ar_gold') add(new THREE.TorusGeometry(.19, .02, 6, 16, Math.PI), M2, sx * .44, -.08, 0, 0, Math.PI / 2, sx * -.35) }
  add(new THREE.CylinderGeometry(.46, .46, .09, 18), M2, 0, -.88, 0, 0, 0, 0, .86, 1, .64); add(new THREE.BoxGeometry(.13, .11, .04), new THREE.MeshStandardMaterial({ color: '#c9a227', metalness: .9, roughness: .2 }), 0, -.88, .29);
  if (k === 'ar_chain') for (let i = 0; i < 4; i++) add(new THREE.TorusGeometry(.43, .008, 4, 24), M2, 0, -.25 - i * .17, 0, Math.PI / 2, 0, 0, .86, .62, 1);
  if (k === 'ar_leather') for (const sx of [-.12, .12]) add(new THREE.BoxGeometry(.04, .55, .02), M2, sx, -.45, .33, -.08);
  if (k === 'ar_skard') add(new THREE.SphereGeometry(.07, 10, 8), new THREE.MeshBasicMaterial({ color: '#ff2a4a' }), 0, -.35, .35);
  return g }
function backWeapon(L) { const k = L.cw; if (!k || !/^w_/.test(k)) return null; const g = new THREE.Group(); const steel = new THREE.MeshStandardMaterial({ color: k === 'w_flame' ? '#ff6a2a' : k === 'w_legend' ? '#ffe9a0' : k === 'w_shadow' ? '#3a3a5a' : '#dfe6ee', metalness: .85, roughness: .22, emissive: k === 'w_flame' ? '#a02000' : k === 'w_legend' ? '#806000' : '#000' }), wood = new THREE.MeshStandardMaterial({ color: '#5a3a1a', roughness: .8 }), gold = new THREE.MeshStandardMaterial({ color: '#d4a52a', metalness: .8, roughness: .25 }), dark = new THREE.MeshStandardMaterial({ color: '#2a1a10', roughness: .7 });
  if (/bow/.test(k) || k === 'w_elf' || k === 'w_hunt') { const bow = new THREE.Mesh(new THREE.TorusGeometry(.62, .035, 6, 22, Math.PI), k === 'w_elf' ? new THREE.MeshStandardMaterial({ color: '#3aa05a' }) : k === 'w_hunt' ? gold : wood); bow.rotation.set(0, Math.PI / 2, Math.PI / 2); g.add(bow); const st = new THREE.Mesh(new THREE.CylinderGeometry(.006, .006, 1.24, 4), new THREE.MeshBasicMaterial({ color: '#eee' })); g.add(st); const q = new THREE.Mesh(new THREE.CylinderGeometry(.09, .08, .6, 10), dark); q.position.set(.18, .05, -.05); g.add(q); for (let i = 0; i < 4; i++) { const f = new THREE.Mesh(new THREE.ConeGeometry(.03, .1, 4), new THREE.MeshBasicMaterial({ color: ['#ff4a4a', '#fff', '#4ad9ff', '#ffd34d'][i] })); f.position.set(.14 + (i % 2) * .07, .4, -.05 + (i > 1 ? .04 : -.02)); g.add(f) } g.rotation.z = .5 }
  else { const Lb = k === 'w_knife' || k === 'w_shadow' ? .45 : k === 'w_legend' ? 1.15 : .95; const sc = new THREE.Mesh(new THREE.BoxGeometry(.1, Lb * .9, .05), dark); sc.position.y = -Lb * .45; g.add(sc); const b = new THREE.Mesh(new THREE.BoxGeometry(.05, .2, .03), steel); b.position.y = .02; g.add(b); const gd = new THREE.Mesh(new THREE.BoxGeometry(.3, .06, .08), gold); gd.position.y = .1; g.add(gd); const hd = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, .26, 8), wood); hd.position.y = .25; g.add(hd); const pm = new THREE.Mesh(new THREE.SphereGeometry(.05, 8, 6), gold); pm.position.y = .4; g.add(pm); g.rotation.z = -.7; g.position.y = .2 }
  return g }
function flagItem(L) { const g = new THREE.Group(); const k = String(L.fl).replace('flag_', ''); const p = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 5, 8), new THREE.MeshStandardMaterial({ color: '#d9d9e4', metalness: .7, roughness: .25 })); p.position.set(.55, 1.6, -.55); g.add(p); const tip = new THREE.Mesh(new THREE.SphereGeometry(.13, 10, 8), new THREE.MeshStandardMaterial({ color: '#ffd34d', metalness: .9, roughness: .2 })); tip.position.set(.55, 4.15, -.55); g.add(tip);
  const geo = new THREE.PlaneGeometry(2.2, 1.45, 14, 4); geo.translate(1.1, 0, 0); const f = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: flagTex(k), side: THREE.DoubleSide, roughness: .85 })); f.position.set(.58, 3.3, -.55); f.name = 'flag'; f.userData.base = Float32Array.from(geo.attributes.position.array); g.add(f); FLAGS.add(f); return g }

const WHEELS = new Set();
export function vehicle(k) { const g = new THREE.Group(), M3 = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .5, ...o }); const B = (w, h, d, c, x, y, z, o) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M3(c, o)); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m };
  const W = (r, w, x, y, z, c = '#1a1a1a') => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, w, 16), M3(c)); m.rotation.z = Math.PI / 2; m.position.set(x, y, z); g.add(m); WHEELS.add(m); const hb = new THREE.Mesh(new THREE.CylinderGeometry(r * .45, r * .45, w + .02, 10), M3('#c9ccd8', { metalness: .8, roughness: .2 })); hb.rotation.z = Math.PI / 2; hb.position.set(x, y, z); g.add(hb); return m };
  let seat = 1;
  if (k === 'scooter') { B(.5, .1, 1.8, '#3a8fd8', 0, .3, 0); W(.22, .12, 0, .22, .85); W(.22, .12, 0, .22, -.85); const pl = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, 1.8, 8), M3('#c9ccd8', { metalness: .7 })); pl.position.set(0, 1.2, .8); g.add(pl); B(.9, .08, .08, '#222', 0, 2.05, .8); seat = .45 }
  if (k === 'bike') { const fr = M3('#e8433a'); for (const [x1, y1, z1, x2, y2, z2] of [[0, .55, -.7, 0, 1.15, 0], [0, 1.15, 0, 0, .55, .75], [0, 1.15, 0, 0, 1.55, .6], [0, .55, -.7, 0, 1.2, -.35]]) { const a = new THREE.Vector3(x1, y1, z1), b = new THREE.Vector3(x2, y2, z2), L = a.distanceTo(b), m = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, L, 6), fr); m.position.copy(a).add(b).multiplyScalar(.5); m.lookAt(b); m.rotateX(Math.PI / 2); g.add(m) } W(.55, .08, 0, .55, .8); W(.55, .08, 0, .55, -.75); B(.3, .1, .45, '#222', 0, 1.3, -.35); B(.8, .07, .07, '#222', 0, 1.6, .62); seat = 1.05 }
  if (k === 'moto') { B(.6, .55, 1.9, '#1d1d1d', 0, .85, 0); B(.62, .35, .9, '#e8433a', 0, 1.25, .35); B(.5, .2, .8, '#111', 0, 1.2, -.45); W(.42, .3, 0, .42, .95); W(.42, .3, 0, .42, -.95); B(1, .08, .08, '#c9ccd8', 0, 1.55, .85, { metalness: .8 }); B(.25, .2, .1, '#ffe08a', 0, 1.2, 1.05, { emissive: '#ffcc33', emissiveIntensity: 1 }); seat = 1.15 }
  if (k === 'horse') { const hc = '#7a4a24'; B(.9, .9, 2.2, hc, 0, 1.55, 0); B(.5, 1.1, .55, hc, 0, 2.3, 1.1).rotation.x = -.5; B(.45, .45, .9, hc, 0, 2.75, 1.55); for (const [x, z] of [[-.3, .8], [.3, .8], [-.3, -.8], [.3, -.8]]) B(.22, 1.2, .22, '#5a3418', x, .6, z); B(.15, .9, .2, '#2a1a0a', 0, 2.4, .85); B(.12, .8, .12, '#2a1a0a', 0, 1.5, -1.15).rotation.x = .5; B(.95, .12, .9, '#c0392b', 0, 2.03, -.1); seat = 1.95 }
  if (k === 'car' || k === 'sport') { const sp = k === 'sport', c = sp ? '#e8233a' : '#2b6a3a'; B(1.9, sp ? .55 : .8, 3.6, c, 0, sp ? .6 : .8, 0, { metalness: .4, roughness: .35 }); if (!sp) { B(1.6, .5, .06, '#9fd8ff', 0, 1.45, .7, { metalness: .9, roughness: .05, transparent: true, opacity: .6 }); for (const x of [-.85, .85]) B(.08, .9, .08, '#222', x, 1.65, -.9); B(1.78, .08, .08, '#222', 0, 2.1, -.9); B(1.5, .35, .7, '#3a2a1a', 0, 1.25, -.4) } else { B(1.6, .35, 1.2, '#111', 0, 1.02, -.2, { metalness: .9, roughness: .1 }); B(1.9, .08, .4, '#111', 0, 1.15, -1.7) } for (const [x, z] of [[-.95, 1.2], [.95, 1.2], [-.95, -1.2], [.95, -1.2]]) W(sp ? .38 : .45, .3, x, sp ? .38 : .45, z); for (const x of [-.6, .6]) B(.35, .18, .05, '#fff3b0', x, sp ? .7 : .95, 1.81, { emissive: '#ffe08a', emissiveIntensity: 1.2 }); seat = sp ? .75 : 1.0 }
  g.userData.seat = seat; return g }
function balloons() { const g = new THREE.Group(); [['#ff4d6d', -.6, 5.6], ['#ffd34d', 0, 6.1], ['#4dabff', .6, 5.7]].forEach(([c, x, y], i) => { const b = new THREE.Mesh(new THREE.SphereGeometry(.45, 14, 10), new THREE.MeshStandardMaterial({ color: c, roughness: .3, metalness: .1 })); b.scale.y = 1.2; b.position.set(x, y, -.3); g.add(b); const st = new THREE.Mesh(new THREE.CylinderGeometry(.01, .01, 2.4, 4), new THREE.MeshBasicMaterial({ color: '#ffffff' })); st.position.set(x * .5, y - 1.5, -.3); g.add(st) }); g.name = 'balloons'; return g }
function backItem(L) {
  const g = new THREE.Group(), M2 = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .6, side: THREE.DoubleSide, ...o }); const bk = L.bk;
  const BX = (w, h, d, c, x, y, z, o) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M2(c, o)); b.position.set(x, y, z); g.add(b); return b }, SP = (r, c, x, y, z, o) => { const b = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), M2(c, o)); b.position.set(x, y, z); g.add(b); return b };
  if (bk === 'backpack' || (bk && bk.startsWith('bp_'))) { const sc = { bp_school: '#e8433a', bp_travel: '#3a2a1a', bp_cat: '#ff6fa8', bp_teddy: '#7a4a20', bp_winter: '#58a8ff', bp_neon: '#ff3df2', bp_rocket: '#555', bp_dragon: '#1e8a3a', bp_gold: '#d4a017', backpack: '#1e6a3a' }[bk] || '#333'; for (const sx of [-.28, .28]) { const st = new THREE.Mesh(new THREE.BoxGeometry(.11, .8, .07), M2(sc, bk === 'bp_neon' ? { emissive: sc, emissiveIntensity: .8 } : bk === 'bp_gold' ? { metalness: .9, roughness: .2 } : {})); st.position.set(sx, -.5, .38); g.add(st); const tp = new THREE.Mesh(new THREE.BoxGeometry(.11, .07, .8), M2(sc)); tp.position.set(sx, -.1, -.02); g.add(tp) } }
  if (bk === 'bp_school') { BX(.85, .95, .4, '#3a8fd8', 0, 0, -.45); BX(.7, .35, .12, '#f2c230', 0, -.18, -.68); BX(.1, .9, .06, '#e8433a', -.3, 0, -.25); BX(.1, .9, .06, '#e8433a', .3, 0, -.25) }
  if (bk === 'bp_travel') { BX(.9, 1.3, .5, '#4f6b3a', 0, .1, -.5); BX(.8, .3, .3, '#c89a5a', 0, -.45, -.72); const r = new THREE.Mesh(new THREE.CylinderGeometry(.18, .18, 1.1, 12), M2('#c0392b')); r.rotation.z = Math.PI / 2; r.position.set(0, .85, -.5); g.add(r) }
  if (bk === 'bp_cat') { SP(.5, '#ff9ec7', 0, 0, -.5); for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.ConeGeometry(.16, .3, 4), M2('#ff9ec7')); e.position.set(s * .28, .48, -.5); g.add(e) } SP(.06, '#222', -.15, .08, -.95); SP(.06, '#222', .15, .08, -.95); SP(.05, '#ff5a8a', 0, -.05, -.98) }
  if (bk === 'bp_teddy') { SP(.5, '#a0703a', 0, -.05, -.52); SP(.3, '#a0703a', 0, .5, -.55); for (const s of [-1, 1]) SP(.11, '#a0703a', s * .22, .75, -.55); SP(.05, '#111', -.1, .55, -.84); SP(.05, '#111', .1, .55, -.84); SP(.08, '#e8c39a', 0, .44, -.84) }
  if (bk === 'bp_winter') { BX(.85, 1, .42, '#dff3ff', 0, 0, -.46); BX(.88, .25, .45, '#ffffff', 0, .5, -.46); const f = new THREE.Mesh(new THREE.TorusGeometry(.2, .03, 6, 6), M2('#58a8ff', { emissive: '#2a6aff', emissiveIntensity: .6 })); f.position.set(0, -.05, -.69); g.add(f) }
  if (bk === 'bp_neon') { BX(.85, 1, .4, '#1a0f3a', 0, 0, -.45); for (const [y, c] of [[.35, '#ff3df2'], [0, '#3dfff2'], [-.35, '#ff3df2']]) BX(.9, .06, .44, c, 0, y, -.45, { emissive: c, emissiveIntensity: 1.2 }) }
  if (bk === 'bp_rocket') { for (const s of [-1, 1]) { const t = new THREE.Mesh(new THREE.CylinderGeometry(.2, .2, 1, 14), M2('#c9ccd8', { metalness: .7, roughness: .3 })); t.position.set(s * .25, 0, -.5); g.add(t); const n = new THREE.Mesh(new THREE.ConeGeometry(.2, .3, 14), M2('#e8433a')); n.position.set(s * .25, .65, -.5); g.add(n); const fl = new THREE.Mesh(new THREE.ConeGeometry(.15, .5, 10), M2('#ffb300', { emissive: '#ff6a00', emissiveIntensity: 1.5, transparent: true, opacity: .85 })); fl.rotation.x = Math.PI; fl.position.set(s * .25, -.75, -.5); fl.name = 'flame'; g.add(fl); FLAMES.add(fl) } }
  if (bk === 'bp_dragon') { SP(.45, '#2bb24c', 0, 0, -.5); for (const s of [-1, 1]) { const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(s * .9, .5); sh.lineTo(s * .7, .1); sh.lineTo(s * .95, -.1); sh.lineTo(s * .5, -.25); sh.lineTo(0, -.2); const w = new THREE.Mesh(new THREE.ShapeGeometry(sh), M2('#1e8a3a')); w.position.set(s * .2, .2, -.6); g.add(w) } for (let i = 0; i < 3; i++) { const sp = new THREE.Mesh(new THREE.ConeGeometry(.08, .2, 4), M2('#ffd34d')); sp.position.set(0, .3 - i * .25, -.95); sp.rotation.x = -Math.PI / 2; g.add(sp) } }
  if (bk === 'bp_gold') { BX(.85, 1, .42, '#d4a017', 0, 0, -.46, { metalness: .9, roughness: .2, emissive: '#5a4000' }); BX(.6, .3, .1, '#fff3c0', 0, -.2, -.7, { metalness: .9, roughness: .15 }); const c = new THREE.Mesh(new THREE.ConeGeometry(.12, .2, 5), M2('#ffd34d', { metalness: 1, roughness: .1, emissive: '#806000' })); c.position.set(0, .2, -.72); c.rotation.x = -Math.PI / 2; g.add(c) }
  if (bk === 'backpack') { const b = new THREE.Mesh(new THREE.BoxGeometry(.8, .9, .4), M2('#2b8a4a')); b.position.set(0, 0, -.45); g.add(b) }
  if (bk === 'rod' || bk === 'rod_gold') { const gold = bk === 'rod_gold', rm = M2(gold ? '#ffc65c' : '#6b4220', gold ? { metalness: .9, roughness: .2, emissive: '#6a4a00' } : {}); const r = new THREE.Mesh(new THREE.CylinderGeometry(.03, .05, 3, 8), rm); r.position.set(.25, .4, -.48); r.rotation.z = -.5; g.add(r); const rl = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, .1, 12), M2(gold ? '#fff3a0' : '#333')); rl.position.set(.05, .05, -.5); rl.rotation.x = Math.PI / 2; g.add(rl) }
  if (bk === 'cape') { const c = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.8, 1, 6), M2('#c0392b')); c.position.set(0, -.6, -.42); c.rotation.x = .12; c.name = 'cape'; g.add(c) }
  if (bk && bk.startsWith('wings')) { const col = bk === 'wings_angel' ? ['#ffffff', '#fff3d0'] : bk === 'wings_demon' ? ['#2a0a1a', '#8a1a2a'] : ['#4fc3ff', '#ff6fb5'];
    for (const s of [-1, 1]) { const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.bezierCurveTo(s * .6, .9, s * 1.6, 1, s * 1.8, .3); sh.bezierCurveTo(s * 1.4, -.2, s * .8, -.7, 0, -.3); const w = new THREE.Mesh(new THREE.ShapeGeometry(sh), M2(col[0], { emissive: col[1], emissiveIntensity: .25 })); w.position.set(s * .1, .1, -.42); w.rotation.y = s * .45; w.name = 'wing' + s; g.add(w) } }
  return g;
}
function auraItem(L) {
  const au = L.au; if (!au) return null; const g = new THREE.Group(); g.name = 'aura';
  const col = { aura_gold: '#ffd34d', aura_fire: '#ff6a2a', aura_love: '#ff5a8a', aura_snow: '#bfe8ff', aura_water: '#3ac8ff' }[au] || '#ffd34d';
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.1, 1.5, 40), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: .55, side: THREE.DoubleSide, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.y = .06; g.add(ring);
  const pm = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: .9 });
  for (let i = 0; i < 14; i++) { const p = new THREE.Mesh(au === 'aura_snow' ? new THREE.OctahedronGeometry(.09) : new THREE.SphereGeometry(.08, 6, 4), pm); p.userData.a = i / 14 * 6.283; p.userData.h = Math.random() * 3.4; g.add(p) }
  return g;
}
const AURAS = new Set(), FLAGS = new Set(), FLAMES = new Set();

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
    if (torso && L.bk) { const bkI = backItem(L); torso.getWorldScale(ws); bkI.scale.setScalar((/^bp_|^backpack$/.test(L.bk) ? 1.3 : 1) / ws.x); bkI.position.y = .5 / ws.y; torso.add(bkI); g.userData.back = bkI }
    if (torso && L.ar) { const aI = armorItem(L); if (aI) { torso.getWorldScale(ws); aI.scale.setScalar(1.32 / ws.x); aI.position.y = .62 / ws.y; torso.add(aI) } }
    if (torso && L.cw && !L.bk) { const wI = backWeapon(L); if (wI) { torso.getWorldScale(ws); const w2 = new THREE.Group(); w2.add(wI); w2.scale.setScalar(1 / ws.x); w2.position.set(0, .05 / ws.y, -.36 / ws.z); torso.add(w2) } }
    if (torso && L.fl) { const fI = flagItem(L); torso.getWorldScale(ws); fI.scale.setScalar(1 / ws.x); fI.position.y = .3 / ws.y; torso.add(fI) }
    const au = auraItem(L); if (au) { g.add(au); AURAS.add(au) }
    if (L.bd) g.add(balloons());
    if (L.vh) { const v = vehicle(L.vh); g.add(v); g.userData.veh = v; if (L.vh === 'scooter') { model.position.y = .38; model.position.z = -.2; g.userData.scoot = true } else { model.position.y = v.userData.seat - seatH + .1 + (L.vh === 'car' || L.vh === 'sport' ? 0 : .15); if (L.vh === 'car' || L.vh === 'sport') model.position.z = -.35; g.userData.anim = 'SitDown'; g.userData.ride = true } }
    Object.assign(g.userData, { model, mix, acts, seatH, cur: null }); MIXERS.add(mix); if (g.userData.ride) play(g, 'SitDown', { once: true, fade: 0 }); else if (g.userData.scoot) { play(g, 'Idle'); g.userData.anim = 'Scoot'; model.rotation.x = .08 } else play(g, g.userData.anim || 'Idle');
  });
  g.scale.setScalar(1);
  return g;
}
export function play(g, name, { once = false, fade = .25 } = {}) {
  const U = g.userData; if ((U.scoot || U.ride) && (name === 'Walk' || name === 'Run')) name = U.ride ? 'SitDown' : 'Idle'; U.anim = U.scoot && name === 'Idle' ? 'Scoot' : name; if (!U.acts) return; const a = U.acts[name]; if (!a || U.cur === a) return;
  a.reset(); a.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat); a.clampWhenFinished = once; a.enabled = true; a.setEffectiveWeight(1); a.play();
  if (U.cur) U.cur.crossFadeTo(a, fade, false); U.cur = a;
}
let AT = 0;
export function tickHeroes(dt) { for (const m of MIXERS) m.update(dt); AT += dt;
  for (const f of FLAGS) { if (!f.parent) { FLAGS.delete(f); continue } const a = f.geometry.attributes.position, b = f.userData.base; for (let i = 0; i < a.count; i++) { const x = b[i * 3]; a.array[i * 3 + 2] = Math.sin(x * 2.6 - AT * 5) * .16 * x / 2.2; a.array[i * 3 + 1] = b[i * 3 + 1] - x * x * .02 } a.needsUpdate = true }
  for (const w of WHEELS) { if (!w.parent) { WHEELS.delete(w); continue } const gp = w.parent.parent; if (gp && gp.userData.moving) w.rotation.x += dt * 9 }
  for (const fl of FLAMES) { if (!fl.parent) { FLAMES.delete(fl); continue } fl.scale.set(1, .8 + Math.random() * .5, 1) }
  for (const a of AURAS) { if (!a.parent) { AURAS.delete(a); continue } a.children.forEach((p, i) => { if (i === 0) { p.rotation.z = AT * .8; p.material.opacity = .4 + .2 * Math.sin(AT * 3); return } const an = p.userData.a + AT * 1.2; p.position.set(Math.cos(an) * 1.3, (p.userData.h + AT * .9) % 3.6, Math.sin(an) * 1.3) }) }
}
export function dispose(g) { if (g && g.userData && g.userData.mix) MIXERS.delete(g.userData.mix) }
export function walk(g, t, on) { const U = g.userData; if (U.scoot || U.ride) return; if (!U.acts) { if (U.ph) walkBlocky(U.ph, t, on); return } const want = on ? 'Walk' : 'Idle'; if (U.anim === 'Walk' || U.anim === 'Idle' || U.anim === 'Victory' && !U.cur?.isRunning?.()) play(g, want) }
