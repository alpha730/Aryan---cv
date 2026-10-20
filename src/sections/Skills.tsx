import { memo, useLayoutEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import TitleCard, { titleCardMotion } from "../components/TitleCard"
import { Chips } from "../components/Chips"
import { skills } from "../data/profile"
import { morphTrigger } from "../motion/scene"
import { decode } from "../motion/text"
import { ROMAN } from "../motion/world"

function Skills() {
  const ref = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const card = el.querySelector<HTMLElement>(".tc")!
    const body = el.querySelector<HTMLElement>(".chapter-body")!
    const ctx = gsap.context(() => {
      // the Horn falls apart and is forged again as the Seven, under Durin's crown
      morphTrigger(7, { trigger: card, start: "top 75%", end: "top 5%" })
      morphTrigger(8, { trigger: body, start: "top 85%", end: "top 30%" })
    }, el)

    const mm = gsap.matchMedia(el)
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      titleCardMotion(card)
      gsap.set(".skill", { opacity: 0, y: 80, rotateX: -38, transformPerspective: 900, transformOrigin: "50% 0%" })
      ScrollTrigger.batch(".skill", {
        start: "top 90%",
        once: true,
        onEnter: (batch) => {
          gsap.to(batch, { opacity: 1, y: 0, rotateX: 0, duration: 1.1, ease: "power3.out", stagger: 0.09 })
          // each card's words were runes until they arrived
          batch.forEach((b, i) => {
            b.querySelectorAll<HTMLElement>(".chips li").forEach((w, j) => {
              gsap.delayedCall(0.15 + i * 0.09 + j * 0.05, () => decode(w, undefined, 650))
            })
          })
        },
      })
    })
    return () => {
      mm.revert()
      ctx.revert()
    }
  }, [])

  return (
    <section ref={ref} id="skills" className="chapter" aria-labelledby="skills-title">
      <TitleCard
        kicker="Chapter IV"
        realm="Khazad-dûm"
        title="Skills"
        relic="The Seven Rings of the Dwarf-lords"
        lore="Seven rings went to the seven houses of the Dwarves, masters of every craft. Here are seven crafts of mine."
        titleId="skills-title"
      />
      <div className="chapter-body">
        <div className="wrap skills">
          {skills.map((s, i) => (
            <article className={`skill span-${s.span}`} key={s.label}>
              <span className="skill-rune" aria-hidden="true">
                {s.rune}
              </span>
              <p className="skill-ring">Ring {ROMAN[i]}</p>
              <h3>{s.label}</h3>
              <Chips items={s.items} />
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default memo(Skills)
