import { Link, Route, Routes } from "react-router-dom";
import OrdersList from "./pages/OrdersList";
import OrderDetail from "./pages/OrderDetail";
import Inventory from "./pages/Inventory";
import NewOrder from "./pages/NewOrder";

export default function App() {
  return (
    <main style={{ fontFamily: "sans-serif", maxWidth: 720, margin: "2rem auto" }}>
      <header>
        <h1><Link to="/">Shop</Link></h1>
        <small>Reference implementation with synthetic data.</small>
        <nav style={{ display: "flex", gap: "1rem", margin: "0.5rem 0" }}>
          <Link to="/">Orders</Link>
          <Link to="/inventory">Inventory</Link>
          <Link to="/orders/new">New order</Link>
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<OrdersList />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/orders/new" element={<NewOrder />} />
        <Route path="/orders/:id" element={<OrderDetail />} />
      </Routes>
    </main>
  );
}
