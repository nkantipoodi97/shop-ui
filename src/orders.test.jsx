import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";

const routerFuture = { v7_startTransition: true, v7_relativeSplatPath: true };
const json = (body, status = 200, statusText = "") =>
  Promise.resolve({ ok: status < 400, status, statusText, json: () => Promise.resolve(body) });

const INVENTORY = [
  { sku: "SKU-1001", name: "Widget", price: 10, stock: 5 },
  { sku: "SKU-1005", name: "Thingamajig", price: 99.99, stock: 10 },
];

// Routes fetch by method + URL; `onPost` handles POST /api/orders.
function mockApi(onPost) {
  return vi.spyOn(globalThis, "fetch").mockImplementation((url, init = {}) => {
    if (url === "/api/inventory") return json(INVENTORY);
    if (url === "/api/orders" && init.method === "POST") return onPost(init);
    if (url === "/api/orders/42")
      return json({ id: 42, customer: "Zed", status: "pending", total: 1, created_at: "x", items: [] });
    return json({}, 204);
  });
}

const user = {
  type: (el, v) => fireEvent.change(el, { target: { value: v } }),
  selectOptions: (el, v) => fireEvent.change(el, { target: { value: v } }),
  clear: (el) => fireEvent.change(el, { target: { value: "" } }),
  click: (el) => fireEvent.click(el),
};

const renderAt = (path) =>
  render(<MemoryRouter initialEntries={[path]} future={routerFuture}><App /></MemoryRouter>);

afterEach(() => vi.restoreAllMocks());

describe("inventory page", () => {
  it("renders rows", async () => {
    mockApi();
    renderAt("/inventory");
    expect(await screen.findByText("SKU-1005")).toBeInTheDocument();
    expect(screen.getByText("Thingamajig")).toBeInTheDocument();
    expect(screen.getByText("$99.99")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
  });
});

describe("new order form", () => {
  it("adds and removes lines and updates the total", async () => {
    mockApi();
    renderAt("/orders/new");
    await screen.findByLabelText(/SKU for line 1/);

    const remove = () => screen.getAllByRole("button", { name: "Remove" });
    expect(remove()[0]).toBeDisabled();

    user.selectOptions(screen.getByLabelText(/SKU for line 1/), "SKU-1001");
    user.clear(screen.getByLabelText(/Quantity for line 1/));
    user.type(screen.getByLabelText(/Quantity for line 1/), "2");
    expect(screen.getByText("$20.00")).toBeInTheDocument();

    user.click(screen.getByRole("button", { name: "Add line" }));
    expect(remove()).toHaveLength(2);
    // Duplicate SKUs are allowed.
    user.selectOptions(screen.getByLabelText(/SKU for line 2/), "SKU-1001");
    expect(screen.getByText("$30.00")).toBeInTheDocument();

    user.click(remove()[0]);
    expect(remove()).toHaveLength(1);
    expect(remove()[0]).toBeDisabled();
    expect(screen.getByText("$10.00")).toBeInTheDocument();
  });

  it("shows the option text with price and stock", async () => {
    mockApi();
    renderAt("/orders/new");
    expect(
      await screen.findByRole("option", { name: "SKU-1005 - Thingamajig ($99.99, 10 in stock)" })
    ).toBeInTheDocument();
  });

  it("posts the expected JSON and navigates to the new order", async () => {
    const spy = mockApi(() => json({ id: 42 }, 201));
    renderAt("/orders/new");
    user.type(await screen.findByLabelText(/Customer name/), "Zed");
    user.selectOptions(screen.getByLabelText(/SKU for line 1/), "SKU-1005");
    user.click(screen.getByRole("button", { name: "Submit order" }));

    expect(await screen.findByText("Order #42")).toBeInTheDocument();
    const [, init] = spy.mock.calls.find(([, i]) => i?.method === "POST");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(init.headers["X-Request-ID"]).toBeTruthy();
    expect(JSON.parse(init.body)).toEqual({ customer: "Zed", items: [{ sku: "SKU-1005", qty: 1 }] });
  });

  it("shows server detail, status and request id on 409 and keeps input", async () => {
    const spy = mockApi(() => json({ detail: "Insufficient stock for SKU-1001" }, 409, "Conflict"));
    renderAt("/orders/new");
    user.type(await screen.findByLabelText(/Customer name/), "Zed");
    user.selectOptions(screen.getByLabelText(/SKU for line 1/), "SKU-1001");
    user.clear(screen.getByLabelText(/Quantity for line 1/));
    user.type(screen.getByLabelText(/Quantity for line 1/), "7"); // above stock of 5
    user.click(screen.getByRole("button", { name: "Submit order" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Insufficient stock for SKU-1001");
    expect(alert).toHaveTextContent("409");
    const sent = spy.mock.calls.find(([, i]) => i?.method === "POST")[1];
    expect(alert).toHaveTextContent(`Request ID: ${sent.headers["X-Request-ID"]}`);
    expect(screen.getByLabelText(/Customer name/)).toHaveValue("Zed");
    expect(screen.getByLabelText(/SKU for line 1/)).toHaveValue("SKU-1001");
    expect(screen.getByLabelText(/Quantity for line 1/)).toHaveValue(7);
    // 409 is not reported to /api/client-errors.
    expect(spy.mock.calls.some(([u]) => u === "/api/client-errors")).toBe(false);
  });

  it("reports 5xx failures to client-errors", async () => {
    const spy = mockApi(() => json({ detail: "boom" }, 500, "Server Error"));
    renderAt("/orders/new");
    user.type(await screen.findByLabelText(/Customer name/), "Zed");
    user.selectOptions(screen.getByLabelText(/SKU for line 1/), "SKU-1001");
    user.click(screen.getByRole("button", { name: "Submit order" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("boom");
    await waitFor(() => expect(spy.mock.calls.some(([u]) => u === "/api/client-errors")).toBe(true));
  });

  it("does not block qty above stock on the client", async () => {
    const spy = mockApi(() => json({ id: 42 }, 201));
    renderAt("/orders/new");
    user.type(await screen.findByLabelText(/Customer name/), "Zed");
    user.selectOptions(screen.getByLabelText(/SKU for line 1/), "SKU-1001");
    user.clear(screen.getByLabelText(/Quantity for line 1/));
    user.type(screen.getByLabelText(/Quantity for line 1/), "500");
    const submit = screen.getByRole("button", { name: "Submit order" });
    expect(submit).toBeEnabled();
    user.click(submit);
    await screen.findByText("Order #42");
    const body = JSON.parse(spy.mock.calls.find(([, i]) => i?.method === "POST")[1].body);
    expect(body.items[0].qty).toBe(500);
  });
});
