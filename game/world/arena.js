// Арена кланов 3×3: бой в реальном времени, у каждого класса свои удары и умения
import * as THREE from './three.js';
import { makeHero, play, tickHeroes } from './hero.js';
import { attack, skillFx, tickFx, dmgText, burst, ringFx, pillar, STYLE } from './fx.js';
window.__WMODE = 'adv';
const P = parent, D = P.ARENA || null, $ = id => document.getElementById(id);
const WDMG = { w_knife: 1, w_club: 2, w_bow: 2, w_sword: 3, w_lbow: 4, w_shadow: 4, w_axe: 4, w_saber: 4, w_elf: 5, w_spear: 5, w_skard: 6, w_mace: 6, w_katana: 6, w_flame: 7, w_xbow: 7, w_halberd: 7, w_hunt: 8, w_ice: 8, w_runeaxe: 8, w_dragon: 9, w_staff: 9, w_legend: 10, w_moon: 10, w_thunder: 11, w_diamond: 12, w_void: 13, w_sun: 14, w_twin: 7, w_trident: 9, w_warhammer: 9, w_scythe: 10, w_frostbow: 13, w_inferno: 15, w_starstaff: 15, w_soul: 17, x_hero: 14, x_elite: 16, x_star: 18, x_crown: 20, x_champ: 24 };
const ADEF = { ar_leather: .15, ar_ranger: .2, ar_chain: .25, ar_scale: .3, ar_plate: .35, ar_elf: .38, ar_knight: .4, ar_skard: .45, ar_shadow: .45, ar_gold: .5, ar_dragon: .55, ar_crystal: .6 };
const AHD = { ah_leather: .04, ah_iron: .07, ah_horned: .09, ah_knight: .12, ah_hood: .1, ah_dragon: .15, ah_crown: .18 }, SDD = { sd_wood: .05, sd_iron: .08, sd_tower: .12, sd_dragon: .16, sd_sun: .2 }, CLHP = { cl_brown: 10, cl_ranger: 20, cl_red: 30, cl_royal: 40, cl_flame: 50, cl_star: 60 };
// класс: [интервал удара, бонус урона, множитель получаемого урона, шанс уворота, шанс крита, множитель крита, скорость]
const CK = { warrior: [1.15, 2, .8, .05, .1, 1.8, 4.6], paladin: [1.3, 1, .65, .03, .08, 1.7, 4.2], berserk: [1.2, 4, 1.1, .03, .15, 2, 4.8], rogue: [.95, 1, 1, .2, .15, 2, 5.4], assassin: [.85, 1, 1, .15, .25, 3, 5.6], archer: [1.3, 2, 1, .1, .12, 1.8, 4.6], hunter: [1.3, 2, .95, .08, .12, 1.8, 4.6], mage: [1.6, 3, 1, .05, .1, 2, 4.2], shaman: [1.5, 2, .95, .05, .1, 1.8, 4.3], druid: [1.5, 2, .9, .07, .1, 1.8, 4.4] };
const AB = { mage: ['🔥', 'Огненный шар', 8], warrior: ['💥', 'Сокрушительный удар', 6], rogue: ['💨', 'Дымовая завеса', 15], archer: ['🏹', 'Град стрел', 10], paladin: ['✨', 'Святой свет', 18], druid: ['🌿', 'Корни', 14], berserk: ['😡', 'Ярость', 18], shaman: ['⚡', 'Цепная молния', 12], assassin: ['🗡', 'Удар из тени', 9], hunter: ['🪤', 'Капкан', 12] };

const R = new THREE.WebGLRenderer({ canvas: $('gl'), antialias: true }); R.setPixelRatio(Math.min(1.8, devicePixelRatio)); R.setSize(innerWidth, innerHeight); R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap; R.outputColorSpace = THREE.SRGBColorSpace; R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.05;
const scene = new THREE.Scene(); scene.fog = new THREE.Fog('#4a2a3a', 70, 170);
const cam = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, .3, 400);
addEventListener('resize', () => { R.setSize(innerWidth, innerHeight); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix() });
const CV = (w, h, f) => { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t };
const SM = (o) => new THREE.MeshStandardMaterial({ roughness: .85, metalness: 0, ...o });
const M = c => SM({ color: c });
const TCOL = ['#3ae07a', '#ff4a3a'];
// небо: закатный купол
scene.add(new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), new THREE.MeshBasicMaterial({ side: THREE.BackSide, fog: false, map: CV(8, 256, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#1a1040'); g.addColorStop(.35, '#5a2a6a'); g.addColorStop(.48, '#ff8a4a'); g.addColorStop(.52, '#ffc07a'); g.addColorStop(1, '#2a1a20'); x.fillStyle = g; x.fillRect(0, 0, w, h) }) })));
scene.add(new THREE.HemisphereLight('#ffd9b0', '#4a2a50', .75));
const sun = new THREE.DirectionalLight('#ffc890', 2.2); sun.position.set(-22, 34, 18); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0005; Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, far: 90 }); scene.add(sun);
const FANS = [], TORCH = [];
{ // песок с граблями, эмблема в центре
  const sand = CV(1024, 1024, (x, w, h) => { x.fillStyle = '#c9a26a'; x.fillRect(0, 0, w, h); for (let i = 0; i < 26000; i++) { x.fillStyle = `rgba(${Math.random() < .5 ? '90,60,30' : '255,230,180'},${Math.random() * .18})`; x.fillRect(Math.random() * w, Math.random() * h, 2, 2) }
    x.strokeStyle = 'rgba(110,75,40,.18)'; x.lineWidth = 3; for (let r = 60; r < 512; r += 14) { x.beginPath(); x.arc(512, 512, r, 0, 6.283); x.stroke() }
    x.fillStyle = 'rgba(120,70,35,.55)'; x.beginPath(); x.arc(512, 512, 150, 0, 6.283); x.fill(); x.fillStyle = 'rgba(58,224,122,.35)'; x.beginPath(); x.arc(512, 512, 136, 0, Math.PI); x.fill(); x.fillStyle = 'rgba(255,74,58,.35)'; x.beginPath(); x.arc(512, 512, 136, Math.PI, 6.283); x.fill();
    x.strokeStyle = '#ffd34d'; x.lineWidth = 8; x.beginPath(); x.arc(512, 512, 150, 0, 6.283); x.stroke(); x.font = '150px serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('⚔️', 512, 520);
    x.strokeStyle = 'rgba(255,240,200,.5)'; x.lineWidth = 6; x.setLineDash([24, 18]); x.beginPath(); x.arc(512, 512, 440, 0, 6.283); x.stroke() });
  const fl = new THREE.Mesh(new THREE.CircleGeometry(23, 96), SM({ map: sand, roughness: 1 })); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; scene.add(fl);
  // каменная стена арены
  const brick = CV(1024, 128, (x, w, h) => { x.fillStyle = '#6a5a4a'; x.fillRect(0, 0, w, h); for (let r = 0; r < 4; r++) for (let c = 0; c < 24; c++) { const o = r % 2 ? 21 : 0; x.fillStyle = `hsl(28,${14 + Math.random() * 10}%,${30 + Math.random() * 14}%)`; x.fillRect(c * 43 + o + 2, r * 32 + 2, 39, 28) } });
  brick.wrapS = THREE.RepeatWrapping; brick.repeat.set(4, 1);
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(23, 23, 3.4, 96, 1, true), SM({ map: brick, side: THREE.DoubleSide })); wall.position.y = 1.7; wall.receiveShadow = true; scene.add(wall);
  const cap = new THREE.Mesh(new THREE.TorusGeometry(23.2, .35, 8, 96), M('#d8c8a8')); cap.rotation.x = Math.PI / 2; cap.position.y = 3.45; scene.add(cap);
  // трибуны (ступени)
  const pts = [new THREE.Vector2(23.4, 3.4)]; let r = 23.4, y = 3.4; for (let i = 0; i < 7; i++) { r += 2.1; pts.push(new THREE.Vector2(r - 2.1, y + 1.05), new THREE.Vector2(r, y + 1.05)); y += 1.05 } pts.push(new THREE.Vector2(r + 1, y), new THREE.Vector2(r + 1, 0));
  const st = new THREE.Mesh(new THREE.LatheGeometry(pts, 96), SM({ color: '#9a8670', side: THREE.DoubleSide, flatShading: true })); st.receiveShadow = true; scene.add(st);
  // внешняя колоннада с арками
  const colM = SM({ color: '#e2d2b2' }); const outer = r + 1.2;
  for (let i = 0; i < 40; i++) { const a = i / 40 * 6.283; const c = new THREE.Mesh(new THREE.CylinderGeometry(.55, .65, 7, 12), colM); c.position.set(Math.sin(a) * outer, y + 3.5, Math.cos(a) * outer); c.castShadow = true; scene.add(c) }
  const top = new THREE.Mesh(new THREE.CylinderGeometry(outer + .8, outer + .8, 1.4, 96, 1, true), SM({ color: '#d2c09e', side: THREE.DoubleSide })); top.position.y = y + 7.6; scene.add(top);
  // зрители (инстансы)
  const N = 7 * 110, body = new THREE.InstancedMesh(new THREE.BoxGeometry(.62, .8, .45), SM({ roughness: .9 }), N), head = new THREE.InstancedMesh(new THREE.SphereGeometry(.27, 10, 8), SM({ roughness: .8 }), N);
  const col = new THREE.Color(), dm = new THREE.Object3D(); const SK = ['#f0c8a0', '#d8a878', '#a87048', '#6a4428', '#ffdcb8'];
  let k = 0; for (let t = 0; t < 7; t++) for (let i = 0; i < 110; i++) { const a = (i + (t % 2) * .5) / 110 * 6.283, rr = 24.4 + t * 2.1 + .2, yy = 3.4 + (t + 1) * 1.05; if (Math.random() < .12) continue;
    FANS.push({ a, rr, yy, ph: Math.random() * 6.28, k }); dm.position.set(Math.sin(a) * rr, yy + .4, Math.cos(a) * rr); dm.rotation.y = a + Math.PI; dm.updateMatrix(); body.setMatrixAt(k, dm.matrix);
    col.set((Math.cos(a) > 0 ? ['#2bb24c', '#3ae07a', '#1a8a4a', '#f4f4f4', '#3a8bff'] : ['#e8433a', '#ff6a4a', '#b8281a', '#f4f4f4', '#ffd34d'])[(i * 7 + t * 3) % 5]); body.setColorAt(k, col);
    dm.position.y = yy + 1.05; dm.updateMatrix(); head.setMatrixAt(k, dm.matrix); col.set(SK[(i + t) % 5]); head.setColorAt(k, col); k++ }
  body.count = head.count = k; body.castShadow = true; scene.add(body, head); FANS.body = body; FANS.head = head;
  // ворота команд + знамёна
  for (const tm of [0, 1]) { const z = tm ? -23 : 23, g = new THREE.Group(); g.position.set(0, 0, z); scene.add(g);
    const fr = SM({ color: '#4a3a2a' }); for (const sx of [-2.6, 2.6]) { const p = new THREE.Mesh(new THREE.BoxGeometry(1, 5.4, 1.4), SM({ color: '#e2d2b2' })); p.position.set(sx, 2.7, 0); p.castShadow = true; g.add(p) }
    const lt = new THREE.Mesh(new THREE.BoxGeometry(6.4, 1, 1.5), SM({ color: '#e2d2b2' })); lt.position.y = 5.6; g.add(lt);
    const dr = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 4.8), SM({ color: '#1a100a' })); dr.position.set(0, 2.4, tm ? -.2 : .2); dr.rotation.y = tm ? 0 : Math.PI; g.add(dr);
    for (let b = 0; b < 6; b++) { const bx = new THREE.Mesh(new THREE.BoxGeometry(.16, 4.6, .16), fr); bx.position.set(-1.75 + b * .7, 2.4, tm ? .1 : -.1); g.add(bx) }
    const bn = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 4.2), SM({ side: THREE.DoubleSide, map: CV(128, 168, (x, w, h) => { x.fillStyle = TCOL[tm]; x.fillRect(0, 0, w, h - 20); x.beginPath(); x.moveTo(0, h - 20); x.lineTo(w / 2, h); x.lineTo(w, h - 20); x.fill(); x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(0, 0, w, 10); x.font = '64px serif'; x.textAlign = 'center'; x.fillText(tm ? '🔥' : '🛡', w / 2, 96) }) }));
    bn.position.set(0, 8.4, tm ? -1.4 : 1.4); bn.rotation.y = tm ? 0 : Math.PI; bn.userData.ph = tm * 2; g.add(bn); TORCH.push({ flag: bn }) }
  // флаги на колоннах
  for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283 + .1, tm = Math.cos(a) > 0 ? 0 : 1; const f = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.6, 4, 1), SM({ color: TCOL[tm], side: THREE.DoubleSide })); f.position.set(Math.sin(a) * (outer + .2), y + 10, Math.cos(a) * (outer + .2)); f.rotation.y = a; f.userData.ph = i; scene.add(f); TORCH.push({ flag: f });
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 4, 6), M('#5a4a3a')); pole.position.set(f.position.x, y + 9.6, f.position.z); scene.add(pole) }
  // факелы с мерцанием
  for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283 + .39, x = Math.sin(a) * 22.6, z = Math.cos(a) * 22.6; const st2 = new THREE.Mesh(new THREE.CylinderGeometry(.12, .16, 1.4, 8), M('#3a2a1a')); st2.position.set(x, 3.9, z); scene.add(st2);
    const fl2 = new THREE.Mesh(new THREE.ConeGeometry(.32, .9, 10), new THREE.MeshBasicMaterial({ color: '#ffb03a', transparent: true, opacity: .95 })); fl2.position.set(x, 4.9, z); scene.add(fl2);
    const L = i % 2 ? null : new THREE.PointLight('#ff8a2a', 22, 16, 1.6); if (L) { L.position.set(x, 5, z); scene.add(L) } TORCH.push({ fl: fl2, L, ph: i }) }
  // пыль в воздухе
  const dg = new THREE.BufferGeometry(), dp = new Float32Array(300 * 3); for (let i = 0; i < 300; i++) { const a = Math.random() * 6.28, rr = Math.random() * 21; dp[i * 3] = Math.sin(a) * rr; dp[i * 3 + 1] = Math.random() * 6; dp[i * 3 + 2] = Math.cos(a) * rr }
  dg.setAttribute('position', new THREE.BufferAttribute(dp, 3)); const dust = new THREE.Points(dg, new THREE.PointsMaterial({ color: '#ffe0b0', size: .09, transparent: true, opacity: .55, depthWrite: false })); scene.add(dust); TORCH.dust = dust;
}
const lbl = (t, col) => { const c = document.createElement('canvas'); c.width = 512; c.height = 112; const x = c.getContext('2d'); x.fillStyle = 'rgba(15,8,5,.8)'; x.beginPath(); x.roundRect(6, 8, 500, 96, 40); x.fill(); x.fillStyle = col; x.font = '900 44px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(t, 256, 46); const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false })); s.scale.set(2.3, .5, 1); s.renderOrder = 9; return s };
const hpBar = () => { const g = new THREE.Group(); const bg = new THREE.Mesh(new THREE.PlaneGeometry(1.8, .2), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: .6, depthTest: false })); const fg = new THREE.Mesh(new THREE.PlaneGeometry(1.76, .16), new THREE.MeshBasicMaterial({ color: '#3ae07a', depthTest: false })); fg.position.z = .001; g.add(bg, fg); g.renderOrder = 10; bg.renderOrder = fg.renderOrder = 10; g.userData.fg = fg; return g };

function stats(o, wear) {
  const lk = o.look || {}, own = wear || [lk.cw, lk.ar, lk.ah, lk.sd, lk.cl].filter(Boolean); let wd = 1, ar = 0, ah = 0, sd = 0, cl = 0;
  for (const k of own) { wd = Math.max(wd, WDMG[k] || 0); ar = Math.max(ar, ADEF[k] || 0); ah = Math.max(ah, AHD[k] || 0); sd = Math.max(sd, SDD[k] || 0); cl = Math.max(cl, CLHP[k] || 0) }
  const K = CK[o.cls] || CK.warrior, hu = o.hu || { str: o.str || 0, def: o.def || 0, hp: o.hp || 0, cd: 0 };
  return { dmg: (wd + K[1] + (hu.str || 0)) * (1 + (o.lvl || 1) * .015), def: Math.min(.8, ar + ah + sd), dr: 1 - .03 * (hu.def || 0), hp: 100 + 10 * (hu.hp || 0) + cl + (o.lvl || 1) * 3, cd: hu.cd || 0 };
}
const F = []; let ME = null, T0 = 0, END = false, LIMIT = 90, TS = 1, TSU = 0, SHK = 0, FOCUS = false, KA = 0, KB = 0;
const RANKS = [[0, '🪵', 'Новичок'], [100, '🥉', 'Бронза'], [300, '🥈', 'Серебро'], [600, '🥇', 'Золото'], [1000, '💠', 'Платина'], [1500, '💎', 'Алмаз'], [2200, '👑', 'Легенда']];
function rankOf(r) { let i = 0; while (i < RANKS.length - 1 && r >= RANKS[i + 1][0]) i++; return [i, ...RANKS[i]] }
const CEMO = { warrior: '⚔️', paladin: '🛡', berserk: '🪓', rogue: '🗡', assassin: '🥷', archer: '🏹', hunter: '🪤', mage: '🔮', shaman: '⚡', druid: '🌿' };
const CNAME = { warrior: 'Воин', paladin: 'Паладин', berserk: 'Берсерк', rogue: 'Разбойник', assassin: 'Ассасин', archer: 'Лучник', hunter: 'Охотник', mage: 'Маг', shaman: 'Шаман', druid: 'Друид' };
const footRing = c => { const g = new THREE.Mesh(new THREE.RingGeometry(.62, .82, 32), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: .85, depthWrite: false })); g.rotation.x = -Math.PI / 2; g.position.y = .04; return g };
function fighter(o, team, i, isMe) {
  const S = stats(o, isMe ? o.wear : null), K = CK[o.cls] || CK.warrior, m = makeHero({ ...(o.look || {}), __m: 'adv' }, !!isMe);
  const x = (i - 1) * 4.5, z = team ? -11 : 11; m.position.set(x, 0, z); m.rotation.y = team ? 0 : Math.PI; scene.add(m); m.traverse(c => { if (c.isMesh) c.castShadow = true });
  const nm = lbl((isMe ? '⭐ ' : (CEMO[o.cls] || '') + ' ') + '@' + String(o.n).slice(0, 14), team ? '#ff8a6a' : isMe ? '#ffd34d' : '#7ae8a8'); nm.position.y = 3.4; m.add(nm);
  const hb = hpBar(); hb.position.y = 2.95; m.add(hb); m.add(footRing(isMe ? '#ffd34d' : TCOL[team]));
  const hu = o.hu || {}, rb = isMe ? 1 + .02 * rankOf(o.ar || 0)[0] : 1, hpX = (isMe ? 1.3 : 1) * rb, dX = (team ? .8 : 1) * rb; const f = { o, team, m, hb, cls: o.cls, hp: S.hp * hpX, max: S.hp * hpX, dmg: S.dmg * dX, def: S.def, dr: S.dr * K[2], dodge: K[3] + .015 * (hu.agi || 0), crit: K[4] + .02 * (hu.crit || 0), critM: K[5], spd: K[6] * (1 + .03 * (hu.agi || 0)), vamp: .015 * (hu.vamp || 0), int: K[0], range: (STYLE[o.cls] || STYLE['']).range, na: 1 + Math.random(), nab: 3 + Math.random() * 4, cdk: 1 - .05 * S.cd, tgt: null, alive: true, stun: 0, rage: 0, smoke: 0, trap: 0, roll: 0, nroll: 0, goto: null, isMe, dealt: 0, kills: 0 };
  play(m, 'Idle'); F.push(f); return f;
}
const ally = f => F.filter(g => g.alive && g.team === f.team), foes = f => F.filter(g => g.alive && g.team !== f.team);
const dist = (a, b) => Math.hypot(a.m.position.x - b.m.position.x, a.m.position.z - b.m.position.z);
const t = () => performance.now() / 1000;
const feedMsg = h => { const d = document.createElement('div'); d.innerHTML = h; $('feed').prepend(d); setTimeout(() => d.remove(), 3000); while ($('feed').children.length > 3) $('feed').lastChild.remove() };
function anim(f, n, ms = 650) { play(f.m, n, { once: true }); clearTimeout(f.at); f.at = setTimeout(() => { if (f.alive) play(f.m, f.moving ? 'Run' : 'Idle') }, ms) }
function damage(src, f, d, emo, noDodge) {
  if (!f.alive) return; const n = t();
  if (f.roll > n || (!noDodge && (Math.random() < f.dodge || f.smoke > n))) { dmgText(scene, f.m.position, 'уворот', '#9fd6ff'); if (f.roll <= n) anim(f, 'Roll', 600); return }
  let crit = false; if (src && Math.random() < src.crit) { d *= src.critM; crit = true } if (src && src.rage > n) d *= 2; if (f.trap > n) d *= 1.5;
  d = Math.max(1, d * (1 - f.def) * f.dr); d = Math.round(d * 10) / 10; f.hp -= d; if (src) { src.dealt += d; if (src.vamp && src.alive) src.hp = Math.min(src.max, src.hp + d * src.vamp) }
  dmgText(scene, f.m.position, (crit ? '💥' : '') + '-' + d, crit ? '#ff5a3a' : f.team ? '#ffd34d' : '#ff8a8a', crit); if (emo) burst(scene, f.m.position, 0xffd34d, .6);
  if (f.isMe) { SHK = Math.min(.4, SHK + (crit ? .3 : .12)); $('flash').style.boxShadow = 'inset 0 0 90px rgba(255,0,0,.32)'; setTimeout(() => $('flash').style.boxShadow = 'inset 0 0 90px rgba(255,0,0,0)', 160) }
  else if (src && src.isMe && crit) SHK = Math.min(.2, SHK + .1);
  if (f.hp <= 0) { f.hp = 0; f.alive = false; clearTimeout(f.at); play(f.m, 'Death', { once: true }); f.hb.visible = false; setTimeout(() => f.m.children.forEach(c => c.isSprite && (c.material.opacity = .4)), 300);
    if (src) src.kills++; if (f.team) KA++; else KB++; ringFx(scene, f.m.position, f.team ? 0x3ae07a : 0xff4a3a, 2.5); burst(scene, f.m.position, 0xffffff, 1.6);
    feedMsg(`<span style="color:${src && !src.team ? '#7ae8a8' : '#ff8a6a'}">@${src ? String(src.o.n).slice(0, 12) : '?'}</span> ☠️ <span style="color:${f.team ? '#ff8a6a' : '#7ae8a8'}">@${String(f.o.n).slice(0, 12)}</span>`);
    TS = .3; TSU = performance.now() + 700; P.HAP && P.HAP(src && src.isMe ? 'heavy' : 'medium');
    if (f === ME) feedMsg('💀 Ты пал — союзники ещё сражаются!') }
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
  if (f.isMe) return meThink(f, dt, n, E);
  if (FOCUS && f.team === 0 && ME && ME.tgt && ME.tgt.alive) f.tgt = ME.tgt;
  if (!f.isMe && S2[f.cls] && n > (f.n2 || T0 + 4) && Math.random() < .02) { if (skill2(f)) return }
  if (!f.isMe && n > f.nab) { const lowAlly = ally(f).some(a => a.hp / a.max < .5); if (f.cls !== 'paladin' || lowAlly) if (skill(f)) return }
  if (!f.tgt || !f.tgt.alive || (!f.isMe && Math.random() < .004)) { f.tgt = E.filter(e => e.smoke <= n).sort((a, b) => (dist(f, a) + a.hp / a.max * 6) - (dist(f, b) + b.hp / b.max * 6))[0] || E[0] }
  const tg = f.tgt, d = dist(f, tg); let mv = null;
  if (f.goto) { mv = f.goto; if (Math.hypot(mv.x - f.m.position.x, mv.z - f.m.position.z) < .6) { f.goto = null; mv = null } }
  else if (d > f.range * .92) mv = tg.m.position;
  else if (f.range > 5 && d < 3.5) { const p = f.m.position; mv = new THREE.Vector3(p.x * 2 - tg.m.position.x, 0, p.z * 2 - tg.m.position.z) }
  if (mv) { const p = f.m.position, dx = mv.x - p.x, dz = mv.z - p.z, L = Math.hypot(dx, dz) || 1; let vx = dx / L, vz = dz / L;
    for (const o of F) if (o !== f && o.alive) { const ox = p.x - o.m.position.x, oz = p.z - o.m.position.z, ol = Math.hypot(ox, oz); if (ol < 1.4 && ol > .01) { vx += ox / ol * .8; vz += oz / ol * .8 } }
    const vl = Math.hypot(vx, vz) || 1; p.x += vx / vl * f.spd * dt; p.z += vz / vl * f.spd * dt; const r = Math.hypot(p.x, p.z); if (r > 21) { p.x *= 21 / r; p.z *= 21 / r }
    f.m.rotation.y = Math.atan2(vx, vz); if (!f.moving) { f.moving = true; play(f.m, 'Run') } return }
  if (f.moving) { f.moving = false; play(f.m, 'Idle') }
  if (n > f.na) { f.na = n + f.int * (.9 + Math.random() * .2); const src = f, T = tg; clearTimeout(f.at);
    attack(scene, f.m, tg.m, f.cls, () => damage(src, T, src.dmg), an => { play(f.m, an, { once: true }); f.at = setTimeout(() => { if (f.alive) play(f.m, 'Idle') }, 700) }) }
}
const S2 = { warrior: ['🌀', 'Вихрь', 10], paladin: ['🔨', 'Молот', 9], berserk: ['🪓', 'Бросок топора', 8], rogue: ['🔪', 'Кинжалы', 7], assassin: ['☠️', 'Яд', 10], archer: ['🎯', 'Меткий выстрел', 8], hunter: ['🏹', 'Двойной выстрел', 7], mage: ['❄️', 'Ледяная стрела', 7], shaman: ['🌪', 'Смерч', 12], druid: ['🍃', 'Исцеление', 12] };
function skill2(f) { const n = t(), c = f.cls, E = foes(f); if (!E.length || !S2[c]) return false; const tg = f.tgt && f.tgt.alive ? f.tgt : E.sort((a, b) => dist(f, a) - dist(f, b))[0]; f.n2 = n + S2[c][2] * f.cdk; dmgText(scene, f.m.position, S2[c][0], '#bfe8ff');
  const pl = an => anim(f, an, 700), near = r => E.filter(e => dist(f, e) < r);
  if (c === 'warrior') { pl('SwordSlash'); ringFx(scene, f.m.position, 0xffe08a, 2); for (const e of near(4.5)) damage(f, e, f.dmg * 1.5, 1, 1) }
  else if (c === 'paladin') { pl('SwordSlash'); setTimeout(() => { burst(scene, tg.m.position, 0xfff4a0, 1.6); damage(f, tg, f.dmg * 2, 1, 1); tg.stun = Math.max(tg.stun, t() + 2) }, 250) }
  else if (c === 'berserk') attack(scene, f.m, tg.m, 'axe', () => damage(f, tg, f.dmg * 2, 1, 1), an => pl(an));
  else if (c === 'rogue') { pl('SwordSlash'); for (let i = 0; i < 3; i++) setTimeout(() => damage(f, tg, f.dmg * .8, 1, 1), 150 + i * 170) }
  else if (c === 'assassin') { pl('SwordSlash'); for (let i = 1; i <= 5; i++) setTimeout(() => tg.alive && damage(f, tg, f.dmg * .6, 1, 1), i * 1000) }
  else if (c === 'archer') attack(scene, f.m, tg.m, 'archer', () => damage(f, tg, f.dmg * 3.5, 1, 1), an => pl(an));
  else if (c === 'hunter') { attack(scene, f.m, tg.m, 'hunter', () => damage(f, tg, f.dmg * 1.5, 1, 1), an => pl(an)); setTimeout(() => tg.alive && attack(scene, f.m, tg.m, 'hunter', () => damage(f, tg, f.dmg * 1.5, 1, 1)), 260) }
  else if (c === 'mage') attack(scene, f.m, tg.m, 'ice', () => { damage(f, tg, f.dmg * 2, 1, 1); tg.stun = Math.max(tg.stun, t() + 1.5) }, an => pl(an));
  else if (c === 'shaman') { pl('Shoot_OneHanded'); ringFx(scene, f.m.position, 0x9ae8ff, 3); for (const e of near(7)) { damage(f, e, f.dmg * 1.2, 1, 1); const dx = e.m.position.x - f.m.position.x, dz = e.m.position.z - f.m.position.z, L = Math.hypot(dx, dz) || 1; e.m.position.x += dx / L * 3; e.m.position.z += dz / L * 3 } }
  else if (c === 'druid') { pl('Shoot_OneHanded'); heal(f, 30) }
  return true }
// ---------- управление игроком ----------
const IN = { x: 0, z: 0, atk: false, atkQ: 0 }, KEYS = {};
function stepMove(f, vx, vz, spd, dt) { const p = f.m.position; for (const o of F) if (o !== f && o.alive) { const ox = p.x - o.m.position.x, oz = p.z - o.m.position.z, ol = Math.hypot(ox, oz); if (ol < 1.2 && ol > .01) { p.x += ox / ol * (1.2 - ol) * .5; p.z += oz / ol * (1.2 - ol) * .5 } }
  p.x += vx * spd * dt; p.z += vz * spd * dt; const r = Math.hypot(p.x, p.z); if (r > 21) { p.x *= 21 / r; p.z *= 21 / r } }
function autoTarget(f, E) { const fx = Math.sin(f.m.rotation.y), fz = Math.cos(f.m.rotation.y);
  return E.filter(e => e.smoke <= t()).sort((a, b) => { const s = e => { const dx = e.m.position.x - f.m.position.x, dz = e.m.position.z - f.m.position.z, d = Math.hypot(dx, dz) || 1; return d - ((dx * fx + dz * fz) / d) * 3 }; return s(a) - s(b) })[0] || E[0] }
function meThink(f, dt, n, E) {
  if (f.roll > n) { stepMove(f, f.rdx, f.rdz, 13, dt); return }
  let jx = IN.x + (KEYS.d ? 1 : 0) - (KEYS.a ? 1 : 0), jz = IN.z + (KEYS.s ? 1 : 0) - (KEYS.w ? 1 : 0); const jl = Math.hypot(jx, jz);
  if (!f.tgt || !f.tgt.alive) f.tgt = null;
  const wantAtk = IN.atk || KEYS[' '] || IN.atkQ > n;
  if (wantAtk && (!f.tgt || dist(f, f.tgt) > f.range * 1.8 + 4)) f.tgt = autoTarget(f, E);
  const tg = f.tgt, d = tg ? dist(f, tg) : 99;
  if (jl > .15) { const k = Math.min(1, jl), vx = jx / jl, vz = jz / jl; stepMove(f, vx, vz, f.spd * 1.1 * k, dt);
    if (!(wantAtk && tg && d <= f.range)) f.m.rotation.y = Math.atan2(vx, vz); if (!f.moving) { f.moving = true; play(f.m, 'Run') } }
  else if (wantAtk && tg && d > f.range * .95) { const dx = tg.m.position.x - f.m.position.x, dz = tg.m.position.z - f.m.position.z; stepMove(f, dx / d, dz / d, f.spd, dt); f.m.rotation.y = Math.atan2(dx, dz); if (!f.moving) { f.moving = true; play(f.m, 'Run') } }
  else if (f.moving) { f.moving = false; play(f.m, 'Idle') }
  if (wantAtk && tg && d <= f.range && n > f.na) { f.na = n + f.int * .85; IN.atkQ = 0; const T = tg; clearTimeout(f.at);
    attack(scene, f.m, tg.m, f.cls, () => damage(f, T, f.dmg), an => { play(f.m, an, { once: true }); f.at = setTimeout(() => { if (f.alive) play(f.m, f.moving ? 'Run' : 'Idle') }, 600) }) }
}
function doRoll() { const n = t(); if (!ME || !ME.alive || END || n < ME.nroll || n < T0) return; let jx = IN.x + (KEYS.d ? 1 : 0) - (KEYS.a ? 1 : 0), jz = IN.z + (KEYS.s ? 1 : 0) - (KEYS.w ? 1 : 0), l = Math.hypot(jx, jz);
  if (l < .15) { jx = -Math.sin(ME.m.rotation.y); jz = -Math.cos(ME.m.rotation.y); l = 1 } ME.rdx = jx / l; ME.rdz = jz / l; ME.m.rotation.y = Math.atan2(ME.rdx, ME.rdz); ME.roll = n + .38; ME.nroll = n + 3.5; anim(ME, 'Roll', 450); ringFx(scene, ME.m.position, 0x9fd6ff, 1); P.HAP && P.HAP('light') }
// ---------- ввод ----------
const ray = new THREE.Raycaster(), ptr = new THREE.Vector2(); let sx = 0, sy = 0;
$('gl').addEventListener('pointerdown', e => { sx = e.clientX; sy = e.clientY });
$('gl').addEventListener('pointerup', e => { if (!ME || !ME.alive || END || Math.hypot(e.clientX - sx, e.clientY - sy) > 12) return; ptr.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ptr, cam);
  let best = null, bd = 1e9; for (const f of foes(ME)) { const p = f.m.position.clone(); p.y = 1.2; const d = ray.ray.distanceToPoint(p); if (d < 1.8 && d < bd) { bd = d; best = f } }
  if (best) { ME.tgt = best; ringFx(scene, best.m.position, 0xff3a3a, .8); P.HAP && P.HAP('light') } });
{ const js = $('js'), jk = $('jk'); let id = null, cx = 0, cy = 0; const R0 = 50;
  const mv = e => { let dx = e.clientX - cx, dy = e.clientY - cy; const l = Math.hypot(dx, dy); if (l > R0) { dx *= R0 / l; dy *= R0 / l } jk.style.transform = `translate(${dx}px,${dy}px)`; IN.x = dx / R0; IN.z = dy / R0 };
  js.addEventListener('pointerdown', e => { id = e.pointerId; try { js.setPointerCapture(id) } catch (_) { } const r = js.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; mv(e) });
  js.addEventListener('pointermove', e => { if (e.pointerId === id) mv(e) });
  const up = e => { if (e.pointerId !== id) return; id = null; IN.x = IN.z = 0; jk.style.transform = '' }; js.addEventListener('pointerup', up); js.addEventListener('pointercancel', up) }
const hold = (el, on, off) => { el.addEventListener('pointerdown', e => { e.preventDefault(); try { el.setPointerCapture(e.pointerId) } catch (_) { } el.classList.add('on'); on() }); const u = () => { el.classList.remove('on'); off && off() }; el.addEventListener('pointerup', u); el.addEventListener('pointercancel', u) };
hold($('atk'), () => { IN.atk = true; IN.atkQ = t() + .4 }, () => IN.atk = false);
const useSk = (k) => { if (!ME || !ME.alive || END || t() < T0) return; if (k === 1) { if (t() < ME.nab) return; if (skill(ME)) P.HAP && P.HAP('medium') } else { if (t() < (ME.n2 || 0)) return; if (skill2(ME)) P.HAP && P.HAP('medium') } };
hold($('sk1'), () => useSk(1)); hold($('sk2'), () => useSk(2)); hold($('roll'), doRoll);
hold($('foc'), () => { FOCUS = !FOCUS; $('foc').classList.toggle('act', FOCUS); feedMsg(FOCUS ? '📣 Союзники бьют твою цель!' : '📣 Союзники выбирают цели сами'); P.HAP && P.HAP('light') });
hold($('swt'), () => { if (!ME || !ME.alive) return; const E = foes(ME).sort((a, b) => dist(ME, a) - dist(ME, b)); if (!E.length) return; const i = E.indexOf(ME.tgt); ME.tgt = E[(i + 1) % E.length]; ringFx(scene, ME.tgt.m.position, 0xff3a3a, .8); P.HAP && P.HAP('light') });
addEventListener('keydown', e => { const k = e.key.toLowerCase(); const m = { arrowup: 'w', arrowdown: 's', arrowleft: 'a', arrowright: 'd', 'ц': 'w', 'ы': 's', 'ф': 'a', 'в': 'd' }; KEYS[m[k] || k] = true; if (k === 'q' || k === 'й') useSk(1); if (k === 'e' || k === 'у') useSk(2); if (k === 'shift') doRoll();});
addEventListener('keyup', e => { const k = e.key.toLowerCase(); const m = { arrowup: 'w', arrowdown: 's', arrowleft: 'a', arrowright: 'd', 'ц': 'w', 'ы': 's', 'ф': 'a', 'в': 'd' }; KEYS[m[k] || k] = false });
// ---------- HUD ----------
const tgMark = new THREE.Group(); { const r = new THREE.Mesh(new THREE.RingGeometry(.9, 1.15, 32, 1, 0, 5.2), new THREE.MeshBasicMaterial({ color: '#ff3a3a', transparent: true, opacity: .9, depthWrite: false })); r.rotation.x = -Math.PI / 2; r.position.y = .06; tgMark.add(r); tgMark.userData.r = r;
  const ar = new THREE.Mesh(new THREE.ConeGeometry(.22, .45, 4), new THREE.MeshBasicMaterial({ color: '#ff3a3a' })); ar.rotation.x = Math.PI; ar.position.y = 4.1; tgMark.add(ar); tgMark.userData.ar = ar; scene.add(tgMark) }
function pf(f) { const d = document.createElement('div'); d.className = 'pf' + (f.isMe ? ' me' : ''); d.innerHTML = `<div class="e" style="background:${f.team ? '#6a1a14' : '#14502e'}">${CEMO[f.cls] || '⚔️'}</div><div class="w"><div class="nm">${f.isMe ? '⭐ ' : ''}${String(f.o.n).slice(0, 13)}</div><div class="hb"><i style="width:100%;background:${f.team ? '#ff4a3a' : '#3ae07a'}"></i></div></div>`; f.pf = d; (f.team ? $('pfb') : $('pfa')).appendChild(d) }
const setBt = (el, ab, until) => { const c = Math.ceil(until - t()); el.classList.toggle('off', c > 0 || !ME.alive); el.querySelector('.cd').textContent = c > 0 ? c : ''; if (ab) { el.querySelector('b').textContent = ab[0]; el.querySelector('span').textContent = ab[1] } };
function hud() {
  const A = F.filter(f => !f.team), B = F.filter(f => f.team), s = a => a.reduce((x, f) => x + f.hp, 0) / a.reduce((x, f) => x + f.max, 0) * 100;
  const left = Math.max(0, Math.ceil(LIMIT - (t() - T0))); $('tmr').textContent = Math.min(90, left); $('tmr').style.color = left <= 10 ? '#ff5a3a' : '#ffd34d'; $('sc').textContent = KA + ' : ' + KB;
  for (const f of F) { if (!f.pf) continue; f.pf.querySelector('i').style.width = (f.hp / f.max * 100) + '%'; f.pf.classList.toggle('dead', !f.alive); f.pf.classList.toggle('tg', ME && ME.tgt === f) }
  if (ME) { setBt($('sk1'), AB[ME.cls], ME.nab); setBt($('sk2'), S2[ME.cls], ME.n2 || 0); setBt($('roll'), null, ME.nroll); $('myb').style.width = (ME.hp / ME.max * 100) + '%'; $('myv').textContent = Math.ceil(ME.hp) + ' / ' + Math.ceil(ME.max) }
  if (!END && t() > T0) { const ea = foes(ME).length === 0, aa = ally(ME).length === 0; if (ea || aa || left <= 0) finish(ea || (!aa && s(A) > s(B))) }
}
async function finish(win) {
  END = true; IN.atk = false; for (const f of F) if (f.alive) play(f.m, win === !f.team ? 'Victory' : 'Defeat', { once: false });
  await new Promise(r => setTimeout(r, 1400));
  const r = P.arenaEnd ? await P.arenaEnd(win, ME ? ME.kills : 0) : null; const ov = $('ov'); ov.classList.remove('hidden'); ov.style.display = 'flex';
  const mvp = F.filter(f => !f.team).sort((a, b) => b.dealt - a.dealt)[0];
  const rows = F.filter(f => !f.team).map(f => `<div><b>${f.alive ? (CEMO[f.cls] || '❤️') : '💀'}</b>@${String(f.o.n).slice(0, 10)}<br>🗡 ${Math.round(f.dealt)} · ☠️ ${f.kills}${f === mvp ? '<br>⭐ MVP' : ''}</div>`).join('');
  $('ovb').innerHTML = `<h2>${win ? '🏆 Победа!' : '💀 Поражение'}</h2><p>${win ? 'Твой отряд разбил клан «' + D.opp.name + '»' : 'Клан «' + D.opp.name + '» оказался сильнее. Уворачивайся рывком, фокусь одну цель и прокачай героя!'}</p><p style="margin:0;font-weight:800">Счёт ${KA} : ${KB}</p><div class="rw">${rows}</div><p style="color:#ffd34d">${r && r.msg ? r.msg : r && r.err ? r.err : ''}</p>${r && r.ar != null ? (() => { const k = rankOf(r.ar), nx = RANKS[k[0] + 1]; return `<p style="margin:4px 0 10px;font-weight:800">${k[2]} ${k[3]} · рейтинг ${r.ar} <span style="color:${r.dr >= 0 ? '#5ee6b0' : '#ff8a6a'}">(${r.dr >= 0 ? '+' : ''}${r.dr})</span>${nx ? '<br><small style="opacity:.75">до ' + nx[1] + ' ' + nx[2] + ': ' + (nx[0] - r.ar) + '</small>' : ''}</p>` })() : ''}<button id="upb" style="background:linear-gradient(#b89aff,#7a4aff);color:#fff">⬆️ Прокачать героя</button><button id="okb">Вернуться в мир приключений</button>`;
  $('upb').onclick = () => P.arenaUp ? P.arenaUp() : P.closeArena && P.closeArena();
  $('okb').onclick = () => P.closeArena && P.closeArena();
}
let last = performance.now(), fr = 0; const CP = new THREE.Vector3(0, 16, 30), CL = new THREE.Vector3();
function loop(now) { let dt = Math.min(.05, (now - last) / 1000); last = now; if (TS < 1 && now > TSU) TS = Math.min(1, TS + dt * 3); const gd = dt * TS;
  if (!END) for (const f of F) think(f, gd); tickHeroes(gd); tickFx(gd); fr++;
  for (const f of F) { const k = f.hp / f.max; f.hb.userData.fg.scale.x = Math.max(.001, k); f.hb.userData.fg.position.x = -.88 * (1 - k); f.hb.userData.fg.material.color.set(k > .5 ? '#3ae07a' : k > .25 ? '#ffc632' : '#ff3a3a'); f.hb.quaternion.copy(cam.quaternion) }
  const tg = ME && ME.tgt && ME.tgt.alive ? ME.tgt : null; tgMark.visible = !!tg && !END; if (tg) { tgMark.position.copy(tg.m.position); tgMark.userData.r.rotation.z += dt * 3; tgMark.userData.ar.position.y = 4.1 + Math.sin(now / 160) * .15 }
  if (fr % 2 === 0 && FANS.body) { const dm = new THREE.Object3D(), w = now / 1000; for (const a of FANS) { const j = Math.max(0, Math.sin(w * 7 + a.ph)) * (.25 + (TS < 1 ? .4 : 0)) + Math.max(0, Math.sin(a.a * 3 - w * 2.2)) * .35; dm.position.set(Math.sin(a.a) * a.rr, a.yy + .4 + j, Math.cos(a.a) * a.rr); dm.rotation.set(0, a.a + Math.PI, 0); dm.updateMatrix(); FANS.body.setMatrixAt(a.k, dm.matrix); dm.position.y += .65; dm.updateMatrix(); FANS.head.setMatrixAt(a.k, dm.matrix) } FANS.body.instanceMatrix.needsUpdate = FANS.head.instanceMatrix.needsUpdate = true }
  for (const o of TORCH) { if (o.fl) { const fl = .85 + Math.sin(now / 70 + o.ph * 3) * .1 + Math.random() * .08; o.fl.scale.set(fl, fl * (1 + Math.random() * .15), fl); if (o.L) o.L.intensity = 18 + fl * 8 } if (o.flag) o.flag.rotation.x = Math.sin(now / 400 + o.flag.userData.ph) * .12 }
  if (TORCH.dust) TORCH.dust.rotation.y += dt * .02;
  const fo = ME && (ME.alive || END) ? ME : (ally(ME || {}).find(a => a !== ME) || ME), c = fo ? fo.m.position : new THREE.Vector3(); CP.lerp(new THREE.Vector3(c.x, 17, c.z + 12.5), Math.min(1, dt * 4)); CL.lerp(new THREE.Vector3(c.x, .8, c.z - 1), Math.min(1, dt * 5));
  if (t() < T0 || T0 > 1e8) { const w = now / 1000 * .25; CP.set(Math.sin(w) * 17, 9 + Math.sin(w * .7) * 2, Math.cos(w) * 17); CL.set(0, 2, 0) }
  SHK = Math.max(0, SHK - dt * 2.5); const sk = Math.min(.25, SHK); cam.position.set(CP.x + (Math.random() - .5) * sk, CP.y, CP.z + (Math.random() - .5) * sk * .5); cam.lookAt(CL); R.render(scene, cam); requestAnimationFrame(loop) }
(function start() {
  if (!D) { $('load').textContent = 'Нет данных боя'; return }
  $('tna').textContent = (D.mine.emo || '🗡') + ' ' + D.mine.name; $('tnb').textContent = D.opp.emo + ' ' + D.opp.name;
  ME = fighter(D.me, 0, 1, true); D.al.forEach((o, i) => fighter(o, 0, i ? 2 : 0)); D.en.forEach((o, i) => fighter(o, 1, i));
  [F[1], F[0], F[2], ...F.slice(3)].forEach(pf); { const k = rankOf(D.me.ar || 0); $('mycl').textContent = (CEMO[ME.cls] || '⚔️') + ' ' + (CNAME[ME.cls] || 'Герой') + ' · ' + k[2] + ' ' + k[3] }
  for (const f of F) { f.na = 0; f.nab = 0 } T0 = 1e9;
  $('load').remove(); CP.set(0, 26, 40); setInterval(hud, 150); requestAnimationFrame(loop);
  const side = (arr, cn, r) => `<div class="sd${r ? ' r' : ''}"><div class="cn" style="color:${r ? '#ff8a6a' : '#7ae8a8'}">${cn}</div>${arr.map(f => `<div class="pl">${CEMO[f.cls] || ''} @${String(f.o.n).slice(0, 12)} · ур.${f.o.lvl || 1}</div>`).join('')}</div>`;
  const vs = document.createElement('div'); vs.id = 'vs'; vs.innerHTML = side(F.filter(f => !f.team), (D.mine.emo || '🗡') + ' ' + D.mine.name) + '<div class="v">VS</div>' + side(F.filter(f => f.team), D.opp.emo + ' ' + D.opp.name, 1); document.body.appendChild(vs); P.HAP && P.HAP('medium');
  setTimeout(() => { vs.style.opacity = 0; setTimeout(() => vs.remove(), 500);
    const k = document.createElement('div'); k.id = 'cnt'; document.body.appendChild(k); let n = 3;
    const tk = () => { k.textContent = n > 0 ? n : '⚔️ В БОЙ!'; P.HAP && P.HAP('light'); if (n-- < 0) { k.remove(); return } if (n < 0) { T0 = t(); LIMIT = 90; for (const f of F) { f.na = T0 + (f.isMe ? 0 : Math.random()); f.nab = T0 + (f.isMe ? 0 : 2 + Math.random() * 5); f.n2 = T0 + (f.isMe ? 0 : 4) } } setTimeout(tk, n < 0 ? 700 : 750) }; tk() }, 2300);
  setTimeout(() => $('hint').style.opacity = 0, 14000);
})();
