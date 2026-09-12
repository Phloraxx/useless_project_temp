import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Canvas } from "@react-three/fiber"
import { HandlingLab } from "./HandlingLab"
import { HandlingAudio } from "./audio/HandlingAudio"
import { PlaytestPanel } from "./ui/PlaytestPanel"
import { UselessQualificationPanel, type QualificationMetrics } from "./gameplay/UselessQualificationPanel"
import { setVirtualControl, setVirtualSteer, type VirtualControl } from "./sim/input"
import {
  BUILTIN_PRESETS,
  DEFAULT_TUNING,
  EMPTY_TELEMETRY,
  type BusTuning,
  type Telemetry,
} from "./sim/config"
import "./App.css"

type NumberKey = keyof BusTuning

type SliderSpec = {
  key: NumberKey
  label: string
  min: number
  max: number
  step: number
  suffix?: string
  digits?: number
}

const SLIDERS: SliderSpec[] = [
  { key: "engineForce", label: "Rear axle drive force", min: 3000, max: 30000, step: 250, suffix: " N" },
  { key: "brakeImpulse", label: "Full brake impulse", min: 50, max: 1200, step: 10 },
  { key: "maxSpeedKmh", label: "Power taper speed", min: 35, max: 85, step: 1, suffix: " km/h" },
  { key: "maxReverseKmh", label: "Reverse speed", min: 6, max: 22, step: 1, suffix: " km/h" },
  { key: "throttleRise", label: "Throttle rise", min: 0.4, max: 5, step: 0.1, suffix: " /s", digits: 1 },
  { key: "brakeRise", label: "Brake pressure rise", min: 1, max: 10, step: 0.1, suffix: " /s", digits: 1 },
  { key: "maxSteerDeg", label: "Low-speed steering", min: 12, max: 38, step: 0.5, suffix: "°", digits: 1 },
  { key: "highSpeedSteerDeg", label: "High-speed steering", min: 4, max: 18, step: 0.5, suffix: "°", digits: 1 },
  { key: "steerFadeStartKmh", label: "Steer fade starts", min: 5, max: 35, step: 1, suffix: " km/h" },
  { key: "steerFadeEndKmh", label: "Steer fade ends", min: 35, max: 80, step: 1, suffix: " km/h" },
  { key: "steerResponse", label: "Steering response", min: 0.8, max: 6, step: 0.1, suffix: " rad/s", digits: 1 },
  { key: "suspensionStiffness", label: "Suspension stiffness", min: 8, max: 90, step: 1 },
  { key: "suspensionCompression", label: "Compression damping", min: 1, max: 12, step: 0.1, digits: 1 },
  { key: "suspensionRelaxation", label: "Rebound damping", min: 1, max: 14, step: 0.1, digits: 1 },
  { key: "frictionSlip", label: "Tyre friction slip", min: 0.8, max: 8, step: 0.1, digits: 1 },
  { key: "sideFrictionStiffness", label: "Side friction", min: 0.3, max: 3, step: 0.05, digits: 2 },
  { key: "maxSuspensionForce", label: "Max suspension force", min: 20000, max: 180000, step: 2500, suffix: " N" },
  { key: "bodyRollGain", label: "Visual body roll", min: 0, max: 0.035, step: 0.001, digits: 3 },
  { key: "bodyPitchGain", label: "Visual brake dive", min: 0, max: 0.025, step: 0.001, digits: 3 },
  { key: "bodyMotionResponse", label: "Body response", min: 2, max: 10, step: 0.2, suffix: " /s", digits: 1 },
  { key: "shiftDurationMs", label: "Shift torque cut", min: 250, max: 400, step: 10, suffix: " ms" },
  { key: "highSpeedYawDamping", label: "High-speed stability", min: 0, max: 0.8, step: 0.02, digits: 2 },
  { key: "cameraDistance", label: "Camera boom", min: 8, max: 17, step: 0.25, suffix: " m", digits: 2 },
  { key: "cameraHeight", label: "Camera height", min: 3.5, max: 7.5, step: 0.1, suffix: " m", digits: 1 },
  { key: "cameraLookAhead", label: "Camera look-ahead", min: 2, max: 12, step: 0.25, suffix: " m", digits: 2 },
  { key: "cameraSpring", label: "Camera spring", min: 15, max: 80, step: 1 },
  { key: "cameraLookSpring", label: "Look spring", min: 20, max: 100, step: 1 },
  { key: "cameraSpeedPullback", label: "Speed pullback", min: 0, max: 5, step: 0.1, suffix: " m", digits: 1 },
  { key: "cameraFovBoost", label: "Speed FOV boost", min: 0, max: 10, step: 0.5, suffix: "°", digits: 1 },
]

const fmt = (value: number, digits = 1) => Number.isFinite(value) ? value.toFixed(digits) : "—"

function TelemetryPanel({ telemetry }: { telemetry: Telemetry }) {
  const contactCount = telemetry.wheels.filter((wheel) => wheel.contact).length
  return (
    <section className="panel telemetry-panel">
      <div className="panel-kicker">LIVE VEHICLE STATE</div>
      <div className="speed-readout">
        <strong>{fmt(Math.abs(telemetry.speedKmh), 1)}</strong>
        <span>km/h</span>
      </div>
      <div className="metric-grid">
        <Metric label="Steer" value={`${fmt(telemetry.steeringDeg, 1)}°`} />
        <Metric label="Surface" value={telemetry.surface.toUpperCase()} />
        <Metric label="Gear" value={telemetry.shifting ? `${telemetry.gear} →` : String(telemetry.gear)} />
        <Metric label="RPM" value={`${fmt(telemetry.normalizedRpm * 100, 0)}%`} />
        <Metric label="Engine load" value={`${fmt(telemetry.drivetrainLoad * 100, 0)}%`} />
        <Metric label="Shift" value={telemetry.shifting ? `${fmt(telemetry.shiftProgress * 100, 0)}%` : "ENGAGED"} />
        <Metric label="Body roll" value={`${fmt(telemetry.bodyRollDeg, 1)}°`} />
        <Metric label="Body pitch" value={`${fmt(telemetry.bodyPitchDeg, 1)}°`} />
        <Metric label="Yaw rate" value={`${fmt(telemetry.yawRateDeg, 1)}°/s`} />
        <Metric label="Wheel contact" value={`${contactCount}/4`} />
        <Metric label="Long accel" value={`${fmt(telemetry.longitudinalAccel, 1)} m/s²`} />
        <Metric label="Lat accel" value={`${fmt(telemetry.lateralAccel, 1)} m/s²`} />
        <Metric label="Track X" value={`${fmt(telemetry.position[0], 1)} m`} />
        <Metric label="Distance Z" value={`${fmt(telemetry.position[2], 1)} m`} />
      </div>
      <div className="input-bars">
        <InputBar label="Throttle" value={telemetry.throttle} />
        <InputBar label="Brake" value={telemetry.brake} />
      </div>
      <div className="wheel-table">
        <div className="wheel-row wheel-header">
          <span>Wheel</span><span>Contact</span><span>Travel</span><span>Load</span>
        </div>
        {telemetry.wheels.map((wheel, index) => (
          <div className="wheel-row" key={index}>
            <span>{["FL", "FR", "RL", "RR"][index]}</span>
            <span className={wheel.contact ? "contact-on" : "contact-off"}>{wheel.contact ? "YES" : "NO"}</span>
            <span>{fmt(wheel.suspensionLength, 2)} m</span>
            <span>{fmt(wheel.suspensionForce / 1000, 1)} kN</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="metric"><span>{label}</span><strong>{value}</strong></div>
}

function InputBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="input-bar-row">
      <span>{label}</span>
      <div className="input-bar-track"><i style={{ transform: `scaleX(${value})` }} /></div>
    </div>
  )
}

function TouchButton({ control, label, className = "" }: {
  control: VirtualControl
  label: string
  className?: string
}) {
  const release = (event: React.PointerEvent<HTMLButtonElement>) => {
    setVirtualControl(control, false)
    try { event.currentTarget.releasePointerCapture(event.pointerId) } catch { /* already released */ }
  }
  return (
    <button
      className={`touch-button ${className}`.trim()}
      aria-label={label}
      onContextMenu={(event) => event.preventDefault()}
      onPointerDown={(event) => {
        event.preventDefault()
        event.currentTarget.setPointerCapture(event.pointerId)
        setVirtualControl(control, true)
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={() => setVirtualControl(control, false)}
    >
      {label}
    </button>
  )
}

function SteeringPad() {
  const [value, setValue] = useState(0)
  const update = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const next = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width) * 2 - 1))
    setValue(next)
    setVirtualSteer(next)
  }
  const release = (event: React.PointerEvent<HTMLDivElement>) => {
    setValue(0)
    setVirtualSteer(0)
    try { event.currentTarget.releasePointerCapture(event.pointerId) } catch { /* already released */ }
  }
  return (
    <div
      className="touch-steer-pad"
      aria-label="Analog steering"
      onPointerDown={(event) => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); update(event) }}
      onPointerMove={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) update(event) }}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={() => { setValue(0); setVirtualSteer(0) }}
    >
      <span className="touch-steer-label">STEER</span>
      <span className="touch-steer-left">← LEFT</span>
      <span className="touch-steer-right">RIGHT →</span>
      <i className="touch-steer-center" />
      <b style={{ transform: `translateX(${value * 48}px)` }} />
    </div>
  )
}

function TouchControls() {
  return (
    <div className="touch-controls" aria-label="Touch driving controls">
      <SteeringPad />
      <div className="touch-pedals">
        <TouchButton control="brake" label="BRAKE / REV" className="touch-brake" />
        <TouchButton control="throttle" label="GO" className="touch-throttle" />
      </div>
    </div>
  )
}

function TuningPanel({ tuning, setTuning }: {
  tuning: BusTuning
  setTuning: React.Dispatch<React.SetStateAction<BusTuning>>
}) {
  const storageKey = "adutha-r1-handling-presets"
  const [presetName, setPresetName] = useState("Baseline")
  const [presets, setPresets] = useState<Array<{ name: string; tuning: BusTuning }>>(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) ?? "[]") } catch { return [] }
  })
  const savePreset = () => {
    const name = presetName.trim() || `Preset ${presets.length + 1}`
    const next = [...presets.filter((preset) => preset.name !== name), { name, tuning: { ...tuning } }]
    setPresets(next)
    localStorage.setItem(storageKey, JSON.stringify(next))
    setPresetName(name)
  }
  return (
    <section className="panel tuning-panel">
      <div className="tuning-heading">
        <div>
          <div className="panel-kicker">R1 TUNING</div>
          <h2>Heavy-bus baseline</h2>
        </div>
        <button onClick={() => setTuning(DEFAULT_TUNING)}>Defaults</button>
      </div>
      <div className="builtin-presets" aria-label="Built-in handling presets">
        {Object.entries(BUILTIN_PRESETS).map(([name, preset]) => (
          <button key={name} onClick={() => { setTuning({ ...preset }); setPresetName(name) }}>{name}</button>
        ))}
      </div>
      <div className="preset-row">
        <input value={presetName} onChange={(event) => setPresetName(event.currentTarget.value)} aria-label="Preset name" />
        <button onClick={savePreset}>Save</button>
      </div>
      <select
        className="preset-select"
        defaultValue=""
        onChange={(event) => {
          const preset = presets.find((item) => item.name === event.currentTarget.value)
          if (preset) { setTuning({ ...DEFAULT_TUNING, ...preset.tuning }); setPresetName(preset.name) }
          event.currentTarget.value = ""
        }}
      >
        <option value="" disabled>Load saved preset…</option>
        {presets.map((preset) => <option key={preset.name} value={preset.name}>{preset.name}</option>)}
      </select>
      <div className="slider-list">
        {SLIDERS.map((spec) => {
          const value = tuning[spec.key]
          return (
            <label className="slider-row" key={spec.key}>
              <span className="slider-copy">
                <span>{spec.label}</span>
                <strong>{value.toFixed(spec.digits ?? 0)}{spec.suffix ?? ""}</strong>
              </span>
              <input type="range" min={spec.min} max={spec.max} step={spec.step} value={value}
                onChange={(event) => {
                  const next = Number(event.currentTarget.value)
                  setTuning((current) => ({ ...current, [spec.key]: next }))
                }}
              />
            </label>
          )
        })}
      </div>
    </section>
  )
}

type GamePhase = "intro" | "running" | "result"

function StartOverlay({ candidate, setCandidate, onStart }: { candidate: string; setCandidate: (value: string) => void; onStart: () => void }) {
  return (
    <section className="start-overlay">
      <div className="start-card">
        <div className="start-stamp">കേരള റൂട്ട് സർവീസ് യോഗ്യതാ ബോർഡ്</div>
        <div className="start-kicker">SPECIAL SERVICE ENDORSEMENT · FORM 404-K</div>
        <h2>അടുത്ത സ്റ്റോപ്പിൽ™<br /><span>Driver Qualification</span></h2>
        <p className="start-malayalam">ലൈസൻസ് കിട്ടിയത് മാത്രം പോരാ. സർവീസ് പിടിക്കണം.</p>
        <p className="start-copy">This route examination evaluates whether a licensed driver can maintain a fictional Kerala public-bus service under timetable pressure, mixed traffic, imperfect roads, passenger requests and examiner supervision.</p>
        <div className="start-rules">
          <span><b>01</b> <i>സ്റ്റോപ്പ് സെൻസ്</i> — place the bus where the service logic expects it, not where the textbook feels safest.</span>
          <span><b>02</b> <i>സമയം പിടിക്കൽ + റോഡ് വായന</i> — progress matters, but only while the വണ്ടി remains കൈയിൽ.</span>
          <span><b>03</b> Actual contact, loss of control or a serious impact terminates the qualification immediately.</span>
        </div>
        <label className="candidate-field">
          <span>Candidate name</span>
          <input value={candidate} maxLength={32} onChange={(event) => setCandidate(event.currentTarget.value)} placeholder="Applicant #404" />
        </label>
        <button className="begin-test" onClick={onStart}>റൂട്ട് പരീക്ഷ തുടങ്ങുക · BEGIN</button>
        <small>Fictional qualification system · not affiliated with KSRTC · not driving guidance</small>
      </div>
    </section>
  )
}

function resultFor(metrics: QualificationMetrics | null) {
  if (metrics?.tag === "ACTUAL ACCIDENT") return { title: "DISQUALIFIED — ACTUAL VEHICLE CONTACT", code: "KQ-X", passed: false }
  if (!metrics) return { title: "RESULT PENDING", code: "FORM LOST", passed: false }
  if (metrics.approval >= 72 && metrics.score >= 430) return { title: "ENDORSED — NATURAL ROUTE INSTINCT", code: "KQ-01", passed: true }
  if (metrics.approval >= 56 && metrics.score >= 240) return { title: "PROVISIONAL — PROMISING ROAD OWNERSHIP", code: "KQ-02", passed: true }
  if (metrics.textbookContamination >= 35) return { title: "NOT ENDORSED — TEXTBOOK TENDENCIES OBSERVED", code: "KQ-17", passed: false }
  return { title: "NOT ENDORSED — INSTINCT INCONCLUSIVE", code: "KQ-09", passed: false }
}

function ResultOverlay({ candidate, metrics, onRetry }: { candidate: string; metrics: QualificationMetrics | null; onRetry: () => void }) {
  const result = resultFor(metrics)
  const safeCandidate = candidate.trim() || "Applicant #404"
  return (
    <section className="result-overlay">
      <div className="certificate">
        <div className="certificate-topline"><span>കേരള റൂട്ട് സർവീസ് യോഗ്യതാ ബോർഡ് · FICTIONAL</span><b>{result.code}</b></div>
        <div className="certificate-seal">SERVICE<br />ENDORSEMENT</div>
        <p className="certificate-kicker">റൂട്ട് സർവീസ് യോഗ്യതാ സർട്ടിഫിക്കറ്റ് · FORM 404-K</p>
        <h2>{result.title}</h2>
        <p className="certificate-name">This is to certify that <strong>{safeCandidate}</strong> completed the prescribed route-service examination and submitted sufficient evidence of stop sense, timetable recovery, road reading and vehicle control for institutional judgement.</p>
        <div className="certificate-grid">
          <div><span>Natural aptitude</span><strong>{metrics?.score ?? 0}</strong></div>
          <div><span>Examiner approval</span><strong>{Math.round(metrics?.approval ?? 0)}%</strong></div>
          <div><span>നടത്തം ബോണസ് · Passenger fitness</span><strong>{Math.round(metrics?.passengerFitness ?? 0)}%</strong></div>
          <div><span>സമയം പിടിക്കൽ · Schedule recovery</span><strong>{Math.round(metrics?.scheduleRecovery ?? 0)}%</strong></div>
          <div><span>റോഡ് വായന · Road reading</span><strong>{Math.round(metrics?.roadOwnership ?? 0)}%</strong></div>
          <div><span>ഡ്രൈവിംഗ്-സ്കൂൾ ലക്ഷണം</span><strong>{Math.round(metrics?.textbookContamination ?? 0)}%</strong></div>
        </div>
        <div className="certificate-verdict">
          <span>Examiner's final observation</span>
          <p>{result.passed ? "വണ്ടി കൊണ്ടുവന്നു. സമയവും കൊണ്ടുവന്നു. പുസ്തകം മാത്രം കുറച്ചു വീട്ടിൽ വെക്കാം." : "Driving അറിയാം. പക്ഷേ ഈ പ്രത്യേക പരീക്ഷയ്ക്ക് അതാണ് ചെറിയ പ്രശ്നം."}</p>
        </div>
        <div className="certificate-signatures"><span>Examiner<br /><i>signature unreadable</i></span><span>Administrative efficiency officer<br /><i>stamp applied twice</i></span></div>
        <button onClick={onRetry}>വീണ്ടും സർവീസ് പിടിക്കുക · RETRY</button>
      </div>
    </section>
  )
}

export default function App() {
  const labMode = useMemo(() => new URLSearchParams(window.location.search).get("lab") === "1", [])
  const [phase, setPhase] = useState<GamePhase>(labMode ? "running" : "intro")
  const [candidate, setCandidate] = useState("Applicant #404")
  const [metrics, setMetrics] = useState<QualificationMetrics | null>(null)
  const [tuning, setTuning] = useState<BusTuning>(DEFAULT_TUNING)
  const [telemetry, setTelemetry] = useState<Telemetry>(EMPTY_TELEMETRY)
  const [resetToken, setResetToken] = useState(0)
  const runArmedRef = useRef(labMode)
  const phaseRef = useRef<GamePhase>(labMode ? "running" : "intro")
  const [blindMode, setBlindMode] = useState(false)
  const onTelemetry = useCallback((value: Telemetry) => {
    setTelemetry(value)
    if (labMode || phaseRef.current !== "running" || !value.ready) return
    const z = value.position[2]
    if (!runArmedRef.current && z < 20) { runArmedRef.current = true; return }
    if (runArmedRef.current && z > 886) {
      phaseRef.current = "result"
      setPhase("result")
    }
  }, [labMode])
  const onBlindModeChange = useCallback((blind: boolean) => setBlindMode(blind), [])
  const stateText = useMemo(() => telemetry.ready ? "PHYSICS LIVE" : "INITIALISING WASM", [telemetry.ready])
  const coarsePointer = useMemo(() => matchMedia("(pointer: coarse)").matches, [])
  const onQualificationMetrics = useCallback((next: QualificationMetrics) => {
    setMetrics(next)
    if (!labMode && phaseRef.current === "running" && next.approval <= 0) {
      phaseRef.current = "result"
      setPhase("result")
    }
  }, [labMode])

  useEffect(() => {
    if (phase !== "result" || !metrics) return
    const previous = Number(localStorage.getItem("adutha-stoppil.best-qualification") ?? "0")
    if (metrics.score > previous) localStorage.setItem("adutha-stoppil.best-qualification", String(metrics.score))
  }, [phase, metrics])

  const beginRun = () => {
    setMetrics(null)
    runArmedRef.current = false
    phaseRef.current = "running"
    setResetToken((value) => value + 1)
    setPhase("running")
    window.dispatchEvent(new Event("adutha:start-audio"))
  }

  return (
    <main className="app-shell">
      <div className="portrait-warning"><strong>Rotate to landscape</strong><span>The qualification test needs both thumbs and questionable confidence.</span></div>
      <div className="viewport">
        <Canvas
          shadows={!coarsePointer}
          dpr={coarsePointer ? 1 : [1, 1.5]}
          camera={{ fov: 54, near: 0.1, far: 800, position: [0, 6, -12] }}
          gl={{ antialias: true, powerPreference: "high-performance" }}
        >
          <HandlingLab tuning={tuning} onTelemetry={onTelemetry} resetToken={resetToken} runActive={labMode || phase === "running"} />
        </Canvas>
      </div>

      <header className="topbar">
        <div>
          <div className="eyebrow">TINKERHUB USELESS PROJECTS / FICTIONAL LICENCE TEST</div>
          <h1>{labMode ? "R1 Handling Lab" : "അടുത്ത സ്റ്റോപ്പിൽ™"}</h1>
        </div>
        <div className={`status-pill ${telemetry.ready ? "is-live" : ""}`}>
          <i />{labMode ? stateText : phase === "intro" ? "APPLICATION DESK" : phase === "result" ? "RESULT ISSUED" : telemetry.ready ? "QUALIFICATION LIVE" : stateText}
        </div>
      </header>

      {(labMode || phase === "running") && <div className="controls-card">
        <span><kbd>W</kbd> throttle</span>
        <span><kbd>S</kbd> brake / reverse</span>
        <span><kbd>A</kbd><kbd>D</kbd> steer</span>
        <span><kbd>SPACE</kbd> full brake</span>
        <span><kbd>H</kbd> horn diplomacy</span>
        <span><kbd>R</kbd> reset</span>
      </div>}

      {labMode && !blindMode && <TelemetryPanel telemetry={telemetry} />}
      {labMode && !blindMode && <TuningPanel tuning={tuning} setTuning={setTuning} />}
      {!labMode && phase === "running" && <UselessQualificationPanel telemetry={telemetry} onMetrics={onQualificationMetrics} />}
      <HandlingAudio telemetry={telemetry} />
      {labMode && <PlaytestPanel telemetry={telemetry} setTuning={setTuning} resetBus={() => setResetToken((value) => value + 1)} onBlindModeChange={onBlindModeChange} />}
      {(labMode || phase === "running") && <TouchControls />}

      {(labMode || phase === "running") && <div className="course-legend">
        {labMode ? <>
          <span><b>0–100 m</b> acceleration + stop</span>
          <span><b>120–205 m</b> slalom</span>
          <span><b>232–282 m</b> chicane</span>
          <span><b>315–385 m</b> turning circle</span>
        </> : <>
          <span><b>സ്റ്റോപ്പ് സെൻസ്</b> placement matters</span>
          <span><b>വണ്ടി കൈയിൽ</b> control before style</span>
          <span><b>ഡിപ്പോ</b> final judgement at 900 m</span>
        </>}
      </div>}

      {!labMode && phase === "intro" && <StartOverlay candidate={candidate} setCandidate={setCandidate} onStart={beginRun} />}
      {!labMode && phase === "result" && <ResultOverlay candidate={candidate} metrics={metrics} onRetry={beginRun} />}
    </main>
  )
}
