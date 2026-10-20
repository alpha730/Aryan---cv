import type { ReactNode } from "react"

interface EntryProps {
  title: ReactNode
  when?: string
  /** the line under the title: a degree, a role, a kind of project */
  sub?: ReactNode
  /** set against the sub-line on the right: a place, a link */
  meta?: ReactNode
  points?: string[]
  children?: ReactNode
  className?: string
}

/** One entry laid out as the CV lays it out: what and when, then how and where, then the bullets. */
export default function Entry({ title, when, sub, meta, points, children, className }: EntryProps) {
  return (
    <article className={className ? `entry ${className}` : "entry"}>
      <header className="entry-head">
        <h3 className="entry-title">{title}</h3>
        {when ? <p className="entry-when">{when}</p> : null}
      </header>
      {sub || meta ? (
        <div className="entry-sub">
          {sub ? <p>{sub}</p> : null}
          {meta ? <div className="entry-meta">{meta}</div> : null}
        </div>
      ) : null}
      {points?.length ? (
        <ul className="entry-points">
          {points.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      ) : null}
      {children}
    </article>
  )
}
