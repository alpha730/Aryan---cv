import { useEffect, useLayoutEffect, useRef } from "react"
import gsap from "gsap"
import { decode } from "../motion/text"

interface PreloaderProps {
  /** 0–1: how much of the site has been painted and sampled */
  progress: number
  ready: boolean
  /** called as the doors begin to swing */
  onOpen: () => void
  /** called once the doors are gone */
  onDone: () => void
}

const INSCRIPTION = "SPEAK · FRIEND · AND · ENTER"
const RUNIC = "ᛋᛈᛖᚨᚲ · ᚠᚱᛁᛖᚾᛞ · ᚨᚾᛞ · ᛖᚾᛏᛖᚱ"

function starPath(cx: number, cy: number, R: number, r: number) {
  let d = ""
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 - Math.PI / 2
    const rad = i % 2 === 0 ? R : r
    d += (i === 0 ? "M" : "L") + (cx + Math.cos(a) * rad).toFixed(1) + " " + (cy + Math.sin(a) * rad).toFixed(1)
  }
  return d + "Z"
}

const mirror = (d: string) => d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, x, y) => `${600 - Number(x)} ${y}`)

const TREE = [
  "M150 792 C154 660 146 540 168 444 C180 392 210 350 252 322",
  "M166 470 C196 440 230 424 262 424",
  "M160 560 C192 526 226 512 258 514",
  "M172 404 C204 372 236 360 268 362",
  "M156 650 C186 618 214 606 244 610",
]

const SEVEN = Array.from({ length: 7 }, (_, k) => {
  const a = -Math.PI / 2 + (k - 3) * 0.3
  const x = 300 + Math.cos(a) * 150
  const y = 540 + Math.sin(a) * 150
  return `M${(x - 6).toFixed(1)} ${y.toFixed(1)} H${(x + 6).toFixed(1)} M${x.toFixed(1)} ${(y - 6).toFixed(1)} V${(y + 6).toFixed(1)}`
}).join(" ")

/** The West-gate of Moria, drawn in silver lines. */
function DoorArt({ id }: { id: string }) {
  return (
    <svg className="door-art" viewBox="0 0 600 820" fill="none" aria-hidden="true">
      <defs>
        <path id={`arch-${id}`} d="M111 348 A189 189 0 0 1 489 348" />
      </defs>
      <path className="door-line" data-step="0" pathLength={1} d="M40 792 H560" />
      <path className="door-line" data-step="0" pathLength={1} d="M96 792 V360 M126 792 V360 M474 792 V360 M504 792 V360" />
      <path className="door-line" data-step="0" pathLength={1} d="M86 360 H136 M86 348 H136 M464 360 H514 M464 348 H514" />
      <path className="door-line" data-step="1" pathLength={1} d="M96 348 A204 204 0 0 1 504 348" />
      <path className="door-line" data-step="1" pathLength={1} d="M126 348 A174 174 0 0 1 474 348" />
      {TREE.map((d, i) => (
        <path key={"l" + i} className="door-line" data-step="2" pathLength={1} d={d} />
      ))}
      {TREE.map((d, i) => (
        <path key={"r" + i} className="door-line" data-step="2" pathLength={1} d={mirror(d)} />
      ))}
      <path className="door-line" data-step="3" pathLength={1} d={starPath(300, 540, 78, 30)} />
      <circle className="door-line" data-step="3" pathLength={1} cx="300" cy="540" r="14" />
      <path className="door-line" data-step="3" pathLength={1} d="M276 436 L282 414 L292 428 L300 408 L308 428 L318 414 L324 436 Z" />
      <path className="door-line" data-step="3" pathLength={1} d={SEVEN} />
      <text className="door-text">
        <textPath href={`#arch-${id}`} startOffset="50%" textAnchor="middle">
          {RUNIC}
        </textPath>
      </text>
    </svg>
  )
}

/**
 * The way in: the Doors of Durin draw themselves as the site loads, the
 * inscription turns from runes into words, and the doors swing open onto
 * the Ring.
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
      gsap.set(".door-line", { strokeDasharray: 1, strokeDashoffset: 1 })
      const tl = gsap.timeline({ paused: true })
      for (let s = 0; s < 4; s++) tl.to(`.door-line[data-step="${s}"]`, { strokeDashoffset: 0, duration: 1, ease: "none" }, s * 0.75)
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
        .to(".door-art", { filter: "drop-shadow(0 0 4px rgba(190,215,255,0.95)) drop-shadow(0 0 22px rgba(110,160,255,0.75))", duration: 0.7 })
        .add(() => {
          ref.current?.querySelectorAll<SVGTextPathElement>(".door-text textPath").forEach((el) => decode(el, INSCRIPTION, 900))
        }, "<")
        .to(".preloader-meta", { opacity: 0, y: 14, duration: 0.5 }, "+=0.55")
        .to(".door-seam", { opacity: 1, scaleY: 1, duration: 0.45, ease: "power2.out" }, "<")
        .add(onOpen)
        .to(".door-left", { rotateY: 84, duration: 1.9, ease: "power3.inOut" }, "+=0.05")
        .to(".door-right", { rotateY: -84, duration: 1.9, ease: "power3.inOut" }, "<")
        .to(".door", { filter: "brightness(0.35)", duration: 1.9, ease: "power2.in" }, "<")
        .to(".door-seam", { opacity: 0, scaleX: 40, duration: 1.1, ease: "power2.out" }, "<+0.1")
        .to(ref.current, { opacity: 0, duration: 0.45 }, "-=0.45")
        .add(onDone)
    }, ref)
    return () => ctx.revert()
  }, [ready, onOpen, onDone])

  return (
    <div ref={ref} className="preloader" role="status" aria-label="Loading">
      <div className="door door-left">
        <div className="door-face">
          <DoorArt id="l" />
        </div>
      </div>
      <div className="door door-right">
        <div className="door-face">
          <DoorArt id="r" />
        </div>
      </div>
      <div className="door-seam" aria-hidden="true" />
      <div className="preloader-meta" aria-hidden="true">
        <p className="preloader-count">00</p>
        <p className="preloader-caption">Opening the West-gate</p>
      </div>
    </div>
  )
}
