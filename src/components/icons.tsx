export const RingMark = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <ellipse cx="12" cy="12" rx="9" ry="9" stroke="currentColor" strokeWidth="2.6" />
    <ellipse cx="12" cy="12" rx="5.6" ry="5.6" stroke="currentColor" strokeOpacity=".35" strokeWidth=".8" />
  </svg>
)

export const Arrow = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

/** GitHub's mark (Octicons, MIT). */
export const GitHubIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
  </svg>
)

/** LinkedIn's "in" (Simple Icons, CC0). */
export const LinkedInIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
  </svg>
)

export const MailIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3.6 6.6 12 13l8.4-6.4" />
  </svg>
)

export const CopyIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
    <rect x="8" y="8" width="12" height="12" rx="2" />
    <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
  </svg>
)

export const CheckIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12.5 9.5 17 19 7.5" />
  </svg>
)

/** A page with its corner turned down, for the CV. */
export const CvIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 3h8l4 4v14H6z" />
    <path d="M14 3v4h4M9 11h6M9 14.5h6M9 18h4" />
  </svg>
)

const BLADE = "M0 0 4-1.15 11-2.05 17-2.45 21.2-2.1 23-1.75V1.75L21.2 2.1 17 2.45 11 2.05 4 1.15Z"

/** Sting, Bilbo's little Elvish sword, laid with its point at the top left so the point is the cursor's hotspot. */
export const Sting = () => (
  <svg className="sting" width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
    <defs>
      <linearGradient id="sting-steel" x1="0" y1="-2.5" x2="0" y2="2.5" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#fbfdff" />
        <stop offset=".5" stopColor="#c4ccd8" />
        <stop offset="1" stopColor="#7d8796" />
      </linearGradient>
      <linearGradient id="sting-blue" x1="0" y1="-2.5" x2="0" y2="2.5" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#eef8ff" />
        <stop offset=".5" stopColor="#86caff" />
        <stop offset="1" stopColor="#2f7fe0" />
      </linearGradient>
      <linearGradient id="sting-gold" x1="0" y1="-6.6" x2="0" y2="6.6" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#f6dc95" />
        <stop offset="1" stopColor="#a4761f" />
      </linearGradient>
    </defs>
    <g transform="translate(2 2) rotate(45)" stroke="#0b0d12" strokeWidth="1.1" strokeLinejoin="round" paintOrder="stroke">
      <path d={BLADE} fill="url(#sting-steel)" />
      <path className="sting-glow" d={BLADE} fill="url(#sting-blue)" />
      <path d="M5 0H20.5" stroke="#5b6573" strokeWidth=".55" />
      <path d="M25.4-6.6Q22.6 0 25.4 6.6L26.9 6.2Q24.4 0 26.9-6.2Z" fill="url(#sting-gold)" />
      <rect x="26.4" y="-1.35" width="7.6" height="2.7" rx=".8" fill="#4a3220" />
      <path d="M28-1.3V1.3M29.8-1.3V1.3M31.6-1.3V1.3" stroke="#8c6a40" strokeWidth=".6" />
      <path d="M33.8 0 35.6-2.2 37.4 0 35.6 2.2Z" fill="url(#sting-gold)" />
    </g>
  </svg>
)
