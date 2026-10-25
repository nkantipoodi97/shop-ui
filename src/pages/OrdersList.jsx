import { Link } from "react-router-dom";
import { listOrders } from "../api";
import { useApi } from "../useApi";

export default function OrdersList() {
  const { data, error, loading } = useApi(listOrders, []);

  if (loading) return <p>Loading orders…</p>;
  if (error) return <p role="alert">Failed to load orders: {error.message}</p>;

  return (
    <section>
      <h2>Orders</h2>
      <table>
        <thead>
          <tr><th>ID</th><th>Customer</th><th>Status</th><th>Total</th><th>Created</th></tr>
        </thead>
        <tbody>
          {data.map((o) => (
            <tr key={o.id}>
              <td><Link to={`/orders/${o.id}`}>#{o.id}</Link></td>
              <td>{o.customer}</td>
              <td>{o.status}</td>
              <td>${o.total.toFixed(2)}</td>
              <td>{o.created_at}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
