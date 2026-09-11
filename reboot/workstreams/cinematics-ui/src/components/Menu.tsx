import { useState } from "react"

type Panel = "scores" | "settings" | "controls" | "credits" | null

export function Menu({ onStart }: { onStart: () => void }) {
  const [panel, setPanel] = useState<Panel>(null)
  const [name, setName] = useState(() => localStorage.getItem("adutha-candidate-name") ?? "")

  const start = () => {
    const trimmed = name.trim()
    if (trimmed) localStorage.setItem("adutha-candidate-name", trimmed)
    onStart()
  }

  return (
    <div className="menu-layer">
      <section className="application-slip" aria-label="Driving test application">
        <div className="slip-stamp">M.V.D. / FICTIONAL</div>
        <div className="slip-kicker">DRIVING APTITUDE EXAMINATION</div>
        <h1>അടുത്ത സ്റ്റോപ്പിൽ™</h1>
        <p className="slip-copy">Candidate application · Depot No. 07</p>
        <label className="candidate-line">
          <span>Candidate</span>
          <input
            value={name}
            placeholder="Name"
            onChange={(event) => setName(event.currentTarget.value)}
            onBlur={() => name.trim() && localStorage.setItem("adutha-candidate-name", name.trim())}
          />
        </label>
        <button className="menu-primary" onClick={start}>പരീക്ഷ തുടങ്ങാം</button>
        <nav className="menu-secondary">
          <button onClick={() => setPanel("scores")}>High Scores</button>
          <button onClick={() => setPanel("settings")}>Settings</button>
          <button onClick={() => setPanel("controls")}>Controls</button>
          <button onClick={() => setPanel("credits")}>Credits</button>
        </nav>
        <footer><span>Form 8-B</span><span>One continuous qualification run</span></footer>
      </section>

      {panel && (
        <aside className="desk-note">
          <button className="note-close" onClick={() => setPanel(null)} aria-label="Close">×</button>
          {panel === "scores" && <><small>LOCAL REGISTER</small><h2>High Scores</h2><p>1. Candidate 07 — 42,860</p><p>2. Candidate 12 — 37,420</p><p>3. Candidate 03 — 31,900</p></>}
          {panel === "settings" && <><small>OFFICE NOTE</small><h2>Settings</h2><p>Audio, subtitles and camera comfort options attach here. No full-screen dashboard.</p></>}
          {panel === "controls" && <><small>INSTRUCTION SLIP</small><h2>Controls</h2><p>W / S — throttle & brake</p><p>A / D — steer</p><p>Space — hard brake</p></>}
          {panel === "credits" && <><small>FILE COPY</small><h2>Credits</h2><p>Game presentation prototype · Cinematics workstream.</p></>}
        </aside>
      )}
    </div>
  )
}
