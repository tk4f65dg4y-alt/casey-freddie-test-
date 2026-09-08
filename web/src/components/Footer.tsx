import { Link } from "react-router-dom";
import { useConfig } from "../context";

export default function Footer() {
  const { businessName } = useConfig();
  const initial = businessName.trim().charAt(0).toUpperCase() || "G";
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-col">
            <div className="brand">
              <span className="brand-mark">{initial}</span>
              <span className="brand-text">{businessName}</span>
            </div>
            <p>
              A quiet, cream-toned studio for cuts, colour, and styling — every
              appointment booked online, no phone tag required.
            </p>
          </div>
          <div className="footer-col">
            <h4>Explore</h4>
            <a href="/#services">Services & prices</a>
            <a href="/#about">About</a>
            <Link to="/book">Book an appointment</Link>
          </div>
          <div className="footer-col">
            <h4>Visit</h4>
            <p>Open Tuesday – Saturday</p>
            <p>By appointment only</p>
            <Link to="/admin/login">Staff login</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {year} {businessName}
          </span>
          <span>Booking made simple.</span>
        </div>
      </div>
    </footer>
  );
}
