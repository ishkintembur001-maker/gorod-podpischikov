// Кинотеатр и бургерная «Бургер Город»: зайти, купить билет / заказать еду, посмотреть фильм / поесть
import * as THREE from './three.js';
import { makeHero, walk, play, tickHeroes, preload, dispose } from './hero.js';
const P = parent, $ = id => document.getElementById(id);
const V = new URLSearchParams(location.search).get('v') || 'burger';
const ME = () => P.ME || {};
const HAP = k => { try { P.HAP && P.HAP(k) } catch (e) { } };
const myLook = (o = {}) => ({ ...((ME().life || {}).look || {}), ...o });
const wait = ms => new Promise(r => setTimeout(r, ms));

const R = new THREE.WebGLRenderer({ canvas: $('gl'), antialias: true });
R.setPixelRatio(Math.min(2, devicePixelRatio)); R.setSize(innerWidth, innerHeight);
R.shadowMap.enabled = true; R.toneMapping = THREE.ACESFilmicToneMapping; R.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene(); scene.background = new THREE.Color('#140f33');
const cam = new THREE.PerspectiveCamera(64, innerWidth / innerHeight, .3, 300);
addEventListener('resize', () => { R.setSize(innerWidth, innerHeight); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix() });
const hemi = new THREE.HemisphereLight('#fff6e8', '#4a4060', V === 'cinema' ? .55 : 1.15); scene.add(hemi);
const sun = new THREE.DirectionalLight('#fff1d6', V === 'cinema' ? .5 : 1.4); sun.position.set(-8, 30, 16); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -20, right: 20, top: 20, bottom: -20, near: 1, far: 80 }); scene.add(sun);
const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .7, ...o });
function mk(geo, m, x, y, z, p = scene) { const o = new THREE.Mesh(geo, m.isMaterial ? m : M(m)); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; p.add(o); return o }
const B = (w, h, d, c, x, y, z, p) => mk(new THREE.BoxGeometry(w, h, d), c, x, y, z, p);
const C = (r1, r2, h, c, x, y, z, p, s = 16) => mk(new THREE.CylinderGeometry(r1, r2, h, s), c, x, y, z, p);
function tex(fn, w = 512, h = 128) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t }
function sign(text, w, h, bg, fg, x, y, z, p = scene) { const t = tex((g, W, H) => { g.fillStyle = bg; g.fillRect(0, 0, W, H); g.fillStyle = fg; g.font = `900 ${H * .55}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, W / 2, H / 2 + 4) }, 1024, Math.round(1024 * h / w)); const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, toneMapped: false })); m.position.set(x, y, z); p.add(m); return m }
const NPC = (look, x, z, ry) => { const h = makeHero({ g: 'm', sk: '#e0b08a', hc: '#222', hs: 1, ...look }); h.position.set(x, 0, z); h.rotation.y = ry; scene.add(h); play(h, 'Idle'); return h };
let me = makeHero(myLook()); me.position.set(0, 0, 11); me.rotation.y = Math.PI; scene.add(me); play(me, 'Idle');
{ const t = tex((g, W, H) => { g.fillStyle = '#ffc65c'; g.beginPath(); g.roundRect(30, 6, W - 60, 74, 37); g.fill(); g.fillStyle = '#3b2300'; g.font = '900 52px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('ТЫ', W / 2, 45) }, 256, 90); const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false })); s.scale.set(1.8, .63, 1); s.position.y = 4.4; s.renderOrder = 5; me.add(s) }
const bubbles = [];
function emo(g, e) { const t = tex((x, W, H) => { x.font = '96px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(e, W / 2, H / 2) }, 128, 128); const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false })); s.scale.set(1.4, 1.4, 1); s.position.copy(g.position).add(new THREE.Vector3(0, 4.2, 0)); s.renderOrder = 6; scene.add(s); bubbles.push({ s, t0: performance.now() }) }

let path = null, onArrive = null, busy = false;
function goTo(x, z) { return new Promise(r => { path = new THREE.Vector3(x, 0, z); onArrive = r; me.position.y = 0 }) }
function stepMove(dt, t) { if (!path) { walk(me, t, false); return } const d = path.clone().sub(me.position); d.y = 0; const L = d.length(); if (L < .15) { me.position.x = path.x; me.position.z = path.z; path = null; walk(me, t, false); const f = onArrive; onArrive = null; f && f(); return } me.position.addScaledVector(d.normalize(), Math.min(L, 9 * dt)); me.rotation.y = Math.atan2(d.x, d.z); walk(me, t, true) }
const CAM = { p: new THREE.Vector3(0, 30, 26), l: new THREE.Vector3(0, 0, 0) }; const cp = CAM.p.clone(), cl = CAM.l.clone();
const setCam = (p, l) => { CAM.p.set(...p); CAM.l.set(...l) };
const coins = () => $('coins').textContent = '🪙 ' + ((ME().coins || 0).toLocaleString('ru'));
const panel = $('panel'), closeP = () => { panel.classList.add('hidden'); $('bar0').classList.remove('hidden') };
const openP = html => { panel.innerHTML = html; panel.classList.remove('hidden'); $('bar0').classList.add('hidden') };

let tick = () => { };
const VW = {}; const WK = new URLSearchParams(location.search).get('w');
// =================== КИНОТЕАТР ===================
if (V === 'cinema') {
  $('ttl').firstChild.textContent = '🎬 Кинотеатр'; $('st').textContent = 'билет 50 🪙 · вдвоём 100 🪙';
  B(22, .2, 26, '#3a1d2e', 0, -.1, 0); B(22, 7, .4, '#2a1830', 0, 3.5, -13); B(.4, 7, 26, '#2a1830', -11, 3.5, 0); B(.4, 7, 26, '#2a1830', 11, 3.5, 0);
  for (let i = 0; i < 6; i++) for (const sx of [-1, 1]) { const l = mk(new THREE.SphereGeometry(.18, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffcf80' }), sx * 10.7, 4.5, -10 + i * 4) }
  const fc = document.createElement('canvas'); fc.width = 1024; fc.height = 440; const ft = new THREE.CanvasTexture(fc); ft.colorSpace = THREE.SRGBColorSpace;
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(18, 7.7), new THREE.MeshBasicMaterial({ map: ft, toneMapped: false })); scr.position.set(0, 5.2, -12.7); scene.add(scr); B(18.8, 8.4, .2, '#111', 0, 5.2, -12.85);
  const scrLight = new THREE.PointLight('#8ab4ff', 0, 30); scrLight.position.set(0, 5, -9); scene.add(scrLight);
  const SEATS = []; for (let r = 0; r < 4; r++) { B(20, .5 + r * .5, 2.6, '#2a1830', 0, (.5 + r * .5) / 2, -3 + r * 3); for (let c = 0; c < 8; c++) { const x = -7 + c * 2, z = -3 + r * 3, y = .5 + r * .5; B(1.4, .5, 1.1, '#c0392b', x, y + .25, z); B(1.4, 1.2, .25, '#a02a20', x, y + .8, z + .55); SEATS.push({ x, y: y + .45, z }) } }
  B(4, 1.2, 1.4, '#c0392b', 7.5, .6, 10); sign('🍿 ПОПКОРН', 3.6, .8, '#ffd34d', '#c0392b', 7.5, 1.6, 10.72); const seller = NPC({ sh: '#c0392b', pa: '#1c1c1c', ac: 'cap' }, 7.5, 8.6, 0); Object.assign(VW, { staff: seller, at: [7.5, 8.6], front: [7.5, 11.8], spawn: [2, 12], cam: [[7.5, 8.5, 21], [7.5, 1.6, 9.5]], items: [['pop', '🍿', 'Попкорн'], ['cola', '🥤', 'Кола'], ['hot', '🌭', 'Хот-дог'], ['choc', '🍫', 'Шоколад'], ['tick', '🎟', 'Билет']] });
  const people = []; for (const [i, j] of [[0, 1], [2, 5], [3, 2], [1, 6], [3, 7]]) { const s = SEATS[i * 8 + j]; const h = NPC({ sh: ['#3a8fd8', '#ff6fa8', '#2bb24c', '#f2c230', '#8a4dff'][people.length], pa: '#2b3a55', g: people.length % 2 ? 'f' : 'm', hs: people.length % 4 }, s.x, s.z + .1, Math.PI); h.position.y = s.y - 1.1; play(h, 'SitDown', { once: true }); people.push(h) }
  const FILMS = [['🦸', 'Герои города', '#3a62d8', 'боевик'], ['😂', 'Мэр в отпуске', '#f2a23a', 'комедия'], ['🚀', 'Город на Луне', '#8a4dff', 'фантастика'], ['💘', 'Любовь у фонтана', '#ff6fa8', 'мелодрама']];
  let film = 0, who = 'solo', playing = false, pt0 = 0;
  const drawScreen = t => { const g = fc.getContext('2d'), W = 1024, H = 440, F = FILMS[film]; if (!playing) { g.fillStyle = '#0d0a20'; g.fillRect(0, 0, W, H); g.fillStyle = '#fff'; g.font = '900 64px sans-serif'; g.textAlign = 'center'; g.fillText('🎬 СКОРО СЕАНС', W / 2, H / 2); ft.needsUpdate = true; return }
    const k = (t - pt0); const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, F[2]); gr.addColorStop(1, '#0d0a20'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect((i * 97 + k * 30) % W, (i * 53) % 200, 3, 3) }
    g.fillStyle = '#1d1a2e'; for (let i = 0; i < 9; i++) { const h = 80 + (i * 37) % 120; g.fillRect(i * 120 - (k * 40) % 120, H - h, 100, h) }
    g.font = '160px sans-serif'; g.textAlign = 'center'; g.fillText(F[0], W / 2 + Math.sin(k * 2) * 220, 210 + Math.sin(k * 5) * 30);
    g.fillStyle = '#fff'; g.font = '900 54px sans-serif'; g.fillText(F[1], W / 2, 80); ft.needsUpdate = true };
  tick = t => { drawScreen(t); scrLight.intensity = playing ? 2 + Math.sin(t * 3) : 0 };
  $('bar0').innerHTML = `<button class="sec b" id="buy">🎟 Купить билет<small>смотреть фильм</small></button>`;
  const choose = () => openP(`<h2>🎬 Что смотрим?</h2>${FILMS.map((f, i) => `<div class="film ${i === film ? 'on' : ''}" data-f="${i}"><i style="background:${f[2]}">${f[0]}</i><div>${f[1]}<br><small style="color:var(--dim)">${f[3]}</small></div></div>`).join('')}
    <p style="margin-top:10px">С кем идёшь?</p><div class="who"><button class="go2 ${who === 'solo' ? 'on' : ''}" data-w="solo">🙋 Один<br>50 🪙</button><button class="go2 ${who === 'girl' ? 'on' : ''}" data-w="girl">💑 С девушкой<br>100 🪙</button><button class="go2 ${who === 'friend' ? 'on' : ''}" data-w="friend">👥 С другом<br>100 🪙</button></div>
    <div id="fr"></div><button class="go1" id="go">🎟 Купить и смотреть</button><button class="go2" id="px">Закрыть</button>`, bind());
  let friend = null;
  const bind = () => setTimeout(() => { panel.querySelectorAll('[data-f]').forEach(e => e.onclick = () => { film = +e.dataset.f; choose() }); panel.querySelectorAll('[data-w]').forEach(e => e.onclick = async () => { who = e.dataset.w; choose(); if (who === 'friend') { const j = await P.call('inbox'); const fl = (j && j.friends) || []; $('fr').innerHTML = fl.length ? '<p>Кого позвать?</p>' + fl.slice(0, 8).map(f => `<button class="go2" data-n="${f.n}" style="padding:8px!important;margin-top:4px">@${f.n} ${f.on ? '🟢' : ''}</button>`).join('') : '<p style="color:var(--dim)">Друзей пока нет — добавь в ✉️ Сообщениях. Пойдёшь с девушкой?</p>'; $('fr').querySelectorAll('[data-n]').forEach(b => b.onclick = () => { friend = b.dataset.n; $('fr').querySelectorAll('[data-n]').forEach(x => x.style.outline = ''); b.style.outline = '3px solid var(--win)' }) } }); $('px').onclick = closeP; $('go').onclick = watch }, 0);
  $('buy').onclick = choose;
  async function watch() { if (busy) return; if (who === 'friend' && !friend) { P.toast && P.toast('Выбери друга из списка 👆'); return } busy = true; const j = await P.call('venue', { a: 'movie', w: who }); if (!j || !j.me) { busy = false; return } closeP(); $('bar0').classList.add('hidden'); coins();
    if (who === 'friend' && friend) P.call('chat/send', { to: friend, t: '🍿 Пошли в кино на «' + FILMS[film][1] + '»! Я уже в зале — заходи в 3D-город 🎬' });
    await goTo(7.5, 8.6 + 1.6); me.rotation.y = 0; play(seller, 'PickUp', { once: true }); emo(me, '🍿'); await wait(900);
    const s1 = SEATS[1 * 8 + 3], s2 = SEATS[1 * 8 + 4]; let mate = null;
    if (who !== 'solo') { mate = NPC(who === 'girl' ? { g: 'f', sh: '#ff6fa8', pa: '#2b3a55', hs: 1, hc: '#5a2a1a' } : { sh: '#2bb24c', pa: '#2b3a55', hs: 2 }, -2, 11, Math.PI); if (who === 'friend') { const t = tex((g, W, H) => { g.fillStyle = 'rgba(30,20,70,.85)'; g.beginPath(); g.roundRect(10, 6, W - 20, 64, 32); g.fill(); g.fillStyle = '#ffc65c'; g.font = '900 36px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('@' + friend, W / 2, 40) }, 512, 76); const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false })); sp.scale.set(3.6, .54, 1); sp.position.y = 4.3; mate.add(sp) } }
    await goTo(s1.x, s1.z + 1.4); me.position.set(s1.x, s1.y - 1.1, s1.z + .1); me.rotation.y = Math.PI; play(me, 'SitDown', { once: true });
    if (mate) { mate.position.set(s2.x, s2.y - 1.1, s2.z + .1); play(mate, 'SitDown', { once: true }); emo(mate, who === 'girl' ? '💕' : '👋') }
    setCam([0, 7, 9], [0, 4.5, -12]); hemi.intensity = .25; playing = true; pt0 = performance.now() / 1000;
    for (let i = 0; i < 6; i++) { await wait(3000); emo(me, ['😂', '😮', '🍿', '😍', '🤩', '👏'][i]); if (mate && i % 2) emo(mate, who === 'girl' ? ['💖', '🥰', '😘'][i % 3] : ['😂', '🔥', '👍'][i % 3]); people[i % people.length] && emo(people[i % people.length], ['😂', '😮', '👏'][i % 3]) }
    playing = false; hemi.intensity = .55; setCam(CAM.p0, CAM.l0); play(me, 'StandUp', { once: true }); if (mate) play(mate, 'StandUp', { once: true }); await wait(900); me.position.y = 0;
    if (mate) { mate.position.y = 0; emo(mate, who === 'girl' ? '💖' : '🤝') } P.toast && P.toast(j.msg); play(me, 'Victory', { once: true }); await wait(1500); if (mate) { scene.remove(mate) } me.position.set(0, 0, 11); play(me, 'Idle'); busy = false; $('bar0').classList.remove('hidden') }
}
// =================== БУРГЕРНАЯ ===================
else if (V === 'burger') {
  $('ttl').firstChild.textContent = '🍔 Бургер Город'; $('st').textContent = 'закажи у кассы и садись за стол';
  const ft = tex((g, W, H) => { for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { g.fillStyle = (i + j) % 2 ? '#f4efe4' : '#d62828'; g.fillRect(i * W / 8, j * H / 8, W / 8, H / 8) } }, 256, 256); ft.wrapS = ft.wrapT = THREE.RepeatWrapping; ft.repeat.set(4, 5);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(22, 26), new THREE.MeshStandardMaterial({ map: ft, roughness: .5 })); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; scene.add(fl);
  B(22, 6, .4, '#ffcc33', 0, 3, -13); B(.4, 6, 26, '#d62828', -11, 3, 0); B(.4, 6, 26, '#d62828', 11, 3, 0); sign('🍔 БУРГЕР ГОРОД', 12, 1.8, '#d62828', '#ffcc33', 0, 4.6, -12.75);
  // касса и меню
  B(14, 1.4, 1.6, '#d62828', 0, .7, -8); B(14.2, .15, 1.8, '#ffcc33', 0, 1.47, -8); B(14, 3, .3, '#2a2a33', 0, 2.2, -12.6);
  const mt = tex((g, W, H) => { g.fillStyle = '#1d1a2e'; g.fillRect(0, 0, W, H); g.font = '900 40px sans-serif'; g.fillStyle = '#ffcc33'; g.fillText('МЕНЮ', 30, 52); const L = [['🍔 Бургер', 40], ['🍟 Картошка', 25], ['🍗 Наггетсы', 35], ['🥤 Кола', 15], ['🍦 Мороженое', 20], ['🍱 Комбо «Город»', 90]]; g.font = '800 30px sans-serif'; L.forEach(([n, p], i) => { g.fillStyle = '#fff'; g.fillText(n, 30 + (i % 2) * 500, 110 + (i >> 1) * 52); g.fillStyle = '#5ee6b0'; g.fillText(p + ' 🪙', 330 + (i % 2) * 500, 110 + (i >> 1) * 52) }) }, 1024, 256);
  { const m = new THREE.Mesh(new THREE.PlaneGeometry(13.6, 3.4), new THREE.MeshBasicMaterial({ map: mt, toneMapped: false })); m.position.set(0, 2.3, -12.4); scene.add(m) }
  for (const x of [-3, 3]) { B(.9, .7, .6, '#333', x, 1.85, -8); B(.7, .45, .05, '#58a8ff', x, 2.05, -7.68) }
  const cashiers = [NPC({ sh: '#d62828', pa: '#1c1c1c', ac: 'cap' }, -3, -9.6, 0), NPC({ sh: '#d62828', pa: '#1c1c1c', ac: 'cap', g: 'f', hs: 1 }, 3, -9.6, 0)]; Object.assign(VW, { staff: cashiers[0], at: [-3, -9.6], front: [-3, -6.5], spawn: [1, 1], cam: [[-3, 9, 5], [-3, 1.6, -8]], items: [['burger', '🍔', 'Бургер'], ['fries', '🍟', 'Фри'], ['nuggets', '🍗', 'Наггетсы'], ['cola', '🥤', 'Кола'], ['ice', '🍦', 'Мороженое']] });
  B(3, 1.8, 1, '#888', -8, .9, -11.6); B(2.6, .1, .8, '#ffcc33', -8, 1.85, -11.6);
  // столы
  const TABLES = []; for (const [x, z] of [[-6, -1], [0, -1], [6, -1], [-6, 5], [0, 5], [6, 5]]) { C(1.3, 1.3, .12, '#ffffff', x, 1.6, z); C(.12, .12, 1.6, '#888', x, .8, z, scene, 8); for (const s of [-1, 1]) { C(.5, .5, .12, '#d62828', x + s * 1.9, 1, z); C(.08, .08, 1, '#888', x + s * 1.9, .5, z, scene, 8) } TABLES.push({ x, z }) }
  const guests = []; [[0, 1], [2, -1], [4, 1]].forEach(([ti, s], i) => { const T = TABLES[ti]; const h = NPC({ sh: ['#3a8fd8', '#ff6fa8', '#2bb24c'][i], pa: '#2b3a55', g: i === 1 ? 'f' : 'm', hs: i }, T.x + s * 1.9, T.z, s > 0 ? -Math.PI / 2 : Math.PI / 2); h.position.y = .05; play(h, 'SitDown', { once: true }); guests.push(h) });
  const MN = [['burger', '🍔', 'Бургер', 40, 'еда +25'], ['fries', '🍟', 'Картошка фри', 25, 'еда +12'], ['nuggets', '🍗', 'Наггетсы', 35, 'еда +20'], ['cola', '🥤', 'Кола', 15, 'еда +5 · веселье +5'], ['ice', '🍦', 'Мороженое', 20, 'веселье +8'], ['combo', '🍱', 'Комбо «Город»', 90, 'еда +45 · веселье +10']];
  const Q = {};
  $('bar0').innerHTML = `<button class="sec b" id="ord">🧾 Заказать еду<small>у кассы</small></button>`;
  const draw = () => { const tot = MN.reduce((a, m) => a + (Q[m[0]] || 0) * m[3], 0); openP(`<h2>🍔 Меню</h2>${MN.map(m => `<div class="mi">${m[1]} <b>${m[2]}<br><small style="color:var(--dim)">${m[4]}</small></b><span style="color:var(--mint)">${m[3]} 🪙</span><span class="q"><button data-m="${m[0]}" data-d="-1">−</button>${Q[m[0]] || 0}<button data-m="${m[0]}" data-d="1">+</button></span></div>`).join('')}<button class="go1" id="go">${tot ? '✅ Заказать за ' + tot + ' 🪙' : 'Выбери, что хочешь'}</button><button class="go2" id="px">Закрыть</button>`);
    panel.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { const k = b.dataset.m, c = Math.max(0, Math.min(3, (Q[k] || 0) + +b.dataset.d)); Q[k] = c; HAP('light'); draw() }); $('px').onclick = closeP; $('go').onclick = () => { if (tot) order() } };
  $('ord').onclick = draw;
  async function order() { if (busy) return; const items = []; for (const k in Q) for (let i = 0; i < Q[k]; i++) items.push(k); if (!items.length) return; busy = true; closeP(); $('bar0').classList.add('hidden');
    await goTo(-3, -6.4); me.rotation.y = Math.PI; play(cashiers[0], 'PickUp', { once: true }); emo(cashiers[0], '🧾'); await wait(1200);
    const j = await P.call('venue', { a: 'eat', items }); if (!j || !j.me) { busy = false; $('bar0').classList.remove('hidden'); return } coins();
    const tray = new THREE.Group(); B(1.2, .06, .8, '#c0392b', 0, 0, 0, tray); items.slice(0, 4).forEach((k, i) => { const e = MN.find(m => m[0] === k)[1]; const t = tex((x, W, H) => { x.font = '90px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(e, W / 2, H / 2) }, 128, 128); const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t })); s.scale.set(.6, .6, 1); s.position.set(-.35 + (i % 2) * .7, .3, -.2 + (i >> 1) * .4); tray.add(s) }); tray.position.set(0, 2.2, .8); me.add(tray); play(me, 'Walk_Carry');
    const T = TABLES[1]; await goTo(T.x - 1.9, T.z + .01); me.remove(tray); tray.position.set(T.x - .5, 1.72, T.z); scene.add(tray); me.rotation.y = Math.PI / 2; me.position.y = .05; play(me, 'SitDown', { once: true }); setCam([T.x + 6, 8, T.z + 9], [T.x, 1.5, T.z]);
    for (let i = 0; i < 5; i++) { await wait(1200); emo(me, ['😋', '🍔', '😍', '🤤', '👍'][i]); if (i === 2) tray.children.forEach((c, k) => { if (k > 0 && k % 2) c.visible = false }) }
    scene.remove(tray); play(me, 'StandUp', { once: true }); setCam(CAM.p0, CAM.l0); await wait(900); me.position.y = 0; P.toast && P.toast(j.msg); for (const k in Q) Q[k] = 0; await goTo(0, 11); me.rotation.y = Math.PI; play(me, 'Idle'); busy = false; $('bar0').classList.remove('hidden') }
  tick = t => { };
}

// =================== ТЦ: БУТИК + СУПЕРМАРКЕТ ===================
if (V === 'mall') {
  $('ttl').firstChild.textContent = '🛍 ТЦ «Город»'; $('st').textContent = 'одежда · продукты · подарки';
  { const ft = tex((g, W, H) => { for (let i = 0; i < 16; i++) for (let j = 0; j < 16; j++) { g.fillStyle = (i + j) % 2 ? '#efeaf6' : '#e2dcef'; g.fillRect(i * W / 16, j * H / 16, W / 16, H / 16) } }, 512, 512); const fl = new THREE.Mesh(new THREE.PlaneGeometry(26, 26), new THREE.MeshStandardMaterial({ map: ft, roughness: .35 })); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; scene.add(fl) }
  B(26, 7, .4, '#f6f1ff', 0, 3.5, -13); B(.4, 7, 26, '#ffe3ef', -13, 3.5, 0); B(.4, 7, 26, '#e3f6ea', 13, 3.5, 0); B(.3, 3, 12, '#d9d0ee', 0, 1.5, -7);
  // --- бутик
  B(12, .06, 12, '#ffd0e2', -6.5, .03, -6); sign('👕 БУТИК «СТИЛЬ»', 9, 1.4, '#ff6fa8', '#fff', -6.5, 5.2, -12.75);
  for (const z of [-10, -6.5, -3]) { C(.06, .06, 5, '#c0c0c8', -9.5, 2.6, z).rotation.z = Math.PI / 2; for (const x of [-11.5, -11, -10.5]) { C(.05, .05, 2.6, '#c0c0c8', x === -11 ? -12 : x === -10.5 ? -7 : -12, 1.3, z) } for (let i = 0; i < 8; i++) B(.5, 1.3, .08, ['#e8433a', '#3a8fd8', '#2bb24c', '#f2c230', '#8a4dff', '#ff6fa8', '#222', '#fff'][(i + z * 3 | 0) & 7], -11.8 + i * .6, 1.9, z).rotation.y = Math.PI / 2 }
  const mirror = mk(new THREE.PlaneGeometry(3, 4.6), new THREE.MeshStandardMaterial({ color: '#cfe8ff', metalness: .9, roughness: .08 }), -12.75, 2.6, 3); mirror.rotation.y = Math.PI / 2; B(.2, 5, 3.4, '#b9a46a', -12.85, 2.6, 3);
  B(2.4, 4, 2.4, '#8a4dff', -11.5, 2, 8.5); B(.06, 3.4, 2, '#ff6fa8', -10.27, 1.9, 8.5);
  const mann = [[{ ac: 'cowboy', bk: 'backpack', sh: '#e8433a' }, -4, -11], [{ ac: 'tophat', ot: 'classic', g: 'f', hs: 1 }, -7, -11], [{ ac: 'headphones', fc: 'sunglasses', sh: '#3a8fd8' }, -10, -11]].map(([lk, x, z]) => { C(.9, .9, .3, '#fff', x, .15, z); const h = NPC({ sk: '#f0f0f0', hc: '#f0f0f0', pa: '#2b3a55', ...lk }, x, z, 0); h.position.y = .3; return h });
  const shopGirl = NPC({ sh: '#ff6fa8', pa: '#2b3a55', g: 'f', hs: 1 }, -4, -2, Math.PI / 2);
  // --- супермаркет
  sign('🛒 СУПЕРМАРКЕТ', 9, 1.4, '#2bb24c', '#fff', 6.5, 5.2, -12.75);
  const PC = ['#e8433a', '#f2c230', '#3a8fd8', '#2bb24c', '#ff8a3a', '#8a4dff', '#fff', '#a0522d'];
  const SH = []; for (const z of [-9, -5, -1]) { B(8, 2.6, .2, '#f4f4f8', 7, 1.3, z - .5); for (const x of [3, 11]) B(.15, 2.6, 1.2, '#e0e0e8', x, 1.3, z); for (const y of [.7, 1.5, 2.3]) { B(8, .06, 1.2, '#d0d0d8', 7, y - .3, z); for (let i = 0; i < 13; i++) B(.42, .5, .42, PC[(i * 3 + (y * 10 | 0) + (z | 0)) & 7], 3.5 + i * .58, y, z + .1) } SH.push([5, z + 1.6], [9, z + 1.6]) }
  for (let i = 0; i < 4; i++) { B(2.2, 3.6, 1.2, '#dfe8f0', 3.5 + i * 2.4, 1.8, -12.2); const gl = mk(new THREE.PlaneGeometry(1.9, 3), new THREE.MeshStandardMaterial({ color: '#9fd8ff', emissive: '#5ab0ff', emissiveIntensity: .35, transparent: true, opacity: .7 }), 3.5 + i * 2.4, 1.9, -11.58) }
  B(3, .9, 1.6, '#a0522d', 11, .45, 4); for (let i = 0; i < 10; i++) mk(new THREE.SphereGeometry(.25, 10, 8), ['#e8433a', '#f2c230', '#2bb24c', '#ff8a3a'][i & 3], 9.9 + (i % 5) * .55, 1.15, 3.6 + (i > 4 ? .7 : 0));
  B(4, 1.2, 1.4, '#2bb24c', 8, .6, 8); B(4.2, .1, 1.6, '#fff', 8, 1.25, 8); B(.8, .5, .5, '#333', 7, 1.55, 8); const cashier = NPC({ sh: '#2bb24c', pa: '#1c1c1c', ac: 'cap', g: 'f', hs: 1 }, 8, 9.6, Math.PI);
  sign('КАССА', 2.4, .6, '#fff', '#2bb24c', 8, 2.6, 8.72);
  const cart = new THREE.Group(); B(1.1, .7, .8, '#c0c8d8', 0, 1.1, 0, cart); B(1.1, .06, .8, '#8890a0', 0, .7, 0, cart); for (const [x, z] of [[-.45, -.3], [.45, -.3], [-.45, .3], [.45, .3]]) C(.1, .1, .1, '#333', x, .1, z, cart, 8); C(.04, .04, 1.2, '#8890a0', 0, 1.5, .45, cart).rotation.z = Math.PI / 2; cart.position.set(0, 0, 1.3);
  let WC = {}, GR = {}, BAG = {};
  const reMe = () => { const p = me.position.clone(), r = me.rotation.y, kids = me.children.filter(c => c.isSprite); scene.remove(me); dispose(me); me = makeHero(myLook()); me.position.copy(p); me.rotation.y = r; kids.forEach(k => me.add(k)); scene.add(me); play(me, 'Idle') };
  (async () => { const [r, m] = await Promise.all([P.call('rels'), P.call('mall', { a: 'bag' })]); WC = (r && r.wearc) || {}; GR = (m && m.groc) || {}; BAG = (m && m.bag) || {} })();
  $('bar0').innerHTML = `<button class="sec b" id="vmw" style="font-size:13px;padding:12px 2px">👕 Одежда<small>бутик</small></button><button class="sec b" id="vmg" style="font-size:13px;padding:12px 2px">🛒 Продукты<small>супермаркет</small></button><button class="sec b" id="vmb" style="font-size:13px;padding:12px 2px">🧺 Сумка<small>покупки</small></button><button class="sec b" id="vmp" style="font-size:13px;padding:12px 2px">🎁 Другу<small>подарок</small></button>`;
  const clothes = () => { const own = new Set([...((ME().life || {}).wear || []), 'cap', 'glasses', 'casual']); const L = Object.entries(WC).filter(([k, w]) => w[3] > 0 || w[4]);
    openP(`<h2>👕 Бутик «Стиль»</h2><p style="color:var(--dim)">Купленное сразу надевается. ⭐ — уникальные вещи за Stars</p><div class="wk" style="grid-template-columns:repeat(4,1fr);max-height:46vh;overflow:auto">${L.map(([k, w]) => `<button data-w="${k}" style="font-size:24px!important;${own.has(k) ? 'opacity:.5' : ''}">${w[0]}<small>${w[1]}</small><small style="color:${w[4] ? '#ffd34d' : 'var(--mint)'}">${own.has(k) ? '✅ есть' : w[4] ? '⭐ ' + w[4] : w[3] + ' 🪙'}</small></button>`).join('')}</div><button class="go2" id="px">Закрыть</button>`);
    $('px').onclick = closeP; panel.querySelectorAll('[data-w]').forEach(b => b.onclick = async () => { const k = b.dataset.w, w = WC[k]; if (own.has(k)) { P.toast && P.toast('Уже есть — надеть можно дома в «Образе»'); return } if (w[4]) { P.buy && P.buy('w_' + k); return } if (busy) return; busy = true; closeP(); $('bar0').classList.add('hidden');
      await goTo(-9.5, -8.2); me.rotation.y = Math.PI; play(me, 'PickUp', { once: true }); await wait(900); const j = await P.call('wear/buy', { k }); if (!j || !j.me) { busy = false; $('bar0').classList.remove('hidden'); return } coins();
      await goTo(-10.8, 3); me.rotation.y = -Math.PI / 2; setCam([-4, 5, 3], [-11, 2.4, 3]); reMe(); emo(me, '✨'); play(me, 'Victory', { once: true }); await wait(2200); emo(me, w[0]); P.toast && P.toast(j.msg); await wait(1200); setCam(CAM.p0, CAM.l0); busy = false; $('bar0').classList.remove('hidden') }) };
  const Q = {}; const groc = () => { const tot = Object.entries(Q).reduce((a, [k, c]) => a + c * (GR[k] ? GR[k][2] : 0), 0), n = Object.values(Q).reduce((a, c) => a + c, 0);
    openP(`<h2>🛒 Супермаркет</h2><p style="color:var(--dim)">Покупки кладутся в 🧺 сумку — используй когда захочешь или подари другу</p><div style="max-height:44vh;overflow:auto">${Object.entries(GR).map(([k, g]) => `<div class="mi">${g[0]} <b>${g[1]}<br><small style="color:var(--dim)">${Object.entries(g[3]).map(([q, v]) => ({ food: 'еда', sleep: 'бодрость', fun: 'веселье', soc: 'общение', hyg: 'чистота' })[q] + ' +' + v).join(' · ')}</small></b><span style="color:var(--mint)">${g[2]} 🪙</span><span class="q"><button data-m="${k}" data-d="-1">−</button>${Q[k] || 0}<button data-m="${k}" data-d="1">+</button></span></div>`).join('')}</div><button class="go1" id="go">${n ? '🛒 Купить ' + n + ' шт. за ' + tot + ' 🪙' : 'Положи продукты в тележку'}</button><button class="go2" id="px">Закрыть</button>`);
    panel.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { const k = b.dataset.m; const c = Math.max(0, Math.min(9, (Q[k] || 0) + +b.dataset.d)); if (c + Object.values(Q).reduce((a, x) => a + x, 0) - (Q[k] || 0) > 20) return; Q[k] = c; HAP('light'); groc() }); $('px').onclick = closeP; $('go').onclick = () => { if (n) shop() } };
  async function shop() { if (busy) return; const items = []; for (const k in Q) for (let i = 0; i < Q[k]; i++) items.push(k); busy = true; closeP(); $('bar0').classList.add('hidden'); me.add(cart); play(me, 'Walk_Carry'); setCam([7, 14, 14], [7, 0, -3]);
    const stops = SH.slice().sort(() => Math.random() - .5).slice(0, Math.min(3, Math.max(1, Math.ceil(items.length / 3)))); const ks = [...new Set(items)];
    for (let i = 0; i < stops.length; i++) { await goTo(...stops[i]); me.rotation.y = Math.PI; emo(me, GR[ks[i % ks.length]][0]); await wait(700) }
    await goTo(8, 6.4); me.rotation.y = 0; emo(cashier, '🧾'); play(cashier, 'PickUp', { once: true }); await wait(1100);
    const j = await P.call('mall', { a: 'buy', items }); me.remove(cart); play(me, 'Idle'); if (j && j.bag) { BAG = j.bag; coins(); emo(me, '😊'); P.toast && P.toast(j.msg); for (const k in Q) Q[k] = 0 } setCam(CAM.p0, CAM.l0); await goTo(0, 11); me.rotation.y = Math.PI; busy = false; $('bar0').classList.remove('hidden') }
  const bag = () => { const E = Object.entries(BAG); openP(`<h2>🧺 Моя сумка</h2>${E.length ? `<div style="max-height:46vh;overflow:auto">${E.map(([k, c]) => `<div class="mi">${GR[k] ? GR[k][0] : '🎁'} <b>${GR[k] ? GR[k][1] : k}<br><small style="color:var(--dim)">×${c}</small></b><span class="q"><button data-u="${k}" style="width:auto!important;padding:6px 10px!important">Использовать</button></span></div>`).join('')}</div>` : '<p>Пусто. Купи что-нибудь в супермаркете 🛒</p>'}<button class="go1" id="gf">🎁 Подарить другу</button><button class="go2" id="px">Закрыть</button>`);
    $('px').onclick = closeP; $('gf').onclick = () => { closeP(); P.openGift && P.openGift() }; panel.querySelectorAll('[data-u]').forEach(b => b.onclick = async () => { const j = await P.call('mall', { a: 'use', k: b.dataset.u }); if (j && j.bag) { BAG = j.bag; emo(me, GR[b.dataset.u][0]); play(me, 'PickUp', { once: true }); P.toast && P.toast(j.msg); bag() } }) };
  $('vmw').onclick = clothes; $('vmg').onclick = groc; $('vmb').onclick = bag; $('vmp').onclick = () => P.openGift && P.openGift();
  tick = t => { mann.forEach((h, i) => h.rotation.y = Math.sin(t * .4 + i) * .5) };
}
CAM.p0 = CAM.p.toArray(); CAM.l0 = CAM.l.toArray();

// =================== РАБОТА (кассир / бармен) ===================

// =================== МУЗЕЙ ===================
if (V === 'museum') {
  $('ttl').firstChild.textContent = '🏛 Музей города'; $('st').textContent = 'находки с раскопок';
  { const ft = tex((g, W, H) => { for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { g.fillStyle = (i + j) % 2 ? '#e9e4da' : '#d8d0c2'; g.fillRect(i * W / 8, j * H / 8, W / 8, H / 8) } }, 512, 512); ft.wrapS = ft.wrapT = THREE.RepeatWrapping; ft.repeat.set(2, 2); const fl = new THREE.Mesh(new THREE.PlaneGeometry(26, 26), new THREE.MeshStandardMaterial({ map: ft, roughness: .25 })); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; scene.add(fl) }
  B(26, 8, .4, '#f3ead8', 0, 4, -13); B(.4, 8, 26, '#efe4cf', -13, 4, 0); B(.4, 8, 26, '#efe4cf', 13, 4, 0); B(26, .5, .5, '#b9975b', 0, 7.8, -12.8);
  for (const x of [-9, -3, 3, 9]) { C(.45, .5, 8, '#f7f2e8', x, 4, -12.2); B(1.3, .4, 1.3, '#d9cdb6', x, .2, -12.2) }
  sign('🏛 МУЗЕЙ ГОРОДА', 9, 1.4, '#7a5a2a', '#ffe9b0', 0, 6.2, -12.75);
  B(5, 1.1, 1.6, '#7a5a2a', 0, .55, -7.4); B(5.2, .1, 1.8, '#b9975b', 0, 1.12, -7.4);
  const cur = NPC({ sh: '#2b3a55', pa: '#1c1c1c', ac: 'glasses', g: 'f', hs: 1 }, 0, -8.9, 0);
  sign('ХРАНИТЕЛЬ', 2.6, .6, '#7a5a2a', '#ffe9b0', 0, 2.3, -6.55);
  // центр — скелет динозавра
  { const g = new THREE.Group(); g.position.set(0, 0, 1.5); scene.add(g); B(7, .4, 4, '#cbbd9f', 0, .2, 0, g); const bm = '#f2ead6'; B(3.4, .5, .6, bm, 0, 2.6, 0, g); for (let i = 0; i < 6; i++) B(.15, 1, .9, bm, -1.4 + i * .55, 2.3, 0, g); C(.12, .12, 2.2, bm, -1.2, 1.3, .3, g, 6); C(.12, .12, 2.2, bm, 1.2, 1.3, .3, g, 6); C(.12, .12, 2.2, bm, -1.2, 1.3, -.3, g, 6); C(.12, .12, 2.2, bm, 1.2, 1.3, -.3, g, 6); B(1.2, .9, .8, bm, 2.4, 3.2, 0, g); B(2.6, .3, .3, bm, -3, 2.4, 0, g).rotation.z = .3; sign('🦖 ТИРАННОЗАВР', 3.6, .7, '#7a5a2a', '#ffe9b0', 0, .55, 2.05, g) }
  const CASES = []; const POS = [[-10.5, -8], [-10.5, -4], [-10.5, 0], [-10.5, 4], [-10.5, 8], [10.5, -8], [10.5, -4], [10.5, 0], [10.5, 4], [10.5, 8]];
  POS.forEach(([x, z]) => { B(1.6, 1.4, 1.6, '#7a5a2a', x, .7, z); const gl = mk(new THREE.BoxGeometry(1.5, 1.5, 1.5), new THREE.MeshStandardMaterial({ color: '#cfeaff', transparent: true, opacity: .25, roughness: .05 }), x, 2.15, z); const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex((g, W, H) => { }, 128, 128) })); sp.position.set(x, 2.15, z); sp.scale.set(1.2, 1.2, 1); scene.add(sp); CASES.push(sp) });
  let D = {};
  const draw = () => { const AR = D.ARTS || {}, ar = D.arts || {}; Object.entries(AR).forEach(([k, a], i) => { const sp = CASES[i]; if (!sp) return; const own = !!ar[k]; sp.material.map = tex((g, W, H) => { g.font = '96px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.globalAlpha = own ? 1 : .35; g.fillText(own ? a[0] : '❓', W / 2, H / 2 + 6) }, 128, 128); sp.material.needsUpdate = true }) };
  const load = async (a = { a: 'info' }) => { const j = await P.call('dig', a); if (j && j.dig) { D = j.dig; draw(); coins() } return j };
  load();
  $('bar0').innerHTML = `<button class="sec b" id="mu1" style="font-size:13px;padding:12px 2px">🏛 Коллекция<small>сдать находки</small></button><button class="sec b" id="mu2" style="font-size:13px;padding:12px 2px">🎧 Экскурсия<small>раз в день</small></button><button class="sec b" id="mu3" style="font-size:13px;padding:12px 2px">⛏ Раскопки<small>как играть</small></button>`;
  const coll = () => { const AR = D.ARTS || {}, ar = D.arts || {}, n = Object.keys(ar).length, dup = Object.entries(ar).reduce((s, [k, c]) => s + (c > 1 && AR[k] ? (c - 1) * AR[k][3] : 0), 0);
    openP(`<h2>🏛 Коллекция: ${n}/10</h2><p style="color:var(--dim)">Хранитель выставит твои находки в витринах. Дубликаты музей покупает.</p><div style="max-height:40vh;overflow:auto">${Object.entries(AR).map(([k, a]) => `<div class="mi">${ar[k] ? a[0] : '❓'} <b>${ar[k] ? a[1] : 'Ещё не найден'}<br><small style="color:var(--dim)">${ar[k] ? '×' + ar[k] + ' · музей платит ' + a[3] + ' 🪙 за дубликат' : 'ищи на раскопках'}</small></b></div>`).join('')}</div><p id="mh" style="color:#ffd34d;font-weight:700;min-height:1.2em;margin:8px 0 0;text-align:center"></p><button class="go1" id="ms1" style="${dup ? '' : 'opacity:.5'}">🏛 Продать дубликаты${dup ? ' · +' + dup.toLocaleString('ru') + ' 🪙' : ''}</button><button class="go1" id="ms2" style="${n < 10 || D.done ? 'opacity:.5' : ''}">${D.done ? '✅ Коллекция сдана' : '🏆 Сдать коллекцию · 15 000 🪙 + титул'}</button><button class="go2" id="px">Закрыть</button>`);
    $('px').onclick = closeP; const hint = m => { const h = $('mh'); h.textContent = m; h.animate([{ transform: 'scale(1.15)' }, { transform: 'scale(1)' }], 300); emo(cur, '🤔') }; $('ms1').onclick = async () => { if (!dup) return hint('Пока нет дубликатов — у каждой находки ×1. Копай ещё, повторки музей купит.'); if (busy) return; busy = true; closeP(); await goTo(0, -5.2); me.rotation.y = Math.PI; emo(cur, '🧐'); play(cur, 'PickUp', { once: true }); await wait(1200); await load({ a: 'sell' }); emo(me, '💰'); busy = false; coll() }; $('ms2').onclick = async () => { if (D.done) return hint('Коллекция уже сдана ✅'); if (n < 10) return hint(`Нужны все 10 находок — у тебя ${n}/10. Не хватает ${10 - n}.`); closeP(); await load({ a: 'set' }); emo(cur, '🏆'); play(me, 'Victory', { once: true }) } };
  const tour = async () => { if (busy) return; const j = await P.call('dig', { a: 'tour' }); if (!j || !j.dig) return; busy = true; closeP(); $('bar0').classList.add('hidden'); emo(cur, '🎧'); for (const [x, z] of [POS[0], POS[2], POS[4], [0, 4.5], POS[9], POS[7], POS[5]]) { await goTo(x + (x < 0 ? 1.8 : -1.8), z); me.rotation.y = x < 0 ? -Math.PI / 2 : Math.PI / 2; emo(me, ['😮', '🤩', '👀'][Math.floor(Math.random() * 3)]); await wait(700) } await goTo(0, 11); me.rotation.y = Math.PI; busy = false; $('bar0').classList.remove('hidden'); coins() };
  { const Q = (ME().quest || null); if (Q && Q.q === 1) { $('bar0').insertAdjacentHTML('afterbegin', `<button class="sec b" id="mu4" style="font-size:13px;padding:12px 2px;background:linear-gradient(#ffd34d,#f2a23a);color:#3b2300">🗝 Записка мэра<small>спросить</small></button>`); $('mu4').onclick = async () => { if (busy) return; busy = true; await goTo(0, -5.2); me.rotation.y = Math.PI; emo(cur, '🤔'); play(cur, 'PickUp', { once: true }); await wait(1400); const j = await P.call('quest', { a: 'step', s: 'qmus' }); emo(cur, '🗝'); busy = false; if (j && j.msg) $('mu4').remove() } } }
  $('mu1').onclick = coll; $('mu2').onclick = tour; $('mu3').onclick = () => openP(`<h2>⛏ Как найти экспонаты</h2><p>1. Купи 🪏 лопату: Магазин → ⛏ Раскопки.</p><p>2. В городе ищи жёлтые крестики на земле — это места раскопок, каждый день новые.</p><p>3. Копай: монеты, сундуки и 10 древних артефактов.</p><p>4. Неси находки сюда — хранитель поставит их в витрины, а за полную коллекцию даст 15 000 🪙 и титул 🏺 Археолог.</p><button class="go2" id="px">Понятно</button>`) || ($('px').onclick = closeP);
  Object.assign(VW, { staff: cur, at: [0, -8.9], front: [0, -5.6], spawn: [0, 10], cam: [[0, 8.5, 5], [0, 1.6, -7.5]], items: [['amph', '🏺', 'Амфора'], ['bone', '🦴', 'Кость'], ['ring', '💍', 'Кольцо'], ['dagger', '🗡', 'Кинжал'], ['crown', '👑', 'Корона']] });
}
if (V === 'library') {
  $('ttl').firstChild.textContent = '📚 Библиотека'; hemi.intensity = 1.7; scene.background = new THREE.Color('#2a1c14'); $('st').textContent = 'читай и прокачивай знания';
  { const ft = tex((g, W, H) => { for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? '#b07a4a' : '#c08a58'; g.fillRect(0, i * H / 16, W, H / 16) } }, 256, 256); ft.wrapS = ft.wrapT = THREE.RepeatWrapping; ft.repeat.set(3, 3); const fl = new THREE.Mesh(new THREE.PlaneGeometry(26, 26), new THREE.MeshStandardMaterial({ map: ft, roughness: .6 })); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; scene.add(fl) }
  B(26, 8, .4, '#d9c39a', 0, 4, -13); B(.4, 8, 26, '#cfb88e', -13, 4, 0); B(.4, 8, 26, '#cfb88e', 13, 4, 0); B(9, .05, 6, '#8a2a2a', 0, .03, 4);
  const BC = ['#c0392b', '#2e86c1', '#27ae60', '#f1c40f', '#8e44ad', '#e67e22', '#ecf0f1', '#16a085'];
  const shelf = (x, z, ry) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g); B(4.6, 5, 1, '#4a2e1c', 0, 2.5, 0, g); for (let r = 0; r < 4; r++) { B(4.4, .12, .9, '#6b4428', 0, .5 + r * 1.2, .05, g); let bx = -2; while (bx < 1.9) { const w = .14 + Math.random() * .16, h = .6 + Math.random() * .35; B(w, h, .6, BC[Math.floor(Math.random() * BC.length)], bx + w / 2, .56 + r * 1.2 + h / 2, .15, g); bx += w + .02 } } };
  const SH = [[-10, -12.2, 0], [-5, -12.2, 0], [5, -12.2, 0], [10, -12.2, 0], [-12.2, -6, Math.PI / 2], [-12.2, -1, Math.PI / 2], [12.2, -6, -Math.PI / 2], [12.2, -1, -Math.PI / 2]]; SH.forEach(a => shelf(...a));
  sign('📚 БИБЛИОТЕКА · ТИШИНА!', 12, 1.3, '#3a2416', '#ffe2a0', 0, 6.4, -12.75);
  const TB = [[-6, 4], [6, 4], [-6, 8.5], [6, 8.5]]; TB.forEach(([x, z]) => { B(3.6, .15, 2, '#7a4a2a', x, 1.3, z); for (const dx of [-1.5, 1.5]) for (const dz of [-.8, .8]) B(.15, 1.3, .15, '#4a2e1c', x + dx, .65, z + dz); const lp = C(.06, .06, .8, '#c9a227', x + 1.2, 1.75, z - .5); const sh2 = C(.15, .35, .35, '#2e7d32', x + 1.2, 2.2, z - .5); const L2 = new THREE.PointLight('#ffd27a', 2, 5); L2.position.set(x + 1.2, 2, z - .5); scene.add(L2); for (const dx of [-1, 1]) { B(.9, .1, .9, '#5a3420', x + dx, .75, z + 1.5); B(.9, 1, .1, '#5a3420', x + dx, 1.25, z + 1.95) } });
  B(5, 1.1, 1.6, '#5a3420', 0, .55, -7.2); B(5.2, .1, 1.8, '#7a4a2a', 0, 1.12, -7.2);
  const lib = NPC({ sh: '#4a3a5a', pa: '#2a2a2a', ac: 'glasses', g: 'f', hc: '#9a9a9a', hs: 1, sk: '#e8c4a0' }, 0, -8.6, 0);
  sign('БИБЛИОТЕКАРЬ', 2.8, .6, '#3a2416', '#ffe2a0', 0, 2.3, -6.35);
  const SUB = { hist: ['📜', 'История'], sci: ['🔬', 'Наука'], geo: ['🌍', 'География'], art: ['🎨', 'Искусство'], tech: ['💻', 'Технологии'], cook: ['🍳', 'Кулинария'], sport: ['⚽', 'Спорт'], lang: ['🗣', 'Языки'] };
  const ANG = ['Тсс! Здесь читают! 🤫', 'Не шуми! 😠', 'Руки чистые? Книги дорогие! 😤', 'Положи на место, где взял! 😾', 'Ещё звук — выгоню! 😡', 'Не загибай страницы! 🙄'];
  let K = {}; const load = async (a = { a: 'info' }) => { const j = await P.call('lib', a); if (j && j.lib) K = j.lib; coins(); return j };
  load();
  const scold = () => { const t = ANG[Math.floor(Math.random() * ANG.length)]; emo(lib, '😠'); play(lib, 'Punch', { once: true }); P.toast && P.toast('👵 Библиотекарша: «' + t + '»'); setTimeout(() => play(lib, 'Idle'), 1200) };
  setInterval(() => { if (Math.random() < .35) { emo(lib, ['🤫', '😒', '👀', '😤'][Math.floor(Math.random() * 4)]) } }, 6000);
  const pick = () => { const lv = k => Math.floor(Math.sqrt((K.xp?.[k] || 0) / 10)); openP(`<h2>📚 Что почитать?</h2><p style="color:var(--dim)">Сегодня прочитано ${K.n || 0}/12 · всего знаний: ${K.tot || 0} ур.</p><div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">${Object.entries(SUB).map(([k, s]) => `<button class="sec b" data-s="${k}" style="font-size:13px;padding:10px 4px">${s[0]} ${s[1]}<small>ур. ${lv(k)} · ${K.xp?.[k] || 0} оп.</small></button>`).join('')}</div><button class="go2" id="px">Закрыть</button>`); $('px').onclick = closeP; panel.querySelectorAll('[data-s]').forEach(b => b.onclick = () => read(b.dataset.s)) };
  const read = async k => { if (busy) return; if ((K.n || 0) >= 12) { closeP(); scold(); P.toast && P.toast('👵 «На сегодня хватит, глаза испортишь! Приходи завтра»'); return } busy = true; closeP(); $('bar0').classList.add('hidden');
    const sh = SH[Math.floor(Math.random() * 4)]; await goTo(sh[0], sh[1] + 1.6); me.rotation.y = Math.PI; play(me, 'PickUp', { once: true }); emo(me, SUB[k][0]); await wait(900);
    const [tx, tz] = TB[Math.floor(Math.random() * TB.length)], sx = tx + (Math.random() < .5 ? -1 : 1); await goTo(sx, tz + 1.5); me.rotation.y = Math.PI; me.position.y = .25; play(me, 'SitDown', { once: true }); emo(me, '📖');
    let noisy = false; for (let i = 0; i < 4; i++) { await wait(1500); emo(me, ['📖', '🤔', '💡', '😮'][i]); if (!noisy && Math.random() < .2) { noisy = true; scold() } }
    const j = await load({ a: 'read', s: k }); me.position.y = 0; play(me, 'Idle'); if (j && j.lib && j.up) { emo(me, '🎓'); play(me, 'Victory', { once: true }) } busy = false; $('bar0').classList.remove('hidden') };
  $('bar0').innerHTML = `<button class="sec b" id="lb1" style="font-size:13px;padding:12px 2px">📖 Читать<small>выбрать книгу</small></button><button class="sec b" id="lb2" style="font-size:13px;padding:12px 2px">🎓 Мои знания<small>уровни</small></button><button class="sec b" id="lb3" style="font-size:13px;padding:12px 2px">🙋 Спросить<small>библиотекаршу</small></button>`;
  $('lb1').onclick = pick;
  $('lb2').onclick = () => { const lv = k => Math.floor(Math.sqrt((K.xp?.[k] || 0) / 10)); openP(`<h2>🎓 Мои знания · ${K.tot || 0} ур.</h2>${Object.entries(SUB).map(([k, s]) => { const x = K.xp?.[k] || 0, l = lv(k), a = 10 * l * l, b = 10 * (l + 1) * (l + 1); return `<div class="mi">${s[0]} <b>${s[1]} · ур. ${l}<br><small style="color:var(--dim)">${x} / ${b} опыта</small></b></div>` }).join('')}<p style="color:var(--dim)">Каждые 5 уровней знаний — +1% к доходу дома (до +20%).</p><button class="go2" id="px">Закрыть</button>`); $('px').onclick = closeP };
  $('lb3').onclick = async () => { if (busy) return; busy = true; await goTo(0, -4.8); me.rotation.y = Math.PI; await wait(300); scold(); busy = false };
  Object.assign(VW, { staff: lib, at: [0, -8.6], front: [0, -5.4], spawn: [0, 10], cam: [[0, 8.5, 5], [0, 1.6, -7.5]], items: [] });
}
if (WK) {
  $('ttl').firstChild.textContent = V === 'museum' ? '🧑‍🏫 Работа в музее' : V === 'cinema' ? '🍿 Работа в кинотеатре' : '👨‍🍳 Работа в «Бургер Город»';
  const IT = k => VW.items.find(i => i[0] === k);
  const walkers = []; const oldTick = tick; let lt = 0;
  tick = t => { oldTick(t); const dt = lt ? Math.min(.05, t - lt) : 0; lt = t; for (let i = walkers.length - 1; i >= 0; i--) { const w = walkers[i], d = new THREE.Vector3(w.to[0] - w.h.position.x, 0, w.to[1] - w.h.position.z), L = d.length(); if (L < .15) { walk(w.h, t, false); walkers.splice(i, 1); w.done && w.done(); continue } w.h.position.addScaledVector(d.normalize(), Math.min(L, 8 * dt)); w.h.rotation.y = Math.atan2(d.x, d.z); walk(w.h, t, true) } };
  const mvNPC = (h, to) => new Promise(r => walkers.push({ h, to, done: r }));
  const orderSprite = (h, o) => { const t = tex((g, W, H) => { g.fillStyle = '#fff'; g.beginPath(); g.roundRect(4, 4, W - 8, H - 8, 40); g.fill(); g.font = '80px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(o.map(k => IT(k)[1]).join(''), W / 2, H / 2 + 4) }, 512, 128); const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false })); sp.scale.set(4, 1, 1); sp.position.set(0, 4.6, 0); sp.renderOrder = 7; h.add(sp); return sp };
  let JOB = null;
  const plan = () => { const J = JOB; if (!J) return; openP(`<h2>${V === 'museum' ? '🧑‍🏫 Работа экскурсоводом' : V === 'cinema' ? '🍿 Работа в кинотеатре' : '👨‍🍳 Работа в бургерной'}</h2><p>${V === 'museum' ? 'Встаёшь за стойку хранителя. Посетители просят показать экспонаты — над головой видно, какие. Выбери нужные и покажи.' : 'Встаёшь за кассу. Гости подходят с заказом над головой — собери его на поднос и отдай.'} Смена 60 секунд, 4 смены в день.</p><p>Должность: <b style="color:var(--win)">${J.name}</b> · оплата ×${J.mul}</p>${J.next ? `<div class="bar"><i style="width:${Math.round(J.x / J.next * 100)}%"></i></div><p style="color:var(--dim)">До повышения: ${J.next - J.x} заказов</p>` : '<p>🏆 Ты на вершине карьеры!</p>'}<p style="font-size:13px;color:var(--dim)">Карьера: ${J.ranks.map((r, i) => (i === J.r ? '<b style="color:var(--mint)">' + r[0] + '</b>' : r[0]) + ' ×' + r[2]).join(' → ')}</p><button class="go1" id="ws" ${J.left < 1 ? 'disabled' : ''}>${J.left < 1 ? 'Смены кончились — завтра' : '▶ Начать смену · осталось ' + J.left}</button><button class="go2" id="px">Закрыть</button>`); $('px').onclick = closeP; const b = $('ws'); if (b && J.left > 0) b.onclick = start };
  const bar = () => { $('bar0').innerHTML = `<button class="sec b" id="wp">💼 Смена<small>${JOB ? JOB.name + ' · смен: ' + JOB.left : 'загрузка…'}</small></button>`; $('wp').onclick = plan };
  (async () => { const j = await P.call('venue', { a: 'wjob', k: V }); JOB = j && j.job; bar(); plan() })();
  bar();
  async function start() { if (busy) return; const j = await P.call('venue', { a: 'wstart', k: V }); if (!j || !j.ok) return; JOB = j.job || JOB; busy = true; closeP(); $('bar0').classList.add('hidden');
    await goTo(VW.at[0], VW.at[1] + 2.4); VW.staff.visible = false; me.position.set(VW.at[0], 0, VW.at[1]); me.rotation.y = 0; play(me, 'Idle'); setCam(...VW.cam);
    let served = 0, cur = null, tray = [], end = performance.now() + 60000, over = false;
    const LK = ['#3a8fd8', '#ff6fa8', '#2bb24c', '#f2c230', '#8a4dff', '#e8433a', '#20b2aa'];
    const draw = () => { openP(`<h2>⏱ <span id="wt">${Math.max(0, Math.ceil((end - performance.now()) / 1000))}</span> сек · ✅ ${served}</h2><p>Заказ: <b style="font-size:26px">${cur && cur.arr ? cur.o.map(k => IT(k)[1]).join(' ') : '⏳ гость идёт…'}</b></p><p>Поднос: <b style="font-size:26px">${tray.map(k => IT(k)[1]).join(' ') || '—'}</b></p><div class="wk">${VW.items.map(i => `<button data-i="${i[0]}">${i[1]}<small>${i[2]}</small></button>`).join('')}</div><div style="display:flex;gap:8px"><button class="go2" id="wc">🗑 Сброс</button><button class="go1" id="wg">✅ Отдать</button></div>`);
      panel.querySelectorAll('[data-i]').forEach(b => b.onclick = () => { if (tray.length < 6) { tray.push(b.dataset.i); HAP('light'); draw() } }); $('wc').onclick = () => { tray = []; draw() }; $('wg').onclick = give };
    const next = async () => { if (over) return; const n = Math.min(4, 1 + Math.floor(served / 3) + (Math.random() < .35 ? 1 : 0)); const o = []; for (let i = 0; i < n; i++) o.push(VW.items[Math.floor(Math.random() * VW.items.length)][0]);
      const h = NPC({ sh: LK[Math.floor(Math.random() * LK.length)], pa: '#2b3a55', g: Math.random() < .5 ? 'f' : 'm', hs: Math.floor(Math.random() * 4) }, VW.spawn[0], VW.spawn[1], Math.PI); cur = { o, h, arr: false }; tray = []; draw();
      await mvNPC(h, VW.front); if (over) return; h.rotation.y = Math.PI; play(h, 'Idle'); cur.sp = orderSprite(h, o); cur.arr = true; draw() };
    const leave = async (c, e) => { c.sp && c.h.remove(c.sp); emo(c.h, e); await mvNPC(c.h, VW.spawn); scene.remove(c.h); dispose(c.h) };
    function give() { if (!cur || !cur.arr || over) return; const ok = [...tray].sort().join() === [...cur.o].sort().join(); const c = cur; cur = null; if (ok) { served++; HAP('medium'); play(me, 'Victory', { once: true }) } else { P.toast && P.toast('😡 Не тот заказ! Смотри внимательнее') } leave(c, ok ? '😍' : '😡'); next() }
    const tm = setInterval(async () => { const w = $('wt'); const left = Math.ceil((end - performance.now()) / 1000); if (w) w.textContent = Math.max(0, left); if (left > 0) return; clearInterval(tm); over = true; closeP();
      if (cur) leave(cur, '👋'); const r = await P.call('venue', { a: 'wend', k: V, sc: served }); coins(); if (r && r.job) JOB = r.job; if (r && r.msg) P.toast && P.toast(r.msg);
      VW.staff.visible = true; me.position.set(VW.at[0], 0, VW.at[1] + 2.4); setCam(CAM.p0, CAM.l0); busy = false; bar(); $('bar0').classList.remove('hidden'); plan(); goTo(0, 11).then(() => { me.rotation.y = Math.PI; play(me, 'Idle') }) }, 250);
    next() }
}
$('back').onclick = () => P.closeWork && P.closeWork(); coins();
let last = performance.now();
function loop(now) { requestAnimationFrame(loop); const dt = Math.min(.05, (now - last) / 1000), t = now / 1000; last = now; stepMove(dt, t); tickHeroes(dt); tick(t);
  for (let i = bubbles.length - 1; i >= 0; i--) { const b = bubbles[i], k = (now - b.t0) / 1600; b.s.position.y += dt * .8; b.s.material.opacity = 1 - k; if (k >= 1) { scene.remove(b.s); bubbles.splice(i, 1) } }
  cp.lerp(CAM.p, .06); cl.lerp(CAM.l, .08); cam.position.copy(cp); cam.lookAt(cl); R.render(scene, cam) }
preload(myLook()); requestAnimationFrame(loop);
setTimeout(() => !WK && P.toast && P.toast(V === 'museum' ? '🏛 Твои находки — в витринах. Подойди к хранителю' : V === 'library' ? '📚 Тихо! Выбери книгу и читай 🤫' : V === 'mall' ? '🛍 Бутик слева, супермаркет справа' : V === 'cinema' ? '🎬 Купи билет и выбери, с кем пойдёшь' : '🍔 Жми «Заказать еду» — и за стол!'), 700);
