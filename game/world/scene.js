import {makeHero,walk as hwalk,tickHeroes,play as hplay,dispose as hdispose} from './hero.js';
import {THREE,renderer,scene,camera,octx,M,GEO,AG,mergeParts,rng,NIGHT_MATS,W,H} from './city.js';
import {setupWorld,WORLD,L,SP_} from './main.js';
const {BX,SP,CY,CO,part}=GEO;
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));const lerp=(a,b,t)=>a+(b-a)*t;const prog=(t,a,b)=>clamp((t-a)/(b-a));
const ease=x=>x<0.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;const easeOut=x=>1-Math.pow(1-x,3);const easeBack=x=>{if(x<=0)return 0;if(x>=1)return 1;const c1=1.70158,c3=c1+1;return 1+c3*Math.pow(x-1,3)+c1*Math.pow(x-1,2)};


// ===== EP26 =====
const P23=[
 {n:'baysultanov111',set:{fl:2,z:'riv',f:['garden','flowers'],roof:'green'}},{n:'abduerasil',set:{fl:2,f:['bigpool']}},{n:'kulova426',set:{fl:1,z:'riv',f:['yurt','garden']}},
 {n:'varvarazadorozhnia',set:{fl:3,roof:'black',f:['pool','dogs']}},{n:'akbar98112',set:{fl:1,f:['pool','garden','bbq']}},{n:'kadirov_v1',set:{fl:3,roof:'black',wall:'black'}},{n:'daanamus405',set:{fl:3,f:['pool','sauna']}},
 {n:'mar_keev48',set:{fl:3,f:['pool','garden']}},{n:'kaiyrkenislam',set:{fl:3,z:'riv',f:['pool']}},{n:'ailin85146',set:{fl:3,f:['pool','garden','playground']}},
 {n:'yusufs.555x',set:{fl:3,f:['cars'],cc:'white'}},{n:'adel.insii',set:{fl:3,f:['garden','flowers']}},{n:'animeshnick_kgz',set:{fl:2,f:['sauna','pool']}}];
const P23C=[0,2,1,3,4,5,7,9,10,11,12,13,14];
const PEOPLE=[
 {n:'nurh_an2012',w:'нурхан',txt:'дом с шариками на крыше',c:16,set:{fl:2,f:['garden'],roof:'blue'},balloons:1},
 {n:'just_watch_uliana',w:'ульяна',txt:'твой дом в видео! сад · бассейн · котики',c:17,set:{fl:2,f:['garden','pool','cats'],an:{cat:3}}},
 {n:'boboewm.1',w:'бобоев',txt:'настоящий американский дом',c:18,set:{fl:2,roof:'gray',wall:'beige',f:[]},flag:'us',usa:1},
 {n:'doolot5261',w:'доолот',txt:'дом рыбака у реки',c:0,r:3,set:{fl:1,z:'riv',roof:'brown',wall:'beige',f:[]},fish:1},
 {n:'jusub954',w:'юсуб',txt:'3 этажа · BMW · флаг Кыргызстана',c:15,set:{fl:3,f:[]},flag:'kg',bmw:1},
 {n:'kikislam7',w:'ислам',txt:'красивый новый дом',c:19,set:{fl:2,f:['garden','flowers'],roof:'green'}},
 {n:'muhammadbulachev',w:'мухаммад',txt:'3 этажа · сауна · бассейн',c:20,set:{fl:3,f:['sauna','pool'],roof:'blue'}},
 {n:'abdumalikovaa7_7_7',w:'абдум',txt:'розовый дом у гор',c:21,set:{fl:2,f:['pool','garden'],wall:'pink',roof:'pink'}},
 {n:'i1ham_jumamuratov',w:'ильхам',txt:'пентхаус на 3-м этаже',c:22,set:{fl:2,noroof:true,f:['pool']},pent:1},
 {n:'7gnov_zh',w:'гнов',txt:'3 этажа · котики',c:23,set:{fl:3,f:['cats','garden'],an:{cat:3}}},
 {n:'kamila_vekua',w:'камила',txt:'золотая крыша и цветы 🌸',c:24,set:{fl:2,f:['garden','flowers'],roof:'gold'}},
 {n:'akylai_2223',w:'акылай',txt:'синяя крыша · 3 панды · бассейн',c:25,set:{fl:2,f:['pool'],roof:'blue'},panda:1},
 {n:'suerbekovich_13',w:'суер',txt:'твой дом готов! 🔑',c:26,set:{fl:2,f:['garden','flowers'],roof:'orange'}},
 {n:'ramazan__179',txt:'дом с чёрной крышей 🖤',c:27,set:{fl:2,roof:'black',f:['garden']},flag:'dag'},
 {n:'temburhan',txt:'чёрный дом в стиле нуар',c:28,set:{fl:3,roof:'black',wall:'black',f:['garden']}},
 {n:'sumaia09072015',txt:'розовый дом, фиолетовая крыша 💜',c:29,set:{fl:2,roof:'purple',wall:'pink',f:['flowers']},flag:'kg'},
 {n:'baatyr6700',txt:'белый особняк 🏛',c:30,set:{fl:3,wall:'white',roof:'gray',f:['garden','pool']},usa:1},
 {n:'mekenovaanel',txt:'чёрно-белый дом с бассейном',c:31,set:{fl:2,wall:'white',roof:'black',f:['pool']}},
 {n:'viktoriia97117',txt:'10 котиков и баня 🐱',c:32,set:{fl:2,f:['cats','sauna'],an:{cat:10}}},
 {n:'polli_2903',txt:'сакура, бело-розовый, 3 этажа 🌸',c:33,set:{fl:3,wall:'white',roof:'pink',f:['garden']},sakura:1},
 {n:'nurbekovnaii_',txt:'3 этажа и чёрная Тесла',c:34,set:{fl:3,f:[]},tesla:1},
 {n:'susedmichal',txt:'радужная крыша и море цветов 🌈',c:35,set:{fl:2,roof:'rainbow',f:['flowers','garden']},rainbow:1}];
const SHOW=['ramazan__179','temburhan','kamila_vekua','sumaia09072015','baatyr6700','mekenovaanel','viktoriia97117','polli_2903','nurbekovnaii_','susedmichal'].map(n=>PEOPLE.find(p=>p.n===n));SHOW[2].txt='снова с нами! золотая крыша 👑';
for(const p of [...P23,...PEOPLE]){const r=window.RESIDENTS.find(q=>q.n===p.n);if(r)Object.assign(r,{an:{}},p.set);else window.RESIDENTS.push({n:p.n,g:'m',roof:'',wall:'',friend:'',an:{},cc:'',z:'any',...p.set})}
const ROWS=Math.ceil((window.RESIDENTS.length+60)/36)+1;
window.FIXED={};P23.forEach((p,i)=>window.FIXED[p.n]=[P23C[i],ROWS-2]);PEOPLE.forEach(p=>window.FIXED[p.n]=[p.c,ROWS-(p.r||2)]);
window.TREEFREE=(x,z)=>{const cx=WORLD.plaza.cx,pz=WORLD.oz+WORLD.H0+78;return (x>cx+100&&x<cx+252&&z>pz-50&&z<pz+70)||(x>cx-60&&x<cx+60&&z>pz+30&&z<pz+140)};
const houses=setupWorld();const by=WORLD.by;PEOPLE.forEach(f=>f.h=by[f.n]);
const POL=['0987654321234567890amina','aybek__2014','dilshod_9929676','rukiiat2089','aysanem281','sanzhar_2015th','nurmuhammed564','shox_o172','almaz98850','_ryspaev_57'];
// ---- hospital ----
const P=WORLD.plaza;const HS={x:P.x0+19,z:P.z1-25};
function ctex(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t}
const hosp=new THREE.Group();{
  const winT=ctex(1024,384,(c,w,h)=>{c.fillStyle='#f6f8fa';c.fillRect(0,0,w,h);for(let f=0;f<3;f++)for(let i=0;i<10;i++){if(f===0&&i>=4&&i<=5)continue;const x=30+i*99,y=24+f*124;c.fillStyle='#4e8fc4';c.fillRect(x,y,62,80);c.fillStyle='rgba(255,255,255,0.4)';c.fillRect(x+6,y+5,10,70)}c.fillStyle='#d8e3ea';c.fillRect(0,118,w,6);c.fillRect(0,242,w,6)});
  const sideT=ctex(512,384,(c,w,h)=>{c.fillStyle='#f6f8fa';c.fillRect(0,0,w,h);for(let f=0;f<3;f++)for(let i=0;i<5;i++){const x=30+i*96,y=24+f*124;c.fillStyle='#4e8fc4';c.fillRect(x,y,58,80)}});
  const signT=ctex(1024,200,(c,w,h)=>{c.fillStyle='#ffffff';c.fillRect(0,0,w,h);c.strokeStyle='#d62f2f';c.lineWidth=14;c.strokeRect(7,7,w-14,h-14);c.fillStyle='#d62f2f';c.fillRect(40,55,90,90);c.fillStyle='#fff';c.fillRect(70,65,30,70);c.fillRect(50,85,70,30);c.fillStyle='#d62f2f';c.font='900 110px "Inter Display"';c.textAlign='center';c.textBaseline='middle';c.fillText('БОЛЬНИЦА',w/2+60,h/2+6)});
  const fm=new THREE.MeshLambertMaterial({map:winT}),sm=new THREE.MeshLambertMaterial({map:sideT}),pl=new THREE.MeshLambertMaterial({color:0xf6f8fa});
  const body=new THREE.Mesh(new THREE.BoxGeometry(26,10,14),[sm,sm,pl,pl,fm,fm]);body.position.y=5;
  const roof=new THREE.Mesh(new THREE.BoxGeometry(27,0.8,15),new THREE.MeshLambertMaterial({color:0x8fa3b3}));roof.position.y=10.4;
  const crossM=new THREE.MeshLambertMaterial({color:0xd62f2f,emissive:0x5a0000});
  const c1=new THREE.Mesh(new THREE.BoxGeometry(1.4,0.4,4.6),crossM);c1.position.set(0,11,0);const c2=new THREE.Mesh(new THREE.BoxGeometry(4.6,0.4,1.4),crossM);c2.position.set(0,11,0);
  const can=new THREE.Mesh(new THREE.BoxGeometry(8,0.5,4),new THREE.MeshLambertMaterial({color:0xd62f2f}));can.position.set(0,3.6,9);
  const pst=[-3.6,3.6].map(x=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.2,3.6,8),pl);m.position.set(x,1.8,10.6);return m});
  const door=new THREE.Mesh(new THREE.BoxGeometry(4,3,0.3),M.glass);door.position.set(0,1.6,7.05);
  const sign=new THREE.Mesh(new THREE.PlaneGeometry(13,2.55),new THREE.MeshBasicMaterial({map:signT}));sign.position.set(0,12.9,6.6);const sb=new THREE.Mesh(new THREE.BoxGeometry(13.4,2.9,0.4),M.dark);sb.position.set(0,12.9,6.35);
  const amb=new THREE.Mesh(AG.car('#ffffff'),new THREE.MeshLambertMaterial({vertexColors:true}));amb.position.set(9,0,11);amb.rotation.y=Math.PI/2;amb.scale.setScalar(1.3);
  const ambX=new THREE.Mesh(new THREE.BoxGeometry(0.2,0.8,2.4),crossM);ambX.position.set(9,1.9,11);
  for(const m of [body,roof,c1,c2,can,...pst,door,sign,sb,amb,ambX]){m.castShadow=m.receiveShadow=true;hosp.add(m)}
  const yard=new THREE.Mesh(new THREE.PlaneGeometry(30,26),new THREE.MeshLambertMaterial({color:0xd9d4c8}));yard.rotation.x=-Math.PI/2;yard.position.set(HS.x,0.08,HS.z+3);yard.receiveShadow=true;scene.add(yard);WORLD.hyard=yard}
hosp.position.set(HS.x,0,HS.z);scene.add(hosp);

hosp.position.set(HS.x,0,HS.z);scene.add(hosp);WORLD.hyard.visible=true;
const MAT=c=>new THREE.MeshLambertMaterial({color:c});
function mesh(geo,mat,x,y,z,grp){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;(grp||scene).add(m);return m}
// ---- flags ----
function flagTex(k){return ctex(300,200,(c,w,h)=>{if(k==='uz'){c.fillStyle='#1eb5e6';c.fillRect(0,0,w,h/3);c.fillStyle='#fff';c.fillRect(0,h/3,w,h/3);c.fillStyle='#1eb53a';c.fillRect(0,2*h/3,w,h/3);c.fillStyle='#ce1126';c.fillRect(0,h/3-5,w,5);c.fillRect(0,2*h/3,w,5);c.fillStyle='#fff';c.beginPath();c.arc(48,34,22,0,7);c.fill();c.fillStyle='#1eb5e6';c.beginPath();c.arc(56,34,20,0,7);c.fill()}
  else if(k==='ru'){c.fillStyle='#fff';c.fillRect(0,0,w,h/3);c.fillStyle='#0039a6';c.fillRect(0,h/3,w,h/3);c.fillStyle='#d52b1e';c.fillRect(0,2*h/3,w,h/3)}
  else if(k==='am'){c.fillStyle='#d90012';c.fillRect(0,0,w,h/3);c.fillStyle='#0033a0';c.fillRect(0,h/3,w,h/3);c.fillStyle='#f2a800';c.fillRect(0,2*h/3,w,h/3)}
  else if(k==='kz'){c.fillStyle='#00afca';c.fillRect(0,0,w,h);c.fillStyle='#fec50c';c.beginPath();c.arc(w/2,h/2-6,40,0,7);c.fill();c.fillRect(w/2-60,h/2+48,120,10)}
  else if(k==='tj'){c.fillStyle='#cc0000';c.fillRect(0,0,w,h*0.29);c.fillStyle='#fff';c.fillRect(0,h*0.29,w,h*0.42);c.fillStyle='#006600';c.fillRect(0,h*0.71,w,h*0.29);c.fillStyle='#f8c300';c.font='900 60px serif';c.textAlign='center';c.textBaseline='middle';c.fillText('♛',w/2,h/2)}
  else if(k==='az'){c.fillStyle='#00b5e2';c.fillRect(0,0,w,h/3);c.fillStyle='#ef3340';c.fillRect(0,h/3,w,h/3);c.fillStyle='#509e2f';c.fillRect(0,2*h/3,w,h/3);c.fillStyle='#fff';c.beginPath();c.arc(w/2-4,h/2,22,0,7);c.fill();c.fillStyle='#ef3340';c.beginPath();c.arc(w/2+3,h/2,18,0,7);c.fill()}
  else if(k==='ing'){c.fillStyle='#fff';c.fillRect(0,0,w,h);c.fillStyle='#008a3e';c.fillRect(0,0,w,h*0.17);c.fillRect(0,h*0.83,w,h*0.17);c.strokeStyle='#d20e0e';c.lineWidth=9;c.beginPath();c.arc(w/2,h/2,36,0,7);c.stroke();for(let i=0;i<3;i++){const a=i*2.09;c.beginPath();c.arc(w/2+Math.cos(a)*22,h/2+Math.sin(a)*22,20,a+1.5,a+3.6);c.stroke()}}
  else if(k==='dag'){c.fillStyle='#1e9a3c';c.fillRect(0,0,w,h/3);c.fillStyle='#1d64b4';c.fillRect(0,h/3,w,h/3);c.fillStyle='#d52b1e';c.fillRect(0,2*h/3,w,h/3)}
  else if(k==='q'){c.fillStyle='#fff';c.fillRect(0,0,w,h);c.fillStyle='#1d1d22';c.font='900 160px "Inter Display"';c.textAlign='center';c.textBaseline='middle';c.fillText('?',w/2,h/2+8)}
  else if(k==='us'){for(let i=0;i<13;i++){c.fillStyle=i%2?'#fff':'#b22234';c.fillRect(0,i*h/13,w,h/13+1)}c.fillStyle='#3c3b6e';c.fillRect(0,0,w*0.42,h*7/13);c.fillStyle='#fff';for(let r=0;r<5;r++)for(let q=0;q<6;q++){c.beginPath();c.arc(12+q*20,12+r*21,4,0,7);c.fill()}}
  else{c.fillStyle='#e8112d';c.fillRect(0,0,w,h);c.fillStyle='#ffef00';c.beginPath();c.arc(w/2,h/2,52,0,7);c.fill();for(let i=0;i<40;i++){const a=i/40*6.283;c.beginPath();c.moveTo(w/2+Math.cos(a)*50,h/2+Math.sin(a)*50);c.lineTo(w/2+Math.cos(a+0.08)*72,h/2+Math.sin(a+0.08)*72);c.lineTo(w/2+Math.cos(a+0.16)*50,h/2+Math.sin(a+0.16)*50);c.fill()}c.fillStyle='#e8112d';c.beginPath();c.arc(w/2,h/2,34,0,7);c.fill();c.strokeStyle='#ffef00';c.lineWidth=6;c.beginPath();c.arc(w/2,h/2,26,0,7);c.stroke()}})}
const FLAGS=[];for(const p of PEOPLE){if(!p.flag||!p.h)continue;const h=p.h,f=h.face;const g=new THREE.Group();mesh(new THREE.CylinderGeometry(0.12,0.12,9,8),MAT(0xdddddd),0,4.5,0,g);
  const fg=new THREE.PlaneGeometry(3.6,2.4,12,4);const fl=new THREE.Mesh(fg,new THREE.MeshLambertMaterial({map:flagTex(p.flag),side:THREE.DoubleSide}));fl.position.set(1.85,7.6,0);g.add(fl);
  g.position.set(h.x+4.6*f,0,h.z+5.2*f);scene.add(g);FLAGS.push({fl,base:fg.attributes.position.array.slice()})}
// BMW for yusuf
{const h=by['jusub954'];if(h){const f=h.face;const c=new THREE.Mesh(AG.car('#1b1b1b'),new THREE.MeshLambertMaterial({vertexColors:true}));c.position.set(h.x+3.6*f,0,h.z+4.4*f);c.rotation.y=Math.PI/2;c.scale.setScalar(1.25);c.castShadow=true;scene.add(c);
  const lb=ctex(256,80,(x,w,hh)=>{x.fillStyle='#fff';x.fillRect(0,0,w,hh);x.fillStyle='#1c69d4';x.font='900 60px "Inter Display"';x.textAlign='center';x.textBaseline='middle';x.fillText('BMW',w/2,hh/2+3)});const s=new THREE.Sprite(new THREE.SpriteMaterial({map:lb}));s.scale.set(2.4,0.75,1);s.position.set(c.position.x,3.2,c.position.z);scene.add(s)}}
// ---- PARK ----
const PK={x:P.cx,z:WORLD.oz+WORLD.H0+40+38};
const park=new THREE.Group();scene.add(park);{
  const lawn=new THREE.Mesh(new THREE.PlaneGeometry(150,76),MAT(0x5fae47));lawn.rotation.x=-Math.PI/2;lawn.position.set(0,0.07,0);lawn.receiveShadow=true;park.add(lawn);
  const pathM=MAT(0xe3d2ae);[[150,6,0,0],[6,76,0,0]].forEach(([w,d,x,z])=>{const p=new THREE.Mesh(new THREE.PlaneGeometry(w,d),pathM);p.rotation.x=-Math.PI/2;p.position.set(x,0.09,z);p.receiveShadow=true;park.add(p)});
  const ring=new THREE.Mesh(new THREE.RingGeometry(9,14,48),pathM);ring.rotation.x=-Math.PI/2;ring.position.y=0.1;park.add(ring);
  // fence
  const fm=MAT(0xffffff);for(let i=-37;i<=37;i++){mesh(new THREE.BoxGeometry(0.25,1.4,0.25),fm,i*2,0.7,37.8,park);mesh(new THREE.BoxGeometry(0.25,1.4,0.25),fm,i*2,0.7,-37.8,park)}
  // fountain
  mesh(new THREE.CylinderGeometry(7.5,8,1.1,40),MAT(0xd9d4c8),0,0.55,0,park);const wtr=mesh(new THREE.CylinderGeometry(7,7,0.2,40),new THREE.MeshLambertMaterial({color:0x4fb4e6,emissive:0x0c3550}),0,1.05,0,park);
  mesh(new THREE.CylinderGeometry(0.8,1.2,3.4,16),MAT(0xd9d4c8),0,1.7,0,park);mesh(new THREE.CylinderGeometry(2.6,2.2,0.5,24),MAT(0xd9d4c8),0,3.4,0,park);
  // entrance arch
  const archM=MAT(0xd94f8a);mesh(new THREE.BoxGeometry(1.4,9,1.4),archM,-7,4.5,37.8,park);mesh(new THREE.BoxGeometry(1.4,9,1.4),archM,7,4.5,37.8,park);
  const sT=ctex(1024,200,(c,w,h)=>{const gr=c.createLinearGradient(0,0,w,0);gr.addColorStop(0,'#f2c230');gr.addColorStop(1,'#e8433a');c.fillStyle=gr;c.fillRect(0,0,w,h);c.fillStyle='#fff';c.font='900 120px "Inter Display"';c.textAlign='center';c.textBaseline='middle';c.fillText('ПАРК',w/2,h/2+8)});
  const sg=new THREE.Mesh(new THREE.BoxGeometry(16,3.2,0.8),[MAT(0xf2c230),MAT(0xf2c230),MAT(0xf2c230),MAT(0xf2c230),new THREE.MeshLambertMaterial({map:sT}),new THREE.MeshLambertMaterial({map:sT})]);sg.position.set(0,9.6,37.8);sg.castShadow=true;park.add(sg);
  // trees + benches + lamps
  const r=rng(77);const trunkM=MAT(0x6b4a2b),leafs=[MAT(0x3f8a3a),MAT(0x4d9b3f),MAT(0x2f7a3a)];
  for(let i=0;i<46;i++){let x,z;for(;;){x=(r()-0.5)*144;z=(r()-0.5)*70;if(Math.abs(x)>5&&Math.abs(z)>5&&Math.hypot(x,z)>16&&!(x>18&&x<72&&z<30)&&!(x<-30&&x>-70&&Math.abs(z)<24)&&!(x<-18&&x>-46&&z>8))break}
    mesh(new THREE.CylinderGeometry(0.35,0.45,3,8),trunkM,x,1.5,z,park);const lf=mesh(new THREE.IcosahedronGeometry(2.4+r()*1.2,0),leafs[i%3],x,4.4,z,park)}
  for(const [x,z,ry] of [[-12,4,0],[12,4,0],[-12,-4,Math.PI],[12,-4,Math.PI],[-30,4,0],[30,4,0]]){const b=new THREE.Group();mesh(new THREE.BoxGeometry(3.4,0.25,1),MAT(0x9a6a3a),0,0.9,0,b);mesh(new THREE.BoxGeometry(3.4,0.9,0.2),MAT(0x9a6a3a),0,1.4,-0.45,b);b.position.set(x,0,z);b.rotation.y=ry;park.add(b)}
}
// ferris wheel
const FW=new THREE.Group();const FWR=new THREE.Group();{const sM=MAT(0xf4f4f4);
  for(const s of [-1,1]){mesh(new THREE.TorusGeometry(15,0.35,8,64),MAT(0xe8433a),0,0,s*1.6,FWR);for(let i=0;i<16;i++){const sp=mesh(new THREE.BoxGeometry(0.22,15,0.22),sM,0,0,s*1.6,FWR);sp.rotation.z=i/16*Math.PI*2;sp.geometry.translate(0,7.5,0)}}
  mesh(new THREE.CylinderGeometry(0.8,0.8,4,16),MAT(0x888888),0,0,0,FWR).rotation.x=Math.PI/2;
  FW.cabs=[];const cc=[0xe8433a,0xf2c230,0x3a8fd8,0x3ab36a,0xd94f8a,0x8a5cc4];for(let i=0;i<12;i++){const a=i/12*Math.PI*2;const c=new THREE.Group();mesh(new THREE.BoxGeometry(2.2,2,2.4),MAT(cc[i%6]),0,-1.4,0,c);mesh(new THREE.BoxGeometry(2.6,0.3,2.8),MAT(0xffffff),0,-0.3,0,c);c.position.set(Math.cos(a)*15,Math.sin(a)*15,0);FWR.add(c);FW.cabs.push(c)}
  FWR.position.y=18;FW.add(FWR);for(const s of [-1,1])for(const d of [-1,1]){const l=mesh(new THREE.BoxGeometry(0.6,20,0.6),MAT(0x9aa0a8),d*5,9,s*2.6,FW);l.rotation.z=-d*0.27}
  mesh(new THREE.BoxGeometry(14,0.6,7),MAT(0xd9d4c8),0,0.3,0,FW);FW.position.set(PK.x+44,0,PK.z-14);FW.rotation.y=0.35;scene.add(FW)}
// carousel
const CAR=new THREE.Group();const CARR=new THREE.Group();{mesh(new THREE.CylinderGeometry(9,9.4,0.8,32),MAT(0xf4e3c2),0,0.4,0,CAR);mesh(new THREE.CylinderGeometry(0.9,0.9,8,16),MAT(0xf2c230),0,4,0,CAR);
  const rT=ctex(512,64,(c,w,h)=>{for(let i=0;i<16;i++){c.fillStyle=i%2?'#e8433a':'#ffffff';c.fillRect(i*32,0,32,h)}});const roof=new THREE.Mesh(new THREE.ConeGeometry(10.5,4.5,16),new THREE.MeshLambertMaterial({map:rT}));roof.position.y=9.6;roof.castShadow=true;CARR.add(roof);
  mesh(new THREE.CylinderGeometry(10.5,10.5,0.8,16),MAT(0xf2c230),0,7.1,0,CARR);
  const hc=['#ffffff','#f2a93b','#8a5cc4','#3a8fd8','#e58ab0','#3ab36a'];for(let i=0;i<10;i++){const a=i/10*Math.PI*2;mesh(new THREE.CylinderGeometry(0.12,0.12,6.4,6),MAT(0xf2c230),Math.cos(a)*7,4,Math.sin(a)*7,CARR);const h=new THREE.Mesh(AG.horse(hc[i%6]),M.vc);h.position.set(Math.cos(a)*7,0.9,Math.sin(a)*7);h.rotation.y=-a;h.scale.setScalar(1.1);h.castShadow=true;CARR.add(h)}
  CAR.add(CARR);CAR.position.set(PK.x-50,0,PK.z);scene.add(CAR)}
// swings
const SW=[];{const g=new THREE.Group();const fm=MAT(0x3a8fd8);for(const x of [-6,6]){const a=mesh(new THREE.BoxGeometry(0.4,7,0.4),fm,x,3.3,-1.4,g);a.rotation.x=0.2;const b=mesh(new THREE.BoxGeometry(0.4,7,0.4),fm,x,3.3,1.4,g);b.rotation.x=-0.2}mesh(new THREE.BoxGeometry(12.6,0.4,0.4),fm,0,6.6,0,g);
  for(let i=0;i<3;i++){const s=new THREE.Group();mesh(new THREE.BoxGeometry(0.06,5,0.06),MAT(0x555555),-0.6,-2.5,0,s);mesh(new THREE.BoxGeometry(0.06,5,0.06),MAT(0x555555),0.6,-2.5,0,s);mesh(new THREE.BoxGeometry(1.6,0.2,0.9),MAT([0xe8433a,0xf2c230,0x3ab36a][i]),0,-5,0,s);s.position.set(-4+i*4,6.4,0);g.add(s);SW.push(s)}
  g.position.set(PK.x-32,0,PK.z+22);scene.add(g)}
// park visitors
const VIS=[];{const r=rng(9);const shirts=['#e8433a','#3a8fd8','#f2c230','#3ab36a','#d94f8a','#ffffff','#8a5cc4'];for(let i=0;i<34;i++){const m=new THREE.Mesh(AG.person(shirts[i%7],'#e0b08a',['#2b3a55','#3b2a1a','#222'][i%3]),M.vc);m.castShadow=true;const a=r()*6.28,rad=16+r()*14;VIS.push({m,a,rad,sp:(r()<0.5?-1:1)*(0.05+r()*0.06),cx:PK.x+(r()-0.5)*70,cz:PK.z+(r()-0.5)*30});scene.add(m)}}
// fountain spray
const SPRAY=[];{const c=document.createElement('canvas');c.width=c.height=32;const x=c.getContext('2d');const gr=x.createRadialGradient(16,16,0,16,16,16);gr.addColorStop(0,'rgba(220,245,255,1)');gr.addColorStop(1,'rgba(220,245,255,0)');x.fillStyle=gr;x.fillRect(0,0,32,32);const mt=new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false});
  const r=rng(4);for(let i=0;i<60;i++){const s=new THREE.Sprite(mt);s.scale.setScalar(0.8);scene.add(s);SPRAY.push({s,a:r()*6.28,ph:r(),v:0.8+r()*0.4})}}
park.position.set(PK.x,0,PK.z);
// ---- POLICE STATION ----
const PS={x:P.cx+2,z:P.z0+16};const police=new THREE.Group();{
  const winT=ctex(1024,256,(c,w,h)=>{c.fillStyle='#e9eef5';c.fillRect(0,0,w,h);for(let f=0;f<2;f++)for(let i=0;i<9;i++){if(f===0&&i===4)continue;c.fillStyle='#24467d';c.fillRect(40+i*110,30+f*120,70,80)}c.fillStyle='#1f3f8a';c.fillRect(0,h-20,w,20)});
  const fm=new THREE.MeshLambertMaterial({map:winT}),pl=MAT(0xe9eef5);const body=new THREE.Mesh(new THREE.BoxGeometry(22,8,12),[pl,pl,pl,pl,fm,fm]);body.position.y=4;body.castShadow=body.receiveShadow=true;police.add(body);
  mesh(new THREE.BoxGeometry(23,0.7,13),MAT(0x1f3f8a),0,8.35,0,police);mesh(new THREE.BoxGeometry(4,3,0.3),M.glass,0,1.5,6.05,police);
  const sT=ctex(1024,200,(c,w,h)=>{c.fillStyle='#1f3f8a';c.fillRect(0,0,w,h);c.fillStyle='#fff';c.font='900 120px "Inter Display"';c.textAlign='center';c.textBaseline='middle';c.fillText('ПОЛИЦИЯ',w/2,h/2+8)});
  const sg=new THREE.Mesh(new THREE.PlaneGeometry(12,2.3),new THREE.MeshBasicMaterial({map:sT}));sg.position.set(0,10.2,5.6);police.add(sg);mesh(new THREE.BoxGeometry(12.4,2.7,0.4),M.dark,0,10.2,5.35,police);
  police.lights=[];for(const [x,c] of [[-1.2,0xff2020],[1.2,0x2050ff]]){const l=new THREE.Mesh(new THREE.BoxGeometry(2,0.7,0.9),new THREE.MeshLambertMaterial({color:c,emissive:c,emissiveIntensity:0}));l.position.set(x,9.1,0);police.add(l);police.lights.push(l)}
  police.cars=[];for(const x of [-6,6]){const cg=new THREE.Group();const c=new THREE.Mesh(AG.car('#ffffff'),new THREE.MeshLambertMaterial({vertexColors:true}));c.castShadow=true;cg.add(c);mesh(new THREE.BoxGeometry(3.62,0.3,1.72),MAT(0x1f3f8a),0,0.75,0,cg);
    const lr=new THREE.Mesh(new THREE.BoxGeometry(0.4,0.25,1.1),new THREE.MeshLambertMaterial({color:0xff2020,emissive:0xff2020,emissiveIntensity:0}));lr.position.set(-0.2,1.55,-0.3);cg.add(lr);const lb=new THREE.Mesh(new THREE.BoxGeometry(0.4,0.25,1.1),new THREE.MeshLambertMaterial({color:0x2050ff,emissive:0x2050ff,emissiveIntensity:0}));lb.position.set(-0.2,1.55,0.3);cg.add(lb);
    cg.position.set(x,0,10);cg.rotation.y=Math.PI/2;cg.scale.setScalar(1.3);police.add(cg);police.cars.push([lr,lb])}
  // officers
  police.cops=[];for(let i=0;i<5;i++){const m=new THREE.Mesh(AG.person('#1f3f8a','#e0b08a','#1a2440'),M.vc);m.position.set(-6+i*3,0,14);m.scale.setScalar(1.35);m.castShadow=true;police.add(m);const cap=mesh(new THREE.CylinderGeometry(0.3,0.32,0.18,10),MAT(0x14234a),-6+i*3,2.75,14,police);police.cops.push(m,cap)}
  const yd=new THREE.Mesh(new THREE.PlaneGeometry(28,24),MAT(0xcfd5dd));yd.rotation.x=-Math.PI/2;yd.position.set(0,0.08,5);yd.receiveShadow=true;police.add(yd)}
police.position.set(PS.x,0,PS.z);scene.add(police);
// ---- extra cops (10 total) ----
for(let i=0;i<5;i++){const m=new THREE.Mesh(AG.person('#1f3f8a','#e0b08a','#1a2440'),M.vc);m.position.set(-6+i*3,0,17.5);m.scale.setScalar(1.35);m.castShadow=true;police.add(m);mesh(new THREE.CylinderGeometry(0.3,0.32,0.18,10),MAT(0x14234a),-6+i*3,2.75,17.5,police)}
const HX=(h,lx,lz)=>[h.x+lx*h.face,h.z+lz*h.face];
for(const p of PEOPLE){const h=p.h;if(!h||!(p.set.an&&p.set.an.cat))continue;for(let i=0;i<Math.min(10,p.set.an.cat);i++){const [x,z]=HX(h,-5.6+(i%5)*1.4,3.4+Math.floor(i/5)*1.5+(i%2)*0.4);const m=new THREE.Mesh(AG.cat('#f2a93b'),M.vc);m.position.set(x,0,z);m.rotation.y=i*1.7;m.scale.setScalar(1.3);m.castShadow=true;scene.add(m)}}
// ---- balloons ----
const BAL=[];{const p=PEOPLE.find(p=>p.balloons);const h=p&&p.h;if(h){const r=rng(5);const cols=[0xe8433a,0xf2c230,0x3a8fd8,0x3ab36a,0xd94f8a,0x8a5cc4,0xff8a2a];const [cx,cz]=HX(h,0,-1.6);
  for(let i=0;i<16;i++){const a=r()*6.28,rad=r()*1.8,y=h.top+2.2+r()*4.2;const m=mesh(new THREE.SphereGeometry(0.75,14,10),new THREE.MeshLambertMaterial({color:cols[i%7],emissive:cols[i%7],emissiveIntensity:0.15}),cx+Math.cos(a)*rad,y,cz+Math.sin(a)*rad);m.scale.y=1.18;
    const st=mesh(new THREE.CylinderGeometry(0.03,0.03,y-h.top+0.5,4),MAT(0xffffff),0,0,0);st.position.set((cx+m.position.x)/2,(h.top-0.5+y)/2,(cz+m.position.z)/2);st.lookAt(m.position.x,y,m.position.z);st.rotateX(Math.PI/2);
    BAL.push({m,y0:y,ph:r()*6})}}}
// ---- American house: porch, garage, mailbox ----
{const p=PEOPLE.find(p=>p.usa);const h=p&&p.h;if(h){const f=h.face;const ry=f>0?0:Math.PI;const W=MAT(0xffffff);
  for(const lx of [-4,-1.4,1.4,4]){const [x,z]=HX(h,lx,2.9);mesh(new THREE.CylinderGeometry(0.22,0.22,3.1,10),W,x,2.15,z)}
  {const [x,z]=HX(h,0,3.4);const s=mesh(new THREE.BoxGeometry(4,0.3,1.4),MAT(0xd9d4c8),x,0.45,z);s.rotation.y=ry}
  {const [x,z]=HX(h,-6.2,-1.2);const g=mesh(new THREE.BoxGeometry(2.6,2.8,5.4),MAT(0xf1e1c4),x,1.4,z);g.rotation.y=ry;const [dx,dz]=HX(h,-6.2,1.55);const d=mesh(new THREE.BoxGeometry(2.2,2.2,0.1),MAT(0xffffff),dx,1.2,dz);d.rotation.y=ry;const [rx,rz]=HX(h,-6.2,-1.2);const rf=mesh(new THREE.BoxGeometry(2.9,0.3,5.8),MAT(0x7a7a86),rx,2.95,rz);rf.rotation.y=ry}
  {const [x,z]=HX(h,3.5,6.9);mesh(new THREE.CylinderGeometry(0.08,0.08,1.3,6),MAT(0x333333),x,0.65,z);const mb=mesh(new THREE.BoxGeometry(0.5,0.45,0.9),MAT(0x2d5fb8),x,1.45,z);mb.rotation.y=ry;mesh(new THREE.BoxGeometry(0.06,0.4,0.25),MAT(0xe8433a),x+0.3,1.6,z)}
  {const [x,z]=HX(h,-3.6,4.8);const c=new THREE.Mesh(AG.car('#d63a2f'),new THREE.MeshLambertMaterial({vertexColors:true}));c.position.set(x,0,z);c.rotation.y=ry+Math.PI/2;c.scale.setScalar(1.25);c.castShadow=true;scene.add(c)}}}
// ---- fisherman house: pier, boat, fisherman ----
const FISH={};{const p=PEOPLE.find(p=>p.fish);const h=p&&p.h;if(h){const rv=WORLD.river;const xb=rv.x+rv.w/2;const wood=MAT(0x8b5a2b),dw=MAT(0x6b4220);
  const wk=mesh(new THREE.BoxGeometry(h.x-7.4-xb,0.2,2),wood,(h.x-7.4+xb)/2,0.12,h.z);
  const pier=mesh(new THREE.BoxGeometry(11,0.35,3.2),wood,xb-5.2,0.55,h.z);for(const dx of [-10,-6,-2])for(const dz of [-1.4,1.4])mesh(new THREE.CylinderGeometry(0.18,0.18,1.6,6),dw,xb+dx,0.1,h.z+dz);
  const boat=new THREE.Group();mesh(new THREE.BoxGeometry(5.2,0.9,2),MAT(0x2d6cdf),0,0.3,0,boat);mesh(new THREE.BoxGeometry(4.6,0.12,1.6),MAT(0xc89a5a),0,0.72,0,boat);mesh(new THREE.ConeGeometry(1,1.6,4),MAT(0x2d6cdf),3.1,0.3,0,boat).rotation.z=-Math.PI/2;boat.position.set(xb-6,0,h.z+3.2);scene.add(boat);FISH.boat=boat;
  const fm=new THREE.Mesh(AG.person('#e07a2a','#e0b08a','#2b3a55'),M.vc);fm.scale.setScalar(1.3);fm.position.set(xb-9.6,0.72,h.z-0.6);fm.rotation.y=-Math.PI/2;fm.castShadow=true;scene.add(fm);
  mesh(new THREE.CylinderGeometry(0.35,0.4,0.15,10),MAT(0xc9a24e),xb-9.6,3.25,h.z-0.6);
  const rod=mesh(new THREE.CylinderGeometry(0.04,0.06,6,5),MAT(0x333333),xb-12,3.4,h.z-0.6);rod.rotation.z=1.0;FISH.rod=rod;
  const ln=mesh(new THREE.CylinderGeometry(0.015,0.015,4.2,3),MAT(0xffffff),xb-14.6,2.6,h.z-0.6);FISH.ln=ln;
  const bob=mesh(new THREE.SphereGeometry(0.22,8,6),MAT(0xe8433a),xb-14.6,0.25,h.z-0.6);FISH.bob=bob;
  {const [x,z]=HX(h,5.2,-4.8);for(const dx of [-1.6,1.6])mesh(new THREE.CylinderGeometry(0.1,0.1,2.4,6),dw,x+dx,1.2,z);const net=mesh(new THREE.PlaneGeometry(3.2,1.8),new THREE.MeshLambertMaterial({color:0x9fb6a0,side:THREE.DoubleSide,transparent:true,opacity:0.8}),x,1.4,z)}
  {const [x,z]=HX(h,-4.5,4.5);for(let i=0;i<3;i++){const b=mesh(new THREE.CylinderGeometry(0.5,0.5,0.6,10),MAT(0x7a4a22),x+i*1.1,0.3,z)}}}}
// ---- penthouse ----
{const p=PEOPLE.find(p=>p.pent);const h=p&&p.h;if(h){const f=h.face;const ry=f>0?0:Math.PI;const y0=6.6;
  const [cx,cz]=HX(h,0,-1.6);const sl=mesh(new THREE.BoxGeometry(9.6,0.35,7.6),MAT(0xe9e4da),cx,y0+0.15,cz);sl.rotation.y=ry;
  const [gx,gz]=HX(h,0,-2.8);const gm=new THREE.MeshLambertMaterial({color:0x7fb8d8,transparent:true,opacity:0.75,emissive:0x173a52});const gb=mesh(new THREE.BoxGeometry(6.4,2.8,4.2),gm,gx,y0+1.75,gz);gb.rotation.y=ry;
  const rf=mesh(new THREE.BoxGeometry(7.2,0.35,5),MAT(0x2b2b2b),gx,y0+3.3,gz);rf.rotation.y=ry;const gold=mesh(new THREE.BoxGeometry(7.25,0.12,5.05),MAT(0xd4a83a),gx,y0+3.1,gz);gold.rotation.y=ry;
  const rm=new THREE.MeshLambertMaterial({color:0xbfe4f5,transparent:true,opacity:0.45});for(const [lx,lz,w,d] of [[0,2.15,9.4,0.08],[-4.7,-1.6,0.08,7.4],[4.7,-1.6,0.08,7.4]]){const [x,z]=HX(h,lx,lz);const r=mesh(new THREE.BoxGeometry(w,1,d),rm,x,y0+0.8,z);r.rotation.y=ry}
  for(const lx of [-2.6,0.2]){const [x,z]=HX(h,lx,1.1);const l=mesh(new THREE.BoxGeometry(1,0.3,2.2),MAT(0xffffff),x,y0+0.5,z);l.rotation.y=ry}
  {const [x,z]=HX(h,3,0.6);mesh(new THREE.CylinderGeometry(0.06,0.06,2.6,6),MAT(0x666666),x,y0+1.5,z);mesh(new THREE.ConeGeometry(1.8,0.7,10),MAT(0xf2c230),x,y0+2.9,z)}
  {const [x,z]=HX(h,-3.4,-3.6);const pl=mesh(new THREE.BoxGeometry(2.4,0.15,1.6),M.water,x,y0+0.4,z);pl.rotation.y=ry}
  h.top=y0+4}}
// ---- FOOTBALL: FC ASKER ----
function crest(c,x,y,s){c.save();c.translate(x,y);c.scale(s,s);c.beginPath();c.moveTo(-100,-120);c.lineTo(100,-120);c.lineTo(100,10);c.quadraticCurveTo(100,90,0,135);c.quadraticCurveTo(-100,90,-100,10);c.closePath();
  const gr=c.createLinearGradient(0,-120,0,135);gr.addColorStop(0,'#c0262d');gr.addColorStop(1,'#7c1418');c.fillStyle=gr;c.fill();c.lineWidth=12;c.strokeStyle='#f2c14e';c.stroke();
  c.fillStyle='#f2c14e';c.fillRect(-100,-62,200,34);c.font='900 30px "Inter Display"';c.textAlign='center';c.textBaseline='middle';c.fillStyle='#7c1418';c.fillText('ФК',0,-44);
  c.fillStyle='#fff';c.beginPath();c.arc(0,40,40,0,7);c.fill();c.fillStyle='#222';for(let i=0;i<5;i++){const a=i/5*6.283-1.57;c.beginPath();c.arc(Math.cos(a)*26,40+Math.sin(a)*26,9,0,7);c.fill()}c.beginPath();c.arc(0,40,11,0,7);c.fill();
  c.font='900 44px "Inter Display"';c.fillStyle='#fff';c.fillText('ASKER',0,-90);c.restore()}
const FB={x:PK.x,z:PK.z+38+48};const field=new THREE.Group();const PLAY=[];let BALL;{
  const ft=ctex(1360,880,(c,w,h)=>{for(let i=0;i<12;i++){c.fillStyle=i%2?'#4f9e3a':'#5bad44';c.fillRect(i*w/12,0,w/12+1,h)}c.strokeStyle='#fff';c.lineWidth=7;c.strokeRect(20,20,w-40,h-40);c.beginPath();c.moveTo(w/2,20);c.lineTo(w/2,h-20);c.stroke();c.beginPath();c.arc(w/2,h/2,95,0,7);c.stroke();
    for(const s of [0,1]){const x0=s?w-20:20,d=s?-1:1;c.strokeRect(Math.min(x0,x0+d*200),h/2-210,200,420);c.strokeRect(Math.min(x0,x0+d*70),h/2-100,70,200)}c.fillStyle='#fff';c.beginPath();c.arc(w/2,h/2,8,0,7);c.fill()});
  const g=new THREE.Mesh(new THREE.PlaneGeometry(72,46),new THREE.MeshLambertMaterial({map:ft}));g.rotation.x=-Math.PI/2;g.position.y=0.1;g.receiveShadow=true;field.add(g);
  const tr=new THREE.Mesh(new THREE.PlaneGeometry(84,60),MAT(0xb4513a));tr.rotation.x=-Math.PI/2;tr.position.y=0.08;tr.receiveShadow=true;field.add(tr);
  const wM=MAT(0xffffff);for(const s of [-1,1]){const gx=s*34.6;mesh(new THREE.BoxGeometry(0.3,2.6,0.3),wM,gx,1.3,-3.6,field);mesh(new THREE.BoxGeometry(0.3,2.6,0.3),wM,gx,1.3,3.6,field);mesh(new THREE.BoxGeometry(0.3,0.3,7.5),wM,gx,2.6,0,field);
    const net=new THREE.Mesh(new THREE.BoxGeometry(2,2.6,7.2),new THREE.MeshLambertMaterial({color:0xffffff,transparent:true,opacity:0.35}));net.position.set(gx+s*1,1.3,0);field.add(net)}
  const sm=[MAT(0xc0262d),MAT(0xf2c14e),MAT(0xe9e4da)];for(const s of [-1,1]){const tiers=s<0?5:3;for(let k=0;k<tiers;k++){mesh(new THREE.BoxGeometry(70,1.2,2.4),sm[k%3],0,0.6+k*1.2,s*(31+k*2.4),field)}}
  for(let k=0;k<5;k++){const r=rng(40+k);for(let i=0;i<34;i++){if(r()<0.35)continue;const m=new THREE.Mesh(AG.person(['#c0262d','#f2c14e','#ffffff'][(i+k)%3],'#e0b08a','#2b3a55'),M.vc);m.position.set(-33+i*2,1.2+k*1.2,-(31+k*2.4));m.scale.setScalar(0.9);field.add(m)}}
  for(const [x,z] of [[-40,-30],[40,-30],[-40,30],[40,30]]){mesh(new THREE.CylinderGeometry(0.4,0.6,22,8),MAT(0x9aa0a8),x,11,z,field);const lb=mesh(new THREE.BoxGeometry(5,2.4,0.6),new THREE.MeshLambertMaterial({color:0xffffff,emissive:0xfff2c0,emissiveIntensity:0.4}),x,22,z,field);lb.lookAt(0,0,0)}
  const sT=ctex(1400,440,(c,w,h)=>{c.fillStyle='#1d1d22';c.fillRect(0,0,w,h);c.strokeStyle='#f2c14e';c.lineWidth=16;c.strokeRect(8,8,w-16,h-16);crest(c,220,h/2+5,1.25);c.fillStyle='#fff';c.font='900 180px "Inter Display"';c.textAlign='left';c.textBaseline='middle';c.fillText('ASKER',420,h/2-30);c.fillStyle='#f2c14e';c.font='900 70px "Inter Display"';c.fillText('ФУТБОЛЬНЫЙ КЛУБ',428,h/2+110)});
  const sg=new THREE.Mesh(new THREE.PlaneGeometry(30,9.4),new THREE.MeshBasicMaterial({map:sT}));sg.position.set(0,15.5,-44.2);field.add(sg);mesh(new THREE.BoxGeometry(31,10.2,0.6),M.dark,0,15.5,-44.6,field);for(const x of [-12,12])mesh(new THREE.BoxGeometry(0.8,11,0.8),MAT(0x555555),x,5.5,-44.6,field);
  const r=rng(12);for(let i=0;i<14;i++){const red=i<7;const m=new THREE.Mesh(AG.person(red?'#c0262d':'#ffffff','#e0b08a',red?'#f2c14e':'#1d1d22'),M.vc);m.scale.setScalar(1.25);m.castShadow=true;field.add(m);PLAY.push({m,hx:(red?-1:1)*(6+r()*24),hz:(r()-0.5)*34,ph:r()*6,sp:0.6+r()*0.6})}
  BALL=mesh(new THREE.SphereGeometry(0.45,12,8),MAT(0xffffff),0,0.45,0,field)}
field.position.set(FB.x,0,FB.z);scene.add(field);
// ---- VIP district ----
const VP={x:PK.x+176,z:PK.z+10};const vip=new THREE.Group();const VPL=[];const CR=[];{
  const gd=new THREE.Mesh(new THREE.PlaneGeometry(128,96),MAT(0xd8cfbd));gd.rotation.x=-Math.PI/2;gd.position.y=0.07;gd.receiveShadow=true;vip.add(gd);
  const goldM=new THREE.MeshLambertMaterial({color:0xd4a83a,emissive:0x3a2a05}),blk=MAT(0x1d1d22);
  for(let i=-31;i<=31;i++){mesh(new THREE.BoxGeometry(0.4,2,0.4),goldM,i*2,1,47.8,vip);mesh(new THREE.BoxGeometry(0.4,2,0.4),goldM,i*2,1,-47.8,vip)}for(let i=-23;i<=23;i++){mesh(new THREE.BoxGeometry(0.4,2,0.4),goldM,63.8,1,i*2,vip);mesh(new THREE.BoxGeometry(0.4,2,0.4),goldM,-63.8,1,i*2,vip)}
  for(const x of [-9,9])mesh(new THREE.BoxGeometry(1.8,13,1.8),blk,x,6.5,47.8,vip);
  const aT=ctex(1200,300,(c,w,h)=>{c.fillStyle='#1d1d22';c.fillRect(0,0,w,h);const gr=c.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#fff3c4');gr.addColorStop(0.5,'#f2c14e');gr.addColorStop(1,'#b8792a');c.strokeStyle=gr;c.lineWidth=14;c.strokeRect(10,10,w-20,h-20);c.fillStyle=gr;c.font='900 150px "Inter Display"';c.textAlign='center';c.textBaseline='middle';c.fillText('👑 VIP РАЙОН',w/2,h/2+6)});
  const an=new THREE.Mesh(new THREE.BoxGeometry(22,5.5,1),[blk,blk,blk,blk,new THREE.MeshBasicMaterial({map:aT}),new THREE.MeshBasicMaterial({map:aT})]);an.position.set(0,13,47.8);an.castShadow=true;vip.add(an);
  const vT=ctex(128,64,(c,w,h)=>{c.fillStyle='#1d1d22';c.fillRect(0,0,w,h);c.fillStyle='#f2c14e';c.font='900 44px "Inter Display"';c.textAlign='center';c.textBaseline='middle';c.fillText('VIP',w/2,h/2+2)});
  for(let i=0;i<20;i++){const c=i%5,r=Math.floor(i/5);const x=-48+c*24,z=-33+r*21;const g=new THREE.Group();mesh(new THREE.BoxGeometry(16,0.6,13),MAT(0xa9a9a4),0,0.3,0,g);
    for(const [a,b] of [[-8,-6.5],[8,-6.5],[-8,6.5],[8,6.5]])mesh(new THREE.CylinderGeometry(0.25,0.25,1.6,6),goldM,a,0.8,b,g);
    const s=new THREE.Sprite(new THREE.SpriteMaterial({map:vT}));s.scale.set(3.2,1.6,1);s.position.set(0,3.2,6.5);g.add(s);
    if([6,8,11,13].includes(i)){const fl=i%2?2:3;for(let k=0;k<fl;k++){mesh(new THREE.BoxGeometry(14,0.4,11),MAT(0xc9c6bf),0,3.2*(k+1),0,g);for(const [a,b] of [[-6.5,-5],[6.5,-5],[-6.5,5],[6.5,5],[0,-5],[0,5]])mesh(new THREE.BoxGeometry(0.6,3.2,0.6),MAT(0xbdbab2),a,1.6+3.2*k+0.6,b,g)}
      const sc=MAT(0xe2a03a);for(let k=0;k<=fl;k++){mesh(new THREE.BoxGeometry(15,0.15,0.15),sc,0,1+3.2*k,6.2,g);}for(const a of [-7.4,-2.5,2.5,7.4])mesh(new THREE.BoxGeometry(0.15,3.2*fl+1,0.15),sc,a,(3.2*fl+1)/2,6.2,g)}
    g.position.set(x,0,z);vip.add(g);VPL.push(g)}
  for(const [x,z,s] of [[-34,-2,1],[30,14,-1]]){const c=new THREE.Group();const y=MAT(0xf2c230);mesh(new THREE.BoxGeometry(1.2,34,1.2),y,0,17,0,c);const jib=new THREE.Group();mesh(new THREE.BoxGeometry(30,1,1),y,9,0,0,jib);mesh(new THREE.BoxGeometry(3,2,1.6),MAT(0x555555),-5,-0.6,0,jib);mesh(new THREE.BoxGeometry(1.6,1.6,1.6),MAT(0x2d6cdf),0.8,-1.3,0,jib);mesh(new THREE.CylinderGeometry(0.05,0.05,14,4),MAT(0x222222),18,-7,0,jib);mesh(new THREE.BoxGeometry(1.6,1.2,1.6),MAT(0xa9a9a4),18,-14.3,0,jib);jib.position.y=34;c.add(jib);c.position.set(x,0,z);vip.add(c);CR.push({jib,s})}
  const r=rng(31);for(let i=0;i<8;i++){const m=new THREE.Mesh(AG.person('#ff8a2a','#e0b08a','#2b3a55'),M.vc);m.scale.setScalar(1.3);const hat=new THREE.Mesh(new THREE.SphereGeometry(0.3,8,6,0,6.3,0,1.6),MAT(0xf2c230));hat.position.y=2.0;m.add(hat);m.position.set((r()-0.5)*90,0,(r()-0.5)*60);vip.add(m);VPL.push&&0}}
vip.position.set(VP.x,0,VP.z);scene.add(vip);
// ---- hospital staff leaving ----
const DOCS=[];{const r=rng(8);for(let i=0;i<7;i++){const m=new THREE.Mesh(AG.person('#ffffff','#e0b08a',i%2?'#7fb8d8':'#2b3a55'),M.vc);m.scale.setScalar(1.35);m.castShadow=true;scene.add(m);const box=mesh(new THREE.BoxGeometry(0.9,0.7,0.6),MAT(0xc89a5a),0,0,0);DOCS.push({m,box,x:HS.x+(i-3)*1.6+(r()-0.5),d:i*0.25,sp:5+r()*2})}}
const vacT=ctex(1024,200,(c,w,h)=>{c.fillStyle='#e8433a';c.fillRect(0,0,w,h);c.fillStyle='#fff';c.font='900 120px "Inter Display"';c.textAlign='center';c.textBaseline='middle';c.fillText('ВАКАНСИИ',w/2,h/2+6)});
const vac=new THREE.Mesh(new THREE.PlaneGeometry(10,2),new THREE.MeshBasicMaterial({map:vacT}));vac.position.set(HS.x,7.6,HS.z+7.3);scene.add(vac);vac.visible=false;
// sparkles
const SPK=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');const gr=x.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,250,200,1)');gr.addColorStop(0.3,'rgba(255,220,90,0.7)');gr.addColorStop(1,'rgba(255,200,60,0)');x.fillStyle=gr;x.fillRect(0,0,64,64);return new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true})})();
const SPARK=[];{const r=rng(3);for(let i=0;i<40;i++){const s=new THREE.Sprite(SPK);s.visible=false;scene.add(s);SPARK.push({s,a:r()*6.28,rad:6+r()*12,sp:0.5+r(),y0:r()*14,ph:r()})}}
const DAY={hemiS:new THREE.Color(0xe6eef5),hemiG:new THREE.Color(0x55703a),hemiI:1.5,sunC:new THREE.Color(0xfff1dc),sunI:2.0,top:new THREE.Color(0x7f8f9e),hor:new THREE.Color(0xc9d2d4),fog:new THREE.Color(0xc9d2d4),exp:1.05};
const NIG={hemiS:new THREE.Color(0x7484c0),hemiG:new THREE.Color(0x1d2622),hemiI:0.72,sunC:new THREE.Color(0xa9bcff),sunI:0.6,top:new THREE.Color(0x070d22),hor:new THREE.Color(0x24345c),fog:new THREE.Color(0x1a2442),exp:1.08};
const tmpC=new THREE.Color();
function applyLight(n,t){L.hemi.color.copy(DAY.hemiS).lerp(NIG.hemiS,n);L.hemi.groundColor.copy(DAY.hemiG).lerp(NIG.hemiG,n);L.hemi.intensity=lerp(DAY.hemiI,NIG.hemiI,n);
  L.sun.color.copy(DAY.sunC).lerp(NIG.sunC,n);L.sun.intensity=lerp(DAY.sunI,NIG.sunI,n);
  WORLD.sky.material.uniforms.top.value.copy(DAY.top).lerp(NIG.top,n);WORLD.sky.material.uniforms.hor.value.copy(DAY.hor).lerp(NIG.hor,n);
  scene.fog.color.copy(DAY.fog).lerp(NIG.fog,n);scene.fog.near=lerp(500,180,n);scene.fog.far=lerp(3200,1500,n);
  for(const m of NIGHT_MATS)m.emissiveIntensity=1.25*clamp((n-0.35)/0.5);
  L.fire.intensity=lerp(0,600,n);
  renderer.toneMappingExposure=lerp(DAY.exp,NIG.exp,n)}


let E={},WORDS=[],VOFF=0,DUR=10;
const g=octx;
function rr(x,y,w,h,r){g.beginPath();g.roundRect(x,y,w,h,r)}
function txt(s,x,y,size,fill,stroke,sw,font='Inter Display',wgt=900,align='center'){g.font=`${wgt} ${size}px "${font}"`;g.textAlign=align;g.textBaseline='middle';if(stroke){g.lineJoin='round';g.strokeStyle=stroke;g.lineWidth=sw;g.strokeText(s,x,y)}g.fillStyle=fill;g.fillText(s,x,y)}
function goldGrad(y0,y1){const gr=g.createLinearGradient(0,y0,0,y1);gr.addColorStop(0,'#fff3c4');gr.addColorStop(0.5,'#f2c14e');gr.addColorStop(1,'#b8792a');return gr}
function serif(s,y,size,a){if(a<=0.01)return;g.save();g.globalAlpha=Math.min(1,a);g.shadowColor='rgba(0,0,0,0.55)';g.shadowBlur=18;txt(s,540,y,size,goldGrad(y-size/2,y+size/2),'#3a2410',Math.max(4,size/12),'DejaVu Serif',700);g.restore()}
function big(s,y,size,col,a){if(a<=0.01)return;g.save();g.translate(540,y);g.scale(a,a);g.shadowColor='rgba(0,0,0,0.5)';g.shadowBlur=16;txt(s,0,0,size,col,'#2a1b3d',size*0.16);g.restore()}
function pillC(s,p1,p2,p3,p4,p5,p6){let y,size,bg,fg,a;if(typeof p3==='number'){y=p2;size=p3;bg=p4;fg=p5;a=p6}else{y=p1;size=p2;bg=p3;fg=p4;a=p5}if(a<=0.01)return;g.save();g.translate(540,y);g.scale(a,a);g.font=`900 ${size}px "Inter Display"`;const w=g.measureText(s).width+size*1.3,h=size*1.7;g.shadowColor='rgba(0,0,0,0.35)';g.shadowBlur=18;rr(-w/2,-h/2,w,h,h/2);g.fillStyle=bg;g.fill();g.shadowBlur=0;txt(s,0,2,size,fg);g.restore()}
function heartI(x,y,s,col){g.save();g.translate(x,y);g.scale(s,s);g.fillStyle=col;g.beginPath();g.moveTo(0,12);g.bezierCurveTo(-26,-6,-12,-28,0,-12);g.bezierCurveTo(12,-28,26,-6,0,12);g.fill();g.restore()}
const ap=(t,a,b,fi=0.35,fo=0.3)=>easeBack(prog(t,a-0.05,a+fi))*(1-prog(t,b-fo,b));
const _v=new THREE.Vector3();function proj(x,y,z){_v.set(x,y,z).project(camera);return [(_v.x*0.5+0.5)*W,(-_v.y*0.5+0.5)*H,_v.z]}
function wt(word,n=0,se='s'){let k=0;for(const x of WORDS){const c=x.w.toLowerCase();if(c===word){if(k===n)return VOFF+x[se];k++}}console.warn('nf',word);return 1e9}


const FOLLOW=1552;
function card(s,sub,y,a,w0=620){g.save();g.translate(540,y);g.scale(a,a);let fs=60;g.font=`900 ${fs}px "Inter Display"`;while(g.measureText(s).width>900&&fs>36){fs-=2;g.font=`900 ${fs}px "Inter Display"`}g.font='700 34px "Inter Display"';const w=Math.min(1000,Math.max(g.measureText(sub).width+90,w0,fs*s.length*0.55+90));rr(-w/2,-70,w,150,34);g.fillStyle='#fbf3df';g.shadowColor='rgba(0,0,0,0.35)';g.shadowBlur=22;g.fill();g.shadowBlur=0;g.lineWidth=6;g.strokeStyle='#c9a24e';g.stroke();txt(s,0,-22,fs-4,'#7a3b12');txt(sub,0,40,34,'#4a3a2c',null,0,'Inter Display',700);g.restore()}
function pin(x,y,a){g.save();g.globalAlpha=Math.min(1,a);g.fillStyle='#e8433a';g.beginPath();g.arc(x,y-40,26,0,7);g.fill();g.beginPath();g.moveTo(x-18,y-24);g.lineTo(x+18,y-24);g.lineTo(x,y+6);g.fill();g.fillStyle='#fff';g.beginPath();g.arc(x,y-40,10,0,7);g.fill();g.restore()}
function confetti(t,t0,a){if(a<=0.01)return;const r=rng(11);g.save();g.globalAlpha=Math.min(1,a);for(let i=0;i<90;i++){const x=r()*1080,sp=300+r()*500,y=-40+((t-t0)*sp+r()*1900)%2000,rot=t*3+r()*6;g.save();g.translate(x+Math.sin(t*2+i)*30,y);g.rotate(rot);g.fillStyle=['#f2c230','#e8433a','#3a8fd8','#3ab36a','#d94f8a'][i%5];g.fillRect(-9,-5,18,10);g.restore()}g.restore()}
function panel(y,w,h,a,fn){if(a<=0.01)return;g.save();g.translate(540,y);g.scale(a,a);rr(-w/2,-h/2,w,h,40);g.fillStyle='rgba(255,255,255,0.97)';g.shadowColor='rgba(0,0,0,0.4)';g.shadowBlur=30;g.fill();g.shadowBlur=0;fn();g.restore()}
function checks(t,items,y0,step){items.forEach(([s,tt],i)=>{const on=t>tt;const y=y0+i*step;txt(s,-350,y,44,on?'#111':'#9aa0a8',null,0,'Inter Display',900,'left');g.fillStyle=on?'#2bb24c':'#e6e6e6';g.beginPath();g.arc(350,y,28,0,7);g.fill();if(on){g.strokeStyle='#fff';g.lineWidth=7;g.beginPath();g.moveTo(336,y);g.lineTo(347,y+12);g.lineTo(366,y-13);g.stroke()}})}
// ===== EP27 extras =====
const DOCS27=['kamila_vekua','akylai_2223','kasmanbetovo','koala.56099','jibek101112','tamiev_005','timoti2641','khorshat.zhannur','zinaida99195','asemaiym19','apiyza68','aleksandra47304'];
const FOOT=['csplayerdonk','bak1rovws_','xvemo.on','muhammadbulachev','adelia74965','mr.alihan4444','magomedgajiev.7l','boyazid.007','aisulu_nurlybek','nurillo_tigr','kanybekovnurislam','nurislam89636','marsbekov0707','nurles983','tima130317','alinur60626','amir_bazarbaev16'];
// pandas
{const p=PEOPLE.find(p=>p.panda);const h=p&&p.h;if(h){const W=MAT(0xf7f5f0),B=MAT(0x1d1d22);for(let i=0;i<3;i++){const g=new THREE.Group();const b=mesh(new THREE.SphereGeometry(0.75,12,10),W,0,0.85,0,g);b.scale.set(1.25,0.9,0.95);mesh(new THREE.SphereGeometry(0.5,12,10),W,0.95,1.35,0,g);
  for(const z of [-0.32,0.32]){mesh(new THREE.SphereGeometry(0.17,8,6),B,0.85,1.8,z,g);mesh(new THREE.SphereGeometry(0.13,8,6),B,1.38,1.42,z*0.55,g)}mesh(new THREE.SphereGeometry(0.09,8,6),B,1.47,1.27,0,g);
  for(const [x,z] of [[-0.5,-0.4],[-0.5,0.4],[0.5,-0.4],[0.5,0.4]])mesh(new THREE.CylinderGeometry(0.24,0.24,0.6,8),B,x,0.3,z,g);mesh(new THREE.SphereGeometry(0.62,10,8),B,0.1,1.05,0,g).scale.set(0.7,0.55,1.6);
  const [x,z]=HX(h,-4.8+i*2.1,3.6+(i%2)*1.3);g.position.set(x,0,z);g.rotation.y=-1.2+i*0.9;g.scale.setScalar(1.15);g.traverse(o=>o.castShadow=true);scene.add(g)}}}
// hospital staff
const STAFF=[];for(let i=0;i<12;i++){const m=new THREE.Mesh(AG.person('#ffffff','#e0b08a',i%3?'#7fb8d8':'#2b3a55'),M.vc);m.scale.setScalar(1.35);m.castShadow=true;m.position.set(HS.x-8.25+(i%6)*3.3,0,HS.z+10+Math.floor(i/6)*2.6);scene.add(m);STAFF.push(m);const c=mesh(new THREE.BoxGeometry(0.34,0.1,0.34),MAT(0xe8433a),m.position.x,2.0,m.position.z+0.2)}
DOCS.forEach(o=>{o.m.visible=false;o.box.visible=false});
// football line-up (17)
const LINE=[];for(let i=0;i<17;i++){const m=new THREE.Mesh(AG.person('#c0262d','#e0b08a','#f2c14e'),M.vc);m.scale.setScalar(1.35);m.castShadow=true;m.position.set(-24+i*3,0,9);field.add(m);LINE.push(m)}
// ---- EMBANKMENT ----
const RV=WORLD.river,XL=RV.x-RV.w/2,EZ=P.cz-10;const emb=new THREE.Group();let BIGF;const FT={};{
  const pav=MAT(0xdccfb4),st=MAT(0xb9ab8f);const pv=new THREE.Mesh(new THREE.PlaneGeometry(16,220),pav);pv.rotation.x=-Math.PI/2;pv.position.set(XL-8,0.09,EZ);pv.receiveShadow=true;emb.add(pv);
  mesh(new THREE.BoxGeometry(1.2,1.4,220),st,XL-0.3,0.2,EZ,emb);
  for(let z=-108;z<=108;z+=3){mesh(new THREE.BoxGeometry(0.18,1.2,0.18),MAT(0x2b2b2b),XL-0.6,1.5,EZ+z,emb)}mesh(new THREE.BoxGeometry(0.22,0.18,216),MAT(0x2b2b2b),XL-0.6,2.1,EZ,emb);
  for(let z=-100;z<=100;z+=16){mesh(new THREE.CylinderGeometry(0.15,0.2,6,8),MAT(0x2b2b2b),XL-14,3,EZ+z,emb);mesh(new THREE.SphereGeometry(0.55,10,8),new THREE.MeshLambertMaterial({color:0xfff2c0,emissive:0xffe08a,emissiveIntensity:0.7}),XL-14,6.2,EZ+z,emb);
    mesh(new THREE.BoxGeometry(1.2,0.5,3),MAT(0x8b5a2b),XL-3.5,0.6,EZ+z+8,emb);const tr=mesh(new THREE.IcosahedronGeometry(2.6,0),MAT(0x3f8a3a),XL-18,4.6,EZ+z+8,emb);mesh(new THREE.CylinderGeometry(0.3,0.4,3,6),MAT(0x6b4220),XL-18,1.5,EZ+z+8,emb)}
  const cp=new THREE.Mesh(new THREE.CircleGeometry(15,40),MAT(0xe8dcc0));cp.rotation.x=-Math.PI/2;cp.position.set(XL-16,0.1,EZ);emb.add(cp);const ring=new THREE.Mesh(new THREE.RingGeometry(5,6,40),MAT(0xc9a24e));ring.rotation.x=-Math.PI/2;ring.position.set(XL-16,0.12,EZ);emb.add(ring);
  mesh(new THREE.CylinderGeometry(2.4,2.8,1.2,16),st,XL-16,0.6,EZ,emb);mesh(new THREE.CylinderGeometry(0.35,0.45,28,10),MAT(0xdddddd),XL-16,14,EZ,emb);mesh(new THREE.SphereGeometry(0.6,10,8),MAT(0xd4a83a),XL-16,28.4,EZ,emb);
  for(const k of ['q','kg','uz','kz','tj','az','ing','dag'])FT[k]=flagTex(k);
  const fg=new THREE.PlaneGeometry(13,8.6,20,8);BIGF=new THREE.Mesh(fg,new THREE.MeshLambertMaterial({map:FT.q,side:THREE.DoubleSide}));BIGF.position.set(XL-16,23,EZ+6.7);BIGF.rotation.y=Math.PI/2*0;emb.add(BIGF);BIGF.userData.base=fg.attributes.position.array.slice();
  const bT=ctex(900,200,(c,w,h)=>{c.fillStyle='#1d64b4';c.fillRect(0,0,w,h);c.fillStyle='#fff';c.font='900 96px "Inter Display"';c.textAlign='center';c.textBaseline='middle';c.fillText('НАБЕРЕЖНАЯ',w/2,h/2+6)});
  const bs=new THREE.Mesh(new THREE.PlaneGeometry(13,2.9),new THREE.MeshBasicMaterial({map:bT}));bs.position.set(XL-16,4.2,EZ+15.3);emb.add(bs);for(const x of [-6,6])mesh(new THREE.BoxGeometry(0.4,5.6,0.4),MAT(0x2b2b2b),XL-16+x,2.8,EZ+15.2,emb);
  // construction zone (north end)
  const bar=[MAT(0xff7a1a),MAT(0xffffff)];for(let i=0;i<10;i++)mesh(new THREE.BoxGeometry(2.8,1,0.4),bar[i%2],XL-2-i*1.5,0.5,EZ-62,emb);for(let i=0;i<5;i++){const s=mesh(new THREE.ConeGeometry(2.6,2.2,8),MAT(0xd8b878),XL-6-i*3.6,1.1,EZ-75-(i%2)*6,emb)}
  {const c=new THREE.Group();const y=MAT(0xf2c230);mesh(new THREE.BoxGeometry(1.2,30,1.2),y,0,15,0,c);const jib=new THREE.Group();mesh(new THREE.BoxGeometry(26,1,1),y,8,0,0,jib);mesh(new THREE.BoxGeometry(3,2,1.6),MAT(0x555555),-5,-0.6,0,jib);mesh(new THREE.CylinderGeometry(0.05,0.05,12,4),MAT(0x222222),16,-6,0,jib);mesh(new THREE.BoxGeometry(1.4,1.2,4),MAT(0xc9c6bf),16,-12.3,0,jib);jib.position.y=30;c.add(jib);c.position.set(XL-12,0,EZ-84);emb.add(c);FT.jib=jib}
  const r=rng(9);for(let i=0;i<5;i++){const m=new THREE.Mesh(AG.person('#ff8a2a','#e0b08a','#2b3a55'),M.vc);m.scale.setScalar(1.3);const hat=new THREE.Mesh(new THREE.SphereGeometry(0.3,8,6,0,6.3,0,1.6),MAT(0xf2c230));hat.position.y=2.0;m.add(hat);m.position.set(XL-3-r()*12,0,EZ-66-r()*20);emb.add(m)}
  const wr=rng(4);FT.walk=[];for(let i=0;i<10;i++){const m=new THREE.Mesh(AG.person(['#e8433a','#3a8fd8','#3ab36a','#d94f8a','#f2c230'][i%5],'#e0b08a','#2b3a55'),M.vc);m.scale.setScalar(1.3);emb.add(m);FT.walk.push({m,x:XL-5-wr()*7,z0:wr()*200-100,sp:(wr()<0.5?-1:1)*(1.5+wr())})}}
scene.add(emb);
const FLIST=['kg','uz','kz','tj','az','ing','dag'];
// ===== UI =====
function nickList(list,t,t0,dt,y0,colW,fsMax){const n=list.length,rows=Math.ceil(n/2);list.forEach((nk,i)=>{const tt=t0+i*dt;const k=easeBack(prog(t,tt,tt+0.25));if(k<=0)return;const col=Math.floor(i/rows),row=i%rows;const x=col?colW/2:-colW/2,y=y0+row*66;g.save();g.translate(x,y);g.scale(k,k);rr(-colW/2+10,-28,colW-20,56,28);g.fillStyle='#eef2f8';g.fill();
  txt(String(i+1),-colW/2+42,2,28,'#9aa0a8',null,0,'Inter Display',900);let s='@'+nk,fs=fsMax;g.font=`900 ${fs}px "Inter Display"`;while(g.measureText(s).width>colW-100&&fs>16){fs-=1;g.font=`900 ${fs}px "Inter Display"`}txt(s,-colW/2+68,2,fs,'#1f2b44',null,0,'Inter Display',900,'left');g.restore()})}

// ===== EP29 extras =====
{const p=PEOPLE.find(p=>p.sakura);const h=p.h;for(const [lx,lz] of [[-5.5,4.4],[5.5,4.4]]){const [x,z]=HX(h,lx,lz);mesh(new THREE.CylinderGeometry(0.25,0.35,2.6,6),MAT(0x6b4220),x,1.3,z);const c=mesh(new THREE.IcosahedronGeometry(2.1,1),new THREE.MeshLambertMaterial({color:0xf7a8c8,emissive:0x5a1f35,emissiveIntensity:0.15}),x,3.6,z);c.castShadow=true}}
{const p=PEOPLE.find(p=>p.tesla);const h=p.h;const [x,z]=HX(h,-3.6,4.8);const c=new THREE.Mesh(AG.car('#151515'),new THREE.MeshLambertMaterial({vertexColors:true}));c.position.set(x,0,z);c.rotation.y=(h.face>0?0:Math.PI)+Math.PI/2;c.scale.setScalar(1.25);c.castShadow=true;scene.add(c)}
{const p=PEOPLE.find(p=>p.rainbow);const h=p.h;const cols=[0xe8433a,0xf2a03a,0xf2d23a,0x3ab36a,0x3a8fd8,0x8a5cc4];const r=rng(77);for(let i=0;i<46;i++){const [x,z]=HX(h,-6.6+r()*13.2,2.6+r()*4.2);mesh(new THREE.SphereGeometry(0.28,6,5),MAT(cols[i%6]),x,0.35,z)}}
// park expansion
const COAST=[];let DROP,FLY;{const g=new THREE.Group();const cx=PK.x+28,cz=PK.z+25;const P_=u=>[cx+22*Math.cos(u),4+2.6*Math.sin(3*u)+1.2*Math.sin(u),cz+8*Math.sin(u)];const tm=MAT(0xe8433a),sm=MAT(0xdcdcdc);
  for(let i=0;i<120;i++){const u=i/120*6.283,[x,y,z]=P_(u),[x2,y2,z2]=P_(u+0.06);const b=mesh(new THREE.BoxGeometry(0.5,0.35,Math.hypot(x2-x,y2-y,z2-z)+0.1),tm,(x+x2)/2,(y+y2)/2,(z+z2)/2,g);b.lookAt(x2,y2,z2);if(i%6===0)mesh(new THREE.CylinderGeometry(0.16,0.16,y,5),sm,x,y/2,z,g)}
  for(let i=0;i<4;i++){const c=mesh(new THREE.BoxGeometry(1.3,0.9,1.9),MAT([0x2d6cdf,0xf2c230,0x3ab36a,0xd94f8a][i]),0,0,0,g);COAST.push(c)}scene.add(g);COAST.P=P_;
  const t=new THREE.Group();mesh(new THREE.CylinderGeometry(0.9,1.2,28,10),MAT(0xbfc6cf),0,14,0,t);mesh(new THREE.ConeGeometry(1.4,2.4,10),MAT(0xe8433a),0,29,0,t);DROP=mesh(new THREE.CylinderGeometry(2.6,2.6,1.2,14),MAT(0xf2c230),0,4,0,t);t.position.set(PK.x+64,0,PK.z-26);scene.add(t);
  const f=new THREE.Group();mesh(new THREE.CylinderGeometry(0.5,0.7,9,8),MAT(0x8a5cc4),0,4.5,0,f);FLY=new THREE.Group();mesh(new THREE.ConeGeometry(4.6,1.6,16),MAT(0xd94f8a),0,1,0,FLY);for(let i=0;i<10;i++){const a=i/10*6.283,s=new THREE.Group();mesh(new THREE.BoxGeometry(0.04,3.4,0.04),MAT(0x555555),0,-1.7,0,s);mesh(new THREE.BoxGeometry(0.7,0.15,0.7),MAT([0xe8433a,0x3a8fd8,0xf2c230][i%3]),0,-3.4,0,s);s.position.set(Math.cos(a)*4,0,Math.sin(a)*4);s.rotation.z=-0.5*Math.cos(a);s.rotation.x=0.5*Math.sin(a);FLY.add(s)}FLY.position.y=9;f.add(FLY);f.position.set(PK.x-50,0,PK.z-24);scene.add(f)}
const pT=ctex(1024,200,(c,w,h)=>{c.fillStyle='#e8433a';c.fillRect(0,0,w,h);c.fillStyle='#fff';c.font='900 96px "Inter Display"';c.textAlign='center';c.textBaseline='middle';c.fillText('НУЖНЫ РАБОТНИКИ',w/2,h/2+6)});
{const sg=new THREE.Mesh(new THREE.PlaneGeometry(14,2.7),new THREE.MeshBasicMaterial({map:pT}));sg.position.set(PK.x-20,6.5,PK.z+36.3);scene.add(sg);for(const x of [-6.6,6.6])mesh(new THREE.BoxGeometry(0.4,7.8,0.4),MAT(0x2b2b2b),PK.x-20+x,3.9,PK.z+36.1)}
// flags on embankment
const F9=['kg','kz','dag','uz','ru','ing','az','am','tj'];const FL9=[];F9.forEach((k,i)=>{const a=-Math.PI*0.95+i/(F9.length-1)*Math.PI*1.9,x=XL-16+Math.cos(a)*11,z=EZ+Math.sin(a)*11;mesh(new THREE.CylinderGeometry(0.16,0.2,13,8),MAT(0xdddddd),x,6.5,z);const fg=new THREE.PlaneGeometry(4.2,2.8,10,4);const m=new THREE.Mesh(fg,new THREE.MeshLambertMaterial({map:flagTex(k),side:THREE.DoubleSide}));m.position.set(x+2.1,11.4,z);scene.add(m);FL9.push({m,base:fg.attributes.position.array.slice()})});
const FNAME={kg:'🇰🇬 Кыргызстан',kz:'🇰🇿 Казахстан',dag:'Дагестан',uz:'🇺🇿 Узбекистан',ru:'🇷🇺 Россия',ing:'Ингушетия',az:'🇦🇿 Азербайджан',am:'🇦🇲 Армения',tj:'🇹🇯 Таджикистан'};

// ===================== ИГРА: прогулка по городу =====================
const QS=new URLSearchParams(location.search);const NICK=(QS.get('nick')||'').toLowerCase();
const MY=WORLD.by[NICK]||null;
const MALL=SP_.mall&&SP_.mall.x!=null?SP_.mall:{x:P.cx+60,z:P.cz};
const FC=MY&&MY.face?MY.face:1;const ZONES=[['home','🏠 Мой дом',MY?MY.x:P.cx,MY?MY.z+FC*11:P.cz+30,10],['hospital','🏥 Больница',HS.x,HS.z+12,16],['police','👮 Полиция',PS.x,PS.z+16,18],['shop','🛍 ТЦ «Город»',MALL.x,MALL.z,26],['park','🎢 Парк',PK.x,PK.z,40],['football','⚽ Стадион ASKER',FB.x,FB.z,38],['vip','👑 VIP-район',VP.x,VP.z+50,40],['emb','🌊 Набережная',XL-16,EZ,22],['plaza','🔥 Площадь мэра',P.cx,P.cz,20]];
function lbl(text){const c=document.createElement('canvas');c.width=512;c.height=128;const x=c.getContext('2d');x.fillStyle='rgba(27,20,70,.88)';x.beginPath();x.roundRect(6,12,500,104,52);x.fill();x.fillStyle='#ffc65c';x.font='bold 54px -apple-system,"Noto Color Emoji",sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(text,256,66);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,depthTest:false}));s.renderOrder=9;s.scale.set(16,4,1);return s}
for(const z of ZONES){if(z[0]==='plaza'||(z[0]==='home'&&!MY))continue;const s=lbl(z[1]);s.position.set(z[2],z[0]==='home'?(MY.top||9)+6:22,z[0]==='home'?MY.z:z[3]);scene.add(s)}
function hero(col=0xe8433a,me=true){const g=new THREE.Group();const S=(w,h,d,c,x,y,z,p=g)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color:c,roughness:.7}));m.position.set(x,y,z);m.castShadow=true;p.add(m);return m};
 const legs=[];for(const x of [-.25,.25]){const l=new THREE.Group();S(.34,1,.34,0x2b3a55,0,-.5,0,l);l.position.set(x,1.05,0);g.add(l);legs.push(l)}S(.95,1.1,.55,col,0,1.6,0);const arms=[];for(const x of [-.62,.62]){const a=new THREE.Group();S(.24,.95,.28,col,0,-.45,0,a);a.position.set(x,2.1,0);g.add(a);arms.push(a)}
 const hd=new THREE.Mesh(new THREE.SphereGeometry(.4,16,12),new THREE.MeshStandardMaterial({color:0xe0b08a}));hd.position.y=2.55;hd.castShadow=true;g.add(hd);const hr=new THREE.Mesh(new THREE.SphereGeometry(.42,16,8,0,6.3,0,1.4),new THREE.MeshStandardMaterial({color:0x2b1a10}));hr.position.y=2.6;g.add(hr);
 const ring=new THREE.Mesh(new THREE.RingGeometry(.9,1.2,32),new THREE.MeshBasicMaterial({color:me?0xffd34d:0x4fc3ff,transparent:true,opacity:.8}));ring.rotation.x=-Math.PI/2;ring.position.y=.08;g.add(ring);g.userData={legs,arms,ring};g.scale.setScalar(1.25);return g}
var camAng0=0;const myLook=()=>{try{return parent.ME.life.look}catch(e){return null}};let ME=makeHero(myLook());window.__p=ME.position;scene.add(ME);const START=ZONES[0];ME.position.set(START[2],0,START[3]+FC*3);if(FC<0)camAng0=Math.PI;
// монеты дня
let FOUND=new Set(JSON.parse(QS.get('found')||'[]'));const COINS=[];{const d=new Date(Date.now()+3*3600e3).toISOString().slice(0,10);let h=0;for(const ch of d)h=(h*31+ch.charCodeAt(0))>>>0;const R=()=>{h^=h<<13;h^=h>>>17;h^=h<<5;return ((h>>>0)%10000)/10000};
 const cm=new THREE.MeshStandardMaterial({color:0xffd34d,metalness:.85,roughness:.25,emissive:0x6a4a00,emissiveIntensity:.5});
 for(let i=0;i<10;i++){const z=ZONES[1+Math.floor(R()*7)],a=R()*6.283,r=10+R()*25;const x=z[2]+Math.cos(a)*r,zz=z[3]+Math.sin(a)*r;if(FOUND.has(i))continue;const m=new THREE.Mesh(new THREE.CylinderGeometry(1.1,1.1,.25,24),cm);m.rotation.x=Math.PI/2;m.position.set(x,2,zz);m.castShadow=true;scene.add(m);const gl=new THREE.PointLight(0xffd34d,8,10);gl.position.set(x,3,zz);scene.add(gl);COINS.push({m,gl,i,x,z:zz})}}
// управление
const joy={x:0,y:0};{const jw=document.getElementById('joy'),jk=document.getElementById('knob');const mv=e=>{const r=jw.getBoundingClientRect();let dx=e.clientX-r.left-65,dy=e.clientY-r.top-65;const L=Math.hypot(dx,dy);if(L>50){dx*=50/L;dy*=50/L}jk.style.transform=`translate(${dx}px,${dy}px)`;joy.x=dx/50;joy.y=dy/50};
 jw.addEventListener('pointerdown',e=>{jw.setPointerCapture(e.pointerId);mv(e)});jw.addEventListener('pointermove',e=>{if(e.buttons||e.pointerType==='touch')mv(e)});const up=()=>{joy.x=joy.y=0;jk.style.transform=''};jw.addEventListener('pointerup',up);jw.addEventListener('pointercancel',up)}
let camAng=camAng0,camDist=34;{let lx=null;const gl=document.getElementById('gl');gl.addEventListener('pointerdown',e=>lx=e.clientX);addEventListener('pointerup',()=>lx=null);gl.addEventListener('pointermove',e=>{if(lx!=null){camAng-=(e.clientX-lx)*.006;lx=e.clientX}});gl.addEventListener('wheel',e=>{camDist=Math.max(18,Math.min(70,camDist+e.deltaY*.03))})}
document.getElementById('zin').onclick=()=>camDist=Math.max(18,camDist-8);document.getElementById('zout').onclick=()=>camDist=Math.min(70,camDist+8);
const act=document.getElementById('act');let NEAR=null;act.onclick=()=>{if(NEAR){parent.postMessage({t:'hap'},'*');parent.postMessage({t:'enter',k:NEAR[0]},'*')}};
document.getElementById('taxi').innerHTML=ZONES.filter(z=>z[0]!=='home'||MY).map(z=>`<button data-z="${z[0]}">${z[1]}</button>`).join('');
document.querySelectorAll('#taxi button').forEach(b=>b.onclick=()=>{const z=ZONES.find(q=>q[0]===b.dataset.z);ME.position.set(z[2]+(Math.random()-.5)*4,0,z[3]+(z[0]==='home'?FC*3:z[4]*.6));document.getElementById('taxi').classList.remove('open')});
document.getElementById('taxib').onclick=()=>document.getElementById('taxi').classList.toggle('open');
addEventListener('message',e=>{const d=e.data||{};if(d.t==='found'){FOUND=new Set(d.found)}});
// время суток (Москва)
function nightK(){const h=(new Date().getUTCHours()+3)%24+new Date().getUTCMinutes()/60;if(h>=7.5&&h<=18.5)return 0;if(h>=21||h<5.5)return 1;return h<12?(7.5-h)/2:(h-18.5)/2.5}
addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()});camera.aspect=innerWidth/innerHeight;camera.fov=50;camera.updateProjectionMatrix();

// ===== мультиплеер =====
function emoS(e){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');x.font='100px "Noto Color Emoji",sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(e,64,70);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:t,depthTest:false}));sp.renderOrder=10;sp.scale.set(3,3,1);return sp}
function nickS(n,me){const c=document.createElement('canvas');c.width=512;c.height=96;const x=c.getContext('2d');x.font='bold 44px -apple-system,sans-serif';const w=Math.min(500,x.measureText('@'+n).width+40);x.fillStyle=me?'rgba(255,211,77,.95)':'rgba(30,20,70,.85)';x.beginPath();x.roundRect(256-w/2,14,w,68,34);x.fill();x.fillStyle=me?'#3a1d05':'#fff';x.textAlign='center';x.textBaseline='middle';x.fillText('@'+n,256,50);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:t,depthTest:false}));sp.renderOrder=9;sp.scale.set(7,1.3,1);return sp}
if(NICK){const l=nickS(NICK,1);l.position.y=3.9;ME.add(l)}
const OTH=new Map(),COLS=[0x3a8bff,0x2bb24c,0x9b4dff,0xff8a3a,0xff4fa8,0x15b5b0,0x6a4fd0,0xe0b030];let MYE=null,SENDE=null,MET=false;
function showEmo(g,e){if(['🎉','💃','🔥','😎','❤️'].includes(e))hplay(g,'Victory',{once:true});if(g.userData.emo)g.remove(g.userData.emo);const sp=emoS(e);sp.position.y=6.4;g.add(sp);g.userData.emo=sp;g.userData.emoT=performance.now()}
document.getElementById('emos').innerHTML=['👋','❤️','😂','🔥','😎','🎉'].map(e=>`<button>${e}</button>`).join('');
document.querySelectorAll('#emos button').forEach(b=>b.onclick=()=>{showEmo(ME,b.textContent);SENDE=b.textContent;sendPos();parent.postMessage({t:'hap'},'*')});
function sendPos(){parent.postMessage({t:'pos',x:+ME.position.x.toFixed(1),z:+ME.position.z.toFixed(1),r:+ME.rotation.y.toFixed(2),e:SENDE,met:MET},'*');SENDE=null}
setInterval(()=>{if(!document.hidden)sendPos()},4000);setTimeout(sendPos,800);
addEventListener('message',e=>{const d=e.data||{};if(d.t!=='pl')return;document.getElementById('onl').innerHTML=`🟢 <b>${d.city}</b> в городе · ${d.online} онлайн`;if(d.pl.length)MET=true;const seen=new Set();
 for(const q of d.pl){seen.add(q.n);let o=OTH.get(q.n);if(!o){let h=0;for(const c of q.n)h=(h*31+c.charCodeAt(0))>>>0;const g=makeHero(q.lk||{sh:'#'+COLS[h%COLS.length].toString(16).padStart(6,'0')},false);g.userData.lk=JSON.stringify(q.lk||null);g.userData.nick=q.n;g.position.set(q.x,0,q.z);const l=nickS(q.n,0);l.position.y=3.9;g.add(l);scene.add(g);o={g,tx:q.x,tz:q.z,tr:q.r};OTH.set(q.n,o)}if(q.lk&&JSON.stringify(q.lk)!==o.g.userData.lk){const ng=makeHero(q.lk,false);ng.position.copy(o.g.position);ng.userData.lk=JSON.stringify(q.lk);ng.userData.nick=q.n;const l=nickS(q.n,0);l.position.y=3.9;ng.add(l);scene.remove(o.g);hdispose(o.g);scene.add(ng);o.g=ng}o.tx=q.x;o.tz=q.z;o.tr=q.r;if(q.e&&o.le!==q.e+Math.floor(Date.now()/6000)){o.le=q.e+Math.floor(Date.now()/6000);showEmo(o.g,q.e)}}
 for(const [n,o] of OTH)if(!seen.has(n)){scene.remove(o.g);hdispose(o.g);OTH.delete(n)}});
function mpTick(t,dt){for(const [n,o] of OTH){const g=o.g,dx=o.tx-g.position.x,dz=o.tz-g.position.z,L=Math.hypot(dx,dz),U=g.userData;if(L>40){g.position.x=o.tx;g.position.z=o.tz}else if(L>.3){const k=Math.min(1,dt*14/L);g.position.x+=dx*k;g.position.z+=dz*k;g.rotation.y=Math.atan2(dx,dz);hwalk(g,t,true)}else hwalk(g,t,false);U.ring.material.opacity=.4+.3*Math.sin(t*3)}
 for(const g of [ME,...[...OTH.values()].map(o=>o.g)])if(g.userData.emo&&performance.now()-g.userData.emoT>4000){g.remove(g.userData.emo);g.userData.emo=null}else if(g.userData.emo)g.userData.emo.position.y=6.4+Math.sin(t*5)*.2}
// пост-эффекты: свечение окон, огней и монет
let COMP=null,BLOOM=null;Promise.all([import('./pp/postprocessing/EffectComposer.js'),import('./pp/postprocessing/RenderPass.js'),import('./pp/postprocessing/UnrealBloomPass.js'),import('./pp/postprocessing/OutputPass.js')]).then(([a,b,c,d])=>{if(LOWQ)return;const c0=new a.EffectComposer(renderer);c0.setPixelRatio(renderer.getPixelRatio());c0.setSize(innerWidth,innerHeight);c0.addPass(new b.RenderPass(scene,camera));BLOOM=new c.UnrealBloomPass(new THREE.Vector2(innerWidth/2,innerHeight/2),.45,.55,.82);c0.addPass(BLOOM);c0.addPass(new d.OutputPass());COMP=c0;addEventListener('resize',()=>COMP&&COMP.setSize(innerWidth,innerHeight))}).catch(()=>{});
// тап по игроку — общение
{const gl=document.getElementById('gl');let sx=0,sy=0;gl.addEventListener('pointerdown',e=>{sx=e.clientX;sy=e.clientY});gl.addEventListener('pointerup',e=>{if(Math.hypot(e.clientX-sx,e.clientY-sy)>8)return;const rc=new THREE.Raycaster(),v=new THREE.Vector2(e.clientX/innerWidth*2-1,-(e.clientY/innerHeight)*2+1);rc.setFromCamera(v,camera);const gs=[...OTH.values()].map(o=>o.g);const hit=rc.intersectObjects(gs,true)[0];if(hit){let o=hit.object;while(o&&!o.userData.nick)o=o.parent;if(o){parent.postMessage({t:'tapP',n:o.userData.nick},'*');parent.postMessage({t:'hap'},'*')}}})}
addEventListener('message',e=>{if((e.data||{}).t==='emo'){showEmo(ME,e.data.e);SENDE=e.data.e;sendPos();return}if((e.data||{}).t==='look'){const p=ME.position.clone(),r=ME.rotation.y;const kids=ME.children.filter(c=>c.isSprite);scene.remove(ME);ME=makeHero(myLook());ME.position.copy(p);ME.rotation.y=r;kids.forEach(k=>ME.add(k));scene.add(ME);window.__p=ME.position}});
// адаптивное качество
let FR=0,FPT=performance.now(),LOWQ=false;function perf(now){FR++;if(now-FPT>2500){const fps=FR*1000/(now-FPT);FR=0;FPT=now;if(fps<28&&!LOWQ&&!QS.get('hq')){LOWQ=true;renderer.setPixelRatio(1);renderer.shadowMap.enabled=false;COMP=null;scene.traverse(o=>{if(o.material)o.material.needsUpdate=true})}}}
document.getElementById('fs').onclick=()=>parent.postMessage({t:'back'},'*');
const t0=performance.now();let last=t0;const camP=new THREE.Vector3(ME.position.x,30,ME.position.z+34);
function loop(now){requestAnimationFrame(loop);const t=(now-t0)/1000,dt=Math.min(.05,(now-last)/1000);last=now;
 const L_=Math.hypot(joy.x,joy.y),U=ME.userData;if(L_>.1){const sp=16*Math.min(1,L_),ca=Math.cos(camAng),sa=Math.sin(camAng);const dx=joy.x*ca+joy.y*sa,dz=-joy.x*sa+joy.y*ca;ME.position.x+=dx*sp*dt;ME.position.z+=dz*sp*dt;ME.rotation.y=Math.atan2(dx,dz);hwalk(ME,t,true)}else hwalk(ME,t,false);
 U.ring.material.opacity=.5+.3*Math.sin(t*4);
 camP.lerp(new THREE.Vector3(ME.position.x+Math.sin(camAng)*camDist*.62,camDist*1.2,ME.position.z+Math.cos(camAng)*camDist*.62),.08);camera.position.copy(camP);camera.lookAt(ME.position.x,3,ME.position.z);
 applyLight(nightK(),t);L.sun.position.set(ME.position.x+160,240,ME.position.z+140);L.sun.target.position.set(ME.position.x,0,ME.position.z);const sc=L.sun.shadow.camera;sc.left=-70;sc.right=70;sc.top=70;sc.bottom=-70;sc.near=10;sc.far=700;sc.updateProjectionMatrix();
 SP_.flames.forEach((f,i)=>{f.scale.set(1,0.8+0.35*Math.abs(Math.sin(t*9+i*1.7)),1)});FWR.rotation.z=t*0.18;FW.cabs.forEach(cb=>cb.rotation.z=-t*0.18);CARR.rotation.y=t*0.7;SW.forEach((s,i)=>s.rotation.x=Math.sin(t*2.2+i*1.3)*0.55);
 for(const v of VIS){const a=v.a+t*v.sp;v.m.position.set(v.cx+Math.cos(a)*v.rad*0.6,0,v.cz+Math.sin(a)*v.rad*0.4)}
 for(const p of SPRAY){const k=((t*p.v+p.ph)%1);const r=k*5;p.s.position.set(PK.x+Math.cos(p.a)*r,3.6+Math.sin(k*Math.PI)*5,PK.z+Math.sin(p.a)*r);p.s.material.opacity=1-k}
 COAST.forEach((c,i)=>{const u=t*1.1-i*0.13,[x,y,z]=COAST.P(u),[x2,y2,z2]=COAST.P(u+0.05);c.position.set(x,y+0.6,z);c.lookAt(x2,y2+0.6,z2)});DROP.position.y=4+11*(1+Math.sin(t*1.3))*0.5;FLY.rotation.y=t*1.4;
 if((now|0)%2===0){for(const F of [...FLAGS,...FL9.map(o=>({fl:o.m,base:o.base}))]){const pa=F.fl.geometry.attributes.position;for(let i=0;i<pa.count;i++){const x=F.base[i*3];pa.array[i*3+2]=Math.sin(x*1.6-t*5)*0.25*(x+2.1)/4.2}pa.needsUpdate=true}}
 for(const b of BAL)b.m.position.y=b.y0+Math.sin(t*1.6+b.ph)*0.25;FT.jib.rotation.y=t*0.2;for(const w of FT.walk){w.m.position.set(w.x,0,EZ+(((w.z0+t*w.sp)%200)+300)%200-100);w.m.rotation.y=w.sp>0?0:Math.PI}
 const bx=Math.sin(t*0.7)*22,bz=Math.sin(t*1.1)*12;BALL.position.set(bx,0.45+Math.abs(Math.sin(t*4))*0.6,bz);LINE.forEach(m=>m.visible=false);for(const p of PLAY){const tx=lerp(p.hx,bx,0.35)+Math.sin(t*p.sp+p.ph)*4,tz=lerp(p.hz,bz,0.35)+Math.cos(t*p.sp*0.8+p.ph)*3;p.m.position.set(tx,0,tz);p.m.rotation.y=Math.atan2(bx-tx,bz-tz)}
 const fl=Math.sin(t*14)>0;police.lights[0].material.emissiveIntensity=fl?2:0.1;police.lights[1].material.emissiveIntensity=fl?0.1:2;CR.forEach(c=>c.jib.rotation.y=c.s*t*0.25);for(const p of SPARK)p.s.visible=false;
 for(const c of COINS){if(c.got)continue;c.m.rotation.z=t*3;c.m.position.y=2+Math.sin(t*3+c.i)*.4;if(Math.hypot(ME.position.x-c.x,ME.position.z-c.z)<3.2){c.got=1;scene.remove(c.m);scene.remove(c.gl);parent.postMessage({t:'coin',id:c.i},'*');parent.postMessage({t:'hap'},'*')}}
 let n=null;for(const z of ZONES){if(Math.hypot(ME.position.x-z[2],ME.position.z-z[3])<z[4]){n=z;break}}if(n!==NEAR){NEAR=n;act.style.display=n&&n[0]!=='plaza'?'block':'none';if(n)act.textContent=({home:'🏠 Зайти домой',vip:'👑 VIP-район',emb:'🌊 Набережная',plaza:''})[n[0]]||('▶ Работать: '+n[1].replace(/^\S+ /,''))}
 mpTick(t,dt);tickHeroes(dt);perf(now);if(COMP){const nk=nightK();BLOOM.strength=.22+nk*.33;BLOOM.threshold=.92-nk*.07;BLOOM.radius=.35;COMP.render()}else renderer.render(scene,camera)}
document.getElementById('load').remove();requestAnimationFrame(loop);
