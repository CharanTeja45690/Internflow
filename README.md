# InternFlow

InternFlow is an AI-powered Career Operating System for students. This repository now contains a production-oriented Phase 1 + Phase 2 skeleton with a React frontend, Node.js/Express API, MongoDB models, JWT authentication, internship discovery, application tracking, resume analysis, recommendation scoring, environment configuration, and local infrastructure.

## Implemented roadmap scope

### Phase 1 - Career Discovery MVP
- Email/password authentication with bcrypt and JWT access/refresh tokens.
- Universal student profile with education, skills, projects, and preferences.
- Internship discovery API with search, filters, source URL retention, and match scoring.
- Direct apply support through source links.
- Manual application tracker with lifecycle statuses and status history.
- React student app for auth, dashboard, discovery, tracker, and profile.

### Phase 2 - Resume Intelligence
- Resume upload endpoint with 10 MB limit.
- Resume text analysis scaffold that extracts common skills, computes a resume score, and returns ATS recommendations.
- Skill matrix persistence back into the student profile.
- Cold-start recommendation endpoint that ranks internships using profile/resume skills.
- Resume score UI in the React app.

## Repository structure

```text
apps/web                 React + Vite frontend
services/api             Node.js + Express + MongoDB backend
packages/shared          Shared Zod schemas and TypeScript types
db/seeds                 Seed data for development
infrastructure           Local Docker Compose configuration
```

## Quick start

1. Copy environment variables:
   ```bash
   cp .env.example .env
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start MongoDB locally or via Docker:
   ```bash
   docker compose -f infrastructure/docker-compose.yml up mongo
   ```
4. Run the API and web app:
   ```bash
   npm run dev
   ```
5. Open the frontend at `http://localhost:5173` and the API health check at `http://localhost:4000/health`.

## Core API routes

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Create a student account and profile |
| POST | `/api/auth/login` | Login with email/password |
| POST | `/api/auth/refresh` | Issue a new access token |
| GET/PUT | `/api/profile/me` | Read or update the current student profile |
| GET/POST | `/api/internships` | Search/list or create internship records |
| GET | `/api/recommendations` | Ranked cold-start internship feed |
| GET/POST | `/api/applications` | List or create tracked applications |
| PATCH | `/api/applications/:id/status` | Move an application through the pipeline |
| GET/POST | `/api/resumes` and `/api/resumes/upload` | List resumes and upload for analysis |


## Production deployment

Production deployment is configured for the current codebase without monetization, subscriptions, or payment features. Use **Cloudflare Pages first** or **Vercel fallback** for the Vite frontend, and deploy the Express API as a persistent Node.js service on Render, Railway, or Fly.io. Netlify is intentionally skipped.

### Frontend hosting

- Cloudflare Pages build command: `npm install && npm run build -w apps/web`
- Cloudflare Pages output directory: `apps/web/dist`
- Vercel uses the included `vercel.json` with the same Vite build output.
- Required frontend environment variable: `VITE_API_URL=https://<api-host>/api`

### API hosting

Deploy `services/api` as a long-running Node/Express service. The API is not converted to serverless in this setup.

- Install command: `npm install`
- Build command: `npm run build -w packages/shared && npm run build -w services/api`
- Start command: `npm run start -w services/api`
- Health check path: `/health`

Required API environment variables are shown in `.env.production.example`. Use MongoDB Atlas Free for production because the backend currently uses Mongoose and `MONGODB_URI`.

### CI and smoke checks

This repo includes GitHub Actions workflows for production confidence:

- `.github/workflows/ci.yml` builds and tests every push/PR.
- `.github/workflows/smoke.yml` can run scheduled deployed-environment checks once `SMOKE_BASE_URL` and `SMOKE_API_URL` repository secrets are configured.

See `docs/PRODUCTION_DEPLOYMENT.md` for the complete deployment runbook, step-by-step setup guide, go-live checklist, next production plan, and Phase 3 production foundation.

## Environment variables

See `.env.example` for required configuration. Use strong, unique JWT secrets in staging and production.

## Production hardening notes

- Replace the local resume text parser with a PDF/DOCX extraction pipeline and asynchronous queue before public launch.
- Move uploaded resumes to encrypted object storage with signed URLs.
- Add Google OAuth once OAuth credentials and callback domains are available.
- Add API integration tests backed by an ephemeral MongoDB instance.
- Seed the source registry and skill taxonomy before launch.
