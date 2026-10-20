import { memo, useEffect } from "react"
import gsap from "gsap"
import { RingMark, Sting } from "./icons"
import { profile } from "../data/profile"
import { REALMS, ROMAN } from "../motion/world"

/** The CV's sections, in the CV's order. */
export const SECTIONS = [
  { label: "Education", href: "#education" },
  { label: "Research", href: "#research" },
  { label: "Projects", href: "#projects" },
  { label: "Skills", href: "#skills" },
  { label: "Experience", href: "#experience" },
  { label: "Certifications", href: "#certifications" },
]

/**
 * The chrome that stays put while the world changes underneath: the bar,
 * the realm you are in, the road you have walked, and the cursor.
 */
function Hud({ revealed }: { revealed: boolean }) {
  // Sting for a cursor, on devices with a mouse: it glows blue when there is something to click
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return
    const el = document.querySelector<HTMLElement>(".cursor")
    if (!el) return
    const root = document.documentElement
    root.classList.add("has-cursor")
    const move = (e: PointerEvent) => {
      if (e.pointerType === "touch") {
        el.classList.remove("is-on")
        return
      }
      el.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`
      el.classList.add("is-on")
    }
    const over = (e: PointerEvent) => {
      const t = e.target as Element | null
      el.classList.toggle("is-hover", !!t?.closest?.("a, button, [role='button'], summary, label"))
    }
    const out = (e: PointerEvent) => {
      if (!e.relatedTarget) el.classList.remove("is-on")
    }
    const down = () => el.classList.add("is-down")
    const up = () => el.classList.remove("is-down")
    window.addEventListener("pointermove", move, { passive: true })
    window.addEventListener("pointerover", over, { passive: true })
    window.addEventListener("pointerout", out, { passive: true })
    window.addEventListener("pointerdown", down, { passive: true })
    window.addEventListener("pointerup", up, { passive: true })
    return () => {
      root.classList.remove("has-cursor")
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerover", over)
      window.removeEventListener("pointerout", out)
      window.removeEventListener("pointerdown", down)
      window.removeEventListener("pointerup", up)
    }
  }, [])

  useEffect(() => {
    if (!revealed) return
    const tween = gsap.fromTo(
      ".hud-fade",
      { opacity: 0, y: (i: number) => (i === 0 ? -14 : 14) },
      { opacity: 1, y: 0, duration: 1.2, delay: 1.1, stagger: 0.12, ease: "power3.out" }
    )
    return () => {
      tween.kill()
    }
  }, [revealed])

  return (
    <>
      <header className="hud-top hud-fade">
        <a className="brand" href="#top">
          <RingMark />
          {profile.name}
        </a>
        <nav aria-label="Sections">
          <ul>
            {SECTIONS.map((s) => (
              <li key={s.href}>
                <a href={s.href}>{s.label}</a>
              </li>
            ))}
          </ul>
        </nav>
        <a className="hud-cta" href="#contact">
          Contact
        </a>
      </header>
      <div className="hud-realm hud-fade" aria-hidden="true">
        <div className="hud-spine">
          <p className="hud-realm-num">
            Realm I / {ROMAN[REALMS.length - 1]}
          </p>
          <p className="hud-realm-name">{REALMS[0].name}</p>
          <p className="hud-realm-place">{REALMS[0].place}</p>
        </div>
      </div>
      <div className="hud-road hud-fade" aria-hidden="true">
        <span className="hud-road-ring" />
      </div>
      <div className="cursor" aria-hidden="true">
        <Sting />
      </div>
    </>
  )
}

export default memo(Hud)
