import type { Rect } from "../engine/MorphEngine"

/** Emblem indices, in the order PAINTERS paints them. */
export const EMBLEM = {
  one: 0,
  vilya: 1,
  nenya: 2,
  narya: 3,
  palantir: 4,
  horn: 5,
  seven: 6,
  tree: 7,
  barahir: 8,
  rings: 9,
} as const

/** hero: above the hero copy · title: a chapter's title card · back: faint, behind the text */
export type Mode = "hero" | "title" | "back"

/**
 * The scroll keyframes, one chapter per section of the CV. Transition i (from
 * keyframe i to i + 1) is driven by a ScrollTrigger the sections register with
 * morphTrigger(i, …).
 */
export const KEYFRAMES: { emblem: number; mode: Mode; realm: number }[] = [
  { emblem: EMBLEM.one, mode: "hero", realm: 0 }, //       hero: the One Ring
  { emblem: EMBLEM.vilya, mode: "title", realm: 1 }, //    0 → I. Education
  { emblem: EMBLEM.vilya, mode: "back", realm: 1 }, //     1
  { emblem: EMBLEM.nenya, mode: "title", realm: 2 }, //    2 → II. Research Experience
  { emblem: EMBLEM.nenya, mode: "back", realm: 2 }, //     3
  { emblem: EMBLEM.narya, mode: "title", realm: 3 }, //    4 → III. Projects
  { emblem: EMBLEM.palantir, mode: "back", realm: 3 }, //  5   first project
  { emblem: EMBLEM.horn, mode: "back", realm: 3 }, //      6   second project
  { emblem: EMBLEM.seven, mode: "title", realm: 4 }, //    7 → IV. Skills
  { emblem: EMBLEM.seven, mode: "back", realm: 4 }, //     8
  { emblem: EMBLEM.tree, mode: "title", realm: 5 }, //     9 → V. Experience
  { emblem: EMBLEM.tree, mode: "back", realm: 5 }, //      10
  { emblem: EMBLEM.barahir, mode: "title", realm: 6 }, //  11 → VI. Certifications
  { emblem: EMBLEM.barahir, mode: "back", realm: 6 }, //   12
  { emblem: EMBLEM.rings, mode: "title", realm: 7 }, //    13 → Contact: all the Rings of Power
  { emblem: EMBLEM.rings, mode: "back", realm: 7 }, //     14
]

export const TRANSITIONS = KEYFRAMES.length - 1

type RGB = [number, number, number]

export interface Realm {
  name: string
  place: string
  bg: RGB
  glow: RGB
  accent: RGB
  /** colour of the drifting motes: embers, fireflies, snow, starlight */
  mote: RGB
}

export const REALMS: Realm[] = [
  { name: "Mordor", place: "Orodruin · where the One was forged", bg: [11, 9, 6], glow: [226, 88, 43], accent: [239, 199, 104], mote: [255, 140, 60] },
  { name: "Rivendell", place: "Imladris · keeper of Vilya", bg: [8, 14, 23], glow: [77, 143, 214], accent: [207, 224, 242], mote: [190, 220, 255] },
  { name: "Lothlórien", place: "Caras Galadhon · keeper of Nenya", bg: [11, 13, 10], glow: [196, 212, 224], accent: [234, 218, 158], mote: [240, 224, 150] },
  { name: "Eregion", place: "Ost-in-Edhil · where the Rings were made", bg: [18, 7, 8], glow: [222, 58, 52], accent: [255, 186, 132], mote: [255, 120, 80] },
  { name: "Khazad-dûm", place: "The Dwarrowdelf · halls of the Seven", bg: [10, 11, 15], glow: [95, 143, 208], accent: [185, 200, 218], mote: [160, 190, 235] },
  { name: "Gondor", place: "Minas Tirith · the House of Elendil", bg: [12, 15, 22], glow: [159, 184, 224], accent: [242, 239, 230], mote: [236, 240, 255] },
  { name: "Arnor", place: "Annúminas · heirloom of the Kings", bg: [7, 14, 11], glow: [62, 170, 118], accent: [226, 200, 120], mote: [150, 232, 170] },
  { name: "The Grey Havens", place: "Mithlond · where the Ring-bearers sailed", bg: [14, 10, 8], glow: [240, 163, 74], accent: [243, 198, 107], mote: [255, 200, 120] },
]

export const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"]

function fit(aspect: number, maxW: number, maxH: number, cx: number, cy: number): Rect {
  let w = maxW
  let h = w / aspect
  if (h > maxH) {
    h = maxH
    w = h * aspect
  }
  return { x: cx - w / 2, y: cy - h / 2, w, h }
}

/**
 * Where an emblem sits for a keyframe, in viewport CSS px. copyTop is where
 * the text of that screen begins (the hero's copy, or a title card's), so the
 * emblem always fits in the space above it.
 */
export function frameRect(mode: Mode, aspect: number, vw: number, vh: number, copyTop: number): { rect: Rect; dim: number } {
  const phone = vw < 640
  const top = phone ? 68 : 88
  if (mode === "hero") {
    const bottom = Math.max(top + 120, copyTop - 8)
    const bandH = bottom - top
    let maxW: number
    let maxH: number
    if (vw >= 1024) {
      maxW = vw * 0.8
      maxH = bandH * 0.86
    } else if (vw >= 640) {
      maxW = vw
      maxH = bandH * 0.9
    } else {
      maxW = vw * 0.95
      maxH = bandH * 0.6
    }
    return { rect: fit(aspect, maxW, maxH, vw / 2, (top + bottom) / 2), dim: 1 }
  }
  if (mode === "title") {
    const bottom = Math.max(top + 120, Math.min(vh * (phone ? 0.56 : 0.6), copyTop - 16))
    const bandH = bottom - top
    return { rect: fit(aspect, vw * (phone ? 0.92 : 0.7), bandH * 0.96, vw / 2, (top + bottom) / 2), dim: 1 }
  }
  return { rect: fit(aspect, vw * 0.92, vh * 0.78, vw / 2, vh / 2), dim: phone ? 0.1 : 0.12 }
}
