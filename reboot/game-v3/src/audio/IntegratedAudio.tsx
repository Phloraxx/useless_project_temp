import { useCallback, useEffect, useRef, useState } from "react"
import { AudioEngine } from "../integration/AudioEngine"
import type { Telemetry } from "../sim/config"

type AudioState = "loading" | "ready" | "running" | "error"

export function IntegratedAudio({ telemetry }: { telemetry: Telemetry }) {
  const engineRef = useRef<AudioEngine | null>(null)
  const [state, setState] = useState<AudioState>("loading")
  const [enabled, setEnabled] = useState(false)
  const previousZ = useRef(0)
  const bellTriggered = useRef(false)

  const start = useCallback(async () => {
    const engine = engineRef.current
    if (!engine) return
    try {
      setState("loading")
      await engine.start()
      setEnabled(true)
      setState("running")
    } catch (error) {
      console.error("AudioEngine start failed", error)
      setEnabled(false)
      setState("error")
    }
  }, [])

  useEffect(() => {
    const engine = new AudioEngine({ assetBaseUrl: "/audio" })
    engineRef.current = engine
    const unbindShift = engine.bindDrivetrainShiftEvent(window)
    void engine.load().then(() => setState("ready")).catch((error) => {
      console.error("AudioEngine preload failed", error)
      setState("error")
    })

    const onStart = () => { void start() }
    const onHorn = () => engine.triggerHornShort()
    window.addEventListener("adutha:start-audio", onStart)
    window.addEventListener("adutha:horn-short", onHorn)
    return () => {
      unbindShift()
      window.removeEventListener("adutha:start-audio", onStart)
      window.removeEventListener("adutha:horn-short", onHorn)
      engine.destroy()
      engineRef.current = null
    }
  }, [start])

  useEffect(() => {
    const engine = engineRef.current
    if (!engine || !enabled || !telemetry.ready) return
    const wet = telemetry.surface === "wet"
    engine.update({
      ...telemetry,
      braking: telemetry.brake,
      rain: wet ? 0.88 : 0,
      wiper: wet ? 1 : 0,
      interior: 0.18,
      roughness: telemetry.surface === "rough" ? 0.82 : telemetry.surface === "laterite" ? 0.9 : 0.08,
    })

    const z = telemetry.position[2]
    if (previousZ.current > 45 && z < 5) bellTriggered.current = false
    if (!bellTriggered.current && previousZ.current < 606 && z >= 606) {
      engine.triggerConductorBell(2)
      bellTriggered.current = true
    }
    previousZ.current = z
  }, [enabled, telemetry])

  const toggle = async () => {
    const engine = engineRef.current
    if (!engine) return
    if (enabled) {
      engine.setHornHeld(false)
      await engine.suspend()
      setEnabled(false)
      setState("ready")
      return
    }
    await start()
  }

  const label = state === "loading" ? "LOADING BUS AUDIO" : state === "error" ? "AUDIO RETRY" : enabled ? "BUS AUDIO ON" : "ENABLE BUS AUDIO"
  return <button className={`audio-toggle ${enabled ? "is-on" : ""}`} onClick={() => void toggle()}>{label}</button>
}
