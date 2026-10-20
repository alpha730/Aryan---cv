import { useCallback, useEffect, useState } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import Lenis from "lenis"
import { buildEmblems } from "./engine/emblems"
import { isLowPower, particleRows, type Emblem } from "./engine/MorphEngine"
import { scene } from "./motion/scene"
import Preloader from "./components/Preloader"
import Stage from "./components/Stage"
import Embers from "./components/Embers"
import Hud from "./components/Hud"
import Veil from "./components/Veil"
import Footer from "./components/Footer"
import Hero from "./sections/Hero"
import Marquee from "./sections/Marquee"
import Education from "./sections/Education"
import Research from "./sections/Research"
import Projects from "./sections/Projects"
import Skills from "./sections/Skills"
import Experience from "./sections/Experience"
import Certifications from "./sections/Certifications"
import Contact from "./sections/Contact"

gsap.registerPlugin(ScrollTrigger)

const ROWS = particleRows(isLowPower())

export default function App() {
  const [progress, setProgress] = useState(0)
  const [emblems, setEmblems] = useState<Emblem[] | null>(null)
  const [stageReady, setStageReady] = useState(false)
  /** the doors have begun to open */
  const [revealed, setRevealed] = useState(false)
  /** the doors are gone and the page may scroll */
  const [loaded, setLoaded] = useState(false)

  // paint the emblems (and wait for the fonts) behind the doors
  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual"
    window.scrollTo(0, 0)
    let live = true
    const fonts = Promise.race([document.fonts.ready, new Promise((res) => setTimeout(res, 2500))])
    const job = buildEmblems(ROWS, (p) => {
      if (live) setProgress(p * 0.9)
    })
    job.emblems.then(async (list) => {
      await fonts
      if (!live) return
      setProgress(1)
      setEmblems(list)
    })
    return () => {
      live = false
      job.stop()
    }
  }, [])

  // smooth scrolling, and one ticker for the whole scene
  useEffect(() => {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ScrollTrigger.config({ ignoreMobileResize: true })
    const lenis = still ? null : new Lenis({ lerp: 0.09 })
    scene.lenis = lenis
    lenis?.on("scroll", ScrollTrigger.update)
    const tick = (time: number) => {
      lenis?.raf(time * 1000)
      scene.update(gsap.ticker.deltaRatio(60))
    }
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    // anchor links glide instead of jumping
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href^='#']")
      if (!a) return
      const id = a.getAttribute("href")!
      const target = id === "#top" ? 0 : document.querySelector<HTMLElement>(id)
      if (target === null) return
      e.preventDefault()
      if (lenis) lenis.scrollTo(target, { duration: 1.8 })
      else if (target === 0) window.scrollTo({ top: 0 })
      else target.scrollIntoView()
    }
    document.addEventListener("click", onClick)
    return () => {
      gsap.ticker.remove(tick)
      document.removeEventListener("click", onClick)
      lenis?.destroy()
      scene.lenis = null
    }
  }, [])

  // the page holds still until the doors have opened
  useEffect(() => {
    const root = document.documentElement
    if (!loaded) {
      root.classList.add("is-loading")
      scene.lenis?.stop()
      return
    }
    root.classList.remove("is-loading")
    scene.lenis?.start()
    scene.relayout(true)
    ScrollTrigger.refresh()
  }, [loaded])

  const onStageReady = useCallback(() => setStageReady(true), [])
  const onOpen = useCallback(() => {
    scene.engine?.startIntro()
    setRevealed(true)
  }, [])
  const onDone = useCallback(() => setLoaded(true), [])

  return (
    <>
      <a className="skip" href="#education">
        Skip to content
      </a>
      <div className="atmosphere" aria-hidden="true" />
      <div className="backdrop-frame" aria-hidden="true">
        <div className="hero-backdrop">ARYAN</div>
      </div>
      <Stage emblems={emblems} rows={ROWS} onReady={onStageReady} />
      <Embers />
      <Hud revealed={revealed} />
      <main id="main">
        <Hero revealed={revealed} />
        <Marquee />
        <Education />
        <Research />
        <Projects />
        <Skills />
        <Experience />
        <Certifications />
        <Contact />
      </main>
      <Footer />
      <Veil />
      {loaded ? null : <Preloader progress={progress} ready={!!emblems && stageReady} onOpen={onOpen} onDone={onDone} />}
    </>
  )
}
