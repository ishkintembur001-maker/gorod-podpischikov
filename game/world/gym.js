// Спортзал «Аскер»: тренажёры + секции бокса и борьбы с ежедневной тренировкой
import * as THREE from './three.js';
import { makeHero, walk, play, tickHeroes, preload } from './hero.js';
const P = parent, $ = id => document.getElementById(id);
const ME = () => P.ME || {};
const HAP = k => { try { P.HAP && P.HAP(k) } catch (e) { } };
const myLook = (o = {}) => ({ ...((ME().life || {}).look || {}), ...o });
const toast = m => { if (m && P.toast) P.toast(m) };

// ---------- сцена ----------
const R = new THREE.WebGLRenderer({ canvas: $('gl'), antialias: true });
R.setPixelRatio(Math.min(2, devicePixelRatio)); R.setSize(innerWidth, innerHeight);
R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap; R.toneMapping = THREE.ACESFilmicToneMapping; R.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene(); scene.background = new THREE.Color('#1b1446');
const cam = new THREE.PerspectiveCamera(66, innerWidth / innerHeight, .3, 300);
addEventListener('resize', () => { R.setSize(innerWidth, innerHeight); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix() });
scene.add(new THREE.HemisphereLight('#fff6e8', '#4a4060', 1.15));
const sun = new THREE.DirectionalLight('#fff1d6', 1.5); sun.position.set(-10, 30, 18); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -20, right: 20, top: 20, bottom: -20, near: 1, far: 80 }); scene.add(sun);
const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .7, ...o });
function mk(geo, m, x, y, z, p = scene) { const o = new THREE.Mesh(geo, m.isMaterial ? m : M(m)); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; p.add(o); return o }
const B = (w, h, d, c, x, y, z, p) => mk(new THREE.BoxGeometry(w, h, d), c, x, y, z, p);
const C = (r1, r2, h, c, x, y, z, p, s = 16) => mk(new THREE.CylinderGeometry(r1, r2, h, s), c, x, y, z, p);
function tex(fn, w = 512, h = 128) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t }
function sign(text, w, h, bg, fg, x, y, z, p = scene, ry = 0) { const t = tex((g, W, H) => { g.fillStyle = bg; g.fillRect(0, 0, W, H); g.fillStyle = fg; g.font = `900 ${H * .55}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, W / 2, H / 2 + 4) }, 1024, Math.round(1024 * h / w)); const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, toneMapped: false })); m.position.set(x, y, z); m.rotation.y = ry; p.add(m); return m }

// зал 22×26
const HW = 11, HD = 13;
{ const ft = tex((g, W, H) => { g.fillStyle = '#c9a27a'; g.fillRect(0, 0, W, H); for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? '#bb9470' : '#d1ab84'; g.fillRect(0, i * H / 16, W, H / 16 - 2) } }, 256, 256); ft.wrapS = ft.wrapT = THREE.RepeatWrapping; ft.repeat.set(3, 4);
  const f = new THREE.Mesh(new THREE.PlaneGeometry(HW * 2, HD * 2), new THREE.MeshStandardMaterial({ map: ft, roughness: .6 })); f.rotation.x = -Math.PI / 2; f.receiveShadow = true; scene.add(f);
  const wm = M('#e9e9f2'); B(HW * 2, 6, .4, wm, 0, 3, -HD); B(.4, 6, HD * 2, wm, -HW, 3, 0); B(.4, 6, HD * 2, wm, HW, 3, 0); B(HW * 2, .6, .5, '#e8433a', 0, 6.1, -HD); B(.5, .6, HD * 2, '#e8433a', -HW, 6.1, 0); B(.5, .6, HD * 2, '#e8433a', HW, 6.1, 0);
  B(HW * 2, .8, .3, '#e8433a', 0, .4, HD);
  sign('🏋️ СПОРТЗАЛ «АСКЕР»', 14, 2, '#e8433a', '#ffffff', 0, 4.4, -HD + .25);
  sign('🏆 НАШИ ЧЕМПИОНЫ', 7, 1.1, '#ffd34d', '#3b2300', -5, 2.4, -HD + .25);
  sign('🥊 БОКС · 🤼 БОРЬБА', 7, 1.1, '#1d1a2e', '#ffd34d', 5, 2.4, -HD + .25);
  for (const z of [-6, 2]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(5, 3), new THREE.MeshStandardMaterial({ color: '#bfe6ff', metalness: .9, roughness: .05 })); m.position.set(HW - .25, 2.6, z); m.rotation.y = -Math.PI / 2; scene.add(m) } }

const FX = [0, 60, 120], FLN = ['🏋️ Тренажёрный зал', '🥊 Зал бокса', '🤼 Зал борьбы'];
function shell(ox, title, wc, fc) { const ft = tex((g, W, H) => { g.fillStyle = fc; g.fillRect(0, 0, W, H); for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? 'rgba(0,0,0,.08)' : 'rgba(255,255,255,.06)'; g.fillRect(i * W / 8, 0, W / 8, H) } }, 256, 256); ft.wrapS = ft.wrapT = THREE.RepeatWrapping; ft.repeat.set(3, 4);
  const f = new THREE.Mesh(new THREE.PlaneGeometry(HW * 2, HD * 2), new THREE.MeshStandardMaterial({ map: ft, roughness: .6 })); f.rotation.x = -Math.PI / 2; f.position.x = ox; f.receiveShadow = true; scene.add(f);
  const wm = M(wc); B(HW * 2, 6, .4, wm, ox, 3, -HD); B(.4, 6, HD * 2, wm, ox - HW, 3, 0); B(.4, 6, HD * 2, wm, ox + HW, 3, 0); B(HW * 2, .8, .3, '#e8433a', ox, .4, HD); sign(title, 14, 2, '#1d1a2e', '#ffd34d', ox, 4.4, -HD + .25) }
shell(60, '🥊 ЭТАЖ 2 · ЗАЛ БОКСА', '#2a2440', '#3a3550'); shell(120, '🤼 ЭТАЖ 3 · ЗАЛ БОРЬБЫ', '#e8eefc', '#9fb8e8');
for (const ox of FX) { B(2.6, 4.2, .3, '#b0b0c0', ox + HW - 2.5, 2.1, HD - .3); B(2.2, 3.6, .1, '#8a8aa0', ox + HW - 2.5, 1.9, HD - .5); sign('🛗 ЛИФТ', 2.4, .6, '#ffd34d', '#3b2300', ox + HW - 2.5, 4.5, HD - .5, scene, Math.PI) }
const EQ = [], CLICK = [];
function eq(k, ico, name, x, z, ry, build, stand, anim) { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g); build(g); g.userData.eq = k; CLICK.push(g); const s = new THREE.Vector3(...stand).applyAxisAngle(new THREE.Vector3(0, 1, 0), ry).add(g.position); EQ.push({ k, ico, name, g, stand: s, anim, face: ry }); return g }
// беговые дорожки
for (const [i, z] of [[0, 1], [1, 4.2]]) eq('tread', '🏃', 'Беговая дорожка', -8.6, z, Math.PI / 2, g => { B(3.2, .3, 1.4, '#2a2a33', 0, .15, 0, g); B(2.8, .05, 1.1, '#111', 0, .33, 0, g); for (const s of [-.6, .6]) B(.1, 1.6, .1, '#888', 1.4, 1, s, g); B(.2, .5, 1.3, '#333', 1.5, 1.8, 0, g); B(.05, .25, .8, '#58a8ff', 1.4, 1.85, 0, g) }, [-.2, .34, 0], 'Run');
eq('bike', '🚴', 'Велотренажёр', -8.6, 7.6, Math.PI / 2, g => { B(1.8, .2, .5, '#333', 0, .1, 0, g); C(.45, .45, .2, '#222', .6, .55, 0, g).rotation.x = Math.PI / 2; B(.15, 1.2, .15, '#666', -.4, .7, 0, g); B(.6, .12, .4, '#111', -.4, 1.35, 0, g); B(.15, 1.3, .15, '#666', .7, .9, 0, g); B(.1, .1, .8, '#666', .7, 1.55, 0, g) }, [-.4, .55, 0], 'Run');
eq('bench', '🏋️', 'Скамья со штангой', 6, 3.5, -Math.PI / 2, g => { B(.8, .7, 2.6, '#2a2a33', 0, .55, 0, g); for (const s of [-1, 1]) B(.1, 1.8, .1, '#888', s * .9, .9, -1, g); const b = C(.05, .05, 3, '#bbb', 0, 1.8, -1, g, 8); b.rotation.z = Math.PI / 2; for (const s of [-1.3, 1.3]) { const p = C(.5, .5, .22, '#111', s, 1.8, -1, g); p.rotation.z = Math.PI / 2 } }, [0, 0, 1.6], 'PickUp');
eq('dumb', '💪', 'Гантели', 9.4, 7.5, -Math.PI / 2, g => { B(.8, 1, 3, '#2a2a33', 0, .5, 0, g); for (let i = 0; i < 5; i++) { const d = C(.12, .12, .6, '#c0392b', 0, 1.15, -1.2 + i * .6, g, 8); d.rotation.z = Math.PI / 2 } }, [0, 0, 1.4], 'PickUp');
const BAGS = [];
for (const [i, z] of [[2, -2.2], [3, -5.4]]) eq('tread', '🏃', 'Беговая дорожка', -8.6, z, Math.PI / 2, g => { B(3.2, .3, 1.4, '#2a2a33', 0, .15, 0, g); B(2.8, .05, 1.1, '#111', 0, .33, 0, g); for (const s of [-.6, .6]) B(.1, 1.6, .1, '#888', 1.4, 1, s, g); B(.2, .5, 1.3, '#333', 1.5, 1.8, 0, g); B(.05, .25, .8, '#58a8ff', 1.4, 1.85, 0, g) }, [-.2, .34, 0], 'Run');
eq('bike', '🚴', 'Велотренажёр', -8.6, -8.8, Math.PI / 2, g => { B(1.8, .2, .5, '#333', 0, .1, 0, g); C(.45, .45, .2, '#222', .6, .55, 0, g).rotation.x = Math.PI / 2; B(.15, 1.2, .15, '#666', -.4, .7, 0, g); B(.6, .12, .4, '#111', -.4, 1.35, 0, g); B(.15, 1.3, .15, '#666', .7, .9, 0, g); B(.1, .1, .8, '#666', .7, 1.55, 0, g) }, [-.4, .55, 0], 'Run');
for (const [x, z] of [[0, -4], [-3.5, -9]]) eq('bench', '🏋️', 'Скамья со штангой', x, z, 0, g => { B(.8, .7, 2.6, '#2a2a33', 0, .55, 0, g); for (const s of [-1, 1]) B(.1, 1.8, .1, '#888', s * .9, .9, -1, g); const b = C(.05, .05, 3, '#bbb', 0, 1.8, -1, g, 8); b.rotation.z = Math.PI / 2; for (const s of [-1.3, 1.3]) { const p = C(.5, .5, .22, '#111', s, 1.8, -1, g); p.rotation.z = Math.PI / 2 } }, [0, 0, 1.6], 'PickUp');
eq('dumb', '💪', 'Гантели', 9.4, -6, -Math.PI / 2, g => { B(.8, 1, 3, '#2a2a33', 0, .5, 0, g); for (let i = 0; i < 5; i++) { const d = C(.12, .12, .6, '#2b6cd8', 0, 1.15, -1.2 + i * .6, g, 8); d.rotation.z = Math.PI / 2 } }, [0, 0, 1.4], 'PickUp');
eq('rope', '⏫', 'Скакалка', 66, 9.5, 0, g => { const r = new THREE.Mesh(new THREE.TorusGeometry(.6, .03, 6, 20), M('#f2c230')); r.rotation.x = Math.PI / 2; r.position.y = .05; g.add(r); C(.9, .9, .02, '#e8433a', 0, .01, 0, g, 24) }, [0, 0, 0], 'Jump');
eq('mat', '🧘', 'Растяжка перед схваткой', 113, 8, 0, g => { B(1.6, .05, 3, '#2bb24c', 0, .03, 0, g) }, [0, 0, 0], 'Roll');
{ const g = new THREE.Group(); g.position.set(127, 0, 6); scene.add(g); C(2.6, 2.6, .14, '#e8433a', 0, .07, 0, g, 32); C(2.1, 2.1, .16, '#3a62d8', 0, .08, 0, g, 32) }
for (const z of [-2, 1.5, 5, 8.5]) eq('bag', '🥊', 'Боксёрская груша', 69.2, z, -Math.PI / 2, g => { B(.2, .2, 1.2, '#333', 0, 5.2, 0, g); C(.04, .04, 1.4, '#555', 0, 4.5, 0, g, 6); const b = C(.55, .55, 2.4, '#1d1d1d', 0, 2.6, 0, g); BAGS.push(b) }, [0, 0, 1.3], 'Punch');
eq('rope', '⏫', 'Скакалка', 0, 6.5, 0, g => { const r = new THREE.Mesh(new THREE.TorusGeometry(.6, .03, 6, 20), M('#f2c230')); r.rotation.x = Math.PI / 2; r.position.y = .05; g.add(r); C(.9, .9, .02, '#3a8fd8', 0, .01, 0, g, 24) }, [0, 0, 0], 'Jump');
eq('mat', '🧘', 'Коврик для растяжки', 0, 10, 0, g => { B(1.6, .05, 3, '#8a4dff', 0, .03, 0, g) }, [0, 0, 0], 'Roll');
// ринг (бокс) и ковёр (борьба)
const RING = new THREE.Vector3(60, 0, -4), MAT = new THREE.Vector3(120, 0, -4);
{ const g = new THREE.Group(); g.position.copy(RING); scene.add(g); g.userData.sec = 'box'; CLICK.push(g); B(8, 1, 8, '#22305e', 0, .5, 0, g); B(7.7, .08, 7.7, '#3a62d8', 0, 1.04, 0, g);
  [[-3.8, -3.8, '#e8433a'], [3.8, 3.8, '#3a8fd8'], [-3.8, 3.8, '#fff'], [3.8, -3.8, '#fff']].forEach(([x, z, c]) => C(.18, .18, 2.8, c, x, 2.2, z, g, 8));
  for (const y of [1.7, 2.3, 2.9]) { const rm = M('#ffffff'); B(7.6, .07, .07, rm, 0, y, -3.8, g); B(7.6, .07, .07, rm, 0, y, 3.8, g); B(.07, .07, 7.6, rm, -3.8, y, 0, g); B(.07, .07, 7.6, rm, 3.8, y, 0, g) }
  sign('🥊 БОКС', 3.4, .8, '#e8433a', '#fff', 0, .55, 4.02, g) }
{ const g = new THREE.Group(); g.position.copy(MAT); scene.add(g); g.userData.sec = 'wr'; CLICK.push(g); C(4.2, 4.2, .16, '#1f4fb8', 0, .08, 0, g, 40); C(3.4, 3.4, .18, '#e8433a', 0, .09, 0, g, 40); C(2.9, 2.9, .2, '#3a62d8', 0, .1, 0, g, 40); sign('🤼 БОРЬБА', 3.4, .8, '#2d6cdf', '#fff', 0, .5, 4.3, g) }

// ---------- персонажи ----------
const NPC = (look, x, z, ry) => { const h = makeHero({ g: 'm', sk: '#e0b08a', hc: '#222', hs: 1, ...look }); h.position.set(x, 0, z); h.rotation.y = ry; scene.add(h); play(h, 'Idle'); return h };
const coachB = NPC({ sh: '#1d1d1d', pa: '#2b3a55', ac: 'cap' }, RING.x - 4.8, RING.z + 4.6, 2.4), coachW = NPC({ sh: '#1d1d1d', pa: '#2b3a55' }, MAT.x + 4.4, MAT.z + 3.2, -2.4);
const sparB = NPC({ sh: '#3a8fd8', pa: '#1c1c1c', hs: 2 }, RING.x + 1.3, RING.z, -Math.PI / 2), sparW = NPC({ sh: '#3a8fd8', pa: '#3a8fd8', hs: 3 }, MAT.x + .9, MAT.z, -Math.PI / 2);
sparB.position.y = 1.08;
const me = makeHero(myLook()); me.position.set(0, 0, HD - 2); me.rotation.y = Math.PI; scene.add(me); play(me, 'Idle');
// подпись «ТЫ»
{ const t = tex((g, W, H) => { g.fillStyle = '#ffc65c'; g.beginPath(); g.roundRect(30, 6, W - 60, 74, 37); g.fill(); g.fillStyle = '#3b2300'; g.font = '900 52px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('ТЫ', W / 2, 45) }, 256, 90); const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false })); s.scale.set(1.8, .63, 1); s.position.y = 4.4; s.renderOrder = 5; me.add(s) }

// ---------- движение ----------
let path = null, busy = false, onArrive = null;
function goTo(v, cb) { path = v.clone(); path.y = 0; onArrive = cb; me.position.y = 0 }
function stepMove(dt, t) { if (!path) { walk(me, t, false); return } const d = path.clone().sub(me.position); d.y = 0; const L = d.length(); if (L < .15) { me.position.x = path.x; me.position.z = path.z; path = null; walk(me, t, false); const f = onArrive; onArrive = null; f && f(); return } const sp = 9 * dt; me.position.addScaledVector(d.normalize(), Math.min(L, sp)); me.rotation.y = Math.atan2(d.x, d.z); walk(me, t, true) }

// ---------- камера ----------
const CAM0 = { p: new THREE.Vector3(0, 33, 27), l: new THREE.Vector3(0, 0, 0.5) }; let camT = CAM0;
const cp = CAM0.p.clone(), cl = CAM0.l.clone();
let FLOOR = 0;
function goFloor(i, cb) { if (busy) return; FLOOR = i; path = null; me.position.set(FX[i] + HW - 2.5, 0, HD - 1.6); me.rotation.y = Math.PI; play(me, 'Idle'); CAM0.p.set(FX[i], 33, 27); CAM0.l.set(FX[i], 0, .5); camT = { p: CAM0.p.clone(), l: CAM0.l.clone() }; cp.copy(CAM0.p); cl.copy(CAM0.l); HAP('medium'); toast('🛗 ' + FLN[i]); document.querySelectorAll('.fl').forEach(b => b.classList.toggle('on', +b.dataset.f === i)); if (cb) setTimeout(cb, 500) }
function setCam(p, l) { camT = { p: new THREE.Vector3(...p), l: new THREE.Vector3(...l) } }

// ---------- состояние ----------
let GYM = {};
const RKN = s => { const r = (GYM.rank || {})[s]; return r ? r[1] : '' };
async function load(a = {}) { const j = await P.call('gym', a); if (j && j.gym) { GYM = j.gym; ui() } return j }
function ui() { $('coins').textContent = '🪙 ' + ((ME().coins || 0).toLocaleString('ru')); const st = GYM.st || {}; $('st').textContent = `💪 сила ${st.str || 0} · 🫀 выносливость ${st.end || 0}`;
  for (const s of ['box', 'wr']) { const X = GYM[s], d = new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 10); $('s' + s).textContent = !X ? 'запись · 300 🪙' : X.d === d ? '✅ сегодня готово · ' + RKN(s) : '🔥 тренировка ждёт · ' + RKN(s) } }

// ---------- тренажёры ----------
function eqMenu(E, x, y) { const m = $('eqm'); m.innerHTML = `<div>${E.ico} ${E.name}</div><small style="color:#6a5aa8">+1 к ${['tread', 'bike', 'rope', 'mat'].includes(E.k) ? 'выносливости' : 'силе'} · +монеты</small><button>Тренироваться</button>`; m.style.left = Math.min(innerWidth - 210, Math.max(10, x - 100)) + 'px'; m.style.top = Math.max(70, Math.min(innerHeight - 200, y - 130)) + 'px'; m.classList.remove('hidden'); m.querySelector('button').onclick = () => { m.classList.add('hidden'); useEq(E) } }
function useEq(E) { if (busy) return; busy = true; HAP('light'); goTo(E.stand, async () => { me.rotation.y = E.face + (E.k === 'tread' || E.k === 'bike' ? Math.PI / 2 * 0 : 0); if (E.k === 'tread' || E.k === 'bike') { me.position.y = E.k === 'bike' ? .3 : .34; me.rotation.y = E.face + Math.PI / 2 } else me.rotation.y = Math.atan2(E.g.position.x - me.position.x, E.g.position.z - me.position.z);
  play(me, E.anim); const j = P.call('gym', { a: 'eq', k: E.k }); const t0 = performance.now(); while (performance.now() - t0 < 5000) { if (E.k === 'bag') BAGS.forEach(b => b.parent.rotation.z = Math.sin(performance.now() / 120) * .12); await new Promise(r => setTimeout(r, 50)) } BAGS.forEach(b => b.parent.rotation.z = 0);
  me.position.y = 0; play(me, 'Idle'); const r = await j; if (r && r.gym) { GYM = r.gym; ui() } busy = false }) }

// ---------- секции ----------
function panel(s) { const X = GYM[s], nm = s === 'box' ? '🥊 Секция бокса' : '🤼 Секция борьбы', d = new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 10); const p = $('panel');
  if (!X) p.innerHTML = `<h2>${nm}</h2><p>Тренер учит с нуля. Каждый день — короткая тренировка: ${s === 'box' ? 'бей джеб, хук и апперкот по команде тренера' : 'лови момент для захвата и бросай соперника'}.</p><p>Растёшь в разрядах: Новичок → Юниор → 3-й, 2-й, 1-й разряд → КМС → Мастер спорта. Лучших возьмём на соревнования 🏆</p><button class="go1" id="pj">✍️ Записаться · 300 🪙</button><button class="go2" id="px">Закрыть</button>`;
  else { const r = (GYM.rank || {})[s] || [0, 'Новичок', 100], pr = r[2] ? Math.min(100, (X.xp - r[0]) / (r[2] - r[0]) * 100) : 100, done = X.d === d;
    p.innerHTML = `<h2>${nm}</h2><p>Разряд: <b style="color:var(--win)">${r[1]}</b> · опыт ${X.xp}${r[2] ? ' / ' + r[2] : ''}</p><div class="bar"><i style="width:${pr}%"></i></div><p>Тренировок: ${X.n} · серия: ${X.sk} дн. ${X.sk > 1 ? '🔥' : ''}</p><p style="color:var(--dim)">Не пропускай дни — серия даёт больше опыта.</p>${done ? '<button class="go2" disabled>✅ Сегодня готово — приходи завтра</button>' : '<button class="go1" id="pt">▶ Тренировка дня</button>'}<button class="go2" id="px">Закрыть</button>` }
  p.classList.remove('hidden'); $('bar0').classList.add('hidden');
  const close = () => { p.classList.add('hidden'); $('bar0').classList.remove('hidden') }; $('px').onclick = close;
  if ($('pj')) $('pj').onclick = async () => { const j = await load({ a: 'join', s }); if (j && GYM[s]) panel(s) };
  if ($('pt')) $('pt').onclick = () => { close(); s === 'box' ? boxing() : wrestling() } }

const wait = ms => new Promise(r => setTimeout(r, ms));
async function enterArena(at, partner, face) { busy = true; $('bar0').classList.add('hidden'); await new Promise(r => goTo(at, r)); me.position.y = at.y; me.rotation.y = face; partner.rotation.y = face + Math.PI }
async function finish(s, score, max) { $('mg').classList.add('hidden'); setCam([...CAM0.p.toArray()], [...CAM0.l.toArray()]); const j = await load({ a: 'train', s, score, max });
  play(me, score / max >= .5 ? 'Victory' : 'Defeat', { once: true }); await wait(1600); me.position.set(FX[FLOOR], 0, HD - 2); me.rotation.y = Math.PI; play(me, 'Idle'); busy = false; $('bar0').classList.remove('hidden'); panel(s) }

async function boxing() { await enterArena(new THREE.Vector3(RING.x - 1.3, 1.08, RING.z), sparB, Math.PI / 2); setCam([RING.x + 1, 9, RING.z + 8.5], [RING.x, 2, RING.z]);
  const mg = $('mg'); mg.innerHTML = `<div id="call">Тренер: «Работаем!»</div><div class="row"><button class="pb" data-k="0">👊 Джеб</button><button class="pb" data-k="1">🤜 Хук</button><button class="pb" data-k="2">💥 Апперкот</button></div>`; mg.classList.remove('hidden'); play(coachB, 'Victory', { once: true });
  const N = ['ДЖЕБ!', 'ХУК!', 'АППЕРКОТ!'], bt = [...mg.querySelectorAll('.pb')]; let score = 0, want = -1, okT = 0; const MAX = 12;
  const face = () => { sparB.rotation.y = Math.atan2(me.position.x - sparB.position.x, me.position.z - sparB.position.z); me.rotation.y = Math.atan2(sparB.position.x - me.position.x, sparB.position.z - me.position.z) }; face();
  bt.forEach(b => b.onpointerdown = e => { e.preventDefault(); if (want < 0) return; const k = +b.dataset.k; if (k === want) { score++; play(me, 'Punch', { once: true }); play(sparB, 'RecieveHit', { once: true }); sparB.position.x += .35; setTimeout(() => { sparB.position.x -= .35; face() }, 350); HAP('medium'); $('call').textContent = ['💥 Есть!', '🔥 Отлично!', '👊 Точно!'][score % 3] } else { play(sparB, 'Punch', { once: true }); play(me, 'RecieveHit', { once: true }); HAP('light'); $('call').textContent = '❌ Мимо!' } want = -1; bt.forEach(x => x.classList.remove('on')) });
  await wait(1200); for (let i = 0; i < MAX; i++) { want = Math.floor(Math.random() * 3); bt[want].classList.add('on'); $('call').textContent = N[want] + ` (${i + 1}/${MAX})`; const ms = Math.max(1100, 2000 - i * 70); await wait(ms); if (want >= 0) { $('call').textContent = '⏱ Поздно!'; want = -1; bt.forEach(x => x.classList.remove('on')) } await wait(380) }
  $('call').textContent = `Раунд окончен: ${score}/${MAX}`; await wait(900); finish('box', score, MAX) }

async function wrestling() { await enterArena(new THREE.Vector3(MAT.x - .9, .2, MAT.z), sparW, Math.PI / 2); setCam([MAT.x - 1, 9, MAT.z + 8.5], [MAT.x, 1.5, MAT.z]);
  const mg = $('mg'); mg.innerHTML = `<div id="call">Лови зелёную зону!</div><div id="tbar"><div class="z"></div><div class="m"></div></div><div class="row"><button class="pb on" id="grab">🤼 ЗАХВАТ!</button></div>`; mg.classList.remove('hidden'); play(coachW, 'Victory', { once: true });
  const z = mg.querySelector('.z'), mk_ = mg.querySelector('.m'); let score = 0, pos = 0, live = false, tapped = false; const MAX = 8; sparW.rotation.y = Math.atan2(me.position.x - sparW.position.x, me.position.z - sparW.position.z);
  $('grab').onpointerdown = e => { e.preventDefault(); if (!live) return; live = false; tapped = true };
  for (let i = 0; i < MAX; i++) { const w = Math.max(.16, .32 - i * .02), zs = .1 + Math.random() * (.8 - w); z.style.left = zs * 100 + '%'; z.style.width = w * 100 + '%'; $('call').textContent = `Жми, когда полоска в зелёном · ${i + 1}/${MAX}`; live = true; tapped = false; const t0 = performance.now(), sp = .75 + i * .07;
    while (live && performance.now() - t0 < 4200) { pos = (Math.sin((performance.now() - t0) / 1000 * sp * Math.PI - Math.PI / 2) + 1) / 2; mk_.style.left = `calc(${pos * 100}% - 4px)`; await wait(16) } live = false;
    if (tapped && pos >= zs && pos <= zs + w) { score++; HAP('medium'); $('call').textContent = '💪 Бросок!'; play(me, 'Punch', { once: true }); play(sparW, 'Death', { once: true }); await wait(900); play(sparW, 'StandUp', { once: true }) } else { HAP('light'); $('call').textContent = tapped ? '❌ Сорвался!' : '⏱ Не успел!'; play(sparW, 'Punch', { once: true }); play(me, 'RecieveHit', { once: true }) } await wait(700); play(sparW, 'Idle') }
  $('call').textContent = `Схватка окончена: ${score}/${MAX}`; await wait(900); finish('wr', score, MAX) }

// ---------- ввод ----------
const ray = new THREE.Raycaster(), ptr = new THREE.Vector2(); let sx = 0, sy = 0;
$('gl').addEventListener('pointerdown', e => { sx = e.clientX; sy = e.clientY });
$('gl').addEventListener('pointerup', e => { if (busy || Math.hypot(e.clientX - sx, e.clientY - sy) > 10) return; $('eqm').classList.add('hidden'); ptr.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ptr, cam); const h = ray.intersectObjects(CLICK, true)[0]; if (!h) return; let o = h.object; while (o && !o.userData.eq && !o.userData.sec) o = o.parent; if (!o) return;
  if (o.userData.sec) { panel(o.userData.sec); return } if (Math.abs(o.position.x - FX[FLOOR]) > 30) return; const E = EQ.find(q => q.g === o); if (E) eqMenu(E, e.clientX, e.clientY) });
document.querySelectorAll('.fl').forEach(b => b.onclick = () => { const i = +b.dataset.f; goFloor(i, i ? () => panel(i === 1 ? 'box' : 'wr') : null) });
$('back').onclick = () => P.closeWork && P.closeWork();

// ---------- цикл ----------
let last = performance.now();
function loop(now) { requestAnimationFrame(loop); const dt = Math.min(.05, (now - last) / 1000), t = now / 1000; last = now; stepMove(dt, t); tickHeroes(dt);
  if (!busy) { sparB.position.x = RING.x + 1.3 + Math.sin(t * 2) * .3 }
  cp.lerp(camT.p, .06); cl.lerp(camT.l, .08); cam.position.copy(cp); cam.lookAt(cl); R.render(scene, cam) }
preload(myLook()); requestAnimationFrame(loop); load().then(ui);
setTimeout(() => toast('🛗 3 этажа: тренажёры, бокс, борьба — переключай внизу'), 800);
