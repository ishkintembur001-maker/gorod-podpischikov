import * as THREE from './three.js';
import {mergeGeometries} from './bgu.js';

export const W=innerWidth,H=innerHeight;
const glc=document.getElementById('gl');
const QS=new URLSearchParams(location.search);export const renderer=new THREE.WebGLRenderer({canvas:glc,antialias:QS.get('aa')!=='0',powerPreference:'high-performance'});
export const RS=+(QS.get("rs")||1);renderer.setPixelRatio(Math.min(1.6,devicePixelRatio||1));renderer.setSize(W,H);
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
renderer.shadowMap.enabled=QS.get('sh')!=='0';renderer.shadowMap.type=THREE.PCFShadowMap;
export const out=document.createElement('canvas');export const octx=out.getContext('2d');
export const scene=new THREE.Scene();
export const camera=new THREE.PerspectiveCamera(42,W/H,1,6000);

// ---------- helpers ----------
export function rng(s){let a=s>>>0||1;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function ctex(w,h,draw,rep){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');draw(g,w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;if(rep){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rep[0],rep[1])}return t}
const R0=rng(11);
// ---------- textures ----------
const T={};
T.grass=ctex(512,512,(g,w,h)=>{g.fillStyle='#5f9e35';g.fillRect(0,0,w,h);for(let i=0;i<9000;i++){const x=R0()*w,y=R0()*h;const l=R0();g.fillStyle=l<0.33?'#6fb23d':l<0.66?'#548f2e':'#79bb46';g.fillRect(x,y,2,3+R0()*4)}},[1,1]);
T.paving=ctex(512,512,(g,w,h)=>{g.fillStyle='#8f8e8a';g.fillRect(0,0,w,h);const s=32;for(let y=0;y<h;y+=s)for(let x=(y/s%2)*s/2-s;x<w;x+=s){const v=150+R0()*30|0;g.fillStyle=`rgb(${v},${v-2},${v-6})`;g.fillRect(x+2,y+2,s-4,s-4)}},[1,1]);
T.plaza=ctex(512,512,(g,w,h)=>{g.fillStyle='#b9b2a3';g.fillRect(0,0,w,h);const s=42;for(let y=0;y<h;y+=s)for(let x=(y/s%2)*s/2-s;x<w;x+=s){const v=205+R0()*28|0;g.fillStyle=`rgb(${v},${v-6},${v-16})`;g.fillRect(x+2,y+2,s-4,s-4)}},[1,1]);
T.stone=ctex(256,128,(g,w,h)=>{g.fillStyle='#7d7a73';g.fillRect(0,0,w,h);for(let r=0;r<4;r++)for(let x=-20+(r%2)*20;x<w;x+=40){const v=150+R0()*45|0;g.fillStyle=`rgb(${v},${v-4},${v-12})`;g.beginPath();g.roundRect(x+2,r*32+2,36,28,6);g.fill()}},[1,1]);
T.roof=ctex(256,256,(g,w,h)=>{g.fillStyle='#d8d0cc';g.fillRect(0,0,w,h);for(let r=0;r<8;r++)for(let x=0;x<w;x+=32){const gr=g.createLinearGradient(x,0,x+32,0);gr.addColorStop(0,'#c9beb8');gr.addColorStop(0.5,'#ffffff');gr.addColorStop(1,'#bdb2ac');g.fillStyle=gr;g.beginPath();g.moveTo(x,r*32);g.lineTo(x+32,r*32);g.lineTo(x+32,r*32+26);g.quadraticCurveTo(x+16,r*32+34,x,r*32+26);g.fill();g.fillStyle='rgba(60,30,20,0.35)';g.fillRect(x,r*32+26,32,4)}},[1,1]);
T.fence=ctex(256,128,(g,w,h)=>{g.clearRect(0,0,w,h);g.fillStyle='#f5f3ee';for(let i=0;i<8;i++){const x=i*32+8;g.beginPath();g.moveTo(x,128);g.lineTo(x,22);g.lineTo(x+8,10);g.lineTo(x+16,22);g.lineTo(x+16,128);g.fill()}g.fillRect(0,40,w,10);g.fillRect(0,96,w,10);g.fillStyle='rgba(0,0,0,0.12)';for(let i=0;i<8;i++)g.fillRect(i*32+22,22,2,106)});
T.water=ctex(256,256,(g,w,h)=>{g.fillStyle='#2f86c8';g.fillRect(0,0,w,h);for(let i=0;i<220;i++){g.strokeStyle=`rgba(255,255,255,${0.08+R0()*0.18})`;g.lineWidth=2;const x=R0()*w,y=R0()*h;g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+10,y-4,x+22,y);g.stroke()}},[1,1]);
T.wood=ctex(128,128,(g,w,h)=>{g.fillStyle='#7a4a27';g.fillRect(0,0,w,h);for(let y=0;y<h;y+=16){g.fillStyle=y%32?'#6b3f20':'#83532d';g.fillRect(0,y,w,14)}});
T.bark=ctex(64,64,(g,w,h)=>{g.fillStyle='#5a3a22';g.fillRect(0,0,w,h)});
function wallTex(kind){return ctex(512,256,(g,w,h)=>{
  g.fillStyle='#f6f2ea';g.fillRect(0,0,w,h);
  for(let i=0;i<1400;i++){g.fillStyle=`rgba(0,0,0,${R0()*0.03})`;g.fillRect(R0()*w,R0()*h,3,3)}
  const beam='#4b2c18';g.fillStyle=beam;g.fillRect(0,0,w,12);g.fillRect(0,h-14,w,14);g.fillRect(0,0,12,h);g.fillRect(w-12,0,12,h);
  const nw=kind==='front'?3:kind==='side'?2:3;const ws=[];if(kind==='front'){ws.push(0.18,0.5,0.82)}else if(kind==='side'){ws.push(0.3,0.7)}else{ws.push(0.18,0.5,0.82)}
  for(const fx of [0.34,0.66])g.fillRect(fx*w-6,0,12,h);
  if(kind!=='front0'){g.lineWidth=9;g.strokeStyle=beam;g.beginPath();g.moveTo(14,14);g.lineTo(0.34*w-6,h-16);g.moveTo(w-14,14);g.lineTo(0.66*w+6,h-16);g.stroke()}
  for(const fx of ws){const x=fx*w,y=h*0.22,ww=58,hh=104;if(kind==='door'&&fx===0.5){g.fillStyle='#5a3218';g.fillRect(x-36,h*0.3,72,h*0.7-14);g.fillStyle='#3d2010';g.fillRect(x-36,h*0.3,72,8);g.fillStyle='#c9a24a';g.beginPath();g.arc(x+20,h*0.65,4,0,7);g.fill();continue}
    g.fillStyle='#ffffff';g.fillRect(x-ww/2-6,y-6,ww+12,hh+12);const gr=g.createLinearGradient(0,y,0,y+hh);gr.addColorStop(0,'#3b5c80');gr.addColorStop(1,'#1d3350');g.fillStyle=gr;g.fillRect(x-ww/2,y,ww,hh);g.fillStyle='#ffffff';g.fillRect(x-2,y,4,hh);g.fillRect(x-ww/2,y+hh/2-2,ww,4);
    g.fillStyle='#2e5d9c';g.fillRect(x-ww/2-24,y-4,18,hh+8);g.fillRect(x+ww/2+6,y-4,18,hh+8);g.fillStyle='rgba(255,255,255,0.25)';for(let k=0;k<5;k++){g.fillRect(x-ww/2-24,y+k*22,18,3);g.fillRect(x+ww/2+6,y+k*22,18,3)}}
  })}
function wallEmis(kind){return ctex(512,256,(g,w,h)=>{g.fillStyle='#000';g.fillRect(0,0,w,h);const ws=kind==='side'?[0.3,0.7]:[0.18,0.5,0.82];for(const fx of ws){if(kind==='door'&&fx===0.5)continue;const x=fx*w,y=h*0.22;g.fillStyle='#ffb347';g.fillRect(x-29,y,58,104)}})}
T.wDoor=wallTex('door');T.wSide=wallTex('side');T.wFront=wallTex('front');
T.eDoor=wallEmis('door');T.eSide=wallEmis('side');T.eFront=wallEmis('front');
for(const k of ['eDoor','eSide','eFront'])T[k].colorSpace=THREE.SRGBColorSpace;
T.rail=ctex(256,64,(g,w,h)=>{g.clearRect(0,0,w,h);g.fillStyle='#5a3218';g.fillRect(0,0,w,10);g.fillRect(0,h-8,w,8);for(let x=4;x<w;x+=16)g.fillRect(x,0,7,h)});

// ---------- materials ----------
export const M={};
M.grass=new THREE.MeshLambertMaterial({map:T.grass});
M.paving=new THREE.MeshLambertMaterial({map:T.paving});
M.plaza=new THREE.MeshLambertMaterial({map:T.plaza});
M.stone=new THREE.MeshLambertMaterial({map:T.stone});
M.roof=new THREE.MeshLambertMaterial({map:T.roof});
M.fence=new THREE.MeshLambertMaterial({map:T.fence,alphaTest:0.5,side:THREE.DoubleSide});
M.water=new THREE.MeshPhongMaterial({map:T.water,shininess:80,specular:0x99bbdd});
M.wood=new THREE.MeshLambertMaterial({map:T.wood});
M.dark=new THREE.MeshLambertMaterial({color:0x4b2c18});
M.white=new THREE.MeshLambertMaterial({color:0xf3efe7});
M.rail=new THREE.MeshLambertMaterial({map:T.rail,alphaTest:0.5,side:THREE.DoubleSide});
function wallMat(map,em){return new THREE.MeshLambertMaterial({map,emissiveMap:em,emissive:0xffffff,emissiveIntensity:0})}
M.wDoor=wallMat(T.wDoor,T.eDoor);M.wSide=wallMat(T.wSide,T.eSide);M.wFront=wallMat(T.wFront,T.eFront);
M.leaf=new THREE.MeshLambertMaterial({color:0x4f9a35,flatShading:true});
M.pine=new THREE.MeshLambertMaterial({color:0x1f5a2c,flatShading:true});
M.bark=new THREE.MeshLambertMaterial({color:0x5a3a22});
M.vc=new THREE.MeshLambertMaterial({vertexColors:true,flatShading:true});
M.glass=new THREE.MeshPhongMaterial({color:0xcfefff,transparent:true,opacity:0.45,shininess:90});
export const NIGHT_MATS=[M.wDoor,M.wSide,M.wFront];

// ---------- geometry helpers ----------
function hipRoof(w,d,h){const hw=w/2,hd=d/2,r=Math.max(0,hw-hd);const P=[[-hw,0,-hd],[hw,0,-hd],[hw,0,hd],[-hw,0,hd],[-r,h,0],[r,h,0]];
  const tris=[[3,2,5,4],[1,0,4,5]];const pos=[],uv=[];
  const quad=(a,b,c,dd)=>{const A=P[a],B=P[b],C=P[c],D=P[dd];const L=Math.hypot(B[0]-A[0],B[2]-A[2]);const sl=Math.hypot(hd,h);
    for(const [p,u,v] of [[A,0,0],[B,L/3,0],[C,(L/2+(C[0]-0))/3,sl/3],[A,0,0],[C,(L/2+C[0])/3,sl/3],[D,(L/2+D[0])/3,sl/3]]){pos.push(...p);uv.push(u,v)}};
  // front (+z) trapezoid: 3,2,5,4
  const add=(pts,uvs)=>{for(let i=0;i<pts.length;i++){pos.push(...P[pts[i]]);uv.push(...uvs[i])}};
  const sl=Math.hypot(hd,h)/2.2,sw=w/2.2,sr=Math.hypot(hw-r,h)/2.2;
  add([3,2,5],[[0,0],[sw,0],[sw/2+r/2.2,sl]]);add([3,5,4],[[0,0],[sw/2+r/2.2,sl],[sw/2-r/2.2,sl]]);
  add([1,0,4],[[0,0],[sw,0],[sw/2+r/2.2,sl]]);add([1,4,5],[[0,0],[sw/2+r/2.2,sl],[sw/2-r/2.2,sl]]);
  const sd=d/2.2;add([2,1,5],[[0,0],[sd,0],[sd/2,sr]]);add([0,3,4],[[0,0],[sd,0],[sd/2,sr]]);
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.computeVertexNormals();return g}
function colorGeo(g,c){const col=new THREE.Color(c);const n=g.attributes.position.count;const a=new Float32Array(n*3);for(let i=0;i<n;i++){a[i*3]=col.r;a[i*3+1]=col.g;a[i*3+2]=col.b}g.setAttribute('color',new THREE.BufferAttribute(a,3));if(g.attributes.uv)g.deleteAttribute('uv');return g}
function part(geo,c,x,y,z,rx,ry,rz,sx,sy,sz){const g=geo.clone();if(g.index)g.toNonIndexed&&0;const m=new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx||0,ry||0,rz||0)),new THREE.Vector3(sx||1,sy||1,sz||1));g.applyMatrix4(m);return colorGeo(g.index?g.toNonIndexed():g,c)}
const BX=new THREE.BoxGeometry(1,1,1),SP=new THREE.IcosahedronGeometry(1,1),CY=new THREE.CylinderGeometry(1,1,1,8),CO=new THREE.ConeGeometry(1,1,8);
export function mergeParts(arr){return mergeGeometries(arr)}
export const GEO={BX,SP,CY,CO,part,hipRoof,colorGeo};
export {THREE,T};

// ---------- animals & props (vertex-colored, unit ~1m) ----------
export const AG={};
AG.cat=c=>mergeParts([part(BX,c,0,0.25,0,0,0,0,0.5,0.25,0.22),part(SP,c,0.3,0.42,0,0,0,0,0.14,0.14,0.14),part(CO,c,0.3,0.6,0.06,0,0,0,0.05,0.1,0.05),part(CO,c,0.3,0.6,-0.06,0,0,0,0.05,0.1,0.05),part(BX,c,-0.32,0.42,0,0,0,0.9,0.06,0.3,0.06),...[[-0.18,0.08],[-0.18,-0.08],[0.18,0.08],[0.18,-0.08]].map(([x,z])=>part(BX,c,x,0.08,z,0,0,0,0.07,0.16,0.07))]);
AG.dog=c=>mergeParts([part(BX,c,0,0.42,0,0,0,0,0.75,0.32,0.3),part(BX,c,0.45,0.62,0,0,0,0,0.28,0.26,0.24),part(BX,'#2b1d12',0.62,0.58,0,0,0,0,0.12,0.12,0.14),part(BX,'#3a2414',0.42,0.78,0.12,0,0,0,0.08,0.14,0.05),part(BX,'#3a2414',0.42,0.78,-0.12,0,0,0,0.08,0.14,0.05),part(BX,c,-0.42,0.6,0,0,0,0.7,0.07,0.3,0.07),...[[-0.28,0.1],[-0.28,-0.1],[0.28,0.1],[0.28,-0.1]].map(([x,z])=>part(BX,c,x,0.14,z,0,0,0,0.1,0.28,0.1))]);
AG.horse=c=>mergeParts([part(BX,c,0,1.15,0,0,0,0,1.5,0.6,0.5),part(BX,c,0.85,1.55,0,0,0,-0.6,0.32,0.9,0.3),part(BX,c,1.15,1.95,0,0,0,0,0.55,0.3,0.28),part(BX,'#2a1a0e',0.75,1.75,0,0,0,-0.6,0.12,0.9,0.32),part(BX,'#2a1a0e',-0.8,1.0,0,0,0,0.4,0.12,0.7,0.12),...[[-0.55,0.17],[-0.55,-0.17],[0.55,0.17],[0.55,-0.17]].map(([x,z])=>part(BX,c,x,0.45,z,0,0,0,0.16,0.9,0.16))]);
AG.cow=c=>mergeParts([part(BX,'#f4f1ea',0,1.0,0,0,0,0,1.5,0.7,0.65),part(BX,'#222',-0.2,1.05,0.33,0,0,0,0.5,0.4,0.02),part(BX,'#222',0.35,1.15,-0.33,0,0,0,0.4,0.3,0.02),part(BX,'#f4f1ea',0.9,1.2,0,0,0,0,0.45,0.42,0.4),part(BX,'#f2a5a5',1.15,1.1,0,0,0,0,0.12,0.22,0.3),...[[-0.55,0.22],[-0.55,-0.22],[0.55,0.22],[0.55,-0.22]].map(([x,z])=>part(BX,'#f4f1ea',x,0.33,z,0,0,0,0.16,0.66,0.16))]);
AG.sheep=c=>mergeParts([part(SP,'#f7f5f0',0,0.6,0,0,0,0,0.55,0.4,0.36),part(BX,'#2b2b2b',0.5,0.72,0,0,0,0,0.22,0.24,0.2),...[[-0.25,0.14],[-0.25,-0.14],[0.25,0.14],[0.25,-0.14]].map(([x,z])=>part(BX,'#2b2b2b',x,0.2,z,0,0,0,0.08,0.4,0.08))]);
AG.chick=c=>mergeParts([part(SP,'#fdfcf7',0,0.22,0,0,0,0,0.2,0.16,0.15),part(SP,'#fdfcf7',0.15,0.36,0,0,0,0,0.09,0.09,0.09),part(BX,'#e0322b',0.15,0.47,0,0,0,0,0.06,0.06,0.03),part(BX,'#f2a93b',0.25,0.36,0,0,0,0,0.06,0.03,0.03)]);
AG.wolf=c=>mergeParts([part(BX,c,0,0.85,0,0,0,0,1.3,0.5,0.45),part(BX,'#8a92a2',0.05,0.98,0,0,0,0,1.0,0.25,0.47),part(BX,c,0.8,1.1,0,0,0,-0.2,0.5,0.38,0.34),part(BX,c,1.1,1.0,0,0,0,0,0.35,0.18,0.2),part(CO,c,0.75,1.4,0.1,0,0,0,0.08,0.22,0.08),part(CO,c,0.75,1.4,-0.1,0,0,0,0.08,0.22,0.08),part(BX,c,-0.8,0.9,0,0,0,0.9,0.14,0.6,0.16),...[[-0.45,0.15],[-0.45,-0.15],[0.45,0.15],[0.45,-0.15]].map(([x,z])=>part(BX,c,x,0.3,z,0,0,0,0.13,0.6,0.13))]);
AG.car=c=>mergeParts([part(BX,c,0,0.6,0,0,0,0,3.6,0.7,1.7),part(BX,c,-0.2,1.15,0,0,0,0,2.0,0.6,1.5),part(BX,'#bfe3f2',-0.2,1.16,0,0,0,0,2.06,0.42,1.52),...[[-1.15,0.85],[-1.15,-0.85],[1.15,0.85],[1.15,-0.85]].map(([x,z])=>part(CY,'#1b1b1b',x,0.35,z,Math.PI/2,0,0,0.38,0.3,0.38)),part(BX,'#ffe9a8',1.8,0.65,0.55,0,0,0,0.05,0.18,0.3),part(BX,'#ffe9a8',1.8,0.65,-0.55,0,0,0,0.05,0.18,0.3)]);
AG.person=(c,skin,pants)=>mergeParts([part(BX,pants,0,0.45,0,0,0,0,0.36,0.9,0.28),part(BX,c,0,1.2,0,0,0,0,0.5,0.66,0.32),part(SP,skin,0,1.75,0,0,0,0,0.2,0.22,0.2),part(BX,'#2a1a10',0,1.9,0,0,0,0,0.38,0.12,0.38),part(BX,c,0.32,1.2,0,0,0,0,0.12,0.6,0.14),part(BX,c,-0.32,1.2,0,0,0,0,0.12,0.6,0.14)]);
