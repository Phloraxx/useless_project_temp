import { useEffect, useRef, useState } from "react"
import type { Telemetry } from "../sim/config"

const ENGINE_SOURCES = [
  "/audio/engine-loop-0.wav",
  "/audio/engine-loop-2.wav",
  "/audio/engine-loop-5.wav",
]

type NoiseRig = {
  context: AudioContext
  roadSource: AudioBufferSourceNode
  roadGain: GainNode
  roadFilter: BiquadFilterNode
  brakeSource: AudioBufferSourceNode
  brakeGain: GainNode
  brakeFilter: BiquadFilterNode
}

function makeNoiseBuffer(context: AudioContext) {
  const length = context.sampleRate * 2
  const buffer = context.createBuffer(1, length, context.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1
  return buffer
}

function createNoiseRig(): NoiseRig {
  const context = new AudioContext()
  const buffer = makeNoiseBuffer(context)

  const roadSource = context.createBufferSource()
  roadSource.buffer = buffer
  roadSource.loop = true
  const roadFilter = context.createBiquadFilter()
  roadFilter.type = "bandpass"
  roadFilter.frequency.value = 720
  roadFilter.Q.value = 0.5
  const roadGain = context.createGain()
  roadGain.gain.value = 0
  roadSource.connect(roadFilter).connect(roadGain).connect(context.destination)

  const brakeSource = context.createBufferSource()
  brakeSource.buffer = buffer
  brakeSource.loop = true
  const brakeFilter = context.createBiquadFilter()
  brakeFilter.type = "bandpass"
  brakeFilter.frequency.value = 1450
  brakeFilter.Q.value = 1.1
  const brakeGain = context.createGain()
  brakeGain.gain.value = 0
  brakeSource.connect(brakeFilter).connect(brakeGain).connect(context.destination)

  roadSource.start()
  brakeSource.start()
  return { context, roadSource, roadGain, roadFilter, brakeSource, brakeGain, brakeFilter }
}

export function HandlingAudio({ telemetry }: { telemetry: Telemetry }) {
  const [enabled, setEnabled] = useState(false)
  const engineRef = useRef<HTMLAudioElement[]>([])
  const noiseRef = useRef<NoiseRig | null>(null)

  useEffect(() => {
    const nodes = ENGINE_SOURCES.map((src) => {
      const audio = new Audio(src)
      audio.loop = true
      audio.preload = "auto"
      audio.volume = 0
      return audio
    })
    engineRef.current = nodes
    return () => {
      for (const audio of nodes) { audio.pause(); audio.src = "" }
      engineRef.current = []
      const rig = noiseRef.current
      if (rig) {
        try { rig.roadSource.stop(); rig.brakeSource.stop() } catch { /* already stopped */ }
        void rig.context.close()
      }
      noiseRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!enabled) return
    const speed = Math.min(1, Math.abs(telemetry.speedKmh) / 62)
    const load = Math.max(telemetry.throttle, speed * 0.35)
    const engineGains = [
      Math.max(0.045, 0.32 * (1 - speed)),
      Math.min(0.34, (0.08 + 0.34 * load) * (1 - Math.abs(speed - 0.45))),
      Math.max(0, (speed - 0.30) / 0.70) * (0.15 + 0.27 * load),
    ]
    engineRef.current.forEach((audio, index) => {
      audio.volume = Math.min(0.52, engineGains[index] ?? 0)
      audio.playbackRate = 0.82 + speed * 0.24 + telemetry.throttle * 0.05
    })

    const rig = noiseRef.current
    if (!rig) return
    const now = rig.context.currentTime
    const surfaceGain = telemetry.surface === "laterite" ? 1.75 : telemetry.surface === "rough" ? 1.55 : telemetry.surface === "wet" ? 1.25 : 1
    const surfaceHz = telemetry.surface === "laterite" ? 430 : telemetry.surface === "rough" ? 590 : telemetry.surface === "wet" ? 1100 : 760
    const roadLevel = Math.max(0, speed - 0.06) * 0.045 * surfaceGain
    rig.roadGain.gain.setTargetAtTime(roadLevel, now, 0.08)
    rig.roadFilter.frequency.setTargetAtTime(surfaceHz + speed * 360, now, 0.10)

    const brakeLevel = Math.max(0, telemetry.brake - 0.38) * speed * 0.055
    rig.brakeGain.gain.setTargetAtTime(brakeLevel, now, 0.04)
    rig.brakeFilter.frequency.setTargetAtTime(1200 + speed * 900, now, 0.08)
  }, [enabled, telemetry])

  const toggle = async () => {
    if (enabled) {
      engineRef.current.forEach((audio) => { audio.pause(); audio.currentTime = 0 })
      const rig = noiseRef.current
      if (rig) {
        const now = rig.context.currentTime
        rig.roadGain.gain.setTargetAtTime(0, now, 0.03)
        rig.brakeGain.gain.setTargetAtTime(0, now, 0.03)
        await rig.context.suspend()
      }
      setEnabled(false)
      return
    }
    if (!noiseRef.current) noiseRef.current = createNoiseRig()
    await noiseRef.current.context.resume()
    await Promise.allSettled(engineRef.current.map((audio) => audio.play()))
    setEnabled(true)
  }

  return (
    <button className={`audio-toggle ${enabled ? "is-on" : ""}`} onClick={toggle}>
      {enabled ? "LAB AUDIO ON" : "ENABLE LAB AUDIO"}
    </button>
  )
}
