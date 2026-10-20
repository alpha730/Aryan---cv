/** Runes that labels flicker through before they settle into plain English. */
const RUNES = "ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ"

const running = new WeakMap<Element, number>()

/** Reveals el's text left to right, each unrevealed letter a random rune. */
export function decode(el: HTMLElement | SVGElement, text = el.dataset.text ?? el.textContent ?? "", ms = 900) {
  el.dataset.text = text
  cancelAnimationFrame(running.get(el) ?? 0)
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    el.textContent = text
    return
  }
  const start = performance.now()
  const step = (now: number) => {
    const p = Math.min(1, (now - start) / ms)
    const shown = Math.floor(p * text.length)
    let out = ""
    for (let i = 0; i < text.length; i++) {
      const ch = text[i]
      out += i < shown || ch === " " || ch === "·" ? ch : RUNES[Math.floor(Math.random() * RUNES.length)]
    }
    el.textContent = out
    if (p < 1) running.set(el, requestAnimationFrame(step))
  }
  running.set(el, requestAnimationFrame(step))
}
