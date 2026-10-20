import { memo, useEffect, useLayoutEffect, useRef } from "react"
import gsap from "gsap"
import { SplitChars } from "../components/Split"
import { Arrow } from "../components/icons"
import { ProfileLinks } from "../components/Profiles"
import { profile } from "../data/profile"
import { decode } from "../motion/text"

const HIDDEN = [".hero-eyebrow", ".hero-body", ".hero-ctas > *", ".hero-hint"]

/** The Ring itself lives on the stage behind; this is the writing beneath it. */
function Hero({ revealed }: { revealed: boolean }) {
  const ref = useRef<HTMLElement>(null)

  // everything waits behind the doors
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(".hero-h1 .split-char", { opacity: 0, yPercent: 60, rotateX: -70, filter: "blur(10px)" })
      gsap.set(HIDDEN, { opacity: 0, y: 24 })
    }, ref)
    return () => ctx.revert()
  }, [])

  useEffect(() => {
    if (!revealed) return
    const root = ref.current
    const backdrop = document.querySelector<HTMLElement>(".hero-backdrop")
    const mm = gsap.matchMedia(root ?? undefined)
    mm.add(
      { motion: "(prefers-reduced-motion: no-preference)", still: "(prefers-reduced-motion: reduce)" },
      (c) => {
        if (c.conditions?.still) {
          gsap.set(".hero-h1 .split-char", { opacity: 1, yPercent: 0, rotateX: 0, filter: "none" })
          gsap.set(HIDDEN, { opacity: 1, y: 0 })
          return
        }
        const eyebrow = root?.querySelector<HTMLElement>(".hero-eyebrow")
        gsap
          .timeline({ delay: 0.55, onComplete: () => c.add(scrollOut) })
          .fromTo(backdrop, { opacity: 0, scale: 1.08 }, { opacity: 1, scale: 1, duration: 2.6, ease: "power2.out" }, 0)
          .to(".hero-eyebrow", { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }, 0.2)
          .add(() => {
            if (eyebrow) decode(eyebrow)
          }, 0.2)
          .to(
            ".hero-h1 .split-char",
            { opacity: 1, yPercent: 0, rotateX: 0, filter: "blur(0px)", duration: 1.1, ease: "power3.out", stagger: 0.035 },
            0.35
          )
          .to([".hero-body", ".hero-ctas > *"], { opacity: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.08 }, 0.95)
          .to(".hero-hint", { opacity: 1, y: 0, duration: 0.8 }, 1.4)

        // as you leave, the words come apart like the Ring does
        function scrollOut() {
          gsap
            .timeline({ scrollTrigger: { trigger: root, start: "top top", end: "bottom top", scrub: 0.6 } })
            .fromTo(
              ".hero-h1 .split-char",
              { opacity: 1, y: 0, filter: "blur(0px)" },
              {
                opacity: 0,
                y: (i: number) => -50 - ((i * 37) % 110),
                filter: "blur(6px)",
                stagger: { each: 0.012, from: "random" },
                ease: "none",
                immediateRender: false,
              },
              0
            )
            .fromTo([".hero-eyebrow", ".hero-aside"], { opacity: 1, y: 0 }, { opacity: 0, y: -70, ease: "none", immediateRender: false }, 0)
            .fromTo(".hero-hint", { opacity: 1 }, { opacity: 0, duration: 0.3, ease: "none", immediateRender: false }, 0)
            .fromTo(backdrop, { opacity: 1, scale: 1 }, { opacity: 0, scale: 1.25, ease: "none", immediateRender: false }, 0)
        }
      }
    )
    return () => mm.revert()
  }, [revealed])

  return (
    <section ref={ref} className="hero" id="top" aria-label="Introduction">
      <p className="hero-hint" aria-hidden="true">
        Stir the Ring
      </p>
      <div className="hero-copy">
        <div>
          <p className="hero-eyebrow">B.Tech · Jaipur, India</p>
          <h1 className="hero-h1">
            <span className="hero-line">
              <SplitChars text={profile.name} />
            </span>
            <span className="hero-line hero-accent">
              <SplitChars text="AI & ML, to rule them all." />
            </span>
          </h1>
        </div>
        <div className="hero-aside">
          <p className="hero-body">
            I forge LLM agents that read the Earth from orbit, and I test whether they can be corrupted by what they
            read.
          </p>
          <div className="hero-ctas">
            <a className="btn" href="#education">
              Begin the journey <Arrow />
            </a>
            <ProfileLinks className="hero-links" />
          </div>
        </div>
      </div>
    </section>
  )
}

export default memo(Hero)
