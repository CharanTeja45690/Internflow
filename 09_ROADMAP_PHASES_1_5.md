# INTERNFLOW — MASTER ENGINEERING NOTEBOOK
## Part 9: Roadmap — Phases 1 to 5 (Detailed)

---

## 39. Phase 1: Career Discovery MVP

### 39.1 Features
- Module 1 (Authentication: email + Google OAuth)
- Module 2 (Universal Student Profile — manual entry)
- Module 4 (Internship Discovery Engine — seed sources, basic crawler, Postgres full-text search)
- Module 5 (Direct Apply Engine)
- Module 7 (Application Tracker — manual entry, Kanban)
- Basic Notification Engine (email only: welcome, deadline reminders)
- Frontend: landing page, auth, onboarding (without resume step initially or as optional), feed, tracker

### 39.2 Dependencies
- `sources_registry` seeded with 20–50 compliance-reviewed sources before launch.
- Skill taxonomy seeded with initial ~500 common skills (manual curation + scrape of common job requirement terms).
- Infrastructure: Postgres (with pgvector extension installed even if unused yet), Redis, S3, basic CI/CD, single-region deployment.

### 39.3 Team Requirements
- 1 Tech Lead / Architect
- 2 Backend Engineers (Node.js — Auth, Profile, Internship, Application services)
- 1 Frontend Engineer (Next.js)
- 1 Data/Scraping Engineer (Python — crawler + parser for seed sources)
- 1 DevOps (part-time) — IaC setup, CI/CD
- 1 Product Designer (part-time)

### 39.4 Estimated Timeline
**10–12 weeks**
- Weeks 1–2: Infra setup, schema design/migration tooling, auth service
- Weeks 3–5: Profile service, Internship service + first 10 source crawlers
- Weeks 6–8: Application tracker, frontend (feed, tracker, profile)
- Weeks 9–10: Email notifications, basic search/filter polish
- Weeks 11–12: E2E testing, security review (auth flows, RLS skeleton), staging→prod launch

### 39.5 Risks
- **Crawler fragility**: source websites change layout without notice → adapters break. *Mitigation*: monitoring on per-source ingestion volume; alert if a source yields zero new listings for N expected cycles.
- **Cold inventory**: insufficient listings at launch reduces perceived value. *Mitigation*: prioritize high-yield sources first; consider seeding with a one-time bulk import from a data partnership if available.
- **Schema churn**: early schema decisions (Part 4) must hold for Phase 2–3 additions (resume embeddings, AI tables) — mitigated by designing the full schema upfront (already done in this notebook) even though Phase 1 only populates a subset.

---

## 40. Phase 2: Resume Intelligence

### 40.1 Features
- Module 3 (Resume Intelligence Engine — full pipeline: extraction, segmentation, skill extraction, scoring, embeddings)
- Recommendation Engine (Module 6) — cold-start via resume embeddings (basic version, no collaborative signal yet)
- Match Percentage shown on internship cards/detail pages
- Resume Score + Skill Matrix UI (dashboard reveal)
- Skill taxonomy expansion (driven by `taxonomy_review_queue` from real resumes)

### 40.2 Dependencies
- Phase 1 complete (profile + internship data exists for matching).
- Self-hosted Ollama infrastructure provisioned (Tier-1 model serving) — GPU or high-CPU instances.
- pgvector HNSW indexes created on `resume_analyses.embedding` and `internships.embedding`.
- Async worker/queue infrastructure (e.g., BullMQ on Redis, or SQS) for resume pipeline.

### 40.3 Team Requirements
- Add: 1 ML/AI Engineer (Python — resume pipeline, embeddings, prompt engineering)
- Add: 1 Backend Engineer (Recommendation Service)
- Existing team continues (Auth/Profile/Internship maintenance)

### 40.4 Estimated Timeline
**8–10 weeks**
- Weeks 1–2: Ollama infra setup, embedding generation for existing internships (backfill)
- Weeks 3–5: Resume pipeline (extraction → segmentation → skill extraction → scoring)
- Weeks 6–7: Recommendation Engine v1 (cold-start, nightly batch)
- Weeks 8–9: Frontend (resume upload, processing status UI, score reveal, match % on feed)
- Week 10: Load testing of pipeline (concurrent uploads), E2E tests

### 40.5 Risks
- **Parsing accuracy on diverse resume formats**: non-standard layouts (creative/design resumes, multi-column) → *Mitigation*: LLM fallback for segmentation; collect failure samples for prompt iteration.
- **Embedding quality for cold-start**: poor embeddings → irrelevant first feed → churn. *Mitigation*: A/B test embedding model choice; validate against a labeled set of (resume, good-match-internship) pairs before full rollout.
- **Cost overrun on Tier-2/3 escalation**: if Tier-1 confidence is poor, too many resumes escalate to OpenAI. *Mitigation*: monitor escalation rate (§31.3); tune confidence thresholds and improve Tier-1 prompts iteratively.

---

## 41. Phase 3: AI Career Copilot

### 41.1 Features
- Module 8 (AI Career Copilot — full RAG pipeline, streaming chat)
- Module 9 (Skill Gap Analyzer — depends on `skill_demand_aggregates`, computed from Phase 1–2 internship/skill data)
- Module 10 (Career Readiness Score — composite of resume score, skill gap, project quality, etc.)
- Resume Suggestions (Copilot can recommend specific resume edits based on score breakdown)
- Premium tier introduction (Business Model, Part 0 §2.4) — Copilot depth/history as premium feature

### 41.2 Dependencies
- Phase 2 complete (resume embeddings, skill matrices exist for grounding).
- `skill_demand_aggregates` materialized view pipeline built (aggregates `internship_skills` across active listings).
- OpenAI (Tier-3) integration with streaming support; LLM Provider Abstraction Layer (Part 5 §18.2) implemented.
- Billing/subscription infrastructure (Stripe or Razorpay for India) for premium tier.

### 41.3 Team Requirements
- Add: 1 AI Engineer (RAG pipeline, prompt templates, context assembly)
- Add: 1 Backend Engineer (billing/subscription integration, AI Service API layer)
- Existing ML Engineer shifts focus from resume pipeline maintenance to Skill Gap/Career Score logic

### 41.4 Estimated Timeline
**10–12 weeks**
- Weeks 1–2: `skill_demand_aggregates` pipeline, Skill Gap Analyzer backend
- Weeks 3–4: Career Readiness Score computation + event-driven recompute triggers
- Weeks 5–8: Copilot RAG pipeline (context retrieval, prompt assembly, streaming, prompt-injection defenses)
- Weeks 9–10: Frontend (Copilot chat UI with streaming, Skill Gap roadmap UI, Career Score gauge)
- Weeks 11–12: Billing integration, premium gating, E2E + security review (LLM-specific, Part 7 §32.6)

### 41.5 Risks
- **Hallucination/trust risk**: ungrounded or generic Copilot answers destroy the core value prop. *Mitigation*: mandatory grounding checks in testing (every response must cite at least one `retrieved_context_ref` for advice-type queries); human review of sample conversations pre-launch.
- **Streaming infra complexity**: SSE/WebSocket at scale requires sticky sessions or pub/sub-backed streaming. *Mitigation*: use Redis pub/sub to decouple LLM generation worker from client connection, allowing horizontal scaling of both independently.
- **Premium conversion uncertainty**: first revenue feature — *Mitigation*: instrument funnel from free Copilot usage → premium prompt → conversion, iterate on premium feature framing based on data.

---

## 42. Phase 4: Career Intelligence Platform

### 42.1 Features
- Module 11 (Analytics Engine — full funnel tracking, event bus migration to Kafka if needed)
- Module 12 (Success Prediction Engine — heuristic model v1, upgrading toward learned model)
- Module 13 (Startup Discovery Engine — YC/incubator/accelerator crawlers)
- Search Architecture upgrade (Part 5 §23.2 — OpenSearch, if Postgres full-text hits limits)
- Recommendation Engine v2 (collaborative signal via archetype clustering, Part 5 §21.3)

### 42.2 Dependencies
- Phase 1–3 data volume sufficient for meaningful `application_status_history` aggregates (collaborative signal, success prediction training data).
- Event bus migration decision point (Redis Streams → Kafka) evaluated based on actual `analytics_events` volume.
- Archetype clustering pipeline (k-means on resume embeddings) — scheduled batch job infra.

### 42.3 Team Requirements
- Add: 1 Data Engineer (analytics pipeline, archetype clustering, event bus migration if needed)
- Add: 1 Data Scientist (success prediction model — heuristic → learned model transition)
- Add: 1 Backend Engineer (Startup Discovery crawlers — Python)
- Existing AI Engineer supports Recommendation v2 collaborative signal integration

### 42.4 Estimated Timeline
**12–14 weeks**
- Weeks 1–3: Analytics Engine (event bus formalization, funnel rollup jobs, personal funnel UI)
- Weeks 4–6: Success Prediction v1 (heuristic model, `success_predictions` table, UI integration)
- Weeks 7–9: Startup Discovery Engine (crawler adapters for YC/incubators, `startup_company_profiles` enrichment)
- Weeks 10–11: Recommendation v2 (archetype clustering + collaborative signal in scoring formula)
- Weeks 12–14: Search architecture evaluation/migration (if triggered), load testing at 100K-user simulation, event bus migration (if triggered)

### 42.5 Risks
- **Event bus migration risk**: Kafka migration is operationally heavy — *Mitigation*: design event abstraction layer (Part 3 §12.1) from Phase 1 specifically to make this swap low-risk; migrate non-critical topics first, validate, then migrate critical topics.
- **Success prediction model trust**: showing probabilities that feel "wrong" to students damages trust. *Mitigation*: display ranges/confidence framing ("students with similar profiles had a 40-55% interview rate for similar roles") rather than false-precision single numbers; heuristic model is interpretable by design.
- **Startup source long-tail maintenance**: many low-yield sources increase scraper ops burden. *Mitigation*: adaptive crawl frequency (Part 6 §24.4) automatically demotes unproductive sources.

---

## 43. Phase 5: Career Ecosystem

### 43.1 Features
- Browser Extension v1 (Part 6 §27 — auto-capture applications, match-score popup)
- Referral Marketplace (foundational — directory of students willing to refer, simple request/response flow; full payment/incentive infra deferred)
- Mentorship System (mentor profiles, matching based on target role/company overlap with student profile)
- Community Discussions (forum-style, scoped by college/role-category)
- Interview Experiences (structured submissions: company, role, rounds, questions, outcome — feeds back into `internship_skills`/`difficulty_score` refinement and Success Prediction training data)

### 43.2 Dependencies
- Phase 1–4 complete; mature profile/skill/application data for mentor-matching and interview-experience-to-difficulty-score feedback loops.
- Browser extension requires stable, authenticated API session-sharing mechanism between web app and extension (Part 6 §27.2).
- Community/forum features require moderation tooling (content moderation pipeline — can leverage Tier-1/2 LLM for automated flagging + human review queue).

### 43.3 Team Requirements
- Add: 1 Frontend Engineer (Browser Extension — Manifest V3, content scripts)
- Add: 1 Full-stack Engineer (Community/Forum features, Mentorship matching)
- Add: 1 Community/Trust & Safety Operator (part-time — moderation queue oversight)
- Existing Recommendation/AI engineers extend matching logic to mentor-matching and interview-experience ingestion

### 43.4 Estimated Timeline
**12–16 weeks**
- Weeks 1–4: Browser Extension v1 (content script detection for major ATS platforms, popup UI, API integration)
- Weeks 5–7: Interview Experiences module (submission flow, moderation pipeline, integration with `difficulty_score`/Success Prediction features)
- Weeks 8–11: Mentorship System (mentor onboarding, matching algorithm reusing embedding infrastructure, scheduling/communication — likely via calendar integration)
- Weeks 12–14: Community Discussions (forum UI, moderation, scoping by college/role-category tenant-aware)
- Weeks 15–16: Referral Marketplace foundation (directory + request flow, no payments yet), integration testing across new modules, security review (new user-generated-content surfaces — XSS/moderation)

### 43.5 Risks
- **Moderation burden**: user-generated content (forums, interview experiences) introduces spam/abuse risk. *Mitigation*: automated Tier-1/2 LLM pre-screening + rate limits on submissions + human review queue before public visibility for new/low-trust accounts.
- **Extension adoption friction**: browser extensions have inherently low install rates. *Mitigation*: position as optional convenience feature; core tracker remains fully functional via manual entry — extension is additive, not a dependency.
- **Mentor supply-side cold start**: mentorship requires mentor signups (alumni/professionals), a different acquisition motion than student growth. *Mitigation*: leverage college partnerships (Phase 6 precursor relationships) to recruit alumni mentors; start with a curated, smaller mentor pool rather than open signup.
- **Network effects complexity**: Phase 5 is the first phase where features depend on *other users'* contributions (interview experiences, mentor availability, referrals) — cold-start per feature is a real risk. *Mitigation*: seed each feature with curated/internal content before public launch (e.g., team-written interview experience summaries for top companies).

---

## 44. Cross-Phase Summary Table

| Phase | Core Theme | New Services/Infra | Team Size (cumulative) | Duration |
|---|---|---|---|---|
| 1 | Career Discovery MVP | Auth, Profile, Internship, Application services; Scraper v1 | ~6 | 10–12 wks |
| 2 | Resume Intelligence | Resume pipeline, Ollama infra, Recommendation v1 | ~8 | 8–10 wks |
| 3 | AI Career Copilot | RAG pipeline, OpenAI integration, billing, Skill Gap, Career Score | ~10 | 10–12 wks |
| 4 | Career Intelligence Platform | Analytics/event bus formalization, Success Prediction, Startup Discovery, Recommendation v2 | ~13 | 12–14 wks |
| 5 | Career Ecosystem | Browser Extension, Mentorship, Community, Interview Experiences, Referral foundation | ~16 | 12–16 wks |

**Total estimated timeline Phase 1–5: ~52–64 weeks (~12–15 months)** with progressive team scaling from 6 to ~16.

---

*(Continue to Part 10: Repository Structure, Tech Stack Justification, Cost & Scaling Strategy)*
