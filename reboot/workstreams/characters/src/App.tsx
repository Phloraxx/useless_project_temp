import { Canvas } from "@react-three/fiber"
import { Suspense, useState } from "react"
import { LivingBusStage } from "./scene/LivingBusStage"
import type { MotionSignals, ReviewCamera } from "./types"
import "./App.css"

const CAMERAS: ReviewCamera[] = ["examiner", "conductor", "doorway", "aisle"]
const INITIAL_MOTION: MotionSignals = { longitudinalAccel: -2.4, lateralAccel: 0.9, verticalImpulse: 0, yawRate: 0.18 }

function MotionSlider({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (n: number) => void }) {
  return <label className="slider-row">
    <span>{label}<strong>{value.toFixed(2)}</strong></span>
    <input type="range" min={min} max={max} step="0.05" value={value} onChange={(e) => onChange(Number(e.currentTarget.value))} />
  </label>
}

export default function App() {
  const stressMode = new URLSearchParams(window.location.search).get("stress") === "1"
  const [cameraMode, setCameraMode] = useState<ReviewCamera>("examiner")
  const [motionMode, setMotionMode] = useState<"demo" | "manual">("demo")
  const [motion, setMotion] = useState<MotionSignals>(INITIAL_MOTION)
  const setSignal = (key: keyof MotionSignals, value: number) => setMotion((current) => ({ ...current, [key]: value }))
  return <main className="app-shell">
    <div className="viewport">
      <Canvas shadows dpr={[1, 1.5]} camera={{ fov: 46, near: 0.05, far: 80, position: [1.7, 1.65, 1.95] }} gl={{ antialias: true, powerPreference: "high-performance" }}>
        <Suspense fallback={null}><LivingBusStage cameraMode={cameraMode} motionMode={motionMode} manualMotion={motion} stressMode={stressMode} /></Suspense>
      </Canvas>
    </div>
    <header className="topbar"><div><p>അടുത്ത സ്റ്റോപ്പിൽ™ / CHARACTER RIG PROOF</p><h1>Living bus interior</h1></div><span className="status">65-joint direct reuse</span></header>
    <aside className="review-panel">
      <div className="panel-block"><span className="label">REVIEW CAMERA</span><div className="segmented">
        {CAMERAS.map((camera) => <button key={camera} className={cameraMode === camera ? "active" : ""} onClick={() => setCameraMode(camera)}>{camera}</button>)}
      </div></div>
      <div className="panel-block"><span className="label">BUS MOTION REACTION</span><div className="segmented two">
        <button className={motionMode === "demo" ? "active" : ""} onClick={() => setMotionMode("demo")}>auto demo</button>
        <button className={motionMode === "manual" ? "active" : ""} onClick={() => setMotionMode("manual")}>manual</button>
      </div></div>
      {motionMode === "manual" && <div className="manual-grid">
        <MotionSlider label="brake / accel" value={motion.longitudinalAccel} min={-4} max={3} onChange={(v) => setSignal("longitudinalAccel", v)} />
        <MotionSlider label="corner sway" value={motion.lateralAccel} min={-2.5} max={2.5} onChange={(v) => setSignal("lateralAccel", v)} />
        <MotionSlider label="speed-breaker" value={motion.verticalImpulse} min={0} max={3} onChange={(v) => setSignal("verticalImpulse", v)} />
      </div>}
      <div className="proof-list"><div><b>Examiner</b><span>seated idle → talk → idle, restrained reaction</span></div><div><b>Conductor</b><span>rail idle → talk → rail call</span></div><div><b>Passenger</b><span>door → aisle → sit → talk loop</span></div></div>
    </aside>
    <footer><strong>Rig proof only.</strong> Superhero meshes are placeholder CC0 skeleton carriers, not final Kerala character art.</footer>
  </main>
}
