import { memo, useEffect, useLayoutEffect, useRef, useState } from "react"
import gsap from "gsap"
import TitleCard, { titleCardMotion } from "../components/TitleCard"
import { Arrow, CheckIcon, CopyIcon, FlameIcon } from "../components/icons"
import { profile } from "../data/profile"
import { morphTrigger } from "../motion/scene"
import { openEgg } from "../motion/eggs"

const LINES = ["The road goes", "ever on."]

/** The address itself: one press copies it, for anyone who would rather write from their own mail app. */
function CopyEmail() {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 2200)
    return () => clearTimeout(t)
  }, [copied])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profile.email)
      setCopied(true)
    } catch {
      // no clipboard (an insecure page, or permission refused): hand it to the mail app instead
      window.location.href = `mailto:${profile.email}`
    }
  }

  return (
    <button type="button" className="contact-mail" onClick={copy}>
      <span>{profile.email}</span>
      <span className="contact-mail-hint" aria-live="polite">
        {copied ? <CheckIcon /> : <CopyIcon />}
        {copied ? "Copied" : "Copy"}
      </span>
    </button>
  )
}

function Contact() {
  const ref = useRef<HTMLElement>(null)
  const { links } = profile


  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const card = el.querySelector<HTMLElement>(".tc")!
    const body = el.querySelector<HTMLElement>(".chapter-body")!
    const ctx = gsap.context(() => {
      // the last leg: down Anduin and round the coast by ship, to the Havens
      morphTrigger(14, { trigger: card, start: "top 75%", end: "top 5%" })
      morphTrigger(15, { trigger: body, start: "top 85%", end: "top 45%" })
    }, el)

    const mm = gsap.matchMedia(el)
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      titleCardMotion(card)
      // each outlined line fills with gold as you reach it
      gsap.utils.toArray<HTMLElement>(".finale-line").forEach((line) => {
        gsap.fromTo(
          line,
          { backgroundPosition: "100% 0%" },
          { backgroundPosition: "0% 0%", ease: "none", scrollTrigger: { trigger: line, start: "top 88%", end: "top 48%", scrub: true } }
        )
      })
      // explicit end values: the button's own CSS transition would otherwise be read as where it rests
      gsap.fromTo(
        [".contact-copy", ".contact-actions > *", ".contact-mail", ".egg-wrap"],
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.08,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: { trigger: ".contact-copy", start: "top 90%" },
        }
      )
    })
    return () => {
      mm.revert()
      ctx.revert()
    }
  }, [])

  return (
    <section ref={ref} id="contact" className="chapter contact" aria-labelledby="contact-title">
      <TitleCard
        kicker="Epilogue"
        realm="The Grey Havens"
        title="Contact"
        relic="The last ship, at Mithlond"
        lore="The map ends at the Sea, but the road goes ever on. Send word before the ship sails."
        titleId="contact-title"
      />
      <div className="chapter-body">
        <div className="wrap finale">
          <p className="finale-lines">
            <span className="visually-hidden">The road goes ever on.</span>
            {LINES.map((l) => (
              <span className="finale-line" key={l} aria-hidden="true">
                {l}
              </span>
            ))}
          </p>
          <p className="contact-copy">
            Open to internships, research collaborations, and anything that involves AI agents, machine learning or Earth
            observation.
          </p>
          <div className="contact-actions">
            <a className="btn" href={links.gmail} target="_blank" rel="noopener noreferrer">
              Send a raven <Arrow />
            </a>
            {links.linkedin ? (
              <a className="btn-ghost" href={links.linkedin} target="_blank" rel="noopener noreferrer">
                LinkedIn <Arrow />
              </a>
            ) : null}
            {links.github ? (
              <a className="btn-ghost" href={links.github} target="_blank" rel="noopener noreferrer">
                GitHub <Arrow />
              </a>
            ) : null}
            {links.cv ? (
              <a className="btn-ghost" href={links.cv} target="_blank" rel="noopener noreferrer">
                CV <Arrow />
              </a>
            ) : null}
          </div>
          <CopyEmail />
          <div className="egg-wrap">
            <p className="egg-hint">— one last thing, before you go —</p>
            <button type="button" className="egg-btn" onClick={() => openEgg("beacons")}>
              <FlameIcon />
              Light the beacons
            </button>
            <button type="button" className="egg-riddle" onClick={() => openEgg("doors")}>
              or speak, friend, and enter
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default memo(Contact)
