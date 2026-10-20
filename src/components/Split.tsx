import { Fragment } from "react"

/**
 * Text split into words and letters for the scroll animations. Screen readers
 * get the whole sentence once; the letters are hidden from them.
 */
export function SplitChars({ text }: { text: string }) {
  const words = text.split(" ")
  return (
    <span className="split">
      <span className="visually-hidden">{text}</span>
      <span aria-hidden="true">
        {words.map((w, wi) => (
          <Fragment key={wi}>
            <span className="split-word">
              {[...w].map((ch, ci) => (
                <span className="split-char" key={ci}>
                  {ch}
                </span>
              ))}
            </span>
            {wi < words.length - 1 ? " " : null}
          </Fragment>
        ))}
      </span>
    </span>
  )
}

export function SplitWords({ text }: { text: string }) {
  const words = text.split(" ")
  return (
    <span className="split">
      <span className="visually-hidden">{text}</span>
      <span aria-hidden="true">
        {words.map((w, i) => (
          <Fragment key={i}>
            <span className="split-w">{w}</span>
            {i < words.length - 1 ? " " : null}
          </Fragment>
        ))}
      </span>
    </span>
  )
}
