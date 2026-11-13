// 3D-питомцы и предметы двора вместо смайликов
import * as THREE from './world/three.js';
import { GLTFLoader } from './world/pp/loaders/GLTFLoader.js';
import { MeshoptDecoder } from './world/pp/libs/meshopt_decoder.module.js';
import { clone as skClone } from './world/pp/utils/SkeletonUtils.js';

const LD = new GLTFLoader(); LD.setMeshoptDecoder(MeshoptDecoder);
const BASE = new URL('./world/models/pets/', import.meta.url).href, CACHE = {};
const load = n => CACHE[n] || (CACHE[n] = new Promise((res, rej) => LD.load(BASE + n + '.glb', res, undefined, rej)));
const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .7, ...o });
function P(geo, m, x, y, z, p, sh = true) { const o = new THREE.Mesh(geo, m.isMaterial ? m : M(m)); o.position.set(x, y, z); o.castShadow = sh; o.receiveShadow = true; p.add(o); return o }
const box = (p, w, h, d, m, x, y, z) => P(new THREE.BoxGeometry(w, h, d), m, x, y, z, p);
const cyl = (p, rt, rb, h, m, x, y, z, s = 16) => P(new THREE.CylinderGeometry(rt, rb, h, s), m, x, y, z, p);
const sph = (p, r, m, x, y, z, s = 14) => P(new THREE.SphereGeometry(r, s, s - 4), m, x, y, z, p);
const cone = (p, r, h, m, x, y, z, s = 12) => P(new THREE.ConeGeometry(r, h, s), m, x, y, z, p);

// ---------- живые питомцы (CC0: Quaternius Animated Animals, Vuena Low-Poly Animals) ----------
const GL = {
  dogs: ['Husky', 1.25], horse: ['Horse', 2.3], cats: ['cat', .75], owl: ['owl', .7], fox: ['fox', .85],
  goat: ['Alpaca', 1.4, { Main: '#efe9df', Main_Light: '#ffffff', Main_Dark: '#c9bfae', Muzzle: '#e8c9b0' }],
  unicorn: ['Horse', 2.3, { Main: '#ffffff', Main_Light: '#ffffff', Main_Dark: '#f1e8ff', Hair: '#ff8ad8', Hooves: '#ffc65c' }],
};
function clipOf(acts, ...names) { for (const n of names) { const k = Object.keys(acts).find(a => a.toLowerCase() === n.toLowerCase()); if (k) return acts[k] } return null }
export function pet(k, house) {
  const g = new THREE.Group(); g.userData.k = k;
  if (GL[k]) {
    const [file, h, col] = GL[k];
    load(file).then(gl => {
      const m = skClone(gl.scene);
      m.traverse(o => { if (!o.isMesh) return; if (/LOD0/.test(o.name)) o.visible = false; o.castShadow = true; o.frustumCulled = false;
        if (col) { const ms = Array.isArray(o.material) ? o.material : [o.material]; const nm = ms.map(x => { const c = x.clone(); if (col[x.name]) c.color.set(col[x.name]); return c }); o.material = Array.isArray(o.material) ? nm : nm[0] } });
      m.updateMatrixWorld(true); const bx = new THREE.Box3().setFromObject(m, true); const s = h / Math.max(.01, bx.max.y - bx.min.y); m.scale.setScalar(s); m.position.y = -bx.min.y * s;
      if (k === 'unicorn') { const horn = cone(new THREE.Group(), .09, .7, M('#ffc65c', { metalness: .6, roughness: .3, emissive: '#5a3a00' }), 0, 0, 0); let head = null; m.traverse(o => { if (o.isBone && /head/i.test(o.name) && !head) head = o }); if (head) { const ws = new THREE.Vector3(); m.updateMatrixWorld(true); head.getWorldScale(ws); horn.scale.setScalar(1 / ws.x); horn.position.set(0, .35 / ws.y, .25 / ws.z); horn.rotation.x = .5; head.add(horn) } }
      g.add(m); const mix = new THREE.AnimationMixer(m), acts = {}; for (const c of gl.animations) acts[c.name] = mix.clipAction(c);
      g.userData.mix = mix; g.userData.walk = clipOf(acts, 'Walk'); g.userData.idle = clipOf(acts, 'Idle'); g.userData.eat = clipOf(acts, 'Eating', 'eat'); g.userData.sit = clipOf(acts, 'sit', 'Idle_2');
      (g.userData.idle || g.userData.walk)?.play(); g.userData.cur = g.userData.idle;
    }).catch(() => {});
  } else buildToy(k, g);
  return g;
}
export function petPlay(g, which) { const U = g.userData; const a = U[which]; if (!a || U.cur === a) return; a.reset().play(); if (U.cur) U.cur.crossFadeTo(a, .3, false); U.cur = a }

// игрушечные питомцы, которых нет среди готовых моделей
function buildToy(k, g) {
  const eye = (p, x, y, z, r = .06) => { sph(p, r, M('#ffffff', { roughness: .3 }), x, y, z, 10); sph(p, r * .6, M('#111111', { roughness: .2 }), x, y, z + r * .55, 8) };
  const legs4 = (p, c, w, d, h) => { for (const [x, z] of [[-w, -d], [w, -d], [-w, d], [w, d]]) cyl(p, .07, .06, h, c, x, h / 2, z, 8) };
  if (k === 'chickens') { for (let i = 0; i < 2; i++) { const c = new THREE.Group(); c.position.x = i * .9 - .45; sph(c, .32, '#ffffff', 0, .5, 0); sph(c, .2, '#ffffff', 0, .85, .2); cone(c, .07, .16, '#f2a03a', 0, .82, .42).rotation.x = Math.PI / 2; box(c, .06, .14, .14, '#e8433a', 0, 1.05, .2); eye(c, .1, .9, .33, .04); eye(c, -.1, .9, .33, .04); for (const x of [-.1, .1]) cyl(c, .025, .025, .3, '#f2a03a', x, .15, 0, 6); g.add(c) } }
  if (k === 'rabbit') { sph(g, .38, '#f2f2f2', 0, .4, 0).scale.set(1, .9, 1.2); sph(g, .26, '#f2f2f2', 0, .8, .3); for (const x of [-.1, .1]) { const e = sph(g, .08, '#f2f2f2', x, 1.2, .25); e.scale.set(.8, 3, .6) } eye(g, .1, .85, .52, .045); eye(g, -.1, .85, .52, .045); sph(g, .04, '#ff9aa8', 0, .78, .56); sph(g, .12, '#ffffff', 0, .45, -.45) }
  if (k === 'parrot') { cyl(g, .05, .05, 1.4, '#7a4a2a', 0, .7, 0, 6); box(g, .7, .06, .06, '#7a4a2a', 0, 1.4, 0); const b = new THREE.Group(); b.position.y = 1.45; sph(b, .22, '#2bb24c', 0, .25, 0).scale.y = 1.3; sph(b, .17, '#e8433a', 0, .58, .05); cone(b, .06, .16, '#ffc65c', 0, .55, .25).rotation.x = Math.PI / 2; eye(b, .09, .62, .15, .04); eye(b, -.09, .62, .15, .04); box(b, .1, .4, .1, '#3a8bff', 0, .1, -.22).rotation.x = .5; g.add(b) }
  if (k === 'penguin') { sph(g, .42, '#1c1c2a', 0, .55, 0).scale.y = 1.35; sph(g, .32, '#ffffff', 0, .5, .14).scale.set(1, 1.3, .9); sph(g, .26, '#1c1c2a', 0, 1.18, 0); eye(g, .1, 1.22, .21, .05); eye(g, -.1, 1.22, .21, .05); cone(g, .06, .2, '#f2a03a', 0, 1.13, .3).rotation.x = Math.PI / 2; for (const x of [-.15, .15]) box(g, .16, .05, .25, '#f2a03a', x, .03, .1) }
  if (k === 'turtle') { const s = sph(g, .5, '#3a7a3a', 0, .25, 0); s.scale.set(1, .55, 1.2); sph(g, .18, '#8ac46a', 0, .3, .7); eye(g, .07, .36, .84, .035); eye(g, -.07, .36, .84, .035); for (const [x, z] of [[-.4, -.4], [.4, -.4], [-.4, .4], [.4, .4]]) sph(g, .12, '#8ac46a', x, .1, z) }
  if (k === 'panda' || k === 'lion' || k === 'tiger') {
    const C = { panda: ['#ffffff', '#1c1c1c', '#1c1c1c'], lion: ['#e0a040', '#8a4a1a', '#c08030'], tiger: ['#f08a2a', '#1c1c1c', '#ffffff'] }[k];
    const b = sph(g, .55, C[0], 0, .75, 0); b.scale.set(1, .9, 1.35); legs4(g, C[k === 'panda' ? 1 : 0], .3, .4, .5);
    if (k === 'lion') { const mane = sph(g, .52, C[1], 0, 1.25, .55); mane.scale.set(1, 1, .7) }
    sph(g, .38, C[0], 0, 1.25, .7); for (const x of [-.25, .25]) sph(g, .12, k === 'panda' ? C[1] : C[0], x, 1.58, .62);
    if (k === 'panda') for (const x of [-.13, .13]) sph(g, .1, C[1], x, 1.3, .98).scale.set(1, 1.3, .5);
    if (k === 'tiger') for (let i = 0; i < 4; i++) box(g, .9, .06, .14, C[1], 0, 1.05, -.4 + i * .3);
    eye(g, .13, 1.32, 1.02, .06); eye(g, -.13, 1.32, 1.02, .06); sph(g, .08, '#2a1a1a', 0, 1.18, 1.06);
    const tail = cyl(g, .05, .03, .7, C[1], 0, .9, -.75, 6); tail.rotation.x = -.8;
  }
  if (k === 'flamingo') { for (const x of [-.06, .06]) cyl(g, .025, .025, 1.1, '#ff6fa8', x, .55, 0, 6); const b = sph(g, .32, '#ff8ac0', 0, 1.25, 0); b.scale.set(1, .8, 1.4); const n = cyl(g, .05, .06, .9, '#ff8ac0', 0, 1.7, .3, 8); n.rotation.x = .35; sph(g, .14, '#ff8ac0', 0, 2.15, .45); cone(g, .05, .2, '#1c1c1c', 0, 2.1, .62).rotation.x = 2; eye(g, .08, 2.2, .52, .03); eye(g, -.08, 2.2, .52, .03) }
}

// ---------- транспорт, предметы двора, летающие и эффекты ----------
const ITEMS = {
  bike: g => { for (const z of [-.55, .55]) { const w = P(new THREE.TorusGeometry(.38, .05, 8, 20), '#1c1c1c', 0, .4, z, g); w.rotation.y = Math.PI / 2 } box(g, .06, .06, 1.1, '#e8433a', 0, .7, 0); cyl(g, .03, .03, .5, '#e8433a', 0, .7, .45); box(g, .5, .05, .05, '#1c1c1c', 0, .95, .5); box(g, .18, .06, .3, '#1c1c1c', 0, .95, -.3) },
  scooter: g => { box(g, .45, .35, 1.3, '#3a8bff', 0, .45, 0); for (const z of [-.5, .55]) { const w = cyl(g, .22, .22, .16, '#1c1c1c', 0, .22, z); w.rotation.z = Math.PI / 2 } cyl(g, .04, .04, .8, '#cccccc', 0, .9, .55); box(g, .6, .05, .05, '#1c1c1c', 0, 1.3, .55); box(g, .4, .12, .6, '#2b2b2b', 0, .7, -.2) },
  moto: g => { box(g, .4, .45, 1.6, '#1c1c1c', 0, .6, 0); box(g, .42, .3, .7, '#e8433a', 0, .9, .25); for (const z of [-.7, .7]) { const w = cyl(g, .32, .32, .2, '#111', 0, .32, z); w.rotation.z = Math.PI / 2 } box(g, .7, .05, .05, '#999', 0, 1.15, .65) },
  pond: g => { const w = cyl(g, 1.6, 1.6, .08, M('#3ec1ff', { roughness: .1, transparent: true, opacity: .85 }), 0, .05, 0, 28); w.scale.z = .7; for (let i = 0; i < 12; i++) { const a = i / 12 * 6.28; sph(g, .22, '#9a9a9a', Math.cos(a) * 1.65, .1, Math.sin(a) * 1.15, 8) } for (let i = 0; i < 3; i++) { const f = cone(g, .08, .3, '#ff8a3a', -.5 + i * .5, .1, i * .2 - .2, 6); f.rotation.z = Math.PI / 2; f.name = 'fish' } },
  statue: g => { box(g, 1, .5, 1, '#d8d4cc', 0, .25, 0); cyl(g, .25, .35, 1.2, '#e9e6df', 0, 1.1, 0); sph(g, .3, '#e9e6df', 0, 1.95, 0) },
  hammock: g => { for (const x of [-1.6, 1.6]) { cyl(g, .12, .16, 3.4, '#8a5a3a', x, 1.7, 0, 6); sph(g, .9, '#3fb86a', x, 3.6, 0, 8) } const h = P(new THREE.CylinderGeometry(1.4, 1.4, .1, 16, 1, true, Math.PI, Math.PI), M('#ffc65c', { side: THREE.DoubleSide }), 0, 1.4, 0, g); h.rotation.z = Math.PI / 2; h.scale.set(.35, 1.1, .5) },
  firepit: g => { for (let i = 0; i < 10; i++) { const a = i / 10 * 6.28; sph(g, .2, '#7a7a7a', Math.cos(a) * .6, .12, Math.sin(a) * .6, 8) } const f = cone(g, .35, .9, M('#ff8a2a', { emissive: '#ff5a00', emissiveIntensity: 1.2 }), 0, .5, 0, 8); f.name = 'flame'; for (let i = 0; i < 3; i++) { const l = cyl(g, .06, .06, 1.6, '#6a4a2a', 0, .1, 0, 6); l.rotation.z = Math.PI / 2; l.rotation.y = i } },
  mailbox: g => { cyl(g, .05, .05, 1, '#6a4a2a', 0, .5, 0, 6); box(g, .35, .35, .6, '#3a8bff', 0, 1.15, 0); box(g, .05, .25, .05, '#e8433a', .2, 1.35, .1) },
  windmill: g => { cyl(g, .45, .7, 3.6, '#e9e2d6', 0, 1.8, 0, 8); cone(g, .6, .8, '#c0392b', 0, 4, 0, 8); const r = new THREE.Group(); r.position.set(0, 3.4, .7); r.name = 'rotor'; for (let i = 0; i < 4; i++) { const b = box(r, .25, 1.8, .05, '#ffffff', 0, .9, 0); const s = new THREE.Group(); s.rotation.z = i * Math.PI / 2; s.add(b); r.add(s) } g.add(r) },
  sport: g => car(g, '#ffc65c', 1.8, true), truck: g => car(g, '#3a5a8a', 2, false, true), limo: g => { car(g, '#111111', 2.6, false); }, tractor: g => { box(g, .9, .7, 1.4, '#2bb24c', 0, .7, 0); box(g, .8, .7, .7, '#2bb24c', 0, 1.35, -.2); for (const [z, r] of [[-.45, .55], [.55, .35]]) for (const x of [-.55, .55]) { const w = cyl(g, r, r, .3, '#1c1c1c', x, r, z); w.rotation.z = Math.PI / 2 } cyl(g, .06, .06, .7, '#555', .3, 1.6, .5) },
  boat: g => { const h = box(g, 1, .5, 2.4, '#ffffff', 0, .4, 0); box(g, .9, .05, 2.2, '#3a8bff', 0, .66, 0); box(g, .7, .5, .6, '#dfe9ee', 0, .9, -.2); cone(g, .5, .7, '#ffffff', 0, .4, 1.4, 4).rotation.x = Math.PI / 2 },
  bbcourt: g => { cyl(g, .07, .07, 3, '#555', 0, 1.5, 0, 6); box(g, 1.2, .8, .05, '#ffffff', 0, 3, .1); P(new THREE.TorusGeometry(.25, .03, 6, 16), '#ff5a2a', 0, 2.7, .4, g).rotation.x = Math.PI / 2; sph(g, .2, '#ff8a3a', .8, .2, .6) },
  gym: g => { for (const x of [-.8, .8]) cyl(g, .06, .06, 2.2, '#555', x, 1.1, 0, 6); cyl(g, .04, .04, 1.7, '#aaa', 0, 2.1, 0, 6).rotation.z = Math.PI / 2; box(g, 1.4, .1, .4, '#e8433a', 0, .5, .6) },
  goal: g => { const m = M('#ffffff'); for (const x of [-1.2, 1.2]) cyl(g, .05, .05, 1.4, m, x, .7, 0, 6); cyl(g, .05, .05, 2.4, m, 0, 1.4, 0, 6).rotation.z = Math.PI / 2; const net = P(new THREE.PlaneGeometry(2.4, 1.4), M('#ffffff', { transparent: true, opacity: .35, side: THREE.DoubleSide }), 0, .7, -.4, g); sph(g, .18, '#ffffff', .5, .18, 1) },
  tennis: g => { box(g, 3, .04, 4.6, '#2f8a5a', 0, .02, 0); box(g, 3, .02, .05, '#ffffff', 0, .05, 0); box(g, 3.1, .5, .03, M('#ffffff', { transparent: true, opacity: .6 }), 0, .3, 0); sph(g, .07, '#dfff4a', .5, .3, 1) },
  boxing: g => { box(g, .8, .08, .08, '#555', 0, 2.4, 0); const b = cyl(g, .3, .3, 1.1, '#e8433a', 0, 1.55, 0); b.name = 'bag'; cyl(g, .01, .01, .3, '#333', 0, 2.2, 0, 4) },
  skate: g => { const r = box(g, 2, .1, 1.6, '#9aa0a8', 0, .5, 0); r.rotation.z = .4; box(g, .4, .9, 1.6, '#80868e', 1, .45, 0) },
  xmas: g => { cyl(g, .12, .15, .4, '#6a4a2a', 0, .2, 0, 6); for (let i = 0; i < 3; i++) cone(g, 1 - i * .25, 1.1, '#2b8a4a', 0, .8 + i * .65, 0, 10); cone(g, .15, .3, M('#ffc65c', { emissive: '#ffb000' }), 0, 2.6, 0, 5); for (let i = 0; i < 10; i++) sph(g, .07, M(['#e8433a', '#ffc65c', '#3a8bff'][i % 3], { emissive: ['#a00', '#a70', '#03a'][i % 3] }), Math.cos(i) * (.7 - i * .05), .7 + i * .16, Math.sin(i) * (.7 - i * .05), 8) },
  snowman: g => { sph(g, .55, '#ffffff', 0, .5, 0); sph(g, .4, '#ffffff', 0, 1.25, 0); sph(g, .28, '#ffffff', 0, 1.8, 0); cone(g, .05, .3, '#ff8a2a', 0, 1.8, .38).rotation.x = Math.PI / 2; cyl(g, .22, .22, .3, '#1c1c1c', 0, 2.15, 0); for (const x of [-.09, .09]) sph(g, .04, '#111', x, 1.88, .25, 6) },
  gifts: g => { [['#e8433a', 0, 0, .7], ['#3a8bff', .6, .3, .5], ['#2bb24c', -.5, .4, .55], ['#ffc65c', .1, .9, .4]].forEach(([c, x, z, s]) => { box(g, s, s, s, c, x, s / 2 + (z > .8 ? .7 : 0), z - .2); box(g, s + .02, s + .02, .08, '#ffffff', x, s / 2 + (z > .8 ? .7 : 0), z - .2) }) },
  pumpkin: g => { for (const [x, s] of [[0, .45], [.7, .3], [-.6, .32]]) { const p = sph(g, s, '#ff8a2a', x, s * .8, 0); p.scale.y = .8; cyl(g, .04, .04, .15, '#4a7a2a', x, s * 1.5, 0, 6) } },
  disco: g => { cyl(g, .02, .02, 1.2, '#555', 0, 2.6, 0, 4); const b = sph(g, .4, M('#e0e0e0', { metalness: .9, roughness: .15 }), 0, 1.9, 0, 16); b.name = 'spin' },
  castle: g => { box(g, 1.8, 3, 1.8, '#c9c2b4', 0, 1.5, 0); for (const [x, z] of [[-.75, -.75], [.75, -.75], [-.75, .75], [.75, .75]]) box(g, .35, .4, .35, '#c9c2b4', x, 3.2, z); cone(g, .5, 1, '#3a5ac8', 0, 3.8, 0, 8); box(g, .5, .8, .05, '#5a3a24', 0, .4, .91) },
  diamond: g => { box(g, .8, .5, .8, '#d8d4cc', 0, .25, 0); const d = P(new THREE.OctahedronGeometry(.6), M('#9fe8ff', { metalness: .3, roughness: .05, emissive: '#2a8aaa', emissiveIntensity: .5 }), 0, 1.3, 0, g); d.name = 'spin' },
  dolphin: g => { const w = cyl(g, 1.3, 1.3, .3, M('#3ec1ff', { transparent: true, opacity: .8 }), 0, .15, 0, 24); const d = new THREE.Group(); d.name = 'jump'; const b = sph(d, .3, '#7a9ab8', 0, 0, 0); b.scale.set(1, 1, 2.2); cone(d, .12, .3, '#7a9ab8', 0, .3, 0, 6); g.add(d) },
  rocket: g => { cyl(g, .45, .45, 3, '#f0f0f0', 0, 2, 0); cone(g, .45, 1, '#e8433a', 0, 4, 0); for (let i = 0; i < 3; i++) { const f = box(g, .08, .9, .7, '#e8433a', Math.cos(i * 2.09) * .5, .9, Math.sin(i * 2.09) * .5); f.rotation.y = -i * 2.09 } sph(g, .18, M('#3a8bff', { emissive: '#1a4aaa' }), 0, 2.8, .42, 10) },
  plane: g => { const b = cyl(g, .35, .3, 3.2, '#ffffff', 0, 1, 0); b.rotation.x = Math.PI / 2; box(g, 4, .08, .8, '#e8433a', 0, 1, .1); box(g, 1.4, .06, .5, '#e8433a', 0, 1.2, -1.4); box(g, .06, .6, .5, '#e8433a', 0, 1.45, -1.4); for (const x of [-.5, .5]) cyl(g, .06, .06, .8, '#333', x, .4, .3, 6) },
};
function car(g, col, len, sport, truck) {
  box(g, 1.1, .45, len, col, 0, .5, 0); if (!truck) box(g, .95, .38, len * .5, M('#dfe9ff', { roughness: .1, metalness: .3 }), 0, .9, -len * .05); else { box(g, .95, .45, len * .35, col, 0, .95, len * .25); box(g, 1.1, .1, len * .55, '#2b2b2b', 0, .75, -len * .2) }
  for (const z of [-len * .32, len * .32]) for (const x of [-.55, .55]) { const w = cyl(g, .22, .22, .18, '#1c1c1c', x, .22, z); w.rotation.z = Math.PI / 2 }
  if (sport) box(g, 1, .06, .3, '#1c1c1c', 0, .85, -len * .45);
}
export function item(k) { const g = new THREE.Group(); const f = ITEMS[k]; if (f) f(g); return g }
export const hasItem = k => !!ITEMS[k];
export function animItem(g, t) {
  g.traverse(o => { if (o.name === 'rotor') o.rotation.z = t * 1.2; if (o.name === 'flame') o.scale.set(1, .8 + Math.abs(Math.sin(t * 9)) * .4, 1); if (o.name === 'spin') o.rotation.y = t * 1.5; if (o.name === 'bag') o.rotation.x = Math.sin(t * 3) * .12;
    if (o.name === 'fish') o.position.x = Math.sin(t + o.position.z * 5) * .6; if (o.name === 'jump') { const k = (t * .5) % 1; o.position.set(Math.cos(k * Math.PI) * .9, Math.sin(k * Math.PI) * 1.4, 0); o.rotation.z = -Math.cos(k * Math.PI) * 1.2 } });
}
// летающие
export function flyer(k) {
  const g = new THREE.Group();
  if (k === 'ufo') { const d = cyl(g, 1.4, 1.6, .3, M('#b8c0cc', { metalness: .8, roughness: .25 }), 0, 0, 0, 24); sph(g, .7, M('#7fe0ff', { transparent: true, opacity: .7, emissive: '#2a8aaa' }), 0, .25, 0, 16); for (let i = 0; i < 8; i++) sph(g, .1, M('#ffc65c', { emissive: '#ffb000', emissiveIntensity: 1.5 }), Math.cos(i * .785) * 1.4, -.05, Math.sin(i * .785) * 1.4, 6) }
  if (k === 'eagle') { const b = sph(g, .3, '#5a3a24', 0, 0, 0); b.scale.set(1, .8, 1.8); sph(g, .2, '#ffffff', 0, .1, .55); cone(g, .07, .2, '#ffc65c', 0, .05, .78).rotation.x = Math.PI / 2; for (const s of [-1, 1]) { const w = box(g, 1.6, .05, .5, '#4a2a14', s * .9, 0, 0); w.name = 'wing' + s } }
  if (k === 'dragon') { const b = sph(g, .55, '#2bb24c', 0, 0, 0); b.scale.set(1, .9, 2); sph(g, .38, '#2bb24c', 0, .3, 1.2); for (const x of [-.18, .18]) { cone(g, .08, .35, '#ffc65c', x, .65, 1.1, 6); sph(g, .07, M('#ffde4a', { emissive: '#aa8800' }), x, .4, 1.5, 6) } const tl = cone(g, .2, 1.4, '#2bb24c', 0, 0, -1.6, 8); tl.rotation.x = -Math.PI / 2; for (const s of [-1, 1]) { const w = P(new THREE.ConeGeometry(.9, 2, 3), M('#1f8a3a', { side: THREE.DoubleSide }), s * 1.2, .2, 0, g); w.rotation.z = s * Math.PI / 2; w.scale.z = .1; w.name = 'wing' + s } }
  if (k === 'rainbow') { ['#e8433a', '#ff8a2a', '#ffc65c', '#2bb24c', '#3a8bff', '#6a4fd0'].forEach((c, i) => P(new THREE.TorusGeometry(5 - i * .3, .15, 8, 40, Math.PI), M(c, { emissive: c, emissiveIntensity: .25 }), 0, 0, 0, g, false)) }
  return g;
}
export function flap(g, t) { g.traverse(o => { if (o.name === 'wing1') o.rotation.z = Math.PI / 2 * (o.geometry.type === 'ConeGeometry' ? 1 : 0) + Math.sin(t * 6) * .5; if (o.name === 'wing-1') o.rotation.z = -Math.PI / 2 * (o.geometry.type === 'ConeGeometry' ? 1 : 0) - Math.sin(t * 6) * .5 }) }
// частицы эффектов
const FXG = {
  fx_snow: () => [new THREE.OctahedronGeometry(.12), M('#ffffff', { emissive: '#bfe8ff', emissiveIntensity: .4 })],
  fx_fly: () => [new THREE.SphereGeometry(.08, 8, 6), new THREE.MeshBasicMaterial({ color: '#fff3a0' })],
  fx_love: () => { const s = new THREE.Shape(); s.moveTo(0, -.15); s.bezierCurveTo(-.3, .05, -.15, .25, 0, .1); s.bezierCurveTo(.15, .25, .3, .05, 0, -.15); return [new THREE.ShapeGeometry(s), M('#ff4f7a', { side: THREE.DoubleSide, emissive: '#aa1a3a', emissiveIntensity: .4 })] },
  fx_money: () => [new THREE.PlaneGeometry(.35, .18), M('#5ab85a', { side: THREE.DoubleSide })],
  fx_bfly: () => [new THREE.CircleGeometry(.15, 3), M('#4fc3ff', { side: THREE.DoubleSide, emissive: '#1a5aaa', emissiveIntensity: .3 })],
  fx_star: () => [new THREE.OctahedronGeometry(.14), new THREE.MeshBasicMaterial({ color: '#ffe36a' })],
  fx_petal: () => [new THREE.CircleGeometry(.1, 5), M('#ffb8d6', { side: THREE.DoubleSide })],
  fx_fire: () => [new THREE.SphereGeometry(.06, 6, 4), new THREE.MeshBasicMaterial({ color: '#ffb84a' })],
};
export function fxMesh(k) { const f = FXG[k]; if (!f) return null; const [geo, mat] = f(); return new THREE.Mesh(geo, mat) }
export const hasFx = k => !!FXG[k];
