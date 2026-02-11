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
- Unit tests for analyzer, URL canonicalization/hash, share-card formatting, rate limiting, and report validation utilities
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

Anti-abuse protections:

- `POST /api/analyze`: max **30 requests/minute** per client IP
- `POST /api/report`: max **5 requests/minute** per client IP
- Exceeded limits return `429` with `{ "error": "Rate limit exceeded. Try again shortly." }`

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


## Auth setup (Google)

Scam Shield uses Auth.js (NextAuth) with Google OAuth for optional user accounts.

1. Open [Google Cloud Console](https://console.cloud.google.com/), create/select a project.
2. Configure the OAuth consent screen (External is fine for local dev).
3. Create **OAuth client ID** credentials with application type **Web application**.
4. Add this authorized redirect URI:
   - `http://localhost:3000/api/auth/callback/google`
5. Copy `.env.example` to `.env.local` and fill:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `NEXTAUTH_SECRET` (generate a long random string)
   - `NEXTAUTH_URL=http://localhost:3000`
6. Start the app with `npm run dev` and sign in from the top navigation.

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
{ "ok": true, "id": 1, "merged": false }
```

Dedupe behavior for `POST /api/report`:

- URLs are canonicalized (`http/https` only, host lower-cased, fragment removed, trailing slash normalized).
- Up to 5 URLs accepted, with max 2048 chars per URL.
- A stable SHA-256 hash of canonical URLs is used to merge duplicate reports from the last 24 hours.
- Duplicate reports increment a `count` and refresh `updatedAt` instead of creating a new row.

### `GET /api/reports?limit=20`

Response JSON:

```json
{
  "reports": [
    {
      "id": 1,
      "createdAt": "2026-02-11T00:00:00.000Z",
      "updatedAt": "2026-02-11T00:05:00.000Z",
      "verdict": "DANGEROUS",
      "score": 85,
      "scamType": "Bank impersonation",
      "note": "optional note",
      "urls": ["https://example.com"],
      "count": 2
    }
  ]
}
```


### `POST /api/save-check` (auth required)

Request JSON:

```json
{
  "verdict": "SUSPICIOUS",
  "score": 61,
  "reasons": ["Contains one or more links that should be verified carefully."],
  "urls": ["https://example.com/path?a=1"]
}
```

Response JSON:

```json
{ "ok": true, "check": { "id": "..." } }
```

Storage policy for saved checks:

- Never stores the full pasted message text.
- Stores only `verdict`, `score`, `reasons`, and detected URL hostnames (`domains`).

### `GET /api/my-checks` (auth required)

Response JSON:

```json
{
  "checks": [
    {
      "id": "...",
      "createdAt": "2026-02-11T00:00:00.000Z",
      "verdict": "DANGEROUS",
      "score": 85,
      "reasons": ["..."],
      "domains": ["example.com"]
    }
  ]
}
```

## Sharing as image

On the home page results panel, Scam Shield supports privacy-first sharing with a generated PNG card (1080x1080):

- **Share image** generates a local canvas image and uses the native Web Share API with files when available.
- If file sharing is unavailable, it falls back to downloading the image and shows `Downloaded (sharing not supported)`.
- **Download image** always downloads `scam-shield-verdict.png`.
- The image includes verdict, score/progress, top reasons, and detected domains only. It **never includes the user's full pasted message**.

## Optional legacy duplicate merge

If you have older DB rows from before URL hash/count dedupe fields were populated, you can run a one-time cleanup:

```bash
npm run db:merge-legacy
```

This script recomputes canonical URL hashes, merges duplicate rows by newest `updatedAt`, sums counts, fills missing `scamType`/`note` where possible, and deletes redundant rows.

## Roadmap

- Add client-side safeguards for risky link previews
- Improve scoring explainability and false-positive tuning
- Add localization support
- Add offline caching and installable PWA manifest/service worker
