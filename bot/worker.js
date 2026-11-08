const SITE='https://ishkintembur001-maker.github.io/gorod-podpischikov';
const IG='https://www.instagram.com/gorod.podpischikov001/';
let IDX=null,IDX_T=0;
async function index(){if(IDX&&Date.now()-IDX_T<600000)return IDX;const r=await fetch(SITE+'/data/index.json',{cf:{cacheTtl:300}});const a=await r.json();IDX=new Map(a.map(x=>[x[0].toLowerCase(),x]));IDX_T=Date.now();return IDX}
function norm(t){t=(t||'').trim().toLowerCase();const m=t.match(/instagram\.com\/([a-z0-9._]+)/);if(m)t=m[1];return t.replace(/^@+/,'').replace(/[\s/]+$/,'').replace(/\s+/g,'')}
const kb=()=>({inline_keyboard:[[{text:'🏙 Открыть город (поиск)',web_app:{url:SITE+'/'}}],[{text:'📲 Наша страница в Instagram',url:IG}]]});
const J=o=>new Response(JSON.stringify(o),{headers:{'content-type':'application/json'}});
export default{async fetch(req){
  if(req.method!=='POST')return new Response('Город подписчиков бот работает');
  let u;try{u=await req.json()}catch(e){return new Response('ok')}
  const m=u.message||u.edited_message;if(!m||!m.text)return new Response('ok');
  const chat=m.chat.id,text=m.text.trim();
  if(/^\/(start|help)/.test(text))return J({method:'sendMessage',chat_id:chat,parse_mode:'HTML',reply_markup:kb(),
    text:'🏡 <b>Город подписчиков</b>\n\nНапиши свой ник из Instagram — например <code>@твой_ник</code> — и я покажу твой дом и всё, что в нём построено.\n\nЕщё нет дома? Подпишись на @gorod.podpischikov001, поставь лайк и напиши в комментарии, какой дом хочешь 👇'});
  const n=norm(text);if(!n||n.length<2)return J({method:'sendMessage',chat_id:chat,text:'Напиши ник из Instagram, например: @gorod.podpischikov001'});
  const idx=await index();const x=idx.get(n);
  if(x){const chips=x[2]||[];const cap=`🏡 <b>@${x[0]}</b> — дом №${x[1]}\n\n✅ ${chips.join(' · ')}\n\n📸 Сохрани картинку и выложи в сторис с отметкой @gorod.podpischikov001!`;
    return J({method:'sendPhoto',chat_id:chat,photo:SITE+'/cards/'+encodeURIComponent(x[0])+'.jpg?v=2',caption:cap,parse_mode:'HTML',reply_markup:kb()})}
  const sug=[];for(const [k,v] of idx){if(k.startsWith(n)||k.includes(n)||(n.length>4&&n.includes(k)))sug.push(v[0]);if(sug.length>=6)break}
  if(sug.length)return J({method:'sendMessage',chat_id:chat,text:'Точно такого ника не нашёл 🤔 Может, ты:\n\n'+sug.map(s=>'@'+s).join('\n')+'\n\nОтправь ник ещё раз точно как в Instagram.',reply_markup:kb()});
  return J({method:'sendMessage',chat_id:chat,parse_mode:'HTML',reply_markup:kb(),text:`Ника <b>@${n.replace(/[<>&]/g,'')}</b> пока нет в городе 😔\n\nЧтобы получить дом:\n1️⃣ Подпишись на @gorod.podpischikov001\n2️⃣ Поставь лайк на последнее видео\n3️⃣ Напиши в комментарии, какой дом хочешь (этажи, цвет, бассейн, животные…)\n\nДом появится в следующем обновлении!`})}};
