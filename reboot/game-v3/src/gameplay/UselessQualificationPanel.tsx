import { useEffect, useMemo, useReducer, useRef } from "react"
import type { Telemetry } from "../sim/config"

type Metrics = {
  score: number
  approval: number
  passengerFitness: number
  scheduleRecovery: number
  roadOwnership: number
  textbookContamination: number
  riskStreak: number
  message: string
  tag: string
}

type Action =
  | { type: "reset" }
  | { type: "tick"; telemetry: Telemetry }
  | { type: "stop"; distance: number }
  | { type: "skip-stop" }
  | { type: "horn"; gapMs: number; dry: boolean; speed: number }

const INITIAL: Metrics = {
  score: 0,
  approval: 50,
  passengerFitness: 0,
  scheduleRecovery: 0,
  roadOwnership: 0,
  textbookContamination: 0,
  riskStreak: 0,
  message: "ലൈസൻസ് ടെസ്റ്റ് തുടങ്ങി. സാധാരണ ഡ്രൈവിംഗ് ഇവിടെ സംശയാസ്പദമാണ്.",
  tag: "APPLICATION ACCEPTED",
}

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value))

function reducer(current: Metrics, action: Action): Metrics {
  if (action.type === "reset") return INITIAL

  if (action.type === "stop") {
    const distance = action.distance
    if (distance <= 0.55) {
      return {
        ...current,
        score: Math.max(0, current.score - 35),
        approval: clamp(current.approval - 4),
        textbookContamination: clamp(current.textbookContamination + 12),
        tag: "TEXTBOOK CONTAMINATION",
        message: "സ്റ്റോപ്പിൽ തന്നെ നിർത്തിയോ? ഇത് driving school അല്ല.",
      }
    }
    if (distance <= 5.5) {
      const cardio = Math.max(8, Math.round(distance * 10))
      return {
        ...current,
        score: current.score + 120,
        approval: clamp(current.approval + 6),
        passengerFitness: clamp(current.passengerFitness + cardio),
        scheduleRecovery: clamp(current.scheduleRecovery + 8),
        tag: "PASSENGER CARDIO +",
        message: `${distance.toFixed(1)} മീറ്റർ നടക്കാം. Public health contribution +${cardio}.`,
      }
    }
    return {
      ...current,
      score: current.score + 20,
      passengerFitness: clamp(current.passengerFitness + 35),
      approval: clamp(current.approval - 1),
      tag: "CARDIO OVERACHIEVEMENT",
      message: "നടത്തണം എന്നായിരുന്നു. തീർത്ഥാടനം ആക്കണ്ട.",
    }
  }

  if (action.type === "skip-stop") {
    return {
      ...current,
      score: current.score + 55,
      approval: clamp(current.approval + 2),
      passengerFitness: clamp(current.passengerFitness + 25),
      scheduleRecovery: clamp(current.scheduleRecovery + 10),
      tag: "EXPRESS CONVERSION",
      message: "സ്റ്റോപ്പ് പോയി. അടുത്തത് വരെ walking plan automatic ആയി activate ആയി.",
    }
  }

  if (action.type === "horn") {
    if (action.gapMs < 850) {
      return {
        ...current,
        score: Math.max(0, current.score - 4),
        textbookContamination: clamp(current.textbookContamination + 1),
        tag: "HORN SATURATION",
        message: "കേട്ടു. കേരളം മുഴുവൻ കേട്ടു.",
      }
    }
    const movingBonus = action.dry && action.speed > 30 ? 18 : 7
    return {
      ...current,
      score: current.score + movingBonus,
      roadOwnership: clamp(current.roadOwnership + (action.dry ? 6 : 2)),
      approval: clamp(current.approval + (action.dry && action.speed > 30 ? 1 : 0)),
      tag: "HORN DIPLOMACY",
      message: action.dry && action.speed > 30 ? "വാക്കുകൾ വേണ്ട. H മതിയായിരുന്നു." : "Communication channel verified.",
    }
  }

  const telemetry = action.telemetry
  const speed = Math.abs(telemetry.speedKmh)
  const dry = telemetry.surface === "asphalt"
  const wheelContacts = telemetry.wheels.filter((wheel) => wheel.contact).length
  const lateral = Math.abs(telemetry.lateralAccel)
  const roll = Math.abs(telemetry.rollDeg)
  let score = current.score
  let approval = current.approval
  let scheduleRecovery = current.scheduleRecovery
  let roadOwnership = current.roadOwnership
  let riskStreak = current.riskStreak
  let message = current.message
  let tag = current.tag

  if (dry && speed >= 45) {
    score += speed >= 60 ? 9 : speed >= 52 ? 5 : 3
    scheduleRecovery = clamp(scheduleRecovery + (speed >= 60 ? 1.8 : 0.8))
    riskStreak = clamp(riskStreak + 1, 0, 20)
    tag = speed >= 60 ? "SUPER FAST DOCTRINE" : "SCHEDULE RECOVERY"
    message = speed >= 60
      ? "ഡ്രൈ റോഡ്. ടൈംടേബിളിന് ഇപ്പോ പ്രതീക്ഷയുണ്ട്."
      : "ഇങ്ങനെ പോയാൽ ഇന്നുതന്നെ എത്താൻ സാധ്യതയുണ്ട്."
  }

  if (dry && speed >= 38 && lateral >= 2.5 && lateral <= 5.5 && wheelContacts === 4) {
    score += 7
    roadOwnership = clamp(roadOwnership + 2.2)
    approval = clamp(approval + 1)
    tag = "CURVE CONFIDENCE"
    message = "വളവ് കണ്ടു. പേടി കണ്ടില്ല. Examiner noted."
  }

  if (!dry && (speed > 42 || lateral > 3.2)) {
    score -= 8
    approval = clamp(approval - 2)
    riskStreak = 0
    tag = "WEATHER HAS OPINIONS"
    message = "റോഡ് നനഞ്ഞതാണ്. ഇവിടെ heroism വേണ്ട."
  }

  if (roll > 11 || wheelContacts <= 2) {
    score -= 18
    approval = clamp(approval - 4)
    riskStreak = 0
    tag = "PHYSICS OBJECTED"
    message = "Style വേറെ. മറിഞ്ഞുപോകുന്നത് വേറെ."
  }

  return { ...current, score: Math.max(0, score), approval, scheduleRecovery, roadOwnership, riskStreak, message, tag }
}

export function UselessQualificationPanel({ telemetry }: { telemetry: Telemetry }) {
  const [metrics, dispatch] = useReducer(reducer, INITIAL)
  const telemetryRef = useRef(telemetry)
  const lastTickRef = useRef(0)
  const lastHornRef = useRef(0)
  const stopScoredRef = useRef(false)
  const stopSkippedRef = useRef(false)
  const furthestZRef = useRef(0)

  useEffect(() => { telemetryRef.current = telemetry }, [telemetry])

  useEffect(() => {
    if (!telemetry.ready) return
    furthestZRef.current = Math.max(furthestZRef.current, telemetry.position[2])
    if (furthestZRef.current > 45 && telemetry.position[2] < 5 && Math.abs(telemetry.speedKmh) < 3) {
      furthestZRef.current = 0
      stopScoredRef.current = false
      stopSkippedRef.current = false
      lastTickRef.current = performance.now()
      dispatch({ type: "reset" })
      return
    }
    const now = performance.now()
    if (now - lastTickRef.current >= 1100) {
      lastTickRef.current = now
      dispatch({ type: "tick", telemetry })
    }

    if (!stopScoredRef.current) {
      const speed = Math.abs(telemetry.speedKmh)
      const offset = telemetry.position[2] - 102
      if (Math.abs(offset) <= 8 && speed <= 2.5) {
        stopScoredRef.current = true
        dispatch({ type: "stop", distance: Math.abs(offset) })
      } else if (!stopSkippedRef.current && telemetry.position[2] > 111 && telemetry.speedKmh > 24) {
        stopSkippedRef.current = true
        dispatch({ type: "skip-stop" })
      }
    }
  }, [telemetry])

  useEffect(() => {
    const onHorn = (event: KeyboardEvent) => {
      if (event.code !== "KeyH" || event.repeat) return
      const now = performance.now()
      const gapMs = now - lastHornRef.current
      lastHornRef.current = now
      const currentTelemetry = telemetryRef.current

      try {
        const horn = new Audio("/audio/horn-short.ogg")
        horn.volume = 0.58
        void horn.play()
      } catch { /* browser may block audio in unusual embedding contexts */ }

      dispatch({
        type: "horn",
        gapMs,
        dry: currentTelemetry.surface === "asphalt",
        speed: Math.abs(currentTelemetry.speedKmh),
      })
    }
    window.addEventListener("keydown", onHorn)
    return () => window.removeEventListener("keydown", onHorn)
  }, [])

  const classification = useMemo(() => {
    if (metrics.approval >= 78 && metrics.score >= 350) return "ENDORSEMENT: NATURAL KSRTC INSTINCT"
    if (metrics.approval >= 62) return "PROVISIONAL: PROMISING ROAD OWNERSHIP"
    if (metrics.textbookContamination >= 35) return "AT RISK: TOO MUCH DRIVING SCHOOL"
    return "ASSESSMENT IN PROGRESS"
  }, [metrics])

  return (
    <section className="qualification-panel">
      <div className="qualification-heading">
        <div>
          <div className="panel-kicker">FICTIONAL KSRTC QUALIFICATION BOARD</div>
          <strong>{classification}</strong>
        </div>
        <b>{metrics.score}</b>
      </div>
      <div className="qualification-ruling">
        <span>{metrics.tag}</span>
        <p>{metrics.message}</p>
      </div>
      <div className="qualification-grid">
        <QualificationMetric label="Examiner approval" value={metrics.approval} suffix="%" />
        <QualificationMetric label="Passenger fitness" value={metrics.passengerFitness} suffix="%" />
        <QualificationMetric label="Schedule recovery" value={metrics.scheduleRecovery} suffix="%" />
        <QualificationMetric label="Road ownership" value={metrics.roadOwnership} suffix="%" />
        <QualificationMetric label="Textbook contamination" value={metrics.textbookContamination} suffix="%" inverse />
        <QualificationMetric label="Managed recklessness" value={metrics.riskStreak * 5} suffix="%" />
      </div>
      <div className="qualification-rule">
        <b>DRY ROAD CLAUSE</b>
        <span>Reckless-looking + controlled = bonus. Wet road + same nonsense = examiner concern.</span>
      </div>
      <small className="parody-disclaimer">Parody game logic. Not real driving advice. Actual collisions and pedestrian impacts are failures.</small>
    </section>
  )
}

function QualificationMetric({ label, value, suffix, inverse = false }: { label: string; value: number; suffix: string; inverse?: boolean }) {
  const shown = clamp(Math.round(value))
  return (
    <div className={`qualification-metric ${inverse ? "is-inverse" : ""}`}>
      <span>{label}</span>
      <strong>{shown}{suffix}</strong>
      <i><b style={{ transform: `scaleX(${shown / 100})` }} /></i>
    </div>
  )
}
