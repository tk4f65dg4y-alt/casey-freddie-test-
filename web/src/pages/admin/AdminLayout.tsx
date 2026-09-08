import { NavLink, Navigate, Outlet, useNavigate } from "react-router-dom";
import { useAuth, useConfig } from "../../context";
import { api } from "../../api";

export default function AdminLayout() {
  const { admin, loading, refresh } = useAuth();
  const { businessName } = useConfig();
  const navigate = useNavigate();

  if (loading) {
    return <div className="spinner-block">Loading…</div>;
  }

  if (!admin) {
    return <Navigate to="/admin/login" replace />;
  }

  async function handleLogout() {
    await api.logout();
    await refresh();
    navigate("/admin/login");
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div>
          <div className="brand" style={{ marginBottom: 4 }}>
            {businessName}
          </div>
          <span className="muted">Admin</span>
        </div>
        <nav>
          <NavLink to="/admin/bookings" className={({ isActive }) => (isActive ? "active" : "")}>
            Bookings
          </NavLink>
          <NavLink to="/admin/schedule" className={({ isActive }) => (isActive ? "active" : "")}>
            Schedule
          </NavLink>
          <NavLink to="/admin/services" className={({ isActive }) => (isActive ? "active" : "")}>
            Services & prices
          </NavLink>
        </nav>
        <div style={{ marginTop: "auto" }}>
          <div className="muted" style={{ marginBottom: 10 }}>
            Logged in as {admin.name}
          </div>
          <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
