import { Link, Route, Routes } from "react-router-dom";
import OrdersList from "./pages/OrdersList";
import OrderDetail from "./pages/OrderDetail";

export default function App() {
  return (
    <main style={{ fontFamily: "sans-serif", maxWidth: 720, margin: "2rem auto" }}>
      <header>
        <h1><Link to="/">Shop</Link></h1>
        <small>Reference implementation with synthetic data.</small>
      </header>
      <Routes>
        <Route path="/" element={<OrdersList />} />
        <Route path="/orders/:id" element={<OrderDetail />} />
      </Routes>
    </main>
  );
}
