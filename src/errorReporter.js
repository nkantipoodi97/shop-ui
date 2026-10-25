const ENDPOINT = "/api/client-errors";

export function reportError(error, extra = {}) {
  const payload = {
    message: error?.message ?? String(error),
    stack: error?.stack ?? null,
    url: window.location.href,
    user_agent: navigator.userAgent,
    client_request_id: error?.requestId ?? extra.requestId ?? null,
  };
  // Fire and forget; reporting must never throw.
  try {
    return fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  } catch {
    return Promise.resolve();
  }
}

export function installGlobalHandlers() {
  window.addEventListener("error", (e) => reportError(e.error ?? new Error(e.message)));
  window.addEventListener("unhandledrejection", (e) =>
    reportError(e.reason instanceof Error ? e.reason : new Error(String(e.reason)))
  );
}
