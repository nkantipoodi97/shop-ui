import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createOrder, listInventory } from "../api";
import { reportError } from "../errorReporter";
import { useApi } from "../useApi";

export default function NewOrder() {
  const { data: inventory, error: loadError, loading } = useApi(listInventory, []);
  const navigate = useNavigate();
  const nextId = useRef(1);
  const newLine = () => ({ id: nextId.current++, sku: "", qty: "1" });

  const [customer, setCustomer] = useState("");
  const [lines, setLines] = useState(() => [newLine()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (loading) return <p>Loading inventory…</p>;
  if (loadError) return <p role="alert">Failed to load inventory: {loadError.message}</p>;

  const bySku = Object.fromEntries(inventory.map((i) => [i.sku, i]));
  const isQtyValid = (q) => /^\d+$/.test(q.trim()) && Number(q) >= 1;
  const total = lines.reduce(
    (sum, l) => sum + (bySku[l.sku] && isQtyValid(l.qty) ? bySku[l.sku].price * Number(l.qty) : 0),
    0
  );
  const valid = customer.trim() !== "" && lines.every((l) => l.sku && isQtyValid(l.qty));

  const updateLine = (id, patch) =>
    setLines((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  async function onSubmit(e) {
    e.preventDefault();
    if (!valid || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const order = await createOrder({
        customer: customer.trim(),
        items: lines.map((l) => ({ sku: l.sku, qty: Number(l.qty) })),
      });
      navigate(`/orders/${order.id}`);
    } catch (err) {
      // 409/422 are business validation errors the API already logs; report everything else.
      if (err.status !== 409 && err.status !== 422) reportError(err);
      setError(err);
      setSubmitting(false);
    }
  }

  return (
    <section>
      <h2>New order</h2>
      <form onSubmit={onSubmit}>
        <p>
          <label>
            Customer name{" "}
            <input value={customer} onChange={(e) => setCustomer(e.target.value)} required />
          </label>
        </p>
        {lines.map((l, idx) => (
          <p key={l.id}>
            <label>
              SKU for line {idx + 1}{" "}
              <select value={l.sku} onChange={(e) => updateLine(l.id, { sku: e.target.value })} required>
                <option value="">Select a SKU</option>
                {inventory.map((i) => (
                  <option key={i.sku} value={i.sku}>
                    {i.sku} - {i.name} (${i.price.toFixed(2)}, {i.stock} in stock)
                  </option>
                ))}
              </select>
            </label>{" "}
            <label>
              Quantity for line {idx + 1}{" "}
              <input
                type="number"
                min="1"
                step="1"
                value={l.qty}
                onChange={(e) => updateLine(l.id, { qty: e.target.value })}
                required
              />
            </label>{" "}
            <button
              type="button"
              disabled={lines.length === 1}
              onClick={() => setLines((ls) => ls.filter((x) => x.id !== l.id))}
            >
              Remove
            </button>
          </p>
        ))}
        <p><button type="button" onClick={() => setLines((ls) => [...ls, newLine()])}>Add line</button></p>
        <p>Estimated total: <strong>${total.toFixed(2)}</strong></p>
        {error && (
          <p role="alert">
            Order failed: {error.detail ?? error.message}
            {error.status != null && <> (HTTP {error.status})</>}
            {error.requestId && <> Request ID: {error.requestId}</>}
          </p>
        )}
        <button type="submit" disabled={!valid || submitting}>
          {submitting ? "Submitting…" : "Submit order"}
        </button>
      </form>
    </section>
  );
}
