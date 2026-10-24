import { memo, useEffect, useRef, useState } from "react"
import { MorphEngine, type Emblem } from "../engine/MorphEngine"
import { scene } from "../motion/scene"
import { EMBLEM } from "../motion/world"

interface StageProps {
  emblems: Emblem[] | null
  rows: number
  onReady: () => void
}

/** The fixed canvas behind the whole page, where the emblems live and morph. */
function Stage({ emblems, rows, onReady }: StageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imagesRef = useRef<HTMLDivElement>(null)
  const [fallback, setFallback] = useState<string[] | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!emblems || !canvas) return
    scene.aspects = emblems.map((e) => e.image.width / e.image.height)
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)")
    const coarse = window.matchMedia("(pointer: coarse)").matches
    let engine: MorphEngine | null = null
    const fail = () => {
      scene.engine = null
      setFallback(emblems.map((e) => e.image.toDataURL("image/png")))
    }
    try {
      // phones skip the idle shimmer, which keeps WebGL drawing, to save battery
      engine = new MorphEngine(canvas, rows, { reducedMotion: reduce.matches, ambient: !coarse }, fail)
      // the hero's One Ring melts under the cursor; every other emblem swirls apart like a particle image
      emblems.forEach((e, i) => engine!.addEmblem(e, i === EMBLEM.one ? 0 : 1))
      scene.engine = engine
    } catch {
      engine?.destroy()
      engine = null
      fail()
    }

    const size = () => {
      engine?.resize(window.innerWidth, window.innerHeight)
      scene.relayout()
    }
    size()
    window.addEventListener("resize", size)

    const onMove = (e: PointerEvent) => {
      const touch = e.pointerType === "touch"
      if (touch && e.buttons === 0 && e.pressure === 0) return
      engine?.pointer("move", e.clientX, e.clientY, touch)
    }
    const onDown = (e: PointerEvent) => engine?.pointer("down", e.clientX, e.clientY, e.pointerType === "touch")
    const onUp = (e: PointerEvent) => engine?.pointer("up", e.clientX, e.clientY, e.pointerType === "touch")
    const onOut = (e: PointerEvent) => {
      if (!e.relatedTarget) engine?.pointer("leave", e.clientX, e.clientY, e.pointerType === "touch")
    }
    const onVis = () => engine?.setVisible(!document.hidden)
    const onMq = () => engine?.setOptions({ reducedMotion: reduce.matches })
    window.addEventListener("pointermove", onMove, { passive: true })
    window.addEventListener("pointerdown", onDown, { passive: true })
    window.addEventListener("pointerup", onUp, { passive: true })
    window.addEventListener("pointercancel", onUp, { passive: true })
    window.addEventListener("pointerout", onOut, { passive: true })
    document.addEventListener("visibilitychange", onVis)
    reduce.addEventListener?.("change", onMq)
    onReady()

    return () => {
      window.removeEventListener("resize", size)
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerdown", onDown)
      window.removeEventListener("pointerup", onUp)
      window.removeEventListener("pointercancel", onUp)
      window.removeEventListener("pointerout", onOut)
      document.removeEventListener("visibilitychange", onVis)
      reduce.removeEventListener?.("change", onMq)
      if (scene.engine === engine) scene.engine = null
      engine?.destroy()
    }
  }, [emblems, rows, onReady])

  // without WebGL the emblems are plain pictures, cross-faded by the scene
  useEffect(() => {
    if (!fallback) return
    scene.images = Array.from(imagesRef.current?.querySelectorAll("img") ?? [])
    scene.relayout(true)
    return () => {
      scene.images = []
    }
  }, [fallback])

  return (
    <div className="stage" aria-hidden="true">
      <canvas ref={canvasRef} className="stage-canvas" />
      {fallback ? (
        <div ref={imagesRef}>
          {fallback.map((src, i) => (
            <img key={i} className="stage-img" src={src} alt="" draggable={false} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

export default memo(Stage)
