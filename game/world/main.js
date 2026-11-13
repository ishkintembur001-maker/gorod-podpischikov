import {THREE,renderer,scene,camera,out,octx,M,T,GEO,AG,mergeParts,rng,NIGHT_MATS,W,H} from './city.js';
import {buildWorld,placeResidents,buildHouses,WORLD} from './world.js';
const {BX,SP,CY,CO,part,hipRoof}=GEO;
window.THREE=THREE;
// ---------- lights ----------
export const L={};
L.hemi=new THREE.HemisphereLight(0xe6eef5,0x55703a,1.5);scene.add(L.hemi);
L.sun=new THREE.DirectionalLight(0xfff1dc,2.0);L.sun.castShadow=true;L.sun.shadow.mapSize.set(2048,2048);L.sun.shadow.bias=-0.0006;L.sun.shadow.normalBias=0.6;scene.add(L.sun);scene.add(L.sun.target);
L.fire=new THREE.PointLight(0xff8a3a,0,60,1.6);scene.add(L.fire);
scene.fog=new THREE.Fog(0xc9d2d4,500,3200);
function mk(geo,mat,x,y,z,ry,s){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);if(ry)m.rotation.y=ry;if(s)m.scale.setScalar(s);m.castShadow=true;m.receiveShadow=true;scene.add(m);return m}
function ctex(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t}
export const SP_={};
function buildSpecials(){
  const P=WORLD.plaza;const cx=P.cx,cz=P.cz;
  // mayor house (bigger) at plaza back-left
  const mh=new THREE.Group();const s=1.25;
  const f1=new THREE.Mesh(new THREE.BoxGeometry(9,3,7),[M.wSide,M.wSide,M.white,M.white,M.wDoor,M.wFront]);f1.position.y=2.1;const f2=new THREE.Mesh(new THREE.BoxGeometry(9,3,7),[M.wSide,M.wSide,M.white,M.white,M.wFront,M.wFront]);f2.position.y=5.1;
  const fd=new THREE.Mesh(new THREE.BoxGeometry(9.4,0.6,7.4),M.stone);fd.position.y=0.3;const bal=new THREE.Mesh(new THREE.BoxGeometry(9.6,0.22,1.4),M.dark);bal.position.set(0,3.75,3.9);const rl=new THREE.Mesh(new THREE.PlaneGeometry(9.6,0.9),M.rail);rl.position.set(0,4.3,4.58);
  const rf=new THREE.Mesh(hipRoof(10.6,8.6,3.4),new THREE.MeshLambertMaterial({map:T.roof,color:0xc2412b}));rf.position.y=6.6;const ch=new THREE.Mesh(new THREE.BoxGeometry(0.8,2.2,0.8),M.white);ch.position.set(2.4,8.4,-3);
  for(const m of [f1,f2,fd,bal,rl,rf,ch]){m.castShadow=m.receiveShadow=true;mh.add(m)}mh.scale.setScalar(s);mh.position.set(P.x0+16,0,P.z0+14);scene.add(mh);SP_.mayorHouse={x:mh.position.x,z:mh.position.z,top:10*s};
  // mosque at plaza back-right
  const mq=new THREE.Group();const wm=new THREE.MeshLambertMaterial({color:0xf7f4ee});const gm=new THREE.MeshLambertMaterial({color:0x2f8a4a});
  const base=new THREE.Mesh(new THREE.BoxGeometry(18,7,14),wm);base.position.y=3.5;const dome=new THREE.Mesh(new THREE.SphereGeometry(5.6,24,16,0,Math.PI*2,0,Math.PI/2),gm);dome.position.y=7;const drum=new THREE.Mesh(new THREE.CylinderGeometry(5.8,5.8,1.4,24),wm);drum.position.y=7.4;dome.position.y=8.1;
  const min=new THREE.Mesh(new THREE.CylinderGeometry(0.9,1.1,22,12),wm);min.position.set(10,11,-5);const minc=new THREE.Mesh(new THREE.ConeGeometry(1.3,3.4,12),gm);minc.position.set(10,23.7,-5);const balc=new THREE.Mesh(new THREE.CylinderGeometry(1.6,1.6,0.5,12),wm);balc.position.set(10,17,-5);
  const win=ctex(256,128,(g,w,h)=>{g.fillStyle='#f7f4ee';g.fillRect(0,0,w,h);for(let i=0;i<5;i++){const x=20+i*48;g.fillStyle='#1f5a2c';g.beginPath();g.moveTo(x,110);g.lineTo(x,50);g.arc(x+14,50,14,Math.PI,0);g.lineTo(x+28,110);g.fill()}});
  const front=new THREE.Mesh(new THREE.PlaneGeometry(17.6,6.4),new THREE.MeshLambertMaterial({map:win}));front.position.set(0,3.4,7.02);
  const door=new THREE.Mesh(new THREE.BoxGeometry(3.2,4.4,0.3),gm);door.position.set(0,2.2,7.1);
  const cres=new THREE.Mesh(new THREE.TorusGeometry(0.7,0.14,8,16,Math.PI*1.4),new THREE.MeshLambertMaterial({color:0xffd34d}));cres.position.set(0,14.6,0);
  for(const m of [base,dome,drum,min,minc,balc,front,door,cres]){m.castShadow=m.receiveShadow=true;mq.add(m)}mq.position.set(P.x1-20,0,P.z0+14);scene.add(mq);SP_.mosque={x:mq.position.x,z:mq.position.z,top:26,g:mq};
  // campfire + mayor + benches
  const fx=cx-6,fz=P.z1-16;SP_.fire={x:fx,z:fz};
  const ring=[];for(let i=0;i<10;i++){const a=i/10*Math.PI*2;ring.push(part(SP,'#8f8a80',Math.cos(a)*1.3,0.15,Math.sin(a)*1.3,0,0,0,0.32,0.22,0.32))}
  const logs=[part(CY,'#5a3a22',0,0.25,0,0,0.5,Math.PI/2,0.18,1.6,0.18),part(CY,'#5a3a22',0,0.25,0,0,-0.6,Math.PI/2,0.18,1.6,0.18)];
  mk(mergeParts([...ring,...logs]),M.vc,fx,0,fz);
  const flameM=new THREE.MeshBasicMaterial({color:0xffa030,transparent:true,opacity:0.9});const flames=[];for(let i=0;i<4;i++){const f=new THREE.Mesh(new THREE.ConeGeometry(0.42-i*0.06,1.4-i*0.15,6),i%2?new THREE.MeshBasicMaterial({color:0xffe070,transparent:true,opacity:0.85}):flameM);f.position.set(fx+(i-1.5)*0.2,0.8,fz+(i%2-0.5)*0.2);scene.add(f);flames.push(f)}SP_.flames=flames;
  L.fire.position.set(fx,2.2,fz);
  mk(new THREE.CylinderGeometry(0.35,0.35,2.6,8),M.bark,fx-2.6,0.35,fz,0).rotation.set(Math.PI/2,0,Math.PI/2);
  const mayor=mk(mergeParts([part(BX,'#2a3550',0,0.55,0.25,0,0,0,0.42,0.3,0.7),part(BX,'#2a3550',0,0.25,0.62,0,0,0,0.38,0.5,0.22),part(BX,'#3a5a8a',0,1.2,0,0,0,0,0.56,0.8,0.36),part(SP,'#d9a77c',0,1.85,0,0,0,0,0.22,0.25,0.22),part(BX,'#2a1a10',0,2.02,-0.02,0,0,0,0.42,0.14,0.42),part(BX,'#2a1a10',0,1.72,0.15,0,0,0,0.3,0.16,0.08),part(BX,'#3a5a8a',0.2,1.1,0.3,-0.9,0,0,0.14,0.55,0.14),part(BX,'#3a5a8a',-0.2,1.1,0.3,-0.9,0,0,0.14,0.55,0.14)]),M.vc,fx-2.6,0.55,fz,Math.PI/2);SP_.mayor={x:fx-2.6,z:fz};
  const bench=mergeParts([part(BX,'#6b3f20',0,0.5,0,0,0,0,2.4,0.12,0.6),part(BX,'#3a2414',-1,0.25,0,0,0,0,0.12,0.5,0.5),part(BX,'#3a2414',1,0.25,0,0,0,0,0.12,0.5,0.5)]);
  for(const [x,z,r] of [[fx+5,fz,Math.PI/2],[fx,fz-5,0],[fx,fz+5,0],[cx+18,P.z1-10,0],[cx-26,P.z1-10,0]])mk(bench,M.vc,x,0,z,r);
  const fbox=mergeParts([part(BX,'#6b3f20',0,0.2,0,0,0,0,2.4,0.4,0.6),...[-0.8,-0.3,0.2,0.7].map((x,i)=>part(SP,['#e8433a','#f2c230','#d94f8a','#8a5cc4'][i],x,0.5,0,0,0,0,0.2,0.2,0.2))]);
  for(let i=0;i<6;i++)mk(fbox,M.vc,P.x0+8+i*16,0,P.z1-2,0);
  // pines on plaza corners
  const pine=mergeParts([part(CO,'#1f5a2c',0,4.5,0,0,0,0,1.6,7,1.6),part(CY,'#5a3a22',0,0.6,0,0,0,0,0.25,1.2,0.25)]);for(const [x,z] of [[P.x0+4,P.z1-6],[P.x1-4,P.z1-6],[cx+8,P.z0+30],[cx-14,P.z0+32]])mk(pine,M.vc,x,0,z);
  // mall plot (built later) at plaza front-right
  SP_.mall={x:P.x1-22,z:P.z1-20};
}
export function buildMall(){const g=new THREE.Group();const s=SP_.mall;
  const wallT=ctex(1024,256,(c,w,h)=>{c.fillStyle='#f4efe4';c.fillRect(0,0,w,h);for(let f=0;f<2;f++)for(let i=0;i<12;i++){const x=24+i*83,y=20+f*120;if(f===1&&i>=5&&i<=6)continue;const gr=c.createLinearGradient(0,y,0,y+96);gr.addColorStop(0,'#9fd3ec');gr.addColorStop(1,'#3d84b8');c.fillStyle=gr;c.fillRect(x,y,66,96);c.fillStyle='rgba(255,255,255,0.35)';c.fillRect(x+6,y+4,10,88)}c.fillStyle='#8b5a2b';c.fillRect(0,122,w,10);});
  const signT=ctex(1024,192,(c,w,h)=>{c.fillStyle='#c62d2a';c.fillRect(0,0,w,h);c.strokeStyle='#ffd34d';c.lineWidth=14;c.strokeRect(7,7,w-14,h-14);c.fillStyle='#fff';c.font='900 120px "Inter Display"';c.textAlign='center';c.textBaseline='middle';c.fillText('ТЦ «ГОРОД»',w/2,h/2+6)});
  const wm=new THREE.MeshLambertMaterial({map:wallT});const plain=new THREE.MeshLambertMaterial({color:0xf4efe4});
  const body=new THREE.Mesh(new THREE.BoxGeometry(30,10,18),[plain,plain,plain,plain,wm,plain]);body.position.y=5;
  const atr=new THREE.Mesh(new THREE.CylinderGeometry(4.6,4.6,10.5,24,1,false,-Math.PI/2,Math.PI),M.glass);atr.position.set(0,5.25,9);
  const roofb=new THREE.Mesh(new THREE.BoxGeometry(31,0.8,19),new THREE.MeshLambertMaterial({color:0xb8462a}));roofb.position.y=10.4;
  const sign=new THREE.Mesh(new THREE.PlaneGeometry(16,3),new THREE.MeshBasicMaterial({map:signT}));sign.position.set(0,12.6,8.2);const sp=new THREE.Mesh(new THREE.BoxGeometry(16.4,3.4,0.4),M.dark);sp.position.set(0,12.6,7.95);
  for(const m of [body,atr,roofb,sign,sp]){m.castShadow=m.receiveShadow=true;g.add(m)}g.position.set(s.x,0,s.z);scene.add(g);s.g=g;s.top=15;
  // crane
  const cr=new THREE.Group();const ym=new THREE.MeshLambertMaterial({color:0xe8a317});const tower=new THREE.Mesh(new THREE.BoxGeometry(1.2,32,1.2),ym);tower.position.y=16;const jib=new THREE.Mesh(new THREE.BoxGeometry(26,0.9,0.9),ym);jib.position.set(-8,32,0);const cw=new THREE.Mesh(new THREE.BoxGeometry(3,2,1.6),new THREE.MeshLambertMaterial({color:0x555555}));cw.position.set(4,31,0);
  const cab=new THREE.Mesh(new THREE.BoxGeometry(1.2,10,0.1),new THREE.MeshLambertMaterial({color:0x333333}));cab.position.set(-16,27,0);const load=new THREE.Mesh(new THREE.BoxGeometry(3,1.4,1.6),new THREE.MeshLambertMaterial({color:0xc4502c}));load.position.set(-16,21.5,0);
  for(const m of [tower,jib,cw,cab,load]){m.castShadow=true;cr.add(m)}cr.position.set(s.x+18,0,s.z-6);scene.add(cr);s.crane=cr;
  const sc=[];for(let x=-15;x<=15;x+=3)for(const z of [-9.5,9.5])sc.push(part(BX,'#8b5a2b',x,6,z,0,0,0,0.25,12,0.25));for(let y=2;y<12;y+=3)for(const z of [-9.5,9.5])sc.push(part(BX,'#8b5a2b',0,y,z,0,0,0,30,0.2,0.25));
  const scaf=new THREE.Mesh(mergeParts(sc),M.vc);scaf.position.set(s.x,0,s.z);scene.add(scaf);s.scaf=scaf;
  const site=new THREE.Mesh(new THREE.PlaneGeometry(36,24),new THREE.MeshLambertMaterial({color:0xb9a27a}));site.rotation.x=-Math.PI/2;site.position.set(s.x,0.08,s.z);site.receiveShadow=true;scene.add(site);s.site=site;
}
export function setupWorld(){
  const res=window.RESIDENTS;const plots=buildWorld(res);
  // reserve mall + plaza handled; place residents
  const houses=placeResidents(res,plots);buildHouses(houses);buildSpecials();buildMall();
  return houses;
}
export {WORLD};
