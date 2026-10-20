import { memo, useLayoutEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import TitleCard, { titleCardMotion } from "../components/TitleCard"
import Entry from "../components/Entry"
import { education } from "../data/profile"
import { morphTrigger } from "../motion/scene"

function Education() {
  const ref = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const card = el.querySelector<HTMLElement>(".tc")!
    const body = el.querySelector<HTMLElement>(".chapter-body")!
    const ctx = gsap.context(() => {
      // the One Ring melts into Vilya, then settles behind the text
      morphTrigger(0, { trigger: card, start: "top 75%", end: "top 5%" })
      morphTrigger(1, { trigger: body, start: "top 85%", end: "top 30%" })
    }, el)

    const mm = gsap.matchMedia(el)
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      titleCardMotion(card)
      // the line draws itself down the years, and each entry kindles as it reaches it
      gsap.fromTo(
        ".timeline-line",
        { scaleY: 0 },
        { scaleY: 1, ease: "none", scrollTrigger: { trigger: ".timeline", start: "top 75%", end: "bottom 60%", scrub: true } }
      )
      gsap.utils.toArray<HTMLElement>(".timeline-item").forEach((li) => {
        const entry = li.querySelector(".entry")
        if (entry) {
          gsap.from(entry, {
            opacity: 0,
            x: 60,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: { trigger: li, start: "top 85%", toggleActions: "play none none reverse" },
          })
        }
        ScrollTrigger.create({
          trigger: li,
          start: "top 70%",
          onEnter: () => li.classList.add("is-lit"),
          onLeaveBack: () => li.classList.remove("is-lit"),
        })
      })
      const cgpa = el.querySelector<HTMLElement>("[data-count]")
      if (cgpa) {
        const n = { v: 0 }
        cgpa.textContent = "0.0"
        gsap.to(n, {
          v: Number(cgpa.dataset.count),
          duration: 1.8,
          ease: "power2.out",
          scrollTrigger: { trigger: cgpa, start: "top 90%" },
          onUpdate: () => {
            cgpa.textContent = n.v.toFixed(1)
          },
        })
      }
    })
    return () => {
      mm.revert()
      ctx.revert()
    }
  }, [])

  return (
    <section ref={ref} id="education" className="chapter" aria-labelledby="education-title">
      <TitleCard
        kicker="Chapter I"
        realm="Rivendell"
        title="Education"
        relic="Vilya, the Ring of Air"
        lore="Mightiest of the Three, kept by Elrond in Rivendell: the house where the heirs of kings were taught."
        titleId="education-title"
      />
      <div className="chapter-body">
        <div className="wrap">
          <div className="timeline">
            <span className="timeline-line" aria-hidden="true" />
            <ol className="timeline-list">
              {education.map((e) => (
                <li key={e.school} className="timeline-item">
                  <span className="timeline-mark" aria-hidden="true" />
                  <Entry className="entry-card" title={e.school} when={e.when} sub={e.degree} meta={e.place}>
                    {e.cgpa ? (
                      <p className="grade">
                        <span className="grade-label">CGPA</span>
                        <span className="grade-value">
                          <span data-count={e.cgpa}>{e.cgpa.toFixed(1)}</span>
                          <small>/10</small>
                        </span>
                      </p>
                    ) : null}
                  </Entry>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  )
}

export default memo(Education)
