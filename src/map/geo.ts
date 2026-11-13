/**
 * The geometry of the map: coast, rivers, mountains, woods and the red road,
 * all worked out once from a handful of hand-placed points. Nothing here
 * touches the DOM; MapStage draws what this file describes.
 *
 * Map units are arbitrary: the Shire is near (1290, 560), Mordor near
 * (2500, 1250), and one unit is roughly a mile and a bit.
 */
import { ROAD, STOPS, type Pt } from "../motion/world"

/** a small seeded generator, so the map is drawn the same way every time */
export function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** phones get a lighter drawing: fewer trees, plainer peaks */
const lite = typeof matchMedia === "function" && matchMedia("(max-width: 639px)").matches

const n = (v: number) => String(Math.round(v * 10) / 10)

export function d(pts: Pt[], close = false) {
  let s = ""
  for (let i = 0; i < pts.length; i++) s += (i ? "L" : "M") + n(pts[i][0]) + " " + n(pts[i][1])
  return close ? s + "Z" : s
}

/** A Catmull-Rom curve through the points, as a dense polyline. at[i] is where control point i landed. */
export function smooth(pts: Pt[], step = 10): { pts: Pt[]; at: number[] } {
  const out: Pt[] = [pts[0]]
  const at = [0]
  const cr = (a: number, b: number, c: number, e: number, t: number) =>
    0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - e) * t * t + (3 * b - a - 3 * c + e) * t * t * t)
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(pts.length - 1, i + 2)]
    const k = Math.max(1, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / step))
    for (let j = 1; j <= k; j++) {
      const t = j / k
      out.push([cr(p0[0], p1[0], p2[0], p3[0], t), cr(p0[1], p1[1], p2[1], p3[1], t)])
    }
    at.push(out.length - 1)
  }
  return { pts: out, at }
}

/**
 * A long line cut into short strokes. The map is painted in tiles, and a tile
 * has to consider the whole of every path that might cross it, so no stroke
 * should span the map.
 */
export function pieces(pts: Pt[], size = 36): string[] {
  const out: string[] = []
  for (let i = 0; i < pts.length - 1; i += size) out.push(d(pts.slice(i, i + size + 1)))
  return out
}

/** the wobble of a pen held by hand */
function rough(pts: Pt[], r: () => number, amp: number): Pt[] {
  return pts.map((p, i) => (i === 0 || i === pts.length - 1 ? p : [p[0] + (r() - 0.5) * 2 * amp, p[1] + (r() - 0.5) * 2 * amp]))
}

function inside(poly: Pt[], x: number, y: number) {
  let hit = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]
    const [xj, yj] = poly[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit
  }
  return hit
}

const pen = (pts: Pt[], seed: number, step = 8, amp = 1.2) => d(rough(smooth(pts, step).pts, rng(seed), amp))

/** the part of the world that is drawn at all */
export const REGION = { x: -300, y: -560, w: 4100, h: 2900 }

/* ------------------------------------------------------------------ coast */

/** The western shore, north to south; everything east of it is land. */
const SHORE: Pt[] = [
  [1100, -900], [1080, -520], [1020, -330], [1070, -190], [1190, -130], [1300, -60], [1260, 20], [1130, 30],
  [1020, 90], [950, 190], [912, 310], [900, 420], [925, 490], [975, 516], [1030, 524], [1076, 540],
  [1092, 568], [1074, 596], [1024, 606], [968, 614], [925, 640], [902, 710], [905, 800], [940, 880],
  [1000, 940], [1070, 975], [1150, 992], [1230, 1020], [1300, 1058], [1332, 1110], [1318, 1175], [1272, 1228],
  [1232, 1292], [1262, 1338], [1340, 1312], [1430, 1276], [1530, 1282], [1620, 1318], [1700, 1372], [1748, 1352],
  [1820, 1334], [1920, 1368], [2010, 1412], [2052, 1446], [2040, 1510], [1996, 1590], [1962, 1664], [2020, 1706],
  [1990, 1764], [1934, 1840], [1904, 1960], [1890, 2200], [1880, 2700],
]

const shore = rough(smooth(SHORE, 9).pts, rng(11), 1.5)
const land: Pt[] = [...shore, [4600, 2700], [4600, -900]]

/** the land, as one shape to fill, and its shore as strokes */
export const COAST = d(land, true)
export const SHORELINE = pieces(shore)
/** the Sea, as its own shape: it is painted over the land's washes, so they need no clipping */
export const SEA = d([...shore, [-1400, 2700], [-1400, -900]], true)
export const onLand = (x: number, y: number) => inside(land, x, y)

/**
 * The water-lines a mapmaker draws along a shore: the coast repeated a little
 * way out to sea. Points that would land too near another stretch of coast
 * (inside a bay narrower than the line is far) are left out.
 */
function lining(dist: number, seed: number): string[] {
  const r = rng(seed)
  const out: string[] = []
  let run: Pt[] = []
  const flush = () => {
    if (run.length > 1) out.push(...pieces(run))
    run = []
  }
  for (let i = 2; i < shore.length - 2; i++) {
    const dx = shore[i + 2][0] - shore[i - 2][0]
    const dy = shore[i + 2][1] - shore[i - 2][1]
    const len = Math.hypot(dx, dy) || 1
    // the shore runs north to south with the land on the east, so the sea is on its right hand
    const x = shore[i][0] - (dy / len) * dist + (r() - 0.5) * 1.2
    const y = shore[i][1] + (dx / len) * dist + (r() - 0.5) * 1.2
    let near = false
    for (let j = 0; j < shore.length && !near; j += 2) near = Math.hypot(shore[j][0] - x, shore[j][1] - y) < dist - 2.4
    if (near) continue
    const last = run[run.length - 1]
    if (last && Math.hypot(x - last[0], y - last[1]) > dist * 2.5 + 20) flush()
    run.push([x, y])
  }
  flush()
  return out
}

/** little waves, scattered over open water */
function waves(): string[] {
  const r = rng(5)
  const patches = new Map<string, string>()
  for (let y = -420; y < 2100; y += 64) {
    for (let x = 380; x < 3100; x += 104) {
      const px = x + (r() - 0.5) * 70
      const py = y + (r() - 0.5) * 40
      if (r() < 0.3) continue
      let clear = !onLand(px, py)
      for (let a = 0; clear && a < 8; a++) clear = !onLand(px + Math.cos(a * 0.785) * 44, py + Math.sin(a * 0.785) * 44)
      if (!clear) continue
      const w = 5 + r() * 3
      const key = Math.floor(px / 420) + ":" + Math.floor(py / 420)
      patches.set(key, (patches.get(key) ?? "") + `M${n(px - w)} ${n(py)}q${n(w / 2)} -3 ${n(w)} 0t${n(w)} 0`)
    }
  }
  return [...patches.values()]
}

/* ----------------------------------------------------------------- waters */

const RIVERS: { name: string; pts: Pt[]; wide?: boolean }[] = [
  {
    name: "anduin",
    wide: true,
    pts: [
      [2040, 60], [2050, 200], [2030, 340], [2040, 480], [2065, 620], [2090, 760], [2110, 880], [2150, 980],
      [2200, 1050], [2262, 1110], [2284, 1180], [2262, 1262], [2190, 1340], [2110, 1400], [2052, 1446],
    ],
  },
  { name: "brandywine", pts: [[1322, 365], [1370, 470], [1398, 560], [1392, 640], [1340, 760], [1240, 880], [1160, 960], [1150, 992]] },
  { name: "greyflood", pts: [[1650, 330], [1632, 450], [1640, 555], [1620, 650], [1580, 760], [1500, 880], [1400, 990], [1300, 1058]] },
  { name: "bruinen", pts: [[1790, 520], [1752, 540], [1700, 556], [1660, 640], [1612, 700], [1600, 708]] },
  { name: "glanduin", pts: [[1810, 890], [1700, 850], [1600, 830], [1536, 826]] },
  { name: "sirannon", pts: [[1830, 852], [1760, 862], [1700, 850]] },
  { name: "isen", pts: [[1790, 1060], [1700, 1100], [1560, 1120], [1430, 1100], [1332, 1110]] },
  { name: "silverlode", pts: [[1935, 812], [2000, 838], [2098, 820]] },
  { name: "entwash", pts: [[1990, 985], [2080, 1040], [2170, 1090], [2262, 1110]] },
  { name: "lune", pts: [[1110, 290], [1100, 420], [1094, 540], [1091, 562]] },
  { name: "running", pts: [[2480, 240], [2472, 300], [2520, 400], [2620, 470], [2760, 520], [2900, 600]] },
  { name: "forest", pts: [[2300, 330], [2380, 320], [2462, 318]] },
  { name: "gladden", pts: [[1905, 640], [1980, 650], [2068, 640]] },
  { name: "poros", pts: [[2360, 1440], [2280, 1400], [2200, 1338]] },
]

function blob(cx: number, cy: number, rx: number, ry: number, seed: number) {
  const r = rng(seed)
  const pts: Pt[] = []
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2
    const k = 0.82 + r() * 0.3
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k])
  }
  pts.push(pts[0], pts[1], pts[2])
  const s = smooth(pts, 5)
  // drop the lead-in and lead-out, which exist only to make the curve close smoothly
  return d(s.pts.slice(s.at[1], s.at[10] + 1), true)
}

/* -------------------------------------------------------------- mountains */

interface Range {
  spine: Pt[]
  /** where the lesser peaks stand, either side of the spine */
  flank: Pt
  gap: number
  /** width of the great peaks, smallest to largest */
  w: Pt
  /** which stone they are painted in */
  kind: string
  snow?: boolean
}

const RANGES: Range[] = [
  // the Misty Mountains
  { spine: [[1760, 110], [1805, 300], [1835, 480], [1860, 640], [1900, 800], [1890, 900], [1840, 1000]], flank: [24, 6], gap: 18, w: [34, 50], kind: "misty" },
  // Angmar
  { spine: [[1740, 100], [1640, 90], [1560, 130]], flank: [8, 14], gap: 24, w: [30, 42], kind: "grey" },
  // the Grey Mountains
  { spine: [[1810, 70], [2000, 50], [2200, 70], [2400, 60]], flank: [10, 15], gap: 23, w: [30, 44], kind: "grey" },
  // the White Mountains
  { spine: [[1420, 1228], [1540, 1215], [1700, 1236], [1850, 1216], [2000, 1212], [2140, 1200]], flank: [10, 17], gap: 19, w: [32, 48], kind: "white" },
  // the Blue Mountains, north and south of the Gulf
  { spine: [[1040, 120], [1020, 300], [1030, 436]], flank: [18, 6], gap: 21, w: [28, 40], kind: "blue" },
  { spine: [[985, 696], [1010, 800], [1060, 900]], flank: [18, 6], gap: 21, w: [28, 40], kind: "blue" },
  // the fences of Mordor: Ered Lithui and Ephel Dúath
  { spine: [[2330, 1075], [2460, 1050], [2600, 1060], [2740, 1080]], flank: [8, 14], gap: 20, w: [32, 46], kind: "mordor" },
  { spine: [[2338, 1110], [2345, 1200], [2335, 1330], [2380, 1420], [2520, 1450], [2680, 1440]], flank: [16, 8], gap: 20, w: [32, 46], kind: "mordor" },
  // the Iron Hills
  { spine: [[2640, 240], [2740, 250]], flank: [6, 10], gap: 22, w: [24, 32], kind: "grey" },
]

export interface Peak {
  y: number
  kind: string
  /** the whole mountain, in its sunlit colour, with its outline */
  lit: string
  /** its eastern face, in shadow */
  shade: string
  snow?: string
}

const quad = (p0: Pt, c: Pt, p1: Pt, t: number): Pt => [
  (1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * c[0] + t * t * p1[0],
  (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * c[1] + t * t * p1[1],
]
const at = (p: Pt) => n(p[0]) + " " + n(p[1])

/** One mountain, the way an illustrator draws it: a lit western face, a shadowed eastern one, a broken ridge between. */
function peak(x: number, y: number, w: number, h: number, r: () => number, kind: string, snow: boolean): Peak {
  const L: Pt = [x - w / 2, y]
  const R: Pt = [x + w / 2, y]
  const A: Pt = [x + (r() - 0.5) * w * 0.14, y - h]
  const cl: Pt = [x - w * 0.2, y - h * 0.46]
  const cr: Pt = [x + w * 0.19, y - h * 0.44]
  const r1: Pt = [A[0] - w * 0.06, y - h * 0.62]
  const r2: Pt = [A[0] + w * 0.09, y - h * 0.34]
  const m: Pt = [x + w * 0.05, y]
  const lit = `M${at(L)}Q${at(cl)} ${at(A)}Q${at(cr)} ${at(R)}`
  const shade = `M${at(A)}L${at(r1)}L${at(r2)}L${at(m)}L${at(R)}Q${at(cr)} ${at(A)}Z`
  let cap: string | undefined
  if (snow) {
    const pl = quad(L, cl, A, 0.66)
    const pr = quad(A, cr, R, 0.3)
    cap = `M${at(A)}L${at(pl)}L${n(A[0] - w * 0.07)} ${n(y - h * 0.74)}L${n(A[0] - w * 0.01)} ${n(y - h * 0.62)}L${n(A[0] + w * 0.06)} ${n(y - h * 0.76)}L${at(pr)}Z`
  }
  return { y, kind, lit, shade, snow: cap }
}

function mountains(): Peak[] {
  const r = rng(23)
  const peaks: Peak[] = []
  // the places on the road keep a clearing around them
  const clear = (x: number, y: number) => STOPS.every((s) => Math.abs(x - s.at[0]) > 70 || y < s.at[1] - 44 || y > s.at[1] + 70)
  const add = (x: number, y: number, w: number, kind: string, snow: boolean) => {
    if (clear(x, y)) peaks.push(peak(x, y + w * 0.28, w, w * (0.72 + r() * 0.16), r, kind, snow))
  }
  for (const range of RANGES) {
    const line = smooth(range.spine, 4).pts
    let run = range.gap
    let side = 1
    for (let i = 1; i < line.length; i++) {
      run += Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1])
      if (run < range.gap) continue
      run = 0
      side = -side
      const [x, y] = line[i]
      const w = range.w[0] + r() * (range.w[1] - range.w[0])
      // a great peak on the spine, and a lesser one at its shoulder
      add(x + (r() - 0.5) * 10, y + (r() - 0.5) * 8, w, range.kind, !!range.snow && w > (range.w[0] + range.w[1]) / 2 - 4)
      add(x + side * range.flank[0] + (r() - 0.5) * 8, y + side * range.flank[1] + 6, w * (0.5 + r() * 0.14), range.kind, false)
      if (!lite && r() < 0.5) add(x - side * range.flank[0] * 0.9, y - side * range.flank[1] * 0.8 + 4, w * (0.42 + r() * 0.12), range.kind, false)
    }
  }
  // the Lonely Mountain
  peaks.push(peak(2480, 240, 84, 70, r, "lonely", true))
  peaks.sort((p, q) => p.y - q.y)
  return peaks
}

/** low, rounded country: the downs and the broken hills */
const HILLS: [number, number, number][] = [
  [1600, 470, 30], [1588, 498, 26], [1606, 526, 28], // the Weather Hills
  [1440, 630, 26], [1462, 644, 22], [1428, 648, 20], // the Barrow-downs
  [1175, 588, 26], [1156, 578, 20], [1196, 576, 20], // the Tower Hills
  [1500, 400, 28], [1528, 388, 24], [1478, 384, 22], // the North Downs
  [2180, 1012, 30], [2208, 1000, 26], [2160, 992, 24], [2196, 984, 22], // the Emyn Muil
  [2340, 880, 28], [2380, 868, 24], [2420, 884, 26], // the Brown Lands
  [1700, 1180, 20], [1560, 1190, 20],
  [2300, 470, 26], [2326, 462, 22], // the Mountains of Mirkwood
]

function hills() {
  let s = ""
  for (const [x, y, k] of HILLS) {
    const w = k * 1.25
    s += `M${n(x - w / 2)} ${n(y)}C${n(x - w * 0.3)} ${n(y - w * 0.55)} ${n(x + w * 0.18)} ${n(y - w * 0.6)} ${n(x + w / 2)} ${n(y)}M${n(x + w * 0.1)} ${n(y - w * 0.26)}l${n(w * 0.14)} ${n(w * 0.14)}M${n(x + w * 0.2)} ${n(y - w * 0.3)}l${n(w * 0.12)} ${n(w * 0.16)}`
  }
  return s
}

/** the Dead Marshes and the Gladden Fields: broken rushes */
function marsh() {
  const r = rng(41)
  let s = ""
  const patches: [number, number, number, number][] = [
    [2312, 1020, 50, 30],
    [2060, 646, 30, 16],
    [2230, 1086, 34, 14],
  ]
  for (const [cx, cy, rx, ry] of patches) {
    for (let i = 0; i < rx * 0.42; i++) {
      const x = cx + (r() - 0.5) * 2 * rx
      const y = cy + (r() - 0.5) * 2 * ry
      const w = 5 + r() * 6
      s += `M${n(x)} ${n(y)}h${n(w)}M${n(x + w * 0.3)} ${n(y)}v-3M${n(x + w * 0.6)} ${n(y)}v-4`
    }
  }
  return s
}

/* ------------------------------------------------------------------ woods */

interface Wood {
  name: string
  poly: Pt[]
  step: number
  size: number
  pine?: boolean
}

const box = (x0: number, y0: number, x1: number, y1: number): Pt[] => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]

const WOODS: Wood[] = [
  {
    name: "mirkwood",
    poly: [[2150, 215], [2260, 190], [2380, 230], [2430, 330], [2400, 430], [2440, 540], [2420, 660], [2350, 760], [2240, 790], [2170, 720], [2140, 600], [2160, 470], [2120, 350]],
    step: 20,
    size: 1.9,
  },
  { name: "fangorn", poly: [[1892, 912], [1960, 900], [1996, 940], [1990, 1000], [1930, 1010], [1886, 970]], step: 13, size: 1.45 },
  { name: "lorien", poly: [[1990, 800], [2050, 790], [2082, 830], [2060, 872], [2000, 868], [1980, 836]], step: 13, size: 1.45 },
  { name: "oldforest", poly: [[1414, 584], [1456, 578], [1474, 614], [1462, 650], [1424, 646], [1408, 614]], step: 10, size: 1 },
  { name: "trollshaws", poly: box(1646, 458, 1680, 528), step: 12, size: 1.05, pine: true },
  { name: "druadan", poly: box(2084, 1128, 2132, 1158), step: 10, size: 0.95 },
  { name: "ithilien", poly: [[2296, 1140], [2326, 1140], [2322, 1300], [2286, 1300], [2300, 1220]], step: 12, size: 1, pine: true },
  { name: "erynvorn", poly: box(1136, 944, 1180, 972), step: 10, size: 0.95 },
  { name: "chetwood", poly: box(1492, 548, 1534, 574), step: 10, size: 0.95 },
  { name: "woodyend", poly: box(1318, 630, 1366, 656), step: 10, size: 0.95 },
  { name: "forlindon", poly: box(960, 330, 1000, 420), step: 13, size: 1, pine: true },
  { name: "harlindon", poly: box(940, 700, 978, 790), step: 13, size: 1 },
  { name: "firien", poly: box(2040, 1150, 2076, 1172), step: 10, size: 0.9 },
]

/** one path per row of trees, back row first, so nearer trees stand in front */
function wood(w: Wood, seed: number): string[] {
  const r = rng(seed)
  const step = w.step * (lite ? 1.35 : 1)
  const k = w.size * (lite ? 1.15 : 1)
  const xs = w.poly.map((p) => p[0])
  const ys = w.poly.map((p) => p[1])
  const rows: string[] = []
  let odd = false
  for (let y = Math.min(...ys); y <= Math.max(...ys); y += step * 0.72) {
    let s = ""
    odd = !odd
    for (let x = Math.min(...xs) + (odd ? step / 2 : 0); x <= Math.max(...xs); x += step) {
      const px = x + (r() - 0.5) * step * 0.5
      const py = y + (r() - 0.5) * step * 0.3
      if (!inside(w.poly, px, py)) continue
      s += w.pine
        ? // a fir, in two tiers
          `M${n(px - 4 * k)} ${n(py)}L${n(px)} ${n(py - 6.5 * k)}L${n(px + 4 * k)} ${n(py)}ZM${n(px - 3 * k)} ${n(py - 4.4 * k)}L${n(px)} ${n(py - 12 * k)}L${n(px + 3 * k)} ${n(py - 4.4 * k)}ZM${n(px)} ${n(py)}v${n(3 * k)}`
        : // a round-headed tree: three lobes of leaf on a short trunk
          `M${n(px - 4.2 * k)} ${n(py)}a${n(2.9 * k)} ${n(2.9 * k)} 0 0 1 ${n(k)} ${n(-5.2 * k)}a${n(3.8 * k)} ${n(3.8 * k)} 0 0 1 ${n(6.4 * k)} 0a${n(2.9 * k)} ${n(2.9 * k)} 0 0 1 ${n(k)} ${n(5.2 * k)}ZM${n(px)} ${n(py)}v${n(3.4 * k)}`
    }
    if (s) rows.push(s)
  }
  return rows
}

/* ------------------------------------------------------------------ roads */

const WAYS: Pt[][] = [
  // from the Havens to the Shire
  [[1096, 582], [1180, 600], [1240, 606], [1290, 612]],
  // the Greenway and the old South Road, from Fornost down to the Gap of Rohan
  [[1470, 420], [1478, 520], [1480, 594], [1490, 760], [1500, 880], [1640, 1010], [1790, 1090], [1880, 1118], [1958, 1120]],
  // the Old Forest Road, across Mirkwood
  [[1900, 520], [2040, 500], [2160, 500], [2420, 500]],
]

/* --------------------------------------------------------------- the road */

function road() {
  const ctrl: Pt[] = [ROAD.from]
  const doorAt = [0]
  for (const leg of ROAD.legs) {
    ctrl.push(...leg)
    doorAt.push(ctrl.length - 1)
  }
  const line = smooth(ctrl, 4)
  const pts = line.pts
  const cum = new Float32Array(pts.length)
  for (let i = 1; i < pts.length; i++) cum[i] = cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])
  const total = cum[cum.length - 1]
  return {
    d: d(pts),
    /** the same road in short strokes, for the dotted line of the way ahead */
    pieces: pieces(pts, 40),
    total,
    /** how far along the road each stop's door is */
    doors: doorAt.map((i) => cum[line.at[i]]),
    /** the point a given distance along the road */
    at(dist: number): Pt {
      const want = Math.min(total, Math.max(0, dist))
      let lo = 0
      let hi = pts.length - 1
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1
        if (cum[mid] <= want) lo = mid
        else hi = mid
      }
      const span = cum[hi] - cum[lo] || 1
      const t = (want - cum[lo]) / span
      return [pts[lo][0] + (pts[hi][0] - pts[lo][0]) * t, pts[lo][1] + (pts[hi][1] - pts[lo][1]) * t]
    },
  }
}

export const ROUTE = road()

export const MAP = {
  waves: waves(),
  lining: [lining(7, 71), lining(16, 72), lining(27, 73)],
  /** two bands of paler water along the shore: [how far out, how wide] */
  shallows: [lining(31, 81), lining(13, 82)],
  rivers: RIVERS.map((r, i) => ({ name: r.name, wide: !!r.wide, d: pen(r.pts, 60 + i, 7, 1.1) })),
  lakes: [blob(1310, 340, 26, 15, 3), blob(2468, 300, 8, 20, 4), blob(2560, 1350, 50, 22, 6), blob(1836, 866, 15, 6, 8)],
  peaks: mountains(),
  hills: hills(),
  marsh: marsh(),
  woods: WOODS.map((w, i) => ({ name: w.name, rows: wood(w, 90 + i) })),
  ways: WAYS.map((w, i) => pen(w, 130 + i, 8, 1)),
}
