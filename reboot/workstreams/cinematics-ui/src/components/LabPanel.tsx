import { CAMERA_STATE_NAMES } from "../cinematics/cameraStates"
import type { CinematicDirector } from "../cinematics/CinematicDirector"
import type { MicroAnimationHook, SafetyState } from "../cinematics/types"
import type { LabFrame } from "../lab/PresentationScene"

const DEFAULT_SAFETY: SafetyState = {
  speedKmh: 0,
  laneConstrained: true,
  agentsStable: true,
  unresolvedCollision: false,
  pedestrianConflict: false,
}

const HOOKS: MicroAnimationHook[] = [
  "examiner.clipboardWrite",
  "examiner.glance",
  "mirror.check",
  "conductor.bell",
  "passenger.reaction",
  "door.boarding",
  "result.certificate",
]

export function LabPanel({
  director,
  frame,
  safeMode,
  setSafeMode,
  onMenu,
}: {
  director: CinematicDirector
  frame: LabFrame | null
  safeMode: boolean
  setSafeMode: (value: boolean) => void
  onMenu: () => void
}) {
  const safety = frame?.safety ?? DEFAULT_SAFETY
  const queueShot = (shot: (typeof CAMERA_STATE_NAMES)[number]) => {
    director.request({
      id: `lab:${shot}`,
      shot,
      duration: shot === "RUN_END_WIDE" ? 3 : 1.8,
      skippable: true,
      pauseWhenSafe: !shot.startsWith("CHASE") && !shot.endsWith("REVEAL"),
      unsafeFallbackHook: "examiner.glance",
      subtitle: shot.includes("EXAMINER")
        ? { speaker: "Examiner", text: "ഹും. എഴുതിവെക്കാം.", tone: "grading" }
        : undefined,
    }, safety)
  }

  const judgement = () => director.presentJudgement({
    id: "judgement:lab",
    evidenceShot: "SIDE_STOP_MEASURE",
    subtitle: {
      speaker: "Examiner",
      text: "കൃത്യം നിർത്തി. അതാണ് പ്രശ്നം.",
      tone: "grading",
    },
    scoreDelta: -250,
    approvalDelta: -4,
  }, safety)

  return (
    <aside className="lab-panel">
      <div className="lab-heading">
        <div><small>PRESENTATION LAB</small><strong>{frame?.director.shot ?? "CHASE"}</strong></div>
        <button onClick={onMenu}>Depot menu</button>
      </div>
      <div className="lab-status">
        <span>{frame?.director.phase ?? "CHASE"}</span>
        <span>queue {frame?.director.queuedCount ?? 0}</span>
        <span>{safeMode ? "safe state" : "live driving"}</span>
      </div>
      <label className="safe-toggle">
        <input type="checkbox" checked={safeMode} onChange={(event) => setSafeMode(event.currentTarget.checked)} />
        <span>Deterministic safe state</span>
      </label>
      <div className="lab-actions">
        <button className="lab-primary" onClick={judgement}>Mistake → examiner sequence</button>
        <button onClick={() => director.skip()}>Skip beat</button>
        <button
          onPointerDown={() => director.setFastForward(true)}
          onPointerUp={() => director.setFastForward(false)}
          onPointerCancel={() => director.setFastForward(false)}
        >Hold to fast-forward</button>
      </div>
      <div className="shot-grid">
        {CAMERA_STATE_NAMES.map((shot) => <button key={shot} onClick={() => queueShot(shot)}>{shot}</button>)}
      </div>
      <div className="hook-row">
        {HOOKS.map((hook) => <button key={hook} onClick={() => director.triggerHook(hook)}>{hook}</button>)}
      </div>
    </aside>
  )
}
