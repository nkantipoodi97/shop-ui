import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { reportError } from "./errorReporter";

const routerFuture = { v7_startTransition: true, v7_relativeSplatPath: true };
const json = (body, status = 200) =>
  Promise.resolve({ ok: status < 400, status, statusText: "", json: () => Promise.resolve(body) });

afterEach(() => vi.restoreAllMocks());

describe("shop-ui smoke tests", () => {
  it("renders the orders list", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(() =>
      json([{ id: 1, customer: "Alice Example", status: "shipped", total: 28.99, created_at: "2026-01-01" }])
    );
    render(<MemoryRouter initialEntries={["/"]} future={routerFuture}><App /></MemoryRouter>);
    expect(await screen.findByText("Alice Example")).toBeInTheDocument();
    expect(screen.getByText("$28.99")).toBeInTheDocument();
  });

  it("renders order detail with items", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(() =>
      json({ id: 7, customer: "Bob Sample", status: "pending", total: 24.5, created_at: "2026-01-02",
             items: [{ sku: "SKU-1002", qty: 1, price: 24.5 }] })
    );
    render(<MemoryRouter initialEntries={["/orders/7"]} future={routerFuture}><App /></MemoryRouter>);
    expect(await screen.findByText("Order #7")).toBeInTheDocument();
    expect(screen.getByText("SKU-1002")).toBeInTheDocument();
  });

  it("reports client errors to the API", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockImplementation(() => json({}, 204));
    await reportError(new Error("kaboom"));
    const [url, init] = spy.mock.calls[0];
    expect(url).toBe("/api/client-errors");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body).message).toBe("kaboom");
  });
});
