import { memo } from "react"
import { RingMark } from "./icons"
import { ProfileLinks } from "./Profiles"
import { profile } from "../data/profile"

/** The end of the road: where to find Aryan, and the small print. */
function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-top">
          <div>
            <p className="footer-name">
              <RingMark size={16} />
              {profile.name}
            </p>
            <p className="footer-role">B.Tech, Artificial Intelligence &amp; Data Science · Jaipur, India</p>
          </div>
          <nav aria-label="Profiles">
            <ProfileLinks className="profiles" full />
          </nav>
        </div>
        <div className="footer-bottom">
          <p>© 2026 {profile.name} · Forged in Jaipur</p>
          <p className="footer-fine">
            Particle engine adapted from Liquid Sculpture Hero by Guglielmo Giannattasio (MIT). A fan-made theme, not
            affiliated with the Tolkien Estate or the films.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default memo(Footer)
