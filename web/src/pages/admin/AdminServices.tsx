import { useEffect, useState } from "react";
import { api, Service, formatPrice } from "../../api";

interface DraftService {
  name: string;
  description: string;
  price: string;
  durationMin: string;
}

const emptyDraft: DraftService = { name: "", description: "", price: "", durationMin: "45" };

export default function AdminServices() {
  const [services, setServices] = useState<Service[] | null>(null);
  const [draft, setDraft] = useState<DraftService>(emptyDraft);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  function load() {
    api.allServices().then(setServices).catch(() => setServices([]));
  }

  useEffect(load, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const priceCents = Math.round(parseFloat(draft.price) * 100);
      if (Number.isNaN(priceCents) || priceCents < 0) throw new Error("Enter a valid price.");
      const durationMin = parseInt(draft.durationMin, 10);
      if (Number.isNaN(durationMin) || durationMin <= 0) throw new Error("Enter a valid duration.");
      await api.createService({
        name: draft.name.trim(),
        description: draft.description.trim(),
        priceCents,
        durationMin,
        sortOrder: services?.length ?? 0,
      });
      setDraft(emptyDraft);
      load();
    } catch (err: any) {
      setError(err.message || "Couldn't add that service.");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(s: Service) {
    setBusyId(s.id);
    setError(null);
    try {
      const updated = await api.updateService(s.id, { active: !s.active });
      setServices((prev) => (prev ? prev.map((x) => (x.id === s.id ? updated : x)) : prev));
    } catch (err: any) {
      setError(err.message || "Couldn't update that service.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="admin-header">
        <div>
          <h2>Services & prices</h2>
          <p className="muted">What clients see and book from on the site.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 32 }}>
        <span className="step-label">Add a service</span>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleAdd}>
          <div className="form-field">
            <label htmlFor="name">Name</label>
            <input
              id="name"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              rows={2}
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            />
          </div>
          <div className="inline-form">
            <div className="form-field" style={{ marginBottom: 0, maxWidth: 140 }}>
              <label htmlFor="price">Price (£)</label>
              <input
                id="price"
                type="number"
                min={0}
                step={0.5}
                value={draft.price}
                onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                required
              />
            </div>
            <div className="form-field" style={{ marginBottom: 0, maxWidth: 160 }}>
              <label htmlFor="duration">Duration (min)</label>
              <input
                id="duration"
                type="number"
                min={5}
                step={5}
                value={draft.durationMin}
                onChange={(e) => setDraft({ ...draft, durationMin: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Adding…" : "Add service"}
            </button>
          </div>
        </form>
      </div>

      {services === null && <div className="spinner-block">Loading…</div>}

      {services && services.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Price</th>
                <th>Duration</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.id}>
                  <td>
                    <strong>{s.name}</strong>
                    <div className="muted">{s.description}</div>
                  </td>
                  <td>{formatPrice(s.priceCents)}</td>
                  <td>{s.durationMin} min</td>
                  <td>
                    <span className={`badge ${s.active ? "badge-confirmed" : "badge-declined"}`}>
                      {s.active ? "live" : "hidden"}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-secondary btn-sm"
                      disabled={busyId === s.id}
                      onClick={() => toggleActive(s)}
                    >
                      {s.active ? "Hide" : "Unhide"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
