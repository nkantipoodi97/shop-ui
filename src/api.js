const BASE = "/api";

export class ApiError extends Error {
  constructor(message, status, requestId) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.requestId = requestId;
  }
}

async function request(path) {
  const requestId = crypto.randomUUID().replaceAll("-", "");
  const res = await fetch(`${BASE}${path}`, { headers: { "X-Request-ID": requestId } });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      detail = (await res.json()).detail ?? detail;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(`${res.status} ${detail}`, res.status, requestId);
  }
  return res.json();
}

export const listOrders = () => request("/orders");
export const getOrder = (id) => request(`/orders/${id}`);
