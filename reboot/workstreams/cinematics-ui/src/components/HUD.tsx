import type { LabFrame } from "../lab/PresentationScene"

export function HUD({
  frame,
  score,
  flow,
  approval,
  objective,
}: {
  frame: LabFrame | null
  score: number
  flow: number
  approval: number
  objective?: string | null
}) {
  const speed = Math.round(frame?.speedKmh ?? 0)
  return (
    <div className="hud" aria-label="Gameplay HUD">
      <div className="hud-speed">
        <strong>{speed}</strong>
        <span>km/h</span>
      </div>
      <div className="hud-score">
        <span>NATURAL APTITUDE</span>
        <strong>{score.toLocaleString("en-IN")}</strong>
      </div>
      <div className="hud-flow">
        <span>FLOW</span>
        <strong>×{flow}</strong>
      </div>
      <div className="hud-approval" title="Examiner approval">
        <span>EXAMINER</span>
        <div><i style={{ transform: `scaleX(${approval / 100})` }} /></div>
      </div>
      {objective && <div className="hud-objective">{objective}</div>}
    </div>
  )
}
