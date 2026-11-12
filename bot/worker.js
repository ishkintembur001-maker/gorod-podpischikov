const SITE='https://gorod-podpischikov.pages.dev';
const IG='https://www.instagram.com/gorod.podpischikov001/';
let IDX=null,IDX_T=0;
async function index(){if(IDX&&Date.now()-IDX_T<600000)return IDX;const r=await fetch(SITE+'/data/index.json',{cf:{cacheTtl:300}});const a=await r.json();IDX=new Map(a.map(x=>[x[0].toLowerCase(),x]));IDX_T=Date.now();return IDX}
function norm(t){t=(t||'').trim().toLowerCase();const m=t.match(/instagram\.com\/([a-z0-9._]+)/);if(m)t=m[1];return t.replace(/^@+/,'').replace(/[\s/]+$/,'').replace(/\s+/g,'')}
const kb=()=>({inline_keyboard:[[{text:'🏙 Открыть город (поиск)',web_app:{url:SITE+'/'}}],[{text:'📲 Наша страница в Instagram',url:IG}]]});
const J=o=>new Response(JSON.stringify(o),{headers:{'content-type':'application/json'}});
const SETUP_HTML=`<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Подключение бота</title><style>body{font-family:sans-serif;background:#1d1830;color:#fff;padding:24px;max-width:520px;margin:auto}input{width:100%;font-size:16px;padding:12px;border-radius:10px;border:0;margin:12px 0}button{font-size:17px;padding:12px 20px;border-radius:10px;border:0;background:#e8433a;color:#fff;font-weight:700}</style></head><body><h2>Подключить @gorod_podpischikov_bot</h2><p>Вставь токен из BotFather (кнопка Copy) и нажми «Подключить». Токен нигде не сохраняется — он нужен один раз, чтобы Telegram начал присылать сообщения сюда.</p><form method="POST"><input name="token" placeholder="1234567890:AA..." autocomplete="off" required><button>Подключить</button></form></body></html>`;
async function doSetup(req){const f=await req.formData();const tok=(f.get('token')||'').trim();if(!/^\d+:[\w-]{30,}$/.test(tok))return new Response('Неверный формат токена',{status:400,headers:{'content-type':'text/plain; charset=utf-8'}});
  const api=(m,b)=>fetch('https://api.telegram.org/bot'+tok+'/'+m,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(b)}).then(r=>r.json());
  const me=new URL(req.url).origin+'/';const out=[];
  out.push(['webhook',await api('setWebhook',{url:me,allowed_updates:['message'],drop_pending_updates:true})]);
  out.push(['commands',await api('setMyCommands',{commands:[{command:'start',description:'Как найти свой дом'}]})]);
  out.push(['menu',await api('setChatMenuButton',{menu_button:{type:'web_app',text:'🏙 Найти дом',web_app:{url:SITE+'/'}}})]);
  out.push(['desc',await api('setMyDescription',{description:'Найди свой дом в «Городе подписчиков» — просто напиши ник из Instagram.'})]);
  out.push(['short',await api('setMyShortDescription',{short_description:'Найди свой дом по нику из Instagram 🏡'})]);
  const ok=out.every(x=>x[1].ok);return new Response(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font-family:sans-serif;background:#1d1830;color:#fff;padding:24px"><h2>${ok?'✅ Бот подключён!':'⚠️ Что-то не так'}</h2><pre style="white-space:pre-wrap;font-size:12px">${out.map(x=>x[0]+': '+(x[1].ok?'ok':x[1].description)).join('\n')}</pre><p>Открой @gorod_podpischikov_bot и напиши свой ник.</p></body>`,{headers:{'content-type':'text/html; charset=utf-8'}})}
export default{async fetch(req){
  const P=new URL(req.url).pathname;
  if(P==='/setup')return req.method==='POST'?doSetup(req):new Response(SETUP_HTML,{headers:{'content-type':'text/html; charset=utf-8'}});
  if(req.method!=='POST')return new Response('Город подписчиков бот работает');
  let u;try{u=await req.json()}catch(e){return new Response('ok')}
  const m=u.message||u.edited_message;if(!m||!m.text)return new Response('ok');
  const chat=m.chat.id,text=m.text.trim();
  if(/^\/(start|help)/.test(text))return J({method:'sendMessage',chat_id:chat,parse_mode:'HTML',reply_markup:kb(),
    text:'🏡 <b>Город подписчиков</b>\n\nНапиши свой ник из Instagram — например <code>@твой_ник</code> — и я покажу твой дом и всё, что в нём построено.\n\nЕщё нет дома? Подпишись на @gorod.podpischikov001, поставь лайк и напиши в комментарии, какой дом хочешь 👇'});
  const n=norm(text);if(!n||n.length<2)return J({method:'sendMessage',chat_id:chat,text:'Напиши ник из Instagram, например: @gorod.podpischikov001'});
  const idx=await index();const x=idx.get(n);
  if(x){const chips=x[2]||[];const cap=`🏡 <b>@${x[0]}</b> — дом №${x[1]}\n\n✅ ${chips.join(' · ')}\n\n📸 Сохрани картинку и выложи в сторис с отметкой @gorod.podpischikov001!`;
    return J({method:'sendPhoto',chat_id:chat,photo:SITE+'/cards/'+encodeURIComponent(x[0])+'.jpg?v=4',caption:cap,parse_mode:'HTML',reply_markup:kb()})}
  const sug=[];for(const [k,v] of idx){if(k.startsWith(n)||k.includes(n)||(n.length>4&&n.includes(k)))sug.push(v[0]);if(sug.length>=6)break}
  if(sug.length)return J({method:'sendMessage',chat_id:chat,text:'Точно такого ника не нашёл 🤔 Может, ты:\n\n'+sug.map(s=>'@'+s).join('\n')+'\n\nОтправь ник ещё раз точно как в Instagram.',reply_markup:kb()});
  return J({method:'sendMessage',chat_id:chat,parse_mode:'HTML',reply_markup:kb(),text:`Ника <b>@${n.replace(/[<>&]/g,'')}</b> пока нет в городе 😔\n\nЧтобы получить дом:\n1️⃣ Подпишись на @gorod.podpischikov001\n2️⃣ Поставь лайк на последнее видео\n3️⃣ Напиши в комментарии, какой дом хочешь (этажи, цвет, бассейн, животные…)\n\nДом появится в следующем обновлении!`})}};
