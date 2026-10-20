import gsap from "gsap"
import { scene } from "./scene"

const listeners = new Set<(on: boolean) => void>()

export function onUnseenChange(fn: (on: boolean) => void) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

/**
 * Putting on the Ring: a grey, whispering veil spreads out from where you
 * pressed, as the world goes when Frodo slips it on. Taking it off draws the
 * veil back in.
 */
export function wearRing(on: boolean, x = window.innerWidth / 2, y = window.innerHeight / 2) {
  const root = document.documentElement
  const veil = document.querySelector<HTMLElement>(".unseen-veil")
  if (!veil) return
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  gsap.killTweensOf(veil)
  for (const l of listeners) l(on)
  if (on) {
    root.classList.add("is-unseen")
    scene.setUnseen(true)
    if (still) gsap.set(veil, { clipPath: "circle(150% at 50% 50%)" })
    else
      gsap.fromTo(
        veil,
        { clipPath: `circle(0% at ${x}px ${y}px)` },
        { clipPath: `circle(150% at ${x}px ${y}px)`, duration: 1.3, ease: "power3.inOut" }
      )
    return
  }
  const done = () => {
    root.classList.remove("is-unseen")
    scene.setUnseen(false)
  }
  if (still) {
    gsap.set(veil, { clipPath: "circle(0% at 50% 50%)" })
    done()
  } else gsap.to(veil, { clipPath: `circle(0% at ${x}px ${y}px)`, duration: 0.9, ease: "power3.inOut", onComplete: done })
}
