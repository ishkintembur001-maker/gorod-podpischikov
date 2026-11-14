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
const me = makeHero(myLook()); me.position.set(0, 0, 11); me.rotation.y = Math.PI; scene.add(me); play(me, 'Idle');
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
else {
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
CAM.p0 = CAM.p.toArray(); CAM.l0 = CAM.l.toArray();

// =================== РАБОТА (кассир / бармен) ===================
if (WK) {
  $('ttl').firstChild.textContent = V === 'cinema' ? '🍿 Работа в кинотеатре' : '👨‍🍳 Работа в «Бургер Город»';
  const IT = k => VW.items.find(i => i[0] === k);
  const walkers = []; const oldTick = tick; let lt = 0;
  tick = t => { oldTick(t); const dt = lt ? Math.min(.05, t - lt) : 0; lt = t; for (let i = walkers.length - 1; i >= 0; i--) { const w = walkers[i], d = new THREE.Vector3(w.to[0] - w.h.position.x, 0, w.to[1] - w.h.position.z), L = d.length(); if (L < .15) { walk(w.h, t, false); walkers.splice(i, 1); w.done && w.done(); continue } w.h.position.addScaledVector(d.normalize(), Math.min(L, 8 * dt)); w.h.rotation.y = Math.atan2(d.x, d.z); walk(w.h, t, true) } };
  const mvNPC = (h, to) => new Promise(r => walkers.push({ h, to, done: r }));
  const orderSprite = (h, o) => { const t = tex((g, W, H) => { g.fillStyle = '#fff'; g.beginPath(); g.roundRect(4, 4, W - 8, H - 8, 40); g.fill(); g.font = '80px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(o.map(k => IT(k)[1]).join(''), W / 2, H / 2 + 4) }, 512, 128); const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false })); sp.scale.set(4, 1, 1); sp.position.set(0, 4.6, 0); sp.renderOrder = 7; h.add(sp); return sp };
  let JOB = null;
  const plan = () => { const J = JOB; if (!J) return; openP(`<h2>${V === 'cinema' ? '🍿 Работа в кинотеатре' : '👨‍🍳 Работа в бургерной'}</h2><p>Встаёшь за кассу. Гости подходят с заказом над головой — собери его на поднос и отдай. Смена 60 секунд, 4 смены в день.</p><p>Должность: <b style="color:var(--win)">${J.name}</b> · оплата ×${J.mul}</p>${J.next ? `<div class="bar"><i style="width:${Math.round(J.x / J.next * 100)}%"></i></div><p style="color:var(--dim)">До повышения: ${J.next - J.x} заказов</p>` : '<p>🏆 Ты на вершине карьеры!</p>'}<p style="font-size:13px;color:var(--dim)">Карьера: ${J.ranks.map((r, i) => (i === J.r ? '<b style="color:var(--mint)">' + r[0] + '</b>' : r[0]) + ' ×' + r[2]).join(' → ')}</p><button class="go1" id="ws" ${J.left < 1 ? 'disabled' : ''}>${J.left < 1 ? 'Смены кончились — завтра' : '▶ Начать смену · осталось ' + J.left}</button><button class="go2" id="px">Закрыть</button>`); $('px').onclick = closeP; const b = $('ws'); if (b && J.left > 0) b.onclick = start };
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
setTimeout(() => !WK && P.toast && P.toast(V === 'cinema' ? '🎬 Купи билет и выбери, с кем пойдёшь' : '🍔 Жми «Заказать еду» — и за стол!'), 700);
