import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import type Lenis from "lenis"
import type { Keyframe, MorphEngine, Rect } from "../engine/MorphEngine"
import { decode } from "./text"
import { KEYFRAMES, REALMS, ROMAN, TRANSITIONS, frameRect } from "./world"

gsap.registerPlugin(ScrollTrigger)

type RGB = [number, number, number]

const mixRGB = (a: RGB, b: RGB, t: number): RGB => [
  Math.round(a[0] + (b[0] - a[0]) * t),
  Math.round(a[1] + (b[1] - a[1]) * t),
  Math.round(a[2] + (b[2] - a[2]) * t),
]

const smooth = (t: number) => t * t * (3 - 2 * t)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const lerpRect = (a: Rect, b: Rect, t: number): Rect => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
  w: lerp(a.w, b.w, t),
  h: lerp(a.h, b.h, t),
})

/**
 * Turns scroll into the journey: each ScrollTrigger registered with
 * morphTrigger() reports how far its transition has run, the sum is the
 * stage, and the stage drives the particles, the realm colours and the HUD.
 */
class Scene {
  engine: MorphEngine | null = null
  lenis: Lenis | null = null
  /** width / height of each emblem picture */
  aspects: number[] = []
  /** plain pictures standing in for the particles when WebGL is unavailable */
  images: HTMLImageElement[] = []
  frames: Keyframe[] = []
  progress = new Float32Array(TRANSITIONS)
  stage = 0
  /** colour of the drifting motes in the current realm */
  mote: RGB = [...REALMS[0].mote]

  private reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
  private realm = -1
  private vars = ""
  private layoutW = 0
  private layoutH = 0
  private roadH = 0
  private road: HTMLElement | null = null
  private paintedStage = -1

  setTransition(i: number, p: number) {
    this.progress[i] = p
  }

  /** Recomputes where every emblem sits. */
  relayout(force = false) {
    const vw = window.innerWidth
    const vh = window.innerHeight
    // phones resize the viewport as the address bar slides; ignore small height changes
    if (!force && this.frames.length && vw === this.layoutW && Math.abs(vh - this.layoutH) < 160) return
    this.layoutW = vw
    this.layoutH = vh
    const copy = document.querySelector(".hero-copy")
    const heroCopyTop = copy ? copy.getBoundingClientRect().top + window.scrollY : vh * 0.62
    // where each title card's words begin, measured from the top of its screen
    const titleTops = Array.from(document.querySelectorAll<HTMLElement>(".tc-copy"), (c) => c.offsetTop)
    let title = 0
    this.frames = KEYFRAMES.map((k) => {
      const copyTop = k.mode === "hero" ? heroCopyTop : k.mode === "title" ? (titleTops[title++] ?? vh * 0.6) : vh
      const { rect, dim } = frameRect(k.mode, this.aspects[k.emblem] || 1, vw, vh, copyTop)
      return { emblem: k.emblem, rect, dim }
    })
    this.engine?.setFrames(this.frames)
    // the hint and the backdrop word sit with the ring
    const ring = this.frames[0].rect
    const root = document.documentElement.style
    root.setProperty("--ring-top", ring.y + "px")
    root.setProperty("--ring-bottom", ring.y + ring.h + "px")
    root.setProperty("--ring-mid", ring.y + ring.h / 2 + "px")
    this.road = document.querySelector<HTMLElement>(".hud-road-ring")
    const track = this.road?.parentElement
    this.roadH = track ? Math.max(0, track.clientHeight - 13) : 0
    this.paintedStage = -1
  }

  /** Runs every frame from the GSAP ticker. */
  update(frames: number) {
    let target = 0
    for (let i = 0; i < this.progress.length; i++) target += this.progress[i]
    const k = this.reduced.matches ? 1 : 1 - Math.pow(1 - 0.14, frames)
    this.stage += (target - this.stage) * k
    if (Math.abs(target - this.stage) < 0.0004) this.stage = target

    const max = ScrollTrigger.maxScroll(window)
    const along = max > 0 ? Math.min(1, window.scrollY / max) : 0

    this.engine?.setStage(this.stage)
    if (this.images.length && this.stage !== this.paintedStage) this.paintFallback()
    this.paintRealm()
    if (this.road) this.road.style.transform = `translate3d(0, ${(along * this.roadH).toFixed(1)}px, 0)`
  }

  private pair() {
    const K = KEYFRAMES.length
    let i = Math.floor(this.stage)
    let t = this.stage - i
    if (i >= K - 1) {
      i = K - 2
      t = 1
    }
    return { i, t }
  }

  private paintRealm() {
    const { i, t } = this.pair()
    const a = REALMS[KEYFRAMES[i].realm]
    const b = REALMS[KEYFRAMES[i + 1].realm]
    const bg = mixRGB(a.bg, b.bg, t)
    const glow = mixRGB(a.glow, b.glow, t)
    const accent = mixRGB(a.accent, b.accent, t)
    const vars = `${bg}|${glow}|${accent}`
    if (vars !== this.vars) {
      this.vars = vars
      const s = document.documentElement.style
      s.setProperty("--bg", `rgb(${bg.join(",")})`)
      s.setProperty("--glow", `rgb(${glow.join(",")})`)
      s.setProperty("--accent", `rgb(${accent.join(",")})`)
    }
    this.mote = mixRGB(a.mote, b.mote, t)
    const realm = t < 0.5 ? KEYFRAMES[i].realm : KEYFRAMES[i + 1].realm
    if (realm !== this.realm) {
      this.realm = realm
      this.announce(realm)
    }
  }

  /** The corner label flickers through runes into the new realm's name. */
  private announce(realm: number) {
    if (document.documentElement.classList.contains("is-unseen")) return
    const num = document.querySelector<HTMLElement>(".hud-realm-num")
    const name = document.querySelector<HTMLElement>(".hud-realm-name")
    const place = document.querySelector<HTMLElement>(".hud-realm-place")
    if (num) num.textContent = `Realm ${ROMAN[realm]} / ${ROMAN[REALMS.length - 1]}`
    if (name) decode(name, REALMS[realm].name, 700)
    if (place) decode(place, REALMS[realm].place, 1100)
  }

  private paintFallback() {
    this.paintedStage = this.stage
    if (this.frames.length < 2) return
    const { i, t } = this.pair()
    const A = this.frames[i]
    const B = this.frames[i + 1]
    const show = new Map<number, { rect: Rect; o: number }>()
    if (A.emblem === B.emblem) {
      const s = smooth(t)
      show.set(A.emblem, { rect: lerpRect(A.rect, B.rect, s), o: lerp(A.dim, B.dim, s) })
    } else {
      show.set(A.emblem, { rect: A.rect, o: A.dim * (1 - t) })
      show.set(B.emblem, { rect: B.rect, o: B.dim * t })
    }
    this.images.forEach((img, e) => {
      const s = show.get(e)
      if (!s || s.o < 0.01) {
        img.style.opacity = "0"
        return
      }
      img.style.opacity = s.o.toFixed(3)
      img.style.width = s.rect.w + "px"
      img.style.height = s.rect.h + "px"
      img.style.transform = `translate(${s.rect.x}px, ${s.rect.y}px)`
    })
  }

  /** Put on the Ring: the world turns grey and the Eye turns towards you. */
  setUnseen(on: boolean) {
    const name = document.querySelector<HTMLElement>(".hud-realm-name")
    const place = document.querySelector<HTMLElement>(".hud-realm-place")
    if (on) {
      if (name) decode(name, "The Unseen", 700)
      if (place) decode(place, "the wraith-world · take it off", 1100)
    } else {
      const realm = this.realm
      this.realm = -1
      if (realm >= 0) this.announce(realm)
    }
  }
}

export const scene = new Scene()

/** A ScrollTrigger whose progress drives transition `index` (keyframe index → index + 1). */
export function morphTrigger(index: number, vars: ScrollTrigger.Vars) {
  const sync = (self: ScrollTrigger) => scene.setTransition(index, self.progress)
  return ScrollTrigger.create({ ...vars, onUpdate: sync, onRefresh: sync })
}
