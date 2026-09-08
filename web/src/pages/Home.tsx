import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { api, Service, formatPrice, formatDuration } from "../api";
import { useConfig } from "../context";

export default function Home() {
  const { adminName, heroTagline, heroLede, aboutBio, testimonials, trustStats } = useConfig();
  const [services, setServices] = useState<Service[] | null>(null);

  useEffect(() => {
    api.services().then(setServices).catch(() => setServices([]));
  }, []);

  return (
    <>
      <Nav />

      <section className="hero">
        <div className="container">
          <span className="hero-eyebrow">Est. by {adminName}</span>
          <h1>{heroTagline}</h1>
          <p className="lede">{heroLede}</p>
          <div className="hero-actions">
            <Link to="/book" className="btn btn-primary">
              Book an appointment
            </Link>
            <a href="#services" className="btn btn-secondary">
              View services & prices
            </a>
          </div>
        </div>
      </section>

      <section className="trust-strip container">
        {trustStats.map((stat) => (
          <div className="trust-stat" key={stat.label}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </div>
        ))}
      </section>

      <section id="services" className="section section-alt">
        <div className="container">
          <div className="section-head">
            <span className="hero-eyebrow">Services & prices</span>
            <h2>Packages</h2>
            <div className="ornament">
              <span>◆</span>
            </div>
            <p>Every price is shown up front — no surprises when you sit down.</p>
          </div>

          {services === null && <div className="spinner-block">Loading services…</div>}
          {services && services.length === 0 && (
            <div className="empty-state">No services published yet — check back soon.</div>
          )}
          {services && services.length > 0 && (
            <div className="services-grid">
              {services.map((s) => (
                <div className="service-card" key={s.id}>
                  <span className="service-icon">{s.name.trim().charAt(0).toUpperCase()}</span>
                  <div className="service-card-top">
                    <h3>{s.name}</h3>
                    <span className="service-price">{formatPrice(s.priceCents)}</span>
                  </div>
                  <span className="service-meta">{formatDuration(s.durationMin)}</span>
                  <p>{s.description}</p>
                  <div style={{ marginTop: 10 }}>
                    <Link to="/book" className="btn btn-ghost btn-sm" style={{ paddingLeft: 0 }}>
                      Book this →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section id="about" className="section">
        <div className="container">
          <div className="section-head">
            <span className="hero-eyebrow">About</span>
            <h2>Hi, I'm {adminName}</h2>
            <p>{aboutBio}</p>
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="section-head">
            <span className="hero-eyebrow">Reviews</span>
            <h2>Kind words</h2>
            <div className="ornament">
              <span>◆</span>
            </div>
          </div>
          <div className="testimonial-grid">
            {testimonials.map((t) => (
              <div className="testimonial-card" key={t.name}>
                <div className="stars">★★★★★</div>
                <p className="quote">"{t.quote}"</p>
                <div className="testimonial-name">— {t.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ textAlign: "center" }}>
          <h2>Ready when you are</h2>
          <p style={{ maxWidth: 480, margin: "16px auto 30px" }}>
            Pick a service, choose an open time, and pop in your details. You'll get a
            confirmation once it's locked in.
          </p>
          <Link to="/book" className="btn btn-primary">
            Book an appointment
          </Link>
        </div>
      </section>

      <Footer />
    </>
  );
}
