// «Мой дом изнутри» — жизнь жителя Города подписчиков
import * as THREE from './three.js';
import { makeHero, walk, play, tickHeroes, dispose } from './hero.js';
const P = parent, $ = id => document.getElementById(id);
const GUEST = new URLSearchParams(location.search).get('guest'); let GL = null;
const ME = () => P.ME, HOME = () => P.ME && P.ME.life, LIFE = () => GUEST ? GL : HOME();
let CAT = null;
const HW = 16, HD = 15, WH = 4.2; // половина ширины/глубины дома, высота стен

// ---------- сцена ----------
const R = new THREE.WebGLRenderer({ canvas: $('gl'), antialias: true });
R.setPixelRatio(Math.min(1.7, devicePixelRatio)); R.setSize(innerWidth, innerHeight);
R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.1; R.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene(); scene.background = new THREE.Color('#1b1446'); scene.fog = new THREE.Fog('#1b1446', 70, 150);
const cam = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, .5, 400);
addEventListener('resize', () => { R.setSize(innerWidth, innerHeight); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix() });
const hour = (new Date().getUTCHours() + 3) % 24, NIGHT = (hour >= 20 || hour < 6) && !/day=1/.test(location.search);
scene.add(new THREE.HemisphereLight(NIGHT ? '#8a86d8' : '#fff4e0', '#3a2a50', NIGHT ? .55 : .9));
const sun = new THREE.DirectionalLight(NIGHT ? '#9fb0ff' : '#fff1d6', NIGHT ? .5 : 1.6);
sun.position.set(-14, 26, 18); sun.castShadow = true; sun.shadow.mapSize.set(1536, 1536);
Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 20, bottom: -20, near: 1, far: 70 }); sun.shadow.bias = -.0006; scene.add(sun);
const mat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .75, ...o });
function B(w, h, d, c, x, y, z, p, o) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), c.isMaterial ? c : mat(c, o)); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; p.add(m); return m }
function C(rt, rb, h, c, x, y, z, p, seg = 20, o) { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), c.isMaterial ? c : mat(c, o)); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; p.add(m); return m }

// ---------- двор: вокруг дома трава, дорожка, деревья, забор — нет пустоты ----------
{ const yard = new THREE.Group(); scene.add(yard);
  const gt = tex((x, w, h) => { x.fillStyle = NIGHT ? '#1f4a2c' : '#5fae4e'; x.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(${NIGHT ? '20,60,30' : '40,120,40'},${Math.random() * .5})`; x.fillRect(Math.random() * w, Math.random() * h, 2, 5) } });
  gt.wrapS = gt.wrapT = THREE.RepeatWrapping; gt.repeat.set(30, 30);
  const gr = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), mat('#fff', { map: gt, roughness: 1 })); gr.rotation.x = -Math.PI / 2; gr.position.y = -.31; gr.receiveShadow = true; yard.add(gr);
  B(3, .05, 40, '#d8c6a0', 0, -.28, HD + 20, yard);
  const fm = mat('#f7f1e6'); for (let x = -28; x <= 28; x += 2) for (const z of [-HD - 8, HD + 9]) if (Math.abs(x) > 2 || z < 0) B(.25, 1.4, .25, fm, x, .4, z, yard);
  for (const z of [-HD - 8, HD + 9]) { B(25.6, .15, .1, fm, -15, .9, z, yard); B(25.6, .15, .1, fm, 15, .9, z, yard) }
  for (const x of [-28, 28]) B(.1, .15, 2 * HD + 17, fm, x, .9, .5, yard);
  const lf = mat(NIGHT ? '#2d6a3a' : '#3f9a48'), tr = mat('#6a4428');
  for (const [x, z, s] of [[-22, -18, 1.2], [-23, -6, 1], [-21, 6, 1.3], [-23, 16, 1], [22, -17, 1.1], [23, -4, 1.3], [21, 8, 1], [22, 18, 1.2], [-9, 21, .9], [9, 22, 1.1], [-14, -21, 1], [12, -21, .9]]) { C(.3 * s, .4 * s, 2 * s, tr, x, s, z, yard, 8); const t = new THREE.Mesh(new THREE.IcosahedronGeometry(1.8 * s, 0), lf); t.position.set(x, 2.9 * s, z); t.castShadow = true; yard.add(t) }
  for (const [x, z] of [[-4, HD + 3], [4, HD + 3], [-6, HD + 6], [6, HD + 6]]) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(.8, 0), mat('#4fae5a')); b.position.set(x, .4, z); yard.add(b) }
}
// ---------- дом ----------
const house = new THREE.Group(); scene.add(house);
let floorM, wallM;
function tex(fn, w = 256, h = 256) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t }
// планировка: 6 комнат, перегородки с дверными проёмами
const X1 = -HW / 3 * 1, X2 = HW / 3 * 1, XA = -HW + (HW * 2) / 3, XB = -HW + (HW * 4) / 3; // XA=-5.33, XB=5.33
const WALLS = [ // [x0,z0,x1,z1,высокая] — 9 комнат 3×3
  [XA, -HD, XA, -11.3, 1], [XA, -8.7, XA, -5, 1], [XA, -5, XA, -1.3, 0], [XA, 1.3, XA, 8.7, 0], [XA, 11.3, XA, HD, 0],
  [XB, -HD, XB, -11.3, 1], [XB, -8.7, XB, -5, 1], [XB, -5, XB, -1.3, 0], [XB, 1.3, XB, 8.7, 0], [XB, 11.3, XB, HD, 0],
  [-HW, -5, -12, -5, 1], [-9.37, -5, -1.3, -5, 1], [1.3, -5, HW, -5, 1],
  [-HW, 5, -12, 5, 0], [-9.37, 5, -1.3, 5, 0], [1.3, 5, 9.37, 5, 0], [11.97, 5, HW, 5, 0]];
const DOORS = [[XA, -10, 'z'], [XB, -10, 'z'], [XA, 0, 'z'], [XB, 0, 'z'], [XA, 10, 'z'], [XB, 10, 'z'], [-10.67, -5, 'x'], [0, -5, 'x'], [-10.67, 5, 'x'], [0, 5, 'x'], [10.67, 5, 'x']];
const ROOMS = [['Кухня', -10.7, -10], ['Гостиная', 0, -10], ['Спальня', 10.7, -10], ['Столовая', -10.7, 0], ['Холл', 0, 0], ['Игровая', 10.7, 0], ['Ванная', -10.7, 10], ['Прихожая', 0, 10], ['Кабинет', 10.7, 10]];
let DOORM = [];
function buildHouse() {
  house.clear(); DOORM = [];
  const L = LIFE();
  const wood = tex((x, w, h) => { x.fillStyle = L.floor; x.fillRect(0, 0, w, h); for (let i = 0; i < 8; i++) { x.fillStyle = `rgba(0,0,0,${.05 + (i % 3) * .03})`; x.fillRect(0, i * 32, w, 2); x.fillStyle = `rgba(255,255,255,${.03 * (i % 2)})`; x.fillRect((i * 97) % w, i * 32 + 2, 90, 30) } });
  wood.wrapS = wood.wrapT = THREE.RepeatWrapping; wood.repeat.set(5, 4.5);
  floorM = mat('#ffffff', { map: wood, roughness: .6 });
  const fl = new THREE.Mesh(new THREE.BoxGeometry(HW * 2, .3, HD * 2), floorM); fl.position.y = -.15; fl.receiveShadow = true; fl.name = 'floor'; house.add(fl);
  const tile = tex((x, w, h) => { x.fillStyle = '#e9f3f7'; x.fillRect(0, 0, w, h); x.strokeStyle = '#b9cdd6'; x.lineWidth = 4; for (let i = 0; i <= 4; i++) { x.beginPath(); x.moveTo(i * 64, 0); x.lineTo(i * 64, h); x.moveTo(0, i * 64); x.lineTo(w, i * 64); x.stroke() } });
  tile.wrapS = tile.wrapT = THREE.RepeatWrapping; tile.repeat.set(3, 3);
  const bt = new THREE.Mesh(new THREE.PlaneGeometry(XA + HW - .3, 9.7), mat('#fff', { map: tile, roughness: .3 })); bt.rotation.x = -Math.PI / 2; bt.position.set((-HW + XA) / 2, .02, 10); bt.receiveShadow = true; house.add(bt);
  const chk = tex((x, w, h) => { for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { x.fillStyle = (i + j) % 2 ? '#f2efe6' : '#3a3a4a'; x.fillRect(i * 32, j * 32, 32, 32) } }); chk.wrapS = chk.wrapT = THREE.RepeatWrapping; chk.repeat.set(3, 2.5);
  const kt = new THREE.Mesh(new THREE.PlaneGeometry(XA + HW - .3, 9.7), mat('#fff', { map: chk, roughness: .35 })); kt.rotation.x = -Math.PI / 2; kt.position.set((-HW + XA) / 2, .02, -10); kt.receiveShadow = true; house.add(kt);
  const mat2 = tex((x, w, h) => { x.fillStyle = '#7a3a2a'; x.fillRect(0, 0, w, h); x.fillStyle = '#c9a24e'; x.font = 'bold 40px sans-serif'; x.textAlign = 'center'; x.fillText('ДОБРО ПОЖАЛОВАТЬ', w / 2, 80) }, 512, 128);
  const dm = new THREE.Mesh(new THREE.PlaneGeometry(3.4, .9), new THREE.MeshStandardMaterial({ map: mat2 })); dm.rotation.x = -Math.PI / 2; dm.position.set(0, .03, HD - .8); house.add(dm);
  wallM = mat(L.wall, { roughness: .9 });
  const trim = mat('#ffffff', { roughness: .5 });
  B(HW * 2 + .4, WH, .3, wallM, 0, WH / 2, -HD - .15, house);
  B(.3, WH, HD * 2 + .3, wallM, -HW - .15, WH / 2, 0, house);
  B(HW - 1.3, .7, .3, wallM, -HW / 2 - .65, .35, HD + .15, house); B(HW - 1.3, .7, .3, wallM, HW / 2 + .65, .35, HD + .15, house);
  B(.3, .7, HD * 2 + .3, wallM, HW + .15, .35, 0, house);
  B(HW * 2 + .4, .18, .34, trim, 0, WH, -HD - .15, house);
  for (const [x0, z0, x1, z1, hi] of WALLS) { const h = hi ? WH * .8 : 1.4, len = Math.hypot(x1 - x0, z1 - z0); B(x0 === x1 ? .25 : len, h, x0 === x1 ? len : .25, wallM, (x0 + x1) / 2, h / 2, (z0 + z1) / 2, house); B(x0 === x1 ? .3 : len, .12, x0 === x1 ? len : .3, trim, (x0 + x1) / 2, h + .06, (z0 + z1) / 2, house) }
  // двери: створка на петлях открывается, когда жилец рядом
  const doorM = mat('#8a5a3a', { roughness: .55 });
  for (const [dx, dz, ax] of DOORS) { const piv = new THREE.Group(); const w = 2.5; if (ax === 'z') piv.position.set(dx, 0, dz - w / 2); else piv.position.set(dx - w / 2, 0, dz); house.add(piv);
    const leaf = B(ax === 'z' ? .12 : w, 3.2, ax === 'z' ? w : .12, doorM, ax === 'z' ? 0 : w / 2, 1.6, ax === 'z' ? w / 2 : 0, piv); B(ax === 'z' ? .2 : .18, .18, ax === 'z' ? .18 : .2, mat('#ffc65c', { metalness: .8, roughness: .3 }), ax === 'z' ? .1 : w - .3, 1.5, ax === 'z' ? w - .3 : .1, piv);
    for (const s2 of [0, w]) B(ax === 'z' ? .3 : .15, 3.4, ax === 'z' ? .15 : .3, trim, ax === 'z' ? 0 : s2, 1.7, ax === 'z' ? s2 : 0, piv);
    DOORM.push({ piv, cx: dx, cz: dz, ax, a: 0 }) }
  const view = tex((x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, NIGHT ? '#0d0a2e' : '#7cc4ff'); g.addColorStop(1, NIGHT ? '#3a2a6a' : '#d8efff'); x.fillStyle = g; x.fillRect(0, 0, w, h); let X = 0; while (X < w) { const bw = 18 + Math.random() * 30, bh = 40 + Math.random() * 110; x.fillStyle = NIGHT ? '#151033' : '#8aa0c8'; x.fillRect(X, h - bh, bw, bh); x.fillStyle = '#ffc65c'; for (let yy = h - bh + 8; yy < h - 6; yy += 14) for (let xx = X + 4; xx < X + bw - 6; xx += 10) if (Math.random() < (NIGHT ? .45 : .12)) x.fillRect(xx, yy, 5, 7); X += bw + 4 } }, 256, 160);
  for (const x of [-10.7, 6.6]) { B(4.2, 2.6, .2, trim, x, 2.4, -HD + .05, house); const gl = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 2.2), new THREE.MeshBasicMaterial({ map: view, toneMapped: false })); gl.position.set(x, 2.4, -HD + .17); house.add(gl); B(.12, 2.2, .1, trim, x, 2.4, -HD + .2, house) }
  const me = ME();
  const card = tex((x, w, h) => { x.fillStyle = '#2b2266'; x.fillRect(0, 0, w, h); x.fillStyle = '#ffc65c'; x.font = 'bold 30px sans-serif'; x.textAlign = 'center'; x.fillText('@' + (me && me.nick || 'житель'), w / 2, 70); x.fillStyle = '#e9e4ff'; x.font = '22px sans-serif'; x.fillText('мой дом в Городе', w / 2, 112); x.fillText('подписчиков', w / 2, 140); x.font = '60px serif'; x.fillText('🏡', w / 2, 220) }, 256, 256);
  const fc = B(1.9, 1.9, .12, '#7a4a2a', -HW + .1, 2.6, -9.5, house); fc.rotation.y = Math.PI / 2;
  const fp = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), new THREE.MeshBasicMaterial({ map: card })); fp.position.set(-HW + .2, 2.6, -9.5); fp.rotation.y = Math.PI / 2; house.add(fp);
  const post = tex((x, w, h) => { x.fillStyle = '#ff6b4a'; x.fillRect(0, 0, w, h); x.fillStyle = '#fff'; x.font = 'bold 34px sans-serif'; x.textAlign = 'center'; x.fillText('ГОРОД', w / 2, 70); x.fillText('ПОДПИСЧИКОВ', w / 2, 110); x.font = '22px sans-serif'; x.fillText('@gorod.podpischikov001', w / 2, 230); x.font = '70px serif'; x.fillText('🏙', w / 2, 190) }, 256, 256);
  const pp = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.8), new THREE.MeshStandardMaterial({ map: post })); pp.position.set(-2.2, 2.6, -HD + .2); house.add(pp);
  for (const [t, x, z] of ROOMS) { const s = tex((c, w, h) => { c.font = 'bold 44px sans-serif'; c.textAlign = 'center'; c.fillStyle = 'rgba(43,34,102,.3)'; c.fillText(t, w / 2, 60) }, 256, 80); const m = new THREE.Mesh(new THREE.PlaneGeometry(4, 1.25), new THREE.MeshBasicMaterial({ map: s, transparent: true, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.set(x, .04, z + 3.4); house.add(m) }
  for (const [, x, z] of ROOMS) { const l = new THREE.PointLight('#ffd9a0', NIGHT ? 22 : 6, 15, 1.6); l.position.set(x, 3.6, z); house.add(l) }
}
function doorsTick(dt) { for (const d of DOORM) { const near = Math.hypot(hero.position.x - d.cx, hero.position.z - d.cz) < 2.8; d.a += ((near ? 1.45 : 0) - d.a) * Math.min(1, dt * 6); d.piv.rotation.y = d.ax === 'z' ? -d.a : d.a } }

// ---------- мебель ----------
const FB = {
  armchair: g => { B(1.8, .5, 1.6, '#c9534a', 0, .45, 0, g); B(1.8, 1.2, .35, '#b2453d', 0, 1.1, -.65, g); B(.3, .8, 1.6, '#b2453d', -.8, .85, 0, g); B(.3, .8, 1.6, '#b2453d', .8, .85, 0, g); for (const x of [-.7, .7]) for (const z of [-.6, .6]) C(.06, .06, .2, '#3a2a1a', x, .1, z, g, 6); return 1.6 },
  coffee: g => { B(1.2, 1.1, .9, '#6a4a3a', 0, .55, 0, g); B(.9, 1.1, .7, '#2a2a30', 0, 1.65, 0, g, { metalness: .5, roughness: .3 }); B(.5, .25, .3, '#c0c6cc', 0, 1.35, .3, g, { metalness: .8 }); C(.12, .1, .2, '#ffffff', 0, 1.22, .35, g, 10); B(.6, .15, .02, '#5ee6b0', 0, 2, .36, g, { emissive: '#2a8a60' }); return .9 },
  treadmill: g => { B(1.4, .3, 3.2, '#2a2a33', 0, .15, 0, g); B(1.1, .04, 2.8, '#111', 0, .32, .1, g); for (const x of [-.6, .6]) B(.1, 1.6, .1, '#888', x, 1, -1.4, g, { metalness: .6 }); B(1.3, .5, .2, '#333', 0, 1.8, -1.4, g); B(.8, .25, .02, '#58a8ff', 0, 1.85, -1.29, g, { emissive: '#2050a0' }); return 3.2 },
  palm: g => { C(.55, .45, .9, '#c47a4a', 0, .45, 0, g, 12); C(.12, .18, 3.2, '#8a6a3a', 0, 2.4, 0, g, 8); const lm = mat('#3fae58'); for (let i = 0; i < 6; i++) { const l = B(.35, .06, 2, lm, 0, 4, 0, g); l.rotation.y = i * Math.PI / 3; l.rotation.x = .55; l.position.set(Math.sin(i * Math.PI / 3) * .8, 3.8, Math.cos(i * Math.PI / 3) * .8) } return 1.1 },
  easel: g => { for (const x of [-.5, .5]) { const l = B(.08, 2.6, .08, '#8a5a3a', x, 1.3, 0, g); l.rotation.z = x > 0 ? -.12 : .12 } B(.08, 2.4, .08, '#8a5a3a', 0, 1.2, -.5, g); const pt = tex((x, w, h) => { x.fillStyle = '#fdf6e3'; x.fillRect(0, 0, w, h); for (let i = 0; i < 14; i++) { x.fillStyle = `hsl(${i * 37},70%,60%)`; x.beginPath(); x.arc(Math.random() * w, Math.random() * h, 10 + Math.random() * 30, 0, 7); x.fill() } }); const cv = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.2, .06), [mat('#eee'), mat('#eee'), mat('#eee'), mat('#eee'), mat('#fff', { map: pt }), mat('#eee')]); cv.position.set(0, 2, .08); cv.rotation.x = -.1; g.add(cv); B(1.4, .08, .25, '#8a5a3a', 0, 1.35, .12, g); return 1 },
  robot: g => { const r = new THREE.Group(); r.name = 'robot'; g.add(r); C(.55, .55, .25, '#e8e8f0', 0, .18, 0, r, 20, { metalness: .3, roughness: .3 }); C(.2, .2, .06, '#2a2a33', 0, .33, 0, r, 12); B(.12, .04, .04, '#5ee6b0', 0, .35, .4, r, { emissive: '#30c080' }); return 1.1 },
  goldtoilet: g => { const gm = mat('#ffc94a', { metalness: .9, roughness: .2 }); B(1, .9, .5, gm, 0, .95, -.55, g); C(.42, .32, .5, gm, 0, .25, .1, g, 20); C(.46, .46, .08, gm, 0, .54, .12, g, 20); B(.9, .06, .45, '#fff1b8', 0, 1.42, -.55, g); return 1.4 },
  dj: g => { B(2.6, 1.1, 1, '#1d1a2e', 0, .55, 0, g); B(2.6, .08, 1.05, '#ff4fd8', 0, 1.1, 0, g, { emissive: '#a02080' }); for (const x of [-.75, .75]) { const d = C(.35, .35, .06, '#333', x, 1.15, 0, g, 20); d.name = 'disc' } B(.5, .1, .4, '#58a8ff', 0, 1.16, 0, g, { emissive: '#2050a0' }); for (const x of [-1.6, 1.6]) { B(.7, 1.8, .7, '#222', x, .9, -.2, g); C(.25, .25, .05, '#555', x, 1.2, .16, g, 16).rotation.x = Math.PI / 2 } return 1 },
  telescope: g => { for (let i = 0; i < 3; i++) { const l = B(.06, 1.8, .06, '#555', Math.sin(i * 2.1) * .35, .85, Math.cos(i * 2.1) * .35, g); l.rotation.set(Math.cos(i * 2.1) * .2, 0, -Math.sin(i * 2.1) * .2) } const t = C(.16, .22, 1.8, '#f2f2f8', 0, 2, .2, g, 14, { metalness: .4 }); t.rotation.x = -1; C(.1, .1, .2, '#222', 0, 1.6, -.25, g, 10).rotation.x = -1; return 1 },
  toilet: g => { B(1, .9, .5, '#f4f7f9', 0, .95, -.55, g, { roughness: .25 }); C(.42, .32, .5, '#f4f7f9', 0, .25, .1, g, 20, { roughness: .25 }); C(.46, .46, .08, '#e2e8ec', 0, .54, .12, g, 20); B(.9, .06, .45, '#e2e8ec', 0, 1.42, -.55, g); B(.12, .05, .05, '#a0a8b0', .3, 1.48, -.55, g); B(.5, .4, .12, '#f0f0f0', .9, .9, -.75, g); return 1.4 },
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
  arcade: g => { B(1.6, 3.4, 1.2, '#2b2266', 0, 1.7, 0, g); const s = new THREE.Mesh(new THREE.PlaneGeometry(1.2, .9), new THREE.MeshBasicMaterial({ color: '#7dff8a' })); s.position.set(0, 2.5, .61); s.name = 'screen'; g.add(s); B(1.5, .2, .6, '#ff6b4a', 0, 1.7, .7, g); for (const x of [-.3, .3]) { C(.05, .05, .25, '#111', x, 1.9, .75, g, 6); const b = new THREE.Mesh(new THREE.SphereGeometry(.09, 8, 6), mat(x < 0 ? '#e8433a' : '#ffc65c')); b.position.set(x, 2.03, .75); g.add(b) } B(1.7, .3, 1.3, '#ffc65c', 0, 3.5, 0, g, { emissive: '#aa7a00', emissiveIntensity: .5 }); return 1.2 },
  throne: g => { const gm = mat('#ffc65c', { metalness: .85, roughness: .25, emissive: '#5a3a00', emissiveIntensity: .3 }); B(1.8, .6, 1.6, gm, 0, .3, 0, g); B(1.6, .25, 1.4, '#c0392b', 0, .72, 0, g); B(1.8, 3.4, .3, gm, 0, 1.9, -.7, g); B(1.5, 2.6, .1, '#c0392b', 0, 2, -.53, g); for (const x of [-.9, .9]) B(.25, 1, 1.4, gm, x, 1, 0, g); for (let i = 0; i < 3; i++) { const sp = new THREE.Mesh(new THREE.ConeGeometry(.15, .5, 5), gm); sp.position.set(-.6 + i * .6, 3.8, -.7); g.add(sp) } return 1.6 },
  neon: g => { const me = ME(); const t = tex((x, w, h) => { x.fillStyle = 'rgba(0,0,0,0)'; x.clearRect(0, 0, w, h); x.font = 'bold 64px Unbounded,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.shadowColor = '#ff4fd8'; x.shadowBlur = 24; x.fillStyle = '#ffd1f6'; x.fillText('@' + ((me && me.nick) || 'житель'), w / 2, h / 2) }, 1024, 160); const m = new THREE.Mesh(new THREE.PlaneGeometry(5, .8), new THREE.MeshBasicMaterial({ map: t, transparent: true, toneMapped: false })); m.position.set(0, 3, .02); g.add(m); const l = new THREE.PointLight('#ff4fd8', 8, 7); l.position.set(0, 3, 1); g.add(l); return 0 },
  goldtv: g => { const gm = mat('#ffc65c', { metalness: .85, roughness: .25 }); B(5, .8, 1.1, gm, 0, .4, 0, g); B(4.8, 2.7, .14, gm, 0, 2.3, 0, g); const s = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 2.4), new THREE.MeshBasicMaterial({ color: '#4fc3ff' })); s.position.set(0, 2.3, .08); s.name = 'screen'; g.add(s); return 1.1 },
  sauna: g => { const w = mat('#c08a5a', { roughness: .8 }); B(3, 3.4, .15, w, 0, 1.7, -1.4, g); B(.15, 3.4, 3, w, -1.45, 1.7, 0, g); B(.15, 3.4, 3, w, 1.45, 1.7, 0, g); B(3, .15, 3, w, 0, 3.4, 0, g); B(2.6, .2, 1, w, 0, .9, -.8, g); const st = new THREE.Mesh(new THREE.SphereGeometry(.4, 8, 6), mat('#7a7a7a')); st.position.set(1, .4, .8); g.add(st); const l = new THREE.PointLight('#ff9a4a', 5, 5); l.position.set(0, 2.5, 0); g.add(l); return 3 },
  wardrobe: g => { B(2.6, 3.8, 1.1, '#7a4a2a', 0, 1.9, 0, g); B(.05, 3.4, .02, '#4a2a14', 0, 1.9, .56, g); for (const x of [-.25, .25]) B(.08, .5, .08, '#ffc65c', x, 2, .6, g); return 1.1 },
  desk: g => { B(2.6, .12, 1.3, '#a0703a', 0, 1.5, 0, g); for (const [x, z] of [[-1.2, -.55], [1.2, -.55], [-1.2, .55], [1.2, .55]]) B(.1, 1.5, .1, '#5a3a24', x, .75, z, g); B(.8, .1, .8, '#2b2266', 0, .9, 1.1, g); B(.8, 1, .1, '#2b2266', 0, 1.4, 1.5, g); const lp = C(.18, .25, .5, '#ffc65c', -.9, 1.85, -.3, g, 10, { emissive: '#aa7a00' }); return 1.3 },
  dining: g => { B(3.6, 2, .9, '#3a3a5a', 0, 1, 0, g); B(3.8, .12, 1.1, '#e9e4ff', 0, 2.06, 0, g, { roughness: .2 }); for (const x of [-1.2, 0, 1.2]) { C(.3, .3, .1, '#c0392b', x, 1.4, .95, g, 12); C(.05, .05, 1.35, '#888', x, .7, .95, g, 6) } return .9 },
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
let hero = makeHero(HOME() && HOME().look); hero.position.set(0, 0, 11); hero.rotation.order = 'YXZ'; scene.add(hero);
function rebuildHero(look) { const p = hero.position.clone(), r = hero.rotation.y; scene.remove(hero); dispose(hero); hero = makeHero(look); hero.rotation.order = 'YXZ'; hero.position.copy(p); hero.rotation.y = r; scene.add(hero) }
let doing = null, bubble = null, path = [], busy = false;
hero.rotation.order = 'YXZ';
function say(e) { if (bubble) hero.remove(bubble); const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.beginPath(); x.arc(64, 58, 52, 0, 7); x.fill(); x.beginPath(); x.moveTo(50, 100); x.lineTo(64, 126); x.lineTo(78, 100); x.fill(); x.font = '64px "Noto Color Emoji",serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(e, 64, 62); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; bubble = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false })); bubble.scale.set(1.6, 1.6, 1); bubble.position.y = 4.1; bubble.renderOrder = 9; hero.add(bubble) }


// ---------- проходы: стены и мебель не проходим ----------
const CS = .5, NX = 64, NZ = 60; let GRID = new Uint8Array(NX * NZ);
const ci = (x, z) => [Math.floor((x + HW) / CS), Math.floor((z + HD) / CS)];
const cc = (i, j) => new THREE.Vector3(-HW + (i + .5) * CS, 0, -HD + (j + .5) * CS);
function wallBlocked(x, z) {
  if (Math.abs(x) > HW - .7 || Math.abs(z) > HD - .7) return true;
  for (const [x0, z0, x1, z1] of WALLS) { if (x0 === x1) { if (Math.abs(x - x0) < .55 && z > Math.min(z0, z1) - .3 && z < Math.max(z0, z1) + .3) return true } else if (Math.abs(z - z0) < .55 && x > Math.min(x0, x1) - .3 && x < Math.max(x0, x1) + .3) return true }
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
function pose(p) { POSE = p; const U = hero.userData; U.ring.visible = p === 'stand'; U.head.rotation.x = 0; if (U.acts) { play(hero, p === 'sit' ? 'SitDown' : 'Idle', { once: p === 'sit' }); } if (p === 'sit') { U.legs.forEach(l => l.rotation.x = -1.45) } if (p === 'stand' || p === 'lie') { U.legs.forEach(l => l.rotation.x = 0); U.arms.forEach(a => { a.rotation.x = 0; a.rotation.z = 0 }) } }
const L2W = (g, x, z) => { const r = g.rotation.y; return new THREE.Vector3(g.position.x + x * Math.cos(r) + z * Math.sin(r), 0, g.position.z - x * Math.sin(r) + z * Math.cos(r)) };
const HIPB = 1.05 * 1.25; const seatOf = () => (hero.userData.acts ? hero.userData.seatH : HIPB);
let PROP = null;
function hold(e) { if (PROP) { hero.remove(PROP); PROP = null } if (!e) return; const c = document.createElement('canvas'); c.width = c.height = 96; const x = c.getContext('2d'); x.font = '76px "Noto Color Emoji",serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(e, 48, 52); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; PROP = new THREE.Sprite(new THREE.SpriteMaterial({ map: t })); PROP.scale.set(.7, .7, 1); PROP.position.set(.35, 2.15, .55); hero.add(PROP) }
// куда идти и что делать с каждым предметом
function plan(g) {
  const k = g.userData.k, r = g.rotation.y, F = (x, z) => L2W(g, x, z);
  const seat = (x, z, top, face) => ({ app: F(x, z + (face === 0 ? 1.4 : -1.4) * 1), at: F(x, z), y: top - seatOf() + .05, rot: r + face, pose: 'sit' });
  const sofa = OBJ.get('sofa');
  switch (k) {
    case 'sofa': return { ...seat(0, .25, .9, 0), anim: 'relax' };
    case 'toilet': case 'goldtoilet': return { ...seat(0, .12, .58, 0), anim: 'relax' };
    case 'armchair': return { ...seat(0, .1, .7, 0), anim: 'relax' };
    case 'treadmill': return { app: F(0, 2.4), at: F(0, .2), y: .34, rot: r + Math.PI, pose: 'stand', anim: 'run' };
    case 'easel': return { app: F(0, 1.6), at: F(0, 1.5), y: 0, rot: r + Math.PI, pose: 'stand', anim: 'cook', prop: '🖌' };
    case 'dj': return { app: F(0, 1.7), at: F(0, 1.6), y: 0, rot: r + Math.PI, pose: 'stand', anim: 'game', prop: '🎧' };
    case 'coffee': return { app: F(0, 1.6), at: F(0, 1.55), y: 0, rot: r + Math.PI, pose: 'stand', anim: 'cook', prop: '☕' };
    case 'telescope': return { app: F(0, -1.2), at: F(0, -1), y: 0, rot: r, pose: 'stand', anim: 'look' };
    case 'tv': if (sofa) { const sp = plan(sofa); return { ...sp, face: g.position, anim: 'watch' } } return { app: F(0, 4), at: F(0, 3.2), y: -seatOf() + .55, rot: r + Math.PI, pose: 'sit', anim: 'watch' };
    case 'cinema': return { app: F(-1.2, 4.6), at: F(-1.2, 3.05), y: .85 - seatOf() + .1, rot: r + Math.PI, pose: 'sit', anim: 'watch', prop: '🍿' };
    case 'pc': return { app: F(0, 2.3), at: F(0, 1.15), y: 1 - seatOf() + .05, rot: r + Math.PI, pose: 'sit', anim: 'type' };
    case 'piano': return { app: F(0, 3.2), at: F(0, 2.05), y: .6 - seatOf() + .1, rot: r + Math.PI, pose: 'sit', anim: 'type' };
    case 'console': return { app: F(0, 3.4), at: F(0, 2.6), y: -seatOf() + .55, rot: r + Math.PI, pose: 'sit', anim: 'game', prop: '🎮' };
    case 'table': return { app: F(-1, 2.9), at: F(-1, 1.5), y: .95 - seatOf() + .05, rot: r + Math.PI, pose: 'sit', anim: 'eat', prop: '🍕' };
    case 'bed': case 'kingbed': return { app: F(2.6, .6), at: F(0, 1.6), y: 1.4, rot: r, rx: -Math.PI / 2, pose: 'lie', anim: 'sleep' };
    case 'bath': return { app: F(2, 0), at: F(0, 1.75), y: .75, rot: r, rx: -Math.PI / 2, pose: 'lie', anim: 'bath' };
    case 'jacuzzi': return { app: F(0, 3), at: F(0, .3), y: .55 - seatOf() + .1, rot: r + Math.PI, pose: 'sit', anim: 'bath' };
    case 'shower': return { app: F(-.55, 2.3), via: F(-.55, 1.0), at: F(-.3, -.1), y: .2, rot: r, pose: 'stand', anim: 'shower' };
    case 'fridge': case 'stove': case 'chef': return { app: F(0, (g.userData.d || 1.4) / 2 + 1.1), at: F(0, (g.userData.d || 1.4) / 2 + 1.1), y: 0, rot: r + Math.PI, pose: 'stand', anim: k === 'fridge' ? 'fridge' : 'cook', then: OBJ.get('table') ? 'table' : null, prop: k === 'fridge' ? '🥪' : '🍲' };
    case 'throne': return { ...seat(0, .1, .85, 0), anim: 'relax' };
    case 'goldtv': if (sofa) { const sp = plan(sofa); return { ...sp, face: g.position, anim: 'watch' } } return { app: F(0, 4), at: F(0, 3.2), y: -seatOf() + .55, rot: r + Math.PI, pose: 'sit', anim: 'watch' };
    case 'arcade': return { app: F(0, 1.9), at: F(0, 1.7), y: 0, rot: r + Math.PI, pose: 'stand', anim: 'game' };
    case 'sauna': return { app: F(0, 2.6), via: F(0, 1.2), at: F(0, -.6), y: .95 - seatOf() + .05, rot: r, pose: 'sit', anim: 'relax' };
    case 'desk': return { app: F(0, 2.4), at: F(0, 1.15), y: .9 - seatOf() + .05, rot: r + Math.PI, pose: 'sit', anim: 'type' };
    case 'dining': return { app: F(0, 1.9), at: F(0, 1.75), y: 0, rot: r + Math.PI, pose: 'stand', anim: 'eat', prop: '🥤' };
    case 'phone': return { app: F(.9, .9), at: F(.9, .9), y: 0, rot: r - Math.PI / 4 + Math.PI, pose: 'stand', anim: 'phone', prop: '📱' };
    case 'guitar': return { app: F(.2, 1.6), at: F(.2, 1.4), y: -seatOf() + .55, rot: r, pose: 'sit', anim: 'guitar', prop: '🎸' };
    case 'books': return { app: F(0, 1.7), at: F(0, 1.6), y: 0, rot: r, pose: 'stand', anim: 'read', prop: '📖' };
    default: { const d = (g.userData.d || 1) / 2 + 1.1; return { app: F(0, d), at: F(0, d), y: 0, rot: r + Math.PI, pose: 'stand', anim: 'look' } }
  }
}
async function standUp(p) { if (hero.userData.acts) play(hero, 'Idle'); pose('stand'); hold(null); if (p && p.via) await glide(p.via, 0, null, 0, 400); await glide(p ? p.app : hero.position, 0, null, 0, 450) }
async function act(g, ai = 0) {
  if (busy) return; busy = true; $('om').classList.add('hidden');
  const k = g.userData.k, p = plan(g), AX = CAT.actx && CAT.actx[k] && CAT.actx[k][ai];
  if (k === 'fridge') { p.prop = ['🥤', '🥪', '🍲'][ai]; if (ai < 2) p.then = null }
  if (AX && ai) { if (k === 'toilet' || k === 'phone') p.prop = AX[0]; if (k === 'pc') p.anim = 'type' }
  try {
    if (!(await walkTo(p.app))) { P.toast && P.toast('Не пройти — освободи проход в ремонте'); return }
    if (p.via) await glide(p.via, 0, Math.atan2(p.via.x - hero.position.x, p.via.z - hero.position.z), 0, 450);
    pose(p.pose); await glide(p.at, p.y, p.rot, p.rx || 0, 650);
    if (p.face) hero.rotation.y = Math.atan2(p.face.x - hero.position.x, p.face.z - hero.position.z);
    doing = { k, anim: p.anim }; say(AX ? AX[0] : EMO[k] || '✨'); if (p.prop && !p.then) hold(p.prop); if (P.HAP) P.HAP('medium');
    if (k === 'tv' || k === 'cinema') { const sc = (k === 'tv' ? g : g); sc.traverse(o => o.name === 'screen' && (o.material.color.set('#fff'))) }
    await sleep(p.then ? 1500 : 3000);
    if (p.then) { // взял еду — идём за стол есть
      hold(p.prop); doing = null; await standUp(p); const t = OBJ.get('table'), q = plan(t);
      if (await walkTo(q.app)) { pose('sit'); await glide(q.at, q.y, q.rot, 0, 650); doing = { k, anim: 'eat' }; say('😋'); hold(p.prop); await sleep(2600); await standUp(q) }
    }
    const j = GUEST ? null : await P.call('life/act', { o: k, i: ai }); if (bubble) { hero.remove(bubble); bubble = null }
    doing = null; if (!p.then) await standUp(p); if (j && j.me) { hud(); P.HAP && P.HAP('light') }
    if (k === 'pc' && ai === 1 && P.closeLife) { setTimeout(() => { P.closeLife(); P.show && P.show('work'); P.toast && P.toast('💼 Вакансии города — выбирай работу!') }, 300) }
  } finally { doing = null; busy = false; if (POSE !== 'stand') await standUp(null); hero.rotation.x = 0; hero.position.y = 0; hold(null) }
}

// ---------- потребности ----------
const NI = { food: ['🍗', 'Еда'], sleep: ['😴', 'Сон'], fun: ['🎉', 'Веселье'], soc: ['💬', 'Общение'], hyg: ['🛁', 'Чистота'] };
function hud() {
  const L = HOME(); if (!L) return;
  $('needs').innerHTML = Object.entries(NI).map(([k, [e, n]]) => { const v = Math.round(L.n[k]), c = v > 60 ? 'var(--mint)' : v > 30 ? 'var(--win)' : 'var(--tile)'; return `<div class="nd" title="${n}"><div class="rg" style="--v:${v};--c:${c}"><span>${e}</span></div><small>${n}</small></div>` }).join('');
  const m = L.mood; $('mood').innerHTML = `<b>${m >= 70 ? '😄' : m >= 40 ? '🙂' : '😟'} ${m}%</b><small>${L.k > 1 ? 'доход ×1.25' : L.k < 1 ? 'доход ×0.8' : 'доход обычный'}</small>`;
}

// ---------- камера и ввод ----------
const FK = () => dist <= 30 ? .95 : dist <= 46 ? .8 : .55;
let ang = .5, dist = innerWidth < innerHeight ? 40 : 34, BUILD = false, sel = null, drag = false;
const ray = new THREE.Raycaster(), ptr = new THREE.Vector2(), ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
function setPtr(e) { ptr.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ptr, cam) }
let sx = 0, sy = 0, lx = null;
let doff = new THREE.Vector3();
$('gl').addEventListener('pointerdown', e => { sx = e.clientX; sy = e.clientY; lx = e.clientX; if (BUILD) { setPtr(e); const h = ray.intersectObjects(furn.children, true)[0]; if (h) { const g = OBJ.get(h.object.userData.k); if (g !== sel) select(g); const p = new THREE.Vector3(); ray.ray.intersectPlane(ground, p); doff.set(sel.position.x - p.x, 0, sel.position.z - p.z); drag = true; lx = null } } });
$('gl').addEventListener('pointermove', e => {
  if (drag && sel) { setPtr(e); const p = new THREE.Vector3(); ray.ray.intersectPlane(ground, p); p.add(doff); sel.position.x = Math.round(Math.max(-HW + .8, Math.min(HW - .8, p.x)) * 4) / 4; sel.position.z = Math.round(Math.max(-HD + .8, Math.min(HD - .8, p.z)) * 4) / 4; return }
  if (lx != null && e.buttons) { ang -= (e.clientX - lx) * .005; ang = Math.max(-.2, Math.min(1.3, ang)); lx = e.clientX }
});
addEventListener('pointerup', e => {
  const tap = Math.hypot(e.clientX - sx, e.clientY - sy) < 8; lx = null;
  if (drag) { drag = false; autosave(); return }
  if (!tap || e.target.id !== 'gl') return;
  setPtr(e); const h = ray.intersectObjects(furn.children, true)[0];
  if (BUILD) { select(h ? OBJ.get(h.object.userData.k) : null); return }
  if (h) { menu(OBJ.get(h.object.userData.k), e.clientX, e.clientY); return }
  $('om').classList.add('hidden');
  const p = new THREE.Vector3(); if (ray.ray.intersectPlane(ground, p) && !busy) walkTo(new THREE.Vector3(Math.max(-HW + 1, Math.min(HW - 1, p.x)), 0, Math.max(-HD + 1, Math.min(HD - 1, p.z))));
});
$('gl').addEventListener('wheel', e => dist = Math.max(18, Math.min(66, dist + e.deltaY * .03)));
$('zi').onclick = () => dist = Math.max(18, dist - 5); $('zo').onclick = () => dist = Math.min(66, dist + 5);

function menu(g, x, y) {
  const k = g.userData.k, f = CAT && CAT.furn[k]; if (!f) return;
  const eff = Object.entries(f[4]).map(([n, v]) => `${NI[n][0]} +${v}`).join(' ');
  const cd = (LIFE().cd || {})[k], left = cd ? 600 - (Date.now() / 1000 - cd) : 0;
  if (GUEST && k === 'wardrobe') { P.toast && P.toast('👕 Это гардероб друга'); return }
  if (k === 'wardrobe') { $('om').innerHTML = `<b>${f[0]} ${f[1]}</b><small>Здесь твоя одежда и аксессуары</small><button id="use">Открыть гардероб</button>`; $('om').style.left = Math.min(innerWidth - 220, Math.max(10, x - 100)) + 'px'; $('om').style.top = Math.max(70, y - 130) + 'px'; $('om').classList.remove('hidden'); $('use').onclick = () => { $('om').classList.add('hidden'); $('lookb').click() }; return }
  const AX = CAT.actx && CAT.actx[k], cdl = ck => { const c = (LIFE().cd || {})[ck]; return c ? 600 - (Date.now() / 1000 - c) : 0 };
  const btn = (i, lab, ck, ef) => { const l = cdl(ck); return `<button class="ua" data-i="${i}" ${l > 0 ? 'disabled' : ''}>${lab}${ef ? `<small>${ef}</small>` : ''}${l > 0 ? `<small>через ${Math.ceil(l / 60)} мин</small>` : ''}</button>` };
  const efs = e => Object.entries(e).map(([n, v]) => `${NI[n][0]}+${v}`).join(' ');
  $('om').innerHTML = `<b>${f[0]} ${f[1]}</b>` + (AX ? AX.map((a, i) => btn(i, a[0] + ' ' + a[1], i ? k + '.' + i : k, efs(a[2]))).join('') : eff ? btn(0, USE[k] || 'Использовать', k, eff) : '<small>Украшение дома</small>');
  $('om').style.left = Math.min(innerWidth - 230, Math.max(10, x - 110)) + 'px'; $('om').style.top = Math.max(70, Math.min(innerHeight - 90 - (AX ? AX.length : 1) * 52, y - 150)) + 'px'; $('om').classList.remove('hidden');
  if (!GUEST) { $('om').insertAdjacentHTML('beforeend', '<button class="ua mv">✋ Переставить / повернуть</button>'); $('om').querySelector('.mv').onclick = () => moveMode(g) }
  $('om').querySelectorAll('.ua:not(.mv)').forEach(b => b.onclick = () => act(g, +b.dataset.i));
}
const USE = { arcade: 'Играть в автомат', throne: 'Сесть на трон', goldtv: 'Смотреть золотой ТВ', sauna: 'Попариться', desk: 'Поработать', dining: 'Выпить коктейль', fridge: 'Перекусить', stove: 'Приготовить ужин', chef: 'Готовить как шеф', table: 'Поесть за столом', bed: 'Поспать', kingbed: 'Спать как король', sofa: 'Отдохнуть', shower: 'Принять душ', bath: 'Полежать в ванне', jacuzzi: 'В джакузи', tv: 'Смотреть ТВ', cinema: 'Смотреть кино', pc: 'Листать Instagram', toilet: 'Сходить в туалет', armchair: 'Посидеть в кресле', coffee: 'Сварить кофе', treadmill: 'Пробежка', easel: 'Порисовать', robot: 'Запустить уборку', goldtoilet: 'Посидеть на золотом', dj: 'Включить DJ-сет', telescope: 'Смотреть на звёзды', console: 'Играть', guitar: 'Сыграть', piano: 'Сыграть на рояле', books: 'Почитать', aquarium: 'Кормить рыбок', fireplace: 'Греться у камина', phone: 'Позвонить подписчикам' };
const EMO = { arcade: '🕹', throne: '👑', goldtv: '📺', sauna: '🧖', desk: '✍️', dining: '🥤', fridge: '🍕', stove: '🍳', chef: '🥘', table: '🍽', bed: '💤', kingbed: '👑', sofa: '🛋', shower: '🫧', bath: '🛁', jacuzzi: '♨️', tv: '📺', cinema: '🍿', pc: '📱', toilet: '🚽', armchair: '😌', coffee: '☕', treadmill: '🏃', easel: '🎨', robot: '🤖', goldtoilet: '👑', dj: '🎧', telescope: '🌌', console: '🎮', guitar: '🎸', piano: '🎹', books: '📖', aquarium: '🐠', fireplace: '🔥', phone: '📞' };
// ---------- ремонт ----------
function select(g) { if (sel) sel.traverse(o => o.material && o.material.emissive && o.userData.em0 !== undefined && o.material.emissive.setHex(o.userData.em0)); sel = g; $('bsel').classList.toggle('hidden', !g); if (g) { g.traverse(o => { if (o.material && o.material.emissive) { o.userData.em0 = o.material.emissive.getHex(); o.material = o.material.clone(); o.material.emissive.setHex(0x5a3a00) } }); $('bname').textContent = CAT.furn[g.userData.k][0] + ' ' + CAT.furn[g.userData.k][1] } }
let svT = 0; function autosave() { clearTimeout(svT); svT = setTimeout(() => P.call('life/save', { furn: layout(), wall: '#' + wallM.color.getHexString(), floor: LIFE().floor }), 700) }
$('rot').onclick = () => { if (sel) { sel.rotation.y = (sel.rotation.y + Math.PI / 4) % (Math.PI * 2); autosave() } };
function moveMode(g) { BUILD = true; document.body.classList.add('bm'); $('om').classList.add('hidden'); drawer(); select(g); P.toast && P.toast('✋ Тяни предмет пальцем, ⟳ — повернуть') }
$('stow').onclick = () => { if (!sel) return; OBJ.delete(sel.userData.k); furn.remove(sel); select(null); drawer(); autosave() };
function layout() { return [...OBJ.values()].map(g => [g.userData.k, g.position.x, g.position.z, +g.rotation.y.toFixed(2)]) }
$('build').onclick = () => { BUILD = true; document.body.classList.add('bm'); $('om').classList.add('hidden'); drawer() };
$('bdone').onclick = async () => { BUILD = false; select(null); rebuildGrid(); document.body.classList.remove('bm'); await P.call('life/save', { furn: layout(), wall: '#' + wallM.color.getHexString(), floor: LIFE().floor }); };
const WALLC = ['#f3e3c8', '#e9e4ff', '#cfe8d8', '#ffd9cf', '#bfd7ff', '#3b3170', '#ffffff', '#f6e7a8'], FLOORS = ['#b98a5a', '#8a5a3a', '#d8b98a', '#6a6a7a', '#c9a0a0', '#e0d0b0'];
function drawer() {
  const L = LIFE(), placed = new Set(OBJ.keys()), F = CAT.furn;
  const own = L.own.filter(k => !placed.has(k)), buy = Object.keys(F).filter(k => !L.own.includes(k));
  $('dr').innerHTML = `<div class="sw"><span>Стены</span>${WALLC.map(c => `<i data-w="${c}" style="background:${c}"></i>`).join('')}</div><div class="sw"><span>Пол</span>${FLOORS.map(c => `<i data-f="${c}" style="background:${c}"></i>`).join('')}</div>` +
    (own.length ? `<h3>На складе</h3><div class="row">${own.map(k => `<button class="fi" data-p="${k}"><em>${F[k][0]}</em>${F[k][1].split(':')[0]}<b>Поставить</b></button>`).join('')}</div>` : '') +
    `<h3>Купить мебель</h3><div class="row">${buy.map(k => { const f = F[k], eff = Object.entries(f[4]).map(([n, v]) => NI[n][0] + '+' + v).join(' '); return `<button class="fi ${f[3] ? 'st' : ''}" data-b="${k}"><em>${f[0]}</em>${f[1].split(':')[0]}<small>${eff || 'декор'}</small><b>${f[3] ? f[3] + ' ⭐' : f[2].toLocaleString('ru') + ' 🪙'}</b></button>` }).join('')}</div>`;
  document.querySelectorAll('[data-w]').forEach(i => i.onclick = () => { L.wall = i.dataset.w; wallM.color.set(L.wall) });
  document.querySelectorAll('[data-f]').forEach(i => i.onclick = () => { L.floor = i.dataset.f; buildHouse() });
  document.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { const g = addObj(b.dataset.p, hero.position.x, hero.position.z, 0); select(g); drawer() });
  document.querySelectorAll('[data-b]').forEach(b => b.onclick = async () => { const k = b.dataset.b; if (F[k][3]) { P.buy('f_' + k); return } const j = await P.call('life/buy', { k }); if (j && j.me) { const fp = (CAT.fpos || {})[k] || [hero.position.x, hero.position.z - 2, 0]; const g = addObj(k, fp[0], fp[1], fp[2]); select(g); drawer(); autosave(); P.toast && P.toast('✋ Тяни предмет пальцем, ⟳ — повернуть') } });
}

// ---------- образ ----------
const LN = { g: 'Пол', sk: 'Кожа', hc: 'Цвет волос', hs: 'Причёска', sh: 'Цвет одежды', pa: 'Цвет брюк' };
const SLOTN = [['body', '🧍 Тело'], ['ot', '👕 Одежда'], ['ac', '🧢 Голова'], ['fc', '🕶 Лицо'], ['bk', '🪽 Спина'], ['au', '✨ Аура']];
let draft = null, LTAB = 'body';
function lookDraw() {
  const V = CAT.lookv, W = CAT.wearc || {}, own = new Set([...((LIFE().wear) || []), ...(CAT.freew || [])]);
  let h = `<div class="ltabs">${SLOTN.map(([k, n]) => `<button data-lt="${k}" class="${LTAB === k ? 'on' : ''}">${n}</button>`).join('')}</div>`;
  if (LTAB === 'body') h += Object.keys(LN).map(k => `<div class="lr"><span>${LN[k]}</span><div>${V[k].map(v => k === 'g' ? `<button data-k="g" data-v="${v}" class="${draft.g === v ? 'on' : ''}">${v === 'm' ? 'Парень' : 'Девушка'}</button>` : k === 'hs' ? `<button data-k="hs" data-v="${v}" class="${draft.hs === v ? 'on' : ''}">${['Короткая', 'Длинная', 'Ёжик', 'Хвост', 'Ирокез'][v]}</button>` : `<i data-k="${k}" data-v="${v}" class="${draft[k] === v ? 'on' : ''}" style="background:${v}"></i>`).join('')}</div></div>`).join('');
  else { const items = Object.entries(W).filter(([, w]) => w[2] === LTAB);
    h += `<div class="wg">${LTAB !== 'ot' ? `<button class="wi ${!draft[LTAB] ? 'on' : ''}" data-w=""><em>🚫</em>Без${LTAB === 'ac' ? ' головного убора' : ''}</button>` : ''}${items.map(([k, w]) => { const o = own.has(k), on = draft[LTAB] === k || (LTAB === 'ot' && !draft.ot && k === 'casual'); return `<button class="wi ${on ? 'on' : ''} ${w[4] ? 'st' : ''}" data-w="${k}"><em>${w[0]}</em>${w[1]}<b>${o ? (on ? 'Надето' : 'Надеть') : w[4] ? w[4] + ' ⭐' : w[3].toLocaleString('ru') + ' 🪙'}</b></button>` }).join('')}</div>`;
    if (LTAB === 'ot') h += `<p class="hint">Цвет повседневной одежды меняется во вкладке «Тело»</p>` }
  $('lkb').innerHTML = h;
  document.querySelectorAll('[data-lt]').forEach(b => b.onclick = () => { LTAB = b.dataset.lt; lookDraw() });
  document.querySelectorAll('#lkb [data-k]').forEach(b => b.onclick = () => { const k = b.dataset.k; draft[k] = k === 'hs' ? +b.dataset.v : b.dataset.v; rebuildHero(draft); lookDraw() });
  document.querySelectorAll('[data-w]').forEach(b => b.onclick = async () => { const k = b.dataset.w; if (!k) { draft[LTAB] = ''; rebuildHero(draft); lookDraw(); return } const w = W[k];
    if (own.has(k)) { draft[w[2]] = k === 'casual' ? '' : k; rebuildHero(draft); lookDraw(); return }
    if (w[4]) { P.buy('w_' + k); return }
    const j = await P.call('wear/buy', { k }); if (j && j.me) { draft[w[2]] = k; rebuildHero(draft); lookDraw(); P.HAP && P.HAP('medium') } });
}
$('lookb').onclick = () => { draft = { ...LIFE().look }; $('lk').classList.remove('hidden'); lookDraw() };
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
  tickHeroes(dt);
  if (doing && hero.userData.acts) { const A = doing.anim; if (['cook', 'fridge'].includes(A) && hero.userData.anim !== 'PickUp') play(hero, 'PickUp'); if (A === 'shower' ) drops(t); }
  else if (doing) { const U = hero.userData, A = doing.anim;
    if (A === 'eat') { U.arms[1].rotation.x = -1.6 - Math.max(0, Math.sin(t * 4)) * .9; U.arms[0].rotation.x = -.9 }
    else if (A === 'type') U.arms.forEach((a, i) => a.rotation.x = -1.3 + Math.sin(t * 16 + i * 2) * .12);
    else if (A === 'game') U.arms.forEach((a, i) => a.rotation.x = -1.2 + Math.sin(t * 11 + i) * .15);
    else if (A === 'phone') { U.arms[1].rotation.x = -2.6; U.arms[1].rotation.z = .3 }
    else if (A === 'guitar') { U.arms[0].rotation.x = -1.1; U.arms[1].rotation.x = -.9 + Math.sin(t * 14) * .3 }
    else if (A === 'run') { U.legs && U.legs.forEach((l, i) => l.rotation.x = Math.sin(t * 12 + i * Math.PI) * .7); U.arms.forEach((a, i) => a.rotation.x = Math.sin(t * 12 + i * Math.PI + Math.PI) * .7) }
    else if (A === 'read') U.arms.forEach(a => a.rotation.x = -1.2);
    else if (A === 'cook' || A === 'fridge') U.arms.forEach((a, i) => a.rotation.x = -1.3 + Math.sin(t * 6 + i * 2) * .3);
    else if (A === 'shower') { U.arms.forEach((a, i) => a.rotation.x = -2.4 + Math.sin(t * 7 + i * 3) * .4); drops(t) }
    else if (A === 'watch' || A === 'relax') U.arms.forEach(a => a.rotation.x = -.5);
    else if (A === 'sleep' || A === 'bath') { U.head.rotation.x = Math.sin(t * 1.5) * .05 }
    else U.arms.forEach((a, i) => a.rotation.x = -.6 + Math.sin(t * 3 + i) * .1);
  }
  if (!doing || doing.anim !== 'shower') DROPS.visible = false;
  doorsTick(dt);
  if (bubble) bubble.position.y = 4.1 + Math.sin(t * 4) * .1;
  hero.userData.ring.material.opacity = .5 + .3 * Math.sin(t * 4);
  for (const g of furn.children) g.traverse(o => { if (o.name === 'screen') o.material.color.setHSL((t * .05 + g.position.x * .01) % 1, .6, .55); if (o.name === 'robot') { o.position.x = Math.sin(t * .5) * 1.5; o.position.z = Math.sin(t * .8) * 1.2; o.rotation.y = t } if (o.name === 'disc') o.rotation.y = t * 4; if (o.name === 'flame') o.scale.y = .8 + Math.sin(t * 12) * .25; if (o.name === 'fish') o.position.x = Math.sin(t * .8 + o.position.y * 3) * 1; if (o.name === 'water') o.position.y = .95 + Math.sin(t * 3) * .03 });
  const tx = BUILD && sel ? sel.position.x * .3 : hero.position.x * FK(), tz = BUILD && sel ? sel.position.z * .3 : hero.position.z * Math.max(.2, FK()) + 1.5 * (1 - FK());
  cam.position.set(tx + Math.sin(ang) * dist * .75, dist * .82, tz + Math.cos(ang) * dist * .75); cam.lookAt(tx, 1, tz);
  R.render(scene, cam);
}
(async () => {
  const j = await P.call('rels'); CAT = j || { furn: {}, lookv: {} };
  if (GUEST) { const q = await P.call('guest', { nick: GUEST }); if (!q || !q.g) { P.closeLife && P.closeLife(); return } GL = q.g;
    $('lookb').style.display = 'none'; $('build').textContent = '💬 Чат'; $('build').onclick = () => P.openChat && P.openChat(GUEST);
    const fr = makeHero(GL.look); fr.position.set(2.4, 0, 8); fr.rotation.y = Math.PI * .85; scene.add(fr);
    const c = document.createElement('canvas'); c.width = 512; c.height = 96; const x = c.getContext('2d'); x.fillStyle = 'rgba(30,20,70,.85)'; x.beginPath(); x.roundRect(30, 6, 452, 84, 40); x.fill(); x.fillStyle = '#ffc65c'; x.font = 'bold 44px sans-serif'; x.textAlign = 'center'; x.fillText('@' + GL.nick + ' · хозяин', 256, 62);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false })); sp.scale.set(5.2, 1, 1); sp.position.y = 4.6; fr.add(sp);
    hero.position.set(0, 0, 12); P.toast && P.toast('🏠 Ты в гостях у @' + GL.nick + ' — всё можно трогать!') }
  buildHouse(); placeAll(); rebuildGrid(); hud(); $('load').remove(); requestAnimationFrame(loop);
  setInterval(hud, 30000);
  setInterval(() => { if (GUEST || BUILD || !LIFE()) return; for (const [k, x, z, r] of LIFE().furn) if (!OBJ.has(k)) { addObj(k, x, z, r); rebuildGrid() } }, 3000);
})();
window.hud = hud; window.__hero = () => hero; window.__st = () => (doing ? doing.anim : '') + '|' + POSE; window.__act = (k, i) => OBJ.get(k) && act(OBJ.get(k), i); window.__menu = k => OBJ.get(k) && menu(OBJ.get(k), 180, 400);
