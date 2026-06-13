# InternFlow

InternFlow is an AI-powered Career Operating System for students. This repository now contains a production-oriented Phase 1 + Phase 2 skeleton with a React frontend, Node.js/Express API, MongoDB models, JWT authentication, internship discovery, application tracking, resume analysis, recommendation scoring, environment configuration, and local infrastructure.

## Implemented roadmap scope

### Phase 1 — Career Discovery MVP
- Email/password authentication with bcrypt and JWT access/refresh tokens.
- Universal student profile with education, skills, projects, and preferences.
- Internship discovery API with search, filters, source URL retention, and match scoring.
- Direct apply support through source links.
- Manual application tracker with lifecycle statuses and status history.
- React student app for auth, dashboard, discovery, tracker, and profile.

### Phase 2 — Resume Intelligence
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

## Environment variables

See `.env.example` for required configuration. Use strong, unique JWT secrets in staging and production.

## Production hardening notes

- Replace the local resume text parser with a PDF/DOCX extraction pipeline and asynchronous queue before public launch.
- Move uploaded resumes to encrypted object storage with signed URLs.
- Add Google OAuth once OAuth credentials and callback domains are available.
- Add API integration tests backed by an ephemeral MongoDB instance.
- Seed the source registry and skill taxonomy before launch.
