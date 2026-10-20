import { Fragment, memo, useLayoutEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

/** The Ring-verse on one row, the work on the other. */
const ROWS = [
  ["Three for the Elven-kings", "Seven for the Dwarf-lords", "Nine for Mortal Men", "One for the Dark Lord"],
  ["LLM agents", "Earth observation", "Prompt-injection research", "LangGraph", "RAG", "Sentinel-1 & 2", "Voice AI", "PyTorch"],
]

/** A banner between the hero and the first chapter; scrolling hard makes it race. */
function Marquee() {
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const mm = gsap.matchMedia(ref.current ?? undefined)
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const rows = gsap.utils.toArray<HTMLElement>(".marquee-track")
      const loops = rows.map((row, i) =>
        gsap.fromTo(row, { xPercent: i % 2 ? -50 : 0 }, { xPercent: i % 2 ? 0 : -50, duration: 42, ease: "none", repeat: -1 })
      )
      ScrollTrigger.create({
        trigger: ref.current,
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => {
          const boost = 1 + Math.min(6, Math.abs(self.getVelocity()) / 260)
          for (const l of loops) {
            gsap.to(l, {
              timeScale: boost,
              duration: 0.15,
              overwrite: true,
              onComplete: () => {
                gsap.to(l, { timeScale: 1, duration: 1.2, ease: "power2.out", overwrite: true })
              },
            })
          }
        },
      })
      gsap.fromTo(
        ref.current,
        { rotate: -3 },
        { rotate: 1.5, ease: "none", scrollTrigger: { trigger: ref.current, start: "top bottom", end: "bottom top", scrub: true } }
      )
    })
    return () => mm.revert()
  }, [])

  return (
    <div className="marquee-wrap" aria-hidden="true">
      <div ref={ref} className="marquee">
      {ROWS.map((words, row) => (
        <div className="marquee-row" key={row}>
          <div className="marquee-track">
            {[0, 1].map((copy) => (
              <span key={copy}>
                {words.map((w) => (
                  <Fragment key={w}>
                    {w}
                    <i>✦</i>
                  </Fragment>
                ))}
              </span>
            ))}
          </div>
        </div>
      ))}
      </div>
    </div>
  )
}

export default memo(Marquee)
