import { memo, useLayoutEffect, useRef } from "react"
import gsap from "gsap"
import TitleCard, { titleCardMotion } from "../components/TitleCard"
import { Chips } from "../components/Chips"
import { Arrow } from "../components/icons"
import { projects } from "../data/profile"
import { morphTrigger } from "../motion/scene"

function RelicArt({ kind }: { kind: "palantir" | "voice" }) {
  if (kind === "palantir") {
    return (
      <div className="relic-art art-palantir" aria-hidden="true">
        <div className="orb">
          <span className="orb-swirl" />
          <span className="orb-shine" />
        </div>
        <div className="orb-stand" />
      </div>
    )
  }
  return (
    <div className="relic-art art-voice" aria-hidden="true">
      <div className="wave">
        {Array.from({ length: 31 }, (_, i) => (
          <span
            key={i}
            style={{ animationDelay: `${(i % 7) * -0.17 - i * 0.05}s`, ["--h" as string]: 0.25 + Math.abs(Math.sin(i * 0.7)) * 0.75 }}
          />
        ))}
      </div>
      <p className="wave-lang">हिंदी · English</p>
    </div>
  )
}

function Projects() {
  const ref = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const card = el.querySelector<HTMLElement>(".tc")!
    const pinEl = el.querySelector<HTMLElement>(".forge-pin")!
    const track = el.querySelector<HTMLElement>(".forge-track")!
    const second = el.querySelectorAll<HTMLElement>(".relic")[1]
    const ctx = gsap.context(() => {
      // Nenya's water catches fire: Narya, which then cools into the Palantír behind the first project
      morphTrigger(4, { trigger: card, start: "top 75%", end: "top 5%" })
      morphTrigger(5, { trigger: pinEl, start: "top bottom", end: "top top" })
    }, el)

    const mm = gsap.matchMedia(el)
    mm.add(
      { wide: "(min-width: 900px)", motion: "(prefers-reduced-motion: no-preference)" },
      (c) => {
        const { wide, motion } = c.conditions ?? {}
        if (motion) titleCardMotion(card)
        if (wide) {
          // vertical scrolling walks the projects past sideways
          const distance = () => track.scrollWidth - window.innerWidth
          const relics = gsap.utils.toArray<HTMLElement>(".relic, .forge-end")
          const skewTo = gsap.quickTo(relics, "skewX", { duration: 0.6, ease: "power3" })
          const walk = gsap.to(track, {
            x: () => -distance(),
            ease: "none",
            scrollTrigger: {
              trigger: pinEl,
              start: "top top",
              end: () => "+=" + distance(),
              pin: true,
              scrub: motion ? 0.8 : true,
              invalidateOnRefresh: true,
              onUpdate: (self) => {
                if (motion) skewTo(gsap.utils.clamp(-7, 7, self.getVelocity() / -320))
              },
              onScrubComplete: () => skewTo(0),
            },
          })
          // the Palantír pours itself into the Horn as the second project arrives
          if (second) morphTrigger(6, { trigger: second, containerAnimation: walk, start: "left 85%", end: "left 30%" })
          if (motion) {
            gsap.from(".forge-end .split-char", {
              opacity: 0,
              yPercent: 60,
              stagger: 0.03,
              ease: "power2.out",
              scrollTrigger: { trigger: ".forge-end", containerAnimation: walk, start: "left 85%", end: "left 45%", scrub: true },
            })
          }
        } else {
          if (second) morphTrigger(6, { trigger: second, start: "top 85%", end: "top 30%" })
          if (motion) {
            gsap.utils.toArray<HTMLElement>(".relic").forEach((r) => {
              gsap.from(r, { opacity: 0, y: 60, duration: 1, ease: "power3.out", scrollTrigger: { trigger: r, start: "top 88%" } })
            })
          }
        }
      }
    )
    return () => {
      mm.revert()
      ctx.revert()
    }
  }, [])

  return (
    <section ref={ref} id="projects" className="chapter" aria-labelledby="projects-title">
      <TitleCard
        kicker="Chapter III"
        realm="Eregion"
        title="Projects"
        relic="Narya, the Ring of Fire"
        lore="The Rings were forged in Eregion, and Narya was given for heavy labours. These are mine, forged in code."
        titleId="projects-title"
      />
      <div className="forge-pin">
        <div className="forge-track">
          {projects.map((p) => (
            <article className="relic" key={p.title}>
              <div className="relic-side">
                <RelicArt kind={p.art} />
                <p className="relic-caption">
                  <span className="relic-name">{p.relic}</span>
                  {p.lore}
                </p>
              </div>
              <div className="relic-body">
                <header className="entry-head">
                  <h3 className="entry-title">{p.title}</h3>
                  {p.github ? (
                    <a className="textlink" href={p.github} target="_blank" rel="noopener noreferrer">
                      GitHub <Arrow />
                    </a>
                  ) : null}
                </header>
                <Chips items={p.stack} />
                <ul className="entry-points">
                  {p.points.map((pt) => (
                    <li key={pt}>{pt}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
          <div className="forge-end">
            <p className="forge-end-big">
              {"More projects".split("").map((ch, i) => (
                <span className="split-char" key={i}>
                  {ch === " " ? " " : ch}
                </span>
              ))}
            </p>
            <p className="forge-end-small">are being forged.</p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default memo(Projects)
