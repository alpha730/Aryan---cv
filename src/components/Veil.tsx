import { memo, useEffect, useState } from "react"
import { RingMark } from "./icons"
import { onUnseenChange, wearRing } from "../motion/unseen"

const WHISPERS = [
  { text: "You are not unseen.", x: 12, y: 22, d: 0 },
  { text: "The Eye is upon you.", x: 62, y: 16, d: 2.2 },
  { text: "It wants to be found.", x: 70, y: 64, d: 4.1 },
  { text: "Take it off.", x: 18, y: 72, d: 1.3 },
  { text: "There is no hiding here.", x: 40, y: 44, d: 6 },
]

/** The wraith-world, spread over the page while the Ring is worn. */
function Veil() {
  const [on, setOn] = useState(false)
  useEffect(() => onUnseenChange(setOn), [])

  return (
    <>
      <div className="unseen-veil" aria-hidden="true">
        {WHISPERS.map((w) => (
          <p key={w.text} style={{ left: w.x + "%", top: w.y + "%", animationDelay: w.d + "s" }}>
            {w.text}
          </p>
        ))}
      </div>
      {on ? (
        <button type="button" className="unseen-off" onClick={() => wearRing(false)}>
          <RingMark size={16} />
          Take off the Ring
        </button>
      ) : null}
    </>
  )
}

export default memo(Veil)
