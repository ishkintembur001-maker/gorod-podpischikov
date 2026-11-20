// Арена кланов 3×3: бой в реальном времени, у каждого класса свои удары и умения
import * as THREE from './three.js';
import { makeHero, play, tickHeroes } from './hero.js';
import { attack, skillFx, tickFx, dmgText, burst, ringFx, pillar, STYLE } from './fx.js';
window.__WMODE = 'adv';
const P = parent, D = P.ARENA || null, $ = id => document.getElementById(id);
const WDMG = { w_knife: 1, w_club: 2, w_bow: 2, w_sword: 3, w_lbow: 4, w_shadow: 4, w_axe: 4, w_saber: 4, w_elf: 5, w_spear: 5, w_skard: 6, w_mace: 6, w_katana: 6, w_flame: 7, w_xbow: 7, w_halberd: 7, w_hunt: 8, w_ice: 8, w_runeaxe: 8, w_dragon: 9, w_staff: 9, w_legend: 10, w_moon: 10, w_thunder: 11, w_diamond: 12, w_void: 13, w_sun: 14 };
const ADEF = { ar_leather: .15, ar_ranger: .2, ar_chain: .25, ar_scale: .3, ar_plate: .35, ar_elf: .38, ar_knight: .4, ar_skard: .45, ar_shadow: .45, ar_gold: .5, ar_dragon: .55, ar_crystal: .6 };
const AHD = { ah_leather: .04, ah_iron: .07, ah_horned: .09, ah_knight: .12, ah_hood: .1, ah_dragon: .15, ah_crown: .18 }, SDD = { sd_wood: .05, sd_iron: .08, sd_tower: .12, sd_dragon: .16, sd_sun: .2 }, CLHP = { cl_brown: 10, cl_ranger: 20, cl_red: 30, cl_royal: 40, cl_flame: 50, cl_star: 60 };
// класс: [интервал удара, бонус урона, множитель получаемого урона, шанс уворота, шанс крита, множитель крита, скорость]
const CK = { warrior: [1.15, 2, .8, .05, .1, 1.8, 4.6], paladin: [1.3, 1, .65, .03, .08, 1.7, 4.2], berserk: [1.2, 4, 1.1, .03, .15, 2, 4.8], rogue: [.95, 1, 1, .2, .15, 2, 5.4], assassin: [.85, 1, 1, .15, .25, 3, 5.6], archer: [1.3, 2, 1, .1, .12, 1.8, 4.6], hunter: [1.3, 2, .95, .08, .12, 1.8, 4.6], mage: [1.6, 3, 1, .05, .1, 2, 4.2], shaman: [1.5, 2, .95, .05, .1, 1.8, 4.3], druid: [1.5, 2, .9, .07, .1, 1.8, 4.4] };
const AB = { mage: ['🔥', 'Огненный шар', 8], warrior: ['💥', 'Сокрушительный удар', 6], rogue: ['💨', 'Дымовая завеса', 15], archer: ['🏹', 'Град стрел', 10], paladin: ['✨', 'Святой свет', 18], druid: ['🌿', 'Корни', 14], berserk: ['😡', 'Ярость', 18], shaman: ['⚡', 'Цепная молния', 12], assassin: ['🗡', 'Удар из тени', 9], hunter: ['🪤', 'Капкан', 12] };

const R = new THREE.WebGLRenderer({ canvas: $('gl'), antialias: true }); R.setPixelRatio(Math.min(1.7, devicePixelRatio)); R.setSize(innerWidth, innerHeight); R.shadowMap.enabled = true; R.outputColorSpace = THREE.SRGBColorSpace; R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = .9;
const scene = new THREE.Scene(); scene.background = new THREE.Color('#2a1a3a'); scene.fog = new THREE.Fog('#2a1a3a', 60, 140);
const cam = new THREE.PerspectiveCamera(46, innerWidth / innerHeight, .3, 300);
addEventListener('resize', () => { R.setSize(innerWidth, innerHeight); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix() });
scene.add(new THREE.HemisphereLight('#ffd9b0', '#3a2a50', .9)); const sun = new THREE.DirectionalLight('#ffb070', 1.6); sun.position.set(-20, 30, 15); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -25, right: 25, top: 25, bottom: -25 }); scene.add(sun);
const M = c => new THREE.MeshLambertMaterial({ color: c });
{ const fl = new THREE.Mesh(new THREE.CircleGeometry(22, 48), M('#a8875a')); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; scene.add(fl);
  const ring = new THREE.Mesh(new THREE.RingGeometry(9.6, 10, 48), new THREE.MeshBasicMaterial({ color: '#e8c88a' })); ring.rotation.x = -Math.PI / 2; ring.position.y = .02; scene.add(ring);
  const st = new THREE.MeshLambertMaterial({ color: '#7a6a5a', flatShading: true });
  for (let i = 0; i < 36; i++) { const a = i / 36 * 6.283; const w = new THREE.Mesh(new THREE.BoxGeometry(4.2, 4 + (i % 3) * .6, 1.6), st); w.position.set(Math.sin(a) * 23, 2, Math.cos(a) * 23); w.rotation.y = a; w.castShadow = true; scene.add(w) }
  for (let r = 0; r < 3; r++) for (let i = 0; i < 60; i++) { const a = i / 60 * 6.283; const c = new THREE.Mesh(new THREE.BoxGeometry(.7, 1.1, .5), M(['#e8433a', '#3a8bff', '#ffd34d', '#2bb24c', '#b56aff', '#f4f4f4'][(i * 7 + r) % 6])); c.position.set(Math.sin(a) * (26 + r * 2), 4.6 + r * 1.6, Math.cos(a) * (26 + r * 2)); c.userData.ph = Math.random() * 6; c.name = 'fan'; scene.add(c) }
  for (const a of [.6, 2.2, 3.8, 5.4]) { const f = new THREE.Mesh(new THREE.ConeGeometry(.6, 1.6, 8), new THREE.MeshBasicMaterial({ color: '#ff8a2a' })); f.position.set(Math.sin(a) * 21.5, 5.2, Math.cos(a) * 21.5); scene.add(f); const l = new THREE.PointLight('#ff8a2a', 8, 18, 1.8); l.position.copy(f.position); scene.add(l) } }
const lbl = (t, col) => { const c = document.createElement('canvas'); c.width = 512; c.height = 112; const x = c.getContext('2d'); x.fillStyle = 'rgba(15,8,5,.8)'; x.beginPath(); x.roundRect(6, 8, 500, 96, 40); x.fill(); x.fillStyle = col; x.font = '900 44px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(t, 256, 46); const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false })); s.scale.set(2.3, .5, 1); s.renderOrder = 9; return s };
const hpBar = () => { const g = new THREE.Group(); const bg = new THREE.Mesh(new THREE.PlaneGeometry(1.8, .2), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: .6, depthTest: false })); const fg = new THREE.Mesh(new THREE.PlaneGeometry(1.76, .16), new THREE.MeshBasicMaterial({ color: '#3ae07a', depthTest: false })); fg.position.z = .001; g.add(bg, fg); g.renderOrder = 10; bg.renderOrder = fg.renderOrder = 10; g.userData.fg = fg; return g };

function stats(o, wear) {
  const lk = o.look || {}, own = wear || [lk.cw, lk.ar, lk.ah, lk.sd, lk.cl].filter(Boolean); let wd = 1, ar = 0, ah = 0, sd = 0, cl = 0;
  for (const k of own) { wd = Math.max(wd, WDMG[k] || 0); ar = Math.max(ar, ADEF[k] || 0); ah = Math.max(ah, AHD[k] || 0); sd = Math.max(sd, SDD[k] || 0); cl = Math.max(cl, CLHP[k] || 0) }
  const K = CK[o.cls] || CK.warrior, hu = o.hu || { str: o.str || 0, def: o.def || 0, hp: o.hp || 0, cd: 0 };
  return { dmg: (wd + K[1] + (hu.str || 0)) * (1 + (o.lvl || 1) * .015), def: Math.min(.8, ar + ah + sd), dr: 1 - .03 * (hu.def || 0), hp: 100 + 10 * (hu.hp || 0) + cl + (o.lvl || 1) * 3, cd: hu.cd || 0 };
}
const F = []; let ME = null, T0 = 0, END = false, LIMIT = 90;
function fighter(o, team, i, isMe) {
  const S = stats(o, isMe ? o.wear : null), K = CK[o.cls] || CK.warrior, m = makeHero({ ...(o.look || {}), __m: 'adv' }, !!isMe);
  const x = (i - 1) * 4.5, z = team ? -8 : 8; m.position.set(x, 0, z); m.rotation.y = team ? 0 : Math.PI; scene.add(m);
  const nm = lbl((STYLE[o.cls] ? '' : '') + (isMe ? '⭐ ' : '') + '@' + String(o.n).slice(0, 14), team ? '#ff8a6a' : isMe ? '#ffd34d' : '#7ae8a8'); nm.position.y = 3.4; m.add(nm);
  const hb = hpBar(); hb.position.y = 2.95; m.add(hb);
  const f = { o, team, m, hb, cls: o.cls, hp: S.hp, max: S.hp, dmg: S.dmg, def: S.def, dr: S.dr * K[2], dodge: K[3], crit: K[4], critM: K[5], spd: K[6], int: K[0], range: (STYLE[o.cls] || STYLE['']).range, na: 1 + Math.random(), nab: 3 + Math.random() * 4, cdk: 1 - .05 * S.cd, tgt: null, alive: true, stun: 0, rage: 0, smoke: 0, trap: 0, goto: null, isMe };
  play(m, 'Idle'); F.push(f); return f;
}
const ally = f => F.filter(g => g.alive && g.team === f.team), foes = f => F.filter(g => g.alive && g.team !== f.team);
const dist = (a, b) => Math.hypot(a.m.position.x - b.m.position.x, a.m.position.z - b.m.position.z);
const t = () => performance.now() / 1000;
function anim(f, n, ms = 650) { play(f.m, n, { once: true }); clearTimeout(f.at); f.at = setTimeout(() => { if (f.alive) play(f.m, f.moving ? 'Run' : 'Idle') }, ms) }
function damage(src, f, d, emo, noDodge) {
  if (!f.alive) return; const n = t();
  if (!noDodge && (Math.random() < f.dodge || f.smoke > n)) { dmgText(scene, f.m.position, 'уворот', '#9fd6ff'); anim(f, 'Roll', 600); return }
  let crit = false; if (src && Math.random() < src.crit) { d *= src.critM; crit = true } if (src && src.rage > n) d *= 2; if (f.trap > n) d *= 1.5;
  d = Math.max(1, d * (1 - f.def) * f.dr); d = Math.round(d * 10) / 10; f.hp -= d;
  dmgText(scene, f.m.position, (crit ? '💥' : '') + '-' + d, crit ? '#ff5a3a' : f.team ? '#ffd34d' : '#ff8a8a', crit); if (emo) burst(scene, f.m.position, 0xffd34d, .6);
  if (f.hp <= 0) { f.hp = 0; f.alive = false; clearTimeout(f.at); play(f.m, 'Death', { once: true }); f.hb.visible = false; setTimeout(() => f.m.children.forEach(c => c.isSprite && (c.material.opacity = .4)), 300) }
  else if (Math.random() < .5) anim(f, 'RecieveHit', 500);
  P.HAP && f.isMe && P.HAP('light');
}
function heal(f, v) { if (!f.alive) return; f.hp = Math.min(f.max, f.hp + v); dmgText(scene, f.m.position, '+' + Math.round(v), '#5ee6b0'); pillar(scene, f.m.position, 0xfff4a0) }
function skill(f) {
  const n = t(), E = foes(f), A = ally(f); if (!E.length) return false; let tg = f.tgt && f.tgt.alive ? f.tgt : E.sort((a, b) => dist(f, a) - dist(f, b))[0];
  const c = f.cls; f.nab = n + AB[c][2] * f.cdk; skillFx(scene, c, f.m, tg.m); anim(f, ['mage', 'archer', 'shaman', 'druid', 'hunter'].includes(c) ? 'Shoot_OneHanded' : 'SwordSlash', 700);
  f.m.rotation.y = Math.atan2(tg.m.position.x - f.m.position.x, tg.m.position.z - f.m.position.z); if (f.isMe || f.team) dmgText(scene, f.m.position, AB[c][0], '#e0c8ff');
  if (c === 'mage') setTimeout(() => { for (const e of E) if (e.alive && dist(e, tg) < 3.5) damage(f, e, f.dmg * (e === tg ? 3 : 1.5), 1, 1) }, 500);
  else if (c === 'warrior') { if (dist(f, tg) > 3) { const dx = tg.m.position.x - f.m.position.x, dz = tg.m.position.z - f.m.position.z, L = Math.hypot(dx, dz); f.m.position.x += dx / L * (L - 1.6); f.m.position.z += dz / L * (L - 1.6) } setTimeout(() => { damage(f, tg, f.dmg * 3, 1, 1); tg.stun = Math.max(tg.stun, t() + 1) }, 250) }
  else if (c === 'rogue') { f.smoke = n + 3.5; for (const e of E) if (e.tgt === f) e.tgt = null }
  else if (c === 'archer') setTimeout(() => { for (const e of E) if (e.alive && dist(e, tg) < 5) damage(f, e, f.dmg * 1.6, 1, 1) }, 450);
  else if (c === 'paladin') { const low = A.sort((a, b) => a.hp / a.max - b.hp / b.max)[0]; heal(low, low.max * .35); if (low !== f) heal(f, f.max * .15) }
  else if (c === 'druid') { for (const e of E) if (dist(f, e) < 9) { e.stun = Math.max(e.stun, n + 2.5); ringFx(scene, e.m.position, 0x5aff7a, 1) } heal(A.sort((a, b) => a.hp / a.max - b.hp / b.max)[0], 12) }
  else if (c === 'berserk') { f.rage = n + 6 }
  else if (c === 'shaman') E.sort((a, b) => dist(tg, a) - dist(tg, b)).slice(0, 3).forEach((e, i) => setTimeout(() => damage(f, e, f.dmg * 2, 1, 1), 150 + i * 120));
  else if (c === 'assassin') { const p = tg.m.position, dx = f.m.position.x - p.x, dz = f.m.position.z - p.z, L = Math.hypot(dx, dz) || 1; f.m.position.set(p.x - dx / L * 1.3, 0, p.z - dz / L * 1.3); f.m.rotation.y = Math.atan2(p.x - f.m.position.x, p.z - f.m.position.z); setTimeout(() => damage(f, tg, f.dmg * 4, 1, 1), 200) }
  else if (c === 'hunter') { tg.stun = Math.max(tg.stun, n + 3); tg.trap = n + 5; ringFx(scene, tg.m.position, 0xc89a4a, 1.2) }
  return true;
}
function think(f, dt) {
  const n = t(); if (n < T0) return; if (!f.alive || f.stun > n) { if (f.moving) { f.moving = false; play(f.m, 'Idle') } return }
  const E = foes(f); if (!E.length) return;
  if (!f.isMe && n > f.nab) { const lowAlly = ally(f).some(a => a.hp / a.max < .5); if (f.cls !== 'paladin' || lowAlly) if (skill(f)) return }
  if (!f.tgt || !f.tgt.alive || (!f.isMe && Math.random() < .004)) { f.tgt = E.filter(e => e.smoke <= n).sort((a, b) => (dist(f, a) + a.hp / a.max * 6) - (dist(f, b) + b.hp / b.max * 6))[0] || E[0] }
  const tg = f.tgt, d = dist(f, tg); let mv = null;
  if (f.goto) { mv = f.goto; if (Math.hypot(mv.x - f.m.position.x, mv.z - f.m.position.z) < .6) { f.goto = null; mv = null } }
  else if (d > f.range * .92) mv = tg.m.position;
  else if (f.range > 5 && d < 3.5) { const p = f.m.position; mv = new THREE.Vector3(p.x * 2 - tg.m.position.x, 0, p.z * 2 - tg.m.position.z) }
  if (mv) { const p = f.m.position, dx = mv.x - p.x, dz = mv.z - p.z, L = Math.hypot(dx, dz) || 1; let vx = dx / L, vz = dz / L;
    for (const o of F) if (o !== f && o.alive) { const ox = p.x - o.m.position.x, oz = p.z - o.m.position.z, ol = Math.hypot(ox, oz); if (ol < 1.4 && ol > .01) { vx += ox / ol * .8; vz += oz / ol * .8 } }
    const vl = Math.hypot(vx, vz) || 1; p.x += vx / vl * f.spd * dt; p.z += vz / vl * f.spd * dt; const r = Math.hypot(p.x, p.z); if (r > 20) { p.x *= 20 / r; p.z *= 20 / r }
    f.m.rotation.y = Math.atan2(vx, vz); if (!f.moving) { f.moving = true; play(f.m, 'Run') } return }
  if (f.moving) { f.moving = false; play(f.m, 'Idle') }
  if (n > f.na) { f.na = n + f.int * (.9 + Math.random() * .2); const src = f, T = tg; clearTimeout(f.at);
    attack(scene, f.m, tg.m, f.cls, () => damage(src, T, src.dmg), an => { play(f.m, an, { once: true }); f.at = setTimeout(() => { if (f.alive) play(f.m, 'Idle') }, 700) }) }
}
// ---------- ввод ----------
const ray = new THREE.Raycaster(), ptr = new THREE.Vector2(), ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); let sx = 0, sy = 0;
addEventListener('pointerdown', e => { sx = e.clientX; sy = e.clientY });
$('gl').addEventListener('pointerup', e => { if (!ME || !ME.alive || END || Math.hypot(e.clientX - sx, e.clientY - sy) > 10) return; ptr.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ptr, cam);
  let best = null, bd = 1e9; for (const f of foes(ME)) { const p = f.m.position.clone(); p.y = 1.2; const d = ray.ray.distanceToPoint(p); if (d < 1.6 && d < bd) { bd = d; best = f } }
  if (best) { ME.tgt = best; ME.goto = null; ringFx(scene, best.m.position, 0xff3a3a, .8); return }
  const p = new THREE.Vector3(); if (ray.ray.intersectPlane(ground, p)) { ME.goto = p; ringFx(scene, p, 0xffffff, .5) } });
$('ab').onclick = () => { if (!ME || !ME.alive || END || t() < ME.nab) return; if (skill(ME)) P.HAP && P.HAP('medium') };
// ---------- старт ----------
let camA = 0;
function hud() {
  const A = F.filter(f => !f.team), B = F.filter(f => f.team), s = a => a.reduce((x, f) => x + f.hp, 0) / a.reduce((x, f) => x + f.max, 0) * 100;
  $('tha').style.width = s(A) + '%'; $('thb').style.width = s(B) + '%'; const left = Math.max(0, Math.ceil(LIMIT - (t() - T0))); $('tmr').textContent = left;
  if (ME) { const c = Math.ceil(ME.nab - t()), a = AB[ME.cls]; $('ab').disabled = c > 0 || !ME.alive; $('ab').textContent = a ? (c > 0 ? a[0] + ' ' + c + ' с' : a[0] + ' ' + a[1]) : '—' }
  if (!END) { const ea = foes(ME).length === 0, aa = ally(ME).length === 0; if (ea || aa || left <= 0) finish(ea || (!aa && s(A) > s(B))) }
}
async function finish(win) {
  END = true; for (const f of F) if (f.alive) play(f.m, win === !f.team ? 'Victory' : 'Defeat', { once: false });
  const r = P.arenaEnd ? await P.arenaEnd(win) : null; const ov = $('ov'); ov.classList.remove('hidden'); ov.style.display = 'flex';
  const dmg = F.filter(f => !f.team).map(f => `<div><b>${f.alive ? '❤️' : '💀'}</b>@${String(f.o.n).slice(0, 10)}</div>`).join('');
  $('ovb').innerHTML = `<h2>${win ? '🏆 Победа!' : '💀 Поражение'}</h2><p>${win ? 'Твой отряд разбил клан «' + D.opp.name + '»' : 'Клан «' + D.opp.name + '» оказался сильнее. Прокачай героя, оружие и броню!'}</p><div class="rw">${dmg}</div><p style="color:#ffd34d">${r && r.msg ? r.msg : ''}</p><button id="okb">Вернуться в мир приключений</button>`;
  $('okb').onclick = () => P.closeArena && P.closeArena();
}
let last = performance.now();
function loop(now) { const dt = Math.min(.05, (now - last) / 1000); last = now; if (!END) for (const f of F) think(f, dt); tickHeroes(dt); tickFx(dt);
  for (const f of F) { f.hb.userData.fg.scale.x = Math.max(.001, f.hp / f.max); f.hb.userData.fg.position.x = -.88 * (1 - f.hp / f.max); f.hb.userData.fg.material.color.set(f.hp / f.max > .5 ? '#3ae07a' : f.hp / f.max > .25 ? '#ffc632' : '#ff3a3a'); f.hb.quaternion.copy(cam.quaternion) }
  scene.traverse(o => { if (o.name === 'fan') o.position.y += Math.sin(now / 160 + o.userData.ph) * .01 });
  const c = ME && ME.alive ? ME.m.position : new THREE.Vector3(); camA += dt * .03; cam.position.set(c.x * .5 + Math.sin(camA) * 4, 20, c.z * .5 + 22); cam.lookAt(c.x * .5, 0, c.z * .5 - 2); R.render(scene, cam); requestAnimationFrame(loop) }
(function start() {
  if (!D) { $('load').textContent = 'Нет данных боя'; return }
  $('tna').textContent = (D.mine.emo || '🗡') + ' ' + D.mine.name; $('tnb').textContent = D.opp.emo + ' ' + D.opp.name;
  ME = fighter(D.me, 0, 1, true); D.al.forEach((o, i) => fighter(o, 0, i ? 2 : 0)); D.en.forEach((o, i) => fighter(o, 1, i));
  $('load').remove(); T0 = t() + 2.5; for (const f of F) { f.na = T0 + Math.random(); f.nab = T0 + 2 + Math.random() * 5 } ME.nab = T0; LIMIT = 92.5;
  setInterval(hud, 200); requestAnimationFrame(loop);
  const k = document.createElement('div'); k.style.cssText = 'position:fixed;inset:0;z-index:8;display:flex;align-items:center;justify-content:center;font:900 64px sans-serif;color:#ffd34d;text-shadow:0 4px 18px #000;pointer-events:none'; document.body.appendChild(k);
  let n = 3; const tk = () => { k.textContent = n > 0 ? n : '⚔️ В БОЙ!'; P.HAP && P.HAP('light'); if (n-- < 0) k.remove(); else setTimeout(tk, n < 0 ? 700 : 800) }; tk();
})();
