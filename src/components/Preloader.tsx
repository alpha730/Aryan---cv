import { useEffect, useLayoutEffect, useRef } from "react"
import gsap from "gsap"
import { decode } from "../motion/text"
import { profile } from "../data/profile"

interface PreloaderProps {
  /** 0–1: how much of the site is ready */
  progress: number
  ready: boolean
  /** called as the cover begins to turn */
  onOpen: () => void
  /** called once the cover is gone */
  onDone: () => void
}

const INSCRIPTION = "THE · ROAD · GOES · EVER · ON"
const RUNIC = "ᚦᛖ · ᚱᚩᚪᛞ · ᚷᚩᛖᛋ · ᛖᚢᛖᚱ · ᚩᚾ"

function starPath(cx: number, cy: number, R: number, r: number) {
  let d = ""
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 - Math.PI / 2
    const rad = i % 2 === 0 ? R : r
    d += (i === 0 ? "M" : "L") + (cx + Math.cos(a) * rad).toFixed(1) + " " + (cy + Math.sin(a) * rad).toFixed(1)
  }
  return d + "Z"
}

/** a little flourish for each corner of the cover */
const CORNERS = [
  "M44 104 A60 60 0 0 0 104 44 M44 84 A40 40 0 0 0 84 44",
  "M556 104 A60 60 0 0 1 496 44 M556 84 A40 40 0 0 1 516 44",
  "M44 696 A60 60 0 0 1 104 756 M44 716 A40 40 0 0 1 84 756",
  "M556 696 A60 60 0 0 0 496 756 M556 716 A40 40 0 0 0 516 756",
]

/**
 * The way in: the cover of the Red Book. Its gold tooling draws itself as the
 * site loads, the runes around the star turn into words, and the cover swings
 * open onto the map.
 */
export default function Preloader({ progress, ready, onOpen, onDone }: PreloaderProps) {
  const ref = useRef<HTMLDivElement>(null)
  const draw = useRef<gsap.core.Timeline | null>(null)
  const shown = useRef({ p: 0 })
  const born = useRef(performance.now())

  const paint = () => {
    draw.current?.progress(shown.current.p)
    const count = ref.current?.querySelector(".preloader-count")
    if (count) count.textContent = String(Math.round(shown.current.p * 100)).padStart(2, "0")
  }

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(".book-line", { strokeDasharray: 1, strokeDashoffset: 1 })
      const tl = gsap.timeline({ paused: true })
      for (let s = 0; s < 4; s++) tl.to(`.book-line[data-step="${s}"]`, { strokeDashoffset: 0, duration: 1, ease: "none" }, s * 0.75)
      draw.current = tl
    }, ref)
    return () => ctx.revert()
  }, [])

  useEffect(() => {
    // the drawing follows the real loading progress, eased
    const tween = gsap.to(shown.current, { p: progress * 0.94, duration: 0.6, ease: "power2.out", overwrite: true, onUpdate: paint })
    return () => {
      tween.kill()
    }
  }, [progress])

  useEffect(() => {
    if (!ready) return
    const linger = Math.max(0, 1.5 - (performance.now() - born.current) / 1000)
    const ctx = gsap.context(() => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.timeline({ delay: linger }).add(onOpen).to(ref.current, { opacity: 0, duration: 0.5 }).add(onDone)
        return
      }
      gsap
        .timeline({ delay: linger })
        .to(shown.current, { p: 1, duration: 0.5, ease: "power2.inOut", onUpdate: paint })
        .to(".book-art", { filter: "drop-shadow(0 0 3px rgba(255,226,150,0.9)) drop-shadow(0 0 18px rgba(240,180,80,0.55))", duration: 0.7 })
        .add(() => {
          const el = ref.current?.querySelector<SVGTextPathElement>(".book-runes textPath")
          if (el) decode(el, INSCRIPTION, 900)
        }, "<")
        .to(".preloader-meta", { opacity: 0, y: 14, duration: 0.5 }, "+=0.6")
        .add(onOpen)
        .to(".book", { rotateY: -104, duration: 2, ease: "power3.inOut" }, "+=0.05")
        .to(".book", { filter: "brightness(0.4)", duration: 2, ease: "power2.in" }, "<")
        .to(ref.current, { opacity: 0, duration: 0.5 }, "-=0.55")
        .add(onDone)
    }, ref)
    return () => ctx.revert()
  }, [ready, onOpen, onDone])

  return (
    <div ref={ref} className="preloader" role="status" aria-label="Loading">
      <div className="book">
        <svg className="book-art" viewBox="0 0 600 800" fill="none" aria-hidden="true">
          <defs>
            <path id="book-arc" d="M157 420 A143 143 0 0 1 443 420" />
          </defs>
          <rect className="book-line" data-step="0" pathLength={1} x="30" y="30" width="540" height="740" rx="6" />
          <rect className="book-line" data-step="0" pathLength={1} x="44" y="44" width="512" height="712" rx="3" />
          {CORNERS.map((d, i) => (
            <path key={i} className="book-line" data-step="1" pathLength={1} d={d} />
          ))}
          <path className="book-line" data-step="1" pathLength={1} d="M150 206 H450" />
          <path className="book-line" data-step="1" pathLength={1} d="M150 640 H450" />
          <circle className="book-line" data-step="2" pathLength={1} cx="300" cy="420" r="162" />
          <circle className="book-line" data-step="2" pathLength={1} cx="300" cy="420" r="130" />
          <path className="book-line" data-step="3" pathLength={1} d={starPath(300, 420, 112, 42)} />
          <path className="book-line" data-step="3" pathLength={1} d={starPath(300, 420, 60, 24)} transform="rotate(22.5 300 420)" />
          <circle className="book-line" data-step="3" pathLength={1} cx="300" cy="420" r="16" />
          <text className="book-title" x="300" y="132" textAnchor="middle">
            The Red Book
          </text>
          <text className="book-sub" x="300" y="176" textAnchor="middle">
            of {profile.name}
          </text>
          <text className="book-runes">
            <textPath href="#book-arc" startOffset="50%" textAnchor="middle">
              {RUNIC}
            </textPath>
          </text>
          <text className="book-sub book-foot" x="300" y="690" textAnchor="middle">
            a map of the road so far
          </text>
        </svg>
        <div className="preloader-meta" aria-hidden="true">
          <p className="preloader-count">00</p>
          <p className="preloader-caption">Opening the Red Book</p>
        </div>
      </div>
    </div>
  )
}
