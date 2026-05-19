# DebateSphere

A modern full-stack realtime debate and opinion analytics platform. Users create debate rooms, post arguments, vote on opinions, join live discussions, and track reputation across a tier-based credibility system.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, TailwindCSS, shadcn/ui, TanStack Query, Wouter, Recharts |
| **Backend** | Spring Boot 3.2.5, Spring Security, Spring WebSocket |
| **Database** | PostgreSQL (Drizzle schema, Spring JPA/Hibernate for runtime) |
| **Auth** | JWT (JJWT 0.12.5) stored in `localStorage` |
| **API Contract** | OpenAPI 3.0 spec → Orval codegen (React Query hooks + Zod schemas) |
| **Build** | Maven (backend), pnpm workspaces (frontend/libs) |
| **Runtime** | Java 17, Node.js 24, TypeScript 5.9 |

---

## Project Structure

```
.
├── artifacts/
│   ├── api-server/          # Spring Boot backend (Java)
│   │   ├── src/main/java/com/debatesphere/
│   │   │   ├── config/      # DataSource, Security, WebSocket config
│   │   │   ├── controller/  # REST controllers (auth, debates, arguments, votes, users, analytics)
│   │   │   ├── dto/         # Request/response DTOs
│   │   │   ├── entity/      # JPA entities (User, Debate, Argument, Reply, Vote, Participant)
│   │   │   ├── repository/  # Spring Data JPA repositories
│   │   │   ├── security/    # JWT filter, token provider, UserDetailsService
│   │   │   ├── service/     # Business logic
│   │   │   └── websocket/   # WebSocket handler for realtime debate updates
│   │   └── src/main/resources/
│   │       └── application.yml
│   └── debatesphere/        # React + Vite frontend
│       └── src/
│           ├── components/  # Layout, shadcn/ui components, TierBadge
│           ├── hooks/       # useAuth, useToast, useMobile
│           └── pages/       # home, debate, analytics, leaderboard, profile, login, register
├── lib/
│   ├── api-client-react/    # Generated TanStack Query hooks (from OpenAPI)
│   ├── api-spec/            # openapi.yaml — source of truth for all API contracts
│   └── db/                  # Drizzle ORM schema (used for DB setup only)
└── scripts/                 # Utility scripts
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string. Accepts `postgresql://`, `postgres://`, or `jdbc:postgresql://` formats. |
| `SESSION_SECRET` | Yes | Secret key for signing JWT tokens. Use a long random string (32+ characters). |
| `PORT` | Dev only | Port for the backend server (default: `8080`). Set automatically by the host platform. |

---

## Local Development (VS Code)

### Prerequisites

- Java 17+
- Maven 3.9+
- Node.js 24+
- pnpm 9+
- PostgreSQL 14+

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd debatesphere
pnpm install
```

### 2. Set environment variables

Create a `.env` file at the project root (for reference — each tool reads env vars differently):

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/debatesphere
SESSION_SECRET=your-very-long-random-secret-key-here
```

**For the backend**, set these in your shell or IDE run config before starting:

```bash
export DATABASE_URL=postgresql://user:password@localhost:5432/debatesphere
export SESSION_SECRET=your-very-long-random-secret-key-here
```

**For the frontend**, no additional env vars are needed for local development (it uses relative API URLs).

### 3. Set up the database

The database schema is managed by Drizzle. Push the schema to your local PostgreSQL:

```bash
pnpm --filter @workspace/db run push
```

### 4. Start the backend

```bash
cd artifacts/api-server
mvn spring-boot:run
```

The API server starts on `http://localhost:8080`. All routes are under `/api` (e.g. `http://localhost:8080/api/healthz`).

### 5. Start the frontend

In a separate terminal:

```bash
PORT=3000 BASE_PATH=/ pnpm --filter @workspace/debatesphere run dev
```

The frontend starts on `http://localhost:3000`.

> **Tip:** The frontend uses relative URLs for API calls, so both services must be accessible from the same origin in production. For local development with two ports, configure a reverse proxy (e.g. nginx or Vite proxy) or run both behind a single proxy on port 80.

### Useful development commands

```bash
# Regenerate API hooks after changing openapi.yaml
pnpm --filter @workspace/api-spec run codegen

# Full TypeScript check
pnpm run typecheck

# Push DB schema changes (dev only)
pnpm --filter @workspace/db run push

# Build the frontend
BASE_PATH=/ pnpm --filter @workspace/debatesphere run build

# Package the backend JAR
cd artifacts/api-server && mvn package -DskipTests
```

---

## API Overview

All routes are served under the `/api` context path.

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/healthz` | No | Health check |
| `POST` | `/api/auth/register` | No | Register a new user |
| `POST` | `/api/auth/login` | No | Login, returns JWT |
| `GET` | `/api/auth/me` | Yes | Current user profile |
| `GET` | `/api/debates` | No | List debates (filter, search, sort, paginate) |
| `GET` | `/api/debates/trending` | No | Trending debates |
| `GET` | `/api/debates/categories` | No | Available categories |
| `GET` | `/api/debates/{id}` | No | Single debate |
| `POST` | `/api/debates` | Yes | Create debate |
| `POST` | `/api/debates/{id}/join` | Yes | Join a debate |
| `GET` | `/api/debates/{id}/arguments` | No | List arguments |
| `POST` | `/api/debates/{id}/arguments` | Yes | Post argument |
| `POST` | `/api/votes/argument/{id}` | Yes | Vote on argument |
| `GET` | `/api/arguments/{id}/replies` | No | List replies |
| `POST` | `/api/arguments/{id}/replies` | Yes | Post reply |
| `GET` | `/api/users/{id}` | No | User profile |
| `GET` | `/api/users/{id}/debates` | No | User's debates |
| `GET` | `/api/analytics/dashboard` | No | Platform stats |
| `GET` | `/api/analytics/trending-categories` | No | Trending categories |
| `GET` | `/api/analytics/leaderboard` | No | User leaderboard |
| `GET` | `/api/analytics/activity` | No | Activity timeline |
| `WS` | `/api/ws?debateId={id}` | No | Realtime debate updates |

Interactive API docs (Swagger UI): `http://localhost:8080/api/swagger-ui.html`

### Authentication

Protected endpoints require a `Bearer` token in the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

Tokens are issued on login/register and expire after 24 hours.

### Reputation Tiers

| Tier | Reputation Range |
|---|---|
| Bronze | 0 – 99 |
| Silver | 100 – 499 |
| Gold | 500 – 999 |
| Diamond | 1000+ |

---

## Deployment on Render

### Backend — Web Service

1. In the Render dashboard, create a new **Web Service**.
2. Connect your GitHub repository.
3. Configure:

| Setting | Value |
|---|---|
| **Runtime** | Java |
| **Build Command** | `cd artifacts/api-server && mvn package -DskipTests` |
| **Start Command** | `java -jar artifacts/api-server/target/debatesphere-api.jar` |
| **Instance Type** | Starter or above |

4. Add environment variables:

| Key | Value |
|---|---|
| `DATABASE_URL` | Your Render PostgreSQL internal connection string |
| `SESSION_SECRET` | A long random secret (generate with `openssl rand -hex 32`) |

### Frontend — Static Site

1. In the Render dashboard, create a new **Static Site**.
2. Connect the same GitHub repository.
3. Configure:

| Setting | Value |
|---|---|
| **Build Command** | `pnpm install && BASE_PATH=/ pnpm --filter @workspace/debatesphere run build` |
| **Publish Directory** | `artifacts/debatesphere/dist/public` |

4. Add a **Rewrite Rule** so that client-side routing works:

| Source | Destination | Action |
|---|---|---|
| `/*` | `/index.html` | Rewrite |

5. Add environment variables:

| Key | Value |
|---|---|
| `BASE_PATH` | `/` |

### Database — PostgreSQL

1. Create a new **PostgreSQL** database in Render.
2. Copy the **Internal Database URL** into the backend's `DATABASE_URL` environment variable.
3. Run the schema migration once after first deploy:
   ```bash
   DATABASE_URL=<your-render-db-url> pnpm --filter @workspace/db run push
   ```

### API URL Configuration

The frontend uses **relative URLs** for all API calls, so in production both the frontend static site and the backend web service must be served under the same domain. The recommended approach on Render:

- Deploy the backend as a Web Service at `https://debatesphere-api.onrender.com`
- Deploy the frontend as a Static Site and configure a **custom domain** or use Render's routing/proxy to forward `/api/*` requests to the backend URL.

Alternatively, configure the frontend's API base URL via a build-time environment variable if using split domains.

---

## Production Checklist

- [x] No hardcoded `localhost` URLs in frontend source
- [x] No mock/demo data in production code paths
- [x] No `System.out.println` or `e.printStackTrace()` in Java code
- [x] No `console.log` debug statements in frontend
- [x] JWT secret read from `SESSION_SECRET` environment variable (no hardcoded fallback in production)
- [x] `DATABASE_URL` supports both `postgresql://` and `jdbc:postgresql://` formats
- [x] CORS configured with wildcard origins on WebSocket (restrict for production if needed)
- [x] Spring Security CSRF disabled (stateless JWT API)
- [x] HikariCP connection pool configured (max 10 connections, 20s timeout)
- [x] Frontend `vite build` succeeds without `PORT`/`BASE_PATH` env vars
- [x] TypeScript strict mode, zero type errors
- [x] Maven `package` produces a self-contained executable JAR

---

## License

MIT
