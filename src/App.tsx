import { useCallback, useEffect, useState } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import Lenis from "lenis"
import { scene } from "./motion/scene"
import Preloader from "./components/Preloader"
import MapStage from "./map/MapStage"
import Hud from "./components/Hud"
import Beacons from "./components/Beacons"
import Doors from "./components/Doors"
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

/** the hands the book is written in; the cover stays shut until they have arrived */
const FONTS = [
  "400 1em 'Uncial Antiqua'",
  "400 1em 'IM Fell English'",
  "italic 400 1em 'IM Fell English'",
  "400 1em 'IM Fell English SC'",
  "400 1em 'EB Garamond'",
  "italic 400 1em 'EB Garamond'",
  "400 1em 'Noto Sans Runic'",
]

export default function App() {
  const [progress, setProgress] = useState(0)
  const [ready, setReady] = useState(false)
  /** the book has begun to open */
  const [revealed, setRevealed] = useState(false)
  /** the cover is gone and the page may scroll */
  const [loaded, setLoaded] = useState(false)

  // wait for the lettering behind the cover
  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual"
    window.scrollTo(0, 0)
    let live = true
    let done = 0
    const step = () => {
      done++
      if (live) setProgress((done / FONTS.length) * 0.92)
    }
    const fonts = Promise.all(FONTS.map((f) => document.fonts.load(f, "Aᚠ").then(step, step)))
    Promise.race([fonts, new Promise((res) => setTimeout(res, 2500))]).then(() => {
      if (!live) return
      setProgress(1)
      setReady(true)
    })
    return () => {
      live = false
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

  // the page holds still until the book has opened
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

  const onOpen = useCallback(() => {
    scene.relayout(true)
    setRevealed(true)
  }, [])
  const onDone = useCallback(() => setLoaded(true), [])

  return (
    <>
      <a className="skip" href="#education">
        Skip to content
      </a>
      <div className="atmosphere" aria-hidden="true" />
      <MapStage />
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
      <div className="night" aria-hidden="true" />
      <Beacons />
      <Doors />
      {loaded ? null : <Preloader progress={progress} ready={ready} onOpen={onOpen} onDone={onDone} />}
    </>
  )
}
