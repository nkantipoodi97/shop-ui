import { useEffect, useState } from "react";
import { reportError } from "./errorReporter";

// Loads data via `fn`; reports failures (other than 404s) to the API's client-error log.
export function useApi(fn, deps) {
  const [state, setState] = useState({ data: null, error: null, loading: true });

  useEffect(() => {
    let cancelled = false;
    setState({ data: null, error: null, loading: true });
    fn()
      .then((data) => !cancelled && setState({ data, error: null, loading: false }))
      .catch((error) => {
        if (error.status !== 404) reportError(error);
        if (!cancelled) setState({ data: null, error, loading: false });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
