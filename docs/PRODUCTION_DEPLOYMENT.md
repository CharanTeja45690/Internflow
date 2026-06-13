# InternFlow Production Deployment

This deployment plan intentionally skips monetization, subscriptions, and payments. It focuses only on getting the current product into a reliable production environment on free or near-free infrastructure.

## Recommended production stack

| Layer | Recommended host | Notes |
|---|---|---|
| Frontend | Cloudflare Pages first, Vercel fallback | Static Vite build from `apps/web`. Netlify is intentionally skipped. |
| API | Render Free, Railway, or Fly.io | Long-running Express service from `services/api`. |
| Database | MongoDB Atlas Free | Matches the existing Mongoose implementation. |
| File uploads | Cloudflare R2 | Required before real resume uploads at scale; local disk is only acceptable for demos. |
| CI | GitHub Actions | Builds and tests every push/PR. |
| Smoke checks | GitHub Actions schedule | Hits the deployed frontend and API health endpoint every 6 hours. |

## Frontend deployment: Cloudflare Pages

1. Create a Cloudflare Pages project connected to this repository.
2. Use these build settings:
   - Build command: `npm install && npm run build -w apps/web`
   - Build output directory: `apps/web/dist`
   - Root directory: repository root
3. Set this production environment variable:
   - `VITE_API_URL=https://<api-host>/api`
4. Deploy.

The repo includes `wrangler.toml` with `pages_build_output_dir = "apps/web/dist"` for Cloudflare Pages-compatible builds.

## Frontend deployment: Vercel fallback

1. Import the repository into Vercel.
2. Keep the repo root as the project root.
3. Use the included `vercel.json`.
4. Set this production environment variable:
   - `VITE_API_URL=https://<api-host>/api`
5. Deploy.

The included config builds only the Vite web workspace and rewrites SPA routes to `index.html`.

## API deployment

Deploy `services/api` as a persistent Node.js service. Render Free is the simplest default.

Use these commands:

```bash
npm install
npm run build -w packages/shared && npm run build -w services/api
npm run start -w services/api
```

Required API environment variables:

```text
NODE_ENV=production
PORT=4000
MONGODB_URI=mongodb+srv://...
JWT_ACCESS_SECRET=<strong random value>
JWT_REFRESH_SECRET=<different strong random value>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
CORS_ORIGIN=https://<frontend-host>
```

Health check path:

```text
/health
```

## Database

Use MongoDB Atlas Free for the first production deployment because the backend currently uses Mongoose models and `MONGODB_URI`.

Minimum setup:

1. Create a free Atlas cluster.
2. Create a database user.
3. Allow the API host to connect. If the host uses dynamic outbound IPs, use the provider-recommended allowlist approach.
4. Set `MONGODB_URI` on the API host.

## Resume uploads

The current API writes uploads to local disk. That is acceptable only for demos. Before real production users, move uploads to Cloudflare R2 and store durable object keys in MongoDB.

## CI and smoke checks

The repo includes:

- `.github/workflows/ci.yml` for build/test checks.
- `.github/workflows/smoke.yml` for scheduled deployed-environment checks.

Before enabling smoke checks, set these repository secrets:

```text
SMOKE_BASE_URL=https://<frontend-host>
SMOKE_API_URL=https://<api-host>
```

## Production go-live checklist

- [ ] Cloudflare Pages or Vercel frontend deploy succeeds.
- [ ] API host deploy succeeds.
- [ ] `VITE_API_URL` points to the production API `/api` base.
- [ ] `CORS_ORIGIN` exactly matches the production frontend origin.
- [ ] MongoDB Atlas connection succeeds.
- [ ] `/health` returns HTTP 200.
- [ ] `npm run build` passes in CI.
- [ ] `npm test` passes in CI.
- [ ] Scheduled smoke workflow secrets are configured.
- [ ] Resume uploads are moved to durable storage before accepting real user resumes.

## Phase 3 production foundation, excluding monetization

Phase 3 should add AI Career Copilot and stronger automation without subscriptions/payments.

Required production foundation:

1. Copilot conversation/message models.
2. A context builder that grounds answers in the user's profile, resume analysis, applications, and internships.
3. Provider abstraction for LLM calls.
4. Usage limits for platform protection, not monetization.
5. AI regression tests that verify grounded answers and privacy boundaries.
6. Scheduled smoke checks for the Copilot endpoint once it exists.

## Step-by-step setup guide

### 1. Create the database

1. Create a MongoDB Atlas Free cluster.
2. Create an app database user.
3. Copy the Atlas connection string.
4. Use that value as `MONGODB_URI` in the API host.

### 2. Deploy the API

1. Create a Render/Railway/Fly service from this repository.
2. Configure it as a Node.js web service.
3. Set the install command to `npm install`.
4. Set the build command to `npm run build -w packages/shared && npm run build -w services/api`.
5. Set the start command to `npm run start -w services/api`.
6. Add the API environment variables from `.env.production.example`.
7. Open `https://<api-host>/health` and confirm HTTP 200.

### 3. Deploy the frontend on Cloudflare Pages

1. Create a Cloudflare Pages project from this repository.
2. Set the build command to `npm install && npm run build -w apps/web`.
3. Set the output directory to `apps/web/dist`.
4. Set `VITE_API_URL=https://<api-host>/api`.
5. Deploy and open the generated `*.pages.dev` URL.
6. Set API `CORS_ORIGIN` to the exact Cloudflare Pages origin.
7. Redeploy the API after changing `CORS_ORIGIN`.

### 4. Deploy the frontend on Vercel fallback

1. Import the repository into Vercel.
2. Keep the project root at the repository root.
3. Use the committed `vercel.json`.
4. Set `VITE_API_URL=https://<api-host>/api`.
5. Deploy and open the generated Vercel URL.
6. If using Vercel instead of Cloudflare Pages, set API `CORS_ORIGIN` to the Vercel origin.

### 5. Enable CI and smoke checks

1. Confirm GitHub Actions CI passes on the branch.
2. Add repository secrets:
   - `SMOKE_BASE_URL=https://<frontend-host>`
   - `SMOKE_API_URL=https://<api-host>`
3. Trigger the `Production smoke checks` workflow manually.
4. Leave the 6-hour schedule enabled after the first successful manual run.

## Next production plan

1. Move resume uploads from local disk to Cloudflare R2 before accepting real user resumes.
2. Add API integration tests against an isolated MongoDB test database.
3. Add Playwright E2E tests for login, discovery, application tracking, resume upload, and recruiter posting.
4. Add an internal scheduled-job endpoint protected by `INTERNAL_JOB_SECRET` for reminder and recommendation loops.
5. Add application follow-up reminders and in-app notifications.
6. Add Phase 3 Career Copilot foundations without payments: conversations, messages, context grounding, provider abstraction, usage limits for abuse protection, privacy tests, and AI regression checks.
