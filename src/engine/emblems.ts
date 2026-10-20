/**
 * The emblems the particles flow between, painted on transparent canvases,
 * and the sampler that turns each picture into the same number of particles.
 */

import { TEX_W, type Emblem } from "./MorphEngine"

/** Small seeded PRNG so every emblem looks the same on every visit. */
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement("canvas")
  c.width = w
  c.height = h
  const g = c.getContext("2d", { willReadFrequently: true })
  if (!g) throw new Error("2D canvas unavailable")
  return [c, g]
}

/** An eight-pointed star, as used on the Doors of Durin and over the White Tree. */
function star8(g: CanvasRenderingContext2D, x: number, y: number, r: number) {
  g.beginPath()
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 - Math.PI / 2
    const rad = i % 2 === 0 ? r : r * 0.38
    g.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad)
  }
  g.closePath()
  g.fill()
}

const TAU = Math.PI * 2

function circle(g: CanvasRenderingContext2D, x: number, y: number, r: number) {
  g.beginPath()
  g.arc(x, y, r, 0, TAU)
}

/** A soft round glow. */
function haze(g: CanvasRenderingContext2D, x: number, y: number, R: number, rgb: string, a: number) {
  g.save()
  g.globalCompositeOperation = "lighter"
  const h = g.createRadialGradient(x, y, 0, x, y, R)
  h.addColorStop(0, `rgba(${rgb},${a})`)
  h.addColorStop(1, `rgba(${rgb},0)`)
  g.fillStyle = h
  g.fillRect(x - R, y - R, R * 2, R * 2)
  g.restore()
}

/** A four-pointed glint of light. */
function glint(g: CanvasRenderingContext2D, x: number, y: number, s: number, a = 0.95) {
  g.save()
  g.globalCompositeOperation = "lighter"
  const fill = g.createRadialGradient(x, y, 0, x, y, s)
  fill.addColorStop(0, `rgba(255,255,255,${a})`)
  fill.addColorStop(0.3, `rgba(255,255,255,${a * 0.6})`)
  fill.addColorStop(1, "rgba(255,255,255,0)")
  g.fillStyle = fill
  g.beginPath()
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * TAU - Math.PI / 2
    const rad = i % 2 === 0 ? s : s * 0.14
    g.lineTo(x + Math.cos(ang) * rad, y + Math.sin(ang) * rad)
  }
  g.closePath()
  g.fill()
  g.restore()
}

/** Builds the outline of a ribbon along a path, as wide at each point as `width` says. Fill it after. */
function ribbon(g: CanvasRenderingContext2D, pts: number[][], width: (i: number) => number) {
  const n = pts.length
  const left: number[][] = []
  const right: number[][] = []
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)]
    const b = pts[Math.min(n - 1, i + 1)]
    const dx = b[0] - a[0]
    const dy = b[1] - a[1]
    const l = Math.hypot(dx, dy) || 1
    const h = width(i) / 2
    left.push([pts[i][0] - (dy / l) * h, pts[i][1] + (dx / l) * h])
    right.push([pts[i][0] + (dy / l) * h, pts[i][1] - (dx / l) * h])
  }
  g.beginPath()
  for (let i = 0; i < n; i++) g.lineTo(left[i][0], left[i][1])
  for (let i = n - 1; i >= 0; i--) g.lineTo(right[i][0], right[i][1])
  g.closePath()
}

/* ── metals and stones ───────────────────────────────────────────────── */

type Stops = [number, string][]

/** Each metal is a loop of colour stops laid round a conic gradient, so a band glints as it turns. */
const GOLD: Stops = [
  [0, "#6b430c"], [0.09, "#c58f2c"], [0.18, "#ffe6a0"], [0.27, "#d9a441"], [0.4, "#7c4d0e"],
  [0.52, "#e3b04e"], [0.63, "#fff2c4"], [0.73, "#cf9632"], [0.86, "#734a0d"], [1, "#6b430c"],
]
const MITHRIL: Stops = [
  [0, "#4d5663"], [0.09, "#a3afbf"], [0.18, "#f5f9ff"], [0.27, "#bdc7d4"], [0.4, "#5b6472"],
  [0.52, "#c9d2de"], [0.63, "#ffffff"], [0.73, "#aab5c3"], [0.86, "#56606d"], [1, "#4d5663"],
]
/** Narya's gold, reddened by its own fire. */
const RED_GOLD: Stops = [
  [0, "#6b260c"], [0.09, "#c8652c"], [0.18, "#ffd0a0"], [0.27, "#de8a45"], [0.4, "#7c300e"],
  [0.52, "#e6984e"], [0.63, "#ffe4c4"], [0.73, "#d27532"], [0.86, "#73300d"], [1, "#6b260c"],
]
/** The Nine: cold iron. */
const IRON: Stops = [
  [0, "#23272e"], [0.09, "#4c535d"], [0.18, "#aeb7c4"], [0.27, "#5f6772"], [0.4, "#262a31"],
  [0.52, "#59616c"], [0.63, "#c3ccd8"], [0.73, "#535a64"], [0.86, "#262a30"], [1, "#23272e"],
]

function conic(g: CanvasRenderingContext2D, x: number, y: number, stops: Stops, from = 0) {
  const grad = g.createConicGradient(from, x, y)
  for (const [o, col] of stops) grad.addColorStop(o, col)
  return grad
}

function across(g: CanvasRenderingContext2D, x0: number, x1: number, stops: Stops) {
  const grad = g.createLinearGradient(x0, 0, x1, 0)
  for (const [o, col] of stops) grad.addColorStop(o, col)
  return grad
}

interface Stone {
  deep: string
  mid: string
  light: string
  /** "r,g,b" of the light it throws */
  glow: string
}

const SAPPHIRE: Stone = { deep: "#03174d", mid: "#1d5fd8", light: "#a6d6ff", glow: "70,140,255" }
const ADAMANT: Stone = { deep: "#8597b0", mid: "#e2ecfb", light: "#ffffff", glow: "225,236,255" }
const RUBY: Stone = { deep: "#3a0005", mid: "#c10f1e", light: "#ff9585", glow: "255,52,40" }
const EMERALD: Stone = { deep: "#022c18", mid: "#12a159", light: "#a9ffd2", glow: "40,220,130" }

/** A stone for each of the Seven. */
const SEVEN_STONES: Stone[] = [
  RUBY,
  { deep: "#4a1800", mid: "#e0761c", light: "#ffd09a", glow: "255,140,40" },
  { deep: "#4a3a00", mid: "#e6c020", light: "#fff2a0", glow: "255,215,60" },
  EMERALD,
  SAPPHIRE,
  { deep: "#24063f", mid: "#8a3fd0", light: "#e2bcff", glow: "170,90,255" },
  ADAMANT,
]

/* ── rings ───────────────────────────────────────────────────────────── */

/**
 * A ring standing on its edge, face-on and seen a little from above: the top
 * of the band shows over its face, and the inner wall at the foot of the hole.
 * It is painted on its own layer, so whatever lies behind shows through it.
 */
function standingRing(g: CanvasRenderingContext2D, cx: number, cy: number, R: number, w: number, metal: Stops) {
  const depth = w * 0.62
  const pad = 4
  const [layer, l] = makeCanvas(Math.ceil(R * 2 + pad * 2), Math.ceil(R * 2 + depth + pad * 2))
  const x = layer.width / 2
  const y = layer.height - R - pad
  const r = R - w

  // the top of the band, catching the light
  circle(l, x, y - depth, R)
  l.fillStyle = conic(l, x, y - depth, metal, 0.5)
  l.fill()
  l.fillStyle = "rgba(255,246,222,0.2)"
  l.fill()

  // the face, rounded: dark at both edges, bright down the middle
  l.beginPath()
  l.arc(x, y, R, 0, TAU)
  l.arc(x, y, r, 0, TAU, true)
  l.fillStyle = conic(l, x, y, metal)
  l.fill()
  const profile = l.createRadialGradient(x, y, r, x, y, R)
  profile.addColorStop(0, "rgba(18,8,0,0.55)")
  profile.addColorStop(0.32, "rgba(255,255,255,0)")
  profile.addColorStop(0.56, "rgba(255,252,236,0.24)")
  profile.addColorStop(0.8, "rgba(255,255,255,0)")
  profile.addColorStop(1, "rgba(18,8,0,0.55)")
  l.fillStyle = profile
  l.fill()

  // the inner wall, in shadow
  circle(l, x, y, r)
  l.fillStyle = conic(l, x, y, metal, 2.1)
  l.fill()
  const wall = l.createLinearGradient(0, y - r, 0, y + r)
  wall.addColorStop(0, "rgba(12,6,0,0.9)")
  wall.addColorStop(1, "rgba(12,6,0,0.4)")
  l.fillStyle = wall
  l.fill()

  // and the hole, open where the front and back rims both are
  l.save()
  circle(l, x, y - depth, r)
  l.clip()
  l.globalCompositeOperation = "destination-out"
  l.fillStyle = "#000"
  circle(l, x, y, r)
  l.fill()
  l.restore()

  l.lineCap = "round"
  l.lineWidth = Math.max(1, w * 0.05)
  l.strokeStyle = "rgba(255,250,232,0.6)"
  l.beginPath()
  l.arc(x, y - depth, R, Math.PI * 1.12, Math.PI * 1.88)
  l.stroke()
  l.lineWidth = w * 0.14
  l.strokeStyle = "rgba(255,255,244,0.4)"
  l.beginPath()
  l.arc(x, y, R - w * 0.44, Math.PI * 1.08, Math.PI * 1.36)
  l.stroke()

  g.drawImage(layer, cx - x, cy - y)
}

/** A cut stone seen from above and in front: table, facets, a glint, and the light it throws. */
function gem(g: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, s: Stone, glow = 1) {
  if (glow > 0) {
    const R = rx * 2.8
    g.save()
    g.globalCompositeOperation = "lighter"
    const halo = g.createRadialGradient(x, y, 0, x, y, R)
    halo.addColorStop(0, `rgba(${s.glow},${0.5 * glow})`)
    halo.addColorStop(0.3, `rgba(${s.glow},${0.16 * glow})`)
    halo.addColorStop(1, `rgba(${s.glow},0)`)
    g.fillStyle = halo
    g.fillRect(x - R, y - R, R * 2, R * 2)
    g.restore()
  }
  g.beginPath()
  g.ellipse(x, y, rx, ry, 0, 0, TAU)
  const body = g.createRadialGradient(x - rx * 0.28, y - ry * 0.32, rx * 0.06, x, y, rx)
  body.addColorStop(0, s.light)
  body.addColorStop(0.5, s.mid)
  body.addColorStop(1, s.deep)
  g.fillStyle = body
  g.fill()

  // an eight-sided table, joined to the girdle by facets
  const N = 8
  const T: number[][] = []
  const G: number[][] = []
  for (let i = 0; i < N; i++) {
    const a = ((i + 0.5) / N) * TAU
    T.push([x + Math.cos(a) * rx * 0.5, y - ry * 0.08 + Math.sin(a) * ry * 0.46])
    const b = (i / N) * TAU
    G.push([x + Math.cos(b) * rx, y + Math.sin(b) * ry])
  }
  for (let i = 0; i < N; i++) {
    const t0 = T[i]
    const t1 = T[(i + 1) % N]
    const g1 = G[(i + 1) % N]
    g.beginPath()
    g.moveTo(t0[0], t0[1])
    g.lineTo(g1[0], g1[1])
    g.lineTo(t1[0], t1[1])
    g.closePath()
    // facets turned to the upper left catch the light
    const lit = Math.cos(((i + 1) / N) * TAU + Math.PI * 0.75)
    g.fillStyle = lit > 0 ? `rgba(255,255,255,${(0.16 * lit).toFixed(3)})` : `rgba(0,0,0,${(-0.26 * lit).toFixed(3)})`
    g.fill()
  }
  g.beginPath()
  T.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py)))
  g.closePath()
  g.fillStyle = "rgba(255,255,255,0.1)"
  g.fill()
  g.lineWidth = Math.max(0.8, rx * 0.022)
  g.strokeStyle = "rgba(255,255,255,0.32)"
  for (let i = 0; i < N; i++) {
    g.moveTo(T[i][0], T[i][1])
    g.lineTo(G[i][0], G[i][1])
    g.moveTo(T[i][0], T[i][1])
    g.lineTo(G[(i + 1) % N][0], G[(i + 1) % N][1])
  }
  g.stroke()
  g.beginPath()
  g.ellipse(x, y, rx, ry, 0, 0, TAU)
  g.strokeStyle = "rgba(255,255,255,0.45)"
  g.stroke()
  glint(g, x - rx * 0.3, y - ry * 0.36, rx * 0.55)
}

/** The cup and rim that hold a stone up off the top of a band. */
function setting(g: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, base: number, metal: Stops) {
  const fill = across(g, x - rx * 1.2, x + rx * 1.2, metal)
  g.beginPath()
  g.moveTo(x - rx * 0.46, base)
  g.bezierCurveTo(x - rx * 0.56, y + ry * 0.9, x - rx * 1.14, y + ry * 0.5, x - rx * 1.1, y)
  g.lineTo(x + rx * 1.1, y)
  g.bezierCurveTo(x + rx * 1.14, y + ry * 0.5, x + rx * 0.56, y + ry * 0.9, x + rx * 0.46, base)
  g.closePath()
  g.fillStyle = fill
  g.fill()
  g.fillStyle = "rgba(10,5,0,0.28)"
  g.fill()
  g.beginPath()
  g.ellipse(x, y, rx * 1.13, ry * 1.18, 0, 0, TAU)
  g.fillStyle = fill
  g.fill()
  g.lineWidth = Math.max(1, rx * 0.045)
  g.strokeStyle = "rgba(255,248,226,0.55)"
  g.stroke()
}

/** Four claws over a stone's edge. */
function claws(g: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, metal: Stops) {
  g.fillStyle = metal[2][1]
  g.strokeStyle = "rgba(20,10,0,0.55)"
  g.lineWidth = Math.max(1, rx * 0.03)
  for (const a of [0.22, 0.78, 1.22, 1.78]) {
    const ang = a * Math.PI
    g.save()
    g.translate(x + Math.cos(ang) * rx, y + Math.sin(ang) * ry)
    g.rotate(ang)
    g.beginPath()
    g.ellipse(0, 0, rx * 0.2, rx * 0.11, 0, 0, TAU)
    g.fill()
    g.stroke()
    g.restore()
  }
}

/** A band with a stone set on top of it; returns where the stone's middle is. */
function jewelRing(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  R: number,
  w: number,
  metal: Stops,
  stone: Stone | null,
  srx = R * 0.3,
  glow = 1
) {
  standingRing(g, x, y, R, w, metal)
  const top = y - R - w * 0.62
  if (!stone) return top
  const sry = srx * 0.76
  const sy = top - sry * 0.62
  setting(g, x, sy, srx, sry, top + w * 0.55, metal)
  gem(g, x, sy, srx, sry, stone, glow)
  claws(g, x, sy, srx, sry, metal)
  return sy
}

/** Long thin rays of light from a point, as a bright star seems to throw: [angle, length, half-width]. */
function starRays(g: CanvasRenderingContext2D, x: number, y: number, rays: number[][], rgb: string) {
  g.save()
  g.globalCompositeOperation = "lighter"
  for (const [a, len, w] of rays) {
    g.save()
    g.translate(x, y)
    g.rotate(a)
    const f = g.createLinearGradient(0, 0, len, 0)
    f.addColorStop(0, "rgba(255,255,255,0.95)")
    f.addColorStop(0.2, `rgba(${rgb},0.55)`)
    f.addColorStop(1, `rgba(${rgb},0)`)
    g.fillStyle = f
    g.beginPath()
    g.moveTo(0, -w)
    g.lineTo(len, 0)
    g.lineTo(0, w)
    g.closePath()
    g.fill()
    g.restore()
  }
  g.restore()
}

/** Colours of a tongue of flame, from its base to its tip, as "r,g,b". */
const OUTER_FIRE = ["255,140,50", "236,72,26", "176,26,10"]
const MID_FIRE = ["255,196,96", "255,124,40", "205,42,14"]
const CORE_FIRE = ["255,232,156", "255,212,118", "255,150,60"]

/** One tongue of flame, from a wide base up to a leaning tip. Draw it with "lighter". */
function tongue(g: CanvasRenderingContext2D, x: number, base: number, h: number, w: number, lean: number, a: number, fire: string[]) {
  const tipX = x + lean
  const tipY = base - h
  g.beginPath()
  g.moveTo(x - w / 2, base)
  g.bezierCurveTo(x - w * 0.62, base - h * 0.42, tipX - w * 0.1 - lean * 0.3, tipY + h * 0.38, tipX, tipY)
  g.bezierCurveTo(tipX + w * 0.12 - lean * 0.2, tipY + h * 0.42, x + w * 0.66, base - h * 0.36, x + w / 2, base)
  g.closePath()
  const f = g.createLinearGradient(0, base, 0, tipY)
  f.addColorStop(0, `rgba(${fire[0]},${0.85 * a})`)
  f.addColorStop(0.3, `rgba(${fire[1]},${0.7 * a})`)
  f.addColorStop(0.7, `rgba(${fire[2]},${0.45 * a})`)
  f.addColorStop(1, `rgba(${fire[2]},0)`)
  g.fillStyle = f
  g.fill()
}

/** A flicker of flame broken free of the fire, pointed at both ends. Draw it with "lighter". */
function wisp(g: CanvasRenderingContext2D, x: number, y: number, h: number, w: number, lean: number, a: number) {
  const tipX = x + lean
  const tipY = y - h
  g.beginPath()
  g.moveTo(x, y)
  g.bezierCurveTo(x - w * 0.7, y - h * 0.3, tipX - w * 0.3, tipY + h * 0.35, tipX, tipY)
  g.bezierCurveTo(tipX + w * 0.4, tipY + h * 0.4, x + w * 0.7, y - h * 0.25, x, y)
  g.closePath()
  const f = g.createLinearGradient(0, y, 0, tipY)
  f.addColorStop(0, `rgba(255,170,70,${0.2 * a})`)
  f.addColorStop(0.35, `rgba(255,140,50,${0.8 * a})`)
  f.addColorStop(1, "rgba(220,50,16,0)")
  g.fillStyle = f
  g.fill()
}

/* ── the One Ring ────────────────────────────────────────────────────── */

type Glyph = { w: number; draw: (g: CanvasRenderingContext2D, h: number) => void }

/** A stem, one or two bows, and sometimes a tehta (vowel mark) above: Tengwar in spirit. */
function makeGlyph(r: () => number): Glyph {
  const stemUp = r() < 0.28
  const stemDown = !stemUp && r() < 0.32
  const bows = r() < 0.14 ? 0 : r() < 0.3 ? 2 : 1
  const open = bows > 0 && r() < 0.22
  const tehta = r() < 0.55 ? Math.floor(r() * 4) : -1
  const w = bows === 2 ? 0.86 : bows === 1 ? 0.58 : 0.3
  return {
    w,
    draw(g, h) {
      const br = h * 0.17
      const y0 = h * 0.08
      const top = stemUp ? -h * 0.62 : -h * 0.18
      const bot = stemDown ? h * 0.66 : y0 + br
      g.beginPath()
      if (!open) {
        g.moveTo(0, top)
        g.lineTo(0, bot)
      }
      for (let b = 0; b < bows; b++) {
        const cx = b * br * 1.6
        if (open) {
          g.moveTo(cx + br * Math.cos(-Math.PI * 0.8), y0 + br * Math.sin(-Math.PI * 0.8))
          g.arc(cx, y0, br, -Math.PI * 0.8, Math.PI * 0.8)
        } else {
          g.moveTo(cx, y0 - br)
          g.arc(cx, y0, br, -Math.PI / 2, Math.PI / 2)
        }
      }
      g.stroke()
      if (tehta < 0) return
      const ty = Math.min(top, y0 - br) - h * 0.17
      const tx = (w * h) / 2 - h * 0.12
      g.beginPath()
      if (tehta === 0) {
        g.arc(tx, ty, h * 0.05, 0, Math.PI * 2)
        g.fill()
      } else if (tehta === 1) {
        g.arc(tx - h * 0.08, ty, h * 0.045, 0, Math.PI * 2)
        g.arc(tx + h * 0.08, ty, h * 0.045, 0, Math.PI * 2)
        g.fill()
      } else if (tehta === 2) {
        g.moveTo(tx - h * 0.07, ty + h * 0.05)
        g.lineTo(tx + h * 0.09, ty - h * 0.08)
        g.stroke()
      } else {
        g.arc(tx, ty, h * 0.08, Math.PI * 0.1, Math.PI * 1.1, true)
        g.stroke()
      }
    },
  }
}

/** A plain gold band seen from above at an angle, its inscription glowing as if fresh from the fire. */
export function paintRing() {
  const W = 1440
  const H = 680
  const [c, g] = makeCanvas(W, H)
  const cx = W / 2
  const rx = 640
  const ry = 226
  const depth = 132
  const wall = 34
  const rxi = rx - wall
  const ryi = ry - wall * (ry / rx)
  const cy = (H - depth) / 2

  const metal = g.createLinearGradient(cx - rx, 0, cx + rx, 0)
  const stops: [number, string][] = [
    [0, "#3b2405"], [0.07, "#8a5a12"], [0.16, "#e6b552"], [0.22, "#fff0b8"], [0.3, "#c58c22"],
    [0.42, "#7a4c0c"], [0.52, "#d9a440"], [0.6, "#ffe9a6"], [0.68, "#e1ad45"], [0.8, "#94621a"],
    [0.9, "#d29a32"], [1, "#3b2405"],
  ]
  for (const [o, col] of stops) metal.addColorStop(o, col)

  const annulus = (y: number) => {
    g.beginPath()
    g.ellipse(cx, y, rx, ry, 0, 0, Math.PI * 2)
    g.moveTo(cx + rxi, y)
    g.ellipse(cx, y, rxi, ryi, 0, 0, Math.PI * 2)
  }
  const outsideTopRim = () => {
    g.beginPath()
    g.rect(0, 0, W, H)
    g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
    g.clip("evenodd")
  }

  // the band is extruded slice by slice; lower slices are darker, so both the
  // outer wall and the inner wall seen through the hole are lit from above
  for (let i = depth; i >= 1; i--) {
    annulus(cy + i)
    g.fillStyle = metal
    g.fill("evenodd")
    g.fillStyle = `rgba(20,9,0,${0.04 + 0.5 * Math.pow(i / depth, 1.4)})`
    g.fill("evenodd")
  }

  // inner wall: deep shadow under the far rim
  g.save()
  g.beginPath()
  g.ellipse(cx, cy, rxi, ryi, 0, 0, Math.PI * 2)
  g.clip()
  g.globalCompositeOperation = "source-atop"
  const inner = g.createLinearGradient(0, cy - ryi, 0, cy + ryi)
  inner.addColorStop(0, "rgba(16,6,0,.8)")
  inner.addColorStop(0.55, "rgba(40,18,0,.42)")
  inner.addColorStop(1, "rgba(90,45,0,.12)")
  g.fillStyle = inner
  g.fillRect(0, 0, W, H)
  const refl = g.createLinearGradient(cx - rx * 0.42, 0, cx - rx * 0.18, 0)
  refl.addColorStop(0, "rgba(255,230,160,0)")
  refl.addColorStop(0.5, "rgba(255,230,160,.22)")
  refl.addColorStop(1, "rgba(255,230,160,0)")
  g.fillStyle = refl
  g.fillRect(0, 0, W, H)
  g.restore()

  // top rim
  annulus(cy)
  g.fillStyle = metal
  g.fill("evenodd")
  g.fillStyle = "rgba(255,244,205,.3)"
  g.fill("evenodd")
  g.lineWidth = 2
  g.strokeStyle = "rgba(255,240,190,.85)"
  g.beginPath()
  g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
  g.stroke()
  g.lineWidth = 1.5
  g.strokeStyle = "rgba(90,55,10,.8)"
  g.beginPath()
  g.ellipse(cx, cy, rxi, ryi, 0, 0, Math.PI * 2)
  g.stroke()

  // vertical speculars on the outer wall
  g.save()
  outsideTopRim()
  g.globalCompositeOperation = "source-atop"
  for (const [x, w, a] of [[-0.62, 26, 0.55], [-0.2, 64, 0.3], [0.38, 30, 0.6], [0.7, 18, 0.35]]) {
    const sx = cx + rx * x
    const sp = g.createLinearGradient(sx - w, 0, sx + w, 0)
    sp.addColorStop(0, "rgba(255,250,220,0)")
    sp.addColorStop(0.5, `rgba(255,250,220,${a})`)
    sp.addColorStop(1, "rgba(255,250,220,0)")
    g.fillStyle = sp
    g.fillRect(sx - w, 0, w * 2, H)
  }
  g.restore()

  // the inscription
  const r = rng(1954)
  const gh = depth * 0.44
  const glyphs: { x: number; y: number; s: number; glyph: Glyph }[] = []
  let theta = 0.08 * Math.PI
  while (theta < 0.92 * Math.PI) {
    const glyph = r() < 0.1 ? null : makeGlyph(r)
    const adv = (glyph ? glyph.w : 0.45) * gh + gh * 0.2
    const mid = theta + adv / 2 / rx
    const s = Math.sin(mid)
    if (glyph && s > 0.2) {
      glyphs.push({ x: cx - rx * Math.cos(mid), y: cy + ry * s + depth * 0.52, s, glyph })
    }
    theta += adv / rx
  }
  g.lineCap = "round"
  g.lineJoin = "round"
  for (const pass of [0, 1]) {
    g.shadowColor = pass === 0 ? "rgba(255,70,0,.95)" : "transparent"
    g.shadowBlur = pass === 0 ? 22 : 0
    g.strokeStyle = g.fillStyle = pass === 0 ? "#ff6a12" : "#ffd98a"
    for (const { x, y, s, glyph } of glyphs) {
      g.save()
      g.translate(x, y)
      g.scale(s, 1)
      g.transform(1, 0, -0.18, 1, 0, 0)
      g.translate((-glyph.w * gh) / 2, 0)
      g.lineWidth = gh * (pass === 0 ? 0.085 : 0.035)
      glyph.draw(g, gh)
      g.restore()
    }
  }
  g.shadowBlur = 0
  return c
}

/* ── Vilya, the Ring of Air ──────────────────────────────────────────── */

/** Gold and a great sapphire, mightiest of the Three, with the winds it is named for wheeling round it. */
export function paintVilya() {
  const W = 1200
  const H = 860
  const [c, g] = makeCanvas(W, H)
  const r = rng(31)
  const cx = 600
  const cy = 540
  const ox = cx
  const oy = cy - 60

  // gusts wheel round the ring, behind it and then in front, and curl up at the end
  const gusts = [
    { ax: 500, ay: 150, tilt: -0.14, from: 0.3, span: 4.9, w: 30 },
    { ax: 440, ay: 205, tilt: 0.12, from: 2.4, span: 4.6, w: 24 },
    { ax: 560, ay: 118, tilt: -0.04, from: 3.9, span: 4.1, w: 20 },
    { ax: 380, ay: 250, tilt: 0.24, from: 5.2, span: 3.6, w: 16 },
  ].map((s) => {
    const pts: number[][] = []
    const front: boolean[] = []
    const steps = 480
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const th = s.from + s.span * t
      // each gust spirals slowly in on itself
      const ex = Math.cos(th) * s.ax * (1 - 0.22 * t)
      const ey = Math.sin(th) * s.ay * (1 - 0.22 * t)
      pts.push([ox + ex * Math.cos(s.tilt) - ey * Math.sin(s.tilt), oy + ex * Math.sin(s.tilt) + ey * Math.cos(s.tilt)])
      front.push(Math.sin(th) > 0)
    }
    // the curl: a tightening turn round a point just inside the gust's end
    const [px, py] = pts[steps]
    let dx = px - pts[steps - 1][0]
    let dy = py - pts[steps - 1][1]
    const dl = Math.hypot(dx, dy) || 1
    dx /= dl
    dy /= dl
    let nx = -dy
    let ny = dx
    if (nx * (ox - px) + ny * (oy - py) < 0) {
      nx = -nx
      ny = -ny
    }
    const rc = s.ay * 0.2
    const kx = px + nx * rc
    const ky = py + ny * rc
    const a0 = Math.atan2(py - ky, px - kx)
    const dir = (px - kx) * dy - (py - ky) * dx > 0 ? 1 : -1
    const last = front[steps]
    for (let i = 1; i <= 90; i++) {
      const u = i / 90
      const a = a0 + dir * u * TAU * 1.2
      const rad = rc * (1 - 0.8 * u)
      pts.push([kx + Math.cos(a) * rad, ky + Math.sin(a) * rad])
      front.push(last)
    }
    return { pts, front, w: s.w }
  })

  const drawGusts = (front: boolean) => {
    g.save()
    g.globalCompositeOperation = "lighter"
    for (const gust of gusts) {
      const n = gust.pts.length
      const T = (i: number) => i / (n - 1)
      const taper = (i: number) => Math.min(1, T(i) / 0.12) * (T(i) < 0.78 ? 1 : 1 - ((T(i) - 0.78) / 0.22) * 0.85)
      // a few thin streams to each gust, running together at either end
      const streams = [-1, 0, 1].map((s) =>
        gust.pts.map((p, i) => {
          const a = gust.pts[Math.max(0, i - 1)]
          const b = gust.pts[Math.min(n - 1, i + 1)]
          const dx = b[0] - a[0]
          const dy = b[1] - a[1]
          const l = Math.hypot(dx, dy) || 1
          const off = s * gust.w * 0.42 * Math.sqrt(Math.sin(Math.PI * T(i)))
          return [p[0] - (dy / l) * off, p[1] + (dx / l) * off]
        })
      )
      let i = 0
      while (i < n) {
        if (gust.front[i] !== front) {
          i++
          continue
        }
        let j = i
        while (j + 1 < n && gust.front[j + 1] === front) j++
        // runs overlap by a point so the far and near halves join up
        const from = Math.max(0, i - 1)
        const to = Math.min(n - 1, j + 1)
        if (to > from) {
          ribbon(g, gust.pts.slice(from, to + 1), (k) => gust.w * 1.3 * taper(from + k))
          g.fillStyle = `rgba(150,190,255,${front ? 0.09 : 0.06})`
          g.fill()
          streams.forEach((pts, s) => {
            const core = s === 1
            ribbon(g, pts.slice(from, to + 1), (k) => gust.w * (core ? 0.26 : 0.16) * taper(from + k))
            g.fillStyle = `rgba(208,228,255,${((core ? 0.62 : 0.4) * (front ? 1 : 0.62)).toFixed(3)})`
            g.fill()
          })
        }
        i = j + 1
      }
    }
    g.restore()
  }

  drawGusts(false)
  jewelRing(g, cx, cy, 214, 42, GOLD, SAPPHIRE, 70)
  drawGusts(true)

  // stars, for the ring under the sky
  for (let k = 0; k < 18; k++) {
    const x = 80 + r() * (W - 160)
    const y = 26 + r() * 250
    if (Math.abs(x - cx) < 180) continue
    glint(g, x, y, 5 + r() * 10, 0.75)
  }
  return c
}

/* ── Nenya, the Ring of Adamant ──────────────────────────────────────── */

/**
 * Mithril, and a white stone that shines like a star, above still water: the
 * ring that kept Lórien hidden from the Eye, over the Mirror of Galadriel.
 */
export function paintNenya() {
  const W = 1000
  const H = 1000
  const [c, g] = makeCanvas(W, H)
  const r = rng(43)
  const cx = 500
  const cy = 440
  const wy = 862

  // the Mirror: still rings spreading over the water
  g.lineCap = "round"
  for (let k = 0; k < 9; k++) {
    const rx = 64 + k * 50
    g.lineWidth = 3.4 - k * 0.24
    g.strokeStyle = `rgba(196,222,255,${(0.72 - k * 0.07).toFixed(3)})`
    g.beginPath()
    g.ellipse(cx, wy, rx, rx * 0.16, 0, 0, TAU)
    g.stroke()
  }
  // starlight lying on the water beneath the ring
  g.save()
  g.globalCompositeOperation = "lighter"
  for (let k = 0; k < 26; k++) {
    const y = wy - 40 + k * 5.2 + r() * 3
    const half = (8 + r() * 46) * (1 - Math.abs(k - 9) / 22)
    g.strokeStyle = `rgba(226,238,255,${(0.2 + r() * 0.35).toFixed(3)})`
    g.lineWidth = 2 + r() * 1.5
    g.beginPath()
    g.moveTo(cx - half + (r() - 0.5) * 10, y)
    g.lineTo(cx + half + (r() - 0.5) * 10, y)
    g.stroke()
  }
  g.restore()
  glint(g, cx, wy + 4, 34, 0.9)

  // drops falling from the ring into the basin
  for (const [y, s] of [
    [704, 9],
    [766, 7],
    [814, 5.5],
  ]) {
    g.beginPath()
    g.moveTo(cx, y - s * 2.4)
    g.quadraticCurveTo(cx + s * 0.2, y - s * 0.9, cx + s, y)
    g.arc(cx, y, s, 0, Math.PI)
    g.quadraticCurveTo(cx - s * 0.2, y - s * 0.9, cx, y - s * 2.4)
    g.closePath()
    const dg = g.createRadialGradient(cx - s * 0.3, y - s * 0.3, 0, cx, y, s * 1.6)
    dg.addColorStop(0, "rgba(255,255,255,0.95)")
    dg.addColorStop(1, "rgba(170,205,245,0.75)")
    g.fillStyle = dg
    g.fill()
  }

  const sy = jewelRing(g, cx, cy, 196, 32, MITHRIL, ADAMANT, 50)
  // "I saw a star through your fingers"
  starRays(
    g,
    cx,
    sy,
    [
      [0, 330, 5],
      [Math.PI, 330, 5],
      [-Math.PI / 2, 160, 4.5],
      [Math.PI / 2, 640, 3.2],
      [Math.PI / 4, 96, 3],
      [(Math.PI * 3) / 4, 96, 3],
      [-Math.PI / 4, 96, 3],
      [(-Math.PI * 3) / 4, 96, 3],
    ],
    "225,236,255"
  )
  return c
}

/* ── Narya, the Ring of Fire ─────────────────────────────────────────── */

/** Red gold and a ruby in a crown of fire: the ring Círdan gave to Gandalf, to rekindle hearts. */
export function paintNarya() {
  const W = 900
  const H = 1100
  const [c, g] = makeCanvas(W, H)
  const r = rng(59)
  const cx = 450
  const cy = 690
  const base = 1040

  // fire is painted on its own layer and fades out towards its foot, so it rises out of nothing
  const fire = (paint: (f: CanvasRenderingContext2D) => void, fadeFrom: number, fadeTo: number) => {
    const [layer, f] = makeCanvas(W, H)
    f.globalCompositeOperation = "lighter"
    paint(f)
    f.globalCompositeOperation = "destination-out"
    const fade = f.createLinearGradient(0, fadeFrom, 0, fadeTo)
    fade.addColorStop(0, "rgba(0,0,0,0)")
    fade.addColorStop(1, "rgba(0,0,0,1)")
    f.fillStyle = fade
    f.fillRect(0, fadeFrom, W, H - fadeFrom)
    // softened a little, as flame is
    g.filter = "blur(3px)"
    g.drawImage(layer, 0, 0)
    g.filter = "none"
  }

  fire(
    (f) => {
      // red at the edges, then orange, then a white-hot heart
      tongue(f, cx, base, 960, 680, 10, 0.42, OUTER_FIRE)
      for (const [dx, h, w, lean] of [
        [-300, 420, 150, -80],
        [300, 400, 150, 86],
        [-220, 640, 180, -50],
        [230, 680, 180, 56],
        [-120, 820, 200, -26],
        [130, 800, 200, 34],
      ]) {
        tongue(f, cx + dx, base, h, w, lean, 0.5, OUTER_FIRE)
      }
      tongue(f, cx - 10, base, 840, 520, -8, 0.6, MID_FIRE)
      tongue(f, cx + 90, base, 660, 280, 34, 0.55, MID_FIRE)
      tongue(f, cx - 110, base, 620, 260, -40, 0.55, MID_FIRE)
      tongue(f, cx, base, 640, 340, 6, 0.75, CORE_FIRE)
      tongue(f, cx - 60, base, 420, 180, -14, 0.6, CORE_FIRE)
      tongue(f, cx + 70, base, 380, 170, 18, 0.6, CORE_FIRE)
      // flickers broken free above the ring
      for (const [x, y, h, w, lean] of [
        [cx - 150, 420, 160, 50, -20],
        [cx + 170, 380, 150, 44, 26],
        [cx - 50, 260, 130, 40, -12],
        [cx + 60, 200, 110, 34, 14],
        [cx - 236, 560, 120, 36, -24],
        [cx + 252, 520, 110, 34, 30],
      ]) {
        wisp(f, x, y, h, w, lean, 0.9)
      }
      // sparks
      for (let k = 0; k < 60; k++) {
        const x = cx + (r() - 0.5) * 640
        const y = 40 + r() * 560
        const s = 1.5 + r() * 3
        const sp = f.createRadialGradient(x, y, 0, x, y, s * 3)
        sp.addColorStop(0, "rgba(255,226,160,0.95)")
        sp.addColorStop(1, "rgba(255,120,40,0)")
        f.fillStyle = sp
        f.beginPath()
        f.arc(x, y, s * 3, 0, TAU)
        f.fill()
      }
    },
    base - 280,
    base - 30
  )

  jewelRing(g, cx, cy, 200, 44, RED_GOLD, RUBY, 64)

  // and fire licking up in front of the band
  fire(
    (f) => {
      for (const [dx, h, w, lean] of [
        [-170, 250, 120, -30],
        [-60, 330, 130, -8],
        [70, 310, 130, 14],
        [180, 240, 110, 30],
      ]) {
        tongue(f, cx + dx, base, h, w, lean, 0.5, MID_FIRE)
      }
    },
    base - 200,
    base - 20
  )
  return c
}

/* ── the Palantír ────────────────────────────────────────────────────── */

export function paintPalantir() {
  const [c, g] = makeCanvas(800, 900)
  const r = rng(37)
  const cx = 400
  const cy = 390
  const R = 300

  const bronze = g.createLinearGradient(cx - 230, 0, cx + 230, 0)
  bronze.addColorStop(0, "#3a2a12")
  bronze.addColorStop(0.42, "#a07a36")
  bronze.addColorStop(0.55, "#e0bb66")
  bronze.addColorStop(1, "#3a2a12")

  // the stand
  g.fillStyle = bronze
  g.beginPath()
  g.moveTo(cx - 200, 884)
  g.lineTo(cx + 200, 884)
  g.lineTo(cx + 120, 790)
  g.lineTo(cx - 120, 790)
  g.closePath()
  g.fill()
  g.fillRect(cx - 150, 776, 300, 18)

  // the stone
  const sg = g.createRadialGradient(cx - 70, cy - 90, 20, cx, cy, R)
  sg.addColorStop(0, "#2d6a8e")
  sg.addColorStop(0.4, "#13334c")
  sg.addColorStop(0.85, "#06121d")
  sg.addColorStop(1, "#02070d")
  g.beginPath()
  g.arc(cx, cy, R, 0, Math.PI * 2)
  g.fillStyle = sg
  g.fill()

  // the vision swirling inside
  g.save()
  g.beginPath()
  g.arc(cx, cy, R - 4, 0, Math.PI * 2)
  g.clip()
  g.globalCompositeOperation = "lighter"
  g.lineCap = "round"
  for (let k = 0; k < 70; k++) {
    const a0 = r() * Math.PI * 2
    const turns = 0.5 + r() * 1.1
    const hue = r()
    const col = hue < 0.55 ? "90,200,255" : hue < 0.8 ? "120,230,160" : "255,150,70"
    g.strokeStyle = `rgba(${col},${0.06 + r() * 0.12})`
    g.lineWidth = 2 + r() * 7
    g.beginPath()
    for (let s = 0; s <= 48; s++) {
      const tt = s / 48
      const ang = a0 + tt * turns * Math.PI * 2
      const rad = R * (0.08 + tt * 0.82)
      const x = cx + Math.cos(ang) * rad
      const y = cy + Math.sin(ang) * rad * 0.86
      if (s === 0) g.moveTo(x, y)
      else g.lineTo(x, y)
    }
    g.stroke()
  }
  const core = g.createRadialGradient(cx, cy, 0, cx, cy, R * 0.62)
  core.addColorStop(0, "rgba(170,230,255,0.55)")
  core.addColorStop(1, "rgba(60,140,200,0)")
  g.fillStyle = core
  g.fillRect(cx - R, cy - R, R * 2, R * 2)
  g.restore()

  // highlight and rim
  g.save()
  g.translate(cx - R * 0.38, cy - R * 0.46)
  g.rotate(-0.55)
  g.scale(1, 0.55)
  const hl = g.createRadialGradient(0, 0, 0, 0, 0, R * 0.3)
  hl.addColorStop(0, "rgba(255,255,255,0.6)")
  hl.addColorStop(1, "rgba(255,255,255,0)")
  g.fillStyle = hl
  g.beginPath()
  g.arc(0, 0, R * 0.3, 0, Math.PI * 2)
  g.fill()
  g.restore()
  g.lineWidth = 3
  g.strokeStyle = "rgba(160,215,255,0.55)"
  g.beginPath()
  g.arc(cx, cy, R - 1.5, 0, Math.PI * 2)
  g.stroke()

  // three bronze claws holding the stone
  g.strokeStyle = bronze
  g.lineCap = "round"
  g.lineWidth = 22
  for (const s of [-1, 1]) {
    g.beginPath()
    g.moveTo(cx + s * 90, 786)
    g.quadraticCurveTo(cx + s * 260, 760, cx + s * 236, cy + 150)
    g.stroke()
  }
  g.beginPath()
  g.moveTo(cx, 786)
  g.lineTo(cx, cy + R - 10)
  g.stroke()
  return c
}

/* ── the Horn of Gondor ──────────────────────────────────────────────── */

export function paintHorn() {
  const [c, g] = makeCanvas(1100, 700)
  const P = [
    [140, 470],
    [360, 640],
    [760, 600],
    [960, 230],
  ]
  const at = (t: number) => {
    const u = 1 - t
    return [
      u * u * u * P[0][0] + 3 * u * u * t * P[1][0] + 3 * u * t * t * P[2][0] + t * t * t * P[3][0],
      u * u * u * P[0][1] + 3 * u * u * t * P[1][1] + 3 * u * t * t * P[2][1] + t * t * t * P[3][1],
    ]
  }
  const tan = (t: number) => {
    const u = 1 - t
    return [
      3 * u * u * (P[1][0] - P[0][0]) + 6 * u * t * (P[2][0] - P[1][0]) + 3 * t * t * (P[3][0] - P[2][0]),
      3 * u * u * (P[1][1] - P[0][1]) + 6 * u * t * (P[2][1] - P[1][1]) + 3 * t * t * (P[3][1] - P[2][1]),
    ]
  }
  const width = (t: number) => 16 + 168 * Math.pow(t, 2.1)
  const N = 160
  const L: number[][] = []
  const Rt: number[][] = []
  const C: number[][] = []
  for (let i = 0; i <= N; i++) {
    const t = i / N
    const [x, y] = at(t)
    const [dx, dy] = tan(t)
    const l = Math.hypot(dx, dy) || 1
    const nx = -dy / l
    const ny = dx / l
    const w = width(t) / 2
    L.push([x + nx * w, y + ny * w])
    Rt.push([x - nx * w, y - ny * w])
    C.push([x, y])
  }
  const band = (i0: number, i1: number) => {
    g.beginPath()
    g.moveTo(L[i0][0], L[i0][1])
    for (let i = i0; i <= i1; i++) g.lineTo(L[i][0], L[i][1])
    for (let i = i1; i >= i0; i--) g.lineTo(Rt[i][0], Rt[i][1])
    g.closePath()
  }

  // the baldric, behind the horn
  const [sx, sy] = at(0.2)
  const [ex, ey] = at(0.84)
  g.strokeStyle = "#6b3f1d"
  g.lineWidth = 14
  g.lineCap = "round"
  g.beginPath()
  g.moveTo(sx, sy - 10)
  g.quadraticCurveTo((sx + ex) / 2 - 60, Math.min(sy, ey) - 300, ex, ey - 40)
  g.stroke()

  // ivory body
  const body = g.createLinearGradient(140, 470, 960, 230)
  body.addColorStop(0, "#f5ebd0")
  body.addColorStop(0.6, "#dfc89a")
  body.addColorStop(1, "#c1a165")
  band(0, N)
  g.fillStyle = body
  g.fill()
  // shade the lower flank
  g.beginPath()
  g.moveTo(C[0][0], C[0][1])
  for (let i = 0; i <= N; i++) g.lineTo(C[i][0], C[i][1])
  for (let i = N; i >= 0; i--) g.lineTo(L[i][0], L[i][1])
  g.closePath()
  g.fillStyle = "rgba(70,42,12,0.3)"
  g.fill()

  // silver bands
  for (const tb of [0.05, 0.3, 0.58, 0.92]) {
    const th = 0.022 + tb * 0.03
    const i0 = Math.max(0, Math.round((tb - th / 2) * N))
    const i1 = Math.min(N, Math.round((tb + th / 2) * N))
    const sg = g.createLinearGradient(L[i0][0], L[i0][1], Rt[i0][0], Rt[i0][1])
    sg.addColorStop(0, "#5d656e")
    sg.addColorStop(0.35, "#f5f7fa")
    sg.addColorStop(0.6, "#b4bcc6")
    sg.addColorStop(1, "#7d858f")
    band(i0, i1)
    g.fillStyle = sg
    g.fill()
    g.lineWidth = 2
    g.strokeStyle = "rgba(40,45,50,0.7)"
    g.stroke()
  }

  // the bell's mouth
  const [bx, by] = at(1)
  const [tx, ty] = tan(1)
  g.save()
  g.translate(bx, by)
  g.rotate(Math.atan2(ty, tx))
  g.beginPath()
  g.ellipse(0, 0, width(1) * 0.16, width(1) * 0.5, 0, 0, Math.PI * 2)
  const mg = g.createRadialGradient(0, 0, 4, 0, 0, width(1) * 0.5)
  mg.addColorStop(0, "#1c1006")
  mg.addColorStop(1, "#6a4a1c")
  g.fillStyle = mg
  g.fill()
  g.lineWidth = 6
  g.strokeStyle = "#dfe4ea"
  g.stroke()
  g.restore()

  // silver studs along the baldric
  g.fillStyle = "#e3e7ec"
  for (let k = 1; k < 8; k++) {
    const t = k / 8
    const qx = (1 - t) * (1 - t) * sx + 2 * (1 - t) * t * ((sx + ex) / 2 - 60) + t * t * ex
    const qy = (1 - t) * (1 - t) * (sy - 10) + 2 * (1 - t) * t * (Math.min(sy, ey) - 300) + t * t * (ey - 40)
    g.beginPath()
    g.arc(qx, qy, 5, 0, Math.PI * 2)
    g.fill()
  }
  return c
}

/* ── the Seven, under Durin's crown ──────────────────────────────────── */

/**
 * Durin's emblem from the Doors of Moria, the anvil, hammer and crown, with the
 * Seven Rings of the Dwarf-lords set in the arc where its seven stars shine.
 */
export function paintSeven() {
  const W = 1000
  const H = 1000
  const [c, g] = makeCanvas(W, H)
  const cx = 500
  const edge = "rgba(16,22,32,0.75)"

  // the seven rings, arched like the stars over the crown
  for (let k = 0; k < 7; k++) {
    const a = -Math.PI / 2 + (k - 3) * 0.235
    jewelRing(g, cx + Math.cos(a) * 520, 700 + Math.sin(a) * 520, 46, 12, GOLD, SEVEN_STONES[k], 15, 0.8)
  }

  g.lineJoin = "round"
  g.lineCap = "round"

  // the crown
  const crownTop = 424
  const spikes = [
    [380, 352],
    [440, 330],
    [500, 300],
    [560, 330],
    [620, 352],
  ]
  g.beginPath()
  g.moveTo(352, crownTop)
  for (const [x, y] of spikes) {
    g.lineTo(x - 26, crownTop)
    g.lineTo(x, y)
    g.lineTo(x + 26, crownTop)
  }
  g.lineTo(648, crownTop)
  g.lineTo(640, 492)
  g.quadraticCurveTo(500, 506, 360, 492)
  g.closePath()
  g.fillStyle = across(g, 340, 660, MITHRIL)
  g.fill()
  g.lineWidth = 3
  g.strokeStyle = edge
  g.stroke()
  g.lineWidth = 2
  g.strokeStyle = "rgba(255,255,255,0.45)"
  g.beginPath()
  g.moveTo(362, 446)
  g.quadraticCurveTo(500, 458, 638, 446)
  g.stroke()
  for (const [x, y] of spikes) {
    circle(g, x, y - 6, 9)
    g.fillStyle = across(g, x - 9, x + 9, MITHRIL)
    g.fill()
    g.lineWidth = 2
    g.strokeStyle = edge
    g.stroke()
  }
  gem(g, 440, 470, 12, 9, SAPPHIRE, 0.5)
  gem(g, 500, 474, 15, 11, ADAMANT, 0.7)
  gem(g, 560, 470, 12, 9, SAPPHIRE, 0.5)

  // the hammer, resting across the anvil
  g.save()
  g.translate(612, 590)
  g.rotate(0.62)
  const haft = g.createLinearGradient(-12, 0, 12, 0)
  haft.addColorStop(0, "#3c2a18")
  haft.addColorStop(0.5, "#8a6640")
  haft.addColorStop(1, "#2e2012")
  g.fillStyle = haft
  g.beginPath()
  g.rect(-11, 0, 22, 210)
  g.fill()
  g.lineWidth = 2.5
  g.strokeStyle = edge
  g.stroke()
  g.fillStyle = across(g, -86, 86, MITHRIL)
  g.beginPath()
  g.rect(-86, -40, 172, 62)
  g.fill()
  g.lineWidth = 3
  g.stroke()
  g.lineWidth = 2
  g.strokeStyle = "rgba(255,255,255,0.5)"
  g.beginPath()
  g.moveTo(-78, -32)
  g.lineTo(78, -32)
  g.stroke()
  g.restore()

  // the anvil
  g.beginPath()
  g.moveTo(222, 712)
  g.quadraticCurveTo(270, 700, 320, 700)
  g.lineTo(700, 700)
  g.lineTo(700, 744)
  g.lineTo(612, 748)
  g.quadraticCurveTo(570, 760, 566, 806)
  g.lineTo(640, 836)
  g.lineTo(650, 862)
  g.lineTo(350, 862)
  g.lineTo(360, 836)
  g.lineTo(434, 806)
  g.quadraticCurveTo(430, 760, 388, 748)
  g.lineTo(320, 744)
  g.quadraticCurveTo(268, 740, 222, 712)
  g.closePath()
  g.fillStyle = across(g, 220, 700, MITHRIL)
  g.fill()
  g.fillStyle = "rgba(10,14,22,0.18)"
  g.fill()
  g.lineWidth = 3
  g.strokeStyle = edge
  g.stroke()
  g.lineWidth = 2.5
  g.strokeStyle = "rgba(255,255,255,0.6)"
  g.beginPath()
  g.moveTo(300, 704)
  g.lineTo(694, 704)
  g.stroke()
  return c
}

/* ── the White Tree of Gondor ────────────────────────────────────────── */

export function paintTree() {
  const [c, g] = makeCanvas(820, 1000)
  const r = rng(67)
  const tips: number[][] = []
  g.lineCap = "round"
  g.lineJoin = "round"

  const grow = (x: number, y: number, ang: number, len: number, w: number, depth: number) => {
    const x2 = x + Math.cos(ang) * len
    const y2 = y + Math.sin(ang) * len
    const bend = (r() - 0.5) * len * 0.22
    const mx = (x + x2) / 2 + Math.cos(ang + Math.PI / 2) * bend
    const my = (y + y2) / 2 + Math.sin(ang + Math.PI / 2) * bend
    g.strokeStyle = depth > 6 ? "#e9e4d6" : "#f8f5ee"
    g.lineWidth = w
    g.beginPath()
    g.moveTo(x, y)
    g.quadraticCurveTo(mx, my, x2, y2)
    g.stroke()
    if (depth === 0) {
      tips.push([x2, y2])
      return
    }
    const spread = 0.34 + (9 - depth) * 0.025
    const kids = depth >= 7 ? 2 : r() < 0.3 ? 3 : 2
    for (let k = 0; k < kids; k++) {
      const off = kids === 2 ? (k === 0 ? -1 : 1) * spread : (k - 1) * spread
      // branches lean back towards the vertical, as on the banner
      const lean = (-Math.PI / 2 - ang) * 0.18
      grow(x2, y2, ang + off + lean + (r() - 0.5) * 0.2, len * (0.73 + r() * 0.07), Math.max(1.3, w * 0.66), depth - 1)
    }
  }

  // roots
  g.strokeStyle = "#e9e4d6"
  g.lineWidth = 8
  for (const s of [-1, 1]) {
    g.beginPath()
    g.moveTo(410, 930)
    g.quadraticCurveTo(410 + s * 60, 960, 410 + s * 150, 968)
    g.stroke()
  }
  grow(410, 935, -Math.PI / 2, 170, 30, 9)

  // blossom at every tip
  g.globalCompositeOperation = "lighter"
  for (const [x, y] of tips) {
    const bg = g.createRadialGradient(x, y, 0, x, y, 8)
    bg.addColorStop(0, "rgba(255,255,255,0.95)")
    bg.addColorStop(1, "rgba(200,215,255,0)")
    g.fillStyle = bg
    g.beginPath()
    g.arc(x, y, 8, 0, Math.PI * 2)
    g.fill()
  }

  // seven stars above the crown
  g.globalCompositeOperation = "source-over"
  g.fillStyle = "rgba(245,248,255,0.95)"
  let top = 1000
  for (const [, y] of tips) top = Math.min(top, y)
  const sy = Math.max(40, top - 70)
  for (let k = 0; k < 7; k++) {
    const a = -Math.PI / 2 + (k - 3) * 0.22
    star8(g, 410 + Math.cos(a) * 520, sy + 520 + Math.sin(a) * 520, 15)
  }
  return c
}

/* ── the Ring of Barahir ─────────────────────────────────────────────── */

/**
 * Two serpents with emerald eyes, their heads meeting beneath a crown of golden
 * flowers that the one upholds and the other devours: Finrod's token to
 * Barahir, and the heirloom that proved Aragorn's line.
 */
export function paintBarahir() {
  const W = 1000
  const H = 1000
  const [c, g] = makeCanvas(W, H)
  const cx = 500
  const cy = 580
  const Rm = 268
  const top = -Math.PI / 2
  const gap = 0.34
  const a0 = top + gap
  const a1 = top + TAU - gap
  const tube = 19
  const amp = 22
  const twists = 13
  const n = 1040

  // the two serpents coil round each other; A's head is where the path starts, B's where it ends
  const coil = (s: number) => {
    const pts: number[][] = []
    for (let i = 0; i <= n; i++) {
      const t = i / n
      const a = a0 + (a1 - a0) * t
      const rr = Rm + s * amp * Math.cos(t * twists * Math.PI)
      pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr])
    }
    return pts
  }
  const A = coil(1)
  const B = coil(-1)
  // a narrower neck behind the head, and a body thinning to a tail tucked under the other's head
  const girth = (t: number) => (t < 0.05 ? 0.82 + 3.6 * t : t > 0.8 ? Math.max(0, 1 - (t - 0.8) / 0.17) : 1)
  const widthA = (i: number) => tube * 2 * girth(i / n)
  const widthB = (i: number) => tube * 2 * girth(1 - i / n)
  const silver = conic(g, cx, cy, MITHRIL)

  const body = (pts: number[][], width: (i: number) => number, from: number, to: number) => {
    const seg = pts.slice(from, to + 1)
    const w = (k: number) => width(from + k)
    ribbon(g, seg, (k) => (w(k) > 0.5 ? w(k) + 4 : 0))
    g.fillStyle = "#171b22"
    g.fill()
    ribbon(g, seg, w)
    g.fillStyle = silver
    g.fill()
    // scales
    g.lineWidth = 1.4
    g.strokeStyle = "rgba(24,30,40,0.38)"
    g.beginPath()
    for (let k = 2; k < seg.length - 2; k += 5) {
      const [x, y] = seg[k]
      const dx = seg[k + 1][0] - seg[k - 1][0]
      const dy = seg[k + 1][1] - seg[k - 1][1]
      const l = Math.hypot(dx, dy) || 1
      const tx = dx / l
      const ty = dy / l
      const h = w(k) * 0.36
      g.moveTo(x - ty * h, y + tx * h)
      g.quadraticCurveTo(x + tx * h * 0.9, y + ty * h * 0.9, x + ty * h, y - tx * h)
    }
    g.stroke()
    ribbon(g, seg, (k) => w(k) * 0.26)
    g.fillStyle = "rgba(255,255,255,0.42)"
    g.fill()
  }
  // between each pair of widest points the coils cross once; the serpents take turns lying on top
  for (let j = 0; j < twists; j++) {
    const from = Math.round((j / twists) * n)
    const to = Math.round(((j + 1) / twists) * n)
    const [under, over] = j % 2 === 0 ? [B, A] : [A, B]
    body(under, under === A ? widthA : widthB, from, to)
    body(over, over === A ? widthA : widthB, from, to)
  }

  // the crown of golden flowers, and the light it gives
  haze(g, cx, 250, 150, "255,200,90", 0.32)
  g.lineCap = "round"
  g.lineWidth = 12
  g.strokeStyle = "#5c3a08"
  g.beginPath()
  g.moveTo(408, 272)
  g.quadraticCurveTo(500, 246, 592, 272)
  g.stroke()
  g.lineWidth = 8
  g.strokeStyle = across(g, 408, 592, GOLD)
  g.stroke()
  const flower = (x: number, y: number, s: number) => {
    for (let p = 0; p < 5; p++) {
      g.save()
      g.translate(x, y)
      g.rotate((p / 5) * TAU)
      g.beginPath()
      g.ellipse(0, -s * 0.6, s * 0.36, s * 0.6, 0, 0, TAU)
      const pg = g.createLinearGradient(0, 0, 0, -s * 1.2)
      pg.addColorStop(0, "#9a6510")
      pg.addColorStop(0.5, "#f2c255")
      pg.addColorStop(1, "#fff0b8")
      g.fillStyle = pg
      g.fill()
      g.lineWidth = 1.4
      g.strokeStyle = "rgba(80,45,0,0.6)"
      g.stroke()
      g.restore()
    }
    circle(g, x, y, s * 0.26)
    const hg = g.createRadialGradient(x - s * 0.08, y - s * 0.08, 0, x, y, s * 0.26)
    hg.addColorStop(0, "#fff6d0")
    hg.addColorStop(1, "#b07a18")
    g.fillStyle = hg
    g.fill()
  }
  for (const [d, s] of [
    [-86, 19],
    [86, 19],
    [-44, 23],
    [44, 23],
    [0, 27],
  ]) {
    flower(cx + d, 252 - (86 - Math.abs(d)) * 0.22, s)
  }

  // the heads, beneath the crown: one holds it up, the other bites at it
  const head = (x: number, y: number, ang: number, open: boolean) => {
    const T = tube * 1.25
    g.save()
    g.translate(x, y)
    g.rotate(ang)
    g.beginPath()
    g.moveTo(-T * 0.3, -T * 0.82)
    g.bezierCurveTo(T * 0.9, -T * 1.3, T * 2.2, -T * 1.05, T * 3.1, -T * 0.28)
    if (open) {
      g.lineTo(T * 1.7, T * 0.02)
      g.lineTo(T * 2.8, T * 0.78)
    } else {
      g.quadraticCurveTo(T * 3.35, 0, T * 3.1, T * 0.28)
    }
    g.bezierCurveTo(T * 2.2, T * 1.05, T * 0.9, T * 1.3, -T * 0.3, T * 0.82)
    g.closePath()
    const hg = g.createLinearGradient(0, -T * 1.3, 0, T * 1.3)
    hg.addColorStop(0, "#f4f8ff")
    hg.addColorStop(0.45, "#aab5c4")
    hg.addColorStop(1, "#4b5361")
    g.fillStyle = hg
    g.fill()
    g.lineWidth = 3.5
    g.strokeStyle = "#171b22"
    g.stroke()
    g.lineWidth = 1.5
    g.strokeStyle = "rgba(255,255,255,0.5)"
    g.beginPath()
    g.moveTo(T * 0.4, -T * 0.6)
    g.quadraticCurveTo(T * 1.8, -T * 0.85, T * 2.8, -T * 0.3)
    g.stroke()
    g.restore()
    // an emerald eye
    const ex = x + Math.cos(ang) * T * 1.6 - Math.sin(ang) * -T * 0.42
    const ey = y + Math.sin(ang) * T * 1.6 + Math.cos(ang) * -T * 0.42
    haze(g, ex, ey, T * 1.6, "40,230,130", 0.55)
    circle(g, ex, ey, T * 0.3)
    const eg = g.createRadialGradient(ex - T * 0.1, ey - T * 0.1, 0, ex, ey, T * 0.3)
    eg.addColorStop(0, "#d6ffe9")
    eg.addColorStop(0.5, "#1fc46e")
    eg.addColorStop(1, "#04351c")
    g.fillStyle = eg
    g.fill()
  }
  const dirA = Math.atan2(A[0][1] - A[6][1], A[0][0] - A[6][0])
  const dirB = Math.atan2(B[n][1] - B[n - 6][1], B[n][0] - B[n - 6][0])
  head(A[0][0], A[0][1], dirA + 0.32, true)
  head(B[n][0], B[n][1], dirB - 0.36, false)
  return c
}

/* ── the Rings of Power ──────────────────────────────────────────────── */

/** Three for the Elven-kings, Seven for the Dwarf-lords, Nine for Mortal Men, and the One among them. */
export function paintRingsOfPower() {
  const W = 1000
  const H = 1000
  const [c, g] = makeCanvas(W, H)
  const r = rng(1937)
  const cx = 500
  const cy = 500

  // their orbits
  g.lineWidth = 1.6
  g.lineCap = "round"
  g.setLineDash([2, 10])
  for (const [orbit, a] of [
    [176, 0.42],
    [292, 0.34],
    [404, 0.26],
  ]) {
    g.strokeStyle = `rgba(244,214,150,${a})`
    circle(g, cx, cy, orbit)
    g.stroke()
  }
  g.setLineDash([])

  // the Ring's inscription round them all, glowing as if from the fire
  const gh = 30
  const rad = 458
  const glyphs: { a: number; glyph: Glyph }[] = []
  let th = -Math.PI / 2
  while (th < Math.PI * 1.5 - 0.06) {
    const glyph = r() < 0.1 ? null : makeGlyph(r)
    const adv = ((glyph ? glyph.w : 0.45) * gh + gh * 0.22) / rad
    if (glyph && th + adv < Math.PI * 1.5 - 0.02) glyphs.push({ a: th + adv / 2, glyph })
    th += adv
  }
  g.lineJoin = "round"
  for (const pass of [0, 1]) {
    g.shadowColor = pass === 0 ? "rgba(255,70,0,.95)" : "transparent"
    g.shadowBlur = pass === 0 ? 16 : 0
    g.strokeStyle = g.fillStyle = pass === 0 ? "#ff6a12" : "#ffd98a"
    for (const { a, glyph } of glyphs) {
      g.save()
      g.translate(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad)
      g.rotate(a + Math.PI / 2)
      g.translate((-glyph.w * gh) / 2, 0)
      g.lineWidth = gh * (pass === 0 ? 0.085 : 0.04)
      glyph.draw(g, gh)
      g.restore()
    }
  }
  g.shadowBlur = 0

  // the Nine, cold iron
  for (let k = 0; k < 9; k++) {
    const a = -Math.PI / 2 + ((k + 0.5) / 9) * TAU
    const x = cx + Math.cos(a) * 404
    const y = cy + Math.sin(a) * 404 + 10
    haze(g, x, y - 6, 62, "170,190,225", 0.16)
    jewelRing(g, x, y, 28, 7.5, IRON, null)
  }
  // the Seven
  for (let k = 0; k < 7; k++) {
    const a = -Math.PI / 2 + ((k + 0.5) / 7) * TAU
    jewelRing(g, cx + Math.cos(a) * 292, cy + Math.sin(a) * 292 + 12, 32, 8.5, GOLD, SEVEN_STONES[k], 10, 0.7)
  }
  // the Three: Vilya, Nenya and Narya
  const three: [Stops, Stone][] = [
    [GOLD, SAPPHIRE],
    [MITHRIL, ADAMANT],
    [RED_GOLD, RUBY],
  ]
  three.forEach(([metal, stone], k) => {
    const a = -Math.PI / 2 + (k / 3) * TAU
    jewelRing(g, cx + Math.cos(a) * 176, cy + Math.sin(a) * 176 + 14, 40, 10, metal, stone, 13)
  })
  // and the One, still hot from the fire
  haze(g, cx, cy, 170, "255,110,30", 0.4)
  standingRing(g, cx, cy + 14, 86, 20, GOLD)
  return c
}

/* ── sampling ────────────────────────────────────────────────────────── */

/**
 * Lays a jittered grid over the painted pixels, then trims or repeats points
 * until there are exactly as many as there are particles. Points are sorted
 * by angle round the middle, so particle k sits on the same side of every
 * emblem and the shapes pour into each other instead of scrambling.
 */
export function sampleEmblem(image: HTMLCanvasElement, rows: number, seed: number): Emblem {
  const n = TEX_W * rows
  const W = image.width
  const H = image.height
  const g = image.getContext("2d", { willReadFrequently: true })!
  const data = g.getImageData(0, 0, W, H).data
  const r = rng(seed)

  let painted = 0
  for (let i = 3; i < data.length; i += 12) if (data[i] > 26) painted++
  painted *= 3
  const coverage = painted / (W * H)
  const step = Math.max(1, Math.sqrt(painted / (n * 1.1)))

  const xs: number[] = []
  const ys: number[] = []
  const as: number[] = []
  for (let y = step / 2; y < H; y += step) {
    for (let x = step / 2; x < W; x += step) {
      const px = Math.min(W - 1, Math.max(0, Math.round(x + (r() - 0.5) * step * 0.9)))
      const py = Math.min(H - 1, Math.max(0, Math.round(y + (r() - 0.5) * step * 0.9)))
      const a = data[(py * W + px) * 4 + 3] / 255
      if (a < 0.1) continue
      if (a < 0.5 && r() > a * 2) continue
      xs.push(px)
      ys.push(py)
      as.push(a)
    }
  }
  const count = xs.length
  const pick: number[] = []
  if (count === 0) {
    xs.push(W / 2)
    ys.push(H / 2)
    as.push(1)
    for (let i = 0; i < n; i++) pick.push(0)
  } else {
    const order = Array.from({ length: count }, (_, i) => i)
    for (let i = count - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1))
      const tmp = order[i]
      order[i] = order[j]
      order[j] = tmp
    }
    for (let i = 0; i < n; i++) pick.push(i < count ? order[i] : order[Math.floor(r() * count)])
  }
  const angle = (i: number) => Math.atan2(ys[i] / H - 0.5, xs[i] / W - 0.5)
  pick.sort((a, b) => angle(a) - angle(b))

  const home = new Float32Array(n * 4)
  const color = new Uint8Array(n * 4)
  for (let k = 0; k < n; k++) {
    const i = pick[k]
    const repeat = k >= count
    const jx = (r() - 0.5) * (repeat ? 1.6 : 0.6)
    const jy = (r() - 0.5) * (repeat ? 1.6 : 0.6)
    home[k * 4] = (xs[i] + 0.5 + jx) / W
    home[k * 4 + 1] = (ys[i] + 0.5 + jy) / H
    home[k * 4 + 2] = r()
    home[k * 4 + 3] = (0.85 + r() * 0.3) * (0.55 + 0.45 * as[i])
    const p = (Math.round(ys[i]) * W + Math.round(xs[i])) * 4
    color[k * 4] = data[p]
    color[k * 4 + 1] = data[p + 1]
    color[k * 4 + 2] = data[p + 2]
    color[k * 4 + 3] = 255
  }
  return { image, home, color, coverage }
}

export const PAINTERS = [paintRing, paintVilya, paintNenya, paintNarya, paintPalantir, paintHorn, paintSeven, paintTree, paintBarahir, paintRingsOfPower]

const nextFrame = () => new Promise<void>((res) => requestAnimationFrame(() => setTimeout(res, 0)))

let pending: Promise<Emblem[]> | null = null
let done = 0
const listeners = new Set<(p: number) => void>()

/**
 * Paints and samples every emblem, a frame apart so the preloader keeps
 * moving. The work happens once; every caller hears the progress.
 */
export function buildEmblems(rows: number, onProgress: (p: number) => void) {
  listeners.add(onProgress)
  onProgress(done / PAINTERS.length)
  if (!pending) {
    pending = (async () => {
      const out: Emblem[] = []
      for (let i = 0; i < PAINTERS.length; i++) {
        await nextFrame()
        out.push(sampleEmblem(PAINTERS[i](), rows, 101 + i))
        done = i + 1
        for (const l of listeners) l(done / PAINTERS.length)
      }
      return out
    })()
  }
  return { emblems: pending, stop: () => listeners.delete(onProgress) }
}
