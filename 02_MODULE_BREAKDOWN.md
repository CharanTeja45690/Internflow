# INTERNFLOW — MASTER ENGINEERING NOTEBOOK
## Part 2: Feature & Module Breakdown (Modules 1–16)

For each module: Purpose, Business Value, User Interactions, Internal Logic, Database Entities, APIs, Security Considerations, Scaling Considerations.

---

## Module 1: Authentication System

**Purpose**: Secure identity management for all user types (Student, College, Recruiter, Mentor, Admin).

**Business Value**: Trust foundation; enables personalization and multi-tenant separation from day one.

**User Interactions**: Register, login (email or Google OAuth), logout, password reset, session refresh.

**Internal Logic**:
- On registration: validate email uniqueness → hash password (argon2) → create `users` row → create default `roles` mapping (role=student) → issue JWT pair (access 15min, refresh 7d, rotated on use).
- OAuth: verify Google ID token server-side → upsert user → issue JWT pair.
- Password reset: generate single-use, time-limited token → email link → verify → update hash → invalidate all existing refresh tokens for that user.

**Database Entities**:
- `users` (id, email, password_hash, auth_provider, tenant_id, status, created_at)
- `roles` (id, user_id, role_name [student|college_admin|recruiter|mentor|admin], tenant_id)
- `sessions` (id, user_id, refresh_token_hash, device_info, ip_address, expires_at, revoked_at)

**APIs**:
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/oauth/google`
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /auth/password-reset/request`
- `POST /auth/password-reset/confirm`

**Security Considerations**:
- Rate-limit login/registration endpoints (e.g., 5/min/IP) to prevent brute force.
- Refresh token rotation with reuse detection (revoke entire session family if reused token detected).
- JWT signed with asymmetric keys (RS256) so other services can verify without sharing secrets.

**Scaling Considerations**:
- Auth Service is stateless; horizontally scalable behind load balancer.
- Session table partitioned by `user_id` hash for high-volume token validation lookups; Redis cache for active session validation to avoid DB hit per request.

---

## Module 2: Universal Student Profile

**Purpose**: Single canonical source of truth for all student data, eliminating repeated data entry.

**Business Value**: Enables every downstream module (resume intelligence, recommendations, apply, analytics) to operate on consistent data; core data moat asset.

**User Interactions**: Create/edit profile sections (personal, education, skills, projects, certifications, experience, portfolio links).

**Internal Logic**:
- Profile is composed of normalized sub-entities (1-to-many relationships) rather than a single JSON blob, enabling structured queries (e.g., "students with React skill").
- Skills stored as references to a canonical `skill_taxonomy` table (not free text) — resolved via fuzzy matching at entry time, with AI-assisted normalization during resume parsing.
- Profile completeness score computed on every update (used for "Profile Incomplete" notifications and Career Score).

**Database Entities**:
- `profiles` (id, user_id, tenant_id, full_name, phone, location, bio, avatar_url, completeness_score)
- `education` (id, profile_id, institution, degree, field_of_study, start_date, end_date, gpa)
- `skills_taxonomy` (id, name, category, aliases[])
- `profile_skills` (id, profile_id, skill_id, proficiency_level, source [manual|resume_extracted])
- `projects` (id, profile_id, title, description, tech_stack[], url, quality_score)
- `certifications` (id, profile_id, name, issuer, issue_date, url)
- `experience` (id, profile_id, company, role, start_date, end_date, description)
- `portfolio_links` (id, profile_id, type [github|linkedin|portfolio], url)

**APIs**:
- `GET /profile/me`
- `PATCH /profile/me`
- `POST /profile/education`, `PATCH /profile/education/:id`, `DELETE ...`
- `POST /profile/skills` (bulk add/remove)
- `POST /profile/projects`, `PATCH`, `DELETE`
- `POST /profile/certifications`
- `POST /profile/experience`
- `POST /profile/links`

**Security Considerations**:
- Profile data is per-user; enforce ownership check on every mutation (`user_id == auth.user_id` or admin/college role with explicit consent scope).
- Portfolio links validated/sanitized to prevent stored XSS when rendered.

**Scaling Considerations**:
- Profile reads are extremely frequent (every page). Cache full profile object in Redis keyed by `profile_id`, invalidated on write.
- Skill taxonomy table is small and read-heavy — cached in-memory at service level, refreshed periodically.

---

## Module 3: Resume Intelligence Engine

**Purpose**: Convert unstructured resume documents into structured, scoreable, AI-usable career data.

**Business Value**: Primary activation moment ("wow" factor); feeds Recommendation, Skill Gap, Career Score, and Copilot modules.

**User Interactions**: Upload resume (PDF/DOCX) → view processing status → view Resume Score, Skill Matrix, Experience Matrix, Project Quality Score.

**Internal Logic (Pipeline)**:
1. **Upload**: File stored in S3 (raw bucket), `resume_uploads` row created with status=`pending`, async job enqueued.
2. **Text Extraction**: Worker extracts raw text (PDF: pdfplumber/pymupdf; DOCX: python-docx/mammoth), handling multi-column layouts.
3. **Section Segmentation**: LLM/rule-hybrid classifies text blocks into sections (Education, Experience, Projects, Skills, Certifications) using heading detection + few-shot LLM fallback for non-standard formats.
4. **Skill Extraction**: NER + LLM extraction maps free-text skills to `skills_taxonomy` (fuzzy match + embedding similarity for unseen terms; new terms queued for taxonomy review).
5. **Project/Experience Analysis**: LLM scores each project/experience entry for: technical depth, impact clarity, relevance to target roles (Project Quality Score 0–100).
6. **Education Parsing**: Extracts institution, degree, dates, GPA via structured extraction prompt + regex validation.
7. **Career Profile Creation**: Aggregates outputs into `resume_analyses` record; generates embedding vector (pgvector) representing overall profile for cold-start recommendations.
8. **Scoring**: Resume Score = weighted combination of (completeness, skill relevance to market demand, project quality avg, formatting/ATS-friendliness heuristics).

**Database Entities**:
- `resume_uploads` (id, profile_id, s3_key, status, uploaded_at, processed_at)
- `resume_analyses` (id, resume_upload_id, profile_id, resume_score, skill_matrix JSONB, experience_matrix JSONB, project_quality_avg, ats_issues JSONB, embedding VECTOR(1536), created_at)
- `resume_score_history` (id, profile_id, resume_analysis_id, score, created_at) — for trend tracking

**APIs**:
- `POST /resume/upload` (returns upload_id, status=pending)
- `GET /resume/:upload_id/status` (polling) + WebSocket channel `resume.:upload_id.status`
- `GET /resume/latest-analysis`
- `GET /resume/score-history`

**Security Considerations**:
- Resumes classified as **Tier-1 sensitive PII** (Part 11). Raw files in private S3 bucket, access via short-lived signed URLs only, never public.
- File type validation (magic-byte check, not just extension) before processing to prevent malicious uploads.
- Sandbox/isolate document parsing workers (no shell execution on user-controlled file content).

**Scaling Considerations**:
- Pipeline runs on a dedicated async worker pool (queue-based: SQS/RabbitMQ), decoupled from API request path.
- LLM calls in pipeline use cheaper/local models (Ollama-hosted Llama/Qwen) for extraction steps; OpenAI reserved for ambiguous/low-confidence cases (cost optimization at scale — Part 6).
- Embeddings stored in pgvector with HNSW index for fast similarity search even at millions of resumes.

---

## Module 4: Internship Discovery Engine

**Purpose**: Aggregate, normalize, and deduplicate internship listings from many heterogeneous sources into one searchable database.

**Business Value**: Core inventory asset — the more comprehensive and fresh, the stronger the platform's value proposition vs single-source boards.

**User Interactions**: Search/filter internships, view detail pages.

**Internal Logic (Pipeline)** — detailed in Part 8 (Scraping Infrastructure):
1. **Crawler** fetches raw HTML/JSON from registered sources on a schedule.
2. **Parser** extracts structured fields per source-specific adapter (career pages differ wildly in structure; each source has a parser config/adapter).
3. **Cleaner** normalizes fields (date formats, location names, stipend currency/units, role titles mapped to canonical role taxonomy).
4. **Deduplication** — fuzzy-matches new listings against existing (company + role + location + posted-date window) using similarity scoring; merges duplicates with source-tracking (a listing can have multiple source URLs).
5. **Classification** — tags listing with: industry, role category, difficulty score (computed from requirements text vs typical entry-level bar), remote/onsite, skills_required (mapped to taxonomy).
6. **Database write** — upsert into `internships` table; triggers recommendation re-scoring event (Part 8 event bus).

**Database Entities**:
- `internships` (id, company_name, role_title, role_category, description, requirements TEXT, skills_required[], deadline, location, remote_type, stipend_min, stipend_max, stipend_currency, difficulty_score, apply_url, status [active|expired|filled], first_seen_at, last_seen_at)
- `internship_sources` (id, internship_id, source_id, source_url, source_listing_id)
- `sources_registry` (id, name, base_url, type [career_page|job_board|startup|college|incubator], robots_txt_status, crawl_frequency, last_crawled_at, compliance_status)
- `internship_skills` (id, internship_id, skill_id, importance_weight)

**APIs**:
- `GET /internships` (filters: role, location, stipend range, deadline, difficulty, source, query string)
- `GET /internships/:id`
- `GET /internships/:id/similar`
- Internal: `POST /internal/internships/ingest` (used by scraper pipeline, service-to-service auth only)

**Security Considerations**:
- Public-facing search APIs rate-limited per user/IP to prevent scraping-of-the-scraper.
- Ingest endpoint restricted to internal service network (mTLS or internal API key), never exposed publicly.

**Scaling Considerations**:
- `internships` table partitioned by `status` + time-range (active listings are hot, expired archived to cold partition).
- Full-text + filter search offloaded to a dedicated search index (Elasticsearch/OpenSearch or Postgres full-text initially) — Part 9 (Search Architecture).
- Deduplication is computationally heavy at scale → run as batch process with embedding-based candidate retrieval (pgvector) before pairwise comparison, not O(n²) full scan.

---

## Module 5: Direct Apply Engine

**Purpose**: Connect students to the original application source without InternFlow becoming a liability intermediary (no fake application submission).

**Business Value**: Builds trust (transparent sourcing), reduces legal/compliance risk, and creates the natural moment to log a tracked application.

**User Interactions**: Click "Apply" → redirected to source `apply_url` → optionally confirm "Mark as Applied" in InternFlow.

**Internal Logic**:
- "Apply" click is logged as an analytics event (`application_click`) before redirect (for funnel tracking).
- "Mark as Applied" creates/updates an `applications` row (Module 7) with `status=applied`, `applied_at=now()`.
- (Phase 7) Browser extension can auto-detect successful form submission on partner sites and auto-create the tracker entry.

**Database Entities**: Reuses `internships` (Module 4) and `applications` (Module 7). No new core entities; adds `application_events` (id, application_id, event_type [click|mark_applied], created_at, metadata JSONB).

**APIs**:
- `POST /internships/:id/apply-click` (fire-and-forget analytics event)
- `POST /applications` (creates tracker entry, see Module 7)

**Security Considerations**:
- Outbound `apply_url` validated against an allowlist of known-safe domains where possible; warn users when redirecting to unverified/new domains (phishing risk mitigation).

**Scaling Considerations**:
- Click-tracking is high-volume, append-only — written to an event stream (Kafka/Kinesis) rather than direct synchronous DB write, consumed by Analytics Engine (Module 11).

---

## Module 6: Recommendation Engine

**Purpose**: Surface the most relevant internships to each student, ranked by personalized fit.

**Business Value**: Directly drives the core habit loop and application quality; the single highest-leverage AI feature for retention.

**User Interactions**: Passive — powers the Discovery Feed ranking; also drives "Recommended for you" widgets.

**Internal Logic**:
- **Cold start** (no application history): rank by cosine similarity between student's resume embedding and each internship's description embedding (pgvector ANN search), filtered by hard constraints (location preference, eligibility e.g. graduation year vs internship type).
- **Warm** (has application history): hybrid score = `α * embedding_similarity + β * collaborative_signal + γ * recency/deadline_urgency`, where collaborative signal comes from "students with similar profiles applied to / got interviews for X."
- **Batch precomputation**: nightly job recomputes top-N recommendations per active student into `recommendations_cache`; **incremental updates** triggered on profile/resume changes or significant new internship ingestion (event-driven, Part 8).
- **Online re-ranking**: at request time, cached candidates are re-ranked lightly using freshness/deadline factors so the feed feels "live" without full recompute.

**Database Entities**:
- `recommendations_cache` (id, profile_id, internship_id, score, rank, generated_at, model_version)
- `recommendation_feedback` (id, profile_id, internship_id, action [viewed|clicked|applied|dismissed], created_at) — feeds future model retraining

**APIs**:
- `GET /recommendations/feed?page=&limit=`
- `POST /recommendations/feedback` (dismiss, not-interested)
- Internal: event consumer (no public API) — triggered by `profile.updated`, `resume.analyzed`, `internship.ingested` events

**Security Considerations**:
- Recommendation cache scoped strictly to `profile_id`; cross-tenant leakage prevented via row-level security on `profile_id` joins.

**Scaling Considerations**:
- Batch recompute is the dominant cost driver at scale — designed as horizontally-scalable worker fleet processing profiles in shards (by `profile_id` hash) on a schedule (e.g., daily) plus event-triggered incremental recompute for active users only.
- pgvector ANN indexes (HNSW) tuned for recall/latency tradeoff; at very large internship counts (>1M active), consider dedicated vector DB (Qdrant/Pinecone) — documented as a scaling milestone, not Day-1 requirement.

---

## Module 7: Application Tracker

**Purpose**: System of record for a student's application pipeline across all opportunities (InternFlow-sourced or external).

**Business Value**: Generates the outcome data that powers Analytics, Success Prediction, and the "why am I rejected" Copilot use case — this is the platform's most valuable proprietary dataset.

**User Interactions**: Add application (manually or via "Mark as Applied"), drag between pipeline stages, add notes/interview logs/follow-ups.

**Internal Logic**:
- Pipeline stages enforced as enum with valid transition rules (e.g., can't go from `saved` directly to `offer` without passing through — though manual override allowed with audit note).
- Every status change writes to `application_status_history` (append-only) — never overwrite, always insert — enabling full timeline reconstruction.
- Follow-up reminders create entries in Notification Engine (Module 14) scheduled queue.

**Database Entities**:
- `applications` (id, profile_id, internship_id (nullable for external/manual entries), company_name, role_title, current_status, created_at, updated_at)
- `application_status_history` (id, application_id, status, changed_at, note)
- `application_notes` (id, application_id, note_text, created_at)
- `interview_logs` (id, application_id, round_name, date, feedback, outcome)
- `follow_up_reminders` (id, application_id, remind_at, message, completed)

**APIs**:
- `GET /applications` (list, filterable by status)
- `POST /applications`
- `PATCH /applications/:id/status`
- `POST /applications/:id/notes`
- `POST /applications/:id/interview-logs`
- `POST /applications/:id/reminders`

**Security Considerations**:
- Strict ownership checks — applications are highly personal (contain interview feedback, possibly sensitive notes).
- (Future, college dashboard) cohort-level analytics only ever expose **aggregates**, never individual application notes, to college tenants.

**Scaling Considerations**:
- `application_status_history` is append-only and grows quickly — partitioned by time (monthly partitions), with older partitions moved to cheaper storage tiers.
- Status-change events published to event bus for real-time Analytics/Success Prediction updates (Part 4 — Event-Driven Architecture).

---

## Module 8: AI Career Copilot

**Purpose**: Conversational, RAG-grounded career guidance personalized to each student's actual data.

**Business Value**: Highest perceived "AI magic" feature; differentiator vs all competitors; premium tier anchor (Phase 3+).

**User Interactions**: Chat interface — free-form questions ("Why am I getting rejected?", "Which project should I build next?").

**Internal Logic** (full detail in Part 6 — AI Architecture & Part 5 — RAG Architecture):
- On each query, AI Service assembles a **context bundle**:
  - Student profile summary + resume analysis (skills, projects, scores)
  - Recent application history + status distribution (e.g., "5 applied, 0 interviews — possible mismatch signal")
  - Top-k retrieved chunks from internship/skill corpus relevant to the query (pgvector similarity search)
- Context bundle + conversation history + system prompt sent to LLM (model selection based on query complexity — Part 6 orchestration logic).
- Response streamed token-by-token to frontend; structured "suggested actions" extracted from response (e.g., links to Skill Gap page) via a lightweight follow-up classification pass.
- All conversations persisted for continuity and future fine-tuning signal (with privacy controls).

**Database Entities**:
- `copilot_conversations` (id, profile_id, title, created_at)
- `copilot_messages` (id, conversation_id, role [user|assistant], content TEXT, retrieved_context_refs JSONB, model_used, created_at)

**APIs**:
- `POST /copilot/conversations` (create new)
- `GET /copilot/conversations` (list)
- `POST /copilot/conversations/:id/messages` (send message, streaming response via SSE/WebSocket)
- `GET /copilot/conversations/:id/messages`

**Security Considerations**:
- Prompt injection mitigation: retrieved corpus content (internship descriptions from scraped sources) is **untrusted input** — sanitized and clearly delimited from system instructions in the prompt template; LLM instructed to treat retrieved content as data, not instructions.
- Conversation content may include sensitive self-disclosure (e.g., personal struggles) — same Tier-1 PII handling as resumes.

**Scaling Considerations**:
- Streaming responses require sticky connections or SSE-friendly infra (not pure stateless REST) — handled via dedicated AI gateway service (Part 6).
- Conversation history truncation/summarization strategy for long-running conversations to manage context window costs.

---

## Module 9: Skill Gap Analyzer

**Purpose**: Quantify the gap between a student's current skills and market-demanded skills, with an actionable roadmap.

**Business Value**: Converts the platform's aggregated internship data (Module 4) into a personalized improvement plan — a uniquely data-driven feature competitors can't replicate without similar scale of listings data.

**User Interactions**: View missing skills (ranked), learning roadmap, estimated time investment.

**Internal Logic**:
- **Market Skills Demand** computed as a rolling aggregate: frequency + weighting of `internship_skills` across active listings (optionally filtered to student's target role categories/locations).
- **Gap Computation**: `market_skills - profile_skills`, ranked by `(demand_frequency * role_relevance_weight)`.
- **Roadmap Generation**: for top-N missing skills, LLM generates an estimated learning time and suggested learning path (curated resource links — Phase 2 may use static curated database; Phase 3+ can use LLM-generated suggestions validated against a resource database).
- Recomputed whenever: resume re-analyzed, profile skills updated, or on a scheduled cadence (market demand shifts slowly, so daily/weekly recompute is sufficient).

**Database Entities**:
- `skill_demand_aggregates` (id, skill_id, role_category, demand_score, computed_at) — materialized view refreshed periodically
- `skill_gap_reports` (id, profile_id, missing_skills JSONB [{skill_id, demand_score, est_learning_hours, priority_rank}], generated_at)

**APIs**:
- `GET /skill-gap/report` (latest report)
- `POST /skill-gap/recompute` (manual trigger, rate-limited)

**Security Considerations**: Standard ownership checks; no sensitive data beyond profile skill data already governed under Module 2.

**Scaling Considerations**:
- `skill_demand_aggregates` is a materialized view over `internship_skills` × `internships` — refreshed via scheduled job, not computed per-request.
- Per-student reports cached and only recomputed on relevant triggers (event-driven).

---

## Module 10: Career Readiness Score

**Purpose**: Single composite metric communicating overall career preparedness, with transparent breakdown.

**Business Value**: Gamification/engagement driver ("78/100 → improve to 85"); also the headline number for college dashboards (cohort averages).

**User Interactions**: View score + breakdown on dashboard; track score history over time.

**Internal Logic**:
- Composite score = weighted sum of 5 normalized (0–100) sub-scores:
  - Resume Quality (from Module 3 `resume_score`)
  - Skill Demand Match (from Module 9 — inverse of gap severity)
  - Project Quality (from Module 3 `project_quality_avg`)
  - Interview Preparation (derived from Copilot engagement + interview log completeness, Module 8/7)
  - Application Activity (recency/frequency of applications, Module 7)
- Weights configurable per role-category (e.g., "Project Quality" weighted higher for SDE roles than for non-technical roles) — stored in config, not hardcoded, to allow tuning without redeploy.
- Recomputed on any sub-score-affecting event (resume re-analysis, new application, skill gap recompute) — event-driven (Part 4).

**Database Entities**:
- `career_scores` (id, profile_id, overall_score, sub_scores JSONB, weights_version, computed_at)
- `career_score_history` (append-only via time-partitioned table, or simply query `career_scores` ordered by `computed_at` if retained)

**APIs**:
- `GET /career-score`
- `GET /career-score/history`

**Security Considerations**: Standard ownership checks.

**Scaling Considerations**: Lightweight computation (aggregation of already-computed sub-scores); negligible scaling concern. Cached aggressively, invalidated on relevant events.

---

## Module 11: Analytics Engine

**Purpose**: Track and surface funnel metrics at individual (and future cohort) level.

**Business Value**: Powers personal insights ("your interview conversion is below average for your target role — here's why"), and is the foundation for College Dashboard (Module 15) and investor metrics.

**User Interactions**: View personal funnel (Application Funnel, Interview Conversion, Offer Conversion), performance reports.

**Internal Logic**:
- All user actions (search, view, apply-click, status-change, copilot-query) emitted as events to an event bus (Kafka/Kinesis/Redis Streams depending on scale tier — Part 4).
- Stream consumers aggregate into rollup tables: `funnel_daily_rollups`, `conversion_rates`.
- Personal Funnel = student's own events; (Phase 6) Cohort Funnel = aggregated across `tenant_id` with k-anonymity thresholds (no individual student data exposed to college admins).

**Database Entities**:
- `analytics_events` (id, profile_id, event_type, metadata JSONB, occurred_at) — high-volume, time-partitioned
- `funnel_rollups` (id, profile_id (nullable for cohort), tenant_id (nullable), period_start, period_end, searches, views, applications, interviews, offers, computed_at)

**APIs**:
- `GET /analytics/funnel?period=`
- `GET /analytics/reports/summary`
- Internal: event ingestion via event bus, not REST

**Security Considerations**:
- `analytics_events` contains behavioral data — access restricted to the owning user + aggregate-only access for tenant admins (k-anonymity enforced, e.g., minimum cohort size of 10 before any breakdown is shown).

**Scaling Considerations**:
- `analytics_events` is the highest-volume table in the system — time-partitioned (daily/weekly partitions), with rollups computed via streaming aggregation (not full-table scans).
- Rollup tables serve dashboard reads; raw events archived to cold storage (S3) after rollup, queryable via batch (Athena/BigQuery-style) for deep analysis if needed.

---

## Module 12: Success Prediction Engine

**Purpose**: Predict probability of interview/selection/offer for a given application based on profile + market signals.

**Business Value**: Helps students prioritize where to invest application effort (apply to high-probability-fit roles); premium analytics feature.

**User Interactions**: View predicted probabilities on internship detail pages and within tracker entries.

**Internal Logic**:
- Model inputs: student's skill match %, project quality score, resume score, role difficulty score, historical conversion rates for similar profile-archetype × role-category combinations (from `application_status_history` aggregates).
- **Phase 1–3**: heuristic/statistical model (logistic regression on aggregated features) — interpretable, fast to ship, no ML infra overhead.
- **Phase 4+**: upgrade to learned model (gradient boosted trees or similar) trained on accumulated outcome data, served via a model-serving endpoint; heuristic model remains as fallback.
- Predictions recomputed when application created or profile/resume materially changes.

**Database Entities**:
- `success_predictions` (id, application_id, p_interview, p_selection, p_offer, model_version, computed_at)
- `model_training_runs` (id, model_version, trained_at, metrics JSONB, dataset_snapshot_ref) — Phase 4+

**APIs**:
- `GET /applications/:id/prediction`
- `GET /internships/:id/prediction-preview` (pre-application estimate)

**Security Considerations**: Predictions are personal; ownership-checked. Model training datasets (Phase 4+) must be anonymized/aggregated before any export for offline training to avoid PII exposure in ML pipelines.

**Scaling Considerations**:
- Phase 1–3 heuristic computation is cheap, synchronous-capable.
- Phase 4+ model serving isolated as its own service with its own scaling profile (GPU/CPU inference nodes), decoupled from core API services.

---

## Module 13: Startup Discovery Engine

**Purpose**: Surface early-stage/hidden opportunities not present on mainstream job boards.

**Business Value**: Differentiation — "find opportunities no one else shows you"; lower competition = higher conversion for students, higher perceived value.

**User Interactions**: Filterable as a source-type within Discovery Feed ("Startup" badge); dedicated "Startup Opportunities" section.

**Internal Logic**:
- Specialized crawler adapters for: YC company directory/job board, AngelList-style listings, incubator/accelerator portfolio pages, startup career pages (often non-standard ATS-less HTML).
- Same normalization/dedup pipeline as Module 4, but with source-type tagging enabling separate freshness SLAs (startup career pages change unpredictably — higher crawl frequency for "watched" companies).
- Listings flagged `is_startup=true`, `funding_stage` (if discoverable), `team_size_estimate` (if discoverable).

**Database Entities**: Extends `internships` (Module 4) with additional columns: `is_startup`, `funding_stage`, `company_size_estimate`. New: `startup_company_profiles` (id, company_name, website, funding_stage, sector, last_enriched_at) — enrichment cache to avoid re-deriving per listing.

**APIs**: Reuses Module 4 APIs with `is_startup=true` filter; `GET /startups/:company/profile`.

**Security Considerations**: Same as Module 4 (compliance-first crawling, Part 8).

**Scaling Considerations**: Startup sources are long-tail (many low-traffic sites) — crawler scheduler (Part 8) must efficiently allocate crawl budget across thousands of low-yield sources without starving high-yield sources.

---

## Module 14: Notification Engine

**Purpose**: Timely, relevant, multi-channel alerts that drive the return habit loop.

**Business Value**: Primary retention lever; directly drives "Returning Student Journey" (Part 1, §5.2).

**User Interactions**: Receive email/push notifications; configure preferences (channel + category opt-in/out).

**Internal Logic**:
- Trigger sources (event-driven, Part 4): `recommendation.new_high_match`, `internship.deadline_approaching` (for saved/applied items), `interview.reminder` (from `follow_up_reminders`), `profile.incomplete_nudge` (scheduled, decreasing frequency over time to avoid spam).
- Notification Service consumes trigger events → checks user preferences (`notification_preferences`) → renders templated message → dispatches via appropriate channel adapter (Email: SES/SendGrid; Push: FCM/APNs; Future: WhatsApp Business API, Telegram Bot API, SMS via Twilio).
- Dispatch is queued and rate-limited per user (avoid notification fatigue — e.g., max 3 notifications/day unless urgent deadline category).

**Database Entities**:
- `notification_preferences` (id, profile_id, category, channel, enabled)
- `notifications` (id, profile_id, category, channel, content, status [queued|sent|failed|read], created_at, sent_at)
- `device_tokens` (id, profile_id, platform [ios|android|web], token, active)

**APIs**:
- `GET /notifications` (in-app inbox)
- `PATCH /notifications/:id/read`
- `GET /notification-preferences`, `PATCH /notification-preferences`
- `POST /devices/register` (push token registration)

**Security Considerations**: Email/SMS templates must not leak sensitive content in push previews (e.g., don't show specific rejection details in a lock-screen notification — summarize generically, details in-app only).

**Scaling Considerations**:
- Dispatch queue (separate from main event bus or a dedicated topic) with per-channel worker pools; channel-specific rate limits (e.g., FCM batch send limits) respected via batching.
- `notifications` table partitioned by time; old notifications archived/purged per retention policy.

---

## Module 15: College Dashboard

**Purpose**: Give placement cells visibility into cohort readiness and outcomes without exposing individual student data inappropriately.

**Business Value**: First major B2B revenue surface (Phase 6); also a powerful **acquisition channel** (colleges drive bulk student sign-ups).

**User Interactions**: View cohort-level: average Career Score, readiness distribution, application/interview/offer funnel, "students needing attention" (with consent-based opt-in for individual visibility).

**Internal Logic**:
- All dashboard queries scoped by `tenant_id` (the college) with row-level security.
- Aggregates use k-anonymity threshold (minimum N students per breakdown segment) to prevent re-identification.
- "Students needing attention" feature requires **explicit student opt-in** (consent flag) — without consent, only aggregate cohort data visible.

**Database Entities**:
- `tenants` (id, name, type [college|recruiter], plan_tier)
- `tenant_memberships` (id, tenant_id, profile_id, role, consent_individual_visibility BOOLEAN)
- Reuses `funnel_rollups` (Module 11) with `tenant_id` scoping.

**APIs**:
- `GET /college/dashboard/summary`
- `GET /college/dashboard/cohort-funnel`
- `GET /college/dashboard/students` (only returns individual data for consenting students)

**Security Considerations**: This module is the highest multi-tenancy risk surface — RLS policies on every query, automated tests verifying tenant isolation, audit log of every individual-student-data access by tenant admins.

**Scaling Considerations**: Read-heavy on rollup tables (already optimized in Module 11); dashboard queries cached per-tenant with short TTL (data doesn't need to be real-time-real-time).

---

## Module 16: Recruiter Dashboard (Future)

**Purpose**: Allow recruiters to post roles and discover pre-qualified candidates.

**Business Value**: Second major B2B revenue surface; closes the loop into a true marketplace (Phase 8).

**User Interactions**: Post opportunity, view ranked candidate matches, shortlist.

**Internal Logic**:
- Recruiter-posted roles flow into the same `internships` table (`source_type=recruiter_direct`), participating in the same recommendation pipeline (Module 6) — recruiters benefit from the same matching engine students do.
- "View Rankings" queries students who match the role (via Module 6's scoring logic, inverted: role → top-matching students) **only among students who have opted into recruiter visibility** (explicit consent, separate from college consent).

**Database Entities**:
- `recruiter_posted_roles` (extends `internships` with `tenant_id`, `posted_by`)
- `candidate_visibility_consent` (id, profile_id, visible_to_recruiters BOOLEAN, visible_fields JSONB)
- `shortlists` (id, tenant_id, internship_id, profile_id, status, created_at)

**APIs**:
- `POST /recruiter/roles`
- `GET /recruiter/roles/:id/candidates`
- `POST /recruiter/shortlists`

**Security Considerations**: Strictest consent model in the platform — candidate data exposed to recruiters is opt-in, field-level granular (student chooses what's visible: e.g., skills/score visible, contact info not, until student initiates contact).

**Scaling Considerations**: Candidate ranking queries are essentially Module 6 in reverse — reuse the same embedding/scoring infrastructure rather than building a parallel system.

---

*(Continue to Part 3: System & Microservice Architecture)*
