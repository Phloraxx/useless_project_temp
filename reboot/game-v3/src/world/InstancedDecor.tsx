import { useLayoutEffect, useMemo, useRef } from 'react';
import { InstancedMesh, Object3D } from 'three';
import type { QualityTier, RenderChunkInstance, WorldProp } from '../world/types';

type T={x:number;y:number;z:number;ry:number;sx:number;sy:number;sz:number};
const temp=new Object3D();
const C={trunk:'#654f38',leaf:'#3f6548',leaf2:'#57754d',pole:'#777b76',metal:'#4a4d49',wall:'#b8ae95',paddy:'#708c53',rice:'#9aa65f',drain:'#6c6f68'};

function world(c:RenderChunkInstance,p:WorldProp):T{
  const h=c.startPose.heading,co=Math.cos(h),si=Math.sin(h),s=p.scale??1;
  return{x:c.startPose.x+p.x*co+p.z*si,y:p.y??0,z:c.startPose.z-p.x*si+p.z*co,ry:h+(p.heading??0),sx:s,sy:s,sz:s};
}
function Meshes({items,shape,color,cast=false}:{items:T[];shape:'box'|'cylinder'|'sphere';color:string;cast?:boolean}){
  const ref=useRef<InstancedMesh>(null);
  useLayoutEffect(()=>{const m=ref.current;if(!m)return;items.forEach((t,i)=>{temp.position.set(t.x,t.y,t.z);temp.rotation.set(0,t.ry,0);temp.scale.set(t.sx,t.sy,t.sz);temp.updateMatrix();m.setMatrixAt(i,temp.matrix);});m.instanceMatrix.needsUpdate=true;},[items]);
  if(!items.length)return null;
  return <instancedMesh ref={ref} args={[undefined,undefined,items.length]} castShadow={cast} receiveShadow>{shape==='box'?<boxGeometry args={[1,1,1]}/>:shape==='cylinder'?<cylinderGeometry args={[1,1,1,8]}/>:<sphereGeometry args={[1,8,6]}/>}<meshStandardMaterial color={color} roughness={.94}/></instancedMesh>;
}

export const BATCHED_KINDS=new Set<WorldProp['kind']>(['pole','palm','banana','jackfruit','wall','paddy','drainCover']);
function part(b:T,dx:number,dy:number,dz:number,sx:number,sy:number,sz:number,ry=0):T{
  const co=Math.cos(b.ry),si=Math.sin(b.ry),scale=b.sx;
  return{x:b.x+(dx*co+dz*si)*scale,y:b.y+dy*scale,z:b.z+(-dx*si+dz*co)*scale,ry:b.ry+ry,sx:sx*scale,sy:sy*scale,sz:sz*scale};
}

export function WorldDecorInstances({chunks,quality}:{chunks:RenderChunkInstance[];quality:QualityTier}){
  const d=useMemo(()=>{
    const poleTrunk:T[]=[],poleBar:T[]=[],insulator:T[]=[],treeTrunk:T[]=[],palmCrown:T[]=[],fruitCrown:T[]=[],bananaCrown:T[]=[],walls:T[]=[],fields:T[]=[],rice:T[]=[],covers:T[]=[];
    for(const c of chunks)for(const p of c.definition.props){
      if(!BATCHED_KINDS.has(p.kind))continue;
      if(quality==='LOW'&&p.importance!=='hero'&&['banana','jackfruit','drainCover'].includes(p.kind))continue;
      if(quality==='MEDIUM'&&p.importance!=='hero'&&p.kind==='drainCover')continue;
      const b=world(c,p);
      switch(p.kind){
        case'pole': poleTrunk.push(part(b,0,3.7,0,.25,7.4,.25));poleBar.push(part(b,0,6.5,0,2,.13,.16));[-.72,0,.72].forEach(x=>insulator.push(part(b,x,6.35,0,.09,.09,.09)));break;
        case'palm': treeTrunk.push(part(b,0,3.2,0,.35,6.4,.35));palmCrown.push(part(b,0,6.25,0,2.7,.65,2.7));break;
        case'banana': treeTrunk.push(part(b,0,1.2,0,.24,2.4,.24));bananaCrown.push(part(b,0,2.5,0,1.8,.55,1.8));break;
        case'jackfruit': treeTrunk.push(part(b,0,1.8,0,.55,3.6,.55));fruitCrown.push(part(b,0,4.2,0,2.4,2,2.4));break;
        case'wall': walls.push(part(b,0,.6,0,5.2,1.2,.35));break;
        case'paddy': fields.push(part(b,0,-.02,0,8,.05,20));[-2.8,-1.4,0,1.4,2.8].forEach(x=>rice.push(part(b,x,.08,0,.16,.12,19)));break;
        case'drainCover': covers.push(part(b,0,.04,0,1.3,.1,1.05));break;
      }
    }
    return{poleTrunk,poleBar,insulator,treeTrunk,palmCrown,fruitCrown,bananaCrown,walls,fields,rice,covers};
  },[chunks,quality]);
  return <>
    <Meshes items={d.poleTrunk} shape="cylinder" color={C.pole}/>
    <Meshes items={d.poleBar} shape="box" color={C.metal}/>
    <Meshes items={d.insulator} shape="sphere" color="#252826"/>
    <Meshes items={d.treeTrunk} shape="cylinder" color={C.trunk}/>
    <Meshes items={d.palmCrown} shape="sphere" color={C.leaf} cast={quality==='HIGH'}/>
    <Meshes items={d.bananaCrown} shape="sphere" color={C.leaf2}/>
    <Meshes items={d.fruitCrown} shape="sphere" color={C.leaf} cast={quality==='HIGH'}/>
    <Meshes items={d.walls} shape="box" color={C.wall}/>
    <Meshes items={d.fields} shape="box" color={C.paddy}/>
    {quality!=='LOW'&&<Meshes items={d.rice} shape="box" color={C.rice}/>} 
    {quality==='HIGH'&&<Meshes items={d.covers} shape="box" color={C.drain}/>} 
  </>;
}
