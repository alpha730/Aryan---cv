/**
 * The two hidden things at the end of the road: the beacons of Gondor, and
 * the Doors of Durin. Anything may ask for one; the component that owns it
 * listens here.
 */
export type Egg = "beacons" | "doors"

const listeners = new Set<(egg: Egg) => void>()

export function onEgg(fn: (egg: Egg) => void) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

export function openEgg(egg: Egg) {
  for (const l of listeners) l(egg)
}

/** The seven beacon-hills of Gondor, from Minas Tirith west to the borders of Rohan. */
export const BEACONS: { name: string; x: number; y: number }[] = [
  { name: "Amon Dîn", x: 2142, y: 1204 },
  { name: "Eilenach", x: 2110, y: 1211 },
  { name: "Nardol", x: 2078, y: 1205 },
  { name: "Erelas", x: 2046, y: 1212 },
  { name: "Min-Rimmon", x: 2014, y: 1206 },
  { name: "Calenhad", x: 1982, y: 1213 },
  { name: "Halifirien", x: 1950, y: 1207 },
]
