# INTERNFLOW — MASTER ENGINEERING NOTEBOOK
## Part 1: User Personas, Journey Maps, Flows & Requirements

---

## 4. User Personas (Detailed)

### 4.1 Persona: Student (Primary)
- **Demographics**: 18–24, undergraduate/postgraduate, engineering/management/design/commerce
- **Goals**: Land relevant internships → convert to full-time offers; minimize wasted effort on irrelevant applications
- **Pain points**: Information overload, no feedback on rejections, repetitive forms, unclear skill priorities
- **Technical comfort**: High (mobile-first, expects instant feedback, used to ChatGPT-like interfaces)
- **Key features used**: Profile, Resume Analysis, Discovery Feed, Apply, Tracker, Copilot, Skill Gap, Career Score
- **Success metric**: Career Readiness Score increase + offer received

### 4.2 Persona: College / Placement Cell (B2B — Phase 6)
- **Demographics**: Training & Placement Officers (TPOs), career services staff
- **Goals**: Improve placement %, demonstrate ROI to management, reduce manual tracking effort
- **Pain points**: Spreadsheet-based tracking, no visibility into student readiness until too late
- **Key features used**: College Dashboard (Module 15) — cohort analytics, readiness distribution, placement funnel
- **Success metric**: Cohort placement rate, time saved on reporting

### 4.3 Persona: Recruiter (B2B — Phase 6+)
- **Demographics**: HR/Talent acquisition at startups and mid-size companies
- **Goals**: Find pre-screened, skill-matched candidates faster than traditional job boards
- **Pain points**: High volume of unqualified applicants, no structured skill data
- **Key features used**: Recruiter Dashboard (Module 16) — post roles, view rankings, shortlist via match scores
- **Success metric**: Time-to-shortlist, quality of shortlisted candidates

### 4.4 Persona: Mentor (Phase 5)
- **Demographics**: Alumni, senior professionals, volunteers
- **Goals**: Guide students with real-world context that AI alone can't provide
- **Key features used**: Mentorship matching, community discussions, interview experience sharing
- **Success metric**: Mentee outcome improvement, engagement frequency

### 4.5 Persona: Startup (Module 13 beneficiary)
- **Demographics**: Early-stage companies (seed–Series B), often without dedicated HR
- **Goals**: Access motivated student talent without competing on brand recognition
- **Pain points**: Can't afford premium job board placements, low visibility
- **Key features used**: Startup Discovery Engine surfaces their roles to students automatically (web presence based); future self-serve posting (Module 16 extension)

---

## 5. User Journey Maps

### 5.1 New Student Journey (Detailed, with emotional states)

| Stage | Student Action | System Response | Emotional State | Risk if Missing |
|---|---|---|---|---|
| Awareness | Discovers InternFlow via college, social, referral | Landing page communicates "Career OS" positioning | Curious, skeptical | Low conversion if value unclear |
| Registration | Signs up via email or Google | JWT issued, account created, role=Student | Low friction expected | Drop-off if form is long |
| Profile Creation | Enters education, skills (or skips) | Profile Service stores structured data | Slightly impatient | Drop-off if mandatory fields excessive |
| Resume Upload | Uploads existing resume (PDF/DOCX) | Resume Intelligence Engine triggers async pipeline | Hopeful — "will this actually help?" | If processing >30s without feedback, perceived as broken |
| Resume Analysis Reveal | Views Resume Score, Skill Matrix | Dashboard renders score + breakdown | "Wow" moment if insightful, "meh" if generic | Critical activation moment — must feel personalized |
| Career Profile Generated | System computes initial Career Readiness Score | Recommendation Engine cold-starts from resume embeddings | Engaged | Cold-start failure → irrelevant first feed = churn |
| First Feed | Views personalized internship recommendations | Discovery + Recommendation modules combine | Evaluating relevance | Poor match quality in first session is the #1 churn risk |
| Apply | Clicks through to apply (direct link) | Application Tracker auto-creates "Saved/Applied" entry (manual or extension) | Action-oriented | If tracker requires too much manual entry, abandoned |
| Track | Updates status as process progresses | Pipeline view updates; analytics aggregate | Returning habit forming | — |
| Guidance Loop | Asks Copilot "why am I not getting interviews?" | RAG pipeline grounds answer in resume + application history + market data | Trust-building or trust-breaking | Hallucinated/generic advice destroys trust permanently |
| Improvement | Follows skill gap roadmap, updates resume | Resume re-analyzed, score updates | Motivated | — |
| Outcome | Gets interview/offer, updates tracker | Analytics + Success Prediction model retrains signal | Delighted, advocates | — |

### 5.2 Returning Student Journey (Habit Loop)
```
Push/Email Notification (new match, deadline, profile incomplete)
  → Open App
    → Dashboard (Career Score delta shown)
      → Feed (new recommendations since last visit)
        → Apply / Update Tracker
          → Copilot check-in (optional)
            → Close app
              → (Notification Engine schedules next trigger)
```

### 5.3 College Onboarding Journey (B2B, Phase 6)
```
TPO Contacted (sales/partnership)
  → College Tenant Provisioned (tenant_id created)
    → Bulk Student Invite (CSV import or SSO)
      → Students Register under College Tenant
        → TPO views College Dashboard (cohort readiness, placement funnel)
          → TPO exports reports for management review
```

---

## 6. User Flows (Screen-Level)

### 6.1 Core Onboarding Flow
```
[Landing Page]
   ├─ "Sign in with Google" → [OAuth Consent] → [Profile Setup Wizard]
   └─ "Sign up with Email" → [Email/Password Form] → [Email Verification] → [Profile Setup Wizard]

[Profile Setup Wizard] (steps, each skippable except name/education level)
   Step 1: Basic Info (Name, College, Degree, Year, Branch)
   Step 2: Skills (tag input, autocomplete from skill taxonomy)
   Step 3: Resume Upload (drag-drop, PDF/DOCX)
   Step 4: Preferences (roles interested in, locations, remote/onsite)
   → [Processing Screen] (async resume pipeline status via WebSocket/polling)
   → [Dashboard] (Career Score reveal animation, first recommendations)
```

### 6.2 Discovery & Apply Flow
```
[Dashboard]
  → [Discovery Feed]
       Filters: Role type, Location, Stipend range, Deadline, Difficulty Score, Source
       Each card shows: Company, Role, Match %, Deadline, Apply Link
       → [Internship Detail Page]
            Sections: Description, Requirements, Skill Match Breakdown, Similar Opportunities
            CTA: "Apply on Company Site" (external link, opens new tab)
            Secondary CTA: "Mark as Applied" → adds to Tracker (status=Applied)
```

### 6.3 Application Tracker Flow
```
[Tracker — Kanban View]
  Columns: Saved | Applied | Assessment | Interview | Offer | Rejected | Joined
  → Drag card between columns (status update, triggers analytics event)
  → Click card → [Application Detail Drawer]
       - Notes (free text)
       - Interview Log (date, round, feedback)
       - Follow-up reminders (creates Notification)
       - Status History Timeline
```

### 6.4 AI Career Copilot Flow
```
[Copilot Chat Interface]
  → User types question
    → Frontend sends query + conversation context to AI Service
       → AI Service retrieves context (RAG):
            - Student profile + resume embeddings (pgvector)
            - Recent application history
            - Relevant internship/skill corpus chunks
       → LLM generates grounded response with inline references
    → Response streamed to UI (token streaming)
    → Suggested follow-up actions rendered (e.g., "View skill roadmap", "See matching internships")
```

### 6.5 Skill Gap & Readiness Flow
```
[Career Score Page]
  Displays: Overall Score (e.g., 78/100), breakdown by component
    (Resume Quality, Skill Demand Match, Project Quality, Interview Prep, Application Activity)
  → [Skill Gap Analyzer Tab]
       Shows: Missing Skills (ranked by market demand), Learning Roadmap, Est. time to close gap
       → Each skill → links to recommended free resources (curated/affiliate, future)
```

---

## 7. Functional Requirements (FR)

### 7.1 Authentication & Profile
- FR-1.1: Users can register via email/password or Google OAuth
- FR-1.2: Passwords stored with bcrypt/argon2 hashing; never plaintext
- FR-1.3: JWT access tokens (short-lived) + refresh tokens (long-lived, rotatable)
- FR-1.4: Users can edit profile fields without re-entering existing data
- FR-1.5: Profile supports multiple education entries, multiple experience entries

### 7.2 Resume Intelligence
- FR-2.1: System accepts PDF and DOCX resume uploads up to 10MB
- FR-2.2: System extracts text, identifies sections (Education, Experience, Projects, Skills, Certifications)
- FR-2.3: System generates a Resume Score (0–100) with sub-scores
- FR-2.4: System extracts a normalized Skill Matrix mapped to a canonical skill taxonomy
- FR-2.5: Re-upload triggers re-analysis and score history is retained

### 7.3 Discovery & Apply
- FR-3.1: System aggregates internships from multiple sources into a unified schema
- FR-3.2: Listings are deduplicated across sources (same role from same company posted on multiple boards)
- FR-3.3: Users can filter/search by role, location, stipend, deadline, difficulty
- FR-3.4: Each listing shows a Match % computed against the user's profile
- FR-3.5: "Apply" redirects to the original source (no scraped-content republishing beyond fair-use snippets)

### 7.4 Recommendation
- FR-4.1: System generates a personalized feed ranked by match score + recency + deadline urgency
- FR-4.2: Cold-start users (no application history) receive resume-embedding-based recommendations
- FR-4.3: Recommendations update as profile/resume/application history changes

### 7.5 Application Tracking
- FR-5.1: Users can manually add/move applications through pipeline stages
- FR-5.2: Each application supports notes, interview logs, and follow-up reminders
- FR-5.3: Status changes are timestamped and retained as history

### 7.6 AI Career Copilot
- FR-6.1: Users can ask free-form career questions
- FR-6.2: Responses are grounded in the user's own data (RAG) — no generic advice without context
- FR-6.3: Copilot can reference specific internships, skills, and application history in responses
- FR-6.4: Conversation history is persisted per user

### 7.7 Skill Gap & Career Score
- FR-7.1: System computes Career Readiness Score from 5 weighted components
- FR-7.2: System identifies missing skills ranked by market demand frequency (derived from internship corpus)
- FR-7.3: System generates a learning roadmap with estimated time per skill

### 7.8 Analytics
- FR-8.1: System tracks funnel events (search → view → apply → status changes)
- FR-8.2: Users see personal funnel; (future) colleges see cohort funnels
- FR-8.3: Success Prediction Engine outputs probability scores for interview/selection/offer per application

### 7.9 Notifications
- FR-9.1: System sends email + push notifications for new matches, deadlines, interview reminders, incomplete profile nudges
- FR-9.2: Users can configure notification preferences per channel/category

### 7.10 Internship & Startup Discovery (Backend)
- FR-10.1: Scraping infrastructure ingests from career pages, job boards, startup sources, YC/incubator listings
- FR-10.2: All ingested data is normalized into the canonical Internship schema
- FR-10.3: Listings expire automatically based on deadline or staleness detection

---

## 8. Non-Functional Requirements (NFR)

### 8.1 Performance
- NFR-1.1: P95 API response time < 300ms for read endpoints under normal load
- NFR-1.2: Resume processing pipeline completes within 30s for 95% of uploads (async, with progress feedback)
- NFR-1.3: Discovery feed loads within 1s (cached/pre-computed recommendations)
- NFR-1.4: Copilot first-token latency < 2s (streaming)

### 8.2 Scalability
- NFR-2.1: Architecture supports horizontal scaling of stateless services (API, AI workers, scrapers)
- NFR-2.2: Database designed with partitioning strategy supporting 100K → 1M users without schema redesign
- NFR-2.3: Recommendation precomputation runs as scheduled batch + on-demand incremental updates, decoupled from request path

### 8.3 Availability & Reliability
- NFR-3.1: 99.9% uptime target for core student-facing services (Auth, Profile, Discovery, Tracker)
- NFR-3.2: AI Copilot degradation (LLM provider outage) falls back gracefully (cached responses / "try again" with non-blocking UX)
- NFR-3.3: Scraping infrastructure failures isolated — must not impact student-facing read paths (read from pre-ingested DB, not live scrape)

### 8.4 Security & Privacy
- NFR-4.1: All PII encrypted at rest (AES-256) and in transit (TLS 1.3)
- NFR-4.2: Resume files stored in access-controlled object storage with signed, time-limited URLs
- NFR-4.3: Role-based access control (RBAC) enforced at API gateway and service layer
- NFR-4.4: Audit logs for all data access to sensitive resources (resumes, profile exports)
- NFR-4.5: Compliance posture aligned with applicable data protection regulations (India DPDP Act, GDPR-readiness for global expansion)

### 8.5 Maintainability
- NFR-5.1: Monorepo with clearly bounded service contexts (Part 5: Microservices)
- NFR-5.2: All services expose OpenAPI specs; contract testing between services
- NFR-5.3: Infrastructure as Code (IaC) for all environments

### 8.6 Multi-Tenancy (Future-Proofing)
- NFR-6.1: Database schema includes `tenant_id` on relevant tables from Phase 1, even though tenant UIs ship in Phase 6
- NFR-6.2: Row-level security (RLS) policies designed to enforce tenant isolation at the database layer

### 8.7 Compliance (Scraping)
- NFR-7.1: All scraping respects robots.txt and per-source rate limits
- NFR-7.2: System maintains a source registry with ToS review status, refresh frequency, and legal classification (open data / API partnership / restricted)
- NFR-7.3: Scraped content stored as structured metadata (not full-page reproduction) to minimize copyright exposure

---

*(Continue to Part 2: Feature & Module Breakdown)*
