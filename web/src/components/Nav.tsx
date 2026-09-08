import { useState } from "react";
import { Link } from "react-router-dom";
import { useConfig } from "../context";

export default function Nav() {
  const { businessName } = useConfig();
  const initial = businessName.trim().charAt(0).toUpperCase() || "G";
  const [open, setOpen] = useState(false);

  return (
    <header className="site-nav">
      <div className="container">
        <Link to="/" className="brand" onClick={() => setOpen(false)}>
          <span className="brand-mark">{initial}</span>
          <span className="brand-text">{businessName}</span>
        </Link>
        <nav className="nav-links">
          <a href="/#services" className="nav-anchor">
            Services
          </a>
          <a href="/#about" className="nav-anchor">
            About
          </a>
          <Link to="/book" className="btn btn-primary btn-sm">
            Book now
          </Link>
          <button
            type="button"
            className={`nav-toggle ${open ? "open" : ""}`}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span />
          </button>
        </nav>
      </div>
      <div className={`nav-mobile-panel ${open ? "open" : ""}`}>
        <a href="/#services" onClick={() => setOpen(false)}>
          Services
        </a>
        <a href="/#about" onClick={() => setOpen(false)}>
          About
        </a>
      </div>
    </header>
  );
}
