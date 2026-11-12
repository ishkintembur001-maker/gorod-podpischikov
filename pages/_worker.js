const SRC='https://ishkintembur001-maker.github.io/gorod-podpischikov',API='https://gorod-bot.ishkin-tembur001.workers.dev';
export default{async fetch(req,env,ctx){const u=new URL(req.url);
if(u.pathname.startsWith('/api/')){const r=await fetch(API+u.pathname,{method:req.method,headers:{'content-type':'application/json'},body:req.method==='POST'?await req.text():undefined});return new Response(r.body,{status:r.status,headers:{'content-type':'application/json','cache-control':'no-store'}})}
if(u.pathname==='/game')return Response.redirect(u.origin+'/game/',301);
if(u.pathname.startsWith('/cards/')||u.pathname.startsWith('/data/')){const c=caches.default;let r=await c.match(req);if(r)return r;
const o=await fetch(SRC+u.pathname+u.search,{cf:{cacheTtl:600,cacheEverything:true}});r=new Response(o.body,o);r.headers.set('Cache-Control',u.pathname.startsWith('/data/')?'public, max-age=300':'public, max-age=3600');r.headers.delete('x-github-request-id');r.headers.delete('x-origin-cache');
if(o.ok)ctx.waitUntil(c.put(req,r.clone()));return r}
return env.ASSETS.fetch(req)}}
