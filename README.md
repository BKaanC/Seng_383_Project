# Synergy – AI-Assisted Child Development Platform

SENG 383 Software Project III, Fall 2026 · Team Synergy (Group G-4, Section 2)

A web-based decision support platform that brings a child's parent and specialists together around one shared weekly schedule, task list and record of observations, with a role-based AI summary that supports but never makes decisions.

- **Jira board:** https://team-synergy.atlassian.net/jira/software/projects/SYN/boards/1
- **Documents:** [SRS](docs/SRS.md) · [SDD](docs/SDD.md) · [PMP](docs/PMP.md)

## Current release

**v0.0 – walking skeleton.** SQLite holds sample events, Express reads them, and the React client shows them in the browser. Login, specialist links and the other modules (M1–M8) are added in the next releases.

## Requirements

- Node.js 22 or newer (`node -v`)
- npm 10 or newer

## Getting started

Open two terminals in the repository folder.

**Terminal 1 – server**

```bash
cd server
npm install
npm run seed     # creates server/data/app.db with synthetic sample data
npm start        # http://localhost:3001
```

Check that it works: open http://localhost:3001/api/health → `{"status":"ok"}`

**Terminal 2 – client**

```bash
cd client
npm install
npm run dev      # http://localhost:5173
```

Open http://localhost:5173. The page lists the sample events of the demo child, loaded from the database through the API.

## Tests

```bash
cd server && npm test            # Jest + Supertest (API tests)
cd server && npm run test:coverage
cd client && npm test            # Vitest (component tests)
cd client && npm run lint
```

The same checks run in GitHub Actions on every pull request and on every push to `main`.

## Project structure

```
client/   React (Vite) frontend
server/   Express REST API, SQLite database, seed script, tests
docs/     SRS, SDD and PMP
.github/  CI workflow
```

## Configuration

| Variable | Where | Default | Purpose |
|---|---|---|---|
| `PORT` | server | `3001` | API port |
| `DB_PATH` | server | `server/data/app.db` | SQLite file (`:memory:` in tests) |

Secrets (JWT secret, Gemini API key) will be kept in `server/.env`, which is never committed.

## Data

Only synthetic data created by the seed script is used. No real personal data is stored at any stage.

## Team workflow

Every change is tracked in Jira and merged through a reviewed pull request:

- Branch: `SYN-12-short-name`
- Commit: `SYN-12 Add short description`
- `main` is protected: one approving review and passing CI are required.
