# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Dev server on port 5000 (Express + Vite HMR in one process)
npm run build      # Vite builds client → dist/public, esbuild bundles server → dist/index.cjs
npm start          # Production: NODE_ENV=production node dist/index.cjs
npm run check      # TypeScript type-check (no emit)
npm run db:push    # Push schema changes to SQLite via drizzle-kit
```

There are no tests.

## Architecture

This is a single-repo full-stack app where the Express server serves both the API and (in dev) the Vite dev server via middleware. In production, Express serves the pre-built static files from `dist/public`.

### Key patterns

**Single process, two modes:**
- Dev: `server/index.ts` → `tsx server/index.ts`, Vite dev server is mounted as Express middleware (`server/vite.ts`).
- Prod: `npm run build` produces `dist/index.cjs` (bundled server) + `dist/public/` (static client). Server serves static files from `dist/public`.

**Database:** SQLite via `better-sqlite3` + Drizzle ORM. The database file is `bronzbliss.db` (configurable via `DB_PATH` env var). All tables are created in `server/storage.ts` using raw `sqlite.exec()` CREATE IF NOT EXISTS statements — Drizzle migrations (`drizzle-kit push`) and manual table creation coexist. `journal_mode = WAL` and `foreign_keys = ON` pragmas are set on startup.

**Schema source of truth:** `shared/schema.ts` defines all Drizzle table schemas and Zod insert schemas using `drizzle-zod`. Both server (`server/storage.ts`, `server/routes.ts`) and client import from `@shared/schema` (aliased in vite.config.ts and tsconfig.json).

**Storage layer:** `server/storage.ts` exports a single `storage` object with synchronous methods (better-sqlite3 is synchronous). All DB access goes through this object — routes do not query the DB directly.

**Routing:** All API routes are registered in `server/routes.ts` via `registerRoutes(httpServer, app)`. Routes are prefixed `/api/`. Public (unauthenticated) routes are under `/api/public/`, `/api/auth/`, and a few specific endpoints listed in `publicPaths` in `server/index.ts`.

**Auth:** Session-based via `express-session` + `memorystore`. Admin password is hashed with bcrypt and stored in `business_settings.admin_password_hash`. On first startup, the hash is seeded from `ADMIN_PASSWORD` env var. In dev mode (`NODE_ENV !== 'production'`), all API routes are open without auth. In production, non-public routes require `req.session.authenticated === true`.

**Client routing:** Hash-based routing via `wouter` (`useHashLocation`). All admin pages live under `/#/...`. Three public pages have no auth gate: `/#/book`, `/#/onboard/:id`, `/#/landing`. Auth state is managed in React state in `AppShell` (not a global store) — the session is validated via `GET /api/auth/check` on load.

**Data fetching:** TanStack Query v5. The `apiRequest` helper in `client/src/lib/queryClient.ts` wraps fetch and handles auth errors. Query keys follow the pattern `["/api/resource"]`.

**UI:** shadcn/ui components (configured in `components.json`), Tailwind CSS v3, Radix UI primitives, Lucide icons, Framer Motion for animations.

**Path aliases:**
- `@/` → `client/src/`
- `@shared/` → `shared/`
- `@assets/` → `attached_assets/`

## Environment Variables

| Variable | Required in prod | Default | Notes |
|---|---|---|---|
| `ADMIN_PASSWORD` | Yes | `bronzbliss` | Seeds bcrypt hash on first run; rotating this after DB hash exists has no effect (known issue) |
| `SESSION_SECRET` | Yes | `bronzbliss-dev-secret` | Express session signing key |
| `PORT` | No | `5000` | |
| `DB_PATH` | No | `./bronzbliss.db` | |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_PHONE_NUMBER` | No | — | SMS delivery; falls back to no-op if unset |

## Git Workflow

- After completing each logical unit of work, stage and commit.
- Use conventional commits: `feat:`, `fix:`, `refactor:`, `chore:`, `security:`
- Write a short commit body with bullet points of what changed and why.
- Never push unless explicitly asked.

## Code Style

- Always validate inputs server-side.
- Keep `shared/schema.ts` and `server/storage.ts` in sync — when adding a column to the schema, add the corresponding SQL in the `CREATE TABLE` block in `storage.ts` and update the storage method signatures.

## Deployment

Deployed on Railway. Build: `npm install && npm run build`. Start: `NODE_ENV=production node dist/index.cjs`. The build script (`script/build.ts`) selectively externalizes packages not in its allowlist — if you add a new server dependency that uses native bindings (like `better-sqlite3`), add it to the externals, not the allowlist.
