# Scam Shield (MVP Foundation)

Scam Shield is a privacy-first Progressive Web App (PWA-ready foundation) that helps users perform a quick **risk assessment** on suspicious messages and links.

> This is not a certainty engine. It provides conservative guidance based on transparent heuristics.

## What this project includes

- Next.js + TypeScript + App Router baseline
- Tailwind CSS for a clean, lightweight UI
- Home page scanner flow (`/`)
- Privacy page (`/privacy`)
- Public reports feed (`/reports`)
- Global top navigation with direct links to Analyzer, Public feed (`/reports`), and Privacy
- API routes:
  - `POST /api/analyze`
  - `POST /api/report`
  - `GET /api/reports?limit=20`
- SQLite-backed report storage
- Unit tests for analyzer and report validation utilities
- ESLint + Prettier setup
- GitHub Actions CI for lint + tests on push and pull requests

## Privacy stance

Scam Shield is built privacy-first:

- No authentication required
- User message text is **not** persisted as a full raw submission
- Stored report data includes only:
  - sanitized URLs (`http/https` only)
  - verdict + score
  - optional scam type
  - optional short note (max 280 chars)
  - timestamp
- Report sharing requires explicit user opt-in confirmations
- No external paid APIs

## Quick start (local)

### 1) Install dependencies

```bash
npm install
```

### 2) Database setup

```bash
npm run db:generate
npm run db:migrate
```

### 3) Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Run checks

### Lint

```bash
npm run lint
```

### Unit tests

```bash
npm run test
```

### Format code

```bash
npm run format
```

## API contracts

### `POST /api/analyze`

Request JSON:

```json
{ "text": "string" }
```

Response JSON:

```json
{
  "verdict": "SAFE | SUSPICIOUS | DANGEROUS",
  "score": 0,
  "reasons": ["..."],
  "urls": ["https://..."]
}
```

### `POST /api/report`

Request JSON:

```json
{
  "verdict": "SUSPICIOUS",
  "score": 61,
  "scamType": "Delivery",
  "note": "optional, max 280 chars",
  "urls": ["https://example.com"]
}
```

Response JSON:

```json
{ "ok": true, "id": 1 }
```

### `GET /api/reports?limit=20`

Response JSON:

```json
{
  "reports": [
    {
      "id": 1,
      "createdAt": "2026-02-11T00:00:00.000Z",
      "verdict": "DANGEROUS",
      "score": 85,
      "scamType": "Bank impersonation",
      "note": "optional note",
      "urls": ["https://example.com"]
    }
  ]
}
```

## Sharing behavior

On the home page results panel, Scam Shield supports growth-friendly sharing while keeping user input private:

- **Copy verdict** copies a formatted summary with verdict, score, reasons, and a safety tip.
- **Share** uses the native Web Share API when available; otherwise it falls back to clipboard copy.
- Shared text is privacy-first and **does not include the user's full original message**.

## Roadmap

- Add client-side safeguards for risky link previews
- Improve scoring explainability and false-positive tuning
- Add localization support
- Add offline caching and installable PWA manifest/service worker
