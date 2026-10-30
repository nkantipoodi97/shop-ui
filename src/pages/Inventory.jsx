import { listInventory } from "../api";
import { useApi } from "../useApi";

export default function Inventory() {
  const { data, error, loading } = useApi(listInventory, []);

  if (loading) return <p>Loading inventory…</p>;
  if (error) return <p role="alert">Failed to load inventory: {error.message}</p>;

  return (
    <section>
      <h2>Inventory</h2>
      <table>
        <thead>
          <tr><th>SKU</th><th>Name</th><th>Price</th><th>Stock</th></tr>
        </thead>
        <tbody>
          {data.map((i) => (
            <tr key={i.sku}>
              <td>{i.sku}</td>
              <td>{i.name}</td>
              <td>${i.price.toFixed(2)}</td>
              <td>{i.stock}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
