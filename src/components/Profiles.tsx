import type { ComponentType } from "react"
import { CvIcon, GitHubIcon, LinkedInIcon, MailIcon } from "./icons"
import { profile } from "../data/profile"

interface Profile {
  label: string
  detail: string
  href: string
  Icon: ComponentType<{ size?: number }>
  external: boolean
}

const handle = (url: string) => url.replace(/\/+$/, "").split("/").pop() ?? url

/** GitHub, LinkedIn, email and the CV: whichever of them have links. */
const PROFILES: Profile[] = [
  { label: "GitHub", detail: handle(profile.links.github), href: profile.links.github, Icon: GitHubIcon, external: true },
  { label: "LinkedIn", detail: handle(profile.links.linkedin), href: profile.links.linkedin, Icon: LinkedInIcon, external: true },
  { label: "Gmail", detail: profile.email, href: profile.links.gmail, Icon: MailIcon, external: true },
  {
    label: "CV",
    detail: profile.links.cv.includes("drive.google.") ? "On Google Drive" : "PDF",
    href: profile.links.cv,
    Icon: CvIcon,
    external: true,
  },
].filter((p) => p.href)

/** The profile links, as bare icons or with their names and handles beside them. */
export function ProfileLinks({ className, full = false }: { className: string; full?: boolean }) {
  return (
    <ul className={className}>
      {PROFILES.map(({ label, detail, href, Icon, external }) => (
        <li key={label}>
          <a
            href={href}
            aria-label={full ? undefined : label}
            title={full ? undefined : label}
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            <Icon />
            {full ? (
              <span>
                <b>{label}</b>
                <small>{detail}</small>
              </span>
            ) : null}
          </a>
        </li>
      ))}
    </ul>
  )
}
