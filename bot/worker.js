// Город подписчиков: бот + API игры. База: D1 (env.DB). Токен бота хранится в D1 (kv.token), вводится один раз на /setup.
const SITE='https://gorod-podpischikov.pages.dev',GAME=SITE+'/game/',IG='https://www.instagram.com/gorod.podpischikov001/';
const J=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{'content-type':'application/json','access-control-allow-origin':'*'}});
const H=(h)=>new Response(h,{headers:{'content-type':'text/html; charset=utf-8'}});
const now=()=>Math.floor(Date.now()/1000),day=()=>new Date(Date.now()+3*3600e3).toISOString().slice(0,10),week=()=>Math.floor((Date.now()/1000+3*3600-4*86400)/604800);
let IDX=null,IDX_T=0,TOK=null;
async function index(){if(IDX&&Date.now()-IDX_T<600000)return IDX;const r=await fetch(SITE+'/data/index.json',{cf:{cacheTtl:300}});const a=await r.json();IDX=new Map(a.map(x=>[x[0].toLowerCase(),x]));IDX_T=Date.now();return IDX}
function norm(t){t=(t||'').trim().toLowerCase();const m=t.match(/instagram\.com\/([a-z0-9._]+)/);if(m)t=m[1];return t.replace(/^@+/,'').replace(/[\s/]+$/,'').replace(/\s+/g,'')}
async function kv(env,k,v){if(v===undefined){const r=await env.DB.prepare('SELECT v FROM kv WHERE k=?').bind(k).first();return r&&r.v}await env.DB.prepare('INSERT OR REPLACE INTO kv(k,v) VALUES(?,?)').bind(k,String(v)).run()}
async function token(env){if(!TOK)TOK=await kv(env,'token');return TOK}
async function tg(env,m,b){const t=await token(env);return fetch('https://api.telegram.org/bot'+t+'/'+m,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(b)}).then(r=>r.json())}

// ===== ЭКОНОМИКА =====
const MAXLVL=15,inc=l=>Math.round(20*Math.pow(l,1.5)),upc=l=>200*l*l,CAP=8;
const DECOR={garden:['🌳','Сад',300,'Двор'],flowers:['🌷','Цветы',300,'Двор'],fence:['🪵','Красивый забор',350,'Двор'],lanterns:['🏮','Фонари',450,'Двор'],flag:['🚩','Флаг',500,'Двор'],balloons:['🎈','Шарики на крыше',400,'Двор'],bbq:['🍖','Мангал',600,'Двор'],swing:['🪢','Качели',700,'Двор'],gazebo:['⛺','Беседка',1100,'Двор'],trampoline:['🤸','Батут',900,'Двор'],playground:['🛝','Детская площадка',900,'Двор'],greenhouse:['🪴','Теплица',1200,'Двор'],sakura:['🌸','Сакура',1300,'Двор'],
 cats:['🐱','Котики',800,'Питомцы'],dogs:['🐶','Собака',800,'Питомцы'],chickens:['🐔','Курочки',700,'Питомцы'],rabbit:['🐰','Кролики',900,'Питомцы'],parrot:['🦜','Попугай',1000,'Питомцы'],horse:['🐴','Лошадь',2500,'Питомцы'],
 bike:['🚲','Велосипед',600,'Транспорт'],scooter:['🛵','Мопед',1200,'Транспорт'],car:['🚗','Машина',1500,'Транспорт'],moto:['🏍','Мотоцикл',2000,'Транспорт'],jeep:['🚙','Джип',3500,'Транспорт'],
 solar:['☀️','Солнечные панели',1800,'Дом'],satellite:['📡','Спутниковая тарелка',800,'Дом'],lights:['✨','Гирлянды',650,'Дом'],sauna:['🧖','Сауна',2500,'Дом'],pool:['🏊','Бассейн',3000,'Дом'],
 gold:['👑','Золотая крыша',0,'Премиум',100],neon:['💡','Неоновая подсветка',0,'Премиум',100],fountain:['⛲','Фонтан',0,'Премиум',100],panda:['🐼','Панда',0,'Премиум',150],lion:['🦁','Лев',0,'Премиум',150],yacht:['🛥','Яхта у дома',0,'Премиум',150],heli:['🚁','Вертолёт',0,'Премиум',250],tiger:['🐯','Тигр',0,'Премиум',150]};
const SKINS={mansion:['🏛','Особняк с колоннами',200],noir:['🖤','Стиль нуар',150],sakura:['🌸','Розовая сакура',150]};
const STARS={coins_s:['💰','Мешок монет: 5 000',50],coins_l:['🧰','Сундук монет: 12 000',100],coins_xl:['🏦','Сейф монет: 30 000',200],skip:['⏩','Ускорить время: доход за 8 часов сразу',50],shifts3:['💼','+3 смены сегодня',30],fw:['🎆','Салют над домом на 24 часа',30],boost:['⚡','Доход ×2 на 7 дней',100],star:['⭐','Звезда города на 30 дней: бонус ×2, +1 смена, золотая рамка',250]};
for(const k in DECOR)if(DECOR[k][4])STARS['d_'+k]=[DECOR[k][0],DECOR[k][1],DECOR[k][4]];for(const k in SKINS)STARS['skin_'+k]=[SKINS[k][0],'Вид дома: '+SKINS[k][1],SKINS[k][2]];
const MIS=[['collect',2,'Собери доход 2 раза',150],['shift',2,'Отработай 2 смены',250],['like',3,'Лайкни 3 дома соседей',150],['visit',2,'Сходи в гости к 2 соседям',150],['decor',1,'Купи что-нибудь для дома',200],['score',30,'Набери 30 очков за смену',300],['daily',1,'Забери бонус дня',100],['upgrade',1,'Улучши дом',300],['collect',4,'Собери доход 4 раза',300],['like',6,'Поставь 6 лайков соседям',300],['visit',4,'Сходи в гости к 4 соседям',300],['shift',3,'Отработай 3 смены',400],['score',45,'Набери 45 очков за смену',500],['earn',1500,'Заработай 1 500 монет',300],['decor',2,'Купи 2 вещи для дома',350],['combo',15,'Сделай комбо из 15 попаданий',400],['shift_hospital',1,'Поработай в больнице',250],['shift_park',1,'Поработай в парке',250],['shift_shop',1,'Поработай в торговом центре',250],['shift_football',1,'Сыграй за ФК ASKER',250],['shift_police',1,'Выйди на смену в полицию',250],['score',55,'Набери 55 очков за смену',700],['coin',5,'Найди 5 монет на улицах города',300],['coin',10,'Собери все 10 монет в городе',600],['wheel',1,'Покрути колесо удачи',150]];
const WHEEL=[['coins',100,'100 🪙',30],['coins',250,'250 🪙',22],['coins',500,'500 🪙',12],['coins',1000,'1 000 🪙',5],['boost',3600,'⚡ Доход ×2 на час',10],['shift',1,'💼 +1 смена',10],['coins',50,'50 🪙',8],['coins',2500,'2 500 🪙',3]];
function mis(p){const d=day();let m=p.mis?JSON.parse(p.mis):null;if(!m||m.d!==d){let h=0;for(const c of d+p.tg)h=(h*31+c.charCodeAt(0))>>>0;const ids=[];let k=h;while(ids.length<3){const i=k%MIS.length;if(!ids.includes(i))ids.push(i);k=Math.floor(k/7)+13}m={d,ids,p:{},c:[]};p.mis=JSON.stringify(m)}return m}
function bump(p,kind,n=1,max=false){const m=mis(p);for(const i of m.ids){const M=MIS[i];if(M[0]===kind){const v=m.p[kind]||0;m.p[kind]=max?Math.max(v,n):v+n}}p.mis=JSON.stringify(m)}
const plvl=xp=>Math.floor(Math.sqrt(xp/150))+1;
const JOBS={police:['👮','Полиция','🦹','полицейский'],hospital:['🏥','Больница','🤒','работник больницы'],football:['⚽','ФК ASKER','⚽','футболист ФК ASKER'],park:['🎢','Парк развлечений','🍦','работник парка'],shop:['🛍','Торговый центр','🍔','продавец']};
const RANKS=[[0,'Стажёр',1],[150,'Сотрудник',1.2],[500,'Опытный',1.4],[1200,'Старший',1.7],[2500,'Начальник',2]];const rank=x=>{let r=0;for(let i=0;i<RANKS.length;i++)if(x>=RANKS[i][0])r=i;return r};
const ACH=[['shifts',10,'Трудяга: 10 смен',500],['shifts',50,'Работник месяца: 50 смен',2000],['visits',10,'Душа компании: 10 гостей',400],['visits',50,'Свой в городе: 50 гостей',1500],['likes',20,'Добрый сосед: 20 лайков',500],['collects',30,'Хозяин: 30 сборов дохода',600],['decor',10,'Уютный дом: 10 вещей',800],['decor',25,'Дизайнер: 25 вещей',2500],['lvl',5,'Дом 5 уровня',700],['lvl',10,'Дом 10 уровня',3000],['lvl',15,'Особняк: 15 уровень дома',8000],['streak',7,'Неделя подряд',1500],['rank',2,'Опытный работник',1000],['rank',4,'Начальник',4000],['earned',10000,'Первые 10 000',1000],['earned',100000,'Миллионер города: 100 000',10000],['coins',30,'Кладоискатель: 30 монет на улицах',1000],['coins',150,'Охотник за сокровищами: 150 монет',5000]];
function stat(p){return p.st?JSON.parse(p.st):{}}function stInc(p,k,n=1){const s=stat(p);s[k]=(s[k]||0)+n;p.st=JSON.stringify(s)}
function achVal(p,k){const s=stat(p),jb=p.jobs?JSON.parse(p.jobs):{};if(k==='lvl')return p.lvl;if(k==='streak')return p.streak;if(k==='decor')return JSON.parse(p.items).length;if(k==='earned')return p.xp;if(k==='rank')return Math.max(0,...Object.values(jb).map(rank));return s[k]||0}
function rate(p){let r=inc(p.lvl);r+=JSON.parse(p.items).length*5;r=Math.round(r*(1+(plvl(p.xp)-1)*0.03));if(p.boost>now())r*=2;return r}
function collectable(p){const h=Math.min(CAP,(now()-p.col)/3600);return Math.floor(h*rate(p))}
async function feed(env,txt){await env.DB.prepare('INSERT INTO feed(ts,txt) VALUES(?,?)').bind(now(),txt).run()}
async function earn(env,p,c){bump(p,'earn',c);const w=week();p.coins+=c;p.xp+=c;p.wxp=(p.wk===w?p.wxp:0)+c;p.wk=w}
async function save(env,p){await env.DB.prepare('UPDATE players SET wday=?,cf=?,jobs=?,st=?,ach=?,mis=?,skin=?,fw=?,coins=?,lvl=?,items=?,col=?,boost=?,star=?,streak=?,dday=?,shifts=?,sday=?,sstart=?,xp=?,wxp=?,wk=?,lday=?,lcount=?,seen=?,spent_day=?,spent=? WHERE tg=?')
  .bind(p.wday||null,p.cf||null,p.jobs||null,p.st||null,p.ach||null,p.mis,p.skin||'',p.fw||0,p.coins,p.lvl,p.items,p.col,p.boost,p.star,p.streak,p.dday,p.shifts,p.sday,p.sstart,p.xp,p.wxp,p.wk,p.lday,p.lcount,now(),p.spent_day,p.spent,p.tg).run()}
async function view(env,p){const idx=await index();const x=idx.get(p.nick)||[p.nick,0,[]];const sd=p.sday===day()?p.shifts:0;
  const online=(await env.DB.prepare('SELECT COUNT(*) c FROM players WHERE seen>?').bind(now()-300).first()).c;
  return {nick:p.nick,num:x[1],chips:x[2],coins:p.coins,lvl:p.lvl,maxlvl:MAXLVL,upcost:p.lvl<MAXLVL?upc(p.lvl):0,rate:rate(p),ready:collectable(p),cap:CAP,items:JSON.parse(p.items),boost:p.boost,star:p.star,now:now(),
    daily:p.dday!==day(),streak:p.streak,shiftsLeft:(p.star>now()?4:3)-sd,likesLeft:10-(p.lday===day()?p.lcount:0),online,skin:p.skin||'',fw:p.fw||0,pl:plvl(p.xp),xp:p.xp,plnext:150*Math.pow(plvl(p.xp),2),plcur:150*Math.pow(plvl(p.xp)-1,2),mis:(()=>{const m=mis(p);const all=m.ids.every(i=>m.c.includes(i));return {list:m.ids.map(i=>({i,t:MIS[i][2],goal:MIS[i][1],prog:Math.min(MIS[i][1],m.p[MIS[i][0]]||0),r:MIS[i][3],c:m.c.includes(i)})),bonus:all&&!m.c.includes(99)}})(),jobs:Object.fromEntries(Object.keys(JOBS).map(k=>{const x=(p.jobs?JSON.parse(p.jobs):{})[k]||0,r=rank(x);return [k,{x,r,name:RANKS[r][1],mul:RANKS[r][2],next:RANKS[r+1]?RANKS[r+1][0]:null,cur:RANKS[r][0]}]})),ach:(()=>{const got=p.ach?JSON.parse(p.ach):[];return ACH.map((a,i)=>({i,t:a[2],goal:a[1],v:Math.min(a[1],achVal(p,a[0])),r:a[3],c:got.includes(i)}))})(),wheel:p.wday!==day(),coinsFound:(()=>{const c=p.cf?JSON.parse(p.cf):null;return c&&c.d===day()?c.ids:[]})(),wheelPrizes:WHEEL.map(w=>w[2]),role:Object.keys(JOBS).find(k=>(x[2]||[]).includes(JOBS[k][3]))||null}}

// ===== initData (вход через Telegram) =====
async function hmac(key,msg){const k=await crypto.subtle.importKey('raw',typeof key==='string'?new TextEncoder().encode(key):key,{name:'HMAC',hash:'SHA-256'},false,['sign']);return new Uint8Array(await crypto.subtle.sign('HMAC',k,new TextEncoder().encode(msg)))}
async function auth(env,init){const t=await token(env);if(!t||!init)return null;const q=new URLSearchParams(init);const h=q.get('hash');q.delete('hash');
  const s=[...q.entries()].sort((a,b)=>a[0]<b[0]?-1:1).map(([k,v])=>k+'='+v).join('\n');const sec=await hmac('WebAppData',t);const sig=[...await hmac(sec,s)].map(b=>b.toString(16).padStart(2,'0')).join('');
  if(sig!==h||now()-Number(q.get('auth_date'))>86400*7)return null;return JSON.parse(q.get('user')||'null')}

// ===== API =====
async function api(env,req,path){
  const b=req.method==='POST'?await req.json().catch(()=>({})):{};const u=await auth(env,b.init||req.headers.get('x-init'));
  if(path==='/api/catalog')return J({DECOR,SKINS,STARS});
  if(path==='/api/top'){const w=week();const top=(await env.DB.prepare('SELECT nick,lvl,wxp FROM players WHERE wk=? AND nick IS NOT NULL ORDER BY wxp DESC LIMIT 20').bind(w).all()).results;
    const f=(await env.DB.prepare('SELECT ts,txt FROM feed ORDER BY id DESC LIMIT 15').all()).results;return J({top,feed:f})}
  if(path==='/api/house'){const n=norm(b.nick);const p=await env.DB.prepare('SELECT nick,lvl,items,likes FROM players WHERE nick=?').bind(n).first();const x=(await index()).get(n);if(!x)return J({err:'Такого жителя нет'});return J({nick:x[0],num:x[1],chips:x[2],lvl:p?p.lvl:1,items:p?JSON.parse(p.items):[],likes:p?p.likes:0,player:!!p})}
  if(!u)return J({err:'auth'},401);
  let p=await env.DB.prepare('SELECT * FROM players WHERE tg=?').bind(u.id).first();
  if(path==='/api/claim'){if(p)return J({err:'Ник уже привязан: @'+p.nick});const n=norm(b.nick);const x=(await index()).get(n);if(!x)return J({err:'Ника @'+n+' нет в городе. Подпишись на @gorod.podpischikov001 и напиши в комментарии, какой дом хочешь.'});
    const t=await env.DB.prepare('SELECT tg FROM players WHERE nick=?').bind(n).first();if(t)return J({err:'Этот дом уже занят. Если это твой ник — напиши в бот /help'});
    await env.DB.prepare('INSERT INTO players(tg,nick,name,col,seen,created,wk) VALUES(?,?,?,?,?,?,?)').bind(u.id,n,u.first_name||'',now(),now(),now(),week()).run();await feed(env,'🏠 @'+n+' заселился в свой дом');
    p=await env.DB.prepare('SELECT * FROM players WHERE tg=?').bind(u.id).first();return J({me:await view(env,p)})}
  if(!p)return J({need:'claim'});
  const today=day();let msg='';
  if(path==='/api/me'){}
  else if(path==='/api/collect'){const c=collectable(p);if(c<1)return J({err:'Пока нечего собирать'});await earn(env,p,c);p.col=now();msg='+'+c+' 🪙';bump(p,'collect');stInc(p,'collects')}
  else if(path==='/api/daily'){if(p.dday===today)return J({err:'Бонус уже получен, приходи завтра'});const y=new Date(Date.now()+3*3600e3-86400e3).toISOString().slice(0,10);p.streak=p.dday===y?Math.min(7,p.streak+1):1;p.dday=today;let c=100*p.streak;if(p.star>now())c*=2;await earn(env,p,c);msg='День '+p.streak+': +'+c+' 🪙';bump(p,'daily')}
  else if(path==='/api/upgrade'){if(p.lvl>=MAXLVL)return J({err:'Максимальный уровень'});const c=upc(p.lvl);if(p.coins<c)return J({err:'Нужно '+c+' 🪙'});p.coins-=c;p.col=now()-Math.min(CAP*3600,now()-p.col);p.lvl++;msg='Дом улучшен до '+p.lvl+' уровня!';bump(p,'upgrade');if(p.lvl>=3)await feed(env,'⬆️ @'+p.nick+' улучшил дом до '+p.lvl+' ур.')}
  else if(path==='/api/decor'){const d=DECOR[b.item];const it=JSON.parse(p.items);if(!d||d[4])return J({err:'Нет такого'});if(it.includes(b.item))return J({err:'Уже есть'});if(plvl(p.xp)<Math.ceil(d[2]/800))return J({err:'Откроется на '+Math.ceil(d[2]/800)+' уровне игрока'});if(p.coins<d[2])return J({err:'Нужно '+d[2]+' 🪙'});p.coins-=d[2];it.push(b.item);p.items=JSON.stringify(it);msg=d[0]+' '+d[1]+' — готово!';bump(p,'decor')}
  else if(path==='/api/shift/start'){const sd=p.sday===today?p.shifts:0;if(sd>=(p.star>now()?4:3))return J({err:'Смены на сегодня закончились'});p.sstart=now();await save(env,p);return J({ok:1,sec:20})}
  else if(path==='/api/shift/end'){const el=now()-p.sstart;if(!p.sstart||el<18||el>120)return J({err:'Смена не засчитана'});const job=JOBS[b.job]?b.job:'police';const sc=Math.max(0,Math.min(60,b.score|0));const v=await view(env,p);const jb=p.jobs?JSON.parse(p.jobs):{};const r0=rank(jb[job]||0);jb[job]=(jb[job]||0)+sc;const r1=rank(jb[job]);p.jobs=JSON.stringify(jb);stInc(p,'shifts');let c=Math.round(sc*5*(1+p.lvl*0.1)*(v.role===job?1.5:1)*RANKS[r0][2]);bump(p,'shift_'+job);if(r1>r0)await feed(env,JOBS[job][0]+' @'+p.nick+' теперь «'+RANKS[r1][1]+'» в '+JOBS[job][1]);
    p.shifts=(p.sday===today?p.shifts:0)+1;p.sday=today;p.sstart=0;await earn(env,p,c);msg=JOBS[job][0]+' Смена: '+sc+' очков, +'+c+' 🪙';bump(p,'shift');bump(p,'score',sc,true);bump(p,'combo',Math.min(60,b.combo|0),true);if(sc>=35)await feed(env,JOBS[job][0]+' @'+p.nick+' отлично отработал смену: '+sc)}
  else if(path==='/api/like'){const n=norm(b.nick);if(n===p.nick)return J({err:'Себе нельзя 🙂'});if(p.lday===today&&p.lcount>=10)return J({err:'Лайки на сегодня закончились'});
    const r=await env.DB.prepare('INSERT OR IGNORE INTO likes(tg,nick,day) VALUES(?,?,?)').bind(p.tg,n,today).run();if(!r.meta.changes)return J({err:'Сегодня уже лайкал этот дом'});
    await env.DB.prepare('UPDATE players SET coins=coins+20,xp=xp+20,likes=likes+1 WHERE nick=?').bind(n).run();p.lcount=(p.lday===today?p.lcount:0)+1;p.lday=today;await earn(env,p,10);msg='❤️ +10 🪙 тебе и +20 🪙 соседу';bump(p,'like');stInc(p,'likes')}
  else if(path==='/api/visit'){const n=norm(b.nick);const h=await env.DB.prepare('SELECT nick,lvl,items,likes,skin,fw,xp FROM players WHERE nick=?').bind(n).first();const x=(await index()).get(n);if(!x)return J({err:'Такого жителя нет'});
    if(n!==p.nick){const r=await env.DB.prepare('INSERT OR IGNORE INTO visits(tg,nick,day) VALUES(?,?,?)').bind(p.tg,n,today).run();if(r.meta.changes){bump(p,'visit');stInc(p,'visits');await earn(env,p,5)}}await save(env,p);
    return J({me:await view(env,p),house:{nick:x[0],num:x[1],chips:x[2],lvl:h?h.lvl:1,items:h?JSON.parse(h.items):[],likes:h?h.likes:0,skin:h?h.skin:'',fw:h?h.fw:0,pl:h?plvl(h.xp):1,player:!!h}})}
  else if(path==='/api/random'){const r=await env.DB.prepare('SELECT nick FROM players WHERE nick IS NOT NULL AND tg<>? ORDER BY RANDOM() LIMIT 1').bind(p.tg).first();return J({nick:r?r.nick:null})}
  else if(path==='/api/mission'){const m=mis(p);if(b.id===99){if(!m.ids.every(i=>m.c.includes(i))||m.c.includes(99))return J({err:'Сначала выполни все миссии'});m.c.push(99);p.mis=JSON.stringify(m);await earn(env,p,500);msg='🎁 Сундук дня: +500 🪙'}
    else{const i=b.id|0;const M=MIS[i];if(!m.ids.includes(i)||m.c.includes(i))return J({err:'Уже получено'});if((m.p[M[0]]||0)<M[1])return J({err:'Миссия ещё не выполнена'});m.c.push(i);p.mis=JSON.stringify(m);await earn(env,p,M[3]);msg='✅ Миссия: +'+M[3]+' 🪙'}}
  else if(path==='/api/ach'){const i=b.id|0,a=ACH[i];const got=p.ach?JSON.parse(p.ach):[];if(!a||got.includes(i))return J({err:'Уже получено'});if(achVal(p,a[0])<a[1])return J({err:'Ещё не выполнено'});got.push(i);p.ach=JSON.stringify(got);await earn(env,p,a[3]);msg='🏅 '+a[2]+': +'+a[3]+' 🪙';await feed(env,'🏅 @'+p.nick+' получил достижение «'+a[2]+'»')}
  else if(path==='/api/coin'){const id=b.id|0;if(id<0||id>9)return J({err:'?'});let c=p.cf?JSON.parse(p.cf):null;if(!c||c.d!==today)c={d:today,ids:[]};if(c.ids.includes(id))return J({err:'Уже собрана'});c.ids.push(id);p.cf=JSON.stringify(c);const v=25+p.lvl*5;await earn(env,p,v);bump(p,'coin');stInc(p,'coins');msg='🪙 +'+v+(c.ids.length===10?' · все монеты дня собраны!':' · '+c.ids.length+'/10')}
  else if(path==='/api/wheel'){if(p.wday===today)return J({err:'Колесо уже крутилось сегодня'});const tot=WHEEL.reduce((a,w)=>a+w[3],0);let r=Math.random()*tot,i=0;for(;i<WHEEL.length;i++){r-=WHEEL[i][3];if(r<=0)break}i=Math.min(i,WHEEL.length-1);const w=WHEEL[i];p.wday=today;bump(p,'wheel');
    if(w[0]==='coins')await earn(env,p,w[1]);else if(w[0]==='boost')p.boost=Math.max(p.boost,now())+w[1];else if(w[0]==='shift'){p.shifts=(p.sday===today?p.shifts:0)-1;p.sday=today}if(w[1]>=1000)await feed(env,'🎡 @'+p.nick+' выиграл в колесе удачи '+w[2]);await save(env,p);return J({me:await view(env,p),prize:i,msg:'🎡 Выигрыш: '+w[2]})}
  else if(path==='/api/skin'){if(b.skin&&!JSON.parse(p.items).includes('skin_'+b.skin))return J({err:'Сначала купи этот вид'});p.skin=b.skin||'';msg='Вид дома изменён'}
  else if(path==='/api/buy'){const s=STARS[b.item];if(!s)return J({err:'Нет такого'});if((b.item.startsWith('d_')&&JSON.parse(p.items).includes(b.item.slice(2)))||(b.item.startsWith('skin_')&&JSON.parse(p.items).includes(b.item)))return J({err:'Уже есть'});
    const sp=p.spent_day===today?p.spent:0;if(sp+s[2]>500)return J({err:'Лимит покупок на сегодня — 500 ⭐'});
    const r=await tg(env,'createInvoiceLink',{title:s[1].slice(0,32),description:s[0]+' '+s[1]+' для дома @'+p.nick,payload:p.tg+':'+b.item+':'+now(),currency:'XTR',prices:[{label:s[1].slice(0,32),amount:s[2]}]});
    return r.ok?J({link:r.result}):J({err:'Оплата временно недоступна'})}
  else return J({err:'404'},404);
  await save(env,p);return J({me:await view(env,p),msg})}

// ===== выдача покупки =====
async function grant(env,sp,from){const [tgid,item]=sp.invoice_payload.split(':');const s=STARS[item];const id=sp.telegram_payment_charge_id;
  const ins=await env.DB.prepare('INSERT OR IGNORE INTO pays(id,tg,item,stars,ts) VALUES(?,?,?,?,?)').bind(id,Number(tgid),item,sp.total_amount,now()).run();if(!ins.meta.changes)return;
  const p=await env.DB.prepare('SELECT * FROM players WHERE tg=?').bind(Number(tgid)).first();if(!p||!s)return;const t=now();
  if(item==='coins_s')p.coins+=5000;else if(item==='coins_l')p.coins+=12000;else if(item==='skip')p.coins+=rate(p)*8;
  else if(item==='boost')p.boost=Math.max(p.boost,t)+7*86400;else if(item==='star')p.star=Math.max(p.star,t)+30*86400;
  else if(item==='coins_xl')p.coins+=30000;else if(item==='fw'){p.fw=t+86400}else if(item==='shifts3'){const d=day();p.shifts=(p.sday===d?p.shifts:0)-3;p.sday=d}
  else if(item.startsWith('skin_')){const it=JSON.parse(p.items);if(!it.includes(item))it.push(item);p.items=JSON.stringify(it);p.skin=item.slice(5)}
  else if(item.startsWith('d_')){const it=JSON.parse(p.items);if(!it.includes(item.slice(2)))it.push(item.slice(2));p.items=JSON.stringify(it)}
  const td=day();p.spent=(p.spent_day===td?p.spent:0)+sp.total_amount;p.spent_day=td;await save(env,p);
  if(item==='fw')await feed(env,'🎆 Над домом @'+p.nick+' салют!');if(item.startsWith('d_')||item.startsWith('skin_'))await feed(env,s[0]+' У @'+p.nick+' теперь '+s[1].toLowerCase())}

// ===== БОТ =====
const kb=()=>({inline_keyboard:[[{text:'🎮 Играть',web_app:{url:GAME}}],[{text:'🏙 Найти дом',web_app:{url:SITE+'/'}}],[{text:'📲 Наша страница в Instagram',url:IG}]]});
async function bot(env,u){
  if(u.pre_checkout_query)return J({method:'answerPreCheckoutQuery',pre_checkout_query_id:u.pre_checkout_query.id,ok:true});
  const m=u.message;if(!m)return new Response('ok');const chat=m.chat.id;
  if(m.successful_payment){await grant(env,m.successful_payment,m.from);return J({method:'sendMessage',chat_id:chat,text:'✅ Спасибо! Покупка уже в игре. Открой игру, чтобы увидеть.',reply_markup:kb()})}
  if(!m.text)return new Response('ok');const text=m.text.trim();const owner=await kv(env,'owner');
  if(text==='/owner'&&!owner){await kv(env,'owner',m.from.id);return J({method:'sendMessage',chat_id:chat,text:'Ты владелец бота. Команды: /stats, /unlink ник, /give ник монеты'})}
  if(owner&&String(m.from.id)===owner){
    if(text==='/stats'){const a=await env.DB.prepare('SELECT COUNT(*) c FROM players').first(),o=await env.DB.prepare('SELECT COUNT(*) c FROM players WHERE seen>?').bind(now()-86400).first(),s=await env.DB.prepare('SELECT COALESCE(SUM(stars),0) s,COUNT(*) c FROM pays WHERE refunded=0').first();
      return J({method:'sendMessage',chat_id:chat,text:`👥 Игроков: ${a.c}\n🟢 За сутки: ${o.c}\n⭐ Продаж: ${s.c} на ${s.s} звёзд`})}
    let r;if((r=text.match(/^\/unlink\s+@?(\S+)/))){await env.DB.prepare('UPDATE players SET nick=NULL WHERE nick=?').bind(norm(r[1])).run();return J({method:'sendMessage',chat_id:chat,text:'Ник @'+norm(r[1])+' отвязан'})}
    if((r=text.match(/^\/give\s+@?(\S+)\s+(\d+)/))){await env.DB.prepare('UPDATE players SET coins=coins+? WHERE nick=?').bind(Number(r[2]),norm(r[1])).run();return J({method:'sendMessage',chat_id:chat,text:'Готово'})}}
  if(text==='/terms')return J({method:'sendMessage',chat_id:chat,text:'Правила покупок: покупки за Telegram Stars — это украшения дома и ускорения в игре «Город подписчиков». Место в рейтинге и в видео не продаётся. Лимит — 500 ⭐ в день. Если тебе нет 18 лет, спроси родителей перед покупкой. Возврат — через /paysupport.'});
  if(text==='/paysupport')return J({method:'sendMessage',chat_id:chat,text:'Проблема с оплатой или нужен возврат? Напиши сюда одним сообщением: что купил и когда. Мы ответим и вернём звёзды, если покупка не сработала или была сделана по ошибке.'});
  if(/^\/(start|help|game)/.test(text))return J({method:'sendMessage',chat_id:chat,parse_mode:'HTML',reply_markup:kb(),
    text:'🏡 <b>Город подписчиков</b>\n\n🎮 <b>Играть</b> — заходи за своего жителя, собирай доход, работай в полиции, больнице или ФК ASKER, улучшай дом и попадай в топ недели. Лучшие игроки появятся в видео!\n\n🔎 Или напиши свой ник из Instagram — покажу твой дом.'});
  const n=norm(text);if(!n||n.length<2)return J({method:'sendMessage',chat_id:chat,text:'Напиши ник из Instagram, например: @gorod.podpischikov001',reply_markup:kb()});
  const idx=await index();const x=idx.get(n);
  if(x)return J({method:'sendPhoto',chat_id:chat,photo:SITE+'/cards/'+encodeURIComponent(x[0])+'.jpg?v=4',caption:`🏡 <b>@${x[0]}</b> — дом №${x[1]}\n\n✅ ${(x[2]||[]).join(' · ')}\n\n🎮 Нажми «Играть», чтобы развивать свой дом!`,parse_mode:'HTML',reply_markup:kb()});
  const sug=[];for(const [k,v] of idx){if(k.startsWith(n)||k.includes(n))sug.push('@'+v[0]);if(sug.length>=6)break}
  return J({method:'sendMessage',chat_id:chat,text:sug.length?'Точного совпадения нет. Может быть:\n'+sug.join('\n'):'Ника @'+n+' пока нет в городе. Подпишись на @gorod.podpischikov001, поставь лайк и напиши в комментарии, какой дом хочешь!',reply_markup:kb()})}

const SETUP=`<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Подключение</title><body style="font-family:sans-serif;background:#1d1830;color:#fff;padding:24px;max-width:520px;margin:auto"><h2>Подключить игру к @gorod_podpischikov_bot</h2><p>Вставь токен из BotFather и нажми «Подключить». Токен сохранится только в закрытой базе игры: он нужен, чтобы бот выставлял счета в звёздах.</p><form method="POST"><input name="token" placeholder="1234567890:AA..." autocomplete="off" required style="width:100%;font-size:16px;padding:12px;border-radius:10px;border:0;margin:12px 0"><button style="font-size:17px;padding:12px 20px;border-radius:10px;border:0;background:#e8433a;color:#fff;font-weight:700">Подключить</button></form></body></html>`;
async function setup(env,req){const f=await req.formData();const t=(f.get('token')||'').trim();if(!/^\d+:[\w-]{30,}$/.test(t))return H('Неверный формат токена');
  const me=await fetch('https://api.telegram.org/bot'+t+'/getMe').then(r=>r.json());if(!me.ok)return H('Токен не подходит');await kv(env,'token',t);TOK=t;
  const o=[];o.push(['webhook',await tg(env,'setWebhook',{url:new URL(req.url).origin+'/',allowed_updates:['message','pre_checkout_query'],drop_pending_updates:true})]);
  o.push(['commands',await tg(env,'setMyCommands',{commands:[{command:'start',description:'Играть и найти свой дом'},{command:'terms',description:'Правила покупок'},{command:'paysupport',description:'Помощь с оплатой'}]})]);
  o.push(['menu',await tg(env,'setChatMenuButton',{menu_button:{type:'web_app',text:'🎮 Играть',web_app:{url:GAME}}})]);
  const ok=o.every(x=>x[1].ok);return H(`<body style="font-family:sans-serif;background:#1d1830;color:#fff;padding:24px"><h2>${ok?'✅ Игра подключена!':'⚠️ Что-то не так'}</h2><pre>${o.map(x=>x[0]+': '+(x[1].ok?'ok':x[1].description)).join('\n')}</pre><p>Теперь открой @${me.result.username} и отправь команду <b>/owner</b> — так бот запомнит, что ты владелец.</p></body>`)}

export default{async fetch(req,env){const P=new URL(req.url).pathname;
  if(req.method==='OPTIONS')return new Response(null,{headers:{'access-control-allow-origin':'*','access-control-allow-headers':'content-type,x-init','access-control-allow-methods':'GET,POST'}});
  if(P==='/setup')return req.method==='POST'?setup(env,req):H(SETUP);
  if(P.startsWith('/api/'))return api(env,req,P).catch(e=>J({err:'Ошибка сервера'},500));
  if(req.method!=='POST')return new Response('Город подписчиков работает');
  let u;try{u=await req.json()}catch(e){return new Response('ok')}return bot(env,u).catch(e=>new Response('ok'))}};
