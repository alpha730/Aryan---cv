import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import type Lenis from "lenis"
import { REGION, ROUTE } from "../map/geo"
import { decode } from "./text"
import { KEYFRAMES, REALMS, ROMAN, STOPS, TRANSITIONS, frameCam, type Cam } from "./world"

gsap.registerPlugin(ScrollTrigger)

type RGB = [number, number, number]

const mixRGB = (a: RGB, b: RGB, t: number): RGB => [
  Math.round(a[0] + (b[0] - a[0]) * t),
  Math.round(a[1] + (b[1] - a[1]) * t),
  Math.round(a[2] + (b[2] - a[2]) * t),
]

const smooth = (t: number) => t * t * (3 - 2 * t)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
/** 0 below lo, 1 above hi, eased between */
const ramp = (lo: number, hi: number, v: number) => smooth(clamp((v - lo) / (hi - lo), 0, 1))

/** the pieces of the map the scene moves; MapStage hands them over once it has drawn them */
export interface MapParts {
  /** everything that dims together when a chapter is being read */
  leaf: HTMLElement
  /** the whole map, painted small */
  far: SVGSVGElement
  /** the same map, painted large for the close views */
  near: SVGSVGElement
  /** the sheet the red road is drawn on */
  road: SVGSVGElement
  route: SVGPathElement
  head: SVGGElement
  marks: SVGGElement[]
  /** the beacon-fires, and the dusk that falls when they are lit */
  fires: SVGGElement[]
  dusk: HTMLElement
  fogB: HTMLElement
  fogL: HTMLElement
}

/** the road's dashes, written out once: nine units of ink, six of paper */
const DASH = 9
const GAP = 6
const DASHES = `${DASH} ${GAP} `.repeat(Math.ceil(ROUTE.total / (DASH + GAP)) + 1)
const PAIR = `${DASH} ${GAP} `.length

/**
 * Turns scroll into the journey: each ScrollTrigger registered with
 * morphTrigger() reports how far its transition has run, the sum is the
 * stage, and the stage moves the map, inks the road, and tints the page.
 */
class Scene {
  lenis: Lenis | null = null
  map: MapParts | null = null
  cams: Cam[] = []
  progress = new Float32Array(TRANSITIONS)
  stage = 0
  /** 0–1: how far the view has been called away to the beacons of Gondor */
  egg = 0

  private reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
  private realm = -1
  private vars = ""
  private layoutW = 0
  private layoutH = 0
  private roadH = 0
  private road: HTMLElement | null = null
  private paintedStage = -1
  private paintedEgg = 0
  private night: HTMLElement | null = null
  private skills: HTMLElement | null = null
  private clip = ""
  private shown: Record<string, string> = {}
  private farScale = 0.5
  private nearScale = 2
  private nearFrom = 0.8
  private nearFull = 1

  setTransition(i: number, p: number) {
    this.progress[i] = p
  }

  /** Works out where the map looks at every keyframe. */
  relayout(force = false) {
    const vw = window.innerWidth
    const vh = window.innerHeight
    // phones resize the viewport as the address bar slides; ignore small height changes
    if (!force && this.cams.length && vw === this.layoutW && Math.abs(vh - this.layoutH) < 160) return
    this.layoutW = vw
    this.layoutH = vh
    const copy = document.querySelector(".hero-copy")
    const heroCopyTop = copy ? copy.getBoundingClientRect().top + window.scrollY : vh * 0.62
    // where each title card's words begin, measured from the top of its screen
    const titleTops = Array.from(document.querySelectorAll<HTMLElement>(".tc-copy"), (c) => c.offsetTop)
    let title = 0
    this.cams = KEYFRAMES.map((k) => {
      const copyTop = k.mode === "hero" ? heroCopyTop : k.mode === "title" ? (titleTops[title++] ?? vh * 0.6) : vh
      return frameCam(k, vw, vh, copyTop)
    })
    this.road = document.querySelector<HTMLElement>(".hud-road-ring")
    const track = this.road?.parentElement
    this.roadH = track ? Math.max(0, track.clientHeight - 13) : 0
    this.night = document.querySelector<HTMLElement>(".night")
    this.skills = document.getElementById("skills")
    this.sizeSheets()
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

    if (this.stage !== this.paintedStage || this.egg !== this.paintedEgg) this.paintMap()
    this.paintRealm()
    this.paintNight()
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

  /** set a style only when it has changed */
  private put(key: string, el: HTMLElement | SVGElement, prop: string, value: string) {
    if (this.shown[key] === value) return
    this.shown[key] = value
    el.style.setProperty(prop, value)
  }

  /** Moves the view across the map and inks the road as far as the reader has come. */
  private paintMap() {
    const m = this.map
    if (!m || this.cams.length < 2) return
    this.paintedStage = this.stage
    const { i, t } = this.pair()
    const A = this.cams[i]
    const B = this.cams[i + 1]
    const ka = KEYFRAMES[i]
    const kb = KEYFRAMES[i + 1]
    const e = smooth(t)
    const vw = this.layoutW
    const vh = this.layoutH

    let cx = lerp(A.cx, B.cx, e)
    let cy = lerp(A.cy, B.cy, e)
    let s = Math.exp(lerp(Math.log(A.s), Math.log(B.s), e))

    // the road: as far as the door of the place we have reached
    const dist = lerp(ROUTE.doors[ka.stop], ROUTE.doors[kb.stop], e)
    const head = ROUTE.at(dist)
    if (ka.stop !== kb.stop) {
      // between two places the view follows the traveller, and rises to see the way
      const da = STOPS[ka.stop].door
      const db = STOPS[kb.stop].door
      const arc = Math.sin(Math.PI * t)
      cx += (head[0] - lerp(da[0], db[0], e)) * arc
      cy += (head[1] - lerp(da[1], db[1], e)) * arc
      const far = Math.hypot(B.cx - A.cx, B.cy - A.cy) * Math.min(A.s, B.s)
      s *= 1 - clamp(far / (vw * 2.2), 0, 0.7) * arc
    }

    let dim = lerp(A.dim, B.dim, e)
    let fogB = lerp(A.fogB, B.fogB, e)
    let fogL = lerp(A.fogL, B.fogL, e)

    // the beacons: wherever the reader is, the view is called away to the White Mountains at dusk
    const g = smooth(this.egg)
    this.paintedEgg = this.egg
    if (g > 0) {
      const to = Math.min(vw / 470, vh / 400, this.nearScale)
      cx = lerp(cx, 2046, g)
      cy = lerp(cy, 1212 - (vh * 0.06) / to, g)
      s = Math.exp(lerp(Math.log(s), Math.log(to), g)) * (1 - 0.5 * Math.sin(Math.PI * this.egg))
      dim = lerp(dim, 1, g)
      fogB *= 1 - g
      fogL *= 1 - g
    }
    this.put("dusk", m.dusk, "opacity", (g * 0.66).toFixed(3))

    // the two painted sheets slide and scale; the near one takes over as the view draws close
    const x = vw / 2 - (cx - REGION.x) * s
    const y = vh / 2 - (cy - REGION.y) * s
    const near = ramp(this.nearFrom, this.nearFull, s)
    // hidden by opacity alone, so a sheet is never repainted when it comes back
    this.put("farO", m.far, "opacity", near >= 1 ? "0" : "1")
    this.put("nearO", m.near, "opacity", near.toFixed(2))
    if (near < 1) m.far.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${(s / this.farScale).toFixed(5)})`
    if (near > 0) m.near.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${(s / this.nearScale).toFixed(5)})`
    this.put("dim", m.leaf, "opacity", dim.toFixed(3))

    // the travelled road, in red dashes, on its own sheet
    const w = vw / s
    const h = vh / s
    m.road.setAttribute("viewBox", `${(cx - w / 2).toFixed(2)} ${(cy - h / 2).toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)}`)
    const inv = 1 / s
    const whole = Math.floor(dist / (DASH + GAP))
    const rest = dist - whole * (DASH + GAP)
    const dash = DASHES.slice(0, whole * PAIR) + (rest < DASH ? `${rest.toFixed(1)} ` : `${DASH} ${GAP} 0 `) + (ROUTE.total + 40).toFixed(0)
    m.route.setAttribute("stroke-dasharray", dash)
    m.route.setAttribute("stroke-width", clamp(2.3 * inv, 1.4, 9).toFixed(2))
    m.head.setAttribute("transform", `translate(${head[0].toFixed(1)} ${head[1].toFixed(1)}) scale(${inv.toFixed(3)})`)
    this.put("head", m.head, "opacity", dist > 1 ? "1" : "0")
    const k = (vw < 640 ? 0.82 : 1) * inv
    for (const mark of m.marks) mark.setAttribute("transform", `translate(${mark.dataset.x} ${mark.dataset.y}) scale(${k.toFixed(3)})`)
    if (g > 0) for (const fire of m.fires) fire.setAttribute("transform", `translate(${fire.dataset.x} ${fire.dataset.y}) scale(${(inv * (vw < 640 ? 0.8 : 1.15)).toFixed(3)})`)

    // parchment drawn up behind the words
    this.put("fogB", m.fogB, "opacity", fogB.toFixed(3))
    if (fogB > 0.001) m.fogB.style.transform = `translate3d(0, ${(lerp(A.fogY, B.fogY, e) - 110).toFixed(1)}px, 0)`
    this.put("fogL", m.fogL, "opacity", fogL.toFixed(3))
  }

  /**
   * Sizes the two painted sheets: the far one at the scale of the opening
   * screen, the near one at the scale of a title card, so each is sharp
   * where it is looked at longest.
   */
  private sizeSheets() {
    const m = this.map
    if (!m || !this.cams.length) return
    const titles = this.cams.filter((_, i) => KEYFRAMES[i].mode === "title").map((c) => c.s)
    const backs = this.cams.filter((_, i) => KEYFRAMES[i].mode === "back").map((c) => c.s)
    this.farScale = this.cams[0].s
    // a little under the closest view: far fewer pixels to paint, and no softer to the eye
    this.nearScale = Math.max(...titles) * 0.84
    const back = Math.min(...backs)
    this.nearFrom = Math.max(this.farScale * 1.1, back * 0.68)
    this.nearFull = Math.max(this.farScale * 1.3, back * 0.9)
    for (const [el, scale] of [[m.far, this.farScale], [m.near, this.nearScale]] as const) {
      el.style.width = (REGION.w * scale).toFixed(1) + "px"
      el.style.height = (REGION.h * scale).toFixed(1) + "px"
      // each sheet is lettered and inked for the distance it is seen from
      el.style.setProperty("--inv", (1 / scale).toFixed(3))
      el.style.setProperty("--fine", ramp(0.4, 0.9, scale).toFixed(2))
      el.style.setProperty("--pen", (0.6 + 0.4 * ramp(0.25, 0.8, scale)).toFixed(2))
      el.style.setProperty("--stops", ramp(0.3, 0.42, scale).toFixed(2))
      // the ribbons keep a readable size however small the sheet is painted
      el.style.setProperty("--lab", clamp(0.84 / scale, 1, 2.2).toFixed(2))
    }
  }

  /** Khazad-dûm is read by starlight: the leaf turns dark wherever the Skills chapter is on screen. */
  private paintNight() {
    const night = this.night
    const el = this.skills
    if (!night || !el) return
    const r = el.getBoundingClientRect()
    const vh = window.innerHeight
    const clip = r.bottom <= 0 || r.top >= vh ? "" : `inset(${Math.max(0, r.top).toFixed(0)}px 0 ${Math.max(0, vh - r.bottom).toFixed(0)}px 0)`
    if (clip === this.clip) return
    this.clip = clip
    night.style.display = clip ? "block" : "none"
    if (clip) night.style.clipPath = clip
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
    const realm = t < 0.5 ? KEYFRAMES[i].realm : KEYFRAMES[i + 1].realm
    if (realm !== this.realm) {
      this.realm = realm
      this.announce(realm)
    }
  }

  /** The corner label flickers through runes into the new realm's name. */
  private announce(realm: number) {
    const num = document.querySelector<HTMLElement>(".hud-realm-num")
    const name = document.querySelector<HTMLElement>(".hud-realm-name")
    const place = document.querySelector<HTMLElement>(".hud-realm-place")
    if (num) num.textContent = `Realm ${ROMAN[realm]} / ${ROMAN[REALMS.length - 1]}`
    if (name) decode(name, REALMS[realm].name, 700)
    if (place) decode(place, REALMS[realm].place, 1100)
  }

}

export const scene = new Scene()

/** A ScrollTrigger whose progress drives transition `index` (keyframe index → index + 1). */
export function morphTrigger(index: number, vars: ScrollTrigger.Vars) {
  const sync = (self: ScrollTrigger) => scene.setTransition(index, self.progress)
  return ScrollTrigger.create({ ...vars, onUpdate: sync, onRefresh: sync })
}
