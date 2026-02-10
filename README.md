# Scam Shield (MVP Foundation)

Scam Shield is a privacy-first Progressive Web App (PWA-ready foundation) that helps users perform a quick **risk assessment** on suspicious messages and links.

> This is not a certainty engine. It provides conservative guidance based on transparent heuristics.

## What this project includes

- Next.js + TypeScript + App Router baseline
- Tailwind CSS for a clean, lightweight UI
- Home page scanner flow (`/`)
- Privacy page (`/privacy`)
- API route (`POST /api/analyze`) with rules-based analysis and URL extraction
- Unit tests for core analyzer utilities
- ESLint + Prettier setup
- GitHub Actions CI for lint + tests on push and pull requests

## Privacy stance

Scam Shield is built privacy-first:

- No authentication required
- No database configured
- No storage of submitted message content by default
- No external paid APIs

The analyzer runs using simple in-process logic and returns only the computed assessment.

## Quick start (local)

### 1) Install dependencies

```bash
npm install
```

### 2) Run the app

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

## API contract

`POST /api/analyze`

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

## Roadmap

- Add client-side safeguards for risky link previews
- Add optional, explicit user-consent telemetry (off by default)
- Improve scoring explainability and false-positive tuning
- Add localization support
- Add offline caching and installable PWA manifest/service worker
