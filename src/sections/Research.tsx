import { memo, useLayoutEffect, useRef } from "react"
import gsap from "gsap"
import TitleCard, { titleCardMotion } from "../components/TitleCard"
import Entry from "../components/Entry"
import { Arrow } from "../components/icons"
import { research } from "../data/profile"
import { morphTrigger } from "../motion/scene"

function Research() {
  const ref = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const card = el.querySelector<HTMLElement>(".tc")!
    const body = el.querySelector<HTMLElement>(".chapter-body")!
    const ctx = gsap.context(() => {
      // the winds of Vilya fall still: Nenya, over the Mirror
      morphTrigger(2, { trigger: card, start: "top 75%", end: "top 5%" })
      morphTrigger(3, { trigger: body, start: "top 85%", end: "top 30%" })
    }, el)

    const mm = gsap.matchMedia(el)
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      titleCardMotion(card)
      gsap.from(".research .entry-head, .research .entry-sub", {
        opacity: 0,
        y: 40,
        stagger: 0.1,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: { trigger: ".research", start: "top 85%" },
      })
      // each finding arrives as you reach it
      gsap.utils.toArray<HTMLElement>(".research .entry-points li").forEach((li) => {
        gsap.from(li, { opacity: 0, x: -40, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: li, start: "top 88%" } })
      })
      // and the tally counts itself
      gsap.utils.toArray<HTMLElement>(".tally dd").forEach((dd) => {
        const to = Number(dd.dataset.n)
        const v = { n: 0 }
        dd.textContent = "0"
        gsap.to(v, {
          n: to,
          duration: to > 100 ? 2.2 : 1.4,
          ease: "power2.out",
          scrollTrigger: { trigger: dd, start: "top 92%" },
          onUpdate: () => {
            dd.textContent = String(Math.round(v.n))
          },
        })
      })
    })
    return () => {
      mm.revert()
      ctx.revert()
    }
  }, [])

  return (
    <section ref={ref} id="research" className="chapter" aria-labelledby="research-title">
      <TitleCard
        kicker="Chapter II"
        realm="Lothlórien"
        title="Research Experience"
        relic="Nenya, the Ring of Adamant"
        lore="Galadriel's ring kept Lórien hidden from the Eye. This research asks how to keep an agent safe from what it reads."
        titleId="research-title"
      />
      <div className="chapter-body">
        <div className="wrap research">
          {research.map((r) => (
            <Entry
              key={r.title}
              className="entry-card"
              title={r.title}
              when={r.when}
              sub={r.kind}
              meta={
                r.github ? (
                  <a className="textlink" href={r.github} target="_blank" rel="noopener noreferrer">
                    GitHub <Arrow />
                  </a>
                ) : (
                  <span className="status">
                    <i aria-hidden="true" />
                    In progress
                  </span>
                )
              }
              points={r.points}
            >
              <dl className="tally">
                {r.tally.map((t) => (
                  <div key={t.label}>
                    <dt>{t.label}</dt>
                    <dd data-n={t.n}>{t.n}</dd>
                  </div>
                ))}
              </dl>
            </Entry>
          ))}
        </div>
      </div>
    </section>
  )
}

export default memo(Research)
