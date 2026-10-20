import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { SplitChars } from "./Split"
import { decode } from "../motion/text"

interface TitleCardProps {
  /** "Chapter I", or "Epilogue" */
  kicker: string
  realm: string
  /** The section's heading, as the CV has it. */
  title: string
  /** The ring or sigil the emblem above has become. */
  relic: string
  lore: string
  titleId: string
}

/** A chapter's opening screen: the emblem above, the CV heading below. */
export default function TitleCard({ kicker, realm, title, relic, lore, titleId }: TitleCardProps) {
  return (
    <header className="tc">
      <div className="tc-copy">
        <div>
          <p className="tc-kicker">
            <span>{kicker}</span>
            <span className="tc-realm">{realm}</span>
          </p>
          <h2 className="tc-title" id={titleId}>
            <SplitChars text={title} />
          </h2>
          <p className="tc-label">{relic}</p>
        </div>
        <p className="tc-lore">{lore}</p>
      </div>
    </header>
  )
}

/** Letters rise in as the card arrives and drift up and away as it leaves. */
export function titleCardMotion(card: HTMLElement) {
  const chars = card.querySelectorAll(".tc-title .split-char")
  const rest = card.querySelectorAll(".tc-kicker, .tc-label, .tc-lore")
  gsap
    .timeline({ scrollTrigger: { trigger: card, start: "top 85%", end: "bottom top", scrub: 0.6 } })
    .fromTo(
      chars,
      { opacity: 0, yPercent: 70, rotateX: -80, filter: "blur(10px)" },
      { opacity: 1, yPercent: 0, rotateX: 0, filter: "blur(0px)", duration: 0.22, stagger: { amount: 0.12 }, ease: "power2.out" },
      0
    )
    .fromTo(rest, { opacity: 0, y: 34 }, { opacity: 1, y: 0, duration: 0.2, stagger: 0.04, ease: "power2.out" }, 0.1)
    .to(chars, { opacity: 0, yPercent: -55, filter: "blur(8px)", duration: 0.18, stagger: { amount: 0.06 }, ease: "power1.in" }, 0.6)
    .to(rest, { opacity: 0, y: -34, duration: 0.16, stagger: 0.03 }, 0.6)
    .to({}, { duration: 0.16 })
  // the realm's name flickers out of runes as the card settles
  const realm = card.querySelector<HTMLElement>(".tc-realm")
  if (realm) {
    ScrollTrigger.create({
      trigger: card,
      start: "top 40%",
      onEnter: () => decode(realm),
      onEnterBack: () => decode(realm),
    })
  }
}
