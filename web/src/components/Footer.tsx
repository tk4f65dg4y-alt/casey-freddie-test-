import { useConfig } from "../context";

export default function Footer() {
  const { businessName } = useConfig();
  const initial = businessName.trim().charAt(0).toUpperCase() || "G";
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="brand">
          <span className="brand-mark">{initial}</span>
          {businessName}
        </div>
        <p>Book online, any time — or message us to ask about anything else.</p>
        <p style={{ marginTop: 10 }}>
          <a href="/admin/login" style={{ color: "var(--ink-soft)", textDecoration: "underline" }}>
            Staff login
          </a>
        </p>
      </div>
    </footer>
  );
}
