# shop-ui

Reference implementation with synthetic data, not production code.

- Node.js 22 LTS, React 18.3.1, Vite 5.4.11, Vitest 2.1.8 + React Testing Library 16.1.0

```powershell
npm install
npm run dev     # http://localhost:5173, proxies /api to http://localhost:8000
npm test        # 3 smoke tests
npm run build
```

Pages: `/` (orders list), `/orders/:id` (order detail).

Client errors (global `error` / `unhandledrejection`, the React error boundary, and failed API calls
other than 404s) are POSTed to `/api/client-errors`, which shop-api logs.
