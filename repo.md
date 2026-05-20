# DebateSphere

A modern full-stack realtime debate and opinion analytics platform where users create debate rooms, post arguments, vote on opinions, join live discussions, and view analytics about trending debates and user credibility.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/debatesphere run dev` — run the frontend (port from env)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — JWT signing secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + WebSockets (ws)
- Auth: JWT (jsonwebtoken + bcryptjs) stored in localStorage as `debatesphere_token`
- DB: PostgreSQL + Drizzle ORM
- Frontend: React + Vite + TailwindCSS + shadcn/ui + Recharts
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for all contracts)
- `lib/db/src/schema/` — Drizzle DB schema (users, debates, arguments, replies, votes, participants)
- `artifacts/api-server/src/routes/` — Express route handlers (auth, debates, arguments, users, analytics)
- `artifacts/api-server/src/middlewares/auth.ts` — JWT middleware
- `artifacts/api-server/src/lib/websocket.ts` — WebSocket server (path: /api/ws?debateId=)
- `artifacts/debatesphere/src/` — React frontend
- `artifacts/debatesphere/src/hooks/use-auth.tsx` — Auth context + localStorage token management

## Architecture decisions

- Contract-first: OpenAPI spec drives both server Zod schemas and frontend React Query hooks via codegen
- JWT stored in localStorage (key: `debatesphere_token`) with `setAuthTokenGetter` from the API client
- WebSocket server runs on the same HTTP server as Express, path `/api/ws`; clients connect with `?debateId=<id>` query param
- Reputation tier system: Bronze (0-99) → Silver (100-499) → Gold (500-999) → Diamond (1000+)
- Votes update argument upvote/downvote counts AND author reputation in a single transaction

## Product

- **Feed** (`/`) — Browse debates with category filters, trending sidebar, search, create new debates
- **Debate Room** (`/debate/:id`) — Live room with WebSocket realtime updates, post arguments (for/against/neutral), vote, reply
- **Analytics** (`/analytics`) — Platform stats, trending categories chart, activity over time, most active debates
- **Leaderboard** (`/leaderboard`) — User reputation rankings with tier badges
- **Profile** (`/profile/:id`) — User stats, tier badge, debate history
- **Auth** — Register/Login with JWT

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After changing `lib/api-spec/openapi.yaml`, always run `pnpm --filter @workspace/api-spec run codegen` before using updated types
- Run `pnpm run typecheck:libs` before `pnpm --filter @workspace/api-server run typecheck` — the api-server depends on the built lib declarations
- OpenAPI operationIds with both path params AND query params cause Orval TS2308 collision; use path-only params or query-only params per operation
- The API server must be restarted after adding new routes (it builds to dist/ before starting)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
