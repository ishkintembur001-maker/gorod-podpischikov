// «Мой дом изнутри» — жизнь жителя Города подписчиков
import * as THREE from './three.js';
import { makeHero, walk } from './hero.js';
const P = parent, $ = id => document.getElementById(id);
const ME = () => P.ME, LIFE = () => P.ME && P.ME.life;
let CAT = null;
const HW = 12, HD = 8, WH = 4.2; // половина ширины/глубины дома, высота стен

// ---------- сцена ----------
const R = new THREE.WebGLRenderer({ canvas: $('gl'), antialias: true });
R.setPixelRatio(Math.min(1.7, devicePixelRatio)); R.setSize(innerWidth, innerHeight);
R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.1; R.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene(); scene.background = new THREE.Color('#1b1446');
const cam = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, .5, 400);
addEventListener('resize', () => { R.setSize(innerWidth, innerHeight); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix() });
const hour = (new Date().getUTCHours() + 3) % 24, NIGHT = hour >= 20 || hour < 6;
scene.add(new THREE.HemisphereLight(NIGHT ? '#8a86d8' : '#fff4e0', '#3a2a50', NIGHT ? .55 : .9));
const sun = new THREE.DirectionalLight(NIGHT ? '#9fb0ff' : '#fff1d6', NIGHT ? .5 : 1.6);
sun.position.set(-14, 26, 18); sun.castShadow = true; sun.shadow.mapSize.set(1536, 1536);
Object.assign(sun.shadow.camera, { left: -18, right: 18, top: 14, bottom: -14, near: 1, far: 70 }); sun.shadow.bias = -.0006; scene.add(sun);
const mat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .75, ...o });
function B(w, h, d, c, x, y, z, p, o) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), c.isMaterial ? c : mat(c, o)); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; p.add(m); return m }
function C(rt, rb, h, c, x, y, z, p, seg = 20, o) { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), c.isMaterial ? c : mat(c, o)); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; p.add(m); return m }

// ---------- дом ----------
const house = new THREE.Group(); scene.add(house);
let floorM, wallM;
function tex(fn, w = 256, h = 256) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t }
function buildHouse() {
  house.clear();
  const L = LIFE();
  // пол: доски в жилых комнатах, плитка в ванной
  const wood = tex((x, w, h) => { x.fillStyle = L.floor; x.fillRect(0, 0, w, h); for (let i = 0; i < 8; i++) { x.fillStyle = `rgba(0,0,0,${.05 + (i % 3) * .03})`; x.fillRect(0, i * 32, w, 2); x.fillStyle = `rgba(255,255,255,${.03 * (i % 2)})`; x.fillRect((i * 97) % w, i * 32 + 2, 90, 30) } });
  wood.wrapS = wood.wrapT = THREE.RepeatWrapping; wood.repeat.set(4, 3);
  floorM = mat('#ffffff', { map: wood, roughness: .6 });
  const fl = new THREE.Mesh(new THREE.BoxGeometry(HW * 2, .3, HD * 2), floorM); fl.position.y = -.15; fl.receiveShadow = true; fl.name = 'floor'; house.add(fl);
  const tile = tex((x, w, h) => { x.fillStyle = '#e9f3f7'; x.fillRect(0, 0, w, h); x.strokeStyle = '#b9cdd6'; x.lineWidth = 4; for (let i = 0; i <= 4; i++) { x.beginPath(); x.moveTo(i * 64, 0); x.lineTo(i * 64, h); x.moveTo(0, i * 64); x.lineTo(w, i * 64); x.stroke() } });
  tile.wrapS = tile.wrapT = THREE.RepeatWrapping; tile.repeat.set(3, 2);
  const bt = new THREE.Mesh(new THREE.PlaneGeometry(HW - .3, HD - .3), mat('#fff', { map: tile, roughness: .3 })); bt.rotation.x = -Math.PI / 2; bt.position.set(HW / 2, .02, HD / 2); bt.receiveShadow = true; house.add(bt);
  wallM = mat(L.wall, { roughness: .9 });
  const trim = mat('#ffffff', { roughness: .5 });
  // задние стены — высокие, передние — низкие (как в Симс)
  B(HW * 2 + .4, WH, .3, wallM, 0, WH / 2, -HD - .15, house);
  B(.3, WH, HD * 2 + .3, wallM, -HW - .15, WH / 2, 0, house);
  B(HW * 2 + .4, .7, .3, wallM, 0, .35, HD + .15, house);
  B(.3, .7, HD * 2 + .3, wallM, HW + .15, .35, 0, house);
  for (const z of [-HD, HD]) B(HW * 2 + .4, .18, .34, trim, 0, z < 0 ? WH : .75, z + (z < 0 ? -.15 : .15), house);
  // внутренние перегородки с проёмами
  B(.25, WH * .78, HD - 2.6, wallM, 0, WH * .39, -HD + (HD - 2.6) / 2, house); B(.25, WH * .78, 1.2, wallM, 0, WH * .39, -.6, house);
  B(.25, 1.4, HD - 2.6, wallM, 0, .7, HD - (HD - 2.6) / 2, house);
  B(HW - 3, WH * .78, .25, wallM, -HW + (HW - 3) / 2, WH * .39, 0, house);
  B(HW - 3, 1.4, .25, wallM, HW - (HW - 3) / 2, .7, 0, house);
  // окна на задней стене: за ними — Город подписчиков
  const view = tex((x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, NIGHT ? '#0d0a2e' : '#7cc4ff'); g.addColorStop(1, NIGHT ? '#3a2a6a' : '#d8efff'); x.fillStyle = g; x.fillRect(0, 0, w, h); let X = 0; while (X < w) { const bw = 18 + Math.random() * 30, bh = 40 + Math.random() * 110; x.fillStyle = NIGHT ? '#151033' : '#8aa0c8'; x.fillRect(X, h - bh, bw, bh); x.fillStyle = '#ffc65c'; for (let yy = h - bh + 8; yy < h - 6; yy += 14) for (let xx = X + 4; xx < X + bw - 6; xx += 10) if (Math.random() < (NIGHT ? .45 : .12)) x.fillRect(xx, yy, 5, 7); X += bw + 4 } }, 256, 160);
  for (const x of [-7, 6]) { const fr = B(4.2, 2.6, .2, trim, x, 2.4, -HD + .05, house); const gl = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 2.2), new THREE.MeshBasicMaterial({ map: view, toneMapped: false })); gl.position.set(x, 2.4, -HD + .17); house.add(gl); B(.12, 2.2, .1, trim, x, 2.4, -HD + .2, house) }
  // фото-рамка с ником и постер города
  const me = ME();
  const card = tex((x, w, h) => { x.fillStyle = '#2b2266'; x.fillRect(0, 0, w, h); x.fillStyle = '#ffc65c'; x.font = 'bold 30px sans-serif'; x.textAlign = 'center'; x.fillText('@' + (me && me.nick || 'житель'), w / 2, 70); x.fillStyle = '#e9e4ff'; x.font = '22px sans-serif'; x.fillText('мой дом в Городе', w / 2, 112); x.fillText('подписчиков', w / 2, 140); x.font = '60px serif'; x.fillText('🏡', w / 2, 220) }, 256, 256);
  const fc = B(1.9, 1.9, .12, '#7a4a2a', -HW + .1, 2.6, -2.2, house); fc.rotation.y = Math.PI / 2;
  const fp = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), new THREE.MeshBasicMaterial({ map: card })); fp.position.set(-HW + .2, 2.6, -2.2); fp.rotation.y = Math.PI / 2; house.add(fp);
  const post = tex((x, w, h) => { x.fillStyle = '#ff6b4a'; x.fillRect(0, 0, w, h); x.fillStyle = '#fff'; x.font = 'bold 34px sans-serif'; x.textAlign = 'center'; x.fillText('ГОРОД', w / 2, 70); x.fillText('ПОДПИСЧИКОВ', w / 2, 110); x.font = '22px sans-serif'; x.fillText('@gorod.podpischikov001', w / 2, 230); x.font = '70px serif'; x.fillText('🏙', w / 2, 190) }, 256, 256);
  const pp = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.8), new THREE.MeshStandardMaterial({ map: post })); pp.position.set(-HW + .2, 2.5, 4); pp.rotation.y = Math.PI / 2; house.add(pp);
  // подписи комнат на полу
  for (const [t, x, z] of [['Кухня', -6, -1.2], ['Спальня', 6, -1.2], ['Гостиная', -6, 1.2], ['Ванная', 6, 1.2]]) { const s = tex((c, w, h) => { c.font = 'bold 44px sans-serif'; c.textAlign = 'center'; c.fillStyle = 'rgba(43,34,102,.35)'; c.fillText(t, w / 2, 60) }, 256, 80); const m = new THREE.Mesh(new THREE.PlaneGeometry(4, 1.25), new THREE.MeshBasicMaterial({ map: s, transparent: true, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.set(x, .03, z); house.add(m) }
  // уютный свет
  for (const [x, z] of [[-6, -4], [6, -4], [-6, 4], [6, 4]]) { const l = new THREE.PointLight('#ffd9a0', NIGHT ? 22 : 6, 14, 1.6); l.position.set(x, 3.6, z); house.add(l) }
}

// ---------- мебель ----------
const FB = {
  fridge: g => { B(1.8, 3.6, 1.4, '#eef2f5', 0, 1.8, 0, g, { roughness: .3, metalness: .2 }); B(1.82, .05, 1.42, '#c7cfd6', 0, 2.5, 0, g); B(.08, .9, .1, '#8a96a0', .7, 3, .72, g); B(.08, 1.2, .1, '#8a96a0', .7, 1.4, .72, g); return 1.4 },
  bed: g => { B(3.2, .6, 4.6, '#7a4a2a', 0, .3, 0, g); B(3.2, 1.8, .3, '#7a4a2a', 0, .9, -2.2, g); B(3, .45, 4.2, '#f7f3ea', 0, .8, .1, g); B(3.05, .25, 2.6, '#6a4fd0', 0, 1.05, .9, g); B(1.2, .3, .7, '#ffffff', -.75, 1.15, -1.5, g); B(1.2, .3, .7, '#ffffff', .75, 1.15, -1.5, g); return 4.6 },
  shower: g => { B(2.4, .2, 2.4, '#dfe9ee', 0, .1, 0, g); const gm = new THREE.MeshStandardMaterial({ color: '#bfe6ff', transparent: true, opacity: .3, roughness: .05 }); B(1.1, 3.4, .06, gm, .65, 1.9, 1.2, g); B(.06, 3.4, 2.4, gm, 1.2, 1.9, 0, g); B(.06, 3.4, 2.4, gm, -1.2, 1.9, 0, g); C(.05, .05, 3.6, '#a0a8b0', -.9, 2, -1, g); C(.3, .3, .1, '#a0a8b0', 0, 3.7, -.6, g); B(.1, 3.4, .1, '#a0a8b0', .1, 1.9, 1.2, g); return 2.4 },
  tv: g => { B(3.4, .8, 1, '#3a2a1e', 0, .4, 0, g); B(3.2, 1.9, .12, '#111', 0, 1.9, 0, g); const s = new THREE.Mesh(new THREE.PlaneGeometry(3, 1.7), new THREE.MeshBasicMaterial({ color: '#4fc3ff' })); s.position.set(0, 1.9, .07); s.name = 'screen'; g.add(s); return 1 },
  phone: g => { C(.6, .6, .1, '#7a4a2a', 0, 1.3, 0, g); C(.08, .08, 1.3, '#7a4a2a', 0, .65, 0, g); C(.4, .4, .08, '#7a4a2a', 0, .04, 0, g); B(.35, .06, .6, '#222', 0, 1.39, 0, g); const s = B(.3, .02, .52, '#5ee6b0', 0, 1.43, 0, g, { emissive: '#2a7a5a' }); return 1.2 },
  table: g => { B(3.2, .15, 2, '#a0703a', 0, 1.4, 0, g); for (const [x, z] of [[-1.4, -.8], [1.4, -.8], [-1.4, .8], [1.4, .8]]) B(.15, 1.4, .15, '#7a4a2a', x, .7, z, g); for (const x of [-1, 1]) { B(.9, .1, .9, '#c0392b', x, .9, 1.5, g); B(.9, 1, .1, '#7a4a2a', x, 1.4, 1.95, g) } C(.25, .2, .3, '#fff', 0, 1.62, 0, g); return 2 },
  plant: g => { C(.45, .35, .8, '#c0603a', 0, .4, 0, g); for (let i = 0; i < 6; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(.45, 10, 8), mat(i % 2 ? '#2f9e5a' : '#3fb86a')); l.position.set(Math.cos(i) * .35, 1.2 + (i % 3) * .3, Math.sin(i) * .35); l.castShadow = true; g.add(l) } return .9 },
  sofa: g => { B(3.6, .8, 1.6, '#3a5ac8', 0, .5, 0, g); B(3.6, 1.2, .4, '#2f4aa8', 0, 1.1, -.6, g); B(.4, 1, 1.6, '#2f4aa8', -1.8, .8, 0, g); B(.4, 1, 1.6, '#2f4aa8', 1.8, .8, 0, g); B(1, .3, .8, '#ffc65c', -.9, 1.05, .1, g); return 1.6 },
  stove: g => { B(1.8, 1.8, 1.4, '#e7e7ea', 0, .9, 0, g, { roughness: .3 }); B(1.6, .05, 1.2, '#222', 0, 1.82, 0, g); for (const [x, z] of [[-.4, -.3], [.4, -.3], [-.4, .3], [.4, .3]]) C(.22, .22, .03, '#444', x, 1.86, z, g); B(1.4, .9, .05, '#333', 0, .9, .71, g); return 1.4 },
  bath: g => { B(2, 1, 3.6, '#ffffff', 0, .5, 0, g, { roughness: .2 }); const w = new THREE.Mesh(new THREE.BoxGeometry(1.6, .1, 3.2), new THREE.MeshStandardMaterial({ color: '#7fd6ff', roughness: .05, transparent: true, opacity: .8 })); w.position.y = .9; g.add(w); return 2 },
  pc: g => { B(2.6, .12, 1.3, '#5a3a24', 0, 1.5, 0, g); for (const x of [-1.2, 1.2]) B(.12, 1.5, 1.2, '#5a3a24', x, .75, 0, g); B(1.5, .95, .08, '#111', 0, 2.2, -.3, g); const s = new THREE.Mesh(new THREE.PlaneGeometry(1.4, .85), new THREE.MeshBasicMaterial({ color: '#ff6fb5' })); s.position.set(0, 2.2, -.25); g.add(s); B(.9, .04, .3, '#333', 0, 1.58, .2, g); B(.8, .1, .8, '#222', 0, .9, 1.1, g); return 1.3 },
  console: g => { B(2.4, .7, .9, '#2a2a2a', 0, .35, 0, g); B(.8, .2, .5, '#fff', 0, .8, 0, g); B(2.6, 1.6, .1, '#111', 0, 1.7, -.2, g); const s = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.4), new THREE.MeshBasicMaterial({ color: '#7dff8a' })); s.position.set(0, 1.7, -.14); g.add(s); return .9 },
  guitar: g => { const b = C(.5, .5, .15, '#c47a2a', 0, .9, 0, g); b.rotation.x = Math.PI / 2; B(.12, 1.4, .08, '#5a3a24', 0, 1.8, 0, g); B(.5, .12, .5, '#333', 0, .06, 0, g); return .6 },
  books: g => { B(2.6, 3.4, .8, '#7a4a2a', 0, 1.7, 0, g); for (let r = 0; r < 4; r++) for (let i = 0; i < 9; i++) B(.2, .6, .5, ['#e8433a', '#3a8bff', '#ffc65c', '#2bb24c', '#6a4fd0'][(r + i) % 5], -1.05 + i * .26, .5 + r * .8, .1, g); return .8 },
  lamp: g => { C(.35, .4, .1, '#333', 0, .05, 0, g); C(.04, .04, 2.8, '#333', 0, 1.45, 0, g); C(.35, .55, .6, '#fff1d0', 0, 2.95, 0, g, 20, { emissive: '#ffcf80', emissiveIntensity: NIGHT ? 1.2 : .3 }); const l = new THREE.PointLight('#ffd08a', NIGHT ? 10 : 2, 9); l.position.y = 2.6; g.add(l); return .8 },
  rug: g => { const r = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, .05, 32), mat('#c0392b')); r.position.y = .03; r.receiveShadow = true; g.add(r); const r2 = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, .06, 32), mat('#ffc65c')); r2.position.y = .04; g.add(r2); return 0 },
  aquarium: g => { B(2.6, .9, 1, '#2a2a2a', 0, .45, 0, g); const w = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.4, .9), new THREE.MeshStandardMaterial({ color: '#4fc3ff', transparent: true, opacity: .55, emissive: '#1a6a9a', emissiveIntensity: .6 })); w.position.y = 1.6; g.add(w); for (let i = 0; i < 4; i++) { const f = new THREE.Mesh(new THREE.ConeGeometry(.1, .3, 6), mat(['#ff8a3a', '#ffc65c', '#ff4fa8', '#7dff8a'][i])); f.rotation.z = Math.PI / 2; f.position.set(-.8 + i * .5, 1.4 + (i % 2) * .4, 0); f.name = 'fish'; g.add(f) } return 1 },
  kingbed: g => { FB.bed(g); g.children.forEach(m => { if (m.material.color.getHexString() === '7a4a2a') m.material = mat('#ffc65c', { metalness: .8, roughness: .25 }) }); for (const [x, z] of [[-1.5, -2.2], [1.5, -2.2], [-1.5, 2.2], [1.5, 2.2]]) C(.08, .08, 3.6, '#ffc65c', x, 1.8, z, g, 8, { metalness: .8, roughness: .2 }); B(3.2, .1, 4.6, '#c0392b', 0, 3.6, 0, g); return 4.6 },
  jacuzzi: g => { C(1.9, 1.9, 1, '#f0f0f0', 0, .5, 0, g, 32); const w = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, .1, 32), new THREE.MeshStandardMaterial({ color: '#5ee6ff', emissive: '#1a8aaa', emissiveIntensity: .7, roughness: .05 })); w.position.y = .95; w.name = 'water'; g.add(w); return 3.8 },
  cinema: g => { B(5, 2.8, .12, '#111', 0, 2.2, 0, g); const s = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 2.6), new THREE.MeshBasicMaterial({ color: '#ffc65c' })); s.position.set(0, 2.2, .07); s.name = 'screen'; g.add(s); for (const x of [-1.2, 1.2]) { B(1.4, .7, 1.3, '#8a1a2a', x, .5, 3, g); B(1.4, 1.2, .3, '#8a1a2a', x, 1, 3.6, g) } return 1 },
  chef: g => { B(4.4, 1.8, 1.4, '#2b2266', 0, .9, 0, g); B(4.5, .12, 1.5, '#e9e4ff', 0, 1.86, 0, g, { roughness: .2 }); for (let i = 0; i < 4; i++) C(.25, .25, .04, '#333', -1.4 + i * .9, 1.95, 0, g); B(4.4, .8, .7, '#2b2266', 0, 3.4, -.35, g); return 1.4 },
  piano: g => { B(2.6, 1, 2, '#111', 0, 1.3, 0, g, { roughness: .15 }); B(2.4, .1, .5, '#fff', 0, 1.35, 1.1, g); for (const [x, z] of [[-1.1, -.8], [1.1, -.8], [0, .8]]) C(.08, .08, .9, '#111', x, .45, z, g); B(1.2, .6, .5, '#111', 0, .3, 2, g); return 2 },
  fireplace: g => { B(3, 3, 1, '#9a4a3a', 0, 1.5, 0, g); B(1.8, 1.4, .3, '#1a0a0a', 0, .8, .4, g); const f = new THREE.Mesh(new THREE.ConeGeometry(.5, 1, 8), new THREE.MeshBasicMaterial({ color: '#ff8a2a' })); f.position.set(0, .7, .45); f.name = 'flame'; g.add(f); const l = new THREE.PointLight('#ff8a3a', 14, 10); l.position.set(0, 1.2, 1.2); l.name = 'fire'; g.add(l); return 1 },
};
const furn = new THREE.Group(); scene.add(furn);
const OBJ = new Map();
function placeAll() {
  furn.clear(); OBJ.clear();
  for (const [k, x, z, r] of LIFE().furn) addObj(k, x, z, r);
}
function addObj(k, x, z, r) {
  if (!FB[k]) return;
  const g = new THREE.Group(); const d = FB[k](g); g.position.set(x, 0, z); g.rotation.y = r || 0;
  g.userData = { k, d }; g.traverse(o => o.userData.k = k); furn.add(g); OBJ.set(k, g); return g;
}
function spot(g) { const d = (g.userData.d || 1) / 2 + 1.1, r = g.rotation.y; return new THREE.Vector3(g.position.x + Math.sin(r) * d, 0, g.position.z + Math.cos(r) * d) }

// ---------- житель ----------
let hero = makeHero(LIFE() && LIFE().look); hero.position.set(-3, 0, 4); hero.rotation.order = 'YXZ'; scene.add(hero);
function rebuildHero(look) { const p = hero.position.clone(), r = hero.rotation.y; scene.remove(hero); hero = makeHero(look); hero.rotation.order = 'YXZ'; hero.position.copy(p); hero.rotation.y = r; scene.add(hero) }
let doing = null, bubble = null, path = [], busy = false;
hero.rotation.order = 'YXZ';
function say(e) { if (bubble) hero.remove(bubble); const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.beginPath(); x.arc(64, 58, 52, 0, 7); x.fill(); x.beginPath(); x.moveTo(50, 100); x.lineTo(64, 126); x.lineTo(78, 100); x.fill(); x.font = '64px "Noto Color Emoji",serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(e, 64, 62); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; bubble = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false })); bubble.scale.set(1.6, 1.6, 1); bubble.position.y = 4.1; bubble.renderOrder = 9; hero.add(bubble) }


// ---------- проходы: стены и мебель не проходим ----------
const CS = .5, NX = 48, NZ = 32; let GRID = new Uint8Array(NX * NZ);
const ci = (x, z) => [Math.floor((x + HW) / CS), Math.floor((z + HD) / CS)];
const cc = (i, j) => new THREE.Vector3(-HW + (i + .5) * CS, 0, -HD + (j + .5) * CS);
function wallBlocked(x, z) {
  if (Math.abs(x) > HW - .7 || Math.abs(z) > HD - .7) return true;
  if (Math.abs(x) < .55 && ((z < -2.6) || (z > -1.2 && z < .45) || z > 2.6)) return true; // перегородка x=0, проёмы z -2.6..-1.2 и 0..2.6
  if (Math.abs(z) < .55 && ((x < -3) || x > 3)) return true; // перегородка z=0, проёмы x -3..0 и 0..3
  return false;
}
function rebuildGrid() {
  GRID = new Uint8Array(NX * NZ); const bx = new THREE.Box3();
  for (let i = 0; i < NX; i++) for (let j = 0; j < NZ; j++) { const p = cc(i, j); if (wallBlocked(p.x, p.z)) GRID[j * NX + i] = 1 }
  for (const g of OBJ.values()) { if (g.userData.k === 'rug') continue; bx.setFromObject(g); const [i0, j0] = ci(bx.min.x - .45, bx.min.z - .45), [i1, j1] = ci(bx.max.x + .45, bx.max.z + .45); for (let i = Math.max(0, i0); i <= Math.min(NX - 1, i1); i++) for (let j = Math.max(0, j0); j <= Math.min(NZ - 1, j1); j++) GRID[j * NX + i] = 1 }
}
const free = (i, j) => i >= 0 && j >= 0 && i < NX && j < NZ && !GRID[j * NX + i];
function nearestFree(i, j) { if (free(i, j)) return [i, j]; for (let r = 1; r < 12; r++) for (let a = -r; a <= r; a++) for (const [x, y] of [[i + a, j - r], [i + a, j + r], [i - r, j + a], [i + r, j + a]]) if (free(x, y)) return [x, y]; return [i, j] }
function los(a, b) { const d = b.clone().sub(a), n = Math.ceil(d.length() / .2); for (let k = 1; k < n; k++) { const p = a.clone().addScaledVector(d, k / n), [i, j] = ci(p.x, p.z); if (!free(i, j)) return false } return true }
function findPath(from, to) {
  let [si, sj] = nearestFree(...ci(from.x, from.z)), [ti, tj] = nearestFree(...ci(to.x, to.z));
  const N = NX * NZ, gs = new Float32Array(N).fill(1e9), prev = new Int32Array(N).fill(-1), done = new Uint8Array(N), open = [sj * NX + si]; gs[open[0]] = 0;
  const h = c => Math.hypot(c % NX - ti, (c / NX | 0) - tj), goal = tj * NX + ti;
  while (open.length) {
    let bi = 0; for (let k = 1; k < open.length; k++) if (gs[open[k]] + h(open[k]) < gs[open[bi]] + h(open[bi])) bi = k;
    const c = open.splice(bi, 1)[0]; if (c === goal) break; if (done[c]) continue; done[c] = 1;
    const ci0 = c % NX, cj0 = c / NX | 0;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const ni = ci0 + dx, nj = cj0 + dz; if (!free(ni, nj)) continue; if (dx && dz && (!free(ci0 + dx, cj0) || !free(ci0, cj0 + dz))) continue;
      const n = nj * NX + ni, ng = gs[c] + (dx && dz ? 1.414 : 1); if (ng < gs[n]) { gs[n] = ng; prev[n] = c; open.push(n) }
    }
  }
  if (prev[goal] < 0 && goal !== sj * NX + si) return null;
  const pts = []; for (let c = goal; c >= 0; c = prev[c]) pts.unshift(cc(c % NX, c / NX | 0));
  pts.push(to.clone()); const out = [from.clone()];
  for (let k = 1; k < pts.length; k++) if (!los(out[out.length - 1], pts[k]) ) out.push(pts[k - 1]);
  out.push(pts[pts.length - 1]); out.shift(); return out;
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
function walkTo(p) { return new Promise(res => { const pth = findPath(hero.position, p); if (!pth) { res(false); return } path = pth; path.done = res }) }
function glide(p, y = 0, rotY = null, rx = 0, ms = 500) {
  return new Promise(res => { const a = hero.position.clone(), b = new THREE.Vector3(p.x, y, p.z), r0 = hero.rotation.y, x0 = hero.rotation.x, t0 = performance.now();
    let r1 = rotY == null ? r0 : rotY; while (r1 - r0 > Math.PI) r1 -= Math.PI * 2; while (r0 - r1 > Math.PI) r1 += Math.PI * 2;
    (function st() { const k = Math.min(1, (performance.now() - t0) / ms), e = k * k * (3 - 2 * k); hero.position.lerpVectors(a, b, e); hero.rotation.y = r0 + (r1 - r0) * e; hero.rotation.x = x0 + (rx - x0) * e; if (k < 1) requestAnimationFrame(st); else res() })() })
}
// позы
let POSE = 'stand';
function pose(p) { POSE = p; const U = hero.userData; U.ring.visible = p === 'stand'; U.head.rotation.x = 0; if (p === 'sit') { U.legs.forEach(l => l.rotation.x = -1.45) } if (p === 'stand' || p === 'lie') { U.legs.forEach(l => l.rotation.x = 0); U.arms.forEach(a => { a.rotation.x = 0; a.rotation.z = 0 }) } }
const L2W = (g, x, z) => { const r = g.rotation.y; return new THREE.Vector3(g.position.x + x * Math.cos(r) + z * Math.sin(r), 0, g.position.z - x * Math.sin(r) + z * Math.cos(r)) };
const HIP = 1.05 * 1.25;
let PROP = null;
function hold(e) { if (PROP) { hero.remove(PROP); PROP = null } if (!e) return; const c = document.createElement('canvas'); c.width = c.height = 96; const x = c.getContext('2d'); x.font = '76px "Noto Color Emoji",serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(e, 48, 52); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; PROP = new THREE.Sprite(new THREE.SpriteMaterial({ map: t })); PROP.scale.set(.7, .7, 1); PROP.position.set(.35, 2.15, .55); hero.add(PROP) }
// куда идти и что делать с каждым предметом
function plan(g) {
  const k = g.userData.k, r = g.rotation.y, F = (x, z) => L2W(g, x, z);
  const seat = (x, z, top, face) => ({ app: F(x, z + (face === 0 ? 1.4 : -1.4) * 1), at: F(x, z), y: top - HIP + .05, rot: r + face, pose: 'sit' });
  const sofa = OBJ.get('sofa');
  switch (k) {
    case 'sofa': return { ...seat(0, .25, .9, 0), anim: 'relax' };
    case 'tv': if (sofa) { const sp = plan(sofa); return { ...sp, face: g.position, anim: 'watch' } } return { app: F(0, 4), at: F(0, 3.2), y: -.75, rot: r + Math.PI, pose: 'sit', anim: 'watch' };
    case 'cinema': return { app: F(-1.2, 4.6), at: F(-1.2, 3.05), y: .85 - HIP + .1, rot: r + Math.PI, pose: 'sit', anim: 'watch', prop: '🍿' };
    case 'pc': return { app: F(0, 2.3), at: F(0, 1.15), y: 1 - HIP + .05, rot: r + Math.PI, pose: 'sit', anim: 'type' };
    case 'piano': return { app: F(0, 3.2), at: F(0, 2.05), y: .6 - HIP + .1, rot: r + Math.PI, pose: 'sit', anim: 'type' };
    case 'console': return { app: F(0, 3.4), at: F(0, 2.6), y: -.75, rot: r + Math.PI, pose: 'sit', anim: 'game', prop: '🎮' };
    case 'table': return { app: F(-1, 2.9), at: F(-1, 1.5), y: .95 - HIP + .05, rot: r + Math.PI, pose: 'sit', anim: 'eat', prop: '🍕' };
    case 'bed': case 'kingbed': return { app: F(2.6, .6), at: F(0, 1.6), y: 1.4, rot: r, rx: -Math.PI / 2, pose: 'lie', anim: 'sleep' };
    case 'bath': return { app: F(2, 0), at: F(0, 1.75), y: .75, rot: r, rx: -Math.PI / 2, pose: 'lie', anim: 'bath' };
    case 'jacuzzi': return { app: F(0, 3), at: F(0, .3), y: .55 - HIP + .1, rot: r + Math.PI, pose: 'sit', anim: 'bath' };
    case 'shower': return { app: F(-.55, 2.3), via: F(-.55, 1.0), at: F(-.3, -.1), y: .2, rot: r, pose: 'stand', anim: 'shower' };
    case 'fridge': case 'stove': case 'chef': return { app: F(0, (g.userData.d || 1.4) / 2 + 1.1), at: F(0, (g.userData.d || 1.4) / 2 + 1.1), y: 0, rot: r + Math.PI, pose: 'stand', anim: k === 'fridge' ? 'fridge' : 'cook', then: OBJ.get('table') ? 'table' : null, prop: k === 'fridge' ? '🥪' : '🍲' };
    case 'phone': return { app: F(.9, .9), at: F(.9, .9), y: 0, rot: r - Math.PI / 4 + Math.PI, pose: 'stand', anim: 'phone', prop: '📱' };
    case 'guitar': return { app: F(.2, 1.6), at: F(.2, 1.4), y: -.75, rot: r, pose: 'sit', anim: 'guitar', prop: '🎸' };
    case 'books': return { app: F(0, 1.7), at: F(0, 1.6), y: 0, rot: r, pose: 'stand', anim: 'read', prop: '📖' };
    default: { const d = (g.userData.d || 1) / 2 + 1.1; return { app: F(0, d), at: F(0, d), y: 0, rot: r + Math.PI, pose: 'stand', anim: 'look' } }
  }
}
async function standUp(p) { pose('stand'); hold(null); if (p && p.via) await glide(p.via, 0, null, 0, 400); await glide(p ? p.app : hero.position, 0, null, 0, 450) }
async function act(g) {
  if (busy) return; busy = true; $('om').classList.add('hidden');
  const k = g.userData.k, p = plan(g);
  try {
    if (!(await walkTo(p.app))) { P.toast && P.toast('Не пройти — освободи проход в ремонте'); return }
    if (p.via) await glide(p.via, 0, Math.atan2(p.via.x - hero.position.x, p.via.z - hero.position.z), 0, 450);
    pose(p.pose); await glide(p.at, p.y, p.rot, p.rx || 0, 650);
    if (p.face) hero.rotation.y = Math.atan2(p.face.x - hero.position.x, p.face.z - hero.position.z);
    doing = { k, anim: p.anim }; say(EMO[k] || '✨'); if (p.prop && !p.then) hold(p.prop); if (P.HAP) P.HAP('medium');
    if (k === 'tv' || k === 'cinema') { const sc = (k === 'tv' ? g : g); sc.traverse(o => o.name === 'screen' && (o.material.color.set('#fff'))) }
    await sleep(p.then ? 1500 : 3000);
    if (p.then) { // взял еду — идём за стол есть
      hold(p.prop); doing = null; await standUp(p); const t = OBJ.get('table'), q = plan(t);
      if (await walkTo(q.app)) { pose('sit'); await glide(q.at, q.y, q.rot, 0, 650); doing = { k, anim: 'eat' }; say('😋'); hold(p.prop); await sleep(2600); await standUp(q) }
    }
    const j = await P.call('life/act', { o: k }); if (bubble) { hero.remove(bubble); bubble = null }
    doing = null; if (!p.then) await standUp(p); if (j && j.me) { hud(); P.HAP && P.HAP('light') }
  } finally { doing = null; busy = false; if (POSE !== 'stand') await standUp(null); hero.rotation.x = 0; hero.position.y = 0; hold(null) }
}

// ---------- потребности ----------
const NI = { food: ['🍗', 'Еда'], sleep: ['😴', 'Сон'], fun: ['🎉', 'Веселье'], soc: ['💬', 'Общение'], hyg: ['🛁', 'Чистота'] };
function hud() {
  const L = LIFE(); if (!L) return;
  $('needs').innerHTML = Object.entries(NI).map(([k, [e, n]]) => { const v = Math.round(L.n[k]), c = v > 60 ? 'var(--mint)' : v > 30 ? 'var(--win)' : 'var(--tile)'; return `<div class="nd" title="${n}"><div class="rg" style="--v:${v};--c:${c}"><span>${e}</span></div><small>${n}</small></div>` }).join('');
  const m = L.mood; $('mood').innerHTML = `<b>${m >= 70 ? '😄' : m >= 40 ? '🙂' : '😟'} ${m}%</b><small>${L.k > 1 ? 'доход ×1.25' : L.k < 1 ? 'доход ×0.8' : 'доход обычный'}</small>`;
}

// ---------- камера и ввод ----------
let ang = .5, dist = innerWidth < innerHeight ? 48 : 38, BUILD = false, sel = null, drag = false;
const ray = new THREE.Raycaster(), ptr = new THREE.Vector2(), ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
function setPtr(e) { ptr.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ptr, cam) }
let sx = 0, sy = 0, lx = null;
$('gl').addEventListener('pointerdown', e => { sx = e.clientX; sy = e.clientY; lx = e.clientX; if (BUILD && sel) { setPtr(e); const h = ray.intersectObject(sel, true)[0]; drag = !!h } });
$('gl').addEventListener('pointermove', e => {
  if (drag && sel) { setPtr(e); const p = new THREE.Vector3(); ray.ray.intersectPlane(ground, p); sel.position.x = Math.round(Math.max(-HW + .8, Math.min(HW - .8, p.x)) * 2) / 2; sel.position.z = Math.round(Math.max(-HD + .8, Math.min(HD - .8, p.z)) * 2) / 2; return }
  if (lx != null && e.buttons) { ang -= (e.clientX - lx) * .005; ang = Math.max(-.2, Math.min(1.3, ang)); lx = e.clientX }
});
addEventListener('pointerup', e => {
  const tap = Math.hypot(e.clientX - sx, e.clientY - sy) < 8; lx = null;
  if (drag) { drag = false; return }
  if (!tap || e.target.id !== 'gl') return;
  setPtr(e); const h = ray.intersectObjects(furn.children, true)[0];
  if (BUILD) { select(h ? OBJ.get(h.object.userData.k) : null); return }
  if (h) { menu(OBJ.get(h.object.userData.k), e.clientX, e.clientY); return }
  $('om').classList.add('hidden');
  const p = new THREE.Vector3(); if (ray.ray.intersectPlane(ground, p) && !busy) walkTo(new THREE.Vector3(Math.max(-HW + 1, Math.min(HW - 1, p.x)), 0, Math.max(-HD + 1, Math.min(HD - 1, p.z))));
});
$('gl').addEventListener('wheel', e => dist = Math.max(18, Math.min(52, dist + e.deltaY * .03)));
$('zi').onclick = () => dist = Math.max(18, dist - 5); $('zo').onclick = () => dist = Math.min(52, dist + 5);

function menu(g, x, y) {
  const k = g.userData.k, f = CAT && CAT.furn[k]; if (!f) return;
  const eff = Object.entries(f[4]).map(([n, v]) => `${NI[n][0]} +${v}`).join(' ');
  const cd = (LIFE().cd || {})[k], left = cd ? 600 - (Date.now() / 1000 - cd) : 0;
  $('om').innerHTML = `<b>${f[0]} ${f[1]}</b>${eff ? `<small>${eff}</small><button id="use" ${left > 0 ? 'disabled' : ''}>${left > 0 ? 'Через ' + Math.ceil(left / 60) + ' мин' : USE[k] || 'Использовать'}</button>` : '<small>Украшение дома</small>'}`;
  $('om').style.left = Math.min(innerWidth - 220, Math.max(10, x - 100)) + 'px'; $('om').style.top = Math.max(70, y - 130) + 'px'; $('om').classList.remove('hidden');
  if ($('use')) $('use').onclick = () => act(g);
}
const USE = { fridge: 'Перекусить', stove: 'Приготовить ужин', chef: 'Готовить как шеф', table: 'Поесть за столом', bed: 'Поспать', kingbed: 'Спать как король', sofa: 'Отдохнуть', shower: 'Принять душ', bath: 'Полежать в ванне', jacuzzi: 'В джакузи', tv: 'Смотреть ТВ', cinema: 'Смотреть кино', pc: 'Листать Instagram', console: 'Играть', guitar: 'Сыграть', piano: 'Сыграть на рояле', books: 'Почитать', aquarium: 'Кормить рыбок', fireplace: 'Греться у камина', phone: 'Позвонить подписчикам' };
const EMO = { fridge: '🍕', stove: '🍳', chef: '🥘', table: '🍽', bed: '💤', kingbed: '👑', sofa: '🛋', shower: '🫧', bath: '🛁', jacuzzi: '♨️', tv: '📺', cinema: '🍿', pc: '📱', console: '🎮', guitar: '🎸', piano: '🎹', books: '📖', aquarium: '🐠', fireplace: '🔥', phone: '📞' };
// ---------- ремонт ----------
function select(g) { if (sel) sel.traverse(o => o.material && o.material.emissive && o.userData.em0 !== undefined && o.material.emissive.setHex(o.userData.em0)); sel = g; $('bsel').classList.toggle('hidden', !g); if (g) { g.traverse(o => { if (o.material && o.material.emissive) { o.userData.em0 = o.material.emissive.getHex(); o.material = o.material.clone(); o.material.emissive.setHex(0x5a3a00) } }); $('bname').textContent = CAT.furn[g.userData.k][0] + ' ' + CAT.furn[g.userData.k][1] } }
$('rot').onclick = () => sel && (sel.rotation.y = (sel.rotation.y + Math.PI / 2) % (Math.PI * 2));
$('stow').onclick = () => { if (!sel) return; OBJ.delete(sel.userData.k); furn.remove(sel); select(null); drawer() };
function layout() { return [...OBJ.values()].map(g => [g.userData.k, g.position.x, g.position.z, +g.rotation.y.toFixed(2)]) }
$('build').onclick = () => { BUILD = true; document.body.classList.add('bm'); $('om').classList.add('hidden'); drawer() };
$('bdone').onclick = async () => { BUILD = false; select(null); rebuildGrid(); document.body.classList.remove('bm'); await P.call('life/save', { furn: layout(), wall: '#' + wallM.color.getHexString(), floor: LIFE().floor }); };
const WALLS = ['#f3e3c8', '#e9e4ff', '#cfe8d8', '#ffd9cf', '#bfd7ff', '#3b3170', '#ffffff', '#f6e7a8'], FLOORS = ['#b98a5a', '#8a5a3a', '#d8b98a', '#6a6a7a', '#c9a0a0', '#e0d0b0'];
function drawer() {
  const L = LIFE(), placed = new Set(OBJ.keys()), F = CAT.furn;
  const own = L.own.filter(k => !placed.has(k)), buy = Object.keys(F).filter(k => !L.own.includes(k));
  $('dr').innerHTML = `<div class="sw"><span>Стены</span>${WALLS.map(c => `<i data-w="${c}" style="background:${c}"></i>`).join('')}</div><div class="sw"><span>Пол</span>${FLOORS.map(c => `<i data-f="${c}" style="background:${c}"></i>`).join('')}</div>` +
    (own.length ? `<h3>На складе</h3><div class="row">${own.map(k => `<button class="fi" data-p="${k}"><em>${F[k][0]}</em>${F[k][1].split(':')[0]}<b>Поставить</b></button>`).join('')}</div>` : '') +
    `<h3>Купить мебель</h3><div class="row">${buy.map(k => { const f = F[k], eff = Object.entries(f[4]).map(([n, v]) => NI[n][0] + '+' + v).join(' '); return `<button class="fi ${f[3] ? 'st' : ''}" data-b="${k}"><em>${f[0]}</em>${f[1].split(':')[0]}<small>${eff || 'декор'}</small><b>${f[3] ? f[3] + ' ⭐' : f[2].toLocaleString('ru') + ' 🪙'}</b></button>` }).join('')}</div>`;
  document.querySelectorAll('[data-w]').forEach(i => i.onclick = () => { L.wall = i.dataset.w; wallM.color.set(L.wall) });
  document.querySelectorAll('[data-f]').forEach(i => i.onclick = () => { L.floor = i.dataset.f; buildHouse() });
  document.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { const g = addObj(b.dataset.p, hero.position.x, hero.position.z, 0); select(g); drawer() });
  document.querySelectorAll('[data-b]').forEach(b => b.onclick = async () => { const k = b.dataset.b; if (F[k][3]) { P.buy('f_' + k); return } const j = await P.call('life/buy', { k }); if (j && j.me) { const g = addObj(k, 0, 0, 0); select(g); drawer() } });
}

// ---------- образ ----------
const LN = { g: 'Пол', sk: 'Кожа', hc: 'Цвет волос', hs: 'Причёска', sh: 'Одежда', pa: 'Брюки', ac: 'Аксессуар' };
const ACN = { '': 'нет', cap: '🧢 кепка', glasses: '👓 очки', crown: '👑 корона (VIP)', headphones: '🎧 наушники', tubeteika: 'тюбетейка' };
let draft = null;
$('lookb').onclick = () => {
  draft = { ...LIFE().look }; const V = CAT.lookv; $('lk').classList.remove('hidden');
  const draw = () => { $('lkb').innerHTML = Object.keys(LN).map(k => `<div class="lr"><span>${LN[k]}</span><div>${V[k].map(v => k === 'g' ? `<button data-k="g" data-v="${v}" class="${draft.g === v ? 'on' : ''}">${v === 'm' ? 'Парень' : 'Девушка'}</button>` : k === 'hs' ? `<button data-k="hs" data-v="${v}" class="${draft.hs === v ? 'on' : ''}">${['Короткая', 'Длинная', 'Ёжик', 'Хвост', 'Ирокез'][v]}</button>` : k === 'ac' ? `<button data-k="ac" data-v="${v}" class="${draft.ac === v ? 'on' : ''}">${ACN[v]}</button>` : `<i data-k="${k}" data-v="${v}" class="${draft[k] === v ? 'on' : ''}" style="background:${v}"></i>`).join('')}</div></div>`).join('');
    document.querySelectorAll('#lkb [data-k]').forEach(b => b.onclick = () => { const k = b.dataset.k; draft[k] = k === 'hs' ? +b.dataset.v : b.dataset.v; rebuildHero(draft); draw() }) };
  draw();
};
$('lksave').onclick = async () => { const j = await P.call('life/look', { look: draft }); $('lk').classList.add('hidden'); if (j && j.me) { rebuildHero(LIFE().look); P.postLook && P.postLook() } };
$('lkx').onclick = () => { $('lk').classList.add('hidden'); rebuildHero(LIFE().look) };
$('exit').onclick = () => P.closeLife && P.closeLife();

// ---------- струи душа ----------
const DROPS = new THREE.Group(); scene.add(DROPS); { const m = new THREE.MeshBasicMaterial({ color: '#bfe8ff', transparent: true, opacity: .7 }); for (let i = 0; i < 40; i++) { const d = new THREE.Mesh(new THREE.CylinderGeometry(.02, .02, .35, 4), m); d.userData.o = Math.random(); d.userData.a = Math.random() * 6.3; d.userData.r = Math.random() * .5; DROPS.add(d) } }
function drops(t) { const sh = OBJ.get('shower'); if (!sh) return; DROPS.visible = true; const c = L2W(sh, 0, -.6); for (const d of DROPS.children) { const k = (t * 1.6 + d.userData.o) % 1; d.position.set(c.x + Math.cos(d.userData.a) * d.userData.r, 3.6 - k * 3.4, c.z + Math.sin(d.userData.a) * d.userData.r) } }
// ---------- цикл ----------
const t0 = performance.now(); let last = t0;
function loop(now) {
  requestAnimationFrame(loop); const t = (now - t0) / 1000, dt = Math.min(.05, (now - last) / 1000); last = now;
  if (path.length && !doing) { const p0 = path[0], d = p0.clone().sub(hero.position); d.y = 0; const Ld = d.length(); if (Ld > .12) { hero.position.addScaledVector(d.normalize(), Math.min(Ld, 6.5 * dt)); let ry = Math.atan2(d.x, d.z), cur = hero.rotation.y; while (ry - cur > Math.PI) ry -= Math.PI * 2; while (cur - ry > Math.PI) ry += Math.PI * 2; hero.rotation.y = cur + (ry - cur) * Math.min(1, dt * 12); walk(hero, t, true) } else { path.shift(); if (!path.length) { walk(hero, t, false); path.done && path.done(true) } } }
  else if (POSE === 'stand' && !doing) walk(hero, t, false);
  if (doing) { const U = hero.userData, A = doing.anim;
    if (A === 'eat') { U.arms[1].rotation.x = -1.6 - Math.max(0, Math.sin(t * 4)) * .9; U.arms[0].rotation.x = -.9 }
    else if (A === 'type') U.arms.forEach((a, i) => a.rotation.x = -1.3 + Math.sin(t * 16 + i * 2) * .12);
    else if (A === 'game') U.arms.forEach((a, i) => a.rotation.x = -1.2 + Math.sin(t * 11 + i) * .15);
    else if (A === 'phone') { U.arms[1].rotation.x = -2.6; U.arms[1].rotation.z = .3 }
    else if (A === 'guitar') { U.arms[0].rotation.x = -1.1; U.arms[1].rotation.x = -.9 + Math.sin(t * 14) * .3 }
    else if (A === 'read') U.arms.forEach(a => a.rotation.x = -1.2);
    else if (A === 'cook' || A === 'fridge') U.arms.forEach((a, i) => a.rotation.x = -1.3 + Math.sin(t * 6 + i * 2) * .3);
    else if (A === 'shower') { U.arms.forEach((a, i) => a.rotation.x = -2.4 + Math.sin(t * 7 + i * 3) * .4); drops(t) }
    else if (A === 'watch' || A === 'relax') U.arms.forEach(a => a.rotation.x = -.5);
    else if (A === 'sleep' || A === 'bath') { U.head.rotation.x = Math.sin(t * 1.5) * .05 }
    else U.arms.forEach((a, i) => a.rotation.x = -.6 + Math.sin(t * 3 + i) * .1);
  }
  if (!doing || doing.anim !== 'shower') DROPS.visible = false;
  if (bubble) bubble.position.y = 4.1 + Math.sin(t * 4) * .1;
  hero.userData.ring.material.opacity = .5 + .3 * Math.sin(t * 4);
  for (const g of furn.children) g.traverse(o => { if (o.name === 'screen') o.material.color.setHSL((t * .05 + g.position.x * .01) % 1, .6, .55); if (o.name === 'flame') o.scale.y = .8 + Math.sin(t * 12) * .25; if (o.name === 'fish') o.position.x = Math.sin(t * .8 + o.position.y * 3) * 1; if (o.name === 'water') o.position.y = .95 + Math.sin(t * 3) * .03 });
  const tx = BUILD && sel ? sel.position.x * .3 : hero.position.x * (innerWidth < innerHeight ? .5 : .2), tz = BUILD && sel ? sel.position.z * .3 : hero.position.z * .2 + 1.5;
  cam.position.set(tx + Math.sin(ang) * dist * .75, dist * .82, tz + Math.cos(ang) * dist * .75); cam.lookAt(tx, 1, tz);
  R.render(scene, cam);
}
(async () => {
  const j = await P.call('rels'); CAT = j || { furn: {}, lookv: {} };
  buildHouse(); placeAll(); rebuildGrid(); hud(); $('load').remove(); requestAnimationFrame(loop);
  setInterval(hud, 30000);
})();
window.hud = hud; window.__act = k => OBJ.get(k) && act(OBJ.get(k));
