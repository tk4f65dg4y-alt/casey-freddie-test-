import { useEffect, useState } from "react";
import { api, Booking, formatPrice, formatDateTime } from "../../api";

const TABS: { key: Booking["status"] | "ALL"; label: string }[] = [
  { key: "PENDING", label: "Pending" },
  { key: "CONFIRMED", label: "Confirmed" },
  { key: "DECLINED", label: "Declined" },
  { key: "ALL", label: "All" },
];

function StatusBadge({ status }: { status: Booking["status"] }) {
  const cls = status === "PENDING" ? "badge-pending" : status === "CONFIRMED" ? "badge-confirmed" : "badge-declined";
  return <span className={`badge ${cls}`}>{status.toLowerCase()}</span>;
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [tab, setTab] = useState<Booking["status"] | "ALL">("PENDING");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    api.bookings().then(setBookings).catch(() => setBookings([]));
  }

  useEffect(load, []);

  async function updateStatus(id: string, status: "CONFIRMED" | "DECLINED") {
    setBusyId(id);
    setError(null);
    try {
      const updated = await api.setBookingStatus(id, status);
      setBookings((prev) => (prev ? prev.map((b) => (b.id === id ? updated : b)) : prev));
    } catch (err: any) {
      setError(err.message || "Couldn't update booking.");
    } finally {
      setBusyId(null);
    }
  }

  const filtered = bookings?.filter((b) => tab === "ALL" || b.status === tab) ?? [];
  const pendingCount = bookings?.filter((b) => b.status === "PENDING").length ?? 0;

  return (
    <div>
      <div className="admin-header">
        <div>
          <h2>Bookings</h2>
          <p className="muted">{pendingCount} awaiting your response</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`btn btn-sm ${tab === t.key ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {bookings === null && <div className="spinner-block">Loading…</div>}
      {bookings && filtered.length === 0 && (
        <div className="empty-state">Nothing here yet.</div>
      )}

      {filtered.map((b) => (
        <div className="list-item" key={b.id}>
          <div className="list-item-top">
            <div>
              <strong>{b.clientName}</strong>
              <div className="muted">{b.clientPhone} · {b.clientEmail}</div>
            </div>
            <StatusBadge status={b.status} />
          </div>
          <div className="tag-row">
            <span>{b.service.name} ({formatPrice(b.service.priceCents)})</span>
            <span>·</span>
            <span>{formatDateTime(b.slot.startsAt)}</span>
          </div>
          {b.note && <p style={{ marginTop: 10 }}>"{b.note}"</p>}
          {b.status === "PENDING" && (
            <div className="list-item-actions">
              <button
                className="btn btn-primary btn-sm"
                disabled={busyId === b.id}
                onClick={() => updateStatus(b.id, "CONFIRMED")}
              >
                Confirm
              </button>
              <button
                className="btn btn-danger btn-sm"
                disabled={busyId === b.id}
                onClick={() => updateStatus(b.id, "DECLINED")}
              >
                Decline
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
