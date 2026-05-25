# Credit Analyzer

A compact web app for turning Romanian credit bureau PDF reports into a clear, readable credit snapshot.

Credit Analyzer lets you upload one or more PDF reports, extracts the useful financial signals locally through a Go API, and shows score, balances, overdue amounts, inquiries, account status, and timeline changes in a modern Next.js interface.

## Features

- Single and batch PDF analysis, up to 50 reports per upload
- FICO score and local health score display
- Timeline comparison across multiple reports
- Active and closed account summaries
- Balance, credit limit, utilization, past due, and inquiry detection
- Romanian and English UI
- Private backend API key between frontend and backend
- Basic per-client rate limiting on both frontend API routes and backend API routes

## Tech Stack

- Frontend: Next.js, React, TypeScript, Tailwind CSS
- Backend: Go HTTP API
- PDF parsing: Go-based parser pipeline
- Dev runner: `start.sh`, with Air for backend hot reload

## Project Structure

```text
.
├── backend/              # Go API and PDF analysis pipeline
│   ├── cmd/server/       # HTTP server, middleware, routes
│   └── internal/analyzer # PDF extraction and report modeling
├── frontend/             # Next.js app and API proxy routes
├── start.sh              # Starts backend and frontend together
└── README.md
```

## Requirements

- Go 1.26+
- Node.js and npm

## Setup

Create local env files:

```bash
touch backend/.env frontend/.env.local
```

Set the same long random value in both files:

```text
BACKEND_API_KEY=replace-with-a-long-random-secret
```

The frontend uses this key only on server-side API routes when proxying requests to the Go backend. Do not prefix it with `NEXT_PUBLIC_`.

Optional frontend donation link:

```text
NEXT_PUBLIC_PAYPAL_COFFEE_URL=https://www.paypal.com/paypalme/your-paypal-name
```

If this value is empty, the coffee link is hidden.

## Environment Variables

Backend, `backend/.env`:

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `8080` | Backend server port |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000,http://127.0.0.1:3000` | Allowed browser origins |
| `BACKEND_API_KEY` | required | Shared secret required by backend routes |
| `RATE_LIMIT_REQUESTS` | `60` | Requests allowed per client window |
| `RATE_LIMIT_WINDOW_SECONDS` | `60` | Rate-limit window size |
| `POSTGRES_URL` | required | Supabase Postgres connection string for aggregate statistics |

Database access is intentionally backend-only. The browser and Next.js routes never connect to Supabase directly; Next.js only proxies aggregate statistics through the Go API using `BACKEND_API_KEY`. Remote Postgres connections require SSL, and `sslmode=disable` is only allowed for local development hosts.

Frontend, `frontend/.env.local`:

| Variable | Default | Description |
| --- | --- | --- |
| `BACKEND_URL` | `http://localhost:8080` | Go API URL used by Next.js API routes |
| `BACKEND_API_KEY` | required | Same shared secret as the backend |
| `RATE_LIMIT_REQUESTS` | `60` | Requests allowed per client window |
| `RATE_LIMIT_WINDOW_SECONDS` | `60` | Rate-limit window size |
| `NEXT_PUBLIC_PAYPAL_COFFEE_URL` | empty | Optional public PayPal coffee link |

## Development

Install frontend dependencies:

```bash
cd frontend
npm install
```

Run both services from the repo root:

```bash
./start.sh
```

The app starts at:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8080`
- Health check: `http://localhost:8080/healthz`

You can also run services separately:

```bash
cd backend
go run ./cmd/server
```

```bash
cd frontend
npm run dev
```

## Verification

Backend tests:

```bash
cd backend
go test ./...
```

Frontend production build:

```bash
cd frontend
npm run build
```

## Security Notes

- Never commit real `.env` files or production secrets.
- `BACKEND_API_KEY` is required by the backend at startup.
- Keep `BACKEND_API_KEY` server-side only. Use `NEXT_PUBLIC_` only for values that are safe to expose in the browser.
- Rate limiting is in-memory and suitable for local or single-instance deployments. For distributed production deployments, use a shared store or edge rate limiting.
- Uploaded PDFs can contain sensitive personal and financial data. Run only in environments you trust.

## License

No license file is included yet. Add a license before publishing if you want others to use, modify, or redistribute the project under clear terms.
# feeco
