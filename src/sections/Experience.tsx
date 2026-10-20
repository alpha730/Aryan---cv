import { memo, useLayoutEffect, useRef } from "react"
import gsap from "gsap"
import TitleCard, { titleCardMotion } from "../components/TitleCard"
import Entry from "../components/Entry"
import { experience } from "../data/profile"
import { morphTrigger } from "../motion/scene"

function Experience() {
  const ref = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const card = el.querySelector<HTMLElement>(".tc")!
    const body = el.querySelector<HTMLElement>(".chapter-body")!
    const ctx = gsap.context(() => {
      // the Seven branch out into the White Tree
      morphTrigger(9, { trigger: card, start: "top 75%", end: "top 5%" })
      morphTrigger(10, { trigger: body, start: "top 85%", end: "top 30%" })
    }, el)

    const mm = gsap.matchMedia(el)
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      titleCardMotion(card)
      gsap.utils.toArray<HTMLElement>(".experience .entry").forEach((entry) => {
        gsap
          .timeline({ scrollTrigger: { trigger: entry, start: "top 92%", end: "top 45%", scrub: 0.6 } })
          .fromTo(entry, { opacity: 0, x: -160, rotate: -3 }, { opacity: 1, x: 0, rotate: 0, ease: "none" })
          .from(entry.querySelectorAll(".entry-points li"), { opacity: 0, y: 20, stagger: 0.1, ease: "none" }, 0.4)
      })
    })
    return () => {
      mm.revert()
      ctx.revert()
    }
  }, [])

  return (
    <section ref={ref} id="experience" className="chapter" aria-labelledby="experience-title">
      <TitleCard
        kicker="Chapter V"
        realm="Gondor"
        title="Experience"
        relic="The White Tree, sigil of the House of Elendil"
        lore="Its banner flew over the White City, borne by all who served it. Here is where I have served."
        titleId="experience-title"
      />
      <div className="chapter-body is-short">
        <div className="wrap">
          <div className="experience">
            {experience.map((x) => (
              <Entry key={x.org} className="entry-card" title={x.org} when={x.when} sub={x.role} points={x.points} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default memo(Experience)
