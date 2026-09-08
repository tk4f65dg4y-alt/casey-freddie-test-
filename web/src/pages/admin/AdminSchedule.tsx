import { Fragment, useEffect, useMemo, useState } from "react";
import { api, Slot, formatPrice } from "../../api";

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 8:00 – 19:00

function startOfWeek(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday as start of week
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(d: Date, n: number): Date {
  const date = new Date(d);
  date.setDate(date.getDate() + n);
  return date;
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function cellDateTime(day: Date, hour: number): Date {
  const d = new Date(day);
  d.setHours(hour, 0, 0, 0);
  return d;
}

function formatHour(hour: number): string {
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  const ampm = hour < 12 ? "am" : "pm";
  return `${h12}${ampm}`;
}

export default function AdminSchedule() {
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [popoverSlot, setPopoverSlot] = useState<Slot | null>(null);
  const [popoverBusy, setPopoverBusy] = useState(false);

  function load() {
    api.allSlots().then(setSlots).catch(() => setSlots([]));
  }

  useEffect(load, []);

  const now = new Date();
  const weekStart = useMemo(() => addDays(startOfWeek(now), weekOffset * 7), [weekOffset]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  function slotFor(day: Date, hour: number): Slot | undefined {
    return slots?.find((s) => {
      const d = new Date(s.startsAt);
      return sameDay(d, day) && d.getHours() === hour;
    });
  }

  function cellKey(day: Date, hour: number): string {
    return `${day.toDateString()}-${hour}`;
  }

  async function toggleCell(day: Date, hour: number) {
    const dt = cellDateTime(day, hour);
    if (dt < now) return;
    const key = cellKey(day, hour);
    if (pending.has(key)) return;
    const existing = slotFor(day, hour);

    if (existing?.status === "BOOKED") {
      setPopoverSlot(existing);
      return;
    }

    setPending((prev) => new Set(prev).add(key));
    setError(null);
    try {
      if (existing) {
        await api.deleteSlot(existing.id);
        setSlots((prev) => (prev ? prev.filter((s) => s.id !== existing.id) : prev));
      } else {
        const created = await api.createSlot({ startsAt: dt.toISOString(), durationMin: 60 });
        setSlots((prev) => (prev ? [...prev, created] : [created]));
      }
    } catch (err: any) {
      setError(err.message || "Couldn't update that time — try again.");
    } finally {
      setPending((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  }

  async function handlePopoverStatus(status: "CONFIRMED" | "DECLINED") {
    if (!popoverSlot?.booking) return;
    setPopoverBusy(true);
    setError(null);
    try {
      const updated = await api.setBookingStatus(popoverSlot.booking.id, status);
      setSlots((prev) =>
        prev
          ? prev.map((s) =>
              s.id === popoverSlot.id
                ? { ...s, status: status === "DECLINED" ? "OPEN" : "BOOKED", booking: status === "DECLINED" ? null : updated }
                : s
            )
          : prev
      );
      setPopoverSlot(null);
    } catch (err: any) {
      setError(err.message || "Couldn't update that booking.");
    } finally {
      setPopoverBusy(false);
    }
  }

  const weekLabel = `${weekStart.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${addDays(
    weekStart,
    6
  ).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;

  return (
    <div>
      <div className="admin-header">
        <div>
          <h2>Schedule</h2>
          <p className="muted">Click a time to open it up or close it off. Click a booked time to manage it.</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="cal-legend">
        <span className="cal-legend-item">
          <span className="cal-legend-swatch" style={{ background: "var(--paper)", border: "1px solid var(--line)" }} />
          Closed
        </span>
        <span className="cal-legend-item">
          <span className="cal-legend-swatch" style={{ background: "var(--success-bg)" }} />
          Open
        </span>
        <span className="cal-legend-item">
          <span className="cal-legend-swatch" style={{ background: "var(--pending-bg)" }} />
          Booked
        </span>
        <span className="cal-legend-item">
          <span
            className="cal-legend-swatch"
            style={{
              background:
                "repeating-linear-gradient(135deg, rgba(228,216,191,0.6), rgba(228,216,191,0.6) 3px, transparent 3px, transparent 6px)",
              border: "1px solid var(--line)",
            }}
          />
          Past
        </span>
      </div>

      <div className="cal-toolbar">
        <div className="cal-nav">
          <button
            type="button"
            className="cal-nav-btn"
            onClick={() => setWeekOffset((w) => Math.max(0, w - 1))}
            disabled={weekOffset === 0}
            aria-label="Previous week"
          >
            ‹
          </button>
          <span className="cal-week-label">{weekLabel}</span>
          <button
            type="button"
            className="cal-nav-btn"
            onClick={() => setWeekOffset((w) => w + 1)}
            aria-label="Next week"
          >
            ›
          </button>
        </div>
        {weekOffset !== 0 && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setWeekOffset(0)}>
            Back to this week
          </button>
        )}
      </div>

      {slots === null && <div className="spinner-block">Loading…</div>}

      {slots && (
        <div className="cal-scroll">
          <div className="cal-grid">
            <div className="cal-corner" />
            {weekDays.map((day) => (
              <div className={`cal-day-head ${sameDay(day, now) ? "is-today" : ""}`} key={day.toDateString()}>
                <div className="cal-day-name">{day.toLocaleDateString("en-GB", { weekday: "short" })}</div>
                <div className="cal-day-num">{day.getDate()}</div>
              </div>
            ))}

            {HOURS.map((hour) => (
              <Fragment key={`row-${hour}`}>
                <div className="cal-time-label">{formatHour(hour)}</div>
                {weekDays.map((day) => {
                  const slot = slotFor(day, hour);
                  const dt = cellDateTime(day, hour);
                  const isPast = dt < now;
                  const key = cellKey(day, hour);
                  const isLoading = pending.has(key);
                  const state = isPast ? "past" : slot?.status === "BOOKED" ? "booked" : slot ? "open" : "closed";
                  return (
                    <div
                      key={key}
                      className={`cal-cell is-${state} ${isLoading ? "is-loading" : ""}`}
                      onClick={() => toggleCell(day, hour)}
                    >
                      {state === "open" && <span className="cal-pill">Open</span>}
                      {state === "booked" && slot?.booking && (
                        <span className="cal-pill">{slot.booking.clientName}</span>
                      )}
                    </div>
                  );
                })}
              </Fragment>
            ))}
          </div>
        </div>
      )}

      {popoverSlot?.booking && (
        <div className="cal-popover-backdrop" onClick={() => !popoverBusy && setPopoverSlot(null)}>
          <div className="cal-popover" onClick={(e) => e.stopPropagation()}>
            <span className="step-label">
              {new Date(popoverSlot.startsAt).toLocaleString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
            <h3 style={{ marginTop: 6 }}>{popoverSlot.booking.clientName}</h3>
            <p style={{ marginTop: 6 }}>
              {popoverSlot.booking.service.name} · {formatPrice(popoverSlot.booking.service.priceCents)}
            </p>
            <p className="muted" style={{ marginTop: 6 }}>
              {popoverSlot.booking.clientPhone} · {popoverSlot.booking.clientEmail}
            </p>
            {popoverSlot.booking.note && <p style={{ marginTop: 10 }}>"{popoverSlot.booking.note}"</p>}

            <div style={{ marginTop: 18 }}>
              <span className={`badge badge-${popoverSlot.booking.status.toLowerCase()}`}>
                {popoverSlot.booking.status.toLowerCase()}
              </span>
            </div>

            {popoverSlot.booking.status === "PENDING" && (
              <div className="list-item-actions">
                <button
                  className="btn btn-primary btn-sm"
                  disabled={popoverBusy}
                  onClick={() => handlePopoverStatus("CONFIRMED")}
                >
                  Confirm
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  disabled={popoverBusy}
                  onClick={() => handlePopoverStatus("DECLINED")}
                >
                  Decline
                </button>
              </div>
            )}

            <div style={{ marginTop: 18, textAlign: "right" }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setPopoverSlot(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
