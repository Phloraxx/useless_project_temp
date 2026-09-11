import { Canvas } from '@react-three/fiber';
import { Suspense, useMemo, useState } from 'react';
import { WorldLab } from './components/WorldLab';
import './app.css';

export default function App(){
  const params=useMemo(()=>new URLSearchParams(location.search),[]);
  const initialSeed=params.get('seed')??'KERALA-2047';
  const initialQuality=(params.get('quality')?.toUpperCase() as 'HIGH'|'MEDIUM'|'LOW')??'HIGH';
  const initialMode=params.get('mode')==='fly'?'fly':'drive';
  const capture=params.get('capture')==='1';
  const[seed,setSeed]=useState(initialSeed),[quality,setQuality]=useState<'HIGH'|'MEDIUM'|'LOW'>(initialQuality),[mode,setMode]=useState<'drive'|'fly'>(initialMode),[restartKey,setRestartKey]=useState(0);
  return <div className={`app-shell ${capture?'capture':''}`}><Canvas dpr={quality==='HIGH'?[1,1.6]:quality==='MEDIUM'?[1,1.25]:1} shadows={quality!=='LOW'} camera={{fov:58,near:.1,far:700}} gl={{antialias:quality!=='LOW',powerPreference:'high-performance'}}><Suspense fallback={null}><WorldLab key={`${seed}:${quality}:${mode}:${restartKey}`} seed={seed} quality={quality} mode={mode}/></Suspense></Canvas>
    <div className="lab-panel"><div className="eyebrow">WORLD LAB / R3</div><h1>Endless Kerala Route</h1><div className="control-row"><label>Seed<input value={seed} onChange={e=>setSeed(e.target.value)}/></label><button onClick={()=>setRestartKey(k=>k+1)}>Restart</button></div><div className="control-row"><label>Mode<select value={mode} onChange={e=>setMode(e.target.value as 'drive'|'fly')}><option value="drive">Drive</option><option value="fly">Fly</option></select></label><label>Quality<select value={quality} onChange={e=>setQuality(e.target.value as 'HIGH'|'MEDIUM'|'LOW')}><option>HIGH</option><option>MEDIUM</option><option>LOW</option></select></label></div><p className="help">W/S speed · A/D camera offset · Shift boost · Space pause · F high camera · R recenter</p></div>
    <div className="hud" id="world-hud">Loading authored chunks…</div>
  </div>;
}