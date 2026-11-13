/**
 * What turns a chart into a storybook map: washes of colour over each realm,
 * ribbons naming the stops of the road, a title scroll, and the creatures a
 * mapmaker draws where the facts run out.
 */
import { profile } from "../data/profile"

/** [colour, centre x, centre y, radius x, radius y]: each fades to nothing at its edge */
const WASHES: [string, number, number, number, number][] = [
  ["snow", 1500, -120, 900, 300], // Forodwaith
  ["green", 1290, 590, 210, 150], // the Shire
  ["green", 1000, 380, 150, 260], // Lindon
  ["green", 980, 790, 150, 220],
  ["meadow", 1520, 700, 430, 330], // Eriador
  ["meadow", 1560, 1000, 300, 170], // Enedwaith
  ["green", 2060, 690, 170, 300], // the vales of Anduin
  ["forest", 2290, 490, 250, 360], // Mirkwood
  ["gold", 1960, 1070, 260, 150], // Rohan
  ["pale", 1880, 1320, 420, 150], // Gondor
  ["plain", 2640, 560, 380, 330], // Rhovanion
  ["ash", 2545, 1255, 240, 200], // Mordor
  ["sand", 2360, 1760, 520, 330], // Harad
  ["sand", 3000, 900, 420, 500], // Rhûn
]

const COLOURS: Record<string, string> = {
  snow: "#f4f8fa",
  green: "#8fb76a",
  meadow: "#b9c98a",
  forest: "#6f9163",
  gold: "#dcc25e",
  pale: "#cfd8c0",
  plain: "#cdbf86",
  ash: "#9a8078",
  sand: "#e2b36a",
}

export function WashDefs({ layer }: { layer: string }) {
  return (
    <>
      {Object.entries(COLOURS).map(([name, colour]) => (
        <radialGradient key={name} id={`wash-${name}-${layer}`}>
          <stop offset="0" stopColor={colour} stopOpacity="0.62" />
          <stop offset="0.55" stopColor={colour} stopOpacity="0.36" />
          <stop offset="1" stopColor={colour} stopOpacity="0" />
        </radialGradient>
      ))}
    </>
  )
}

export function Washes({ layer }: { layer: string }) {
  return (
    <>
      {WASHES.map(([name, cx, cy, rx, ry], i) => (
        <ellipse key={i} cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#wash-${name}-${layer})`} />
      ))}
    </>
  )
}

/** A ribbon with swallow-tailed ends, carrying a chapter of the CV; the name of the place is written above it. */
export function Banner({ x, y, name, chapter }: { x: number; y: number; name: string; chapter: string }) {
  const a = chapter.length * 4.5 + 15
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className="banner">
        <path className="ribbon-tail" d={`M${-a + 8} -4H${-a - 14}l7 9.500l-7 9.500H${-a + 8}ZM${a - 8} -4H${a + 14}l-7 9.500l7 9.500H${a - 8}Z`} />
        <path className="ribbon-fold" d={`M${-a} 9l8 6V9ZM${a} 9l-8 6V9Z`} />
        <path className="ribbon" d={`M${-a} -11Q0 -14 ${a} -11V9Q0 6 ${-a} 9Z`} />
        <text className="banner-chap" y="2.600" textAnchor="middle">
          {chapter}
        </text>
        <text className="lab banner-name" y="-19" textAnchor="middle">
          {name}
        </text>
      </g>
    </g>
  )
}

/** the title of the map, on a scroll in the empty east */
function Cartouche() {
  return (
    <g transform="translate(2610 800)">
      <g className="cartouche">
      <path className="i scroll-roll" d="M-168 -44c-14 0-18 10-18 20s6 16 16 14v62c-10-2-16 6-16 14s8 14 18 12ZM168 -44c14 0 18 10 18 20s-6 16-16 14v62c10-2 16 6 16 14s-8 14-18 12Z" />
      <path className="i scroll" d="M-170 -50Q0 -58 170 -50V46Q0 38 -170 46Z" />
      <path className="scroll-rule" d="M-120 -8H-34M34 -8H120M-4 -8l4-4l4 4l-4 4Z" />
      <text className="cart-title" y="-20" textAnchor="middle">
        Middle-earth
      </text>
      <text className="cart-line" y="12" textAnchor="middle">
        the Westlands, at the end of the Third Age
      </text>
      <text className="cart-line" y="30" textAnchor="middle">
        being the road of {profile.name}
      </text>
      </g>
    </g>
  )
}

/** a ship under sail, a serpent in the bay, a dragon over the Withered Heath, and the Eagles */
function Creatures() {
  return (
    <>
      <g transform="translate(1262 1512)">
        <path className="i n b f" d="M-34 18q5-4 10 0t10 0t10 0t10 0t10 0t10 0M-22 25q5-4 10 0t10 0t10 0t10 0" />
        <path className="i n" d="M0 8V-34" />
        <path className="i c-sail" d="M2-30C16-24 18-8 2 2ZM-2-26C-14-20-15-8-2 0Z" />
        <path className="i c-wood" d="M-22 6H22L15 17H-15Z" />
        <path className="i flag" d="M0-34l9 3l-9 3Z" />
      </g>
      <g transform="translate(1650 1578)" className="serpent">
        <path className="i c-scale" d="M-46 6C-44-18-24-18-22 6ZM-16 6C-14-14 4-14 6 6ZM12 6C14-9 28-9 30 6Z" />
        <path className="i c-scale" d="M-70 6C-72-22-62-36-50-32C-44-30-44-22-50-22C-56-22-56-10-54 6Z" />
        <path className="i n f" d="M-56-28l-9-3M-40-6v8M-34-10v12M-28-6v8M-10-4v6M-4-6v8M18-2v4M23-2v4" />
        <circle className="dot" cx="-52" cy="-27" r="1.200" />
        <path className="i n b f" d="M-84 10q5-4 10 0t10 0M-24 11q4-3 8 0M4 11q4-3 8 0M30 10q5-4 10 0t10 0" />
      </g>
      <g transform="translate(2700 112)" className="dragon">
        <path className="i c-drake" d="M-6 0L-20-34L-2-20L6-40L14-16L30-26L22 2Z" />
        <path className="i c-drake" d="M-52 10C-40-4-24 12-8 2C6-6 22-2 34 6C40 2 48 2 54 6L44 9L50 14C42 16 36 14 32 12C20 6 8 4-4 10C-22 20-38 6-52 10Z" />
        <path className="i n f" d="M-52 10l-9-5M-20-34L-4 0M6-40L8-2M30-26L18 0" />
        <circle className="dot" cx="45" cy="6" r="1" />
      </g>
      <g className="eagles">
        <path className="i ink" d="M1900 150q9-12 18-2q9-10 19 2q-10-5-19 3q-8-8-18-3Z" />
        <path className="i ink" d="M1946 176q6-8 12-1q6-7 13 1q-7-3-13 2q-5-5-12-2Z" />
      </g>
    </>
  )
}

export function Storybook() {
  return (
    <>
      <Creatures />
      <Cartouche />
    </>
  )
}
