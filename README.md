# Synergy – AI-Assisted Child Development Platform

SENG 383 Software Project III, Fall 2026 · Team Synergy (Group G-4, Section 2)

A web-based decision support platform that brings a child's parent and specialists together around one shared weekly schedule, task list and record of observations, with a role-based AI summary that supports but never makes decisions.

- **Jira board:** https://team-synergy.atlassian.net/jira/software/projects/SYN/boards/1
- **Documents:** [SRS](docs/SRS.md) · [SDD](docs/SDD.md) · [PMP](docs/PMP.md)

## Current release

**v0.1 – mid-term release.** Parents, specialists and children log in and see a screen for their role (M1). Parents and specialists add events to the child's weekly schedule (M3) and assign tasks that the child marks done (M4). The first part of M2 is in: the specialist links table and the endpoint that links a specialist to a child. Listing and unlinking specialists, the child access check and the linking screen follow in the next sprint.

Demo accounts (seed data, password `Test1234`): `ayse@test.com` (parent), `zeynep@test.com` (specialist), `ali@test.com` (child).

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

End-to-end tests (Playwright) start the API with the seed data and the client, then test them in a browser:

```bash
cd e2e
npm install
npx playwright install chromium   # once
npm test
```

The same checks run in GitHub Actions on every pull request and on every push to `main`.

## Project structure

```
client/   React (Vite) frontend
server/   Express REST API, SQLite database, seed script, tests
e2e/      Playwright end-to-end tests
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
