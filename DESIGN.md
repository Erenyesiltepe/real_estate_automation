# DESIGN.md — Estate Agency Transaction System

## Overview

This document explains the architectural decisions, data model choices, API design, security approach, and frontend state management strategy for the Estate Agency Transaction System.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend framework | NestJS (Node.js, TypeScript) |
| Database | MongoDB Atlas via Mongoose |
| Testing | Jest |
| Frontend framework | Nuxt 4 |
| State management | Pinia (`@pinia/nuxt`) |
| Styling | Tailwind CSS |
| API documentation | Swagger via `@nestjs/swagger` |
| Package manager | pnpm |

---

## Scope Decision — Admin Only

The system is built as an admin-only application. Agents exist as data entries in the database but do not have login access. All actions — creating agents, properties, transactions, and triggering stage transitions — are performed by the admin.

This decision was made to keep the scope tight and focused on the core evaluation criteria: commission logic, stage transitions, and financial breakdown. The `role` field is retained on the `users` collection so that agent-facing views can be added as a future extension without schema changes — `RolesGuard` is already applied across all controllers to enforce this boundary today.
It is assumed that admin users cannot involve in transactions as agents.

---

## Data Models

### 4 Collections

#### `users`
Stores agent data. Agents are created and managed by the admin — they do not log in. Only the admins can log in.
- `passwordHash` is stored to let admin users log in. It is also open for future extensions and if required agents can also log in but this option is neglected in the current implementation.
- `isActive` is used for soft delete instead of hard delete — this preserves referential integrity since user IDs are referenced in `transactions` and `commission_breakdowns`. Hard deleting a user would orphan those records
- `role` field is kept to support future role-based access control without a schema migration
- `name` is the agent's display name, used across the UI wherever the agent is referenced
- `email` is used as the login credential for admin users and as the unique identifier for lookups
- `phone` field is used for future reference and in case the app owner needs to contact the customer. This is an optional field

#### `properties`
Represents the real estate asset being transacted.

- `listingAgentId` references the agent who brought the property in
- `status` transitions from `available` to `under_agreement` when a transaction is created, and to `sold` when the transaction completes
- `type` is enforced as an enum to prevent arbitrary string values
- `title` is the human-readable name of the property shown across listings and transaction views
- `address` is the physical location of the property, displayed on property and transaction detail pages
- `price` is the listed asking price of the property at the time of entry

#### `transactions`
The core document of the system. Tracks the full lifecycle of a deal.

- `listingAgentId` and `sellingAgentId` can reference the same user — this is Scenario 1
- `totalServiceFee` is entered manually by the admin rather than computing it from a `serviceFeeRate`. The spec defines a fixed commission split rule but does not mention a configurable rate per transaction. Storing the fee directly keeps the model true to the spec and avoids introducing assumptions
- `stage` progresses forward only through `agreement → earnest_money → title_deed → completed`
- `stageUpdatedAt` is updated on every transition for basic time tracking
- Transactions are never deleted — financial records must be immutable. There is no `DELETE /transactions` endpoint
- `listingAgentId` and `sellingAgentId` are indexed on the MongoDB collection to support efficient agent-scoped queries (`GET /transactions/agent/:id`)
- `salePrice` is the final agreed sale price of the property — may differ from the property's listed `price`
- `totalServiceFee` is listed again here as a bare field because it drives the commission split calculation and is stored on the transaction rather than derived from a rate

#### `commission_breakdowns`
Stores the financial payout for each completed transaction.

- `transactionId` references the transaction this breakdown belongs to; one breakdown per transaction
- `listingAgentId` and `sellingAgentId` are denormalized copies of the agent references from the transaction — stored directly here so commission queries (`GET /commissions/agent/:id`) can be answered with an indexed scan on this collection without joining transactions
- `agencyAmount` is always 50% of `totalServiceFee`
- `listingAgentAmount` is 50% of `totalServiceFee` in Scenario 1 (same agent), 25% in Scenario 2
- `sellingAgentAmount` is 0 in Scenario 1, 25% of `totalServiceFee` in Scenario 2
- `isSameAgent` — see flag explanation below
- `calculatedAt` is the timestamp when the breakdown was written, which corresponds to when the transaction transitioned to `completed`

**Why a separate collection instead of embedding:**
Commission breakdowns are kept in a separate collection rather than embedded inside the transaction document for two reasons:

1. **Queryability** — with a separate collection, indexes can be placed on `listingAgentId` and `sellingAgentId` (referenced via the transaction). This makes aggregate queries like "total earnings for agent X" efficient without scanning all transaction documents
2. **Separation of concerns** — financial breakdown is a distinct record from the transaction lifecycle. Keeping it separate makes it independently auditable

The breakdown is written automatically when a transaction transitions to `completed`. There is no public `POST /commissions` endpoint — it is triggered internally by `transactions.service`.

**`isSameAgent` flag:**
This boolean distinguishes Scenario 1 (same agent) from Scenario 2 (different agents). It serves three purposes:
- Acts as an audit trail — you can always tell which rule set was applied
- Prevents double-counting when aggregating an agent's total earnings across transactions
- Makes future recalculation straightforward if commission rules change

---

## Commission Rules

- Agency always receives **50%** of `totalServiceFee`
- **Scenario 1** — `listingAgentId === sellingAgentId`: that agent receives the full agent portion (50% of total). `sellingAgentAmount` is written as `0`. `isSameAgent: true`
- **Scenario 2** — `listingAgentId !== sellingAgentId`: each agent receives 25% of total. `isSameAgent: false`

```
totalServiceFee = 10,000

Scenario 1:
  agencyAmount        = 5,000  (50%)
  listingAgentAmount  = 5,000  (50%)
  sellingAgentAmount  = 0
  isSameAgent         = true

Scenario 2:
  agencyAmount        = 5,000  (50%)
  listingAgentAmount  = 2,500  (25%)
  sellingAgentAmount  = 2,500  (25%)
  isSameAgent         = false
```

---

## Stage Transition Rules

```
agreement → earnest_money → title_deed → completed
```

- Transitions are **forward only** — backwards transitions are rejected with `400 BadRequestException`
- Transitions are **sequential** — skipping stages is rejected with `400 BadRequestException`
- The initial stage is always set to `agreement` on transaction creation — the admin never picks it
- On transition to `completed`, commission breakdown is automatically calculated and written

**Validation logic in `transactions.service`:**

```typescript
const stageOrder = ['agreement', 'earnest_money', 'title_deed', 'completed'];
const currentIndex = stageOrder.indexOf(currentStage);
const nextIndex = stageOrder.indexOf(requestedStage);

if (nextIndex !== currentIndex + 1) {
  throw new BadRequestException('Invalid stage transition');
}
```

---

## API Design

### Module Structure

Each domain is a self-contained NestJS module:

- `users` — CRUD for agent management
- `auth` — JWT login only
- `properties` — CRUD for property management
- `transactions` — lifecycle management, stage transitions, and agent-scoped queries
- `commissions` — read-only controller (`GET /commissions/transaction/:id`, `GET /commissions/agent/:id`); commission creation is triggered internally by `transactions.service` only — there is no public write endpoint

### Key Design Decisions

- `commissions` has no public write endpoint — breakdowns are always triggered by a stage transition, never created arbitrarily. Read endpoints (`GET /commissions/transaction/:id`, `GET /commissions/agent/:id`) expose the data for the frontend
- `DELETE /transactions` does not exist — financial records are immutable
- `PATCH /transactions/:id/stage` only accepts the next valid stage — the service enforces transition order
- `GET /transactions/:id` returns the transaction with populated agent names and property title, not raw ObjectIds, so the frontend never needs additional requests to resolve references
- `GET /transactions/agent/:agentId` returns all transactions where the given agent is listing or selling agent, with `propertyId` populated. Accepts an optional `?stage` filter. Route is placed before `GET /:id` in the controller to prevent NestJS from matching the static segment `agent` as a dynamic `:id` param

### OpenAPI / Swagger

Swagger UI is available at `/api` in development. All controllers are decorated with `@ApiTags`, `@ApiOperation`, and `@ApiBearerAuth`. All DTOs are decorated with `@ApiProperty`. This provides a fully interactive API reference for frontend development and testing.

---

## Security

| Concern | Solution |
|---|---|
| Authentication | JWT via `@nestjs/jwt`, `JwtAuthGuard` applied globally — all routes protected except `POST /auth/login` |
| Password storage | bcrypt with 10 salt rounds — plain text passwords never stored |
| NoSQL injection | `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })` — strips unexpected fields and rejects payloads with unknown properties before they reach the service. `express-mongo-sanitize` was evaluated but removed due to incompatibility with NestJS 11's read-only `req.query` getter — `ValidationPipe` covers the same attack surface |
| HTTP headers | `helmet()` — sets secure response headers, prevents clickjacking and MIME sniffing |
| CORS | `enableCors({ origin: process.env.FRONTEND_URL })` — restricts API access to the frontend origin only, never `*` |
| XSS | Vue auto-escapes all `{{ }}` template bindings — `v-html` is never used |
| Secrets | All secrets stored in `.env`, gitignored — `.env.example` documents required variables |
| JWT token storage | Token stored in a `sameSite: strict` cookie via Nuxt's `useCookie`. Persists across page refreshes without exposing the token to JavaScript (`useCookie` does not set `httpOnly` by default — production hardening would add that flag) |
| Data immutability | No `DELETE /transactions` endpoint — financial records cannot be removed |
| Soft delete | `isActive: false` on users instead of hard delete — preserves referential integrity in historical records |

---

## Frontend Architecture

### Nuxt 4 Folder Structure

Nuxt uses convention over configuration — folders have meaning just by existing. The minimal template is used as the base with the following structure added manually:

```
frontend/
├── app.vue                    ← root component
├── nuxt.config.ts
├── pages/                     ← file-based routing
│   ├── index.vue              → /
│   ├── login.vue              → /login
│   ├── agents/
│   │   ├── index.vue          → /agents
│   │   ├── create.vue         → /agents/create
│   │   └── [id].vue           → /agents/:id
│   ├── properties/
│   │   ├── index.vue          → /properties
│   │   └── create.vue         → /properties/create
│   └── transactions/
│       ├── index.vue          → /transactions
│       ├── create.vue         → /transactions/create
│       └── [id].vue           → /transactions/:id
├── stores/
│   └── auth.ts                ← JWT token, login/logout actions
└── middleware/
    └── auth.global.ts         ← redirects to /login if no token
```

### Pages

| Page | Purpose |
|---|---|
| `/login` | Admin authentication |
| `/` | Dashboard overview |
| `/agents` | List all agents |
| `/agents/create` | Create agent form |
| `/agents/:id` | Agent detail: profile header, 2×2 summary cards (total transactions, sale volume, commission earned, role split), filterable and paginated transaction list |
| `/properties` | List all properties |
| `/properties/create` | Create property form |
| `/transactions` | List all transactions with stage badges |
| `/transactions/create` | Create transaction form |
| `/transactions/:id` | Transaction detail, stage control, commission breakdown |

`/transactions/:id` is the most important page — it displays the stage progress bar, the advance stage button, and the commission breakdown once the transaction is completed.

### Pinia Store

A single `auth` store holds the JWT token and login/logout actions. No stores exist for agents, properties, or transactions — pages fetch their own data directly with `useAsyncData` / `useFetch`. Since there is no shared state between pages, global stores would add complexity without benefit.

The token is stored via Nuxt's `useCookie` inside the Pinia store, giving it persistence across page refreshes while keeping the access pattern consistent with the rest of the app.

### JWT Handling

The JWT token is stored in the `auth` Pinia store. Each page reads the token from the store and passes it manually as an `Authorization: Bearer <token>` header on every `$fetch` / `useFetch` call.

### Data Fetching Strategy

- **Page load data** — `useAsyncData` with `$fetch` inside pages, with the `Authorization` header passed inline. This keeps data fetching co-located with the page that needs it and avoids the overhead of shared stores
- **User triggered actions** (create, update, stage transition) — `$fetch` called directly inside component handlers

### Route Protection

All routes except `/login` are protected by `middleware/auth.ts` applied globally in `nuxt.config.ts`. If no JWT token is present in the `auth` store, the user is redirected to `/login`.

---

## Implementation Strategy

Backend is completed and fully verified before frontend development begins. Each backend phase is tested manually with Postman after implementation. The full test suite must pass before frontend work starts. This ensures the frontend is built against a stable, known API with consistent response shapes.

---

## Future Extensions

- **Agent login** — `role` field and `RolesGuard` are already in place. Adding agent-facing views requires only a scoped query filter in services and a separate Nuxt layout — no schema changes needed
- **Commission recalculation** — `isSameAgent` flag makes it straightforward to identify which records used which rule set if commission rules change in the future
- **Configurable service fee rate** — if different deals require different commission rates, a `serviceFeeRate` field can be added to `transactions` and `totalServiceFee` computed automatically, without breaking existing records
- **Persistent auth** — storing the JWT in an `httpOnly` cookie would survive page refreshes without exposing the token to JavaScript
