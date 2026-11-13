import { memo, useEffect, useRef, useState, type FormEvent } from "react"
import { Arrow } from "./icons"
import { profile } from "../data/profile"
import { onEgg } from "../motion/eggs"
import { scene } from "../motion/scene"
import { decode } from "../motion/text"
import { TREE, starPath } from "../map/landmarks"

const PASSWORD = "mellon"
const INSCRIPTION = "SPEAK · FRIEND · AND · ENTER"
const RUNIC = "ᛋᛈᛖᚪᚳ · ᚠᚱᛁᛖᚾᛞ · ᚪᚾᛞ · ᛖᚾᛏᛖᚱ"

const SEVEN = Array.from({ length: 7 }, (_, k) => {
  const a = -Math.PI / 2 + (k - 3) * 0.3
  const x = 300 + Math.cos(a) * 150
  const y = 540 + Math.sin(a) * 150
  return `M${(x - 6).toFixed(1)} ${y.toFixed(1)} H${(x + 6).toFixed(1)} M${x.toFixed(1)} ${(y - 6).toFixed(1)} V${(y + 6).toFixed(1)}`
}).join(" ")

/** The West-gate of Moria, in silver lines. It is drawn once on each leaf of the door. */
function DoorArt({ id }: { id: string }) {
  return (
    <svg className="gate-art" viewBox="0 0 600 820" fill="none" aria-hidden="true">
      <defs>
        <path id={`gate-arch-${id}`} d="M111 348 A189 189 0 0 1 489 348" />
      </defs>
      <path d="M40 792 H560 M96 792 V360 M126 792 V360 M474 792 V360 M504 792 V360" />
      <path d="M86 360 H136 M86 348 H136 M464 360 H514 M464 348 H514" />
      <path d="M96 348 A204 204 0 0 1 504 348 M126 348 A174 174 0 0 1 474 348" />
      <path d={TREE} />
      <path d={TREE} transform="translate(600 0) scale(-1 1)" />
      <path d={starPath(300, 540, 78, 30)} />
      <circle cx="300" cy="540" r="14" />
      <path d="M276 436 L282 414 L292 428 L300 408 L308 428 L318 414 L324 436 Z" />
      <path d={SEVEN} />
      <text className="gate-text">
        <textPath href={`#gate-arch-${id}`} startOffset="50%" textAnchor="middle">
          {RUNIC}
        </textPath>
      </text>
    </svg>
  )
}

/**
 * Speak, friend, and enter. The Doors of Durin stand shut until the Elvish
 * word for friend is spoken: typed into the box, or typed anywhere on the
 * site by someone who already knows it. Behind them is a note from Aryan.
 */
function Doors() {
  const [open, setOpen] = useState(false)
  /** the word has been spoken and the doors are swinging */
  const [spoken, setSpoken] = useState(false)
  const [word, setWord] = useState("")
  const [misses, setMisses] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => onEgg((egg) => egg === "doors" && setOpen(true)), [])

  // the word, typed anywhere on the site, opens them at once
  useEffect(() => {
    let typed = ""
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return
      if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return
      typed = (typed + e.key.toLowerCase()).slice(-PASSWORD.length)
      if (typed === PASSWORD && !document.documentElement.classList.contains("is-loading")) {
        typed = ""
        setOpen(true)
        setSpoken(true)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  useEffect(() => {
    if (!open) return
    document.documentElement.classList.add("is-gate")
    scene.lenis?.stop()
    input.current?.focus({ preventScroll: true })
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close()
    window.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("keydown", onKey)
      document.documentElement.classList.remove("is-gate")
      scene.lenis?.start()
    }
  }, [open])

  // the runes over the arch turn into words as the doors answer
  useEffect(() => {
    if (!spoken) return
    ref.current?.querySelectorAll<SVGTextPathElement>(".gate-text textPath").forEach((el) => decode(el, INSCRIPTION, 900))
  }, [spoken])

  const close = () => {
    setOpen(false)
    setSpoken(false)
    setWord("")
    setMisses(0)
  }

  const speak = (e: FormEvent) => {
    e.preventDefault()
    if (word.trim().toLowerCase() === PASSWORD) setSpoken(true)
    else {
      setMisses((m) => m + 1)
      setWord("")
    }
  }

  if (!open) return null
  return (
    <div ref={ref} className={spoken ? "egg gate is-spoken" : "egg gate"} role="dialog" aria-modal="true" aria-label="The Doors of Durin">
      <div className="gate-note">
        <p className="gate-kicker">Mellon</p>
        <p className="gate-welcome">Welcome, friend.</p>
        <p className="gate-body">
          You found the hidden door, and few look for it. If you have read this far, I would be glad to hear from you.
        </p>
        <a className="btn" href={profile.links.gmail} target="_blank" rel="noopener noreferrer" tabIndex={spoken ? 0 : -1}>
          Write to me <Arrow />
        </a>
        <p className="gate-mail">{profile.email}</p>
      </div>
      <div className="gate-leaf gate-left">
        <div className="gate-face">
          <DoorArt id="l" />
        </div>
      </div>
      <div className="gate-leaf gate-right">
        <div className="gate-face">
          <DoorArt id="r" />
        </div>
      </div>
      <form key={misses} className={misses ? "gate-ask is-wrong" : "gate-ask"} onSubmit={speak}>
        <label htmlFor="gate-word">Speak, friend, and enter</label>
        <div className="gate-row">
          <input
            ref={input}
            id="gate-word"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            placeholder="the password"
          />
          <button type="submit" className="btn">
            Say it
          </button>
        </div>
        <p className="gate-hint" aria-live="polite">
          {misses === 0
            ? "The doors are shut. What is the Elvish word for friend?"
            : misses === 1
              ? "The doors do not stir. It is the Elvish word for friend."
              : "Gandalf needed a hint too: the word is “mellon”."}
        </p>
      </form>
      <button type="button" className="egg-close" onClick={close}>
        Back to the page
      </button>
    </div>
  )
}

export default memo(Doors)
