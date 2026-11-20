// Пещера Скарда: большая подземная локация с пауками и пауком-боссом
import * as THREE from './three.js';
import { makeHero, walk, play, tickHeroes, preload } from './hero.js';
const P = parent, $ = id => document.getElementById(id);
const ME = () => P.ME || {};
const HAP = k => { try { P.HAP && P.HAP(k) } catch (e) { } };
const toast = t => { try { P.toast && P.toast(t) } catch (e) { } };
const rnd = (a, b) => a + Math.random() * (b - a);

const R = new THREE.WebGLRenderer({ canvas: $('gl'), antialias: true });
R.setPixelRatio(Math.min(2, devicePixelRatio)); R.setSize(innerWidth, innerHeight);
R.toneMapping = THREE.ACESFilmicToneMapping; R.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene(); scene.background = new THREE.Color('#050307'); scene.fog = new THREE.Fog('#050307', 16, 62);
const cam = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, .3, 200);
addEventListener('resize', () => { R.setSize(innerWidth, innerHeight); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix() });
scene.add(new THREE.HemisphereLight('#8a8ac0', '#2a1a10', 1.5));

// ---------- карта: залы и туннели ----------
const CH = [[0, 0, 14], [0, -55, 20], [40, -102, 18], [-12, -150, 24], [-62, -196, 20], [-20, -250, 22], [32, -302, 20], [0, -378, 38], [-58, -96, 15], [80, -158, 16], [-115, -235, 18], [-150, -298, 22], [95, -245, 20], [132, -322, 18]].map(([x, z, r]) => ({ x, z, r }));
const BOSS_I = 7;
const TU = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [1, 8], [3, 9], [4, 10], [10, 11], [6, 12], [12, 13]].map(([a, b]) => ({ a: CH[a], b: CH[b], w: 8 }));
function segD(px, pz, a, b) { const dx = b.x - a.x, dz = b.z - a.z, L = dx * dx + dz * dz; let t = ((px - a.x) * dx + (pz - a.z) * dz) / L; t = Math.max(0, Math.min(1, t)); return Math.hypot(px - a.x - t * dx, pz - a.z - t * dz) }
function walkable(x, z) { for (const c of CH) if (Math.hypot(x - c.x, z - c.z) < c.r - 1.4) return true; for (const t of TU) if (segD(x, z, t.a, t.b) < t.w / 2 - 1) return true; return false }
function chamberOf(x, z) { let best = -1, bd = 1e9; CH.forEach((c, i) => { const d = Math.hypot(x - c.x, z - c.z); if (d < c.r && d < bd) { bd = d; best = i } }); return best }

function tex(fn, w = 256, h = 256) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t }
const rockT = tex((g, W, H) => { g.fillStyle = '#3a3330'; g.fillRect(0, 0, W, H); for (let i = 0; i < 900; i++) { const v = 30 + Math.random() * 50 | 0; g.fillStyle = `rgba(${v + 10},${v},${v - 5},.5)`; g.beginPath(); g.arc(Math.random() * W, Math.random() * H, Math.random() * 6, 0, 7); g.fill() } });
rockT.wrapS = rockT.wrapT = THREE.RepeatWrapping; rockT.repeat.set(6, 6);
const floorM = new THREE.MeshLambertMaterial({ map: rockT, color: '#7a6a5e' });
for (const c of CH) { const f = new THREE.Mesh(new THREE.CircleGeometry(c.r + 1, 40), floorM); f.rotation.x = -Math.PI / 2; f.position.set(c.x, 0, c.z); scene.add(f) }
for (const t of TU) { const L = Math.hypot(t.b.x - t.a.x, t.b.z - t.a.z); const f = new THREE.Mesh(new THREE.PlaneGeometry(t.w + 2, L), floorM); f.rotation.x = -Math.PI / 2; f.rotation.z = -Math.atan2(t.b.x - t.a.x, t.b.z - t.a.z); f.position.set((t.a.x + t.b.x) / 2, .01, (t.a.z + t.b.z) / 2); scene.add(f) }

// стены из камней (instanced)
const rocks = [];
function wallPt(x, z) { if (walkable(x, z)) return; for (const c of CH) if (Math.hypot(x - c.x, z - c.z) < c.r - .5) return; for (const t of TU) if (segD(x, z, t.a, t.b) < t.w / 2) return; rocks.push([x, z]) }
for (const c of CH) { const n = Math.ceil(2 * Math.PI * c.r / 2.4); for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; wallPt(c.x + Math.cos(a) * (c.r + .6), c.z + Math.sin(a) * (c.r + .6)); wallPt(c.x + Math.cos(a) * (c.r + 3.2), c.z + Math.sin(a) * (c.r + 3.2)) } }
for (const t of TU) { const L = Math.hypot(t.b.x - t.a.x, t.b.z - t.a.z), ux = (t.b.x - t.a.x) / L, uz = (t.b.z - t.a.z) / L; for (let s = 0; s < L; s += 2.4) for (const sd of [-1, 1]) for (const o of [.6, 3.2]) wallPt(t.a.x + ux * s - uz * sd * (t.w / 2 + o), t.a.z + uz * s + ux * sd * (t.w / 2 + o)) }
{ const g = new THREE.DodecahedronGeometry(1.6, 0); const im = new THREE.InstancedMesh(g, new THREE.MeshLambertMaterial({ map: rockT, color: '#8a7a6e' }), rocks.length); const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), col = new THREE.Color();
  rocks.forEach(([x, z], i) => { const h = rnd(1.8, 4.2); e.set(rnd(0, 3), rnd(0, 3), rnd(0, 3)); q.setFromEuler(e); m.compose(new THREE.Vector3(x, h * .45, z), q, new THREE.Vector3(rnd(1, 1.6), h / 1.6, rnd(1, 1.6))); im.setMatrixAt(i, m); im.setColorAt(i, col.setHSL(.07, .12, rnd(.18, .32))) }); scene.add(im) }
// сталагмиты, кристаллы, паутина, кости
{ const sg = new THREE.ConeGeometry(.5, 1, 6), sm = new THREE.MeshLambertMaterial({ color: '#5a4e46' });
  const cg = new THREE.OctahedronGeometry(.5, 0), CM = ['#4ad9ff', '#b56cff', '#56ffb0'].map(c => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 1.6, roughness: .2 }));
  const webT = tex((g, W, H) => { g.strokeStyle = 'rgba(235,235,245,.85)'; g.lineWidth = 2; const cx = W / 2, cy = H / 2; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * W / 2, cy + Math.sin(a) * H / 2); g.stroke() } for (let r = 12; r < W / 2; r += 14) { g.beginPath(); for (let i = 0; i <= 12; i++) { const a = i / 12 * Math.PI * 2; const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r; i ? g.lineTo(x, y) : g.moveTo(x, y) } g.stroke() } });
  const webM = new THREE.MeshBasicMaterial({ map: webT, transparent: true, side: THREE.DoubleSide, depthWrite: false, opacity: .7 });
  CH.forEach((c, ci) => {
    for (let i = 0; i < c.r * .8; i++) { const a = rnd(0, 7), d = rnd(c.r * .55, c.r - 2), x = c.x + Math.cos(a) * d, z = c.z + Math.sin(a) * d; const s = new THREE.Mesh(sg, sm); const h = rnd(1, 3.5); s.scale.set(rnd(.6, 1.2), h, rnd(.6, 1.2)); s.position.set(x, h / 2, z); scene.add(s) }
    for (let k = 0; k < 2 + (ci % 3); k++) { const a = rnd(0, 7), d = rnd(c.r * .6, c.r - 2), g = new THREE.Group(); g.position.set(c.x + Math.cos(a) * d, 0, c.z + Math.sin(a) * d); const M = CM[(ci + k) % 3]; for (let j = 0; j < 5; j++) { const o = new THREE.Mesh(cg, M); o.scale.set(.6, rnd(1.4, 3), .6); o.position.set(rnd(-.8, .8), .6, rnd(-.8, .8)); o.rotation.set(rnd(-.4, .4), rnd(0, 3), rnd(-.4, .4)); g.add(o) } scene.add(g) }
    for (let k = 0; k < 3; k++) { const a = rnd(0, 7), w = new THREE.Mesh(new THREE.PlaneGeometry(5, 5), webM); w.position.set(c.x + Math.cos(a) * (c.r - .5), rnd(2.5, 4.5), c.z + Math.sin(a) * (c.r - .5)); w.lookAt(c.x, w.position.y, c.z); scene.add(w) }
    if (ci > 1) for (let k = 0; k < 3; k++) { const b = new THREE.Mesh(new THREE.CapsuleGeometry(.08, .7, 3, 6), new THREE.MeshLambertMaterial({ color: '#e8e0cc' })); b.rotation.set(Math.PI / 2, 0, rnd(0, 3)); b.position.set(c.x + rnd(-c.r / 2, c.r / 2), .1, c.z + rnd(-c.r / 2, c.r / 2)); scene.add(b) }
  });
  // логово Скарда
  const B = CH[BOSS_I]; const L1 = new THREE.PointLight('#ff2a3a', 300, 80, 1.2); L1.position.set(B.x, 9, B.z); scene.add(L1);
  for (let i = 0; i < 10; i++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), webM); const a = i / 10 * Math.PI * 2; w.position.set(B.x + Math.cos(a) * (B.r - 1), 5, B.z + Math.sin(a) * (B.r - 1)); w.lookAt(B.x, 5, B.z); scene.add(w) }
  const egg = new THREE.MeshStandardMaterial({ color: '#efe6d0', emissive: '#40301a', roughness: .5 }); for (let i = 0; i < 16; i++) { const e = new THREE.Mesh(new THREE.SphereGeometry(rnd(.5, .9), 10, 8), egg); const a = rnd(0, 7), d = rnd(B.r * .6, B.r - 3); e.scale.y = 1.3; e.position.set(B.x + Math.cos(a) * d, .6, B.z + Math.sin(a) * d); scene.add(e) }
}
// выход
{ const g = new THREE.Group(); g.position.set(0, 0, 12); scene.add(g); const L = new THREE.PointLight('#bcd8ff', 15, 26, 1.5); L.position.set(0, 6, 3); g.add(L); const sp = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), new THREE.MeshBasicMaterial({ color: '#bcd8ff', transparent: true, opacity: .25 })); sp.position.set(0, 3, 2); sp.rotation.y = Math.PI; g.add(sp) }

// ---------- старые факелы на стенах ----------
const SC = [];
{ const brG = new THREE.BoxGeometry(.18, .18, .7), stG = new THREE.CylinderGeometry(.07, .09, .9, 6), flG = new THREE.ConeGeometry(.22, .6, 8), brM = new THREE.MeshLambertMaterial({ color: '#3a3a3a' }), stM = new THREE.MeshLambertMaterial({ color: '#4a2e14' }), flM = new THREE.MeshBasicMaterial({ color: '#ffb040' });
  const glowT = tex((g, W, H) => { const r = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2); r.addColorStop(0, 'rgba(255,190,90,.9)'); r.addColorStop(1, 'rgba(255,120,30,0)'); g.fillStyle = r; g.fillRect(0, 0, W, H) }, 64, 64);
  const add = (x, z, fx, fz) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.lookAt(fx, 0, fz); scene.add(g); const br = new THREE.Mesh(brG, brM); br.position.set(0, 2.4, -.1); g.add(br); const st = new THREE.Mesh(stG, stM); st.position.set(0, 2.8, .25); st.rotation.x = .35; g.add(st); const fl = new THREE.Mesh(flG, flM); fl.position.set(0, 3.4, .42); g.add(fl); const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowT, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); gl.scale.set(3, 3, 1); gl.position.set(0, 3.4, .45); g.add(gl); SC.push({ g, fl, gl, lit: true, x: x + (fx - x) * .08, z: z + (fz - z) * .08 }) };
  CH.forEach((c, i) => { if (i === 0) return; for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2 + i; const x = c.x + Math.cos(a) * (c.r - .8), z = c.z + Math.sin(a) * (c.r - .8); let ok = true; for (const t of TU) if (segD(x, z, t.a, t.b) < t.w / 2 + 1) ok = false; if (ok) add(x, z, c.x, c.z) } });
  for (const t of TU) { const L = Math.hypot(t.b.x - t.a.x, t.b.z - t.a.z), ux = (t.b.x - t.a.x) / L, uz = (t.b.z - t.a.z) / L; let sd = 1; for (let d = t.a.r + 10; d < L - t.b.r - 6; d += 20) { const cx = t.a.x + ux * d, cz = t.a.z + uz * d; add(cx - uz * sd * (t.w / 2 - .4), cz + ux * sd * (t.w / 2 - .4), cx, cz); sd = -sd } }
}
const LP = [0, 1, 2, 3].map(() => { const l = new THREE.PointLight('#ff9a40', 0, 20, 1.3); scene.add(l); return l });
let LIT = [];
function lightPool() { const lit = SC.filter(s => s.lit).sort((a, b) => Math.hypot(a.x - me.position.x, a.z - me.position.z) - Math.hypot(b.x - me.position.x, b.z - me.position.z)); LIT = lit; LP.forEach((l, i) => { const s = lit[i]; if (s && Math.hypot(s.x - me.position.x, s.z - me.position.z) < 45) { l.position.set(s.x, 3.4, s.z); l.intensity = 90 } else l.intensity = 0 }) }
// ---------- игрок ----------
let me = makeHero({ ...((ME().life || {}).look || {}), vh: '', cw: '' }); me.position.set(0, 0, 6); me.rotation.y = Math.PI; scene.add(me); play(me, 'Idle');
const HASTORCH = (((ME().life || {}).wear) || []).includes('torch');
const glowT2 = tex((g, W, H) => { const r = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2); r.addColorStop(0, 'rgba(255,210,120,1)'); r.addColorStop(.4, 'rgba(255,140,40,.5)'); r.addColorStop(1, 'rgba(255,90,20,0)'); g.fillStyle = r; g.fillRect(0, 0, W, H) }, 64, 64);
const TORCH = new THREE.Group(); { const wood = new THREE.MeshStandardMaterial({ color: '#6a4220', roughness: .9 }); const h = new THREE.Mesh(new THREE.CylinderGeometry(.045, .06, .9, 8), wood); h.position.y = .2; TORCH.add(h); const band = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, .08, 8), new THREE.MeshStandardMaterial({ color: '#555', metalness: .8, roughness: .4 })); band.position.y = .55; TORCH.add(band); const rag = new THREE.Mesh(new THREE.CylinderGeometry(.11, .08, .26, 8), new THREE.MeshStandardMaterial({ color: '#3a2a1a', roughness: 1 })); rag.position.y = .72; TORCH.add(rag);
  const f1 = new THREE.Mesh(new THREE.ConeGeometry(.16, .5, 10), new THREE.MeshBasicMaterial({ color: '#ff7a1a', transparent: true, opacity: .9 })); f1.position.y = 1.08; TORCH.add(f1); const f2 = new THREE.Mesh(new THREE.ConeGeometry(.09, .32, 10), new THREE.MeshBasicMaterial({ color: '#ffe680' })); f2.position.y = 1.0; TORCH.add(f2); const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowT2, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); gl.scale.set(1.6, 1.6, 1); gl.position.y = 1.05; TORCH.add(gl); TORCH.userData = { f: f1, f2, gl } }
TORCH.visible = HASTORCH; TORCH.position.set(-.45, 1.0, .3); me.add(TORCH); if (!HASTORCH) $('tor').classList.add('hidden');
const TL = new THREE.PointLight('#ffa050', HASTORCH ? 220 : 90, HASTORCH ? 38 : 22, 1.2); TL.position.set(0, 3.2, .5); me.add(TL);
let HP = 100, dead = false, lastHit = 0;
const WPN = { w_knife: ['🔪', 'Нож', 1, 2.4, .45], w_bow: ['🏹', 'Лук', 2, 15, .9], w_sword: ['⚔️', 'Меч', 3, 3.2, .7], w_lbow: ['🎯', 'Длинный лук', 4, 19, 1], w_elf: ['🍃', 'Эльфийский лук', 5, 19, .7], w_skard: ['🗡', 'Клинок Скарда', 6, 3.6, .6], w_shadow: ['🌑', 'Кинжал тени', 4, 2.6, .3], w_flame: ['🔥', 'Меч пламени', 7, 3.6, .6], w_hunt: ['🏹', 'Лук охотника', 8, 22, .6], w_legend: ['🌟', 'Гроза Скарда', 10, 4.2, .5], w_axe: ['🪓', 'Боевой топор', 4, 3.4, .7], w_spear: ['🔱', 'Копьё рейнджера', 5, 4.6, .6], w_mace: ['🔨', 'Гномий молот', 6, 3.4, .75], w_xbow: ['🎯', 'Арбалет', 7, 20, .85], w_ice: ['❄️', 'Ледяной меч', 8, 3.8, .5], w_dragon: ['🐉', 'Драконий клинок', 9, 4, .5], w_thunder: ['⚡', 'Молот грома', 11, 4, .6], w_diamond: ['💎', 'Алмазный меч', 12, 4.4, .45], w_club: ['🏏', 'Дубина', 2, 3, .65], w_saber: ['🗡', 'Сабля', 4, 3.4, .55], w_katana: ['⚔️', 'Катана', 6, 3.8, .5], w_halberd: ['🔱', 'Алебарда', 7, 4.8, .75], w_runeaxe: ['🪓', 'Рунный топор', 8, 3.6, .7], w_staff: ['🪄', 'Посох мага', 9, 18, .7], w_moon: ['🌙', 'Лунный клинок', 10, 4, .45], w_void: ['🌌', 'Клинок бездны', 13, 4.2, .45], w_sun: ['☀️', 'Солнечный меч', 14, 4.4, .45] };
const HAS = k => ((ME().life || {}).wear || []).includes(k);
const FXA = k => { const f = ((ME().life || {}).fx || {})[k]; return f && f > Date.now() / 1000 };
const ARMK = () => { let a = 0; for (const k of ((ME().life || {}).wear || [])) a = Math.max(a, { ar_leather: .15, ar_chain: .25, ar_plate: .35, ar_skard: .45, ar_gold: .5 }[k] || 0); return 1 - a };
const HPM = () => FXA('hp') ? 150 : 100;
const owned = () => Object.keys(WPN).filter(k => ((ME().life || {}).wear || []).includes(k));
let wi = 0; const curW = () => { const o = owned(); return o.length ? WPN[o[wi % o.length]] : null };
const WG = new THREE.Group(); WG.position.set(.42, 1.05, .3); me.add(WG);
function wModel() { WG.clear(); const o = owned(); const k = o.length ? o[wi % o.length] : null; if (!k) return; const steel = new THREE.MeshStandardMaterial({ color: k === 'w_flame' ? '#ff6a2a' : k === 'w_legend' ? '#ffe9a0' : k === 'w_shadow' ? '#3a3a5a' : '#dfe6ee', metalness: .4, roughness: .3, emissive: k === 'w_flame' ? '#a02000' : k === 'w_legend' ? '#806000' : '#000' }), wood = new THREE.MeshLambertMaterial({ color: '#5a3a1a' }), gold = new THREE.MeshStandardMaterial({ color: '#d4a52a', metalness: .7, roughness: .3 });
  if (WPN[k][3] > 5) { const bow = new THREE.Mesh(new THREE.TorusGeometry(.75, .045, 6, 20, Math.PI), k === 'w_elf' ? new THREE.MeshLambertMaterial({ color: '#3aa05a' }) : k === 'w_hunt' ? gold : wood); bow.rotation.z = -Math.PI / 2; bow.position.z = .25; WG.add(bow); const str = new THREE.Mesh(new THREE.CylinderGeometry(.008, .008, 1.5, 4), new THREE.MeshBasicMaterial({ color: '#eee' })); str.position.z = .25; WG.add(str); WG.userData.str = str; WG.userData.bow = 1; }
  else { const L = k === 'w_knife' || k === 'w_shadow' ? .55 : k === 'w_legend' ? 1.5 : 1.2; const bl = new THREE.Mesh(new THREE.BoxGeometry(.09, L, .025), steel); bl.position.y = L / 2 + .2; WG.add(bl); const gd = new THREE.Mesh(new THREE.BoxGeometry(.32, .06, .08), gold); gd.position.y = .2; WG.add(gd); const hd = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, .3, 6), wood); hd.position.y = .05; WG.add(hd); WG.userData.bow = 0; WG.userData.str = null } }
function wBtn() { wModel(); if (me.userData && me.userData.att) { WG.userData.base = WG.userData.bow ? [Math.PI, Math.PI / 2, 0] : [Math.PI / 2 + .6, 0, 0]; WG.rotation.set(...WG.userData.base) } const w = curW(); $('wsw').innerHTML = w ? w[0] + '<br><small style="font-size:10px">' + w[1] + '</small>' : '✋'; }
wBtn(); $('wsw').onclick = () => { wi++; wBtn(); HAP('light'); const w = curW(); toast(w ? 'В руке: ' + w[0] + ' ' + w[1] : 'Нет оружия — купи в Магазине → ⚔️ Пещера') };
const hpUI = () => { $('hpi').style.width = (HP / HPM() * 100) + '%'; $('hpl').textContent = '❤️ ' + Math.round(HP) + (HPM() > 100 ? ' / ' + HPM() : '') };

// ---------- пауки ----------
const legG = new THREE.CylinderGeometry(.05, .035, 1, 5);
function spider(kind) {
  const C = { s: ['#3a2c22', '#6a4a2a'], m: ['#4a1e1e', '#c0392b'], l: ['#1a1a22', '#8a7aff'], b: ['#24080c', '#ff2a4a'] }[kind];
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const M = new THREE.MeshStandardMaterial({ color: C[0], roughness: .7 }), M2 = new THREE.MeshStandardMaterial({ color: C[1], emissive: kind === 'b' ? C[1] : '#000', emissiveIntensity: .6 });
  const ab = new THREE.Mesh(new THREE.SphereGeometry(.55, 14, 10), M); ab.scale.set(1, .8, 1.25); ab.position.set(0, .55, -.55); body.add(ab);
  const st = new THREE.Mesh(new THREE.SphereGeometry(.3, 10, 8), M2); st.scale.set(.5, .3, 1.2); st.position.set(0, .95, -.55); body.add(st);
  const hd = new THREE.Mesh(new THREE.SphereGeometry(.34, 12, 10), M); hd.position.set(0, .5, .25); body.add(hd);
  const EM = new THREE.MeshBasicMaterial({ color: kind === 'l' ? '#b0a0ff' : '#ff2020' }); for (const [x, y] of [[-.12, .62], [.12, .62], [-.2, .55], [.2, .55]]) { const e = new THREE.Mesh(new THREE.SphereGeometry(.05, 6, 5), EM); e.position.set(x, y, .55); body.add(e) }
  for (const sx of [-.1, .1]) { const f = new THREE.Mesh(new THREE.ConeGeometry(.05, .25, 5), M2); f.position.set(sx, .38, .58); f.rotation.x = Math.PI * .8; body.add(f) }
  const legs = []; for (let i = 0; i < 8; i++) { const sd = i < 4 ? -1 : 1, k = i % 4; const piv = new THREE.Group(); piv.position.set(sd * .22, .55, .2 - k * .18); piv.rotation.y = sd * (-.6 + k * .4) + (sd < 0 ? Math.PI : 0); body.add(piv);
    const up = new THREE.Mesh(legG, M); up.scale.y = .8; up.rotation.z = -1; up.position.set(.33, .22, 0); piv.add(up); const lo = new THREE.Mesh(legG, M); lo.scale.y = 1; lo.rotation.z = .45; lo.position.set(.85, -.05, 0); piv.add(lo); piv.userData.base = piv.rotation.y; legs.push(piv) }
  if (kind === 'l' || kind === 'b') for (let i = 0; i < 14; i++) { const h = new THREE.Mesh(new THREE.ConeGeometry(.04, .25, 4), M); const a = rnd(0, 7); h.position.set(Math.cos(a) * .4, .7 + rnd(0, .3), -.55 + Math.sin(a) * .5); h.rotation.set(rnd(-1, 1), 0, rnd(-1, 1)); body.add(h) }
  if (kind === 'b') for (let i = 0; i < 5; i++) { const h = new THREE.Mesh(new THREE.ConeGeometry(.08, .5, 5), M2); h.position.set(-.3 + i * .15, .85, .2); body.add(h) }
  g.userData = { legs, body, mats: [M] }; return g
}
const SP = [], KIND = { s: [.55, 1, 3, 3.6, 'малый паук'], m: [1, 3, 7, 3.0, 'пещерный паук'], l: [1.8, 6, 13, 2.6, 'чёрная вдова'] };
function spawn(kind, ci) { const c = CH[ci], g = spider(kind), K = KIND[kind]; g.scale.setScalar(K[0]); let x, z; do { const a = rnd(0, 7), d = rnd(2, c.r - 3); x = c.x + Math.cos(a) * d; z = c.z + Math.sin(a) * d } while (!walkable(x, z)); g.position.set(x, 0, z); g.rotation.y = rnd(0, 7); scene.add(g); SP.push({ g, kind, hp: K[1], ci, hx: x, hz: z, st: 'idle', t: rnd(0, 3), atk: 0, flee: 0, ph: rnd(0, 6) }) }
const PLAN = { 1: 's5', 2: 's4m1', 3: 's3m3', 4: 's2m3l1', 5: 's3m2l2', 6: 'm3l3', 8: 's6', 9: 'm2l2', 10: 's3m2', 11: 'm2l3', 12: 's4m2', 13: 'l3m2' };
for (const ci in PLAN) { const p = PLAN[ci]; for (let i = 0; i < p.length; i += 2) for (let k = 0; k < +p[i + 1]; k++) spawn(p[i], +ci) }
const DEAD = [];

// ---------- босс ----------
const BC = CH[BOSS_I]; const BOSS = spider('b'); BOSS.scale.setScalar(5.2); BOSS.position.set(BC.x, 0, BC.z - 10); scene.add(BOSS);
let BS = { hp: 1, max: 1, dead: 0 }, bossN = 0, bossAtk = 0, bossSpawn = 0, bossTgt = new THREE.Vector3(BC.x, 0, BC.z);
function bossUI() { $('bi').style.width = (BS.hp / BS.max * 100) + '%'; $('bl').textContent = BS.dead ? '💀 СКАРД повержен — вернётся завтра' : '🕷 СКАРД · ' + BS.hp.toLocaleString('ru') + ' / ' + BS.max.toLocaleString('ru'); BOSS.visible = !BS.dead }
async function api(a) { const j = await P.call('cave', a); if (j && j.boss) { BS = j.boss; bossUI() } if (j && j.loot) $('st').textContent = '🦵 лапки: ' + j.loot.leg + ' · 🧪 яд: ' + j.loot.ven; coins(); return j }
const coins = () => $('coins').textContent = '🪙 ' + ((ME().coins || 0).toLocaleString('ru'));

// ---------- эффекты ----------
const FX = [];
function sprite(txt, pos, col = '#fff', sz = 1) { const t = tex((g, W, H) => { g.font = '900 64px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 8; g.strokeStyle = '#000'; g.strokeText(txt, W / 2, H / 2); g.fillStyle = col; g.fillText(txt, W / 2, H / 2) }, 256, 96); const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true })); s.scale.set(2.4 * sz, .9 * sz, 1); s.position.copy(pos); s.renderOrder = 9; scene.add(s); FX.push({ s, t0: performance.now(), v: 1.2 }) }
function arrow(from, to, done) { const a = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, 1, 5), new THREE.MeshBasicMaterial({ color: '#e8d8a0' })); a.position.copy(from); scene.add(a); FX.push({ s: a, arrow: 1, from: from.clone(), to: to.clone(), t0: performance.now(), done }) }
function popT(t) { const p = $('pop'); p.textContent = t; p.classList.add('on'); clearTimeout(p._t); p._t = setTimeout(() => p.classList.remove('on'), 1200) }

// ---------- бой ----------
let atkCD = 0;
function attack() {
  if (dead) return; const w = curW(); if (!w) { toast('Нужно оружие 🔪⚔️🏹 — Магазин → ⚔️ Пещера. Пока можно отпугивать факелом 🔥'); return }
  if (performance.now() / 1000 < atkCD) return; atkCD = performance.now() / 1000 + w[4]; HAP('light');
  const range = w[3]; let tgt = null, td = 1e9;
  for (const s of SP) { const d = s.g.position.distanceTo(me.position); if (d < range + KIND[s.kind][0] && d < td) { td = d; tgt = s } }
  const bd = BOSS.visible ? BOSS.position.distanceTo(me.position) - 4.5 : 1e9; const toBoss = bd < range && (!tgt || bd < td);
  const tp = toBoss ? BOSS.position : tgt ? tgt.g.position : null;
  if (tp) me.rotation.y = Math.atan2(tp.x - me.position.x, tp.z - me.position.z);
  play(me, 'Punch', { once: true }); setTimeout(() => !dead && play(me, 'Idle'), 500); WG.userData.sw = performance.now(); if (!tp) popT(range > 5 ? '🏹 Нет цели — подойди ближе' : '⚔️ Нет паука рядом');
  const extra = range <= 5 && tgt ? SP.filter(x => x !== tgt && x.g.position.distanceTo(me.position) < range + KIND[x.kind][0]).slice(0, w[2] >= 3 ? 1 : 0) : [];
  const hit = () => { const dm = Math.ceil(w[2] * (FXA('str') ? 1.5 : 1)); if (toBoss) { bossN++; sprite('-' + dm, BOSS.position.clone().add(new THREE.Vector3(rnd(-1, 1), 5, 0)), '#ff6a6a', 1.2); return } if (!tgt || !SP.includes(tgt)) return; tgt.hp -= dm; tgt.g.userData.mats[0].emissive.setHex(0x880000); setTimeout(() => tgt.g.userData.mats[0].emissive.setHex(0), 120); sprite('-' + dm, tgt.g.position.clone().setY(2 * KIND[tgt.kind][0] + .5), '#ff6a6a'); tgt.st = 'chase'; if (tgt.hp <= 0) kill(tgt); for (const x of extra) { if (!SP.includes(x)) continue; x.hp -= Math.ceil(dm / 2); sprite('-' + Math.ceil(dm / 2), x.g.position.clone().setY(1.5), '#ffaa6a'); if (x.hp <= 0) kill(x) } };
  if (tp && range > 5) arrow(me.position.clone().setY(1.4), tp.clone().setY(toBoss ? 3 : .6), hit); else if (tp) hit();
}
function kill(s) { SP.splice(SP.indexOf(s), 1); const g = s.g; g.rotation.z = Math.PI; g.position.y = .3; DEAD.push({ s, t: performance.now() }); popT({ s: '🕷 +12', m: '🕷 +35', l: '🕷 +90' }[s.kind]); api({ a: 'kill', s: s.kind }) }
$('atk').onclick = attack;
let torchT = 0;
$('tor').onclick = () => { if (dead || !HASTORCH) return; const n = performance.now() / 1000; if (n < torchT) return; torchT = n + (HAS('i_torch') ? 1.2 : 2.5); HAP('medium'); TORCH.userData.sw = performance.now(); TL.intensity = 500; setTimeout(() => TL.intensity = 220, 600);
  let k = 0; for (const s of [...SP]) { const d = s.g.position.distanceTo(me.position); if (d < (HAS('i_torch') ? 14 : 9)) { if (s.kind === 'l') { s.st = 'chase'; continue } s.st = 'flee'; s.flee = n + 4; k++; if (s.kind === 's' && d < 4) { s.hp -= 1; sprite('🔥', s.g.position.clone().setY(1.2)); if (s.hp <= 0) kill(s) } } } if (k) popT('🔥 Пауки разбегаются!'); else popT('🔥'); const ring = new THREE.Mesh(new THREE.TorusGeometry(1, .18, 6, 32), new THREE.MeshBasicMaterial({ color: '#ff8a20', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); ring.rotation.x = Math.PI / 2; ring.position.copy(me.position).setY(.6); scene.add(ring); FX.push({ s: ring, ring: 1, t0: performance.now(), R: HAS('i_torch') ? 14 : 9 }) };
$('back').onclick = () => P.closeWork && P.closeWork();
let nearSc = null;

const LEG = `<h2>📜 Легенда о Пещере Скарда</h2><p>Сто лет назад шахтёры Города искали серебро в горах за рекой. Однажды кирка пробила стену — и за ней открылась пещера, которой не было ни на одной карте.</p><p>Из темноты вышел паук размером с дом. Шахтёры назвали его <b>Скард</b>. Той ночью домой вернулись не все.</p><p>Вход завалили камнями, дорогу стёрли с карт, а детям запретили даже говорить о горе. Старики шепчутся: по ночам из-под земли слышен шорох тысяч лап…</p><p>Сто лет ни один житель Города не заходил внутрь. Пока не появились смельчаки — с факелами, ножами, мечами и луками.</p><p style="color:var(--win)">Свет факела пугает мелких пауков. Чёрных вдов огонь только злит. А Скарда можно одолеть только всем городом вместе.</p><button class="go1" id="px">🔥 Войти во тьму</button>`;
const openLeg = () => { $('panel').innerHTML = LEG; $('panel').classList.remove('hidden'); $('px').onclick = () => $('panel').classList.add('hidden') };
$('leg').onclick = openLeg;

// ---------- управление ----------
const joy = { x: 0, y: 0 }; { const J = $('joy'), K = $('knob'); let id = null; const mv = e => { for (const t of e.changedTouches || [e]) { if (id !== null && t.identifier !== undefined && t.identifier !== id) continue; const r = J.getBoundingClientRect(); let dx = t.clientX - r.left - r.width / 2, dy = t.clientY - r.top - r.height / 2; const L = Math.hypot(dx, dy); if (L > 50) { dx *= 50 / L; dy *= 50 / L } joy.x = dx / 50; joy.y = dy / 50; K.style.transform = `translate(${dx}px,${dy}px)` } };
  J.addEventListener('touchstart', e => { id = e.changedTouches[0].identifier; mv(e); e.preventDefault() }, { passive: false }); J.addEventListener('touchmove', e => { mv(e); e.preventDefault() }, { passive: false });
  const end = () => { id = null; joy.x = joy.y = 0; K.style.transform = '' }; J.addEventListener('touchend', end); J.addEventListener('touchcancel', end);
  J.addEventListener('mousedown', e => { mv(e); const mm = ev => mv(ev), up = () => { end(); removeEventListener('mousemove', mm); removeEventListener('mouseup', up) }; addEventListener('mousemove', mm); addEventListener('mouseup', up) }) }

// ---------- цикл ----------
let last = performance.now(), camA = Math.PI, flush = 0, shown = new Set();
const cp = new THREE.Vector3(0, 10, 16);
function hurt(dmg) { if (dead) return; if (HAS('i_shield')) dmg *= .65; dmg *= ARMK(); HP = Math.max(0, HP - dmg); lastHit = performance.now(); hpUI(); $('vig').classList.add('hit'); setTimeout(() => $('vig').classList.remove('hit'), 250); HAP('heavy');
  if (HP <= 0) { dead = true; play(me, 'Defeat', { once: true }); popT('🕸 Пауки утащили тебя…'); setTimeout(() => { me.position.set(0, 0, 6); HP = HPM(); hpUI(); dead = false; play(me, 'Idle'); toast('Ты очнулся у выхода из пещеры. Будь осторожнее!') }, 2600) } }
function loop(now) {
  requestAnimationFrame(loop); const dt = Math.min(.05, (now - last) / 1000), t = now / 1000; last = now;
  // движение
  const L = Math.hypot(joy.x, joy.y); if (!dead && L > .1) { const sp = 7 * (HAS('i_boots') ? 1.35 : 1) * (FXA('spd') ? 1.4 : 1) * Math.min(1, L), ca = Math.cos(camA), sa = Math.sin(camA); const dx = -(joy.x * ca + joy.y * sa) , dz = -(-joy.x * sa + joy.y * ca); const nx = me.position.x + dx * sp * dt, nz = me.position.z + dz * sp * dt; if (walkable(nx, nz)) { me.position.x = nx; me.position.z = nz } else if (walkable(nx, me.position.z)) me.position.x = nx; else if (walkable(me.position.x, nz)) me.position.z = nz; me.rotation.y = Math.atan2(dx, dz); walk(me, t, true) } else walk(me, t, false);
  if (me.position.z > 11 && !dead) { P.closeWork && P.closeWork(); return }
  if (performance.now() - lastHit > 3000 && HP < HPM()) { HP = Math.min(HPM(), HP + dt * (HAS('i_ring') ? 12 : 4)); hpUI() }
  TL.intensity += (((HASTORCH ? (HAS('i_torch') ? 320 : 220) : 90) + Math.sin(t * 13) * 20 + Math.sin(t * 7.3) * 15) - TL.intensity) * .2; TORCH.userData.f.scale.set(1 + Math.sin(t * 11) * .08, 1 + Math.sin(t * 15) * .18, 1 + Math.cos(t * 12) * .08); TORCH.userData.f2.scale.y = 1 + Math.sin(t * 19) * .2; TORCH.userData.gl.material.opacity = .75 + Math.sin(t * 9) * .2;
  // пауки
  for (const s of SP) { const g = s.g, K = KIND[s.kind], d = g.position.distanceTo(me.position); let tx = null, tz = null, spd = 0;
    if (s.st === 'flee' && t > s.flee) s.st = 'idle';
    if (s.st !== 'flee' && d < (s.kind === 'l' ? 14 : 10) * (HAS('i_cloak') ? .55 : 1) && !dead) s.st = 'chase'; else if (s.st === 'chase' && (d > 22 || dead)) s.st = 'idle';
    if (s.st === 'chase') { tx = me.position.x; tz = me.position.z; spd = K[3]; if (d < 1.1 + K[0] * .9) { spd = 0; if (t > s.atk) { s.atk = t + 1.1; hurt(K[2]); g.userData.body.position.z = .3; setTimeout(() => g.userData.body.position.z = 0, 150) } } }
    else if (s.st === 'flee') { tx = g.position.x * 2 - me.position.x; tz = g.position.z * 2 - me.position.z; spd = K[3] * 1.3 }
    else { s.t -= dt; if (s.t < 0) { s.t = rnd(2, 5); s.wx = s.hx + rnd(-5, 5); s.wz = s.hz + rnd(-5, 5) } if (s.wx !== undefined && Math.hypot(s.wx - g.position.x, s.wz - g.position.z) > .5) { tx = s.wx; tz = s.wz; spd = 1.2 } }
    if (tx !== null && spd > 0) { const vx = tx - g.position.x, vz = tz - g.position.z, l = Math.hypot(vx, vz) || 1; const nx = g.position.x + vx / l * spd * dt, nz = g.position.z + vz / l * spd * dt; if (walkable(nx, nz)) { g.position.x = nx; g.position.z = nz } g.rotation.y = Math.atan2(vx, vz) }
    s.ph += dt * (spd ? spd * 4 : 1); g.userData.legs.forEach((p, i) => { p.rotation.y = p.userData.base + Math.sin(s.ph + i * 1.7) * (spd ? .35 : .05); p.rotation.z = Math.max(0, Math.sin(s.ph + i * 1.7)) * (spd ? .3 : 0) }); g.userData.body.position.y = spd ? Math.abs(Math.sin(s.ph * 2)) * .05 : 0 }
  for (let i = DEAD.length - 1; i >= 0; i--) { const D = DEAD[i], k = (now - D.t) / 1000; if (k > 2) D.s.g.visible = false; if (k > 45 && D.s.g.position.distanceTo(me.position) > 30) { scene.remove(D.s.g); DEAD.splice(i, 1); spawn(D.s.kind, D.s.ci) } }
  if ((now | 0) % 30 === 0) lightPool(); for (const sc of LIT) { sc.fl.scale.y = 1 + Math.sin(t * 14 + sc.x) * .2 }
  // босс
  const inBoss = chamberOf(me.position.x, me.position.z) === BOSS_I; if (inBoss && !window.__deep) { window.__deep = 1; api({ a: 'deep' }) } $('bossb').classList.toggle('hidden', !inBoss && !(Math.hypot(me.position.x - BC.x, me.position.z - BC.z) < BC.r + 20));
  if (BOSS.visible) { const d = BOSS.position.distanceTo(me.position), U = BOSS.userData; let spd = 0;
    if (inBoss && !dead) { bossTgt.copy(me.position); spd = d > 5.5 ? 2.4 : 0; if (d < 6.5 && t > bossAtk) { bossAtk = t + 1.3; hurt(16); U.body.position.z = .25; setTimeout(() => U.body.position.z = 0, 200) }
      if (t > bossSpawn && SP.filter(s => s.ci === BOSS_I).length < 6) { bossSpawn = t + 14; for (let k = 0; k < 3; k++) spawn('s', BOSS_I); popT('🕷 Скард зовёт детёнышей!') } }
    else { if (Math.hypot(bossTgt.x - BOSS.position.x, bossTgt.z - BOSS.position.z) < 1) bossTgt.set(BC.x + rnd(-15, 15), 0, BC.z + rnd(-15, 15)); spd = 1.2 }
    const vx = bossTgt.x - BOSS.position.x, vz = bossTgt.z - BOSS.position.z, l = Math.hypot(vx, vz) || 1; if (spd) { const nx = BOSS.position.x + vx / l * spd * dt, nz = BOSS.position.z + vz / l * spd * dt; if (Math.hypot(nx - BC.x, nz - BC.z) < BC.r - 6) { BOSS.position.x = nx; BOSS.position.z = nz } } BOSS.rotation.y = Math.atan2(vx, vz);
    U.legs.forEach((p, i) => { p.rotation.y = p.userData.base + Math.sin(t * 5 + i * 1.7) * (spd ? .3 : .06) }) }
  if (bossN && now - flush > 2000) { flush = now; const n = bossN; bossN = 0; api({ a: 'boss', n }) }
  for (const [i, nm] of [[1, '🕸 Зал паутины'], [3, '🦴 Зал костей'], [4, '💎 Кристальный грот'], [6, '⚠ Близко логово…'], [11, '🕳 Бездонный провал'], [12, '🍄 Грибная пещера'], [13, '💀 Гнездо вдов'], [BOSS_I, '🕷 ЛОГОВО СКАРДА']]) { if (!shown.has(i) && chamberOf(me.position.x, me.position.z) === i) { shown.add(i); popT(nm) } }
  for (let i = FX.length - 1; i >= 0; i--) { const f = FX[i], k = (now - f.t0) / 1000; if (f.arrow) { const kk = Math.min(1, k / .25); f.s.position.lerpVectors(f.from, f.to, kk); f.s.lookAt(f.to); f.s.rotateX(Math.PI / 2); if (kk >= 1) { scene.remove(f.s); FX.splice(i, 1); f.done && f.done() } continue } if (f.ring) { const kk = k / .6; f.s.scale.setScalar(1 + kk * f.R); f.s.material.opacity = Math.max(0, 1 - kk); if (kk >= 1) { scene.remove(f.s); FX.splice(i, 1) } continue } f.s.position.y += dt * f.v; f.s.material.opacity = 1 - k; if (k >= 1) { scene.remove(f.s); FX.splice(i, 1) } }
  if (WG.userData.sw) { const k = (now - WG.userData.sw) / 350; const B0 = WG.userData.base || [0, 0, 0]; if (k >= 1) { WG.userData.sw = 0; WG.rotation.set(...B0); if (WG.userData.str) WG.userData.str.position.z = .25 } else if (WG.userData.bow) { if (WG.userData.str) WG.userData.str.position.z = .25 - Math.sin(k * Math.PI) * .35 } else WG.rotation.set(B0[0] + (k < .3 ? k / .3 * .9 : .9 - (k - .3) / .7 * 2.4), B0[1], B0[2]) }
  if (!me.userData.att) { let fl = null, fr = null; me.traverse(o => { if (o.isBone && /^Fist\.?L$/.test(o.name)) fl = o; if (o.isBone && /^Fist\.?R$/.test(o.name)) fr = o }); if (fl && fr) { me.userData.att = 1; me.updateMatrixWorld(true); const ws = new THREE.Vector3(); fl.getWorldScale(ws); TORCH.scale.setScalar(.62 / ws.x); TORCH.position.set(0, .06 / ws.y, 0); TORCH.rotation.set(...(window.__trot || [Math.PI - .35, 0, 0])); fr.add(TORCH); WG.scale.setScalar(.7 / ws.x); WG.position.set(0, .05 / ws.y, 0); WG.userData.base = window.__wrot || (WG.userData.bow ? [Math.PI, Math.PI / 2, 0] : [Math.PI / 2 + .6, 0, 0]); WG.rotation.set(...WG.userData.base); fl.add(WG) } }
  if (TORCH.userData.sw) { const k = (now - TORCH.userData.sw) / 450; TORCH.userData.f.scale.multiplyScalar(k < 1 ? 1 + Math.sin(k * Math.PI) * 1.4 : 1); TORCH.rotation.x = Math.PI - .35 - (k < 1 ? Math.sin(k * Math.PI) * 1.3 : 0); if (k >= 1) TORCH.userData.sw = 0 }
  tickHeroes(dt);
  const ch = inBoss ? 21 : 15; const want = new THREE.Vector3(me.position.x, ch, me.position.z + ch * .5); cp.lerp(want, .08); cam.position.copy(cp); cam.lookAt(me.position.x, .8, me.position.z - 1); if (window.__closeCam) { cam.position.set(me.position.x + window.__closeCam[0], window.__closeCam[1], me.position.z + window.__closeCam[2]); cam.lookAt(me.position.x, 1.1, me.position.z) }
  R.render(scene, cam)
}
window.__cv = { me, SP, BOSS, SC, TORCH, WG };
preload(((ME().life || {}).look) || {}); hpUI(); coins(); requestAnimationFrame(loop);
api({ a: 'enter' }).then(j => { if (j && j.err) { setTimeout(() => P.closeWork && P.closeWork(), 300); return } let seen = 0; try { seen = localStorage.getItem('skleg') } catch (e) { } if (!seen) { openLeg(); try { localStorage.setItem('skleg', '1') } catch (e) { } } if (j && j.cave) $('st').textContent = 'смельчаков внутри было: ' + j.cave.n });
