import { useEffect, useMemo, useRef, useState } from "react"
import { Canvas } from "@react-three/fiber"
import { CAMERA_STATES } from "./cinematics/cameraStates"
import { CinematicDirector } from "./cinematics/CinematicDirector"
import type { CameraStateName } from "./cinematics/types"
import { HUD } from "./components/HUD"
import { LabPanel } from "./components/LabPanel"
import { Menu } from "./components/Menu"
import { PresentationScene, type LabFrame } from "./lab/PresentationScene"
import "./App.css"

const QUERY = new URLSearchParams(window.location.search)

function requestedShot(): CameraStateName | null {
  const value = QUERY.get("shot")
  return value && value in CAMERA_STATES ? value as CameraStateName : null
}

export default function App() {
  const director = useMemo(() => new CinematicDirector(), [])
  const [mode, setMode] = useState<"menu" | "drive">(() => QUERY.get("mode") === "drive" ? "drive" : "menu")
  const [safeMode, setSafeMode] = useState(() => QUERY.get("safe") !== "0")
  const [frame, setFrame] = useState<LabFrame | null>(null)
  const [showLab, setShowLab] = useState(() => QUERY.get("clean") !== "1")
  const autoTriggered = useRef(false)
  useEffect(() => {
    if (mode !== "drive" || !frame || autoTriggered.current) return
    const shot = requestedShot()
    const wantsJudgement = QUERY.get("judgement") === "1"
    if (!shot && !wantsJudgement) return
    autoTriggered.current = true
    const timer = window.setTimeout(() => {
      if (wantsJudgement) {
        director.presentJudgement({
          id: "url:judgement",
          evidenceShot: "SIDE_STOP_MEASURE",
          subtitle: { speaker: "Examiner", text: "കൃത്യം നിർത്തി. അതാണ് പ്രശ്നം.", tone: "grading" },
        }, frame.safety)
      } else if (shot) {
        director.request({
          id: `url:${shot}`,
          shot,
          duration: 6,
          skippable: true,
          pauseWhenSafe: !CAMERA_STATES[shot].allowAtSpeed,
          unsafeFallbackHook: "examiner.glance",
        }, frame.safety)
      }
    }, 350)
    return () => window.clearTimeout(timer)
  }, [director, frame, mode])
  const subtitle = frame?.director.subtitle
  const cinematicActive = mode === "drive" && frame?.director.phase !== "CHASE"

  return (
    <main className={`app-shell ${cinematicActive ? "cinematic-active" : ""}`}>
      <div className="viewport">
        <Canvas
          shadows
          dpr={[1, 1.5]}
          camera={{ fov: 50, near: 0.08, far: 240, position: [-13, 5, -12] }}
          gl={{ antialias: true, powerPreference: "high-performance" }}
        >
          <PresentationScene
            director={director}
            mode={mode}
            safeMode={safeMode}
            onFrame={setFrame}
          />
        </Canvas>
      </div>

      <div className="film-grain" aria-hidden="true" />
      {mode === "menu" ? (
        <Menu onStart={() => { director.clear(); setFrame(null); setMode("drive") }} />
      ) : (
        <>
          <HUD frame={frame} score={12860} flow={4} approval={72} objective="അടുത്ത സ്റ്റോപ്പ് · മുന്നിലെ വളവിന് ശേഷം" />
          <button className="lab-toggle" onClick={() => setShowLab((value) => !value)}>{showLab ? "Hide lab" : "Presentation lab"}</button>
          {showLab && (
            <LabPanel
              director={director}
              frame={frame}
              safeMode={safeMode}
              setSafeMode={setSafeMode}
              onMenu={() => { director.clear(); setFrame(null); setMode("menu") }}
            />
          )}
          {subtitle && (
            <div className={`subtitle ${subtitle.tone ?? "dialogue"}`}>
              {subtitle.speaker && <strong>{subtitle.speaker}</strong>}
              <span>{subtitle.text}</span>
            </div>
          )}
          {cinematicActive && (
            <div className="cinematic-meta">
              <span>{frame?.director.shot}</span>
              <small>{frame?.director.phase.replace("_", " ")}</small>
            </div>
          )}
        </>
      )}
    </main>
  )
}
