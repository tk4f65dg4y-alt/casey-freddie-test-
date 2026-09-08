import { Link } from "react-router-dom";
import { useConfig } from "../context";

export default function Nav() {
  const { businessName } = useConfig();
  const initial = businessName.trim().charAt(0).toUpperCase() || "G";
  return (
    <header className="site-nav">
      <div className="container">
        <Link to="/" className="brand">
          <span className="brand-mark">{initial}</span>
          {businessName}
        </Link>
        <nav className="nav-links">
          <a href="/#services">Services</a>
          <a href="/#about">About</a>
          <Link to="/book" className="btn btn-primary btn-sm">
            Book now
          </Link>
        </nav>
      </div>
    </header>
  );
}
