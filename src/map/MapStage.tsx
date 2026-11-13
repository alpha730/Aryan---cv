import { memo, useLayoutEffect, useRef } from "react"
import { scene } from "../motion/scene"
import { BEACONS } from "../motion/eggs"
import { STOPS } from "../motion/world"
import { COAST, MAP, REGION, ROUTE, SEA, SHORELINE } from "./geo"
import Landmarks, { starPath } from "./landmarks"
import { Banner, Storybook, WashDefs, Washes } from "./extras"

/** the chapter each stop on the road opens */
const CHAPTERS = [
  { id: "education", num: "I", name: "Hobbiton", chapter: "Education", label: [1290, 503] },
  { id: "research", num: "II", name: "Rivendell", chapter: "Research", label: [1740, 436] },
  { id: "projects", num: "III", name: "Eregion", chapter: "Projects", label: [1700, 660] },
  { id: "skills", num: "IV", name: "Moria", chapter: "Skills", label: [1972, 752] },
  { id: "experience", num: "V", name: "Edoras", chapter: "Experience", label: [1896, 1180] },
  { id: "certifications", num: "VI", name: "Minas Tirith", chapter: "Certifications", label: [2190, 1062] },
  { id: "contact", num: "", name: "Grey Havens", chapter: "Contact", label: [1000, 500] },
]

const BIG: [string, number, number, number?][] = [
  ["Eriador", 1470, 748],
  ["Rhovanion", 2590, 580],
  ["Gondor", 1990, 1302],
  ["Mordor", 2530, 1292],
  ["Harad", 2380, 1620],
  ["Enedwaith", 1540, 1042, 0.66],
]

/** [text, x, y, anchor, blue ink?] */
const MID: [string, number, number, ("start" | "middle" | "end")?, boolean?][] = [
  ["Mirkwood", 2290, 486],
  ["The Shire", 1262, 672],
  ["White Mountains", 1770, 1290],
  ["Bay of Belfalas", 1520, 1464, "middle", true],
  ["The Great Sea", 1010, 1452, "middle", true],
]

const SMALL: [string, number, number, ("start" | "middle" | "end")?, boolean?][] = [
  ["Bree", 1466, 578, "end"],
  ["Weathertop", 1598, 603],
  ["Tharbad", 1510, 876, "start"],
  ["Fornost", 1462, 417, "end"],
  ["Lake Evendim", 1310, 316],
  ["Isengard", 1757, 1050, "end"],
  ["Mount Doom", 2470, 1245],
  ["Barad-dûr", 2574, 1136, "start"],
  ["Erebor", 2480, 172],
  ["Long Lake", 2484, 306, "start"],
  ["Lothlórien", 2036, 784],
  ["Fangorn", 1952, 894],
  ["Dol Amroth", 1712, 1350, "end"],
  ["Umbar", 2030, 1692, "start"],
  ["Tower Hills", 1176, 556],
  ["Angmar", 1640, 152],
  ["Ered Luin", 1066, 216, "start"],
  ["Ice Bay of Forochel", 1150, -70, "middle", true],
  ["Iron Hills", 2690, 222],
  ["Brown Lands", 2380, 906],
  ["Emyn Muil", 2186, 972],
  ["Dunland", 1700, 962],
  ["Dol Guldur", 2210, 748, "start"],
  ["Carn Dûm", 1586, 150, "end"],
]

/**
 * The drawing itself. It is laid down twice, once small for the whole map and
 * once large for the close views, and each copy is painted only once: the
 * scene then slides and scales the painted sheets, which costs nothing.
 */
const MapArt = memo(function MapArt({ layer }: { layer: "far" | "near" }) {
  return (
    <svg className={"map map-art " + layer} viewBox={`${REGION.x} ${REGION.y} ${REGION.w} ${REGION.h}`} preserveAspectRatio="none" focusable="false">
      <defs>
        <path id={"lp-misty-" + layer} d="M1968 236C1982 360 1998 480 2002 600" />
        <path id={"lp-anduin-" + layer} d="M2090 560C2106 640 2124 720 2136 800" />
        <WashDefs layer={layer} />
      </defs>

      {/* the land, washed with the colour of each realm and shaded along its shore */}
      <path className="land" d={COAST} />
      <Washes layer={layer} />
      <g className="coast-shade">
        {SHORELINE.map((l, i) => (
          <path key={i} d={l} />
        ))}
      </g>

      {/* the Sea, laid over the edge of the washes: deep water, two bands of shallows, water-lines, waves */}
      <path className="sea" d={SEA} />
      {MAP.shallows.map((band, i) => (
        <g key={i} className={"shallows s" + (2 - i)}>
          {band.map((l, j) => (
            <path key={j} d={l} />
          ))}
        </g>
      ))}
      {MAP.lining.map((line, i) => (
        <g key={i} className={"lining l" + (i + 1)}>
          {line.map((l, j) => (
            <path key={j} d={l} />
          ))}
        </g>
      ))}
      <g className="waves">
        {MAP.waves.map((w, i) => (
          <path key={i} d={w} />
        ))}
      </g>
      <g className="shore">
        {SHORELINE.map((l, i) => (
          <path key={i} d={l} />
        ))}
      </g>

      {MAP.lakes.map((l, i) => (
        <path key={i} className="lake" d={l} />
      ))}
      {MAP.rivers.map((r) => (
        <path key={r.name} className={r.wide ? "river wide" : "river"} d={r.d} />
      ))}
      {MAP.ways.map((w, i) => (
        <path key={i} className="way" d={w} />
      ))}
      <path className="i n f" d={MAP.marsh} />
      <path className="i hills" d={MAP.hills} />
      {MAP.woods.map((w) => (
        <g key={w.name} className={"wood " + w.name}>
          {w.rows.map((row, i) => (
            <path key={i} className="i f" d={row} />
          ))}
        </g>
      ))}
      <g className="peaks">
        {MAP.peaks.map((p, i) => (
          <g key={i} className={p.kind}>
            <path className="pk-l" d={p.lit} />
            <path className="pk-s" d={p.shade} />
            {p.snow ? <path className="pk-w" d={p.snow} /> : null}
            <path className="pk-o" d={p.lit} />
          </g>
        ))}
      </g>

      <g className="places">
        <Storybook />
        <Landmarks />
      </g>

      {/* names: realms, the great features, the small places, and a ribbon for each stop of the road */}
      <g className="labs-big">
        {BIG.map(([text, x, y, k]) => (
          <text key={text} className="lab lab-big" x={x} y={y} textAnchor="middle" style={k ? { fontSize: `calc(var(--big) * ${k})` } : undefined}>
            {text}
          </text>
        ))}
      </g>
      <g className="labs-mid">
        <text className="lab lab-mid">
          <textPath href={"#lp-misty-" + layer} startOffset="50%" textAnchor="middle">
            Misty Mountains
          </textPath>
        </text>
        <text className="lab lab-mid blue">
          <textPath href={"#lp-anduin-" + layer} startOffset="50%" textAnchor="middle">
            Anduin
          </textPath>
        </text>
        {MID.map(([text, x, y, anchor, blue]) => (
          <text key={text} className={blue ? "lab lab-mid blue" : "lab lab-mid"} x={x} y={y} textAnchor={anchor ?? "middle"}>
            {text}
          </text>
        ))}
      </g>
      <g className="labs-small">
        {SMALL.map(([text, x, y, anchor, blue]) => (
          <text key={text} className={blue ? "lab lab-small blue" : "lab lab-small"} x={x} y={y} textAnchor={anchor ?? "middle"}>
            {text}
          </text>
        ))}
      </g>
      <g className="route-plan">
        {ROUTE.pieces.map((l, i) => (
          <path key={i} d={l} />
        ))}
      </g>
      <g className="labs-stop">
        {CHAPTERS.map((c) => (
          <Banner key={c.id} x={c.label[0]} y={c.label[1]} name={c.name} chapter={c.num ? `${c.num} · ${c.chapter}` : c.chapter} />
        ))}
      </g>
    </svg>
  )
})

/**
 * The map that lies behind every page: a fixed leaf, drawn once. The scene
 * moves the view across it as the page scrolls, and inks in the red road.
 */
function MapStage() {
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const root = ref.current!
    const q = <T extends Element>(sel: string) => root.querySelector<T>(sel)!
    scene.map = {
      leaf: q<HTMLElement>(".map-leaf"),
      far: q<SVGSVGElement>(".map-art.far"),
      near: q<SVGSVGElement>(".map-art.near"),
      road: q<SVGSVGElement>(".map-road"),
      route: q<SVGPathElement>(".route-done"),
      head: q<SVGGElement>(".route-head"),
      marks: Array.from(root.querySelectorAll<SVGGElement>(".mark")),
      fires: Array.from(root.querySelectorAll<SVGGElement>(".fire")),
      dusk: q<HTMLElement>(".dusk"),
      fogB: q<HTMLElement>(".fog-b"),
      fogL: q<HTMLElement>(".fog-l"),
    }
    scene.relayout(true)
    const onResize = () => scene.relayout()
    window.addEventListener("resize", onResize)
    return () => {
      window.removeEventListener("resize", onResize)
      scene.map = null
    }
  }, [])

  return (
    <div ref={ref} className="stage" aria-hidden="true">
      <div className="map-leaf">
        <MapArt layer="far" />
        <MapArt layer="near" />
        <div className="dusk" />
        {/* the red road, as far as it has been travelled, and the places along it */}
        <svg className="map map-road" viewBox="700 0 2200 1500" preserveAspectRatio="xMidYMid slice" focusable="false">
          <defs>
            <radialGradient id="fire-glow">
              <stop offset="0" stopColor="#ffb648" stopOpacity="0.85" />
              <stop offset="0.4" stopColor="#ff8a2a" stopOpacity="0.35" />
              <stop offset="1" stopColor="#ff8a2a" stopOpacity="0" />
            </radialGradient>
          </defs>
          <path className="route-done" d={ROUTE.d} />
          {CHAPTERS.map((c, i) => (
            <a key={c.id} href={"#" + c.id} tabIndex={-1} className="mark-link">
              <g className="mark" data-x={STOPS[i].door[0]} data-y={STOPS[i].door[1]}>
                <circle className="mark-hit" r="17" />
                <circle className="mark-ring" r="10" />
                {c.num ? (
                  <text className="mark-num" y="3.400" textAnchor="middle">
                    {c.num}
                  </text>
                ) : (
                  <path className="mark-star" d={starPath(0, 0, 6.5, 2.6)} />
                )}
              </g>
            </a>
          ))}
          {/* the beacon-fires of Gondor, unlit until they are called for */}
          {BEACONS.map((b, i) => (
            <g key={b.name} className="fire" data-x={b.x} data-y={b.y}>
              <circle className="fire-glow" r="52" cy="-8" fill="url(#fire-glow)" />
              <path className="fire-pyre" d="M-10 7L-4 -1H4L10 7Z" />
              <path className="fire-flame" d="M-7 0C-10 -11 -2 -13 0 -25C2 -13 10 -11 7 0Z" />
              <path className="fire-core" d="M-3 0C-4 -6 0 -7 0 -14C1 -7 4 -6 3 0Z" />
              <text className="fire-name" y={i % 2 ? -52 : -36} textAnchor="middle">
                {b.name}
              </text>
            </g>
          ))}
          <g className="route-head">
            <circle className="head-pulse" r="9" />
            <circle className="head-dot" r="3.600" />
          </g>
        </svg>
      </div>
      <div className="fog-l" />
      <div className="fog-b" />
    </div>
  )
}

export default memo(MapStage)
