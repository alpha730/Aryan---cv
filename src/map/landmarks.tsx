/**
 * The places on the map, drawn by hand. Each is a small ink sketch in its own
 * coordinates, about 120 units across, set down on the map at its stop.
 *
 * Classes: i = an inked shape (filled with paper, so it hides what lies
 * behind) · n = line only · f = a finer pen · b / r / g = blue, red, gold ink.
 * Anything inside .fine fades out when the map is seen from far away.
 */
import { STOP, STOPS } from "../motion/world"

const at = (stop: number) => `translate(${STOPS[stop].at[0]} ${STOPS[stop].at[1]})`

/** a star of `points` rays: R to the tips, r to the hollows */
export function starPath(cx: number, cy: number, R: number, r: number, points = 8) {
  let s = ""
  for (let i = 0; i < points * 2; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / points
    const rad = i % 2 ? r : R
    s += (i ? "L" : "M") + (cx + Math.cos(a) * rad).toFixed(1) + " " + (cy + Math.sin(a) * rad).toFixed(1)
  }
  return s + "Z"
}

/* The Shire: Bag End, under the Hill */
function BagEnd() {
  return (
    <g transform={at(STOP.shire)}>
      <path className="i c-brick" d="M13-20v-9h6v10" />
      <path className="i n f" d="M16-31c-4-4 3-7 0-11c-2-3 3-5 1-9" />
      <path className="i" d="M-13-22v-11" />
      <path className="i c-grass" d="M-60 30C-44 8-26-22 0-25C26-27 44 4 60 30" />
      <path className="i c-leaf" d="M-24-32a5.5 5.5 0 0 1 2-9a7 7 0 0 1 11-3a6.5 6.5 0 0 1 9 6a5.5 5.5 0 0 1-3 9a8 8 0 0 1-10 1a6 6 0 0 1-9-4z" />
      <circle className="i door" cx="0" cy="14" r="12" />
      <path className="i n" d="M-72 30H-60M60 30H74M-15 27H15" />
      <g className="fine">
        <circle className="i n f" cx="0" cy="14" r="9" />
        <path className="i n f" d="M-5 3.4V24.6M5 3.4V24.6" />
        <circle className="knob" cx="0" cy="14" r="1.5" />
        <circle className="i f c-glow" cx="-28" cy="17" r="5.5" />
        <circle className="i f c-glow" cx="28" cy="17" r="5.5" />
        <path className="i n f" d="M-28 11.5v11M-33.5 17h11M28 11.5v11M22.500 17h11" />
        <path className="i n f" d="M-58 36H-19M-54 32v7M-47 32v7M-40 32v7M-33 32v7M-26 32v7M-20 32v7" />
        <path className="i n f" d="M-4 27C-8 36 2 42-2 52M5 27C2 36 10 43 6 52" />
        <path className="i n f" d="M26 34l2-4l2 4M36 36l2-4l2 4M46 33l2-4l2 4M-20-6l2-3l2 3M30-2l2-3l2 3M-44 14l2-3l2 3" />
      </g>
    </g>
  )
}

/* Rivendell: the Last Homely House, in its hidden valley */
function Rivendell() {
  return (
    <g transform={at(STOP.rivendell)}>
      <path className="i f c-rock2" d="M-36-6L-20-36L-8-20L6-44L22-24L34-4" />
      <path className="i c-rock" d="M-62 44L-60-4L-52-34L-45-20L-39-38L-32-12L-29 12L-24 44" />
      <path className="i c-rock" d="M62 44L60-10L52-40L46-24L38-32L32-8L28 12L26 44" />
      <path className="i n b" d="M-35-4C-36 10-33 22-34 38M-31-2C-32 12-29 24-30 40" />
      <path className="i c-wall" d="M17 24V-10H29V24" />
      <path className="i c-slate" d="M15-10L23-29L31-10Z" />
      <path className="i c-wall" d="M-14 24V5H18V24" />
      <path className="i c-slate" d="M-17 5L2-14L21 5Z" />
      <path className="i c-wall" d="M-26 24V12H-14V24" />
      <path className="i c-slate" d="M-28 12L-20 3L-12 12Z" />
      <path className="i n" d="M-32 24H34" />
      <path className="i c-stone" d="M-46 50Q-12 34 20 50L20 54Q-12 39-46 54Z" />
      <path className="i n b" d="M-68 58C-44 52-14 62 18 57C36 54 52 58 68 54" />
      <g className="fine">
        <path className="i n f" d="M-1 24v-9a3 3 0 0 1 6 0v9M-9 17v-5a2 2 0 0 1 4 0v5zM10 17v-5a2 2 0 0 1 4 0v5zM21 4v-6a2 2 0 0 1 4 0v6zM21 19v-6a2 2 0 0 1 4 0v6zM-22 21v-4a2 2 0 0 1 4 0v4zM2-14v-6M23-29v-5" />
        <path className="i n f" d="M-30 24v9M-22 24v9M-14 24v9M-6 24v9M2 24v9M10 24v9M18 24v9M26 24v9M34 24v9M-30 33H34" />
        <path className="i n b f" d="M-27 6C-28 18-26 28-27 40M-38 42q4-3 8 0t8 0" />
        <path className="i n f" d="M-54-8l5 14M-46 4l3 16M52-12l-5 16M44 2l-3 18M-28 50v-4M-12 45v-4M4 46v-4" />
      </g>
    </g>
  )
}

/* Eregion: the ruined forges of Ost-in-Edhil, where the Rings were made */
function Eregion() {
  const rays = Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI) / 4 + 0.39
    return `M${(-1 + Math.cos(a) * 10).toFixed(1)} ${(-8 + Math.sin(a) * 10).toFixed(1)}L${(-1 + Math.cos(a) * 14.5).toFixed(1)} ${(-8 + Math.sin(a) * 14.5).toFixed(1)}`
  }).join("")
  return (
    <g transform={at(STOP.eregion)}>
      <path className="i c-stone" d="M-37-16A40 40 0 0 1-4-52L1-45L-5-43A30 30 0 0 0-27-16Z" />
      <path className="i c-stone" d="M-36 30V-12H-26V30" />
      <path className="i c-stone" d="M-39-12H-23V-16H-39Z" />
      <path className="i c-stone" d="M26 30V-2L29-7L32-3L36-8V30" />
      <path className="i c-stone" d="M40 30l2-7l9 1l1 6zM-21 30l1-5h8l1 5z" />
      <path className="i" d="M-54 30V17M54 30V17" />
      <path className="i c-holly" d="M-54-10C-64 2-63 18-54 19C-45 18-44 2-54-10ZM54-10C44 2 45 18 54 19C63 18 64 2 54-10Z" />
      <path className="i c-wood" d="M-9 30V22H9V30" />
      <path className="i c-iron" d="M-14 10H10L18 7V12H9C7 15 6 18 7 22H-7C-6 18-7 15-9 13H-14Z" />
      <path className="i n" d="M16 30L27 2" />
      <path className="i c-iron" d="M22-2l9 3.400l-2 5.400l-9-3.400z" />
      <path className="i n" d="M-68 30H-42M-22 30H22M44 30H68" />
      <circle className="i n g" cx="-1" cy="-8" r="6.5" />
      <g className="fine">
        <circle className="i n g f" cx="-1" cy="-8" r="4.600" />
        <path className="i n g f" d={rays} />
        <path className="i n f" d="M-33-10V28M-29-10V28M29-2V28M33-3V28M-31-20A34 34 0 0 1-6-46" />
        <circle className="berry" cx="-57" cy="6" r="1.200" />
        <circle className="berry" cx="-51" cy="10" r="1.200" />
        <circle className="berry" cx="-54" cy="0" r="1.200" />
        <circle className="berry" cx="51" cy="7" r="1.200" />
        <circle className="berry" cx="57" cy="11" r="1.200" />
        <circle className="berry" cx="54" cy="1" r="1.200" />
      </g>
    </g>
  )
}

/* Khazad-dûm: the Doors of Durin, in the walls of Moria */
export const TREE = [
  "M150 792 C154 660 146 540 168 444 C180 392 210 350 252 322",
  "M166 470 C196 440 230 424 262 424",
  "M160 560 C192 526 226 512 258 514",
  "M172 404 C204 372 236 360 268 362",
  "M156 650 C186 618 214 606 244 610",
].join("")

function Moria() {
  const stars = Array.from({ length: 7 }, (_, k) => {
    const a = -Math.PI / 2 + (k - 3) * 0.3
    const x = 300 + Math.cos(a) * 150
    const y = 540 + Math.sin(a) * 150
    return `M${(x - 9).toFixed(0)} ${y.toFixed(0)}h18M${x.toFixed(0)} ${(y - 9).toFixed(0)}v18`
  }).join("")
  return (
    <g transform={at(STOP.moria)}>
      <path className="i c-rock" d="M-64 44L-60 8L-52-18L-44-26L-38-44L-26-38L-14-52L-2-44L8-56L20-44L32-50L42-30L52-22L58 4L64 44" />
      <path className="i" d="M-44 44V35M44 44V35" />
      <path className="i c-holly" d="M-44 14C-52 23-51 35-44 36C-37 35-36 23-44 14ZM44 14C36 23 37 35 44 36C51 35 52 23 44 14Z" />
      <g className="durin" transform="translate(-25.500 -28) scale(0.085)">
        <path className="i c-night" d="M96 792V348A204 204 0 0 1 504 348V792" />
        <path className="i n" d="M40 792H560M126 792V348A174 174 0 0 1 474 348V792" />
        <g className="fine">
          <path className="i n f" d="M86 360H136M86 348H136M464 360H514M464 348H514" />
          <path className="i n f" d={TREE} />
          <path className="i n f" d={TREE} transform="translate(600 0) scale(-1 1)" />
          <path className="i n f" d={starPath(300, 540, 78, 30)} />
          <circle className="i n f" cx="300" cy="540" r="14" />
          <path className="i n f" d="M276 436 L282 414 L292 428 L300 408 L308 428 L318 414 L324 436 Z" />
          <path className="i n f" d={stars} />
        </g>
      </g>
      <g className="fine">
        <path className="i n f" d="M-50 0l6 12l-4 14M50-4l-7 14l5 12M-40-30l8 10M36-36l-6 12M-8-46l4 8M16-48l-3 8" />
        <path className="i n b f" d="M-60 52h24M-22 55h40M30 52h26M-46 58h18M8 60h30" />
      </g>
    </g>
  )
}

/* Rohan: Edoras, and Meduseld the Golden Hall on its hill */
function Edoras() {
  let pales = "M-54 28.500"
  let fence = ""
  for (let x = -54; x <= 46; x += 4) {
    const y = 26 + 9 * (1 - (x / 54) ** 2)
    pales += `L${x} ${y.toFixed(1)}`
    fence += `M${x} ${y.toFixed(1)}v5`
  }
  return (
    <g transform={at(STOP.rohan)}>
      <path className="i n" d="M21-20V-51" />
      <path className="i flag" d="M21-51q7-3 13 0q-6 3-13 6z" />
      <path className="i c-grass2" d="M-64 38C-42 23-25-4-7-8H12C29-4 43 21 64 38" />
      <path className="i c-wood" d="M-17-8V-20H17V-8" />
      <path className="i c-thatch" d="M-21-20L0-40L21-20Z" />
      <path className="i n" d="M-4-36L5-47M4-36L-5-47" />
      <path className="i c-straw" d="M-36 14v-6l5-5l5 5v6zM26 12v-6l5-5l5 5v6zM-18 10v-5l4-4l4 4v5zM8 14v-5l4-4l4 4v5z" />
      <path className="i n" d={pales} />
      <path className="i c-wood" d="M47 40V27l5-5l5 5V40" />
      <path className="i n" d="M-68 52q9-11 18 0M-46 54q8-9 16 0M-24 55q7-8 14 0" />
      <g className="fine">
        <path className="i n f" d="M-13-21L-5-33M-5-21L-1-35M5-21L1-35M13-21L5-33M-11-8v-12M-6-8v-12M6-8v-12M11-8v-12M-2.500-8v-7a2.500 2.500 0 0 1 5 0v7M-8-8L-12 0M8-8L12 0M-10-4H10" />
        <path className="i n f" d={fence} />
        <path className="i n f" d="M50 40v-7a2 2 0 0 1 4 0v7" />
      </g>
    </g>
  )
}

/* Gondor: Minas Tirith, seven circles of white stone under Mindolluin */
function MinasTirith() {
  const tiers = Array.from({ length: 7 }, (_, i) => {
    const w = 46 - i * 5.6
    const y = 42 - i * 8.6
    const top = y - 8.6
    const ry = (3.4 - i * 0.25).toFixed(2)
    return `M${-w} ${top.toFixed(1)}V${y.toFixed(1)}A${w} ${ry} 0 0 0 ${w} ${y.toFixed(1)}V${top.toFixed(1)}A${w} ${ry} 0 0 1 ${-w} ${top.toFixed(1)}Z`
  })
  return (
    <g transform={at(STOP.gondor)}>
      <path className="i c-rock" d="M-60 42L-28-24L-13-48L-3-34L8-58L20-38L30-44L60 42" />
      <g className="fine">
        <path className="i n f" d="M8-58L15-28M-13-48L-8-26M20-38l7 24M-3-34l3 12" />
      </g>
      {tiers.map((t, i) => (
        <path key={i} className="i c-white" d={t} />
      ))}
      <path className="i c-white" d="M-3 33.400L-1.200-18.200H1.200L3 33.400" />
      <path className="i c-white" d="M-2.400-17V-40L0-48L2.400-40V-17Z" />
      <path className="i n" d="M0-48V-57" />
      <path className="i flag" d="M0-57q6 1 10-1q-4 4-10 4z" />
      <g className="fine">
        <path className="i f" d="M-3.500 45.400v-6a3.500 3.500 0 0 1 7 0v6" />
        <path className="i n f" d="M-30 38v3M-18 40v3M18 40v3M30 38v3M-24 30v3M24 30v3M-12 23v2.500M12 23v2.500M-18 14v2.500M18 14v2.500M0-40v6M0-30v5" />
      </g>
    </g>
  )
}

/* The Grey Havens: the white towers of Mithlond, and the last ship */
function GreyHavens() {
  return (
    <g transform={at(STOP.havens)}>
      <path className="i c-white" d="M34-15V-40H41V-15M56-15V-36H62V-15" />
      <path className="i c-slate" d="M32.500-40L37.500-54L42.500-40ZM54.500-36L59-48L63.500-36Z" />
      <path className="i c-white" d="M45-15V-50H53V-15" />
      <path className="i c-slate" d="M43.500-50L49-68L54.500-50Z" />
      <path className="i c-stone" d="M26-10H66V-15H26Z" />
      <path className="i n" d="M-14 7V-35" />
      <path className="i c-sail" d="M-29-30H1C4.500-20 4.500-10 1-3H-29C-25.500-10-25.500-20-29-30Z" />
      <path className="i c-wood" d="M-42 4C-34 17-2 17 12 3C2 8-30 9-42 4Z" />
      <path className="i n" d="M-42 4C-49-2-51-12-46-18C-43.500-21-39.500-19.500-40.500-16l-4.500 2.200M12 3C17-2 17-7 13-11M-14-35q-5-3-10 0" />
      <path className="gild" d={starPath(-14, -16.5, 6.5, 2.6)} />
      <path className="gild" d={starPath(-60, -40, 7.5, 2.8)} />
      <g className="fine">
        <path className="i n f" d="M37.500-34v5M49-44v6M49-30v6M59-30v4M30-10v5M38-10v5M46-10v5M54-10v5M62-10v5M41-25h4M53-27h3" />
        <path className="i n f" d="M-14-35L-36 4M-14-35L8 4M-30 8v3M-22 10v3M-14 11v3M-6 10v3M2 8v3" />
        <path className="i n b f" d="M-52 15q4-3 8 0t8 0M-22 20q4-3 8 0t8 0M2 15q4-3 8 0t8 0M-70 4q4-3 8 0M22 6q4-3 8 0t8 0M-40 28q4-3 8 0t8 0" />
        <path className="i n f" d="M-32-48q3-3 6 0q3-3 6 0M-6-56q2.500-2.500 5 0q2.500-2.500 5 0M8-44q2-2 4 0q2-2 4 0" />
      </g>
    </g>
  )
}

/** the lesser places: seen from the road, but not on it */
function Elsewhere() {
  return (
    <>
      {/* Mount Doom */}
      <g transform="translate(2470 1215)">
        <path className="i c-ash" d="M-24 14L-7-14H7L24 14" />
        <path className="i n r" d="M-3-14L-6 2M2-14l4 12M0-14v7" />
        <path className="i n f" d="M0-17c-7-6 6-10 0-18c-4-6 7-9 4-16" />
      </g>
      {/* Barad-dûr, and the Eye */}
      <g transform="translate(2560 1140)">
        <path className="i c-dark" d="M-7 14L-5-18L-8-30L-3-24L-1.500-34H1.500L3-24L8-30L5-18L7 14" />
        <ellipse className="i r eye" cx="0" cy="-41" rx="5.500" ry="2.800" />
        <path className="i n r" d="M0-43.400v4.800" />
      </g>
      {/* Orthanc, in the ring of Isengard */}
      <g transform="translate(1775 1045)">
        <ellipse className="i n" cx="0" cy="9" rx="13" ry="4.500" />
        <path className="i c-dark" d="M-3 9V-14L-5.500-21L-2-17L0-23L2-17L5.500-21L3-14V9" />
      </g>
      {/* Weathertop */}
      <g transform="translate(1598 566)">
        <path className="i c-grass" d="M-15 8Q-2-17 15 8" />
        <path className="i n f" d="M-4-5v-3M0-6.500v-3M4-5v-3" />
      </g>
      {/* Bree */}
      <g transform="translate(1480 580)">
        <path className="i c-straw" d="M-9 4v-5l4-4l4 4v5zM1 4v-4l3.500-3.500L8 0v4z" />
      </g>
      {/* Dol Guldur */}
      <g transform="translate(2196 742)">
        <path className="i c-dark" d="M-10 8Q0-6 10 8M-2.500 2V-12L0-17L2.500-12V2" />
      </g>
      {/* towns and old cities */}
      {[
        [1500, 880],
        [1470, 420],
        [2276, 1168],
        [1722, 1366],
        [1975, 1690],
        [2176, 1350],
        [1575, 120],
        [2468, 286],
      ].map(([x, y]) => (
        <circle key={x} className="dot" cx={x} cy={y} r="2.400" />
      ))}
    </>
  )
}

function Compass() {
  return (
    <g transform="translate(1085 1265)">
      <circle className="i n f" r="30" />
      <circle className="i n f" r="27" />
      <path className="i c-sand" d={starPath(0, 0, 34, 7, 4)} transform="rotate(45)" />
      <path className="i c-white" d={starPath(0, 0, 50, 8, 4)} />
      <path className="ink" d="M0-50L0 0L-5.660-5.660ZM50 0L0 0L5.660-5.660ZM0 50L0 0L5.660 5.660ZM-50 0L0 0L-5.660 5.660Z" />
      <text className="lab compass-n" y="-58" textAnchor="middle">
        N
      </text>
    </g>
  )
}

export default function Landmarks() {
  return (
    <>
      <Elsewhere />
      <Compass />
      <Rivendell />
      <Eregion />
      <Moria />
      <BagEnd />
      <Edoras />
      <MinasTirith />
      <GreyHavens />
    </>
  )
}
