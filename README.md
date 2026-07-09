# MobiGenie — Backend

NestJS microservices backend for MobiGenie, an AI-powered phone recommendation chat assistant. Services communicate over RabbitMQ and share MongoDB (Atlas) as the primary datastore.

## Architecture

This is an Nx-style NestJS monorepo (`nest-cli.json`, `monorepo: true`) with four deployable services and two shared libraries:

| App | Path | Responsibility |
|---|---|---|
| `api-gateway` | `apps/api-gateway` | Public HTTP API — auth, chat endpoints (incl. SSE streaming), phone catalog, admin routes, metrics. The only service exposed to the frontend. |
| `query-service` | `apps/query-service` | Parses/classifies user queries, orchestrates phone search + AI suggestions, owns chat session/message history. |
| `phone-service` | `apps/phone-service` | Phone catalog storage and search. |
| `ai-service` | `apps/ai-service` | LLM calls (Groq/OpenAI via LangChain) and TensorFlow-based embedding/similarity for recommendations. |

| Lib | Path | Purpose |
|---|---|---|
| `@app/common` | `libs/common` | Shared constants, DTOs, custom exceptions, interceptors, utils. |
| `@app/database` | `libs/database` | Mongoose schemas (`User`, `ChatSession`, `ChatMessage`, `Phone`, ...) and a generic `BaseRepository`. |
| `@app/rabbitmq` | `libs/rabbitmq` | RabbitMQ client/transport helpers used by all services. |

Services talk to each other exclusively through RabbitMQ (`@nestjs/microservices`, `Transport.RMQ`) — `api-gateway` never talks to Mongo directly except for auth (`User` schema), and proxies everything else to the relevant service via message patterns/events.

## Prerequisites

- Node.js 20+
- A running RabbitMQ instance (or use the provided `docker-compose.yml`)
- A MongoDB connection string (Atlas or self-hosted)

## Setup

```bash
npm install
cp .env.example .env   # then fill in secrets — see below
```

### Environment variables (`.env`)

| Variable | Description |
|---|---|
| `NODE_ENV` | `development` / `production` |
| `API_GATEWAY_PORT` | Port the gateway listens on (default `3000`) |
| `CORS_ORIGIN` | Allowed frontend origin, no trailing slash |
| `JWT_SECRET` / `JWT_EXPIRES_IN` | Access token signing secret + TTL |
| `JWT_REFRESH_SECRET` / `JWT_REFRESH_EXPIRES_IN` | Refresh token signing secret + TTL |
| `MONGODB_URI` | MongoDB connection string |
| `RABBITMQ_URI`, `RABBITMQ_USER`, `RABBITMQ_PASS` | Broker connection |
| `RABBITMQ_QUERY_QUEUE`, `RABBITMQ_PHONE_QUEUE`, `RABBITMQ_AI_QUEUE` | Per-service queue names |
| `GROQ_API_KEY` | Groq LLM API key |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID (Google Sign-In) |
| `GRAFANA_*`, `PROMETHEUS_PORT` | Monitoring stack config (optional, see below) |

Generate JWT secrets with:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Running

### Via Docker Compose (all services + RabbitMQ + monitoring)

```bash
docker compose up --build
```

This starts `api-gateway`, `query-service`, `phone-service`, `ai-service`, RabbitMQ (with management UI), Prometheus, and Grafana. MongoDB is **not** included — point `MONGODB_URI` at Atlas or your own instance.

### Locally, per service

Each service is a separate Nest project; run the one you need with `-p`:

```bash
npx nest start api-gateway --watch
npx nest start query-service --watch
npx nest start phone-service --watch
npx nest start ai-service --watch
```

`npm run start:dev` (no `-p`) runs the default project configured in `nest-cli.json` (`api-gateway`).

## Testing

```bash
npm run test        # unit tests
npm run test:e2e     # e2e tests
npm run test:cov     # coverage
```

## Key domains

- **Auth** (`apps/api-gateway/src/auth`) — email/password + Google OAuth login, JWT access/refresh tokens delivered as httpOnly cookies, OTP email verification, password reset, account lockout after repeated failed logins, and an ephemeral **guest login** (`POST /auth/guest`) that issues a short-lived, DB-less JWT for guests, capped at 2 chat sessions / 5 messages (enforced via claims in the guest's own token).
- **Chat** (`apps/api-gateway/src/chat` + `apps/query-service/src/query`, `.../history`) — natural-language query parsing, phone matching, AI-generated recommendations, and SSE streaming (`GET /chat/stream`) for real-time responses.
- **Phones** (`apps/phone-service`) — phone catalog CRUD and search, with admin-only write endpoints.
- **Metrics** (`apps/api-gateway/src/metrics`) — Prometheus metrics exposed for Grafana dashboards.

## Linting & formatting

```bash
npm run lint
npm run format
```
