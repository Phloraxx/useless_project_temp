import { useEffect, useRef, useState } from "react"
import type { Dispatch, SetStateAction } from "react"
import { BUILTIN_PRESETS, type BusTuning, type Telemetry } from "../sim/config"

type PresetName = keyof typeof BUILTIN_PRESETS
type Metrics = {
  maxSpeed: number
  distance: number
  maxBodyRoll: number
  maxBodyPitch: number
  maxLongAccel: number
  maxLatAccel: number
  minContacts: number
  lateriteSeconds: number
  wetSeconds: number
  roughSeconds: number
  steeringCorrections: number
  avgFps: number
  minFps: number
}
type RunResult = Metrics & {
  preset: PresetName
  candidate: string
  tags: string[]
  notes: string
  durationSec: number
}
const BASE_ORDER: PresetName[] = ["Heavy", "Balanced", "Arcade"]
const RUN_SECONDS = 60
const TAGS = [
  "too sluggish", "too twitchy", "too floaty", "too stiff",
  "steering good", "brakes good", "camera good", "fun",
]
const emptyMetrics = (): Metrics => ({
  maxSpeed: 0, distance: 0, maxBodyRoll: 0, maxBodyPitch: 0,
  maxLongAccel: 0, maxLatAccel: 0, minContacts: 4,
  lateriteSeconds: 0, wetSeconds: 0, roughSeconds: 0,
  steeringCorrections: 0, avgFps: 0, minFps: 999,
})

export function PlaytestPanel({ telemetry, setTuning, resetBus, onBlindModeChange }: {
  telemetry: Telemetry
  setTuning: Dispatch<SetStateAction<BusTuning>>
  resetBus: () => void
  onBlindModeChange?: (blind: boolean) => void
}) {
  const [phase, setPhase] = useState<"idle" | "running" | "feedback" | "done">("idle")
  const [index, setIndex] = useState(0)
  const [order, setOrder] = useState<PresetName[]>(BASE_ORDER)
  const [secondsLeft, setSecondsLeft] = useState(RUN_SECONDS)
  const [tags, setTags] = useState<string[]>([])
  const [notes, setNotes] = useState("")
  const [results, setResults] = useState<RunResult[]>([])
  const metricsRef = useRef<Metrics>(emptyMetrics())
  const runStartedRef = useRef(0)
  const lastSampleRef = useRef<{ x: number; z: number; steer: number; time: number } | null>(null)
  const currentPreset = order[index]
  const candidate = String.fromCharCode(65 + index)

  const beginRun = (nextIndex = index, activeOrder = order) => {
    const preset = activeOrder[nextIndex]
    setIndex(nextIndex)
    setTuning({ ...BUILTIN_PRESETS[preset] })
    metricsRef.current = emptyMetrics()
    lastSampleRef.current = null
    setTags([])
    setNotes("")
    setSecondsLeft(RUN_SECONDS)
    resetBus()
    window.setTimeout(() => setPhase("running"), 120)
  }

  const startSession = () => {
    const shuffled = [...BASE_ORDER]
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    setOrder(shuffled)
    setResults([])
    beginRun(0, shuffled)
  }

  useEffect(() => {
    onBlindModeChange?.(phase === "running" || phase === "feedback")
  }, [phase, onBlindModeChange])

  useEffect(() => {
    if (phase !== "running") return
    const started = performance.now()
    runStartedRef.current = started
    const timer = window.setInterval(() => {
      const elapsed = (performance.now() - started) / 1000
      const remaining = Math.max(0, RUN_SECONDS - elapsed)
      setSecondsLeft(remaining)
      if (remaining <= 0) {
        window.clearInterval(timer)
        setPhase("feedback")
      }
    }, 100)
    return () => window.clearInterval(timer)
  }, [phase, index])
  useEffect(() => {
    if (phase !== "running") return
    let frame = 0
    let frames = 0
    let totalFrames = 0
    const started = performance.now()
    let bucketStarted = started
    const tick = (now: number) => {
      frames += 1
      totalFrames += 1
      const bucketMs = now - bucketStarted
      if (bucketMs >= 1000) {
        const fps = frames * 1000 / bucketMs
        metricsRef.current.minFps = Math.min(metricsRef.current.minFps, fps)
        frames = 0
        bucketStarted = now
      }
      metricsRef.current.avgFps = totalFrames * 1000 / Math.max(1, now - started)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [phase, index])

  useEffect(() => {
    if (phase !== "running" || !telemetry.ready) return
    const now = performance.now()
    const last = lastSampleRef.current
    const metrics = metricsRef.current
    metrics.maxSpeed = Math.max(metrics.maxSpeed, Math.abs(telemetry.speedKmh))
    metrics.maxBodyRoll = Math.max(metrics.maxBodyRoll, Math.abs(telemetry.bodyRollDeg))
    metrics.maxBodyPitch = Math.max(metrics.maxBodyPitch, Math.abs(telemetry.bodyPitchDeg))
    metrics.maxLongAccel = Math.max(metrics.maxLongAccel, Math.abs(telemetry.longitudinalAccel))
    metrics.maxLatAccel = Math.max(metrics.maxLatAccel, Math.abs(telemetry.lateralAccel))
    metrics.minContacts = Math.min(metrics.minContacts, telemetry.wheels.filter((wheel) => wheel.contact).length)
    if (last) {
      metrics.distance += Math.hypot(telemetry.position[0] - last.x, telemetry.position[2] - last.z)
      const dt = Math.min(0.5, Math.max(0, (now - last.time) / 1000))
      if (telemetry.surface === "laterite") metrics.lateriteSeconds += dt
      if (telemetry.surface === "wet") metrics.wetSeconds += dt
      if (telemetry.surface === "rough") metrics.roughSeconds += dt
      if (Math.abs(last.steer) > 2 && Math.abs(telemetry.steeringDeg) > 2 && Math.sign(last.steer) !== Math.sign(telemetry.steeringDeg)) {
        metrics.steeringCorrections += 1
      }
    }
    lastSampleRef.current = { x: telemetry.position[0], z: telemetry.position[2], steer: telemetry.steeringDeg, time: now }
  }, [phase, telemetry])
  const submitFeedback = () => {
    const result: RunResult = {
      preset: currentPreset,
      candidate,
      ...metricsRef.current,
      tags,
      notes: notes.trim(),
      durationSec: Math.min(RUN_SECONDS, Math.max(0, (performance.now() - runStartedRef.current) / 1000)),
    }
    const nextResults = [...results, result]
    setResults(nextResults)
    localStorage.setItem("adutha-r1-playtest-latest", JSON.stringify({ createdAt: new Date().toISOString(), runs: nextResults }))
    if (index < order.length - 1) beginRun(index + 1)
    else setPhase("done")
  }

  const exportSession = () => {
    const payload = JSON.stringify({
      createdAt: new Date().toISOString(),
      userAgent: navigator.userAgent,
      viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
      coarsePointer: matchMedia("(pointer: coarse)").matches,
      runs: results,
    }, null, 2)
    const blob = new Blob([payload], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `adutha-r1-playtest-${new Date().toISOString().replaceAll(":", "-")}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const toggleTag = (tag: string) => {
    setTags((current) => current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag])
  }
  return (
    <section className={`playtest-panel ${phase}`}>
      <div className="panel-kicker">R1 HUMAN TEST</div>
      {phase === "idle" && <>
        <strong>Blind 3-way handling comparison</strong>
        <p>60 seconds each. Preset order is shuffled and hidden until the end. Drive naturally.</p>
        <button className="playtest-primary" onClick={startSession}>Start blind comparison</button>
      </>}

      {phase === "running" && <>
        <div className="playtest-running-row"><strong>Candidate {candidate}</strong><b>{Math.ceil(secondsLeft)}s</b></div>
        <p>Use the whole road: brake hard once, take a corner, touch the shoulder and hit the rough section.</p>
        <div className="playtest-progress"><i style={{ transform: `scaleX(${1 - secondsLeft / RUN_SECONDS})` }} /></div>
        <button onClick={() => setPhase("feedback")}>End run early</button>
      </>}

      {phase === "feedback" && <>
        <strong>Candidate {candidate}: how did it feel?</strong>
        <div className="feel-tags">
          {TAGS.map((tag) => <button key={tag} className={tags.includes(tag) ? "selected" : ""} onClick={() => toggleTag(tag)}>{tag}</button>)}
        </div>
        <textarea value={notes} onChange={(event) => setNotes(event.currentTarget.value)} placeholder="Anything specific about steering, braking, camera or weight?" />
        <button className="playtest-primary" onClick={submitFeedback}>{index < order.length - 1 ? `Save + test Candidate ${String.fromCharCode(66 + index)}` : "Save final run"}</button>
      </>}
      {phase === "done" && <>
        <strong>Comparison complete</strong>
        <div className="playtest-summary">
          {results.map((run) => (
            <div key={run.candidate}>
              <b>Candidate {run.candidate} = {run.preset}</b>
              <span>{run.maxSpeed.toFixed(0)} km/h · {run.distance.toFixed(0)} m · {run.steeringCorrections} corrections · {run.avgFps.toFixed(0)} fps</span>
              <small>{run.tags.length ? run.tags.join(", ") : "no feel tags"}</small>
            </div>
          ))}
        </div>
        <div className="playtest-actions">
          <button className="playtest-primary" onClick={exportSession}>Export JSON</button>
          <button onClick={() => { setResults([]); setIndex(0); setPhase("idle") }}>Run again</button>
        </div>
      </>}
    </section>
  )
}
