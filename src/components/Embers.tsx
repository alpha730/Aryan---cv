import { memo, useEffect, useRef } from "react"
import { scene } from "../motion/scene"

type Mote = { x: number; y: number; vy: number; r: number; ph: number; life: number; max: number }

/** Motes drifting up through every realm: embers in Mordor, fireflies in the Shire, starlight in Gondor. */
function Embers() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const c = ref.current
    const g = c?.getContext("2d")
    if (!c || !g || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    let w = 0
    let h = 0
    let raf = 0
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = window.innerWidth
      h = window.innerHeight
      c.width = w * dpr
      c.height = h * dpr
      g.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener("resize", resize)

    const spawn = (p: Mote, anywhere: boolean) => {
      p.x = Math.random() * w
      p.y = anywhere ? Math.random() * h : h + 10
      p.vy = 0.25 + Math.random() * 0.7
      p.r = 0.6 + Math.random() * 1.8
      p.ph = Math.random() * Math.PI * 2
      p.life = 0
      p.max = 400 + Math.random() * 600
    }
    const ps: Mote[] = Array.from({ length: w < 640 ? 24 : 46 }, () => {
      const p = {} as Mote
      spawn(p, true)
      return p
    })

    let last = performance.now()
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      const dt = Math.min(3, (now - last) / 16.67)
      last = now
      g.clearRect(0, 0, w, h)
      g.globalCompositeOperation = "lighter"
      const [r, gg, b] = scene.mote
      for (const p of ps) {
        p.life += dt
        p.y -= p.vy * dt
        p.ph += 0.02 * dt
        p.x += Math.sin(p.ph) * 0.35 * dt
        if (p.y < -10 || p.life > p.max) spawn(p, false)
        const a = Math.max(0, Math.min(1, p.life / 60, (p.max - p.life) / 120))
        g.fillStyle = `rgba(${r},${gg},${b},${a * 0.15})`
        g.beginPath()
        g.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2)
        g.fill()
        g.fillStyle = `rgba(${r},${gg},${b},${a * 0.85})`
        g.beginPath()
        g.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        g.fill()
      }
    }
    const onVis = () => {
      cancelAnimationFrame(raf)
      if (!document.hidden) {
        last = performance.now()
        raf = requestAnimationFrame(tick)
      }
    }
    raf = requestAnimationFrame(tick)
    document.addEventListener("visibilitychange", onVis)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", resize)
      document.removeEventListener("visibilitychange", onVis)
    }
  }, [])

  return <canvas ref={ref} className="embers" aria-hidden="true" />
}

export default memo(Embers)
