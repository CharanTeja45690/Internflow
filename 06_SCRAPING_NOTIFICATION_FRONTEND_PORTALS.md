# INTERNFLOW — MASTER ENGINEERING NOTEBOOK
## Part 6: Scraping, Notification, Frontend, Browser Extension, Recruiter & College Portal Architecture

---

## 24. Scraping Infrastructure Architecture

### 24.1 Source Discovery
- **Seed list**: manually curated initial set of high-value sources (top company career pages, major job boards with permissive ToS, YC company directory, known incubator portfolio pages).
- **Discovery jobs**: periodic crawl of college placement cell pages and aggregator sites to identify *new* company career page URLs (added to `sources_registry` as `pending_review` until compliance-reviewed).
- Every source goes through a **compliance review checklist** before activation (see §24.6).

### 24.2 Crawler Design
```
┌────────────────────────────────────────────────────────────┐
│                    Scraper Orchestrator                       │
│  Reads sources_registry → builds crawl schedule per source    │
└───────────────────┬──────────────────────────────────────────┘
                     │
        ┌────────────┼─────────────┬─────────────────┐
        ▼            ▼             ▼                 ▼
   ┌─────────┐  ┌─────────┐  ┌─────────┐       ┌─────────┐
   │ Worker 1 │  │ Worker 2 │  │ Worker 3 │ ...   │ Worker N │
   │ (Scrapy/ │  │ (Scrapy/ │  │(Playwright│       │          │
   │  HTTP)   │  │  HTTP)   │  │ for JS    │       │          │
   │          │  │          │  │ heavy)    │       │          │
   └────┬─────┘  └────┬─────┘  └────┬─────┘       └────┬─────┘
        └─────────────┴─────────────┴──────────────────┘
                            │
                  Raw HTML/JSON → Parser (source-specific adapter)
                            │
                  Structured Record → Cleaner → Deduplication
                            │
                  Internal Ingest API → Internship Service
                            │
                  Event: internship.ingested
```

### 24.3 Source Adapter Pattern
- Each source in `sources_registry` maps to an **adapter config**: CSS/XPath selectors or API endpoint + JSON path mappings, defined declaratively (YAML/JSON config, not hardcoded per-source code) where possible.
- For irregular sources (custom career pages), a **fallback LLM-based extraction** (Tier-2 model: "extract job title, description, deadline, location, stipend, requirements from this HTML text") handles long-tail sources without writing bespoke parsers for each — cost-justified because these sources are crawled infrequently.

### 24.4 Scheduler
- **Tiered crawl frequency** based on source value and volatility:
  - High-value, frequently-updated (major job boards): every 1–4 hours
  - Company career pages: daily
  - Long-tail startup sources: weekly, with adaptive frequency (sources that never yield new listings get demoted to monthly)
- Scheduler implemented as a priority queue; orchestrator pulls due sources, dispatches to worker pool with concurrency limits **per domain** (not just global) to respect per-site rate limits.

### 24.5 Deduplication Pipeline
```
New Record → Generate embedding (role_title + company_name + description summary)
           → ANN search against recent internships.embedding (same company_name, within ±7 day window)
           → If similarity > threshold:
                → Merge: add new source to internship_sources, update last_seen_at
           → Else:
                → Insert new internship record
```
- Exact-match fast path first (normalized `company_name` + `role_title` + `location` string match) before falling back to embedding similarity — reduces compute for the common case.

### 24.6 Compliance Considerations
- **robots.txt** checked and cached per source; sources disallowing crawling are not crawled (flagged `compliance_status='blocked'`).
- **Rate limiting**: per-domain request throttling (configurable, default conservative — e.g., 1 req/2sec per domain).
- **ToS review**: each source manually classified as `open_data` (public job board APIs, RSS feeds), `permitted_crawling` (career pages with no explicit prohibition), or `restricted` (requires partnership/API agreement — not crawled until formalized).
- **Data minimization**: only structured fields needed for the `internships` schema are extracted/stored; full raw HTML is **not** persisted long-term (only transient during parsing) — minimizes copyright exposure.
- **Attribution**: `internship_sources.source_url` always retained so students are directed to the original posting ("Apply" always links to source, never a copy).
- **Takedown process**: documented process for sources to request removal; `sources_registry.compliance_status` can be set to `removed_on_request`, triggering deactivation of associated listings.

---

## 25. Notification Architecture (Detailed)

### 25.1 Dispatch Pipeline
```
Trigger Event (event bus) → Notification Service
                                  │
                        Check notification_preferences
                                  │
                        Render template (category + channel specific)
                                  │
                        Enqueue to channel-specific dispatch queue
                                  │
              ┌───────────────────┼───────────────────┬─────────────────┐
              ▼                   ▼                   ▼                 ▼
        Email Worker         Push Worker          SMS Worker      WhatsApp Worker
        (SES/SendGrid)        (FCM/APNs)           (Twilio)        (Bus. API)
              │                   │                   │                 │
              └───────────────────┴───────────────────┴─────────────────┘
                                  │
                        Update notifications.status (sent/failed)
```

### 25.2 Rate Limiting & Batching
- Per-user daily cap (default 3 non-urgent notifications/day); urgent categories (deadline <24h, interview reminder) bypass cap but still deduplicated (don't send the same deadline reminder twice).
- Digest mode: "new matches" notifications batched into a daily digest rather than per-listing real-time pings, unless match score exceeds a "high priority" threshold.

### 25.3 Template Versioning
- Templates stored with `category + channel + locale` keys, versioned for A/B testing of notification copy/timing (future growth-team lever).

---

## 26. Frontend Architecture

### 26.1 Page Hierarchy
```
/                                  → Public landing page (SSR, SEO-optimized)
/internships                       → Public internship listing (SSR/ISR, SEO for organic discovery)
/internships/[id]                  → Public internship detail (SSR/ISR)
/auth/login, /auth/register        → Auth pages
/onboarding                         → Profile setup wizard (CSR, multi-step)
/dashboard                          → Main authenticated home (Career Score, feed preview, quick actions)
/feed                                → Full discovery feed with filters
/profile                            → Profile editor (sections: basic, education, skills, projects, certs, experience, links)
/resume                              → Resume upload + analysis results + score history
/tracker                             → Application tracker (Kanban)
/tracker/[applicationId]             → Application detail drawer/page
/copilot                             → AI Career Copilot chat
/copilot/[conversationId]            → Specific conversation
/skill-gap                           → Skill Gap Analyzer + roadmap
/career-score                        → Career Readiness Score breakdown + history
/analytics                           → Personal funnel & performance reports
/notifications                       → Notification inbox
/settings                            → Account, notification preferences, privacy/consent settings

-- Phase 6+ (Tenant Portals) --
/college/dashboard                   → College Dashboard (tenant-scoped)
/college/students                    → Cohort student list (consent-gated detail)
/recruiter/dashboard                 → Recruiter Dashboard
/recruiter/roles/new                 → Post opportunity
/recruiter/roles/[id]/candidates     → Ranked candidates
```

### 26.2 Routing Strategy
- Next.js App Router with route groups: `(public)`, `(auth)`, `(app)`, `(college)`, `(recruiter)` — each group has its own layout (e.g., `(college)` layout enforces `tenant_id` context and role check before rendering).
- Public pages (`/`, `/internships/**`) use SSR/ISR for SEO; authenticated `(app)` pages are primarily CSR with client-side data fetching (React Query/SWR) against the BFF/Gateway.

### 26.3 Component Architecture (Shadcn-based)
- **Layout components**: `AppShell` (nav + sidebar), `AuthGuard`, `TenantGuard`
- **Domain components**:
  - `ResumeUploadCard`, `ResumeScoreBreakdown`, `SkillMatrixDisplay`
  - `InternshipCard`, `InternshipDetailPanel`, `MatchScoreBadge`
  - `TrackerKanbanBoard`, `ApplicationDetailDrawer`, `StatusTimeline`
  - `CopilotChatWindow`, `CopilotMessageBubble`, `SourceCitationChip`
  - `CareerScoreGauge`, `SkillGapRoadmap`
  - `FunnelChart` (recharts-based), `ConversionRateCard`
- **Shared**: `FilterPanel`, `Pagination`, `NotificationBell`, `ConsentToggle`

### 26.4 State Management
- **Server state** (data from APIs): React Query/SWR — handles caching, revalidation, optimistic updates (e.g., dragging a tracker card optimistically updates UI before server confirmation).
- **Client/UI state** (modals, wizard step, filter selections): React Context + `useState`/`useReducer` per feature area — avoid global state libraries (Redux) unless complexity warrants it later.
- **Auth state**: JWT stored in httpOnly cookies (not localStorage) for XSS protection; auth context hydrated server-side for SSR pages.
- **Real-time state** (resume processing status, Copilot streaming): WebSocket/SSE connections managed via dedicated hooks (`useResumeProcessingStatus`, `useCopilotStream`).

---

## 27. Browser Extension Architecture (Phase 7)

### 27.1 Purpose
Auto-capture application submissions on external career sites, eliminating manual "Mark as Applied" entry — closing the data loop for Application Tracker and Analytics.

### 27.2 Architecture
```
Extension (Manifest V3)
  ├─ Content Script: detects form submission on known ATS platforms
  │     (Greenhouse, Lever, Workday, etc. — pattern-matched DOM signatures)
  ├─ Background Service Worker: 
  │     - Authenticates via shared session token (synced from web app login)
  │     - On detected submission, sends event to InternFlow API:
  │         POST /applications (auto-create with source=extension, company/role inferred from page)
  ├─ Popup UI:
  │     - Quick view of current page's match score (if it's a known internship)
  │     - Manual "Mark as Applied" fallback
  └─ Auto-fill (future): pre-fills common form fields from Universal Student Profile
```

### 27.3 Privacy & Security
- Extension only activates on a explicit allowlist of career/ATS domains — never reads arbitrary page content.
- Auto-fill feature requires explicit per-site user consent (not silently injecting personal data into arbitrary forms).
- All data transmission uses the same authenticated API as the web app (no separate credential storage).

---

## 28. Recruiter Portal Architecture (Phase 6+)

### 28.1 Core Flows
```
Recruiter Login (tenant_id = recruiter org)
  → Post Opportunity
       → Written to internships (source_type=recruiter_direct, tenant_id set)
       → Enters same recommendation pipeline (Module 6) as scraped listings
  → View Candidates
       → Query: students where candidate_visibility_consent.visible_to_recruiters = true
                 AND profile matches role (via Module 6 scoring, role→student direction)
       → Results show only `visible_fields` per student's consent settings
  → Shortlist
       → Creates shortlists row; triggers notification to student ("A recruiter is interested")
```

### 28.2 Tenant Isolation
- All recruiter-facing queries scoped by `tenant_id` via RLS (Part 4, §17).
- Recruiter cannot query candidates outside consent-visible pool — enforced at query layer (`WHERE visible_to_recruiters = true`), not just UI filtering.

---

## 29. College Portal Architecture (Phase 6)

### 29.1 Core Flows
```
College Admin Login (tenant_id = college)
  → Dashboard Summary
       → Aggregate career_scores, funnel_rollups WHERE tenant_id = college, k-anonymity enforced
  → Cohort Funnel
       → Time-series view of applications/interviews/offers across cohort
  → Student List (consent-gated)
       → Only students with tenant_memberships.consent_individual_visibility = true appear individually
       → Others contribute to aggregates only
```

### 29.2 Bulk Onboarding
- CSV import or SSO (Google Workspace for Education / SAML) for bulk student account creation under college `tenant_id` — reduces friction for B2B acquisition (Part 1, §5.3).

---

## 30. Future Marketplace Architecture (Phase 8 — Career Graph, Directional)

### 30.1 Concept
Phase 8 evolves InternFlow's bipartite (student↔internship) graph into a multi-sided graph: students, mentors, recruiters, and opportunities all as nodes with typed edges (mentorship, application, referral, endorsement).

### 30.2 Directional Architecture Notes
- `profile_skills`, `applications`, and `shortlists` already form the data backbone of this graph — Phase 8 primarily adds new edge types (`mentorship_relationships`, `referrals`, `endorsements`) rather than restructuring existing data.
- Graph queries (e.g., "find mentors who work at companies my target roles are from") may eventually warrant a graph database (Neo4j) as a read-replica/derived view, while Postgres remains the transactional source of truth — same pattern as the Phase 4 search index.
- Referral marketplace introduces a transactional/financial dimension (referral fees) — would require a new `Payments Service` with its own PCI-scope isolation, kept entirely separate from core data services.

---

*(Continue to Part 7: DevOps, Security, Testing)*
