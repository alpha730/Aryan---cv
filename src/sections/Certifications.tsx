import { memo, useLayoutEffect, useRef } from "react"
import gsap from "gsap"
import TitleCard, { titleCardMotion } from "../components/TitleCard"
import { Arrow, RingMark } from "../components/icons"
import { certifications } from "../data/profile"
import { morphTrigger } from "../motion/scene"

function Certifications() {
  const ref = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const card = el.querySelector<HTMLElement>(".tc")!
    const body = el.querySelector<HTMLElement>(".chapter-body")!
    const ctx = gsap.context(() => {
      // the Tree's branches twine into the serpents of Barahir's ring
      morphTrigger(12, { trigger: card, start: "top 75%", end: "top 5%" })
      morphTrigger(13, { trigger: body, start: "top 85%", end: "top 30%" })
    }, el)

    const mm = gsap.matchMedia(el)
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      titleCardMotion(card)
      gsap.utils.toArray<HTMLElement>(".cert").forEach((cert) => {
        gsap
          .timeline({ scrollTrigger: { trigger: cert, start: "top 92%", end: "top 50%", scrub: 0.6 } })
          .fromTo(cert, { opacity: 0, x: 160, rotate: 3 }, { opacity: 1, x: 0, rotate: 0, ease: "none" })
          // the seal is pressed home
          .fromTo(cert.querySelector(".cert-seal"), { scale: 1.6, rotate: -40, opacity: 0 }, { scale: 1, rotate: 0, opacity: 1, ease: "back.out(2)" }, 0.45)
      })
    })
    return () => {
      mm.revert()
      ctx.revert()
    }
  }, [])

  return (
    <section ref={ref} id="certifications" className="chapter" aria-labelledby="certifications-title">
      <TitleCard
        kicker="Chapter VI"
        realm="Arnor"
        title="Certifications"
        relic="The Ring of Barahir"
        lore="Finrod's token to Barahir, and long after, the proof of Aragorn's line: a credential, of a kind."
        titleId="certifications-title"
      />
      <div className="chapter-body is-short">
        <div className="wrap">
          <div className="certs">
            {certifications.map((c) => (
              <article className="entry entry-card cert" key={c.title}>
                <span className="cert-seal" aria-hidden="true">
                  <RingMark size={40} />
                </span>
                <div>
                  <h3 className="entry-title">{c.title}</h3>
                  <div className="entry-sub">
                    <p>{c.issuer}</p>
                  </div>
                  {c.url ? (
                    <a className="textlink" href={c.url} target="_blank" rel="noopener noreferrer">
                      View certificate <Arrow />
                    </a>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default memo(Certifications)
