import {THREE,scene,M,T,GEO,AG,mergeParts,rng} from './city.js';
const {BX,SP,CY,CO,part,hipRoof}=GEO;
export const P=16,ST=8,COLS=36,GROUP=6;
export const WORLD={plots:[],houses:[],special:{}};
const _m=new THREE.Matrix4(),_q=new THREE.Quaternion(),_v=new THREE.Vector3(),_s=new THREE.Vector3(),_e=new THREE.Euler(),_c=new THREE.Color();
function inst1(geo,mat,list,opts){const im=new THREE.InstancedMesh(geo,mat,list.length);list.forEach((o,i)=>{_e.set(o.rx||0,o.ry||0,o.rz||0);_q.setFromEuler(_e);_v.set(o.x,o.y||0,o.z);_s.set(o.sx||1,o.sy||1,o.sz||1);_m.compose(_v,_q,_s);im.setMatrixAt(i,_m);if(o.c!==undefined){_c.set(o.c);im.setColorAt(i,_c)}});
  im.castShadow=opts.cast!==false;im.receiveShadow=opts.recv!==false;im.instanceMatrix.needsUpdate=true;if(im.instanceColor)im.instanceColor.needsUpdate=true;im.computeBoundingSphere();scene.add(im);return im}
function inst(geo,mat,list,opts={}){if(!list.length)return null;const CH=opts.chunk||90;const groups={};for(const o of list){const k=Math.floor(o.x/CH)+':'+Math.floor(o.z/CH);(groups[k]=groups[k]||[]).push(o)}
  const arr=Object.values(groups).map(g=>inst1(geo,mat,g,opts));return arr.length===1?arr[0]:{multi:arr}}
export const colX=c=>c*P+Math.floor(c/GROUP)*ST;
export const rowZ=r=>r*P+Math.floor(r/2)*ST;
export function buildWorld(residents){
  const R=rng(7);
  const rows=Math.ceil((residents.length+60)/COLS)+1;
  const W0=colX(COLS-1)+P,H0=rowZ(rows-1)+P;const ox=-W0/2,oz=-H0+40; // city spans z from oz to ~40
  WORLD.ox=ox;WORLD.oz=oz;WORLD.rows=rows;WORLD.W0=W0;WORLD.H0=H0;
  // plaza: center columns 15..20, rows near front (rows-6..rows-3)
  const pc0=15,pc1=20,pr0=rows-6,pr1=rows-3;
  const isPlaza=(c,r)=>c>=pc0&&c<=pc1&&r>=pr0&&r<=pr1;
  // plots
  const plots=[];for(let r=0;r<rows;r++)for(let c=0;c<COLS;c++){if(isPlaza(c,r))continue;const x=ox+colX(c)+P/2,z=oz+rowZ(r)+P/2;const face=r%2?1:-1;plots.push({c,r,x,z,face})}
  const px0=ox+colX(pc0),px1=ox+colX(pc1)+P,pz0=oz+rowZ(pr0),pz1=oz+rowZ(pr1)+P;WORLD.plaza={x0:px0,x1:px1,z0:pz0,z1:pz1,cx:(px0+px1)/2,cz:(pz0+pz1)/2};
  // ground
  const gr=new THREE.Mesh(new THREE.PlaneGeometry(6000,6000),M.grass);gr.rotation.x=-Math.PI/2;gr.receiveShadow=true;M.grass.map.repeat.set(600,600);scene.add(gr);
  // streets (paving) between row pairs and column groups
  const streets=[];
  for(let b=0;b<=Math.ceil(rows/2);b++){const z=oz+rowZ(b*2)-ST/2;streets.push({x:ox+W0/2,z,w:W0+ST*2,d:ST})}
  for(let g=0;g<=COLS/GROUP;g++){const x=ox+colX(g*GROUP)-ST/2;streets.push({x,z:oz+H0/2,w:ST,d:H0+ST*2})}
  for(const s of streets){const tex=T.paving.clone();tex.needsUpdate=true;tex.repeat.set(s.w/8,s.d/8);const m=new THREE.Mesh(new THREE.PlaneGeometry(s.w,s.d),new THREE.MeshLambertMaterial({map:tex}));m.rotation.x=-Math.PI/2;m.position.set(s.x,0.03,s.z);m.receiveShadow=true;scene.add(m)}
  {const tex=T.plaza.clone();tex.needsUpdate=true;const w=px1-px0+ST,d=pz1-pz0+ST;tex.repeat.set(w/9,d/9);const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshLambertMaterial({map:tex}));m.rotation.x=-Math.PI/2;m.position.set((px0+px1)/2,0.06,(pz0+pz1)/2);m.receiveShadow=true;scene.add(m)}
  // river on the left
  const rvx=ox-46,rvw=30;{const tex=T.water;tex.repeat.set(4,140);const m=new THREE.Mesh(new THREE.PlaneGeometry(rvw,4000),M.water);m.rotation.x=-Math.PI/2;m.position.set(rvx,0.05,0);scene.add(m);WORLD.river={x:rvx,w:rvw,mesh:m};
    const bank=[];for(let z=-2000;z<2000;z+=4)for(const sx of [-1,1])bank.push({x:rvx+sx*(rvw/2+0.8),y:0.25,z,sx:1.8,sy:0.5,sz:4.1,c:0x9c958a});inst(BX,new THREE.MeshLambertMaterial({map:T.stone}),bank,{cast:false});
    const br=[];for(let b=0;b<=Math.ceil(rows/2);b++){const z=oz+rowZ(b*2)-ST/2;for(let k=-7;k<=7;k++)br.push({x:rvx+k*2.2,y:0.9,z,sx:2.0,sy:0.25,sz:6});br.push({x:rvx,y:1.6,z:z-3,sx:rvw+6,sy:0.25,sz:0.25});br.push({x:rvx,y:1.6,z:z+3,sx:rvw+6,sy:0.25,sz:0.25})}inst(BX,M.wood,br);
    const road={x:(rvx+ox-ST)/2,w:(ox-ST)-(rvx)+4};}
  // forest & mountains
  const pines=[];const trees=[];
  for(let i=0;i<1700;i++){let x,z;for(;;){x=(R()-0.5)*1900;z=-1300+R()*1500;const inCity=x>ox-90&&x<ox+W0+20&&z>oz-20&&z<60;if(!inCity&&!(window.TREEFREE&&window.TREEFREE(x,z)))break}const h=10+R()*14;pines.push({x,z,y:h/2,sx:3.5+R()*2,sy:h,sz:3.5+R()*2})}
  {const C6=new THREE.ConeGeometry(1,1,6);const g=mergeParts([part(C6,'#1f5a2c',0,0.1,0,0,0,0,1,0.8,1),part(C6,'#24683a',0,0.45,0,0,0,0,0.7,0.55,0.7)]);inst(g,M.vc,pines,{recv:false,cast:false,chunk:300})}
  const mt=[];const r2=rng(3);for(let i=0;i<26;i++){const x=-1900+i*150+r2()*80,z=-1150-r2()*350,h=420+r2()*480;mt.push({x,z,y:h/2,sx:260+r2()*180,sy:h,sz:220+r2()*120,ry:r2()*3})}
  {const g=new THREE.ConeGeometry(1,1,7,3);const pos=g.attributes.position;const r3=rng(9);for(let i=0;i<pos.count;i++){if(pos.getY(i)<0.49){pos.setX(i,pos.getX(i)*(0.85+r3()*0.3));pos.setZ(i,pos.getZ(i)*(0.85+r3()*0.3))}}g.computeVertexNormals();
    inst(g,new THREE.MeshLambertMaterial({color:0x5f7660,flatShading:true}),mt,{cast:false,recv:false})}
  // sky
  const sky=new THREE.Mesh(new THREE.SphereGeometry(5000,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{top:{value:new THREE.Color(0x7f8f9e)},hor:{value:new THREE.Color(0xc9d2d4)},nightK:{value:0}},
    vertexShader:'varying vec3 vp;void main(){vp=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:'uniform vec3 top;uniform vec3 hor;varying vec3 vp;void main(){float h=clamp(vp.y*2.2,0.0,1.0);gl_FragColor=vec4(mix(hor,top,h),1.0);}'}));scene.add(sky);WORLD.sky=sky;
  WORLD.plots=plots;WORLD.trees=trees;return plots;
}
// ---------- residents → houses ----------
const ROOFC={'':0xc2412b,red:0xc2412b,green:0x3f8a3a,blue:0x2f62b8,pink:0xe58ab0,black:0x2b2b2b,yellow:0xe9c03a,orange:0xe07a2a,rainbow:0xd95fa0,purple:0x8a5cc4,white:0xeeeeee,gray:0x7a7a86,brown:0x7a4a2a,gold:0xd9a92a};
const WALLC={'':0xffffff,white:0xffffff,pink:0xffc2d6,blue:0xb9d4ff,yellow:0xfff0a8,black:0x666666,beige:0xf1e1c4,purple:0xe0c8ff,orange:0xffd2a8,green:0xcfeec8,gray:0xd4d6db,red:0xffb3a8,brown:0xd9b896};
export function placeResidents(residents,plots){
  const P0=WORLD.plaza;const free=plots.map(p=>({...p,used:false,dp:Math.hypot(p.x-P0.cx,(p.z-P0.cz)*1.2)}));
  const pick=sc=>{let b=null,bv=1e18;for(const p of free){if(p.used)continue;const v=sc(p);if(v<bv){bv=v;b=p}}if(b)b.used=true;return b};
  const rx=WORLD.river.x;const rnd=rng(5);
  const order=[...residents].map(r=>({...r,k:rnd()})).sort((a,b)=>({riv:0,sea:0,mou:1,may:2,any:3}[a.z]??3)-({riv:0,sea:0,mou:1,may:2,any:3}[b.z]??3)||a.k-b.k);
  const houses=[];const by={};const FIX=window.FIXED||{};
  for(const n in FIX){const r=order.find(q=>q.n===n);const p=free.find(q=>q.c===FIX[n][0]&&q.r===FIX[n][1]);if(!r||!p||p.used)continue;p.used=true;r.done=1;const h={...r,x:p.x,z:p.z,face:p.face,plot:p,fl:Math.max(1,Math.min(3,r.fl||2)),feat:window.NOFEAT?0:1};houses.push(h);by[r.n]=h}
  for(const r of order){if(r.done)continue;let p;
    if(r.z==='riv'||r.z==='sea')p=pick(p=>p.c*40+p.dp*0.05);
    else if(r.z==='mou')p=pick(p=>p.r*30+Math.abs(p.c-18)*5);
    else if(r.z==='may')p=pick(p=>p.dp);
    else p=pick(p=>p.dp*(0.8+0.4*(((p.c*13+p.r*7)%10)/10)));
    if(!p)continue;const h={...r,x:p.x,z:p.z,face:p.face,plot:p,fl:Math.max(1,Math.min(3,r.fl||2))};houses.push(h);by[r.n]=h}
  WORLD.houses=houses;WORLD.by=by;return houses}
export function buildHouses(houses){
  const L={fenceL:[],fenceS:[],path:[],found:[],f1:[],fu:[],bal:[],rail:[],roof:[],chim:[],yurt:[],fence:[],fbase:[],gate:[],stones:[],flower:[],tree:[],trunk:[],pool:[],poolEdge:[],sauna:[],saunaRoof:[],green:[],beds:[],car:[],swing:[],gaz:[],treeBig:[],treeHut:[]};
  const rnd=rng(21);
  const AN={cat:[],dog:[],horse:[],cow:[],sheep:[],chick:[]};
  for(const h of houses){const f=h.face;const ry=f>0?0:Math.PI;const X=(lx,lz)=>[h.x+lx*f,h.z+lz*f];
    // plot fence (14x14), gate on front side (+lz)
    const half=7.4;
    for(const [lx,lz,rot,len] of [[0,-half,0,14.8],[-half,0,Math.PI/2,14.8],[half,0,Math.PI/2,14.8],[-4.4,half,0,6],[4.4,half,0,6]]){const [x,z]=X(lx,lz);(len>10?L.fenceL:L.fenceS).push({x,y:1.05,z,ry:rot+ry});L.fbase.push({x,y:0.22,z,ry:rot+ry,sx:len+0.1,sy:0.44,sz:0.4})}
    for(const gx of [-1.5,1.5]){const [x,z]=X(gx,half);L.gate.push({x,y:1.0,z,ry,sx:0.4,sy:2.0,sz:0.4})}{const [x,z]=X(0,half);L.gate.push({x,y:0.9,z,ry,sx:2.6,sy:1.6,sz:0.12})}
    // house
    const hz=-1.6;const [hx,hzz]=X(0,hz);const tree=h.f.includes('tree');
    const wc=WALLC[h.wall]??0xffffff;const rc=ROOFC[h.roof]??0xc2412b;
    if(tree){const [tx,tz]=X(-2,-1);L.treeBig.push({x:tx,y:9,z:tz,sx:5.5,sy:4.5,sz:5.5});L.trunk.push({x:tx,y:4,z:tz,sx:0.8,sy:8,sz:0.8});L.treeHut.push({x:tx,y:6.6,z:tz,ry,sx:2.6,sy:2.2,sz:2.6,c:0x8b5a2b});L.found.push({x:hx+2*f,y:0.3,z:hzz,ry,sx:6,sy:0.6,sz:5});L.f1.push({x:hx+2*f,y:2.1,z:hzz,ry,sx:5.6,sy:3,sz:4.6,c:wc});L.roof.push({x:hx+2*f,y:3.6,z:hzz,ry,sx:0.66,sy:0.85,sz:0.66,c:rc});h.top=7.2}
    else if(h.f.includes('yurt')){L.yurt.push({x:hx,y:0,z:hzz,ry});h.top=5.6}
    else{const fl=h.fl;L.found.push({x:hx,y:0.3,z:hzz,ry,sx:9.4,sy:0.6,sz:7.4});L.f1.push({x:hx,y:2.1,z:hzz,ry,sx:9,sy:3,sz:7,c:wc});
      for(let k=1;k<fl;k++){L.fu.push({x:hx,y:2.1+k*3,z:hzz,ry,sx:9,sy:3,sz:7,c:wc});const [bx,bz]=X(0,hz+3.9);L.bal.push({x:bx,y:0.75+k*3,z:bz,ry,sx:9.6,sy:0.22,sz:1.4});L.rail.push({x:bx,y:1.3+k*3,z:bz+0.68*f,ry,sx:9.6,sy:0.9})}
      if(!h.noroof){L.roof.push({x:hx,y:0.6+fl*3,z:hzz,ry,c:rc});const [cx,cz]=X(2.4,hz-1.4);L.chim.push({x:cx,y:fl*3+2.4,z:cz,sx:0.8,sy:2.2,sz:0.8})}h.top=fl*3+4.2}
    // path & flowers
    {const [x,z]=X(0,hz+5.5);L.path.push({x,y:0.06,z,ry})}
    {const [x,z]=X(2.6,hz+3.9);if(!tree)L.flower.push({x,y:0.35,z,ry,sx:1.6,sy:0.35,sz:0.45})}
    // extras
    const side=[];const fx=h.f;
    if(fx.includes('bigpool')){const [x,z]=X(1.2,4.3);L.pool.push({x,y:0.12,z,ry,sx:10.4,sy:0.12,sz:3.8});L.poolEdge.push({x,y:0.08,z,ry,sx:11.2,sy:0.16,sz:4.6})}else if(fx.includes('pool')){const [x,z]=X(3.6,4.2);L.pool.push({x,y:0.12,z,ry,sx:5.2,sy:0.12,sz:3.4});L.poolEdge.push({x,y:0.08,z,ry,sx:5.9,sy:0.16,sz:4.1})}
    if(fx.includes('cars')){const [x,z]=X(-3.6,4.6);L.car.push({x,y:0,z,ry:ry+Math.PI/2,c:({black:0x222222,white:0xf4f4f4,red:0xd63a2f,blue:0x2d6cdf,gray:0x9aa0a8,green:0x3a8f5a,yellow:0xf2c230})[h.cc]??[0xd63a2f,0x2d6cdf,0xf4f4f4,0x222222][(h.x|0)&3]})}
    for(const k of ['sauna','greenhouse','farm','bbq','playground'])if(fx.includes(k))side.push(k);
    side.slice(0,2).forEach((k,i)=>{const [x,z]=X(i?-5.4:5.4,-4.6);
      if(k==='sauna'){L.sauna.push({x,y:1.1,z,ry,sx:2.6,sy:2.2,sz:2.4});L.saunaRoof.push({x,y:2.2,z,ry,sx:0.3,sy:0.42,sz:0.34,c:0x5a3218})}
      if(k==='greenhouse')L.green.push({x,y:1.0,z,ry,sx:2.6,sy:2.0,sz:3});
      if(k==='farm')for(let j=0;j<3;j++)L.beds.push({x:x+(j-1)*0.9*f,y:0.2,z,ry,sx:0.7,sy:0.4,sz:3});
      if(k==='bbq')L.gaz.push({x,y:0,z,ry});if(k==='playground')L.swing.push({x,y:0,z,ry})});
    if(fx.includes('garden')||rnd()<0.45){const [x,z]=X(-5.2+rnd()*1.5,-5+rnd()*2);if(!side.length||fx.includes('garden')){L.tree.push({x,y:3.4,z,sx:1.7,sy:1.6,sz:1.7});L.trunk.push({x,y:1.3,z,sx:0.25,sy:2.6,sz:0.25})}}
    // animals
    if(h.feat)continue;
    const an=(k,n)=>{for(let i=0;i<n;i++){const [x,z]=X(-5+i*1.3+rnd()*0.4,2.0+rnd()*3.2);AN[k].push({x,y:0,z,ry:rnd()*6.28,ph:rnd()*6,h})}};
    const A=h.an||{};const cnt=(k,d)=>Math.min(6,A[k]||d);if(fx.includes('cats'))an('cat',cnt('cat',3));if(fx.includes('dogs'))an('dog',cnt('dog',2));if(fx.includes('horses'))an('horse',cnt('horse',2));if(fx.includes('cows'))an('cow',cnt('cow',2));if(fx.includes('sheep'))an('sheep',cnt('sheep',4));if(fx.includes('chickens'))an('chick',cnt('chicken',6));
  }
  const MAT={vc:M.vc};
  inst(new THREE.BoxGeometry(1,1,1),M.stone,L.found);
  const wallMats=[M.wSide,M.wSide,M.white,M.white,M.wFront,M.wFront];const wallMats1=[M.wSide,M.wSide,M.white,M.white,M.wDoor,M.wFront];
  const f1=inst(new THREE.BoxGeometry(1,1,1),wallMats1,L.f1);const fu=inst(new THREE.BoxGeometry(1,1,1),wallMats,L.fu);
  inst(new THREE.BoxGeometry(1,1,1),M.dark,L.bal);inst(new THREE.PlaneGeometry(1,1),M.rail,L.rail);
  inst(hipRoof(10.6,8.6,3.4),M.roof,L.roof);inst(new THREE.BoxGeometry(1,1,1),M.white,L.chim);
  const fq=(len)=>{const g=new THREE.PlaneGeometry(len,1.2);const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setX(i,uv.getX(i)*len/2);return g};
  inst(fq(14.8),M.fence,L.fenceL,{cast:false});inst(fq(6),M.fence,L.fenceS,{cast:false});
  {const pt=document.createElement('canvas');pt.width=64;pt.height=256;const g=pt.getContext('2d');g.clearRect(0,0,64,256);for(let k=0;k<4;k++){g.fillStyle='#b3aca0';g.beginPath();g.ellipse(32+(k%2?7:-7),32+k*64,24,20,0,0,7);g.fill();g.fillStyle='rgba(0,0,0,0.15)';g.beginPath();g.ellipse(32+(k%2?7:-7),38+k*64,24,10,0,0,Math.PI);g.fill()}
   const tx=new THREE.CanvasTexture(pt);tx.colorSpace=THREE.SRGBColorSpace;const pg=new THREE.PlaneGeometry(1.4,3.6);pg.rotateX(-Math.PI/2);inst(pg,new THREE.MeshLambertMaterial({map:tx,alphaTest:0.5}),L.path,{cast:false})}inst(new THREE.BoxGeometry(1,1,1),M.stone,L.fbase,{cast:false});inst(new THREE.BoxGeometry(1,1,1),M.dark,L.gate);
  inst(mergeParts([part(BX,'#6b3f20',0,0,0,0,0,0,1,1,1),...[-0.35,-0.1,0.15,0.38].map((x,i)=>part(SP,['#e8433a','#f2c230','#d94f8a','#8a5cc4'][i],x,0.6,0,0,0,0,0.12,0.12,0.3))]),M.vc,L.flower,{cast:false});
  inst(mergeParts([part(CY,'#f3ead8',0,1.4,0,0,0,0,4.2,2.8,4.2),part(CO,'#c9b48a',0,3.9,0,0,0,0,4.7,2.4,4.7),part(CY,'#8b3a2a',0,1.4,0,0,0,0,4.25,0.35,4.25),part(CY,'#8b3a2a',0,2.4,0,0,0,0,4.25,0.25,4.25),part(BX,'#b8462a',0,1.1,4.15,0,0,0,1.4,2.2,0.3),part(CY,'#6b3f20',0,5.2,0,0,0,0,0.5,0.4,0.5)]),M.vc,L.yurt);
  inst(new THREE.IcosahedronGeometry(1,0),M.leaf,L.tree);inst(new THREE.CylinderGeometry(1,1,1,6),M.bark,L.trunk);
  inst(new THREE.IcosahedronGeometry(1,1),M.leaf,L.treeBig);inst(mergeParts([part(BX,'#8b5a2b',0,0,0,0,0,0,1,0.7,1),part(CO,'#6b3f20',0,0.6,0,0,Math.PI/4,0,0.85,0.6,0.85),part(BX,'#2b1d12',0,0.05,0.51,0,0,0,0.3,0.3,0.02),part(BX,'#8b5a2b',0,-0.55,0,0,0,0,1.6,0.08,1.6)]),M.vc,L.treeHut);
  inst(new THREE.BoxGeometry(1,1,1),M.water,L.pool,{cast:false});inst(new THREE.BoxGeometry(1,1,1),M.white,L.poolEdge,{cast:false});
  inst(new THREE.BoxGeometry(1,1,1),M.wood,L.sauna);inst(new THREE.ConeGeometry(6,3,4),new THREE.MeshLambertMaterial({color:0x5a3218,flatShading:true}),L.saunaRoof.map(o=>({...o,ry:o.ry+Math.PI/4})));
  inst(new THREE.BoxGeometry(1,1,1),M.glass,L.green,{cast:false});
  inst(mergeParts([part(BX,'#6b4a2a',0,0,0,0,0,0,1,1,1),...[-0.35,0,0.35].map(z=>part(SP,'#4f9a35',0,0.55,z,0,0,0,0.35,0.25,0.15))]),M.vc,L.beds,{cast:false});
  inst(mergeParts([...[-1.4,1.4].flatMap(x=>[part(BX,'#7a4a22',x,1.2,-1.2,0,0,0,0.2,2.4,0.2),part(BX,'#7a4a22',x,1.2,1.2,0,0,0,0.2,2.4,0.2)]),part(CO,'#b8462a',0,2.9,0,0,Math.PI/4,0,2.6,1.2,2.6),part(BX,'#555',0,0.7,0,0,0,0,0.8,0.5,0.4)]),M.vc,L.gaz);
  inst(mergeParts([part(BX,'#d63a2f',-1,1.2,0,0,0,0.25,0.12,2.6,0.12),part(BX,'#d63a2f',1,1.2,0,0,0,-0.25,0.12,2.6,0.12),part(BX,'#d63a2f',0,2.4,0,0,0,0,2.4,0.12,0.12),part(BX,'#2d6cdf',0,0.7,0,0,0,0,0.6,0.08,0.4)]),M.vc,L.swing);
  const carG=AG.car('#ffffff');inst(carG,new THREE.MeshLambertMaterial({vertexColors:true}),L.car);
  const animals={};for(const k in AN){if(!AN[k].length)continue;const g=AG[k](k==='cat'?'#f2a93b':k==='dog'?'#a8743f':'#8b4f25');const im=inst(g,M.vc,AN[k]);animals[k]={im,list:AN[k]}}
  WORLD.animals=animals;WORLD.walls=[f1,fu];
}
