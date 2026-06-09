# DebtLens — Technical Specification

**Dead Code Trend Tracker for JS/TS Repositories**

**Version:** 1.0 · **Date:** June 2026 · **Status:** Ready for Development

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Scope & MVP Definition](#2-scope--mvp-definition)
3. [Technology Stack](#3-technology-stack)
4. [System Architecture](#4-system-architecture)
5. [Database Schema](#5-database-schema)
6. [API Specification](#6-api-specification)
7. [Frontend Specification](#7-frontend-specification)
8. [Analysis Engine](#8-analysis-engine)
9. [Authentication & Authorisation](#9-authentication--authorisation)
10. [Environment Variables](#10-environment-variables)
11. [Project File Structure](#11-project-file-structure)
12. [Monetisation](#12-monetisation)
13. [Deployment](#13-deployment)
14. [Development Phases & Task Breakdown](#14-development-phases--task-breakdown)
15. [Testing Strategy](#15-testing-strategy)
16. [Security Considerations](#16-security-considerations)
17. [Open Questions & Decisions](#17-open-questions--decisions)
18. [Glossary](#18-glossary)

---

## 1. Product Overview

### 1.1 Problem Statement

Modern JavaScript and TypeScript codebases accumulate dead code — unused files, exports, variables, and dependencies — as products evolve. Tools like Knip can detect dead code in a single scan, but no hosted product tracks how that dead code grows or shrinks over time.

Engineering teams lack a simple way to show management that technical debt is increasing, which modules are responsible, and whether cleanup sprints are working. Developers copy Knip output into spreadsheets manually. There is no dashboard, no trend line, no alerting.

### 1.2 Solution — DebtLens

DebtLens is a GitHub App + web dashboard that runs Knip on every push, stores the results, and presents a historical trend of dead code per repository. It answers the question: *"Is our codebase getting cleaner or dirtier — and in which module?"*

> **Core loop:** Install GitHub App → DebtLens runs Knip on every commit → results stored in database → dashboard shows trend charts → team gets Slack/email alert when debt spikes

### 1.3 Target Users

| Persona | Role | Primary pain | Willingness to pay |
|---|---|---|---|
| Engineering Lead | Decides tooling | Prove ROI of refactor sprints to management | High — budget owner |
| Senior Developer | Daily user | Knows debt is growing, no data to prove it | Medium — champions tool |
| CTO / VP Eng | Occasional viewer | Wants one-number codebase health KPI | High — signs contracts |
| DevOps / Platform | Installs tooling | Wants CI signal without false positives | Low — evaluates only |

### 1.4 Unique Differentiators

- **Knip-as-a-Service** — no configuration needed; zero CI yaml to write
- **Historical trend** per file, module, and repository — not a point-in-time scan
- **Manager-ready PDF report** exportable in one click
- **PR-level diff** — shows exactly how much debt a PR adds or removes
- **Freemium model:** 1 repo free forever, unlimited repos on paid plan

---

## 2. Scope & MVP Definition

### 2.1 MVP Features (Phase 1 — 6 weeks)

> **Goal:** One paying customer or 50 active free repos within 6 weeks of launch

#### 2.1.1 GitHub App Installation

- OAuth GitHub login (GitHub App + OAuth App)
- Install GitHub App on 1 or more repos
- Automatic webhook setup — no manual configuration
- Repo list on dashboard with install status

#### 2.1.2 Analysis Engine

- Run Knip v5 on every push to `main`/`master`
- Detect: unused files, unused exports, unused dependencies (`package.json`)
- Store raw counts per category per commit SHA
- Handle repos up to 500 MB; timeout after 3 minutes
- Queue-based processing — no blocking the webhook response

#### 2.1.3 Dashboard

- Line chart: total dead code count over last 90 days
- Breakdown chart: unused files vs unused exports vs unused deps
- Top 10 files with most unused exports — sortable
- Last 10 commits table with delta (+/-)
- Status badge embeddable in README (SVG endpoint)

#### 2.1.4 Alerts

- Email alert when dead code count increases >5% in a single push
- Configurable threshold per repo in settings

#### 2.1.5 Freemium Gating

- **Free tier:** 1 repo, 90-day history, email alerts, public badge
- **Paid tier ($15/repo/month):** unlimited repos, full history, Slack alerts, PDF export
- Stripe Checkout integration for upgrade flow

### 2.2 Out of Scope for MVP

| Feature | Target phase |
|---|---|
| Non-JS/TS language support (Python, Go, etc.) | Phase 2 |
| VS Code extension | Phase 2 |
| GitLab / Bitbucket support | Phase 2 |
| Slack alert integration | Phase 2 |
| Self-hosted / on-premise deployment | Phase 3 |
| Auto-fix PRs (auto-delete dead code) | Phase 3 |
| AI-powered refactoring suggestions | Phase 3 |

### 2.3 Success Metrics for MVP

| Metric | Target at 6 weeks | How measured |
|---|---|---|
| Active free repos installed | 50+ | Database count |
| Paying customers | 1+ | Stripe dashboard |
| GitHub App installs | 100+ | GitHub App analytics |
| Analysis success rate | >95% | Error logs in Supabase |
| Average analysis time | <60 seconds | `job_runs` table timing |
| Dashboard DAU/MAU ratio | >20% | PostHog analytics |

---

## 3. Technology Stack

### 3.1 Stack Overview

| Layer | Technology | Rationale |
|---|---|---|
| Frontend | Next.js 14 (App Router) | SSR, API routes, great DX, Vercel-native |
| Styling | Tailwind CSS + shadcn/ui | Fast UI composition, no custom CSS debt |
| Charts | Recharts | React-native charts, no canvas complexity |
| Backend (API) | Next.js API Routes | Co-located with frontend, no extra service |
| Background jobs | Supabase Edge Functions + pg_cron | Serverless queue, no extra infra |
| Database | Supabase (PostgreSQL) | Auth, realtime, storage, RLS all in one |
| Auth | Supabase Auth + GitHub OAuth | Built-in, integrates with GitHub App |
| File storage | Supabase Storage | Store raw Knip JSON output per run |
| Payments | Stripe Checkout + Webhooks | Industry standard, easy Vercel integration |
| Hosting | Vercel | Zero-config Next.js, edge functions, preview URLs |
| Error tracking | Sentry | Free tier, Next.js plugin |
| Analytics | PostHog (cloud) | Product analytics, generous free tier |
| Analysis runtime | Node.js 20 (Vercel Serverless) | Knip runs natively in Node |
| Email | Resend | Modern email API, great DX, free tier 3k/month |

### 3.2 Why NOT a Separate Backend Service

Next.js API routes and Supabase Edge Functions handle all backend logic in MVP. A separate Express/NestJS service would add deployment complexity, latency, and cost. The analysis jobs are the only CPU-heavy operation — they run in Vercel Serverless functions with a 60-second timeout, sufficient for repos under 500 MB.

> **⚠️ Scale note:** At 1,000+ repos with frequent pushes, the job queue will need to move to a dedicated worker (e.g., Railway + BullMQ). This is a Phase 2 concern. For MVP, Supabase Edge Functions + pg_cron is sufficient.

---

## 4. System Architecture

### 4.1 High-Level Architecture

DebtLens has four main subsystems: (1) the GitHub App webhook receiver, (2) the analysis job queue and runner, (3) the Supabase data layer, and (4) the Next.js web dashboard.

> **Flow:** GitHub push event → Webhook API Route → insert job into `job_runs` table → Supabase trigger wakes Edge Function → Edge Function downloads repo + runs Knip → stores results → Next.js dashboard reads from Supabase → user sees chart

### 4.2 Component Breakdown

#### 4.2.1 GitHub App

- Listens to: `push`, `installation`, `pull_request` events
- Permissions required: Contents (read), Pull Requests (read/write), Metadata (read)
- Webhook secret validated on every request using HMAC-SHA256
- App registered at: `github.com/apps/debtlens`
- Installation flow: GitHub redirects to `/api/github/callback` after install

#### 4.2.2 Webhook Handler — `POST /api/github/webhook`

- Validates HMAC signature before any processing
- On push to default branch: inserts `job_runs` row with `status='pending'`
- On PR open/sync: inserts `job_runs` row with `pr_number` set
- Responds `200` immediately — never blocks on analysis
- On installation: creates/updates `repositories` table row

#### 4.2.3 Analysis Job Runner

Implemented as a Supabase Edge Function triggered by `pg_cron` every 30 seconds. The function:

1. Selects the oldest pending job from `job_runs WHERE status='pending'`
2. Claims the job by setting `status='running'` and `locked_at=NOW()`
3. Downloads the repository archive from GitHub API (tarball, not full clone)
4. Extracts to `/tmp`, runs: `npx knip --reporter json`
5. Parses the JSON output and stores results in `analysis_results` table
6. Updates `job_runs` with `status='completed'` and `duration`
7. Triggers alert check function if thresholds exceeded

> **⚠️ Timeout handling:** If a job has `status='running'` for >5 minutes, `pg_cron` marks it as `'failed'` and retries once. After 2 failures, `status='dead'` and user is notified by email.

#### 4.2.4 Next.js Web Dashboard

- App Router with server components for data fetching
- Client components only for interactive charts (Recharts)
- Supabase SSR client (`@supabase/ssr`) for auth in server components
- All data queries use Row Level Security — users only see their own repos
- Static pages: landing, pricing, docs
- Authenticated pages: `/dashboard`, `/repo/[id]`, `/settings`, `/billing`

---

## 5. Database Schema

### 5.1 Entity Relationship Summary

Six core tables: `user_profiles`, `organizations`, `repositories`, `job_runs`, `analysis_results`, and `alert_configs`. All user-facing data is protected by Row Level Security policies.

### 5.2 Table Definitions

#### `user_profiles` (extends Supabase Auth `auth.users`)

| Column | Type | Notes |
|---|---|---|
| `id` | `UUID PK` | References `auth.users(id)` |
| `github_username` | `TEXT` | Stored on OAuth login |
| `github_id` | `BIGINT UNIQUE` | GitHub user ID |
| `plan` | `TEXT` | `free` \| `pro` — updated by Stripe webhook |
| `stripe_customer_id` | `TEXT NULLABLE` | Set on first checkout |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` |

#### `organizations`

| Column | Type | Notes |
|---|---|---|
| `id` | `UUID PK` | `gen_random_uuid()` |
| `github_org_id` | `BIGINT UNIQUE` | GitHub organization ID |
| `name` | `TEXT` | Organization login |
| `installation_id` | `BIGINT UNIQUE` | GitHub App installation ID |
| `owner_user_id` | `UUID FK` | References `user_profiles(id)` |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` |

#### `repositories`

| Column | Type | Notes |
|---|---|---|
| `id` | `UUID PK` | `gen_random_uuid()` |
| `github_repo_id` | `BIGINT UNIQUE` | GitHub repository ID |
| `owner_user_id` | `UUID FK` | References `user_profiles(id)` |
| `org_id` | `UUID FK NULLABLE` | References `organizations(id)` |
| `full_name` | `TEXT` | e.g. `'acme/frontend'` |
| `default_branch` | `TEXT` | `main` or `master` |
| `is_active` | `BOOLEAN` | `DEFAULT true` — false if uninstalled |
| `knip_config_override` | `JSONB NULLABLE` | Custom Knip config stored as JSON |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` |

#### `job_runs`

| Column | Type | Notes |
|---|---|---|
| `id` | `UUID PK` | `gen_random_uuid()` |
| `repo_id` | `UUID FK` | References `repositories(id)` |
| `commit_sha` | `TEXT` | Full 40-char SHA |
| `commit_message` | `TEXT` | First 120 chars |
| `branch` | `TEXT` | Branch name |
| `pr_number` | `INT NULLABLE` | Set for PR analysis |
| `status` | `TEXT` | `pending \| running \| completed \| failed \| dead` |
| `triggered_at` | `TIMESTAMPTZ` | When job was inserted |
| `started_at` | `TIMESTAMPTZ NULLABLE` | When runner claimed the job |
| `completed_at` | `TIMESTAMPTZ NULLABLE` | When runner finished |
| `duration_ms` | `INT NULLABLE` | Wall time in milliseconds |
| `error_message` | `TEXT NULLABLE` | Set on failure |
| `retry_count` | `INT` | `DEFAULT 0` |

#### `analysis_results`

| Column | Type | Notes |
|---|---|---|
| `id` | `UUID PK` | `gen_random_uuid()` |
| `job_run_id` | `UUID FK UNIQUE` | References `job_runs(id)` |
| `repo_id` | `UUID FK` | Denormalized for fast queries |
| `commit_sha` | `TEXT` | Denormalized for fast queries |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` |
| `unused_files_count` | `INT` | Total unused files |
| `unused_exports_count` | `INT` | Total unused exports |
| `unused_deps_count` | `INT` | Total unused dependencies |
| `total_dead_code` | `INT COMPUTED` | Sum of above three |
| `unused_files_list` | `JSONB` | Array of `{file, count}` objects |
| `unused_exports_list` | `JSONB` | Array of `{file, symbol, type}` objects |
| `unused_deps_list` | `JSONB` | Array of package name strings |
| `knip_version` | `TEXT` | e.g. `'5.30.0'` |
| `raw_output_url` | `TEXT NULLABLE` | Supabase Storage URL for full JSON |

#### `alert_configs`

| Column | Type | Notes |
|---|---|---|
| `id` | `UUID PK` | `gen_random_uuid()` |
| `repo_id` | `UUID FK UNIQUE` | One config per repo |
| `threshold_pct` | `INT` | `DEFAULT 5` — alert if debt grows >5% |
| `email_enabled` | `BOOLEAN` | `DEFAULT true` |
| `slack_webhook_url` | `TEXT NULLABLE` | Pro plan only |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` |

### 5.3 Row Level Security Policies

All tables have RLS enabled. Core policy pattern:

```sql
CREATE POLICY "Users see only their own repos"
ON repositories FOR ALL
USING (owner_user_id = auth.uid());
```

`analysis_results` and `job_runs` inherit visibility via JOIN to `repositories.owner_user_id = auth.uid()`. Service role key (used in Edge Functions only) bypasses RLS.

### 5.4 Key Indexes

```sql
CREATE INDEX idx_job_runs_status
  ON job_runs(status) WHERE status = 'pending';

CREATE INDEX idx_analysis_results_repo_created
  ON analysis_results(repo_id, created_at DESC);

CREATE INDEX idx_analysis_results_commit
  ON analysis_results(commit_sha);
```

---

## 6. API Specification

### 6.1 API Design Principles

- All endpoints under `/api/` — Next.js API Routes
- Authentication via Supabase JWT in `Authorization: Bearer` header
- GitHub webhook endpoints use HMAC-SHA256 signature verification
- All responses: `application/json` with consistent error shape
- Error shape: `{ error: string, code: string, status: number }`
- Rate limiting: 60 requests/minute per user via Vercel middleware

### 6.2 GitHub Integration Endpoints

#### `POST /api/github/webhook`

| Property | Value |
|---|---|
| Auth | GitHub webhook secret (`X-Hub-Signature-256` header) |
| Events handled | `push`, `installation`, `installation_repositories`, `pull_request` |
| Response | `200 OK` always (never expose internal errors to GitHub) |
| Side effects | Inserts `job_runs` row on push; updates `repos` on installation events |

#### `GET /api/github/callback`

| Property | Value |
|---|---|
| Auth | None — public OAuth callback |
| Query params | `code` (GitHub OAuth code), `installation_id` (optional), `state` |
| Response | Redirect to `/dashboard` on success, `/error` on failure |
| Side effects | Creates Supabase session; stores GitHub access token |

### 6.3 Repository Endpoints

#### `GET /api/repos`

| Property | Value |
|---|---|
| Auth | Required — Supabase JWT |
| Response | `{ repos: Repository[] }` — only repos owned by authenticated user |
| Notes | Returns `is_active`, latest analysis summary, plan check |

#### `GET /api/repos/[id]/trend`

| Property | Value |
|---|---|
| Auth | Required |
| Query params | `days` (default `90`), `branch` (default: `default_branch`) |
| Response | `{ trend: TrendPoint[] }` where `TrendPoint = { date, sha, total, files, exports, deps, delta }` |
| Notes | Free plan: max 90 days. Pro plan: full history. Cached 5 min in Vercel edge cache. |

#### `GET /api/repos/[id]/breakdown`

| Property | Value |
|---|---|
| Auth | Required |
| Query params | `sha` (specific commit, default latest) |
| Response | `{ files: FileBreakdown[], exports: ExportBreakdown[], deps: string[] }` |
| Notes | Used for the top-10 files table in dashboard |

#### `POST /api/repos/[id]/scan`

| Property | Value |
|---|---|
| Auth | Required |
| Body | `{ branch?: string }` — optional branch override |
| Response | `{ job_run_id: string }` — caller polls job status |
| Rate limit | 1 manual scan per repo per 10 minutes |
| Notes | Triggers immediate analysis outside of push webhook flow |

### 6.4 Billing Endpoints

#### `POST /api/billing/checkout`

| Property | Value |
|---|---|
| Auth | Required |
| Response | `{ url: string }` — Stripe Checkout URL for redirect |
| Notes | Creates Stripe customer if not exists; uses `price_id` from env |

#### `POST /api/billing/portal`

| Property | Value |
|---|---|
| Auth | Required |
| Response | `{ url: string }` — Stripe Customer Portal URL |
| Notes | Allows user to cancel, change plan, update payment method |

#### `POST /api/billing/webhook`

| Property | Value |
|---|---|
| Auth | Stripe webhook signature (`Stripe-Signature` header) |
| Events handled | `checkout.session.completed`, `customer.subscription.deleted`, `customer.subscription.updated` |
| Side effects | Updates `user_profiles.plan` on subscription changes |

### 6.5 Misc Endpoints

#### `GET /api/badge/[repoId]`

| Property | Value |
|---|---|
| Auth | None — public |
| Response | SVG image with dead code count and trend arrow |
| Cache | `Cache-Control: max-age=3600` |
| Format | `DebtLens \| 142 dead ↑` (red/yellow/green based on trend) |

---

## 7. Frontend Specification

### 7.1 Page Structure

| Route | Auth required | Description |
|---|---|---|
| `/` | No | Landing page: hero, features, pricing table, CTA |
| `/login` | No | GitHub OAuth button only — no email/password |
| `/dashboard` | Yes | Repo list with summary cards and health indicators |
| `/repo/[id]` | Yes | Full analysis dashboard for a single repo |
| `/repo/[id]/settings` | Yes | Alert thresholds, Knip config override, danger zone |
| `/billing` | Yes | Current plan, usage, upgrade/cancel CTA |
| `/docs` | No | Static MDX documentation |
| `/api/badge/[id]` | No | SVG badge endpoint (API, not UI page) |

### 7.2 Dashboard — `/repo/[id]`

This is the core screen. Layout: sidebar (repo list) + main content area.

**Main content area components:**

- **`RepoHeader`** — name, branch selector, last scan timestamp, manual "Scan Now" button
- **`HealthScoreCard`** — single number (total dead code), trend arrow, color coding (green <50, yellow 50–200, red >200)
- **`TrendChart`** — Recharts `LineChart`, 90-day trend, three lines (files, exports, deps), hoverable data points
- **`CommitTable`** — last 10 commits with delta column (e.g. `+12` or `-34` highlighted in red/green)
- **`BreakdownTabs`** — two tabs: Top Files (table) and Unused Deps (list)
- **`AlertBanner`** — shown inline when latest analysis shows >5% spike
- **`BadgeEmbed`** — copy-paste Markdown for README badge

### 7.3 State Management

No global state library needed for MVP. React Server Components fetch data server-side. Client components use SWR for polling job status (`useSWR` with `refreshInterval: 5000` while job is `pending`/`running`).

### 7.4 Key Component Interfaces

```typescript
interface TrendChartProps {
  data: TrendPoint[];          // from GET /api/repos/[id]/trend
  isPro: boolean;              // controls history depth UI hint
  onPointClick: (sha: string) => void;
}

interface CommitTableProps {
  commits: CommitSummary[];    // last 10 entries from trend data
  repoId: string;
}

interface TrendPoint {
  date: string;                // ISO 8601
  sha: string;                 // short SHA (7 chars)
  total: number;
  files: number;
  exports: number;
  deps: number;
  delta: number | null;        // null for first data point
}
```

---

## 8. Analysis Engine

### 8.1 Knip Integration

DebtLens uses Knip v5 as the underlying analysis engine. Knip is invoked via `child_process.spawn` inside a Vercel Serverless Function (or Supabase Edge Function for the queued variant).

**Invocation command:**

```bash
npx knip@5 --reporter json --no-exit-code 2>/dev/null
```

The `--no-exit-code` flag prevents non-zero exit codes from failing the function when dead code is found. `stderr` is suppressed; only structured JSON stdout is consumed.

### 8.2 Repository Download Strategy

Full `git clone` is avoided to keep analysis time under 60 seconds. Instead:

1. GitHub API: `GET /repos/{owner}/{repo}/tarball/{sha}`
2. Stream to `/tmp/{jobRunId}.tar.gz` using Node.js streams
3. Extract with `tar.extract({ cwd: '/tmp/{jobRunId}/' })`
4. Run Knip in extracted directory
5. Delete `/tmp/{jobRunId}/` after analysis

> **⚠️ Vercel `/tmp` limit:** Vercel Serverless Functions have 512 MB `/tmp` storage. Repos over 400 MB compressed will fail. This covers ~99% of real-world JS/TS repos. Add repo size check via GitHub API before download and reject with a helpful error message.

### 8.3 Knip Output Parsing

Knip JSON output schema (v5):

```typescript
interface KnipOutput {
  files: string[];
  exports: { name: string; file: string; type: string }[];
  types:   { name: string; file: string }[];
  dependencies: { name: string; package: string }[];
  devDependencies: { name: string; package: string }[];
}
```

DebtLens maps this to `analysis_results` as follows:

- `unused_files_count` = `output.files.length`
- `unused_exports_count` = `output.exports.length + output.types.length`
- `unused_deps_count` = `output.dependencies.length + output.devDependencies.length`
- `unused_files_list` = `output.files` mapped to `{ file, exportCount }` objects
- `unused_exports_list` = `output.exports + output.types`
- `unused_deps_list` = `[...output.dependencies, ...output.devDependencies].map(d => d.package)`

### 8.4 Default Knip Configuration

DebtLens injects a minimal `knip.config.ts` into the repo root before running if one does not already exist:

```typescript
export default {
  ignore: ['**/*.test.*', '**/*.spec.*', '**/node_modules/**'],
  ignoreDependencies: ['typescript', 'eslint', 'prettier'],
  ignoreExportsUsedInFile: true
};
```

Users can override this via the repo settings page. The override is stored as `knip_config_override` JSONB in the `repositories` table and merged at runtime.

---

## 9. Authentication & Authorisation

### 9.1 Authentication Flow

1. User clicks "Sign in with GitHub" on `/login`
2. Next.js redirects to GitHub OAuth: `github.com/login/oauth/authorize?scope=read:user,read:org`
3. GitHub redirects back to `/api/github/callback?code=xxx`
4. Server exchanges code for GitHub access token
5. Supabase `signInWithOAuth` records the session
6. User is redirected to `/dashboard`

GitHub App installation is a separate flow initiated from the dashboard. It does NOT require re-authentication — the existing Supabase session is used to associate the `installation_id` with the logged-in user.

### 9.2 Token Storage

- GitHub access token stored in Supabase Auth user metadata (encrypted at rest)
- GitHub App private key stored in Vercel environment variable (never in database)
- Stripe secret key stored in Vercel environment variable
- Supabase service role key stored in Vercel environment variable
- No sensitive tokens stored in `localStorage` or cookies (Supabase handles session via `httpOnly` cookie)

### 9.3 Authorisation Matrix

| Action | Free user | Pro user | Service role |
|---|---|---|---|
| View own repo trend (90 days) | ✅ | ✅ | ✅ |
| View own repo trend (>90 days) | ❌ | ✅ | ✅ |
| Trigger manual scan | ✅ (1/10 min) | ✅ (1/min) | ✅ |
| Configure Slack alert | ❌ | ✅ | ✅ |
| Export PDF report | ❌ | ✅ | ✅ |
| Add >1 repo | ❌ | ✅ | ✅ |
| View another user's data | ❌ | ❌ | ✅ |
| Modify `job_runs` directly | ❌ | ❌ | ✅ |

---

## 10. Environment Variables

### 10.1 Required Variables

| Variable | Where set | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel + local `.env` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel + local `.env` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel only (server-side) | Admin key — never expose to client |
| `GITHUB_APP_ID` | Vercel only | GitHub App numeric ID |
| `GITHUB_APP_PRIVATE_KEY` | Vercel only | PEM private key (base64 encoded) |
| `GITHUB_APP_WEBHOOK_SECRET` | Vercel only | HMAC secret for webhook verification |
| `GITHUB_CLIENT_ID` | Vercel + local `.env` | GitHub OAuth App client ID |
| `GITHUB_CLIENT_SECRET` | Vercel only | GitHub OAuth App client secret |
| `STRIPE_SECRET_KEY` | Vercel only | Stripe secret key (`sk_live_...` or `sk_test_...`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Vercel + local `.env` | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | Vercel only | Stripe webhook signing secret |
| `STRIPE_PRO_PRICE_ID` | Vercel only | Stripe price ID for Pro plan ($15/repo) |
| `RESEND_API_KEY` | Vercel only | Resend email API key |
| `NEXT_PUBLIC_APP_URL` | Vercel + local `.env` | e.g. `https://debtlens.dev` |
| `SENTRY_DSN` | Vercel only | Sentry error tracking DSN |

### 10.2 Local Development Setup

Copy `.env.example` to `.env.local`. For GitHub OAuth callback in development, set `NEXT_PUBLIC_APP_URL=http://localhost:3000` and register a separate GitHub OAuth App with callback URL: `http://localhost:3000/api/github/callback`.

> **📋 Note for agent:** Never commit `.env.local` or any file containing secret keys. Add `.env.local` to `.gitignore` on project init. Use Vercel CLI (`vercel env pull`) to sync environment variables locally.

---

## 11. Project File Structure

```
debtlens/
├── app/                              # Next.js App Router
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── dashboard/page.tsx
│   │   ├── repo/[id]/page.tsx
│   │   ├── repo/[id]/settings/page.tsx
│   │   ├── billing/page.tsx
│   │   └── layout.tsx               # sidebar, auth guard
│   ├── api/
│   │   ├── github/
│   │   │   ├── webhook/route.ts
│   │   │   └── callback/route.ts
│   │   ├── repos/
│   │   │   ├── route.ts             # GET /api/repos
│   │   │   └── [id]/
│   │   │       ├── trend/route.ts
│   │   │       ├── breakdown/route.ts
│   │   │       └── scan/route.ts
│   │   ├── billing/
│   │   │   ├── checkout/route.ts
│   │   │   ├── portal/route.ts
│   │   │   └── webhook/route.ts
│   │   └── badge/[repoId]/route.ts
│   ├── page.tsx                     # Landing page
│   ├── layout.tsx                   # Root layout
│   └── globals.css
├── components/
│   ├── ui/                          # shadcn/ui primitives
│   ├── charts/
│   │   ├── TrendChart.tsx
│   │   └── BreakdownChart.tsx
│   ├── dashboard/
│   │   ├── RepoCard.tsx
│   │   ├── CommitTable.tsx
│   │   ├── HealthScoreCard.tsx
│   │   ├── BreakdownTabs.tsx
│   │   └── BadgeEmbed.tsx
│   └── layout/
│       ├── Sidebar.tsx
│       └── Topbar.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts                # Browser client
│   │   ├── server.ts                # Server component client
│   │   └── middleware.ts            # Auth middleware
│   ├── github/
│   │   ├── app.ts                   # GitHub App Octokit client
│   │   ├── webhook.ts               # Webhook signature verification
│   │   └── download.ts              # Repo tarball download
│   ├── analysis/
│   │   ├── runner.ts                # Knip invocation
│   │   └── parser.ts                # Knip JSON → DB schema
│   ├── stripe/
│   │   ├── client.ts
│   │   └── plans.ts                 # Plan definitions
│   └── alerts/
│       └── checker.ts               # Threshold check + send email
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_rls_policies.sql
│   │   └── 003_indexes.sql
│   └── functions/
│       └── job-runner/              # Supabase Edge Function
│           └── index.ts
├── types/
│   ├── database.ts                  # Generated Supabase types
│   └── index.ts                     # Shared app types
├── .env.example
├── .env.local                       # Never committed
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

---

## 12. Monetisation

### 12.1 Plan Comparison

| Feature | Free | Pro ($15/repo/month) |
|---|---|---|
| Repositories | 1 | Unlimited |
| Analysis history | 90 days | Unlimited |
| Analysis on push | ✅ | ✅ |
| Manual scan | 1 per 10 min | 1 per minute |
| Email alerts | ✅ | ✅ |
| Slack alerts | ❌ | ✅ |
| README badge | ✅ | ✅ |
| PDF report export | ❌ | ✅ |
| Knip config override | ❌ | ✅ |
| PR diff comments | ❌ | ✅ |
| Priority support | ❌ | ✅ |

### 12.2 Pricing Rationale

$15/repo/month is intentionally lower than CodeScene (€18/contributor/month) and SonarQube ($10/developer/month) because DebtLens is repo-scoped rather than developer-scoped — one repo can have many developers. The per-repo model aligns cost with value and is easy to reason about.

**Target ARR at 100 customers** (average 3 paid repos each): $15 × 3 × 100 × 12 = **$54,000/year**. This is sufficient to cover infrastructure costs (Vercel Pro ~$20/month, Supabase Pro ~$25/month) and validate the business.

### 12.3 Stripe Implementation

- Use Stripe Checkout (hosted page) — no PCI scope
- Product: "DebtLens Pro" with `price_id` from environment variable
- Subscription metered by repo count — Phase 2 consideration; MVP uses flat $15/repo
- After successful checkout, Stripe webhook sets `user_profiles.plan = 'pro'`
- On subscription cancellation, plan reverts to `'free'`; extra repos become read-only (no new scans)

---

## 13. Deployment

### 13.1 Environments

| Environment | URL | Branch | Purpose |
|---|---|---|---|
| Local | `localhost:3000` | any | Development |
| Preview | `*.vercel.app` | any PR branch | Code review, QA |
| Staging | `staging.debtlens.dev` | `staging` | Pre-release testing |
| Production | `app.debtlens.dev` | `main` | Live users |

### 13.2 Vercel Configuration

```json
// vercel.json
{
  "functions": {
    "app/api/repos/[id]/scan/route.ts": { "maxDuration": 60 },
    "app/api/github/webhook/route.ts": { "maxDuration": 10 }
  }
}
```

All other API routes use the default 10-second limit. The scan route requires 60 seconds to handle analysis of large repos.

### 13.3 Supabase Setup

1. Create new Supabase project in dashboard
2. Run migrations: `supabase db push` (from `/supabase/migrations/`)
3. Deploy Edge Function: `supabase functions deploy job-runner`
4. Set pg_cron schedule: `SELECT cron.schedule('job-runner', '*/30 * * * * *', 'SELECT net.http_post(...)')`
5. Enable RLS on all tables via `002_rls_policies.sql`
6. Set storage bucket `'knip-raw-output'` with private access

### 13.4 GitHub App Setup

1. Create GitHub App at `github.com/settings/apps/new`
2. Name: `DebtLens`, Homepage URL: `https://debtlens.dev`
3. Webhook URL: `https://app.debtlens.dev/api/github/webhook`
4. Permissions: Repository contents (read), Pull requests (read/write), Metadata (read)
5. Subscribe to events: `push`, `pull_request`, `installation`, `installation_repositories`
6. Generate private key → download PEM → base64 encode → set as `GITHUB_APP_PRIVATE_KEY`
7. Note App ID → set as `GITHUB_APP_ID`

### 13.5 CI/CD Pipeline

- GitHub Actions on every PR: lint (ESLint), type check (`tsc --noEmit`), unit tests (Vitest)
- Vercel preview deployment on every PR — automatic
- Merge to `main` → Vercel production deployment — automatic
- Database migrations run manually before deployment: `supabase db push --linked`
- No automated E2E tests in MVP — add Playwright tests in Phase 2

---

## 14. Development Phases & Task Breakdown

### Phase 1 — MVP (6 weeks)

#### Week 1 — Foundation

- [ ] Initialise Next.js 14 project with Tailwind, shadcn/ui, Supabase
- [ ] Create Supabase project and run initial migrations (all 6 tables + RLS)
- [ ] Implement GitHub OAuth login flow (Supabase + GitHub OAuth App)
- [ ] Create basic layout: sidebar, topbar, auth guard
- [ ] Deploy skeleton to Vercel Production
- [ ] Register GitHub App (use `smee.io` for local webhook forwarding)

#### Week 2 — GitHub App & Webhook

- [ ] Implement `POST /api/github/webhook` with HMAC verification
- [ ] Handle push events: insert `job_runs` row
- [ ] Handle installation events: create/update `repositories` rows
- [ ] Implement `GET /api/github/callback` for GitHub App installation
- [ ] Build repo list page at `/dashboard` with install status
- [ ] Test end-to-end: push to test repo → `job_runs` row created

#### Week 3 — Analysis Engine

- [ ] Implement `lib/github/download.ts` — stream tarball from GitHub API
- [ ] Implement `lib/analysis/runner.ts` — invoke Knip, capture JSON output
- [ ] Implement `lib/analysis/parser.ts` — map Knip output to DB schema
- [ ] Implement `POST /api/repos/[id]/scan` — manual scan trigger
- [ ] Deploy Supabase Edge Function `job-runner`
- [ ] Set up `pg_cron` schedule for every 30 seconds
- [ ] Test: push event → job processed → `analysis_results` populated

#### Week 4 — Dashboard UI

- [ ] Implement `GET /api/repos/[id]/trend` endpoint
- [ ] Implement `GET /api/repos/[id]/breakdown` endpoint
- [ ] Build `TrendChart` component with Recharts
- [ ] Build `CommitTable` component
- [ ] Build `HealthScoreCard` component
- [ ] Build `BreakdownTabs` component (top files + deps list)
- [ ] Build `/repo/[id]` page composing all components
- [ ] Implement job status polling with SWR

#### Week 5 — Alerts + Billing

- [ ] Implement `lib/alerts/checker.ts` — threshold check logic
- [ ] Set up Resend for transactional email
- [ ] Implement email alert on >5% spike
- [ ] Implement `GET /api/badge/[repoId]` SVG endpoint
- [ ] Set up Stripe products and prices in dashboard
- [ ] Implement `POST /api/billing/checkout`
- [ ] Implement `POST /api/billing/portal`
- [ ] Implement `POST /api/billing/webhook` (handle subscription events)
- [ ] Implement plan gating (repo count, history depth) via middleware

#### Week 6 — Polish & Launch

- [ ] Build landing page at `/` (hero, features, pricing table)
- [ ] Build `/docs` page with installation guide
- [ ] Implement `/repo/[id]/settings` with alert threshold config
- [ ] Add Sentry error tracking
- [ ] Add PostHog analytics
- [ ] Security review: verify all RLS policies, env var exposure
- [ ] Load test: simulate 50 concurrent `job_runs`
- [ ] Soft launch: post on Indie Hackers, r/webdev, r/typescript

### Phase 2 — Growth (weeks 7–14)

- GitLab support
- VS Code extension showing dead code inline
- PR diff comment: *"⚠️ This PR adds 12 dead exports (+8%)"*
- Slack alert integration (Pro plan)
- PDF report export (Pro plan)
- Team / organisation support (multiple members per repo)
- BullMQ job queue on Railway (replace `pg_cron` for scale)
- E2E tests with Playwright

### Phase 3 — Scale

- Self-hosted / Docker deployment option
- Python, Go, Rust support (via separate analysis adapters)
- AI-powered suggestions: *"Delete these 3 files to reduce debt by 15%"*
- Acquisition readiness: clean financials, documented architecture, test coverage >80%

---

## 15. Testing Strategy

### 15.1 Unit Tests (Vitest)

- `lib/analysis/parser.ts` — test Knip JSON parsing with fixture files
- `lib/alerts/checker.ts` — test threshold logic (5% boundary cases)
- `lib/github/webhook.ts` — test HMAC signature verification
- SVG badge generator — test color coding logic
- **Target:** 80% line coverage on `lib/` directory

### 15.2 Integration Tests

- Webhook handler: mock GitHub event → verify `job_runs` insert in test Supabase
- Analysis pipeline: test repo tarball → verify `analysis_results` row
- Stripe webhook: mock `checkout.session.completed` → verify plan upgrade

### 15.3 Manual QA Checklist (pre-launch)

1. Install GitHub App on personal test repo
2. Push a commit → verify job completes within 60 seconds
3. Dashboard shows trend chart with at least one data point
4. Introduce obviously dead code → push → verify count increases
5. Delete dead code → push → verify count decreases
6. Free user cannot add second repo
7. Upgrade to Pro via Stripe Test Mode → second repo unlocks
8. Cancel subscription → extra repos locked
9. README badge loads and shows correct count
10. Email alert arrives when threshold is exceeded

---

## 16. Security Considerations

### 16.1 Critical Security Items

- **HMAC-SHA256** — verify every GitHub webhook request before processing
- **Stripe webhook signature** — verify every Stripe event before processing
- **Service role key** — never exposed to client; only used in server-side code
- **RLS policies** — tested explicitly; no admin bypass in production client code
- **Code execution isolation** — Knip runs on downloaded repo code; ensure no `eval()` or dynamic `require()` from analysed code can affect the runner process
- **Path traversal** — validate extracted tar paths; check each file path is within `/tmp/{jobRunId}/`
- **Repo size limit** — reject repos >400 MB before download to prevent resource exhaustion
- **GitHub token scope** — request minimum scopes: `read:user`, `read:org`, `repo` (read only)

### 16.2 Secrets Management

All secrets in Vercel environment variables, never in codebase. Rotate `GITHUB_APP_PRIVATE_KEY` and `STRIPE_WEBHOOK_SECRET` if exposed. Use Vercel's encrypted environment variables feature for production.

### 16.3 GDPR Notes

DebtLens stores: GitHub username, GitHub user ID, repository names, code file paths (not code content), commit SHAs, commit messages. **No code content is stored.** Raw Knip output (file paths only) stored in Supabase Storage. Users can delete their account and all associated data via a button in settings (hard delete from all tables and storage).

---

## 17. Open Questions & Decisions

| # | Question | Options | Priority |
|---|---|---|---|
| 1 | Knip config handling for monorepos | A) Auto-detect workspaces  B) Manual config override  C) Analyse root only | High |
| 2 | Job runner — Vercel vs Supabase Edge Function | A) Vercel (simpler)  B) Supabase Edge Function (lower cost) | High |
| 3 | Private repo support at launch | A) Yes (needs `repo` read scope)  B) Public only for MVP | High |
| 4 | Analysis on PR vs push only | A) Both  B) Push only for MVP | Medium |
| 5 | Pricing model for organisations | A) Per repo  B) Per seat  C) Flat org fee | Medium |
| 6 | Badge caching TTL | A) 1 hour  B) 24 hours  C) Realtime via SSE | Low |

---

## 18. Glossary

| Term | Definition |
|---|---|
| Dead code | Code (files, exports, dependencies) present in the codebase but never referenced or used |
| Knip | Open-source CLI tool that detects unused code in JS/TS projects ([knip.dev](https://knip.dev)) |
| `job_run` | A single analysis execution triggered by a push event or manual scan |
| Trend | Historical time-series of dead code counts for a repository |
| Delta | The change in total dead code between two consecutive commits (+N or -N) |
| Health score | Total dead code count — a single number representing codebase cleanliness |
| RLS | Row Level Security — PostgreSQL feature ensuring users only access their own data |
| GitHub App | A type of GitHub integration with fine-grained permissions, distinct from OAuth App |
| Knip config override | Custom `knip.config.ts` settings stored per repo, merged at analysis time |
| Freemium | Business model where core features are free and advanced features require payment |

---

*End of Document — DebtLens Technical Specification v1.0*
