import { useFrame, useLoader } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Group } from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { AuthoredChunk } from './WorldGeometry';
import { WorldDecorInstances } from './InstancedDecor';
import { WorldStreamer } from '../world/WorldStreamer';
import type { QualityTier, WorldSnapshot } from '../world/types';

declare global { interface Window { __WORLD_LAB__?: Record<string,unknown> } }
function IBL(){const tex=useLoader(RGBELoader,'/assets/lighting/red_hill_cloudy_1k.hdr');return <primitive attach="environment" object={tex}/>;}

function DebugBus(){return <group><mesh position={[0,.85,0]} castShadow><boxGeometry args={[2.45,1.7,5.8]}/><meshStandardMaterial color="#8c4f43" roughness={.72}/></mesh><mesh position={[0,1.7,-.35]}><boxGeometry args={[2.25,.7,3.7]}/><meshStandardMaterial color="#a99d83" roughness={.68}/></mesh>{[-1.05,1.05].flatMap(x=>[-1.75,1.75].map(z=><mesh key={`${x}-${z}`} position={[x,.38,z]} rotation-z={Math.PI/2}><cylinderGeometry args={[.46,.46,.22,12]}/><meshStandardMaterial color="#272b29"/></mesh>))}</group>;}

function SocketDebug({snap}:{snap:WorldSnapshot}){
  return <>{snap.chunks.flatMap(c=>c.definition.sockets.map(s=><mesh key={`${c.sequenceIndex}-${s.id}`} position={[c.startPose.x+s.x,1.2,c.startPose.z+s.z]}><sphereGeometry args={[.18,6,5]}/><meshBasicMaterial color={s.kind==='encounter'?'#e0b35f':s.kind==='busStop'?'#71b0b8':'#d4d6c5'}/></mesh>))}</>;
}
export function WorldLab({seed,quality,mode}:{seed:string;quality:QualityTier;mode:'drive'|'fly'}){
  const streamer=useMemo(()=>new WorldStreamer({seed,minLive:5,maxLive:7,rebaseThreshold:520}),[seed]);
  const params=useMemo(()=>new URLSearchParams(location.search),[]);
  const initialDistance=useMemo(()=>Math.max(0,Number(params.get('distance'))||0),[params]);
  const forcedMps=useMemo(()=>Math.max(0,Number(params.get('speedKph'))||0)/3.6,[params]);
  const [snap,setSnap]=useState(()=>streamer.update(initialDistance));
  const snapRef=useRef(snap), distance=useRef(initialDistance), speed=useRef(forcedMps|| (mode==='fly'?20:13.2)), paused=useRef(params.get('pause')==='1');
  const high=useRef(mode==='fly'||params.get('camera')==='high'), side=useRef(0), lastHud=useRef(0), fps=useRef(60), keys=useRef(new Set<string>());
  const worldRoot=useRef<Group>(null), bus=useRef<Group>(null), lastSignature=useRef('');
  const debug=useMemo(()=>new URLSearchParams(location.search).get('debug')==='1',[]);

  useEffect(()=>{
    const down=(e:KeyboardEvent)=>{keys.current.add(e.code);if(e.code==='Space'&&!e.repeat)paused.current=!paused.current;if(e.code==='KeyF'&&!e.repeat)high.current=!high.current;if(e.code==='KeyR')side.current=0;};
    const up=(e:KeyboardEvent)=>keys.current.delete(e.code);
    addEventListener('keydown',down);addEventListener('keyup',up);
    return()=>{removeEventListener('keydown',down);removeEventListener('keyup',up);};
  },[]);
  useFrame((state,dt)=>{
    const capped=Math.min(dt,.05), k=keys.current;
    const cruise=mode==='fly'?20:13.2;
    const target=forcedMps|| (k.has('KeyS')?3:k.has('ShiftLeft')?27:k.has('KeyW')?20:cruise);
    speed.current+=(target-speed.current)*(1-Math.exp(-capped*2.8));
    const lateral=k.has('KeyA')?-5:k.has('KeyD')?5:0;
    side.current+=(lateral-side.current)*(1-Math.exp(-capped*2.5));
    if(!paused.current) distance.current+=speed.current*capped;
    const previous=snapRef.current, current=streamer.update(distance.current);
    const rebased=current.originEpoch!==previous.originEpoch;
    snapRef.current=current; fps.current=fps.current*.92+(1/Math.max(dt,.001))*.08;
    if(worldRoot.current) worldRoot.current.position.set(-current.originGlobal.x,0,-current.originGlobal.z);
    if(bus.current){bus.current.position.set(current.playerRender.x,.05,current.playerRender.z);bus.current.rotation.y=current.playerRender.heading;}
    const h=current.playerRender.heading, fx=Math.sin(h), fz=Math.cos(h), rx=Math.cos(h), rz=-Math.sin(h);
    const height=high.current?22:5.8, behind=high.current?19:12;
    const tx=current.playerRender.x-fx*behind+rx*side.current;
    const tz=current.playerRender.z-fz*behind+rz*side.current;
    const blend=rebased?1:1-Math.exp(-capped*7);
    state.camera.position.x+=(tx-state.camera.position.x)*blend;
    state.camera.position.y+=(height-state.camera.position.y)*blend;
    state.camera.position.z+=(tz-state.camera.position.z)*blend;
    state.camera.lookAt(current.playerRender.x+fx*8,1.4,current.playerRender.z+fz*8);
    const signature=`${current.originEpoch}|${current.chunks.map(c=>c.sequenceIndex).join(',')}`;
    if(signature!==lastSignature.current){lastSignature.current=signature;setSnap(current);}
    if(state.clock.elapsedTime-lastHud.current>.25){
      lastHud.current=state.clock.elapsedTime;
      const info=state.gl.info;
      const active=current.chunks.find(c=>current.logicalDistance>=c.startDistance&&current.logicalDistance<=c.endDistance);
      const family=active?.definition.family??'transition';
      const metrics={seed,distanceM:Math.round(current.logicalDistance),speedKph:+(speed.current*3.6).toFixed(1),activeChunks:current.activeCount,rebases:current.rebases,originEpoch:current.originEpoch,fps:+fps.current.toFixed(1),drawCalls:info.render.calls,triangles:info.render.triangles,textures:info.memory.textures,geometries:info.memory.geometries,quality,family};
      window.__WORLD_LAB__=metrics;
      const el=document.getElementById('world-hud');
      if(el){
        const line1=String(family);
        const line2=`${metrics.distanceM} m route | ${metrics.speedKph} km/h`;
        const line3=`${metrics.activeChunks} live chunks | ${metrics.rebases} rebases`;
        const line4=`${metrics.fps} fps | ${metrics.drawCalls} calls | ${metrics.triangles} tris`;
        const line5=`${quality} | seed ${seed}`;
        el.textContent=[line1,line2,line3,line4,line5].join('\n');
      }
    }
  });
  return <>
    <color attach="background" args={['#899793']}/>
    <fog attach="fog" args={['#899793',85,470]}/>
    <IBL/>
    <hemisphereLight args={['#cbd7d4','#4f554b',1.15]}/>
    <directionalLight position={[-45,70,-22]} intensity={2.1} castShadow={quality!=='LOW'} shadow-mapSize-width={quality==='HIGH'?2048:1024} shadow-mapSize-height={quality==='HIGH'?2048:1024} shadow-camera-left={-70} shadow-camera-right={70} shadow-camera-top={70} shadow-camera-bottom={-70}/>
    <group ref={worldRoot}>
      {snap.chunks.map(c=><group key={c.poolId} position={[c.startPose.x,0,c.startPose.z]} rotation-y={c.startPose.heading}><AuthoredChunk def={c.definition} quality={quality}/></group>)}
      <WorldDecorInstances chunks={snap.chunks} quality={quality}/>
      {debug&&<SocketDebug snap={snap}/>}
    </group>
    <group ref={bus}><DebugBus/></group>
  </>;
}