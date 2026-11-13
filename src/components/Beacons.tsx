import { memo, useEffect, useRef, useState } from "react"
import gsap from "gsap"
import { Arrow } from "./icons"
import { profile } from "../data/profile"
import { BEACONS, onEgg } from "../motion/eggs"
import { scene } from "../motion/scene"

/**
 * Light the beacons: the page falls away, the map turns to the White
 * Mountains at dusk, and the fires of Gondor are lit one after another from
 * Minas Tirith to the borders of Rohan. Gondor calls for aid; the answer is
 * a letter to Aryan.
 */
function Beacons() {
  const [open, setOpen] = useState(false)
  /** how many fires are burning */
  const [lit, setLit] = useState(0)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => onEgg((egg) => egg === "beacons" && setOpen(true)), [])

  useEffect(() => {
    if (!open) return
    const root = document.documentElement
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const fires = scene.map?.fires ?? []
    root.classList.add("is-egg")
    scene.lenis?.stop()
    setLit(0)
    const timers: number[] = []
    const travel = gsap.to(scene, { egg: 1, duration: still ? 0 : 2.6, ease: "power2.inOut" })
    BEACONS.forEach((_, i) => {
      timers.push(
        window.setTimeout(
          () => {
            fires[i]?.classList.add("on")
            setLit(i + 1)
          },
          still ? 0 : 2900 + i * 850
        )
      )
    })
    closeRef.current?.focus({ preventScroll: true })
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    window.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("keydown", onKey)
      timers.forEach(clearTimeout)
      travel.kill()
      gsap.to(scene, {
        egg: 0,
        duration: still ? 0 : 1.6,
        ease: "power2.inOut",
        onComplete: () => fires.forEach((f) => f.classList.remove("on")),
      })
      root.classList.remove("is-egg")
      scene.lenis?.start()
    }
  }, [open])

  if (!open) return null
  const done = lit >= BEACONS.length
  return (
    <div className="egg beacons" role="dialog" aria-modal="true" aria-label="The beacons of Gondor">
      <div className="beacons-top">
        <p className="beacons-count" aria-live="polite">
          {lit === 0 ? "Night falls on the White Mountains" : done ? "The beacons are lit" : `${BEACONS[lit - 1].name} is lit`}
        </p>
        <p className={done ? "beacons-call is-on" : "beacons-call"}>Gondor calls for aid.</p>
      </div>
      <div className={done ? "beacons-foot is-on" : "beacons-foot"}>
        <a className="btn beacons-answer" href={profile.links.gmail} target="_blank" rel="noopener noreferrer" tabIndex={done ? 0 : -1}>
          And Rohan will answer <Arrow />
        </a>
        <p className="beacons-fine">It opens a letter to {profile.name}.</p>
      </div>
      <button ref={closeRef} type="button" className="egg-close" onClick={() => setOpen(false)}>
        Back to the page
      </button>
    </div>
  )
}

export default memo(Beacons)
