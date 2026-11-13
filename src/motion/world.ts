/**
 * The journey, as the map tells it. The page is a leaf from the Red Book: a
 * hand-drawn map of Middle-earth lies behind everything, and each section of
 * the CV is a place on it. Scrolling walks the red road from one to the next.
 */

export type Pt = [number, number]

/** hero: the whole map · title: a chapter's title card, close on its place · back: faint, behind the text */
export type Mode = "hero" | "title" | "back"

export interface Stop {
  /** where the place is drawn, and where the title card looks */
  at: Pt
  /** where the red road reaches it */
  door: Pt
  /** how much of the map (in map units) a title card frames around the place */
  box: Pt
}

export const STOP = {
  shire: 0,
  rivendell: 1,
  eregion: 2,
  moria: 3,
  rohan: 4,
  gondor: 5,
  havens: 6,
} as const

export const STOPS: Stop[] = [
  { at: [1290, 560], door: [1290, 612], box: [300, 190] }, // Bag End
  { at: [1740, 498], door: [1716, 546], box: [300, 190] }, // Rivendell
  { at: [1700, 738], door: [1790, 762], box: [300, 190] }, // the forges of Eregion
  { at: [1836, 792], door: [1836, 846], box: [290, 210] }, // the West-gate of Moria
  { at: [1900, 1082], door: [1958, 1120], box: [300, 180] }, // Edoras
  { at: [2190, 1128], door: [2196, 1182], box: [290, 200] }, // Minas Tirith
  { at: [1030, 560], door: [976, 572], box: [320, 190] }, // the Grey Havens
]

/** The part of the map the opening screen has to show: Lindon to Mordor, Forochel to Belfalas. */
export const CORE = { x: 850, y: 40, w: 1900, h: 1430 }

/** The lands the road itself crosses: what a phone's opening screen shows. */
export const ROADLANDS = { x: 820, y: 330, w: 1540, h: 1190 }

/**
 * The scroll keyframes, one chapter per section of the CV. Transition i (from
 * keyframe i to i + 1) is driven by a ScrollTrigger the sections register with
 * morphTrigger(i, …). drift nudges a "back" frame off its place, so the map
 * keeps moving a little while a chapter is read.
 */
export const KEYFRAMES: { stop: number; mode: Mode; realm: number; drift?: Pt }[] = [
  { stop: STOP.shire, mode: "hero", realm: 0 }, //                        the whole map
  { stop: STOP.shire, mode: "title", realm: 1 }, //                       0 → I. Education
  { stop: STOP.shire, mode: "back", realm: 1, drift: [70, 10] }, //       1
  { stop: STOP.rivendell, mode: "title", realm: 2 }, //                   2 → II. Research Experience
  { stop: STOP.rivendell, mode: "back", realm: 2, drift: [-60, 40] }, //  3
  { stop: STOP.eregion, mode: "title", realm: 3 }, //                     4 → III. Projects
  { stop: STOP.eregion, mode: "back", realm: 3, drift: [-90, -30] }, //   5   first project
  { stop: STOP.eregion, mode: "back", realm: 3, drift: [10, 70] }, //     6   second project
  { stop: STOP.eregion, mode: "back", realm: 3, drift: [110, 20] }, //    7   third project
  { stop: STOP.moria, mode: "title", realm: 4 }, //                       8 → IV. Skills
  { stop: STOP.moria, mode: "back", realm: 4, drift: [60, 20] }, //       9
  { stop: STOP.rohan, mode: "title", realm: 5 }, //                       10 → V. Experience
  { stop: STOP.rohan, mode: "back", realm: 5, drift: [60, -30] }, //      11
  { stop: STOP.gondor, mode: "title", realm: 6 }, //                      12 → VI. Certifications
  { stop: STOP.gondor, mode: "back", realm: 6, drift: [-70, -10] }, //    13
  { stop: STOP.havens, mode: "title", realm: 7 }, //                      14 → Contact
  { stop: STOP.havens, mode: "back", realm: 7, drift: [40, 10] }, //      15
]

export const TRANSITIONS = KEYFRAMES.length - 1

type RGB = [number, number, number]

export interface Realm {
  name: string
  place: string
  /** the parchment */
  bg: RGB
  /** a wash of colour laid over it */
  glow: RGB
  /** the coloured ink of the realm's headings and rules */
  accent: RGB
}

/**
 * Khazad-dûm is written on the night side of the leaf: its page is shown
 * inverted (see .night), so its accent is chosen for what it turns into.
 */
export const REALMS: Realm[] = [
  { name: "Middle-earth", place: "The Westlands · at the end of the Third Age", bg: [231, 218, 184], glow: [200, 150, 80], accent: [163, 48, 31] },
  { name: "The Shire", place: "Hobbiton · Bag End, under the Hill", bg: [234, 228, 200], glow: [140, 170, 90], accent: [58, 100, 50] },
  { name: "Rivendell", place: "Imladris · the Last Homely House", bg: [230, 228, 212], glow: [110, 150, 190], accent: [38, 82, 126] },
  { name: "Eregion", place: "Ost-in-Edhil · where the Rings were made", bg: [238, 223, 198], glow: [214, 120, 60], accent: [172, 70, 20] },
  { name: "Khazad-dûm", place: "The West-gate · the Doors of Durin", bg: [236, 226, 203], glow: [150, 110, 60], accent: [122, 70, 16] },
  { name: "Rohan", place: "Edoras · Meduseld, the Golden Hall", bg: [236, 228, 196], glow: [200, 160, 60], accent: [142, 98, 18] },
  { name: "Gondor", place: "Minas Tirith · the White City", bg: [232, 229, 218], glow: [150, 160, 185], accent: [34, 52, 96] },
  { name: "The Grey Havens", place: "Mithlond · on the Gulf of Lune", bg: [227, 229, 221], glow: [120, 160, 170], accent: [48, 96, 110] },
]

export const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"]

/**
 * The red road, from one door to the next: east along the Great Road, south
 * through Hollin, under the mountains, down through Lórien to Rohan and
 * Gondor, and at the last by ship down Anduin and up the coast to the Havens.
 * Each inner list is one leg; a leg ends at the door of STOPS[leg + 1].
 */
export const ROAD: { from: Pt; legs: Pt[][] } = {
  from: STOPS[0].door,
  legs: [
    [[1340, 606], [1396, 598], [1480, 594], [1560, 588], [1605, 584], [1642, 562], [1698, 553], STOPS[1].door],
    [[1722, 600], [1745, 660], [1775, 720], STOPS[2].door],
    [[1812, 806], STOPS[3].door],
    [[1880, 842], [1925, 826], [1968, 822], [2030, 850], [2046, 930], [2022, 1010], [1985, 1078], STOPS[4].door],
    [[2010, 1150], [2100, 1162], STOPS[5].door],
    [
      [2240, 1200], [2276, 1236], [2258, 1278], [2192, 1346], [2112, 1404], [2046, 1456], [1960, 1466], [1820, 1424],
      [1700, 1432], [1560, 1352], [1400, 1348], [1300, 1388], [1200, 1352], [1186, 1260], [1230, 1150], [1110, 1052],
      [962, 992], [868, 862], [852, 742], [866, 652], [902, 584], STOPS[6].door,
    ],
  ],
}

/** Where the map is looking: the map point at the centre of the screen, and screen px per map unit. */
export interface Cam {
  cx: number
  cy: number
  s: number
  /** how strongly the map is inked */
  dim: number
  /** parchment rising from the bottom, behind a screen's words (0–1), and where those words begin (px) */
  fogB: number
  fogY: number
  /** parchment along the left, behind the opening words on wide screens (0–1) */
  fogL: number
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/**
 * The camera for a keyframe. copyTop is where the text of that screen begins
 * (the hero's copy, or a title card's), so the place always sits in the clear
 * space above it.
 */
export function frameCam(k: (typeof KEYFRAMES)[number], vw: number, vh: number, copyTop: number): Cam {
  const phone = vw < 640
  const top = phone ? 64 : 84
  const stop = STOPS[k.stop]

  if (k.mode === "hero") {
    if (vw >= 1024) {
      // the words stand in the Sea on the left; the lands fill the rest
      const x0 = vw * 0.33
      const bw = vw - x0 - 24
      const bh = vh - top - 20
      const s = Math.min(bw / CORE.w, bh / CORE.h)
      const sx = x0 + bw / 2
      const sy = top + bh / 2
      return { cx: CORE.x + CORE.w / 2 - (sx - vw / 2) / s, cy: CORE.y + CORE.h / 2 - (sy - vh / 2) / s, s, dim: 1, fogB: 0, fogY: vh, fogL: 1 }
    }
    // narrow screens: only as much of the map as the road needs
    const core = phone ? ROADLANDS : CORE
    const bottom = Math.max(top + 140, copyTop - 6)
    const bh = bottom - top
    const s = Math.min(vw / core.w, bh / core.h)
    const sy = top + bh / 2
    return { cx: core.x + core.w / 2, cy: core.y + core.h / 2 - (sy - vh / 2) / s, s, dim: 1, fogB: 1, fogY: bottom, fogL: 0 }
  }

  if (k.mode === "title") {
    const bottom = Math.max(top + 140, Math.min(vh * (phone ? 0.56 : 0.6), copyTop - 16))
    const bh = bottom - top
    const s = clamp(Math.min((vw * 0.9) / stop.box[0], (bh * 0.94) / stop.box[1]), 0.9, 2.5)
    const sy = top + bh / 2
    return { cx: stop.at[0], cy: stop.at[1] - (sy - vh / 2) / s, s, dim: 1, fogB: 1, fogY: Math.min(copyTop, bottom + 30), fogL: 0 }
  }

  const s = clamp(Math.min(vw / 1100, vh / 620), 0.62, 1.5)
  const [dx, dy] = k.drift ?? [0, 0]
  return { cx: stop.at[0] + dx, cy: stop.at[1] + dy, s, dim: phone ? 0.16 : 0.2, fogB: 0, fogY: vh, fogL: 0 }
}
