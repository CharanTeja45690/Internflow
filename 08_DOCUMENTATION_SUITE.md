# INTERNFLOW — MASTER ENGINEERING NOTEBOOK
## Part 8: Documentation Suite (PRD, SRS, HLD, LLD, API Docs, Runbooks)

---

## 34. Product Requirements Document (PRD) — Summary

### 34.1 Purpose
This PRD defines the product scope for InternFlow, an AI-powered Career Operating System, governing Phases 1–5 of the roadmap (Part 9).

### 34.2 Goals
- Reduce time-to-first-relevant-application for students by 50% vs unaided search.
- Increase interview conversion rate by surfacing better-matched opportunities and actionable skill gap guidance.
- Build a proprietary dataset (resumes, applications, outcomes) that compounds the platform's matching/prediction quality over time.

### 34.3 Non-Goals (Explicitly Out of Scope for Phases 1–5)
- InternFlow does not submit applications on behalf of users (no automated form-filling) until Phase 7.
- InternFlow does not host job postings exclusively (always links to original source) — not a closed marketplace until Phase 8.
- InternFlow does not provide legal/visa guidance.

### 34.4 Success Metrics (tie to Part 0 North Star)
- Career Velocity (time to first offer)
- Weekly Active Users (WAU) / Monthly Active Users (MAU) ratio (habit-loop health)
- Resume Score improvement over time (engagement with improvement loop)
- Interview/Offer conversion rate vs cohort baseline

### 34.5 Release Criteria (per phase)
Each phase (Part 9) has explicit feature lists; a phase is "released" when: all listed features pass E2E tests (Part 7 §33.3), security review for new data flows is complete, and monitoring dashboards (Part 7 §31.3) exist for new services/event types.

---

## 35. Software Requirements Specification (SRS) — Reference

The SRS is composed of:
- **Functional Requirements**: Part 1, §7 (FR-1.x through FR-10.x)
- **Non-Functional Requirements**: Part 1, §8 (NFR-1.x through NFR-7.x)
- **Data Requirements**: Part 4 (complete schema)
- **Interface Requirements**: Part 8, §37 (API documentation index)
- **External Interface Requirements**: OAuth providers (Google), email/push providers (SES/FCM), LLM providers (OpenAI/Ollama), scraping targets (Part 6 §24)

Traceability: every FR maps to one or more Modules (Part 2) and one or more database entities (Part 4) — maintained as a traceability matrix in `/docs/traceability-matrix.xlsx` (generated artifact, updated per release).

---

## 36. High-Level Design (HLD) Reference

The HLD is composed of:
- System Architecture diagram: Part 3, §10
- Microservice inventory & communication patterns: Part 3, §11
- Event catalog: Part 3, §12.2
- Data architecture (ERD): Part 4, §14
- AI architecture: Part 5, §18–20
- Deployment topology: Part 7, §31.2

**HLD Review Checklist** (used before major architectural changes):
1. Does this change introduce a new data ownership boundary? → update §9 (Service Boundaries)
2. Does this change introduce a new event type? → update §12.2 (Event Catalog) with schema
3. Does this change affect tenant isolation? → update §17 (RLS policies) + add RLS test cases
4. Does this change affect AI cost profile? → update §18.3 (Cost Control)

---

## 37. Low-Level Design (LLD) — API Documentation Index

All services expose OpenAPI 3.x specs, auto-generated from code annotations, published to an internal API portal (e.g., via Redoc/Swagger UI behind auth). Index of API groups (consolidating endpoints listed throughout Part 2):

| Group | Base Path | Service | Key Endpoints |
|---|---|---|---|
| Auth | `/auth/*` | Auth Service | register, login, oauth/google, refresh, logout, password-reset |
| Profile | `/profile/*` | Profile Service | me, education, skills, projects, certifications, experience, links |
| Resume | `/resume/*` | Resume Service | upload, :id/status, latest-analysis, score-history |
| Internships | `/internships/*` | Internship Service | list (search/filter), :id, :id/similar |
| Applications | `/applications/*` | Application Service | list, create, :id/status, :id/notes, :id/interview-logs, :id/reminders |
| Recommendations | `/recommendations/*` | Recommendation Service | feed, feedback |
| Copilot | `/copilot/*` | AI Service | conversations, conversations/:id/messages (SSE) |
| Skill Gap | `/skill-gap/*` | AI Service | report, recompute |
| Career Score | `/career-score/*` | AI Service | (root), history |
| Analytics | `/analytics/*` | Analytics Service | funnel, reports/summary |
| Notifications | `/notifications/*`, `/notification-preferences/*`, `/devices/*` | Notification Service | inbox, read, preferences, device registration |
| College (Phase 6) | `/college/*` | Tenant Service | dashboard/summary, dashboard/cohort-funnel, dashboard/students |
| Recruiter (Phase 6) | `/recruiter/*` | Tenant Service | roles, roles/:id/candidates, shortlists |
| Internal (service-to-service only) | `/internal/*` | Internship Service | internships/ingest |

**API Versioning**: all public endpoints prefixed `/v1/` from launch; breaking changes require `/v2/` with deprecation window (minimum 90 days), per service.

---

## 38. Runbooks (Operational)

### 38.1 Runbook: Resume Processing Queue Backlog
**Symptom**: `resume_processing_queue_depth` alert fires (>1000 pending).
**Steps**:
1. Check worker pool health (all workers running? errors in logs?).
2. Check Tier-1 LLM (Ollama) host resource utilization — if saturated, scale worker/inference nodes horizontally.
3. If OpenAI fallback (Tier-2/3) is the bottleneck, check OpenAI rate-limit/error responses — may need temporary backoff or quota increase.
4. If backlog persists >30min, communicate via status page (resume analysis delayed).

### 38.2 Runbook: Event Bus Consumer Lag (Critical Topic)
**Symptom**: `application.status_changed` consumer lag > 5min.
**Steps**:
1. Identify lagging consumer group (Analytics/Success Prediction/Career Score).
2. Check consumer service health/restarts.
3. Scale consumer instances if CPU-bound.
4. If a bad message is causing repeated failures (poison pill), move to DLQ manually and file bug for schema validation gap.

### 38.3 Runbook: Scraper Source Blocked / Compliance Flag
**Symptom**: Source returns 403/429 consistently, or legal/compliance team flags a source.
**Steps**:
1. Set `sources_registry.compliance_status = 'blocked'` immediately — scheduler will skip it.
2. Existing listings from that source: do NOT auto-delete (other sources may corroborate the same listing via `internship_sources`); if it was the *sole* source, mark listings `status='expired'` after grace period.
3. Document decision and re-review timeline.

### 38.4 Runbook: Suspected Cross-Tenant Data Leak
**Symptom**: RLS test failure in CI, or manual report of a tenant seeing another tenant's data.
**Steps** (P0 — highest severity):
1. Immediately disable affected endpoint(s) via feature flag.
2. Audit `audit_logs` for scope of exposure (which tenants, which records, time window).
3. Root-cause: missing RLS policy, missing `tenant_id` filter in query, or session variable not set correctly.
4. Patch + add regression test to RLS test suite (Part 7 §33.5) before re-enabling.
5. Notify affected tenants per incident communication policy.

### 38.5 Runbook: Database Failover (DR Drill / Real Incident)
**Steps**:
1. Confirm primary RDS instance unhealthy via monitoring.
2. Promote read replica (cross-region) to primary.
3. Update connection strings via Secrets Manager (services pick up new endpoint on next config refresh or restart).
4. Verify WAL replication lag was within RPO target before failover.
5. Post-incident: re-establish replication from new primary, document timeline against RTO target.

---

*(Continue to Part 9: Roadmap Phases 1–5)*
