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
