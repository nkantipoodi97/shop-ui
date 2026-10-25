import { Link, useParams } from "react-router-dom";
import { getOrder } from "../api";
import { useApi } from "../useApi";

export default function OrderDetail() {
  const { id } = useParams();
  const { data: order, error, loading } = useApi(() => getOrder(id), [id]);

  if (loading) return <p>Loading order…</p>;
  if (error) return <p role="alert">Failed to load order {id}: {error.message}</p>;

  return (
    <section>
      <p><Link to="/">← All orders</Link></p>
      <h2>Order #{order.id}</h2>
      <p>{order.customer} · {order.status} · {order.created_at}</p>
      <table>
        <thead>
          <tr><th>SKU</th><th>Qty</th><th>Price</th></tr>
        </thead>
        <tbody>
          {order.items.map((i) => (
            <tr key={i.sku}>
              <td>{i.sku}</td>
              <td>{i.qty}</td>
              <td>${i.price.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p><strong>Total: ${order.total.toFixed(2)}</strong></p>
    </section>
  );
}
