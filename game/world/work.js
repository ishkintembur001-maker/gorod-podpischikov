// Работа в Городе подписчиков: больница, ФК ASKER, касса аттракционов, касса ТЦ
import * as THREE from './three.js';
import { makeHero, walk, play, tickHeroes, dispose, preload } from './hero.js';
const P = parent, $ = id => document.getElementById(id);
const JOB = new URLSearchParams(location.search).get('job') || 'hospital';
const ME = () => P.ME || {}, RK = () => ((ME().jobs || {})[JOB] || { r: 0, name: 'Стажёр', x: 0 });
const HAP = k => { try { P.HAP && P.HAP(k) } catch (e) { } };
const DUR = JOB === 'football' ? 100 : 90;

// ---------- сцена ----------
const R = new THREE.WebGLRenderer({ canvas: $('gl'), antialias: true });
R.setPixelRatio(Math.min(1.6, devicePixelRatio)); R.setSize(innerWidth, innerHeight);
R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap; R.toneMapping = THREE.ACESFilmicToneMapping; R.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, .3, 500);
addEventListener('resize', () => { R.setSize(innerWidth, innerHeight); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix() });
scene.add(new THREE.HemisphereLight('#fff6e8', '#4a4060', 1.1));
const sun = new THREE.DirectionalLight('#fff1d6', 1.7); sun.position.set(-18, 32, 22); sun.castShadow = true; sun.shadow.mapSize.set(1536, 1536); Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 30, bottom: -30, near: 1, far: 120 }); scene.add(sun);
const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .7, ...o });
function mk(geo, m, x, y, z, p = scene) { const o = new THREE.Mesh(geo, m.isMaterial ? m : M(m)); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; p.add(o); return o }
const B = (w, h, d, m, x, y, z, p) => mk(new THREE.BoxGeometry(w, h, d), m, x, y, z, p);
const C = (rt, rb, h, m, x, y, z, p, s = 18) => mk(new THREE.CylinderGeometry(rt, rb, h, s), m, x, y, z, p);
function tex(fn, w = 256, h = 128) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t }
function bubble(text, bg = '#ffffff', fg = '#1b1446', w = 2.4) { const t = tex((x, W, H) => { x.fillStyle = bg; x.beginPath(); x.roundRect(4, 4, W - 8, H - 30, 34); x.fill(); x.beginPath(); x.moveTo(W / 2 - 14, H - 27); x.lineTo(W / 2, H - 4); x.lineTo(W / 2 + 14, H - 27); x.fill(); x.fillStyle = fg; x.font = 'bold 54px "Noto Color Emoji",Nunito,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, W / 2, (H - 26) / 2 + 2) }, 256, 128); const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false })); s.renderOrder = 9; s.scale.set(w, w / 2, 1); return s }
const LK = { sk: ['#f2d3b8', '#e0b08a', '#c68e63', '#8d5a3b'], hc: ['#2b1a10', '#5a3a1e', '#c48a3a', '#111111', '#a33a2a'], sh: ['#e8433a', '#3a8bff', '#ffc65c', '#ffffff', '#6a4fd0', '#ff6fb5', '#8a5a3a'], pa: ['#2b3a55', '#1c1c1c', '#6b4a2b', '#3a5a2a'] };
const pick = a => a[Math.random() * a.length | 0];
function youTag(g) { const t = tex((x, W, H) => { x.fillStyle = '#ffc65c'; x.beginPath(); x.roundRect(30, 6, W - 60, 74, 37); x.fill(); x.beginPath(); x.moveTo(W / 2 - 26, 78); x.lineTo(W / 2, 122); x.lineTo(W / 2 + 26, 78); x.fill(); x.fillStyle = '#3b2300'; x.font = 'bold 50px Unbounded,Nunito,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('ТЫ', W / 2, 45) }, 256, 128); const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false })); s.renderOrder = 11; s.scale.set(2.6, 1.3, 1); s.position.y = 5.4; s.userData.you = 1; g.add(s); const r = g.userData.ring; if (r) { r.scale.setScalar(1.5); r.material.color.set('#ffc65c'); r.material.opacity = 1 } return s }
const rndLook = (o = {}) => ({ g: Math.random() < .5 ? 'm' : 'f', sk: pick(LK.sk), hc: pick(LK.hc), hs: Math.random() * 2 | 0, sh: pick(LK.sh), pa: pick(LK.pa), ac: '', ...o });
const myLook = (o = {}) => ({ ...((ME().life || {}).look || {}), ...o });

// ---------- общий ход смены ----------
let SCORE = 0, COMBO = 1, BEST = 1, T0 = 0, RUN = false, STATS = {};
function addPts(n, why) { const v = Math.round(n * COMBO); SCORE += v; $('score').textContent = SCORE; pop('+' + v + (why ? ' ' + why : '')); HAP('light') }
function combo(up) { COMBO = up ? Math.min(3, +(COMBO + .25).toFixed(2)) : 1; BEST = Math.max(BEST, COMBO); $('combo').textContent = '×' + COMBO }
let popT = 0; function pop(t, col) { const p = $('pop'); p.textContent = t; p.style.color = col || ''; p.classList.add('on'); clearTimeout(popT); popT = setTimeout(() => p.classList.remove('on'), 900) }
function tip(t) { const e = $('tip'); if (!t) { e.classList.add('hidden'); return } e.textContent = t; e.classList.remove('hidden') }
const ray = new THREE.Raycaster(), ptr = new THREE.Vector2(), ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
function setRay(e) { ptr.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ptr, cam) }
function tapObj(e, list) { setRay(e); const h = ray.intersectObjects(list, true)[0]; if (!h) return null; let o = h.object; while (o && !o.userData.tap) o = o.parent; return o }

// ---------- описание работ ----------
const INFO = {
  hospital: { ico: '🏥', t: 'Больница — приёмное отделение', d: 'Пациенты ложатся на койки, над каждым видно, что ему нужно. Нажми на шкаф с лекарствами, возьми нужное и нажми на пациента — вылечи, пока он ждёт.', perks: ['Таблетки, бинты и уколы', 'Капельницы — дороже', '6 коек и рентген', 'Носишь 2 лекарства сразу', 'Пациенты терпеливее на 40%'] },
  football: { ico: '⚽', t: 'ФК ASKER — матч', d: 'Ты играешь за ASKER в красной форме. Джойстиком веди мяч, «Пас» — отдай партнёру, «Удар» — бей по воротам. Гол — +20, голевой пас — +10, отбор мяча — +4.', perks: ['Пас и удар', 'Рывок — ускорение', 'Сильный удар — вратарь отбивает реже', 'Партнёры быстрее и умнее', 'Каждый гол ×1.5'] },
  park: { ico: '🎢', t: 'Касса аттракционов', d: 'Посетители просят билеты. Выдай нужные билеты, прими деньги и отсчитай правильную сдачу. Чем быстрее — тем больше очков и чаевых.', perks: ['Горки, колесо, карусель', 'Подсказка суммы заказа', 'Башня свободного падения и VIP-гости', 'Оплата картой — без сдачи', 'Чаевые ×2'] },
  shop: { ico: '🛍', t: 'Касса ТЦ «Город»', d: 'Покупатель кладёт товары на ленту. Пробей каждый товар, фрукты — на весы, потом прими оплату и выдай сдачу.', perks: ['Касса и весы', 'Подсказка сдачи', 'Оплата картой', 'Сканер пробивает 2 товара сразу', 'Скидочные карты — двойные очки'] },
};
const I = INFO[JOB];

// =================================================================== БОЛЬНИЦА
function Hospital() {
  const rk = RK().r, BEDS = rk >= 2 ? [-10, -6, -2, 2, 6, 10] : [-6, -2, 2, 6], HW = 12.5, HD = 8.5;
  if (innerWidth < innerHeight) { cam.fov = 55; cam.updateProjectionMatrix(); cam.position.set(19, 27, 1); cam.lookAt(-1.2, 0, 0) } else { cam.position.set(0, 21, 19); cam.lookAt(0, 0, 0.5) }
  B(HW * 2, .3, HD * 2, '#e9eef2', 0, -.15, 0); B(HW * 2, 4.5, .3, '#bfe0e8', 0, 2.25, -HD); B(.3, 4.5, HD * 2, '#bfe0e8', -HW, 2.25, 0); B(.3, 1, HD * 2, '#bfe0e8', HW, .5, 0); B(HW * 2, 1, .3, '#bfe0e8', 0, .5, HD);
  B(HW * 2, .25, .32, '#2bb24c', 0, 1.4, -HD + .02);
  const cross = tex((x, W, H) => { x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); x.fillStyle = '#e8433a'; x.fillRect(W / 2 - 18, 14, 36, H - 28); x.fillRect(W / 2 - 50, H / 2 - 18, 100, 36) }, 128, 128);
  const cs = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.8), new THREE.MeshBasicMaterial({ map: cross })); cs.position.set(0, 3.4, -HD + .17); scene.add(cs);
  B(4, 1.2, 1.2, '#ffffff', 8.5, .6, 5.5); B(4.1, .12, 1.3, '#3a8bff', 8.5, 1.25, 5.5);
  // шкаф с лекарствами
  const MEDS = [['pill', '💊', 'Таблетки', '#e8433a'], ['band', '🩹', 'Бинт', '#ffffff'], ['shot', '💉', 'Укол', '#3a8bff']];
  if (rk >= 1) MEDS.push(['drip', '🧴', 'Капельница', '#5ee6b0']); if (rk >= 2) MEDS.push(['xray', '🩻', 'Рентген', '#6a4fd0']);
  const cab = new THREE.Group(); cab.position.set(-HW + .6, 0, 0); scene.add(cab); B(.9, 3.6, MEDS.length * 1.5 + .4, '#f6f6f6', 0, 1.8, 0, cab);
  const SLOTS = MEDS.map((m, i) => { const z = (i - (MEDS.length - 1) / 2) * 1.5; const g = new THREE.Group(); g.position.set(.5, 0, z); cab.add(g); B(.1, 1.1, 1.2, m[3], 0, 1.9, 0, g); const b = bubble(m[1], '#fff', '#000', 1.4); b.position.set(.3, 3.2, 0); g.add(b); g.userData.tap = () => takeMed(m, g); return g });
  // койки
  const beds = BEDS.map(x => { const g = new THREE.Group(); g.position.set(x, 0, -HD + 2.8); scene.add(g); B(2.4, .5, 4.2, '#9aa8b8', 0, .55, 0, g); B(2.2, .3, 3.9, '#ffffff', 0, .95, .1, g); B(2.25, .15, 2.2, '#bfe0ff', 0, 1.15, .9, g); B(1.6, .25, .7, '#ffffff', 0, 1.2, -1.5, g); B(2.4, 1.4, .15, '#9aa8b8', 0, 1.2, -2.05, g); g.userData = { bed: true, p: null, tap: () => toPatient(g) }; return g });
  const me = makeHero(myLook({ sh: '#5ee6b0', pa: '#5ee6b0' })); me.rotation.order = 'YXZ'; me.position.set(0, 0, 3); scene.add(me); const YT = youTag(me);
  let held = [], path = null, busy = false; const heldS = new THREE.Group(); me.add(heldS);
  function drawHeld() { heldS.clear(); held.forEach((m, i) => { const b = bubble(m[1], '#fff', '#000', 1.5); b.position.set(i * 1.1 - (held.length - 1) * .55 + 1.8, 4.2, 0); heldS.add(b) }); $('held').innerHTML = held.length ? 'В руках: ' + held.map(m => m[1] + ' ' + m[2]).join(', ') : 'Руки пустые — возьми лекарство'; document.querySelectorAll('[data-med]').forEach(b => b.classList.toggle('on', held.some(m => m[0] === b.dataset.med))) }
  function goto(p, cb) { path = { p: p.clone(), cb } }
  function takeMed(m, g) { if (busy) return; goto(new THREE.Vector3(-HW + 2.4, 0, g.position.z), () => { play(me, 'PickUp', { once: true }); setTimeout(() => play(me, 'Idle'), 700); const cap = rk >= 3 ? 2 : 1; held.push(m); if (held.length > cap) held.shift(); drawHeld(); HAP('light') }) }
  function toPatient(bed) { if (busy) return; const pt = bed.userData.p; if (!pt || pt.state !== 'bed') return; goto(new THREE.Vector3(bed.position.x + 1.9, 0, bed.position.z + .3), () => {
      me.lookAt(bed.position.x, 0, bed.position.z + .3); const i = held.findIndex(m => m[0] === pt.need[0]);
      busy = true; play(me, 'PickUp', { once: true });
      setTimeout(() => { busy = false; play(me, 'Idle');
        if (i < 0) { combo(false); pop(held.length ? 'Не то лекарство!' : 'Сначала возьми лекарство', '#ff6b4a'); HAP('heavy'); return }
        held.splice(i, 1); drawHeld(); const fr = pt.pat / pt.max; addPts((pt.need[0] === 'drip' || pt.need[0] === 'xray' ? 9 : 6) + Math.round(fr * 4), '✚'); combo(true); STATS.healed = (STATS.healed || 0) + 1; leave(pt, true) }, 900) }) }
  const pts = []; let spawnT = 1.5;
  function spawn() { const bed = beds.find(b => !b.userData.p); if (!bed) return; const need = pick(MEDS); const g = makeHero(rndLook()); g.rotation.order = 'YXZ'; g.position.set(HW - 1.5, 0, HD - 1.5); scene.add(g);
    const max = (rk >= 4 ? 28 : 20) - Math.min(6, (performance.now() - T0) / 15000); const pt = { g, bed, need, state: 'walk', pat: max, max }; bed.userData.p = pt; pts.push(pt);
    const ring = bubble(need[1] + ' ' + need[2], '#fff', '#1b1446', 4.2); ring.position.y = 4.8; ring.visible = false; g.add(ring); pt.b = ring }
  function leave(pt, ok) { pt.state = 'leave'; pt.bed.userData.p = null; pt.g.rotation.x = 0; pt.g.position.set(pt.bed.position.x + 1.8, 0, pt.bed.position.z + 1); pt.g.remove(pt.b); const b = bubble(ok ? '😊 Спасибо!' : '😠 Долго!', ok ? '#5ee6b0' : '#ff6b4a', '#1b1446', 2.6); b.position.y = 4.4; pt.g.add(b); play(pt.g, ok ? 'Victory' : 'Walk', { once: ok }); setTimeout(() => play(pt.g, 'Walk'), ok ? 1200 : 0) }
  // тап
  addEventListener('pointerup', e => { if (!RUN) return; const o = tapObj(e, [...SLOTS, ...beds]); if (o) { o.userData.tap(); return } setRay(e); const p = new THREE.Vector3(); if (ray.ray.intersectPlane(ground, p)) goto(new THREE.Vector3(Math.max(-HW + 1.5, Math.min(HW - 1, p.x)), 0, Math.max(-HD + 5, Math.min(HD - 1, p.z)))) });
  document.body.insertAdjacentHTML('beforeend', `<div id="medp"><div id="held">Руки пустые — возьми лекарство</div><div class="row">${MEDS.map(m => `<button class="k" data-med="${m[0]}"><span style="font-size:22px">${m[1]}</span><br>${m[2]}</button>`).join('')}</div></div>`);
  document.querySelectorAll('[data-med]').forEach(b => b.onclick = () => { const i = MEDS.findIndex(m => m[0] === b.dataset.med); takeMed(MEDS[i], SLOTS[i]) });
  tip('1) Внизу выбери лекарство, которое просит пациент  2) Нажми на пациента на койке');
  return (t, dt) => {
    if (path) { const d = path.p.clone().sub(me.position); d.y = 0; const L = d.length(); if (L > .15) { me.position.addScaledVector(d.normalize(), Math.min(L, 9 * dt)); me.rotation.y = Math.atan2(d.x, d.z); walk(me, t, true) } else { const cb = path.cb; path = null; walk(me, t, false); cb && cb() } } else if (!busy) walk(me, t, false);
    YT.position.y = 5.4 + Math.sin(t * 4) * .2;
    { const por = innerWidth < innerHeight; const tp = por ? new THREE.Vector3(me.position.x * .55 + 13, 19, me.position.z * .55) : new THREE.Vector3(me.position.x * .6, 16, me.position.z * .5 + 13); cam.position.lerp(tp, .06); cam.lookAt(por ? me.position.x * .55 - 4 : me.position.x * .6, 0, por ? me.position.z * .55 : me.position.z * .5 + 1) }
    if (RUN && (spawnT -= dt) <= 0) { spawn(); spawnT = Math.max(2.8, 6 - (performance.now() - T0) / 20000) }
    for (let i = pts.length - 1; i >= 0; i--) { const pt = pts[i], g = pt.g;
      if (pt.state === 'walk') { const tg = new THREE.Vector3(pt.bed.position.x + 1.8, 0, pt.bed.position.z + 1); const d = tg.clone().sub(g.position); d.y = 0; if (d.length() > .2) { g.position.addScaledVector(d.normalize(), Math.min(d.length(), 6 * dt)); g.rotation.y = Math.atan2(d.x, d.z); walk(g, t, true) } else { pt.state = 'bed'; play(g, 'Idle'); g.rotation.set(-Math.PI / 2, 0, 0); g.position.set(pt.bed.position.x, 1.3, pt.bed.position.z + 1.75); pt.b.visible = true; pt.b.position.set(0, 2.2, -1.2) } }
      else if (pt.state === 'bed') { pt.pat -= dt; const k = pt.pat / pt.max; pt.b.material.color.setRGB(1, .5 + k * .5, .5 + k * .5); if (pt.pat <= 0) { combo(false); pop('Пациент ушёл 😠', '#ff6b4a'); leave(pt, false) } }
      else if (pt.state === 'leave') { const d = new THREE.Vector3(HW - .5, 0, HD + 3).sub(g.position); d.y = 0; if (d.length() < .5 || g.position.z > HD + 1) { scene.remove(g); dispose(g); pts.splice(i, 1) } else if (performance.now() % 100000 > 0) { g.position.addScaledVector(d.normalize(), 5 * dt); g.rotation.y = Math.atan2(d.x, d.z); walk(g, t, true) } }
    }
  };
}

// =================================================================== ФУТБОЛ
function Football() {
  const rk = RK().r, FW = 30, FH = 18;
  const grass = tex((x, W, H) => { for (let i = 0; i < 12; i++) { x.fillStyle = i % 2 ? '#3f9a3a' : '#48a842'; x.fillRect(i * W / 12, 0, W / 12, H) } x.strokeStyle = 'rgba(255,255,255,.9)'; x.lineWidth = 4; x.strokeRect(8, 8, W - 16, H - 16); x.beginPath(); x.moveTo(W / 2, 8); x.lineTo(W / 2, H - 8); x.stroke(); x.beginPath(); x.arc(W / 2, H / 2, 46, 0, 7); x.stroke(); x.strokeRect(8, H / 2 - 70, 70, 140); x.strokeRect(W - 78, H / 2 - 70, 70, 140); x.font = 'bold 40px Unbounded,sans-serif'; x.fillStyle = 'rgba(255,255,255,.25)'; x.textAlign = 'center'; x.fillText('ASKER', W / 2, H / 2 + 14) }, 1024, 620);
  const fld = new THREE.Mesh(new THREE.PlaneGeometry(FW * 2 + 2, FH * 2 + 2), new THREE.MeshStandardMaterial({ map: grass })); fld.rotation.x = -Math.PI / 2; fld.receiveShadow = true; scene.add(fld);
  const sur = new THREE.Mesh(new THREE.PlaneGeometry(160, 120), M('#2f7a2f')); sur.rotation.x = -Math.PI / 2; sur.position.y = -.02; scene.add(sur);
  for (const s of [-1, 1]) { const gx = s * (FW + .6); for (const z of [-3.6, 3.6]) C(.15, .15, 2.6, '#fff', gx, 1.3, z); const cb = C(.15, .15, 7.2, '#fff', gx, 2.6, 0); cb.rotation.x = Math.PI / 2; const net = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 2.6), M('#ffffff', { transparent: true, opacity: .3, side: THREE.DoubleSide })); net.position.set(gx + s * 1.2, 1.3, 0); net.rotation.y = Math.PI / 2; scene.add(net) }
  for (const z of [-FH - 6, FH + 6]) { B(FW * 2 + 20, 3, 4, '#3a3a6a', 0, 1.5, z); for (let i = 0; i < 40; i++) { const f = makeFan(); f.position.set(-FW - 5 + i * 1.8, 3.2, z) } }
  function makeFan() { const g = new THREE.Mesh(new THREE.SphereGeometry(.45, 8, 6), M(pick(['#e8433a', '#ffffff', '#ffc65c', '#3a8bff']))); scene.add(g); g.userData.fan = 1; return g }
  const ballT = tex((x, W, H) => { x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); x.fillStyle = '#111'; for (let i = 0; i < 6; i++) { x.beginPath(); x.arc((i * 47) % W + 20, (i * 31) % H + 16, 12, 0, 7); x.fill() } }, 128, 64);
  const ball = mk(new THREE.SphereGeometry(.45, 18, 14), M('#fff', { map: ballT, roughness: .4 }), 0, .45, 0); const BV = new THREE.Vector3(); let owner = null, lastTouch = null, lastPasser = null, kickCd = 0;
  const players = [];
  function add(team, x, z, me, gk) { const look = me ? myLook({ sh: '#e8433a', pa: '#ffffff' }) : rndLook({ sh: team ? '#3a8bff' : '#e8433a', pa: team ? '#1c1c1c' : '#ffffff', ac: '' }); if (gk) look.sh = team ? '#2bb24c' : '#ffc65c'; const g = makeHero(look, !!me); g.position.set(x, 0, z); scene.add(g); const pl = { g, team, hx: x, hz: z, me, gk, cd: 0, v: new THREE.Vector3() }; players.push(pl); return pl }
  const ME_ = add(0, -4, 0, true); const YT2 = youTag(ME_.g); add(0, -8, -8); add(0, -8, 8); add(0, -FW + 1, 0, false, true);
  add(1, 6, 0); add(1, 10, -7); add(1, 10, 7); add(1, FW - 1, 0, false, true);
  let goals = [0, 0], kick = 1, gLock = false;
  function reset(toTeam) { gLock = false; ball.position.set(0, .45, 0); BV.set(0, 0, 0); owner = null; players.forEach(p => p.g.position.set(p.hx, 0, p.hz)); const k = players.find(p => p.team === toTeam && !p.gk && (toTeam === 0 ? p.me : true)); k.g.position.set(toTeam ? 1.2 : -1.2, 0, 0); owner = k; lastTouch = k }
  reset(0);
  const S = { x: 0, y: 0 }; { const jw = $('joy'), jk = $('knob'); const mv = e => { const r = jw.getBoundingClientRect(); let dx = e.clientX - r.left - 65, dy = e.clientY - r.top - 65; const L = Math.hypot(dx, dy); if (L > 50) { dx *= 50 / L; dy *= 50 / L } jk.style.transform = `translate(${dx}px,${dy}px)`; S.x = dx / 50; S.y = dy / 50 }; jw.onpointerdown = e => { jw.setPointerCapture(e.pointerId); mv(e) }; jw.onpointermove = e => { if (e.buttons || e.pointerType === 'touch') mv(e) }; jw.onpointerup = jw.onpointercancel = () => { S.x = S.y = 0; jk.style.transform = '' } }
  let dash = 0, power = rk >= 2;
  function kickTo(pl, tx, tz, sp) { const d = new THREE.Vector3(tx - ball.position.x, 0, tz - ball.position.z).normalize(); BV.copy(d.multiplyScalar(sp)); owner = null; kickCd = .35; lastTouch = pl }
  function shoot(pl) { const s = pl.team ? -1 : 1, gx = s * (FW + 1.2); const kp = players.find(p => p.gk && p.team !== pl.team); let tz = kp.g.position.z > 0 ? -2.6 : 2.6; tz += (Math.random() - .5) * (Math.abs(gx - pl.g.position.x) / 8); kickTo(pl, gx, tz, pl.me && power ? 34 : 28); pl.shot = true }
  function pass(pl) { const mates = players.filter(p => p.team === pl.team && p !== pl && !p.gk); const s = pl.team ? -1 : 1; let best = null, bs = -1e9; for (const m of mates) { const fw = (m.g.position.x - pl.g.position.x) * s, d = m.g.position.distanceTo(pl.g.position); const near = Math.min(...players.filter(o => o.team !== pl.team).map(o => o.g.position.distanceTo(m.g.position))); const sc = fw * .6 + near * 1.2 - Math.abs(d - 10) * .3; if (sc > bs) { bs = sc; best = m } } if (best) { const lead = best.v.clone().multiplyScalar(.4); kickTo(pl, best.g.position.x + lead.x, best.g.position.z + lead.z, Math.min(26, 10 + pl.g.position.distanceTo(best.g.position) * 1.1)); lastPasser = pl } }
  $('bShoot').onclick = () => { if (owner === ME_) { shoot(ME_); HAP('medium') } }; $('bPass').onclick = () => { if (owner === ME_) { pass(ME_); HAP('light') } };
  if ($('bDash')) $('bDash').onclick = () => { if (dash <= 0) { dash = 2.5; HAP('light') } };
  tip('Ты — с жёлтым кольцом. Веди мяч джойстиком, «Пас» и «Удар» справа');
  function goal(team) { if (gLock) return; gLock = true; goals[team]++; $('ttl').innerHTML = I.t + `<small>ASKER ${goals[0]} : ${goals[1]} Гости</small>`; const scorer = lastTouch;
    if (team === 0) { if (scorer === ME_) { addPts(rk >= 4 ? 30 : 20, 'ГОЛ!'); STATS.goals = (STATS.goals || 0) + 1 } else { if (lastPasser === ME_) { addPts(10, 'голевой пас'); STATS.assists = (STATS.assists || 0) + 1 } else pop('ГОЛ ASKER! ⚽') } combo(true) } else { pop('Гол в наши ворота', '#ff6b4a'); combo(false) }
    HAP('heavy'); scene.traverse(o => { if (o.userData.fan) o.userData.jump = 2 }); setTimeout(() => reset(team ? 0 : 1), 1200); owner = null; BV.set(0, 0, 0); ball.position.set(team ? -FW - 1 : FW + 1, .45, 0) }
  $('ttl').innerHTML = I.t + `<small>ASKER 0 : 0 Гости</small>`;
  return (t, dt) => {
    kickCd -= dt; dash -= dt;
    for (const p of players) { const g = p.g, pos = g.position; let tx = pos.x, tz = pos.z, sp = 7.5 + (p.team === 0 && rk >= 3 ? 1.2 : 0);
      if (p.me) { const L = Math.hypot(S.x, S.y); if (L > .1) { tx = pos.x + S.x * 5; tz = pos.z + S.y * 5; sp = (9 + (dash > 0 ? 5 : 0)) * Math.min(1, L) } }
      else if (p.gk) { const s = p.team ? 1 : -1; tx = s * (FW - .5); tz = Math.max(-3.2, Math.min(3.2, ball.position.z * .8)); sp = 6 }
      else { const s = p.team ? -1 : 1; const myTeamOwns = owner && owner.team === p.team; const mates = players.filter(q => q.team === p.team && !q.gk && !q.me || (q.team === p.team && q.me));
        const nearest = players.filter(q => q.team === p.team && !q.gk && !q.me).sort((a, b) => a.g.position.distanceTo(ball.position) - b.g.position.distanceTo(ball.position))[0];
        if (owner === p) { tx = s * FW; tz = pos.z * .7; if (Math.abs(s * FW - pos.x) < 14 && Math.random() < dt * 1.5) shoot(p); else if (players.some(o => o.team !== p.team && o.g.position.distanceTo(pos) < 2.4) && Math.random() < dt * 2.5) pass(p) }
        else if (!myTeamOwns && (nearest === p || p.team === 1 && owner === ME_ && nearest === p)) { tx = ball.position.x; tz = ball.position.z }
        else { tx = ball.position.x * .6 + p.hx * .4 + (myTeamOwns ? s * 6 : -s * 3); tz = p.hz * .8 + ball.position.z * .2 }
        if (p.team === 1) sp = 7.2 + Math.min(1.5, (performance.now() - T0) / 60000) }
      const d = new THREE.Vector3(tx - pos.x, 0, tz - pos.z), L = d.length();
      if (L > .3) { d.normalize(); p.v.copy(d).multiplyScalar(Math.min(sp, L * 4)); pos.addScaledVector(p.v, dt); g.rotation.y = Math.atan2(d.x, d.z); walk(g, t, true); if (p.g.userData.acts && sp > 9) play(g, 'Run') } else { p.v.set(0, 0, 0); walk(g, t, false) }
      pos.x = Math.max(-FW - .5, Math.min(FW + .5, pos.x)); pos.z = Math.max(-FH + .5, Math.min(FH - .5, pos.z));
      // владение и отбор
      const db = pos.distanceTo(new THREE.Vector3(ball.position.x, 0, ball.position.z));
      if (!owner && kickCd <= 0 && db < 1.3 && ball.position.y < 1.2) { if (p.gk) { BV.set((p.team ? -1 : 1) * 18, 0, (Math.random() - .5) * 12); kickCd = .5; lastTouch = p; if (p.team === 1 && lastTouch) { } } else { owner = p; lastTouch = p; if (p === ME_ && lastPasser && lastPasser.team === 0 && lastPasser !== ME_) { } } }
      else if (owner && owner.team !== p.team && owner !== p && !p.gk && db < 1.2 && p.cd <= 0) { p.cd = .8; if (Math.random() < (p.me ? .75 : .38)) { if (p.me) { addPts(4, 'отбор'); STATS.tackles = (STATS.tackles || 0) + 1 } owner = p; lastTouch = p; lastPasser = null } }
      p.cd -= dt;
    }
    if (owner) { const g = owner.g, f = new THREE.Vector3(Math.sin(g.rotation.y), 0, Math.cos(g.rotation.y)); ball.position.set(g.position.x + f.x * .9, .45, g.position.z + f.z * .9); ball.rotation.x += owner.v.length() * dt * 2 }
    else { ball.position.addScaledVector(BV, dt); BV.multiplyScalar(Math.pow(.55, dt)); ball.rotation.x += BV.length() * dt;
      // вратарь сейвит
      for (const k of players.filter(p => p.gk)) { const s = k.team ? 1 : -1; if (Math.abs(ball.position.x - s * (FW - .5)) < 1 && Math.abs(ball.position.z - k.g.position.z) < 1.6 && BV.x * s > 6) { const saveP = lastTouch && lastTouch.me && power ? .35 : .5; if (Math.random() < saveP) { BV.x = -BV.x * .6; BV.z += (Math.random() - .5) * 10; lastTouch = k; pop(k.team ? 'Вратарь отбил!' : 'Наш вратарь спас!', '#ffc65c') } else BV.x *= 1.0001 } }
      if (Math.abs(ball.position.z) > FH) { BV.z = -BV.z * .6; ball.position.z = Math.sign(ball.position.z) * FH }
      if (Math.abs(ball.position.x) > FW + .6) { if (Math.abs(ball.position.z) < 3.5 && RUN) goal(ball.position.x > 0 ? 0 : 1); else { BV.x = -BV.x * .5; ball.position.x = Math.sign(ball.position.x) * FW } } }
    scene.traverse(o => { if (o.userData.fan) { if (o.userData.jump > 0) { o.userData.jump -= dt; o.position.y = 3.2 + Math.abs(Math.sin(t * 12 + o.position.x)) * .7 } else o.position.y = 3.2 + Math.abs(Math.sin(t * 2 + o.position.x)) * .1 } });
    const cx = THREE.MathUtils.clamp(ball.position.x, -FW + 5, FW - 5); cam.position.lerp(new THREE.Vector3(cx, 21, ball.position.z * .6 + 18), .08); cam.lookAt(cx, 0, ball.position.z * .6 + 1);
  };
}

// =================================================================== КАССЫ (парк и ТЦ)
function Cashier(kind) {
  const rk = RK().r, park = kind === 'park';
  if (innerWidth < innerHeight) { cam.position.set(4.5, 7.5, 11.5); cam.lookAt(0, 2.4, 1.6) } else { cam.position.set(6, 7, 12); cam.lookAt(0, 2, 2) }
  const gr = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), M(park ? '#5bad44' : '#d8d0c4')); gr.rotation.x = -Math.PI / 2; gr.receiveShadow = true; scene.add(gr);
  let wheel = null, cars = [];
  if (park) { scene.background = new THREE.Color('#9fd3ff');
    for (let i = 0; i < 30; i++) { const z = 3 + Math.random() * 30; if (Math.abs(Math.random()) < 2) { } }
    const path = new THREE.Mesh(new THREE.PlaneGeometry(6, 40), M('#e8d8b8')); path.rotation.x = -Math.PI / 2; path.position.set(0, .01, 14); scene.add(path);
    wheel = new THREE.Group(); wheel.position.set(-14, 11, -14); scene.add(wheel); const rim = new THREE.Mesh(new THREE.TorusGeometry(9, .25, 8, 48), M('#e8433a')); wheel.add(rim); for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; const sp = B(.15, 9, .15, '#ffffff', Math.cos(a) * 4.5, Math.sin(a) * 4.5, 0, wheel); sp.rotation.z = a - Math.PI / 2; const c = B(1.2, 1, 1.2, pick(['#ffc65c', '#3a8bff', '#2bb24c', '#ff6fb5']), Math.cos(a) * 9, Math.sin(a) * 9 - .8, 0, wheel); cars.push(c) }
    for (const s of [-1, 1]) { const l = B(.4, 12, .4, '#ffffff', -14 + s * 3, 5.5, -14); l.rotation.z = s * .25 }
    const tr = new THREE.Group(); tr.position.set(14, 0, -12); scene.add(tr); for (let i = 0; i < 24; i++) { const a = i / 24 * 6.283; const y = 3 + Math.sin(a * 2) * 2.5; B(1.4, .2, .5, '#ffc65c', Math.cos(a) * 8, y, Math.sin(a) * 5, tr).rotation.y = -a; B(.15, y, .15, '#888', Math.cos(a) * 8, y / 2, Math.sin(a) * 5, tr) }
    const car1 = B(1.4, .8, .9, '#e8433a', 8, 4, 0, tr); car1.name = 'coast';
    const kar = new THREE.Group(); kar.position.set(16, 0, 6); scene.add(kar); C(4, 4, .5, '#ff6fb5', 0, .25, 0, kar); C(.3, .3, 4, '#ffc65c', 0, 2.2, 0, kar); const top = new THREE.Mesh(new THREE.ConeGeometry(4.4, 1.6, 16), M('#3a8bff')); top.position.y = 4.8; kar.add(top); for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283; C(.07, .07, 3, '#fff', Math.cos(a) * 3, 2, Math.sin(a) * 3, kar, 6); B(.6, .8, 1, pick(['#fff', '#ffc65c', '#2bb24c']), Math.cos(a) * 3, 1.2, Math.sin(a) * 3, kar) } kar.name = 'kar';
    for (let i = 0; i < 14; i++) { const x = (Math.random() - .5) * 60, z = -20 - Math.random() * 20; C(.25, .3, 2, '#7a4a2a', x, 1, z); mk(new THREE.SphereGeometry(1.6, 10, 8), '#3fb86a', x, 3, z) }
  } else { scene.background = new THREE.Color('#e9e4ff');
    B(40, 8, .5, '#f3efe6', 0, 4, -8); for (let i = 0; i < 6; i++) { const sh = new THREE.Group(); sh.position.set(-14 + i * 5.6, 0, -6.5); scene.add(sh); B(4.8, 4, 1.2, '#c9b08a', 0, 2, 0, sh); for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) B(.6, .8, .6, pick(['#e8433a', '#3a8bff', '#ffc65c', '#2bb24c', '#ffffff', '#ff6fb5']), -2 + c * .8, .9 + r * 1.2, .2, sh) }
    const sign = tex((x, W, H) => { x.fillStyle = '#ff6b4a'; x.fillRect(0, 0, W, H); x.fillStyle = '#fff'; x.font = 'bold 60px Unbounded,sans-serif'; x.textAlign = 'center'; x.fillText('ТЦ «ГОРОД»', W / 2, 85) }, 512, 128); const sm = new THREE.Mesh(new THREE.PlaneGeometry(10, 2.5), new THREE.MeshBasicMaterial({ map: sign })); sm.position.set(0, 6.8, -7.7); scene.add(sm) }
  // касса / киоск
  const desk = new THREE.Group(); scene.add(desk);
  if (park) { B(5, 2.2, 3, '#ffffff', 0, 1.1, -1, desk); B(5.4, .2, 3.4, '#e8433a', 0, 4.4, -1, desk); for (const x of [-2.4, 2.4]) B(.2, 2.2, .2, '#e8433a', x, 3.3, .4, desk); const st = tex((x, W, H) => { for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#ffffff' : '#e8433a'; x.fillRect(i * W / 8, 0, W / 8, H) } }, 256, 32); const aw = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 1.2), new THREE.MeshStandardMaterial({ map: st, side: THREE.DoubleSide })); aw.position.set(0, 4.1, .9); aw.rotation.x = .5; desk.add(aw); const lab = tex((x, W, H) => { x.fillStyle = '#ffc65c'; x.fillRect(0, 0, W, H); x.fillStyle = '#3b2300'; x.font = 'bold 44px Unbounded,sans-serif'; x.textAlign = 'center'; x.fillText('КАССА 🎟', W / 2, 46) }, 512, 64); const lm = new THREE.Mesh(new THREE.PlaneGeometry(4, .5), new THREE.MeshBasicMaterial({ map: lab })); lm.position.set(0, 4.75, .72); desk.add(lm) }
  else { B(7, 1.1, 1.6, '#3a3a5a', 0, .55, 0, desk); const belt = B(5, .1, 1.2, '#222', -1, 1.15, 0, desk); belt.name = 'belt'; B(1.2, 1.4, 1.2, '#2b2266', 2.6, 1.5, -.1, desk); const scr = B(.9, .6, .08, '#5ee6b0', 2.6, 2.5, .2, desk, { emissive: '#2a8a5a' }); B(1, .1, 1, '#c0c0c0', 1.5, 1.2, 0, desk) }
  const me = makeHero(myLook(park ? { sh: '#e8433a' } : { sh: '#2bb24c' })); me.position.set(0, 0, park ? -1.6 : -1.7); scene.add(me); youTag(me);
  // очередь
  const Q = []; const QZ = park ? 1.6 : 1.6;
  function addVisitor() { const g = makeHero(rndLook()); g.position.set(park ? 0 : -4, 0, 30); scene.add(g); Q.push({ g, slot: Q.length }) }
  for (let i = 0; i < 4; i++) addVisitor();
  // заказ
  const RIDES = [['coaster', '🎢', 'Горки', 300], ['wheel', '🎡', 'Колесо', 200], ['carousel', '🎠', 'Карусель', 150]]; if (rk >= 2) RIDES.push(['tower', '🗼', 'Башня', 400]);
  const GOODS = [['milk', '🥛', 'Молоко', 89], ['bread', '🍞', 'Хлеб', 45], ['juice', '🧃', 'Сок', 120], ['choc', '🍫', 'Шоколад', 75], ['cheese', '🧀', 'Сыр', 260], ['water', '💧', 'Вода', 35], ['apple', '🍎', 'Яблоки', 0, 120], ['banana', '🍌', 'Бананы', 0, 99]];
  let cur = null, belt = [];
  function newOrder() { const v = Q[0]; if (!v) return; cur = { v, t0: performance.now(), card: rk >= (park ? 3 : 2) && Math.random() < .35, vip: park && rk >= 2 && Math.random() < .25, disc: !park && rk >= 4 && Math.random() < .3 };
    if (park) { const n = 1 + Math.random() * 2 | 0, o = {}; for (let i = 0; i < n; i++) { const r = pick(RIDES); o[r[0]] = (o[r[0]] || 0) + 1 + (Math.random() * 2 | 0) } cur.want = o; cur.total = Object.entries(o).reduce((s, [k, q]) => s + RIDES.find(r => r[0] === k)[3] * q, 0); if (cur.vip) cur.total *= 2 }
    else { const n = 3 + Math.random() * 3 | 0; cur.items = []; for (let i = 0; i < n; i++) { const g = pick(GOODS); const it = { k: g[0], e: g[1], n: g[2], price: g[3], kg: g[4] ? +(0.5 + Math.random() * 1.5).toFixed(1) : 0, perkg: g[4] || 0, scanned: false, weighed: false }; if (it.kg) it.price = Math.round(it.kg * it.perkg); cur.items.push(it) } cur.total = cur.items.reduce((s, i) => s + i.price, 0); if (cur.disc) cur.total = Math.round(cur.total * .9); spawnGoods() }
    cur.paid = cur.card ? cur.total : [500, 1000, 2000, 5000].find(b => b >= cur.total) || 5000; cur.given = {}; cur.change = 0; cur.step = park ? 'tickets' : 'scan'; panel() }
  // 3D товары на ленте
  function spawnGoods() { belt.forEach(b => desk.remove(b.m)); belt = cur.items.map((it, i) => { const m = new THREE.Group(); const c = { milk: '#ffffff', bread: '#d9a05a', juice: '#ff8a2a', choc: '#6a3a1e', cheese: '#ffd34a', water: '#7fd6ff', apple: '#e8433a', banana: '#ffe14a' }[it.k]; B(.55, it.kg ? .35 : .7, .45, c, 0, 0, 0, m); const b = bubble(it.e, '#fff', '#000', .9); b.position.y = .9; m.add(b); m.position.set(-3.2 + i * .7, 1.55, 0); m.userData.tap = () => scan(i); desk.add(m); return { m, it } }) }
  function scan(i) { if (!cur || cur.step !== 'scan') return; const n = rk >= 3 ? 2 : 1; let done = 0; for (let j = i; j < belt.length && done < n; j++) { const b = belt[j]; if (b.it.scanned) continue; if (b.it.kg && !b.it.weighed) { pop('Сначала на весы ⚖', '#ffc65c'); cur.need = j; panel(); return } b.it.scanned = true; b.m.position.set(3.6, 1.5, -.3 + done * .3); done++; beep() } if (done) { HAP('light'); panel() } }
  function beep() { try { const a = new (window.AudioContext || window.webkitAudioContext)(), o = a.createOscillator(), g = a.createGain(); o.frequency.value = 1800; g.gain.value = .05; o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime + .08) } catch (e) { } }
  function panel() { const el = $('cash'); if (!cur) { el.innerHTML = '<div class="order">Ждём покупателя…</div>'; return } let h = '';
    if (park) { h += `<div class="order"><span>${cur.vip ? '👑 VIP · ' : ''}Хочу: ${Object.entries(cur.want).map(([k, q]) => RIDES.find(r => r[0] === k)[1] + '×' + q).join('  ')}</span>${rk >= 1 ? `<b>${cur.total} ₽</b>` : ''}</div>` }
    else { const left = cur.items.filter(i => !i.scanned).length; h += `<div class="order"><span>Товары: ${cur.items.map(i => (i.scanned ? '✅' : '') + i.e + (i.kg ? i.kg + 'кг' : '')).join(' ')}</span><b>${cur.items.filter(i => i.scanned).reduce((s, i) => s + i.price, 0)} ₽</b></div>` }
    if (cur.step === 'tickets') { const g = cur.give || (cur.give = {}); h += `<div class="lab">1. Выдай билеты</div><div class="row">${RIDES.map(r => `<button class="k" data-r="${r[0]}">${r[1]} ${r[2]}<small>${r[3]} ₽</small></button>`).join('')}</div><div class="tray">${Object.entries(g).map(([k, q]) => `<i>${RIDES.find(r => r[0] === k)[1]}×${q}</i>`).join('') || 'Пусто'}</div><div class="row"><button class="k no" id="clr">Сбросить</button><button class="k go" id="okT">Билеты готовы ✓</button></div>` }
    if (cur.step === 'scan') { const w = cur.need != null ? cur.items[cur.need] : null; h += `<div class="lab">1. Нажимай на товары на ленте — пробивай. Фрукты сначала на весы</div><div class="row"><button class="k" id="wgh" ${w ? '' : 'disabled'}>⚖ Взвесить ${w ? w.e + ' ' + w.kg + ' кг' : ''}</button><button class="k go" id="okS">Всё пробито ✓</button></div>` }
    if (cur.step === 'pay') { const sum = Object.entries(cur.given).reduce((s, [b, q]) => s + b * q, 0); const need = cur.paid - cur.total;
      h += cur.card ? `<div class="lab">2. Оплата картой 💳</div><div class="row"><button class="k go" id="okP">Провести оплату ${cur.total} ₽</button></div>` :
        `<div class="lab">2. Покупатель дал <b style="color:var(--win)">${cur.paid} ₽</b>${!park || rk >= 1 ? ` · к оплате ${cur.total} ₽` : ''}${!park && rk >= 1 ? ` · сдача ${need} ₽` : ''}. Отсчитай сдачу:</div><div class="row">${[1000, 500, 100, 50, 10, 5, 1].map(b => `<button class="k bill" data-b="${b}">${b}</button>`).join('')}</div><div class="tray">Сдача: <b style="color:var(--win)">&nbsp;${sum} ₽</b>&nbsp;${Object.entries(cur.given).map(([b, q]) => `<i>${b}×${q}</i>`).join('')}</div><div class="row"><button class="k no" id="clr2">Сбросить</button><button class="k go" id="okP">Выдать сдачу ✓</button></div>` }
    el.innerHTML = h;
    el.querySelectorAll('[data-r]').forEach(b => b.onclick = () => { cur.give[b.dataset.r] = (cur.give[b.dataset.r] || 0) + 1; HAP('light'); panel() });
    el.querySelectorAll('[data-b]').forEach(b => b.onclick = () => { cur.given[b.dataset.b] = (cur.given[b.dataset.b] || 0) + 1; HAP('light'); panel() });
    $('clr') && ($('clr').onclick = () => { cur.give = {}; panel() }); $('clr2') && ($('clr2').onclick = () => { cur.given = {}; panel() });
    $('okT') && ($('okT').onclick = () => { const ok = Object.keys({ ...cur.want, ...cur.give }).every(k => (cur.want[k] || 0) === (cur.give[k] || 0)); if (!ok) { fail('Не те билеты!'); return } cur.step = 'pay'; panel() });
    $('wgh') && ($('wgh').onclick = () => { const w = cur.items[cur.need]; if (!w) return; w.weighed = true; const i = cur.need; cur.need = null; beep(); scan(i) });
    $('okS') && ($('okS').onclick = () => { if (cur.items.some(i => !i.scanned)) { pop('Не всё пробито', '#ff6b4a'); return } cur.step = 'pay'; panel() });
    $('okP') && ($('okP').onclick = () => { const sum = Object.entries(cur.given).reduce((s, [b, q]) => s + b * q, 0); if (!cur.card && sum !== cur.paid - cur.total) { fail('Неверная сдача! Нужно ' + (cur.paid - cur.total) + ' ₽'); return } done() }) }
  function fail(t) { pop(t, '#ff6b4a'); combo(false); HAP('heavy'); STATS.mist = (STATS.mist || 0) + 1; const b = bubble('😠', '#ff6b4a', '#000', 1.4); b.position.y = 4.6; cur.v.g.add(b); finish(false) }
  function done() { const sec = (performance.now() - cur.t0) / 1000, sp = Math.max(0, 6 - sec / 5); addPts((cur.vip || cur.disc ? 10 : 6) + Math.round(sp), cur.card ? '💳' : '✓'); combo(true); STATS.served = (STATS.served || 0) + 1; const tipC = Math.random() < .4 ? (rk >= 4 && park ? 2 : 1) : 0; if (tipC) { STATS.tips = (STATS.tips || 0) + tipC; setTimeout(() => pop('Чаевые! 💰'), 500) } const b = bubble('😊', '#5ee6b0', '#000', 1.4); b.position.y = 4.6; cur.v.g.add(b); play(cur.v.g, 'Victory', { once: true }); finish(true) }
  function finish(ok) { const v = cur.v; cur = null; belt.forEach(b => desk.remove(b.m)); belt = []; Q.shift(); v.leaving = true; LEAVE.push(v); addVisitor(); panel(); setTimeout(() => { if (RUN) newOrder() }, 900) }
  const LEAVE = [];
  setTimeout(newOrder, 1800); panel();
  tip(park ? 'Выдай билеты по заказу, затем отсчитай сдачу купюрами' : 'Нажимай на товары на ленте, затем прими оплату');
  addEventListener('pointerup', e => { if (!RUN || park) return; const o = tapObj(e, belt.map(b => b.m)); if (o) o.userData.tap() });
  return (t, dt) => {
    Q.forEach((v, i) => { const tz = (park ? 2.4 : 1.7) + i * 2.2, tx = park ? 0 : 1.5 - (i ? 0 : 0); const d = new THREE.Vector3(i ? 0 : tx, 0, tz).sub(v.g.position); d.y = 0; if (d.length() > .15) { v.g.position.addScaledVector(d.normalize(), Math.min(d.length(), 5 * dt)); v.g.rotation.y = Math.atan2(d.x, d.z); walk(v.g, t, true) } else { v.g.rotation.y = Math.PI; if (v.g.userData.anim !== 'Victory') walk(v.g, t, false) } });
    for (let i = LEAVE.length - 1; i >= 0; i--) { const g = LEAVE[i].g; g.position.x += (park ? 8 : -8) * dt; g.rotation.y = park ? Math.PI / 2 : -Math.PI / 2; walk(g, t, true); if (Math.abs(g.position.x) > 30) { scene.remove(g); dispose(g); LEAVE.splice(i, 1) } }
    if (wheel) { wheel.rotation.z = t * .15; cars.forEach(c => c.rotation.z = -t * .15) }
    scene.traverse(o => { if (o.name === 'kar') o.rotation.y = t * .8; if (o.name === 'coast') { const a = t * 1.2; o.position.set(Math.cos(a) * 8, 3.4 + Math.sin(a * 2) * 2.5, Math.sin(a) * 5); o.rotation.y = -a } });
    walk(me, t, false);
  };
}

// ---------- UI под работу ----------
if (JOB === 'football') document.body.insertAdjacentHTML('beforeend', `<div id="joy"><div id="knob"></div></div><div class="btns">${RK().r >= 1 ? '<button class="big m" id="bDash">💨 Рывок</button>' : ''}<button class="big" id="bPass">➡ Пас</button><button class="big r" id="bShoot">⚽ Удар</button></div>`);
if (JOB === 'park' || JOB === 'shop') document.body.insertAdjacentHTML('beforeend', '<div id="cash"></div>');
const STEP = JOB === 'hospital' ? Hospital() : JOB === 'football' ? Football() : Cashier(JOB);
$('ttl').innerHTML = $('ttl').innerHTML || (I.t + `<small>${RK().name}</small>`);

// ---------- интро, отсчёт, конец ----------
$('ico').textContent = I.ico; $('ititle').textContent = I.t; $('idesc').textContent = I.d;
$('perks').innerHTML = `<div class="perk">Твоя должность: <b style="color:var(--win)">${RK().name}</b></div>` + I.perks.map((p, i) => `<div class="perk ${i > RK().r ? 'lock' : ''}">${i > RK().r ? '🔒' : '✅'} ${p}${i > RK().r ? ' — с повышения' : ''}</div>`).join('');
$('back1').onclick = () => P.closeWork && P.closeWork();
$('start').onclick = async () => {
  const j = await P.call('shift/start'); if (!j || !j.ok) return;
  $('intro').classList.add('hidden'); $('cnt').classList.remove('hidden');
  for (const n of [3, 2, 1]) { $('count').textContent = n; HAP('light'); await new Promise(r => setTimeout(r, 650)) }
  $('count').textContent = 'Поехали!'; await new Promise(r => setTimeout(r, 450)); $('cnt').classList.add('hidden'); T0 = performance.now(); RUN = true;
  setTimeout(() => tip(null), 6000);
};
async function endShift() {
  RUN = false; const sc = Math.min(60, SCORE), r0 = RK().r;
  const j = await P.call('shift/end', { job: JOB, score: sc, combo: Math.round(BEST * 10) }); const R1 = RK();
  const lines = { healed: 'Вылечено', goals: 'Голы', assists: 'Голевые пасы', tackles: 'Отборы', served: 'Обслужено', tips: 'Чаевые', mist: 'Ошибки' };
  const promo = R1.r > r0; const pr = R1.next ? Math.min(100, (R1.x - R1.cur) / (R1.next - R1.cur) * 100) : 100;
  $('end').innerHTML = `<div style="font-size:56px">${promo ? '🎉' : '🏁'}</div><h1>${promo ? 'Повышение! Ты — ' + R1.name : 'Смена окончена'}</h1>
   <p>Очки: <b style="color:var(--win)">${SCORE}</b>${SCORE > 60 ? ' (в зачёт 60)' : ''} · лучшее комбо ×${BEST}</p>
   <p>${Object.entries(STATS).map(([k, v]) => (lines[k] || k) + ': ' + v).join(' · ') || ''}</p>
   ${j && j.msg ? `<p style="color:var(--mint)">${j.msg}</p>` : ''}
   <div class="perk">Должность: <b>${R1.name}</b>${R1.next ? ` · до повышения ${R1.next - R1.x} очков` : ' · максимум!'}<div class="bar" style="width:100%;margin-top:6px"><i style="width:${pr}%"></i></div></div>
   <button class="go1" id="again">🔁 Ещё смена</button><button class="go2" id="exit">⬅ В город</button>`;
  $('end').classList.remove('hidden'); $('again').onclick = () => location.reload(); $('exit').onclick = () => P.closeWork && P.closeWork();
}
// ---------- цикл ----------
let last = performance.now(); const t00 = last;
function loop(now) { requestAnimationFrame(loop); const dt = Math.min(.05, (now - last) / 1000), t = (now - t00) / 1000; last = now;
  STEP(t, dt); tickHeroes(dt);
  if (RUN) { const left = DUR - (now - T0) / 1000; $('time').textContent = Math.max(0, Math.ceil(left)); if (left <= 0) endShift() }
  R.render(scene, cam) }
preload(myLook()); requestAnimationFrame(loop);
