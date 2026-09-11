import { useEffect, useMemo } from 'react';
import { BufferGeometry, CanvasTexture, Float32BufferAttribute, SRGBColorSpace } from 'three';
import type { ChunkDefinition, QualityTier, WorldProp } from '../world/types';
import { BATCHED_KINDS } from './InstancedDecor';

const C = {
  asphalt:'#4d514e', laterite:'#8a6047', drain:'#343a36', grass:'#52644b', paddy:'#708c53',
  concrete:'#9c998c', wall:'#b8ae95', cream:'#c6bda7', roof:'#7c4f3d', metal:'#6e746f',
  tarp:'#776d62', wood:'#5d4635', leaf:'#3f6548', leaf2:'#57754d', trunk:'#654f38',
  auto:'#355947', bike:'#272c2a', water:'#526f73', sign:'#735949'
};
function ribbon(path:{x:number;z:number}[], width:number) {
  const pos:number[] = [], idx:number[] = [];
  for (let i=0;i<path.length;i++) {
    const a=path[Math.max(0,i-1)], b=path[Math.min(path.length-1,i+1)];
    const dx=b.x-a.x, dz=b.z-a.z, len=Math.hypot(dx,dz)||1, rx=dz/len, rz=-dx/len;
    pos.push(path[i].x-rx*width/2,0,path[i].z-rz*width/2,path[i].x+rx*width/2,0,path[i].z+rz*width/2);
    if(i<path.length-1){const n=i*2;idx.push(n,n+2,n+1,n+1,n+2,n+3);}
  }
  const g=new BufferGeometry(); g.setAttribute('position',new Float32BufferAttribute(pos,3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}

export function RoadLayers({def}:{def:ChunkDefinition}) {
  const terrain=useMemo(()=>ribbon(def.path,96),[def]);
  const drains=useMemo(()=>ribbon(def.path,def.roadWidth+2*def.shoulderWidth+1.1),[def]);
  const shoulders=useMemo(()=>ribbon(def.path,def.roadWidth+2*def.shoulderWidth),[def]);
  const road=useMemo(()=>ribbon(def.path,def.roadWidth),[def]);
  useEffect(()=>()=>{terrain.dispose();drains.dispose();shoulders.dispose();road.dispose();},[terrain,drains,shoulders,road]);
  return <group><mesh geometry={terrain} position-y={-.08} receiveShadow><meshStandardMaterial color={C.grass} roughness={1}/></mesh><mesh geometry={drains} position-y={-.018} receiveShadow><meshStandardMaterial color={C.drain}/></mesh><mesh geometry={shoulders} position-y={-.008} receiveShadow><meshStandardMaterial color={C.laterite}/></mesh><mesh geometry={road} receiveShadow><meshStandardMaterial color={C.asphalt} roughness={.88}/></mesh></group>;
}
function SignBoard({label,width=3}:{label:string;width?:number}) {
  const texture=useMemo(()=>{const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const ctx=canvas.getContext('2d')!;ctx.fillStyle='#6e5043';ctx.fillRect(0,0,512,128);ctx.strokeStyle='#d7c8a4';ctx.lineWidth=7;ctx.strokeRect(5,5,502,118);ctx.fillStyle='#efe7d2';ctx.font='600 46px "Noto Sans Malayalam", sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,256,68,470);const tex=new CanvasTexture(canvas);tex.colorSpace=SRGBColorSpace;return tex;},[label]);
  useEffect(()=>()=>texture.dispose(),[texture]);
  return <mesh position={[0,2.55,.02]} castShadow><boxGeometry args={[width,.75,.09]}/><meshStandardMaterial map={texture} roughness={.9}/></mesh>;
}

function Building({p,shop=false}:{p:WorldProp;shop?:boolean}) {
  const v=p.variant??0, body=['#b6a98e','#a79d91','#b7aa97','#938f82'][v%4], s=p.scale??1;
  return <group scale={s} rotation-y={p.heading??0}><mesh position={[0,1.7,0]} castShadow receiveShadow><boxGeometry args={[shop?5.8:6.2,3.4,shop?4.1:5.2]}/><meshStandardMaterial color={body} roughness={.95}/></mesh><mesh position={[0,3.65,0]} rotation={[0,Math.PI/4,0]} castShadow><cylinderGeometry args={[3.7,3.7,1.15,4]}/><meshStandardMaterial color={C.roof} roughness={.95}/></mesh>{shop&&<><mesh position={[0,1.25,-2.08]}><boxGeometry args={[4.4,1.9,.08]}/><meshStandardMaterial color="#585c56" roughness={.8}/></mesh><mesh position={[0,2.4,-2.45]} rotation-x={-.12}><boxGeometry args={[5.1,.16,1.4]}/><meshStandardMaterial color={v%2?'#80654e':'#536d66'} roughness={.9}/></mesh></>}{p.label&&<SignBoard label={p.label} width={shop?4.8:3.2}/>}</group>;
}

function TeaShop({p}:{p:WorldProp}) { const s=p.scale??1; return <group scale={s}><mesh position={[0,1.35,0]} castShadow><boxGeometry args={[4.8,2.7,3.6]}/><meshStandardMaterial color="#756f60" roughness={1}/></mesh><mesh position={[0,2.8,-.5]} rotation-x={-.12} castShadow><boxGeometry args={[5.6,.12,4.2]}/><meshStandardMaterial color={C.metal} roughness={.75}/></mesh><mesh position={[0,1.3,-1.84]}><boxGeometry args={[3.5,1.8,.06]}/><meshStandardMaterial color="#3c3933"/></mesh>{p.label&&<SignBoard label={p.label} width={4.5}/>}<mesh position={[2.2,.45,-2.2]}><cylinderGeometry args={[.28,.34,.9,12]}/><meshStandardMaterial color="#a27a52"/></mesh></group>; }

function WallGate({p,gate=false}:{p:WorldProp;gate?:boolean}) { const s=p.scale??1; return <group scale={s}>{gate?<><mesh position={[-.8,.75,0]}><boxGeometry args={[.18,1.5,.2]}/><meshStandardMaterial color={C.metal}/></mesh><mesh position={[.8,.75,0]}><boxGeometry args={[.18,1.5,.2]}/><meshStandardMaterial color={C.metal}/></mesh><mesh position={[0,.8,0]}><boxGeometry args={[1.5,.08,.08]}/><meshStandardMaterial color={C.metal}/></mesh></>:<mesh position={[0,.6,0]} castShadow><boxGeometry args={[5.2,1.2,.35]}/><meshStandardMaterial color={C.wall} roughness={1}/></mesh>}</group>; }
function Palm({p}:{p:WorldProp}) { const s=p.scale??1; return <group scale={s}><mesh position={[0,3.2,0]} castShadow><cylinderGeometry args={[.18,.32,6.4,8]}/><meshStandardMaterial color={C.trunk} roughness={1}/></mesh>{[0,1,2,3,4,5].map(i=><mesh key={i} position={[0,6.35,0]} rotation={[0,i*Math.PI/3,.7]} castShadow><boxGeometry args={[.38,.07,3.5]}/><meshStandardMaterial color={i%2?C.leaf:C.leaf2} roughness={1}/></mesh>)}</group>; }
function Banana({p}:{p:WorldProp}) { const s=p.scale??1; return <group scale={s}><mesh position={[0,1.2,0]}><cylinderGeometry args={[.13,.2,2.4,7]}/><meshStandardMaterial color="#73805a"/></mesh>{[0,1,2,3,4].map(i=><mesh key={i} position={[0,2.4,0]} rotation={[0,i*1.26,.85]}><sphereGeometry args={[1,7,5]}/><meshStandardMaterial color={i%2?C.leaf2:C.leaf}/></mesh>)}</group>; }
function Jackfruit({p}:{p:WorldProp}) { const s=p.scale??1; return <group scale={s}><mesh position={[0,1.8,0]}><cylinderGeometry args={[.28,.4,3.6,8]}/><meshStandardMaterial color={C.trunk}/></mesh><mesh position={[0,4.2,0]} castShadow><sphereGeometry args={[2.4,9,7]}/><meshStandardMaterial color={C.leaf} roughness={1}/></mesh></group>; }
function Pole(){return <group><mesh position={[0,3.7,0]} castShadow><cylinderGeometry args={[.11,.16,7.4,8]}/><meshStandardMaterial color="#777b76" roughness={.9}/></mesh><mesh position={[0,6.5,0]}><boxGeometry args={[2,.13,.16]}/><meshStandardMaterial color="#4a4d49"/></mesh>{[-.72,0,.72].map(x=><mesh key={x} position={[x,6.35,0]}><sphereGeometry args={[.08,6,4]}/><meshStandardMaterial color="#252826"/></mesh>)}</group>;}

function Auto(){return <group rotation-y={Math.PI}><mesh position={[0,.6,0]} castShadow><boxGeometry args={[1.45,1.2,2.5]}/><meshStandardMaterial color={C.auto} roughness={.75}/></mesh><mesh position={[0,1.35,.25]}><boxGeometry args={[1.35,.8,1.3]}/><meshStandardMaterial color="#252b29" roughness={.8}/></mesh>{[-.63,.63].flatMap(x=>[-.72,.72].map(z=><mesh key={`${x}-${z}`} position={[x,.32,z]} rotation-z={Math.PI/2}><cylinderGeometry args={[.28,.28,.15,10]}/><meshStandardMaterial color="#222"/></mesh>))}</group>;}
function Bike(){return <group>{[-.52,.52].map(z=><mesh key={z} position={[0,.42,z]} rotation-y={Math.PI/2}><torusGeometry args={[.35,.055,6,14]}/><meshStandardMaterial color="#252826"/></mesh>)}<mesh position={[0,.62,0]} rotation-x={-.45}><boxGeometry args={[.09,.09,1.05]}/><meshStandardMaterial color="#6f5547"/></mesh><mesh position={[0,.9,.12]}><boxGeometry args={[.5,.08,.08]}/><meshStandardMaterial color="#333"/></mesh></group>;}
function ParkedCar(){return <group><mesh position={[0,.55,0]} castShadow><boxGeometry args={[1.7,.8,3.4]}/><meshStandardMaterial color="#626965" roughness={.72}/></mesh><mesh position={[0,1.05,-.2]}><boxGeometry args={[1.5,.6,1.7]}/><meshStandardMaterial color="#485456" metalness={.1}/></mesh></group>;}

function Shelter({p}:{p:WorldProp}){return <group>{[-2,2].map(x=><mesh key={x} position={[x,1.35,0]}><boxGeometry args={[.18,2.7,.18]}/><meshStandardMaterial color={C.concrete}/></mesh>)}<mesh position={[0,2.75,0]} castShadow><boxGeometry args={[4.8,.18,2.1]}/><meshStandardMaterial color={C.roof}/></mesh><mesh position={[0,.45,.25]}><boxGeometry args={[3.6,.45,.55]}/><meshStandardMaterial color={C.concrete}/></mesh>{p.label&&<SignBoard label={p.label} width={4.2}/>}</group>;}
function MarketStall({p}:{p:WorldProp}){const cloth=(p.variant??0)%3===0?'#72564a':(p.variant??0)%3===1?'#53675e':'#7f7154';return <group><mesh position={[0,1.05,0]}><boxGeometry args={[3.6,2.1,2.6]}/><meshStandardMaterial color="#6c6558"/></mesh><mesh position={[0,2.35,-.15]} rotation-x={-.1}><boxGeometry args={[4.1,.12,3.1]}/><meshStandardMaterial color={cloth}/></mesh>{p.label&&<SignBoard label={p.label} width={3.4}/>}<mesh position={[0,.65,-1.45]}><boxGeometry args={[3.1,.8,.55]}/><meshStandardMaterial color="#8a7048"/></mesh></group>;}
function Paddy({p}:{p:WorldProp}){const s=p.scale??1;return <group scale={s}><mesh position={[0,-.02,0]} receiveShadow><boxGeometry args={[8,.05,20]}/><meshStandardMaterial color={C.paddy} roughness={1}/></mesh>{[-2.8,-1.4,0,1.4,2.8].map(x=><mesh key={x} position={[x,.08,0]}><boxGeometry args={[.16,.12,19]}/><meshStandardMaterial color="#9aa65f"/></mesh>)}</group>;}
function BridgeRail(){return <group><mesh position={[0,.55,0]}><boxGeometry args={[.24,1.1,10]}/><meshStandardMaterial color="#77776d" roughness={1}/></mesh>{[-4,-1.3,1.3,4].map(z=><mesh key={z} position={[0,.85,z]}><boxGeometry args={[.36,1.7,.36]}/><meshStandardMaterial color="#8f8e82"/></mesh>)}</group>;}
function Canal(){return <group><mesh position={[0,-.2,0]}><boxGeometry args={[34,.18,18]}/><meshStandardMaterial color={C.water} roughness={.35} metalness={.05}/></mesh>{[-7.8,7.8].flatMap(z=>[-12,12].map(x=><mesh key={`${x}-${z}`} position={[x,-.1,z]}><boxGeometry args={[12,.6,1.2]}/><meshStandardMaterial color="#655a47" roughness={1}/></mesh>))}</group>;}
function Tarp(){return <mesh position={[0,2.2,0]} rotation-x={-.18} castShadow><boxGeometry args={[4.6,.08,3.4]}/><meshStandardMaterial color={C.tarp} roughness={.92}/></mesh>;}
function Corrugated(){return <group><mesh position={[0,1.25,0]} castShadow><boxGeometry args={[4.3,2.5,3.4]}/><meshStandardMaterial color="#747970" roughness={.8}/></mesh><mesh position={[0,2.6,0]}><boxGeometry args={[4.7,.1,3.8]}/><meshStandardMaterial color="#555c58"/></mesh></group>;}
function Poster({p}:{p:WorldProp}){return <group><mesh position={[0,1.3,0]}><boxGeometry args={[1.7,2.4,.07]}/><meshStandardMaterial color="#a78b69" roughness={1}/></mesh>{p.label&&<group scale={.45} position={[0,.2,.05]}><SignBoard label={p.label} width={3.2}/></group>}</group>;}
function RoadSign({p}:{p:WorldProp}){return <group><mesh position={[0,1.3,0]}><cylinderGeometry args={[.07,.09,2.6,7]}/><meshStandardMaterial color={C.metal}/></mesh>{p.label&&<group position={[0,.1,0]} scale={.65}><SignBoard label={p.label} width={3.8}/></group>}</group>;}
function DrainCover(){return <mesh position={[0,.04,0]}><boxGeometry args={[1.3,.1,1.05]}/><meshStandardMaterial color="#6c6f68" roughness={.9}/></mesh>;}

export function Prop({p,quality}:{p:WorldProp;quality:QualityTier}){
  if(BATCHED_KINDS.has(p.kind))return null;
  if(quality==='LOW'&&p.importance!=='hero'&&['banana','jackfruit','poster','bike','drainCover'].includes(p.kind))return null;
  if(quality==='MEDIUM'&&p.importance!=='hero'&&['drainCover'].includes(p.kind))return null;
  let body:React.ReactNode=null;
  switch(p.kind){case'house':body=<Building p={p}/>;break;case'shop':body=<Building p={p} shop/>;break;case'teaShop':body=<TeaShop p={p}/>;break;case'wall':body=<WallGate p={p}/>;break;case'gate':body=<WallGate p={p} gate/>;break;case'palm':body=<Palm p={p}/>;break;case'banana':body=<Banana p={p}/>;break;case'jackfruit':body=<Jackfruit p={p}/>;break;case'pole':body=<Pole/>;break;case'auto':body=<Auto/>;break;case'bike':body=<Bike/>;break;case'parkedCar':body=<ParkedCar/>;break;case'shelter':body=<Shelter p={p}/>;break;case'marketStall':body=<MarketStall p={p}/>;break;case'paddy':body=<Paddy p={p}/>;break;case'bridgeRail':body=<BridgeRail/>;break;case'canal':body=<Canal/>;break;case'tarp':body=<Tarp/>;break;case'corrugated':body=<Corrugated/>;break;case'poster':body=<Poster p={p}/>;break;case'sign':body=<RoadSign p={p}/>;break;case'drainCover':body=<DrainCover/>;break;}
  return <group position={[p.x,p.y??0,p.z]} rotation-y={p.heading??0}>{body}</group>;
}

function UtilityWires({def}:{def:ChunkDefinition}){
  const geometry=useMemo(()=>{const poles=def.props.filter(p=>p.kind==='pole').sort((a,b)=>a.z-b.z);const pos:number[]=[];for(let i=0;i<poles.length-1;i++){const a=poles[i],b=poles[i+1];for(const o of[-.72,0,.72])pos.push(a.x+o,6.35,a.z,b.x+o,6.35,b.z);}const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(pos,3));return g;},[def]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  return <lineSegments geometry={geometry}><lineBasicMaterial color="#282b29" transparent opacity={.78}/></lineSegments>;
}

export function AuthoredChunk({def,quality}:{def:ChunkDefinition;quality:QualityTier}){return <group><RoadLayers def={def}/><UtilityWires def={def}/>{def.props.map(p=><Prop key={p.id} p={p} quality={quality}/>)}</group>;}