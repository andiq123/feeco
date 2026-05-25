# Feeco

Feeco is a compact credit-report analyzer for Romanian Biroul de Credit PDFs. It turns dense PDF reports into a clear snapshot of credit score, balances, overdue amounts, inquiries, account status, and progress over time.

The project is built around a simple idea: credit reports should be readable at a glance. Upload one report for a focused summary, or upload multiple reports to see how your credit profile changes across time.

## What It Does

- Parses Romanian credit bureau PDF reports
- Supports single-report and batch analysis
- Shows FICO score and a local health estimate
- Highlights active accounts, closed accounts, overdue balances, utilization, and inquiries
- Builds a timeline from multiple reports
- Displays live aggregate usage statistics
- Supports Romanian and English
- Keeps the interface focused, modern, and easy to scan

## Stack

- Next.js, React, TypeScript, Tailwind CSS
- Go HTTP API
- PostgreSQL-backed aggregate statistics
- Vercel Analytics and Speed Insights

## Project Layout

```text
.
├── backend/              # Go API and PDF analysis pipeline
├── frontend/             # Next.js app
├── start.sh              # Local development launcher
└── README.md
```

## Local Development

Install frontend dependencies:

```bash
cd frontend
npm install
```

Run the app from the repo root:

```bash
./start.sh
```

Useful checks:

```bash
cd backend
go test ./...
```

```bash
cd frontend
npm run build
```

## Status

Feeco is an open-source personal project focused on making credit report data easier to understand. It is not financial advice and does not replace a bank, lender, credit bureau, or financial professional.
