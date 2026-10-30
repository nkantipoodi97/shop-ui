const BASE = "/api";

export class ApiError extends Error {
  constructor(message, status, requestId, detail) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.requestId = requestId;
    this.detail = detail;
  }
}

async function request(path, { method = "GET", body } = {}) {
  const requestId = crypto.randomUUID().replaceAll("-", "");
  const headers = { "X-Request-ID": requestId };
  const init = { headers };
  if (method !== "GET") init.method = method;
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }
  const res = await fetch(`${BASE}${path}`, init);
  if (!res.ok) {
    let detail = res.statusText;
    try {
      detail = (await res.json()).detail ?? detail;
    } catch {
      /* non-JSON error body */
    }
    if (typeof detail !== "string") detail = JSON.stringify(detail);
    throw new ApiError(`${res.status} ${detail}`, res.status, requestId, detail);
  }
  return res.json();
}

export const listOrders = () => request("/orders");
export const getOrder = (id) => request(`/orders/${id}`);
export const listInventory = () => request("/inventory");
export const createOrder = (body) => request("/orders", { method: "POST", body });
