// Город разбойников: лагерь за городом, разбойники грабят игрока, Атаман-босс
import * as THREE from './three.js';
import { makeHero, walk, play, tickHeroes, preload } from './hero.js';
const P = parent, $ = id => document.getElementById(id);
const ME = () => P.ME || {};
const HAP = k => { try { P.HAP && P.HAP(k) } catch (e) { } };
const toast = t => { try { P.toast && P.toast(t) } catch (e) { } };
const rnd = (a, b) => a + Math.random() * (b - a);
const R = new THREE.WebGLRenderer({ canvas: $('gl'), antialias: true });
R.setPixelRatio(Math.min(2, devicePixelRatio)); R.setSize(innerWidth, innerHeight); R.shadowMap.enabled = true;
R.toneMapping = THREE.ACESFilmicToneMapping; R.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene(); scene.background = new THREE.Color('#e9b98a'); scene.fog = new THREE.Fog('#e9b98a', 60, 160);
const cam = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, .3, 400);
addEventListener('resize', () => { R.setSize(innerWidth, innerHeight); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix() });
scene.add(new THREE.HemisphereLight('#fff1d8', '#7a5a3a', 1.6));
const sun = new THREE.DirectionalLight('#ffd9a0', 2.2); sun.position.set(-30, 50, 20); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -80, right: 80, top: 80, bottom: -80, far: 200 }); scene.add(sun);
function tex(fn, w = 256, h = 256) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t }
const M = c => new THREE.MeshLambertMaterial({ color: c });
function box(w, h, d, c, x, y, z, p = scene) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), c.isMaterial ? c : M(c)); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; p.add(m); return m }
function cyl(a, b, h, c, x, y, z, p = scene, s = 10) { const m = new THREE.Mesh(new THREE.CylinderGeometry(a, b, h, s), c.isMaterial ? c : M(c)); m.position.set(x, y, z); m.castShadow = true; p.add(m); return m }
function sign(txt, w, h, bg, fg, x, y, z, ry = 0) { const t = tex((g, W, H) => { g.fillStyle = bg; g.fillRect(0, 0, W, H); g.fillStyle = fg; g.font = `900 ${H * .5}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, W / 2, H / 2 + 3) }, 512, 128); const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t })); m.position.set(x, y, z); m.rotation.y = ry; scene.add(m); return m }

// ---------- местность ----------
const sand = tex((g, W, H) => { g.fillStyle = '#c9a272'; g.fillRect(0, 0, W, H); for (let i = 0; i < 1400; i++) { const v = Math.random(); g.fillStyle = `rgba(${150 + v * 60},${110 + v * 50},${70 + v * 30},.4)`; g.fillRect(Math.random() * W, Math.random() * H, 2, 2) } }); sand.wrapS = sand.wrapT = THREE.RepeatWrapping; sand.repeat.set(30, 30);
{ const g = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshLambertMaterial({ map: sand })); g.rotation.x = -Math.PI / 2; g.receiveShadow = true; scene.add(g) }
const RAD = 62, COL = [];
const solid = (x, z) => { if (Math.hypot(x, z) > RAD - 1.5 && !(Math.abs(x) < 5 && z > 0)) return true; for (const c of COL) if (Math.abs(x - c[0]) < c[2] && Math.abs(z - c[1]) < c[3]) return true; return false };
// частокол
{ const wood = M('#6a4426'), n = 150; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, x = Math.sin(a) * RAD, z = Math.cos(a) * RAD; if (Math.abs(x) < 5 && z > 0) continue; const h = rnd(4.5, 5.5); const l = cyl(.32, .36, h, wood, x, h / 2, z); const tp = new THREE.Mesh(new THREE.ConeGeometry(.34, .7, 8), wood); tp.position.set(x, h + .35, z); scene.add(tp) } }
// ворота (выход на юг, z = +RAD)
box(1, 7, 1, '#4a2e18', -5.3, 3.5, RAD); box(1, 7, 1, '#4a2e18', 5.3, 3.5, RAD); box(12, 1.2, 1, '#4a2e18', 0, 7, RAD); sign('☠ ГОРОД РАЗБОЙНИКОВ', 10, 1.6, '#2a1a0e', '#ffcf6a', 0, 8.4, RAD - .6, Math.PI);
// дома и салун
const HS = [[-30, -20, 10, 8, '#8a5a34'], [-40, 8, 8, 8, '#7a4a2a'], [-22, 30, 9, 7, '#9a6a3a'], [28, -26, 11, 8, '#7a4a2a'], [40, 4, 8, 9, '#8a5a34'], [26, 30, 9, 7, '#6a4426'], [-8, -40, 9, 7, '#7a4a2a'], [12, -42, 8, 7, '#8a5a34']];
for (const [x, z, w, d, c] of HS) { box(w, 4.5, d, c, x, 2.25, z); const r = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, d) * .75, 3, 4), M('#4a2a1a')); r.rotation.y = Math.PI / 4; r.scale.set(w / Math.max(w, d), 1, d / Math.max(w, d)); r.position.set(x, 6, z); r.castShadow = true; scene.add(r); box(1.6, 2.6, .2, '#2a1a0e', x, 1.3, z + d / 2 + .05); COL.push([x, z, w / 2 + .6, d / 2 + .6]) }
// салун атамана в центре-сзади
box(18, 7, 12, '#a0683a', 0, 3.5, -16); box(19, .6, 13, '#5a3a20', 0, 7.3, -16); box(20, 4, 1, '#a0683a', 0, 9, -10.4); sign('🥃 САЛУН «ПОДКОВА»', 10, 1.5, '#3a200e', '#ffcf6a', 0, 9.4, -9.8); box(4, 3.4, .3, '#2a1a0e', 0, 1.7, -9.9); box(18, .3, 3, '#7a4a2a', 0, 3.8, -8.6); for (const x of [-8.6, -3, 3, 8.6]) cyl(.15, .15, 3.8, '#5a3a20', x, 1.9, -7.3); COL.push([0, -16, 9.6, 6.6]);
// вышка, повозки, бочки, костёр
{ for (const [x, z] of [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]]) cyl(.18, .18, 10, '#5a3a20', 44 + x, 5, -36 + z); box(4.4, .3, 4.4, '#6a4426', 44, 10, -36); box(4.4, 1, .2, '#6a4426', 44, 10.6, -38.1); const fl = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.5), new THREE.MeshBasicMaterial({ color: '#111', side: THREE.DoubleSide })); fl.position.set(44, 13, -36); scene.add(fl); cyl(.06, .06, 3, '#333', 42.8, 12, -36); COL.push([44, -36, 2.4, 2.4]) }
for (const [x, z, r] of [[-18, 10, .3], [16, 14, -.4], [-6, 44, .8]]) { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = r; scene.add(g); box(4.5, 1.2, 2.2, '#7a5030', 0, 1.4, 0, g); const tc = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 4.5, 14, 1, true, 0, Math.PI), new THREE.MeshLambertMaterial({ color: '#efe6d0', side: THREE.DoubleSide })); tc.rotation.z = Math.PI / 2; tc.position.y = 2; g.add(tc); for (const sx of [-1.6, 1.6]) for (const sz of [-1.2, 1.2]) { const w = new THREE.Mesh(new THREE.TorusGeometry(.55, .1, 6, 14), M('#3a2414')); w.position.set(sx, .6, sz); g.add(w) } COL.push([x, z, 2.8, 2.8]) }
for (let i = 0; i < 18; i++) { const a = rnd(0, 7), d = rnd(18, 56), x = Math.sin(a) * d, z = Math.cos(a) * d; if (solid(x, z) || Math.abs(x) < 6 && z > 40) continue; i % 2 ? cyl(.6, .6, 1.2, '#6a4426', x, .6, z) : box(1.2, 1.2, 1.2, '#8a6a3a', x, .6, z); COL.push([x, z, .8, .8]) }
const FIRE = new THREE.Group(); FIRE.position.set(0, 0, 18); scene.add(FIRE); for (let i = 0; i < 6; i++) { const l = cyl(.12, .12, 1.6, '#4a2e18', 0, .2, 0, FIRE); l.rotation.set(Math.PI / 2, i, 0) } const FL = new THREE.Mesh(new THREE.ConeGeometry(.7, 1.6, 8), new THREE.MeshBasicMaterial({ color: '#ff8a20' })); FL.position.y = .9; FIRE.add(FL); const FLL = new THREE.PointLight('#ff9040', 40, 18, 1.5); FLL.position.y = 2; FIRE.add(FLL); COL.push([0, 18, 1.2, 1.2]);
for (const [x, z] of [[-12, -6], [12, -6], [-34, -4], [33, 18]]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.8), new THREE.MeshBasicMaterial({ map: tex((g, W, H) => { g.fillStyle = '#e8d6a8'; g.fillRect(0, 0, W, H); g.fillStyle = '#3a1a0a'; g.font = '900 40px serif'; g.textAlign = 'center'; g.fillText('WANTED', W / 2, 50); g.font = '120px serif'; g.fillText('🤠', W / 2, 180); g.font = '900 30px serif'; g.fillText('500 🪙', W / 2, 235) }, 256, 256) })); cyl(.08, .08, 2.6, '#4a2e18', x, 1.3, z); p.position.set(x, 2.2, z + .1); scene.add(p) }

// ---------- игрок ----------
let me = makeHero({ ...((ME().life || {}).look || {}), vh: '', cw: '' }); me.position.set(0, 0, RAD - 6); me.rotation.y = Math.PI; scene.add(me); play(me, 'Idle');
let HP = 100, dead = false, lastHit = 0;
const WPN = { w_knife: ['🔪', 'Нож', 1, 2.4, .45], w_bow: ['🏹', 'Лук', 2, 15, .9], w_sword: ['⚔️', 'Меч', 3, 3.2, .7], w_lbow: ['🎯', 'Длинный лук', 4, 19, 1], w_elf: ['🍃', 'Эльфийский лук', 5, 19, .7], w_skard: ['🗡', 'Клинок Скарда', 6, 3.6, .6], w_shadow: ['🌑', 'Кинжал тени', 4, 2.6, .3], w_flame: ['🔥', 'Меч пламени', 7, 3.6, .6], w_hunt: ['🏹', 'Лук охотника', 8, 22, .6], w_legend: ['🌟', 'Гроза Скарда', 10, 4.2, .5], w_axe: ['🪓', 'Боевой топор', 4, 3.4, .7], w_spear: ['🔱', 'Копьё рейнджера', 5, 4.6, .6], w_mace: ['🔨', 'Гномий молот', 6, 3.4, .75], w_xbow: ['🎯', 'Арбалет', 7, 20, .85], w_ice: ['❄️', 'Ледяной меч', 8, 3.8, .5], w_dragon: ['🐉', 'Драконий клинок', 9, 4, .5], w_thunder: ['⚡', 'Молот грома', 11, 4, .6], w_diamond: ['💎', 'Алмазный меч', 12, 4.4, .45] };
const HAS = k => ((ME().life || {}).wear || []).includes(k);
const FXA = k => { const f = ((ME().life || {}).fx || {})[k]; return f && f > Date.now() / 1000 };
const ARMK = () => { let a = 0; for (const k of ((ME().life || {}).wear || [])) a = Math.max(a, { ar_leather: .15, ar_chain: .25, ar_plate: .35, ar_skard: .45, ar_gold: .5 }[k] || 0); return 1 - a };
const HPM = () => FXA('hp') ? 150 : 100;
const owned = () => Object.keys(WPN).filter(HAS);
let wi = 0; const FIST = ['✊', 'Кулаки', 1, 2.2, .55]; const curW = () => { const o = owned(); return o.length ? WPN[o[wi % o.length]] : FIST };
const WG = new THREE.Group(); scene.add(WG);
function wModel() { WG.clear(); const o = owned(); const k = o.length ? o[wi % o.length] : null; WG.userData.bow = 0; if (!k) return; const steel = new THREE.MeshStandardMaterial({ color: k === 'w_flame' ? '#ff6a2a' : k === 'w_legend' ? '#ffe9a0' : '#dfe6ee', metalness: .4, roughness: .3 }), wood = M('#5a3a1a'), gold = new THREE.MeshStandardMaterial({ color: '#d4a52a', metalness: .7, roughness: .3 });
  if (WPN[k][3] > 5) { const bow = new THREE.Mesh(new THREE.TorusGeometry(.75, .045, 6, 20, Math.PI), k === 'w_elf' ? M('#3aa05a') : k === 'w_hunt' ? gold : wood); bow.rotation.z = -Math.PI / 2; bow.position.z = .25; WG.add(bow); WG.userData.bow = 1 }
  else { const L = k === 'w_knife' || k === 'w_shadow' ? .55 : k === 'w_legend' ? 1.5 : 1.2; const bl = new THREE.Mesh(new THREE.BoxGeometry(.09, L, .025), steel); bl.position.y = L / 2 + .2; WG.add(bl); const gd = new THREE.Mesh(new THREE.BoxGeometry(.32, .06, .08), gold); gd.position.y = .2; WG.add(gd); const hd = cyl(.04, .04, .3, wood, 0, .05, 0, WG, 6) } }
function wBtn() { wModel(); WG.userData.base = WG.userData.bow ? [Math.PI, Math.PI / 2, 0] : [Math.PI / 2 + .6, 0, 0]; WG.rotation.set(...WG.userData.base); const w = curW(); $('wsw').innerHTML = w[0] + '<br><small style="font-size:10px">' + w[1] + '</small>' }
$('wsw').onclick = () => { wi++; wBtn(); HAP('light') };
const hpUI = () => { $('hpi').style.width = (HP / HPM() * 100) + '%'; $('hpl').textContent = '❤️ ' + Math.round(HP) + (HPM() > 100 ? ' / ' + HPM() : '') };
const coins = () => $('coins').textContent = '🪙 ' + ((ME().coins || 0).toLocaleString('ru'));

// ---------- разбойники ----------
const BLOOKS = [{ g: 'm', sk: '#c99a72', hc: '#1a1a1a', hs: 2, sh: '#2a2a2a', pa: '#3a2a1a', ac: 'cowboy' }, { g: 'm', sk: '#e0b08a', hc: '#3a2010', hs: 1, sh: '#7a1a1a', pa: '#2a2a3a', ac: 'cowboy' }, { g: 'f', sk: '#d9a87e', hc: '#2a1a10', hs: 1, sh: '#3a1a3a', pa: '#1a1a1a', ac: '' }, { g: 'm', sk: '#b98a62', hc: '#111', hs: 3, sh: '#4a3a1a', pa: '#2a2a2a', ac: '' }];
const BN = [];
function mask(h, c) { const m = new THREE.Mesh(new THREE.BoxGeometry(.62, .22, .1), M(c)); m.position.set(0, 1.62, .27); h.add(m); return m }
function spawnB(i) { const h = makeHero(BLOOKS[i % BLOOKS.length]); let x, z; do { const a = rnd(0, 7), d = rnd(10, 52); x = Math.sin(a) * d; z = Math.cos(a) * d } while (solid(x, z) || z > 40); h.position.set(x, 0, z); scene.add(h); mask(h, ['#8a1a1a', '#1a1a5a', '#111'][i % 3]); play(h, 'Idle'); const b = { h, hp: 4, st: 'idle', t: rnd(0, 3), atk: 0, hx: x, hz: z, run: 0, i }; BN.push(b); return b }
for (let i = 0; i < 12; i++) spawnB(i);
const DEADB = [];
// атаман
const BOSS = makeHero({ g: 'm', sk: '#b98a62', hc: '#111', hs: 2, sh: '#5a0a0a', pa: '#1a1a1a', ac: 'crown' }); BOSS.scale.setScalar(1.7); BOSS.position.set(0, 0, -6); scene.add(BOSS); mask(BOSS, '#000'); play(BOSS, 'Idle');
let BS = { hp: 1, max: 1, dead: 0 }, bossN = 0, bossAtk = 0, flush = 0;
function bossUI() { $('bi').style.width = (BS.hp / BS.max * 100) + '%'; $('bl').textContent = BS.dead ? '👑 Атаман повержен — вернётся завтра' : '👑 АТАМАН · ' + BS.hp.toLocaleString('ru') + ' / ' + BS.max.toLocaleString('ru'); BOSS.visible = !BS.dead }
async function api(a) { const j = await P.call('band', a); if (j && j.boss) { BS = j.boss; bossUI() } if (j && j.st !== undefined) $('st').textContent = j.st ? '💸 у тебя украли: ' + j.st + ' 🪙 — отбери!' : 'держи кошелёк крепче…'; coins(); return j }

// ---------- эффекты ----------
const FX = [];
function sprite(txt, pos, col = '#fff', sz = 1) { const t = tex((g, W, H) => { g.font = '900 64px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 8; g.strokeStyle = '#000'; g.strokeText(txt, W / 2, H / 2); g.fillStyle = col; g.fillText(txt, W / 2, H / 2) }, 256, 96); const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true })); s.scale.set(2.4 * sz, .9 * sz, 1); s.position.copy(pos); s.renderOrder = 9; scene.add(s); FX.push({ s, t0: performance.now(), v: 1.2 }) }
function arrow(from, to, done) { const a = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, 1, 5), new THREE.MeshBasicMaterial({ color: '#e8d8a0' })); a.position.copy(from); scene.add(a); FX.push({ s: a, arrow: 1, from: from.clone(), to: to.clone(), t0: performance.now(), done }) }
function popT(t) { const p = $('pop'); p.textContent = t; p.classList.add('on'); clearTimeout(p._t); p._t = setTimeout(() => p.classList.remove('on'), 1300) }

// ---------- бой ----------
let atkCD = 0;
$('atk').onclick = () => {
  if (dead) return; const w = curW(); if (performance.now() / 1000 < atkCD) return; atkCD = performance.now() / 1000 + w[4]; HAP('light');
  const range = w[3]; let tgt = null, td = 1e9; for (const b of BN) { const d = b.h.position.distanceTo(me.position); if (d < range + .8 && d < td) { td = d; tgt = b } }
  const bd = BOSS.visible ? BOSS.position.distanceTo(me.position) - 1.4 : 1e9; const toBoss = bd < range && (!tgt || bd < td); const tp = toBoss ? BOSS.position : tgt ? tgt.h.position : null;
  if (tp) me.rotation.y = Math.atan2(tp.x - me.position.x, tp.z - me.position.z); play(me, 'Punch', { once: true }); setTimeout(() => !dead && play(me, 'Idle'), 500); WG.userData.sw = performance.now();
  if (!tp) { popT(range > 5 ? '🏹 Нет цели' : '👊 Никого рядом'); return }
  const hit = () => { const dm = Math.ceil(w[2] * (FXA('str') ? 1.5 : 1)); if (toBoss) { bossN++; sprite('-' + dm, BOSS.position.clone().setY(4.2), '#ff6a6a', 1.2); play(BOSS, 'Defeat', { once: true }); setTimeout(() => play(BOSS, 'Idle'), 500); return } if (!BN.includes(tgt)) return; tgt.hp -= dm; sprite('-' + dm, tgt.h.position.clone().setY(2.6), '#ff6a6a'); tgt.st = 'chase'; if (tgt.hp <= 0) { BN.splice(BN.indexOf(tgt), 1); play(tgt.h, 'Defeat', { once: true }); DEADB.push({ b: tgt, t: performance.now() }); popT('🤠 Разбойник повержен!'); api({ a: 'kill' }) } };
  if (range > 5) arrow(me.position.clone().setY(1.4), tp.clone().setY(toBoss ? 2.5 : 1.2), hit); else hit() };
$('back').onclick = () => P.closeWork && P.closeWork();
const LEG = `<h2>🏴‍☠️ Город разбойников</h2><p>За лесом, в пыльной долине, банда Атамана построила свой городок за частоколом. Отсюда разбойники ходят на дороги и обчищают карманы путников.</p><p>Здесь тебя тоже попробуют ограбить: если разбойник подберётся близко — стащит монеты. Победи его — и вернёшь украденное!</p><p style="color:var(--win)">Шериф у ворот платит за каждого прогнанного разбойника. А главная награда — за Атамана, которого можно одолеть только всем городом.</p><button class="go1" id="px">🤠 Войти</button>`;
const openLeg = () => { $('panel').innerHTML = LEG; $('panel').classList.remove('hidden'); $('px').onclick = () => $('panel').classList.add('hidden') };
$('leg').onclick = openLeg;

// ---------- управление ----------
const joy = { x: 0, y: 0 }; { const J = $('joy'), K = $('knob'); let id = null; const mv = e => { for (const t of e.changedTouches || [e]) { if (id !== null && t.identifier !== undefined && t.identifier !== id) continue; const r = J.getBoundingClientRect(); let dx = t.clientX - r.left - 65, dy = t.clientY - r.top - 65; const L = Math.hypot(dx, dy); if (L > 50) { dx *= 50 / L; dy *= 50 / L } joy.x = dx / 50; joy.y = dy / 50; K.style.transform = `translate(${dx}px,${dy}px)` } };
  J.addEventListener('touchstart', e => { id = e.changedTouches[0].identifier; mv(e); e.preventDefault() }, { passive: false }); J.addEventListener('touchmove', e => { mv(e); e.preventDefault() }, { passive: false });
  const end = () => { id = null; joy.x = joy.y = 0; K.style.transform = '' }; J.addEventListener('touchend', end); J.addEventListener('touchcancel', end);
  J.addEventListener('mousedown', e => { mv(e); const mm = ev => mv(ev), up = () => { end(); removeEventListener('mousemove', mm); removeEventListener('mouseup', up) }; addEventListener('mousemove', mm); addEventListener('mouseup', up) }) }

function hurt(dmg, rob) { if (dead) return; if (HAS('i_shield')) dmg *= .65; dmg *= ARMK(); HP = Math.max(0, HP - dmg); lastHit = performance.now(); hpUI(); $('vig').classList.add('hit'); setTimeout(() => $('vig').classList.remove('hit'), 250); HAP('heavy'); if (rob) { api({ a: 'rob' }); sprite('💸', me.position.clone().setY(2.8), '#ffd34d') }
  if (HP <= 0) { dead = true; play(me, 'Defeat', { once: true }); popT('😵 Тебя обчистили и выкинули за ворота'); setTimeout(() => { me.position.set(0, 0, RAD - 6); HP = HPM(); hpUI(); dead = false; play(me, 'Idle') }, 2600) } }
let last = performance.now(); const cp = new THREE.Vector3(0, 14, RAD + 4);
function loop(now) {
  requestAnimationFrame(loop); const dt = Math.min(.05, (now - last) / 1000), t = now / 1000; last = now;
  const L = Math.hypot(joy.x, joy.y); if (!dead && L > .1) { const sp = 8 * (HAS('i_boots') ? 1.35 : 1) * (FXA('spd') ? 1.4 : 1) * Math.min(1, L), dx = joy.x, dz = joy.y; const nx = me.position.x + dx * sp * dt, nz = me.position.z + dz * sp * dt; if (!solid(nx, nz)) { me.position.x = nx; me.position.z = nz } else if (!solid(nx, me.position.z)) me.position.x = nx; else if (!solid(me.position.x, nz)) me.position.z = nz; me.rotation.y = Math.atan2(dx, dz); walk(me, t, true) } else walk(me, t, false);
  if (me.position.z > RAD + 1 && !dead) { P.closeWork && P.closeWork(); return }
  if (now - lastHit > 3000 && HP < HPM()) { HP = Math.min(HPM(), HP + dt * (HAS('i_ring') ? 12 : 5)); hpUI() }
  for (const b of BN) { const h = b.h, d = h.position.distanceTo(me.position); let tx = null, tz = null, spd = 0;
    if (b.st === 'run') { if (t > b.run) b.st = 'idle'; tx = h.position.x * 2 - me.position.x; tz = h.position.z * 2 - me.position.z; spd = 6 }
    else if (d < 13 && !dead) b.st = 'chase'; else if (b.st === 'chase' && (d > 26 || dead)) b.st = 'idle';
    if (b.st === 'chase') { tx = me.position.x; tz = me.position.z; spd = 5.2; if (d < 1.5) { spd = 0; if (t > b.atk) { b.atk = t + 1.6; play(h, 'Punch', { once: true }); setTimeout(() => play(h, 'Idle'), 600); const rob = Math.random() < .45; hurt(rob ? 6 : 9, rob); if (rob) { b.st = 'run'; b.run = t + 4; popT('💸 Ограбили! Догоняй!') } } } }
    else if (b.st === 'idle') { b.t -= dt; if (b.t < 0) { b.t = rnd(2, 5); b.wx = b.hx + rnd(-8, 8); b.wz = b.hz + rnd(-8, 8) } if (b.wx !== undefined && Math.hypot(b.wx - h.position.x, b.wz - h.position.z) > .6) { tx = b.wx; tz = b.wz; spd = 2 } }
    if (tx !== null && spd > 0) { const vx = tx - h.position.x, vz = tz - h.position.z, l = Math.hypot(vx, vz) || 1; const nx = h.position.x + vx / l * spd * dt, nz = h.position.z + vz / l * spd * dt; if (!solid(nx, nz)) { h.position.x = nx; h.position.z = nz } h.rotation.y = Math.atan2(vx, vz); walk(h, t, true) } else walk(h, t, false) }
  for (let i = DEADB.length - 1; i >= 0; i--) { const D = DEADB[i], k = (now - D.t) / 1000; if (k > 2.5) D.b.h.visible = false; if (k > 40 && D.b.h.position.distanceTo(me.position) > 25) { scene.remove(D.b.h); DEADB.splice(i, 1); spawnB(D.b.i) } }
  const nearBoss = BOSS.visible && BOSS.position.distanceTo(me.position) < 30; $('bossb').classList.toggle('hidden', !nearBoss);
  if (BOSS.visible) { const d = BOSS.position.distanceTo(me.position); if (d < 18 && !dead) { const vx = me.position.x - BOSS.position.x, vz = me.position.z - BOSS.position.z, l = Math.hypot(vx, vz) || 1; BOSS.rotation.y = Math.atan2(vx, vz); if (d > 2.6) { const nx = BOSS.position.x + vx / l * 3 * dt, nz = BOSS.position.z + vz / l * 3 * dt; if (Math.hypot(nx, nz + 2) < 16 && !solid(nx, nz)) { BOSS.position.x = nx; BOSS.position.z = nz } walk(BOSS, t, true) } else { walk(BOSS, t, false); if (t > bossAtk) { bossAtk = t + 1.5; play(BOSS, 'Punch', { once: true }); setTimeout(() => play(BOSS, 'Idle'), 600); hurt(15, Math.random() < .3) } } } else walk(BOSS, t, false) }
  if (bossN && now - flush > 2000) { flush = now; const n = bossN; bossN = 0; api({ a: 'boss', n }) }
  // оружие в руке
  if (!me.userData.att) { let fl = null; me.traverse(o => { if (o.isBone && /^Fist\.?L$/.test(o.name)) fl = o }); if (fl) { me.userData.att = 1; me.updateMatrixWorld(true); const ws = new THREE.Vector3(); fl.getWorldScale(ws); WG.scale.setScalar(.7 / ws.x); WG.position.set(0, .05 / ws.y, 0); fl.add(WG); wBtn() } }
  if (WG.userData.sw) { const k = (now - WG.userData.sw) / 350, B0 = WG.userData.base || [0, 0, 0]; if (k >= 1) { WG.userData.sw = 0; WG.rotation.set(...B0) } else if (!WG.userData.bow) WG.rotation.set(B0[0] + (k < .3 ? k / .3 * .9 : .9 - (k - .3) / .7 * 2.4), B0[1], B0[2]) }
  FL.scale.set(1 + Math.sin(t * 11) * .1, 1 + Math.sin(t * 15) * .2, 1); FLL.intensity = 40 + Math.sin(t * 13) * 8;
  for (let i = FX.length - 1; i >= 0; i--) { const f = FX[i], k = (now - f.t0) / 1000; if (f.arrow) { const kk = Math.min(1, k / .25); f.s.position.lerpVectors(f.from, f.to, kk); f.s.lookAt(f.to); f.s.rotateX(Math.PI / 2); if (kk >= 1) { scene.remove(f.s); FX.splice(i, 1); f.done && f.done() } continue } f.s.position.y += dt * f.v; f.s.material.opacity = 1 - k; if (k >= 1) { scene.remove(f.s); FX.splice(i, 1) } }
  tickHeroes(dt);
  const want = new THREE.Vector3(me.position.x, 15, me.position.z + 11); cp.lerp(want, .08); cam.position.copy(cp); cam.lookAt(me.position.x, 1, me.position.z - 1);
  R.render(scene, cam) }
window.__bn = { me, BN, BOSS };
preload(((ME().life || {}).look) || {}); hpUI(); coins(); wBtn(); requestAnimationFrame(loop);
api({ a: 'enter' }).then(() => { let seen = 0; try { seen = localStorage.getItem('bnleg') } catch (e) { } if (!seen) { openLeg(); try { localStorage.setItem('bnleg', '1') } catch (e) { } } });
