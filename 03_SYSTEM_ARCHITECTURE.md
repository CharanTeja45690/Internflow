# INTERNFLOW — MASTER ENGINEERING NOTEBOOK
## Part 3: System Architecture, Microservices & Event-Driven Architecture

---

## 9. Service Boundaries (Design Rationale)

Service boundaries are drawn along **data ownership** and **scaling-profile** lines, not arbitrary feature lines:

| Boundary Principle | Application |
|---|---|
| Services that own distinct data domains are separate | Profile vs Internships vs Applications vs Notifications |
| Services with different scaling profiles are separate | AI/Resume processing (GPU/queue-heavy) vs Auth (low-latency, stateless) vs Scraping (scheduled, bursty) |
| Services with different compliance/security tiers are separate | Resume/PII handling isolated from general Internship data |
| Services that will be exposed to external tenants are separate from internal-only services | College/Recruiter-facing APIs vs internal ingest APIs |

---

## 10. System Architecture (High-Level)

```
                              ┌─────────────────────────────┐
                              │        CLIENTS               │
                              │  Web (Next.js)  Mobile (PWA)  │
                              │  Browser Extension (Ph.7)     │
                              └──────────────┬────────────────┘
                                              │ HTTPS
                                   ┌──────────▼───────────┐
                                   │   API Gateway / BFF    │
                                   │ (Auth, rate limit,     │
                                   │  routing, GraphQL/REST)│
                                   └──────────┬────────────┘
            ┌───────────────┬─────────────────┼─────────────────┬───────────────────┐
            │               │                 │                 │                    │
   ┌────────▼──────┐ ┌──────▼──────┐  ┌───────▼───────┐ ┌───────▼────────┐  ┌────────▼────────┐
   │ Auth Service   │ │ Profile Svc │  │ Internship Svc │ │ Application Svc │  │ AI Service       │
   │ (Module 1)     │ │ (Module 2)  │  │ (Module 4,13)  │ │ (Module 5,7)    │  │ (Module 3,8,9,12)│
   └────────────────┘ └─────────────┘  └────────────────┘ └─────────────────┘  └──────────────────┘
            │               │                 │                 │                    │
   ┌────────▼──────┐ ┌──────▼──────┐  ┌───────▼───────┐ ┌───────▼────────┐  ┌────────▼────────┐
   │ Notification   │ │ Recommendation│ │ Analytics Svc │ │ Scraper Cluster │  │ AI/LLM Layer     │
   │ Svc (Module 14)│ │ Svc (Module 6)│ │ (Module 11)   │ │ (Part 8)        │  │ (OpenAI/Ollama)  │
   └────────────────┘ └───────────────┘ └────────────────┘ └─────────────────┘  └──────────────────┘

                                   ┌─────────────────────────┐
                                   │       EVENT BUS           │
                                   │  (Kafka / Redis Streams)  │
                                   └─────────────────────────┘
                                              │
                ┌─────────────────────────────┼─────────────────────────────┐
        ┌───────▼────────┐          ┌─────────▼─────────┐          ┌─────────▼─────────┐
        │  PostgreSQL      │          │  Redis (cache +    │          │  S3 / Cloudinary   │
        │  + pgvector      │          │  queues + pub/sub) │          │  (resumes, assets) │
        └──────────────────┘          └────────────────────┘          └────────────────────┘
```

### 10.1 Architectural Layers
1. **Client Layer**: Next.js (SSR/ISR for SEO on public internship listings + CSR for app dashboard), PWA-capable for mobile-like experience without separate native app initially.
2. **API Gateway / BFF Layer**: Single entry point — handles JWT verification, rate limiting, request routing to backend services, and response shaping (GraphQL or REST aggregation) so the frontend doesn't need to know about service topology.
3. **Core Services Layer**: Domain-bounded microservices (detailed in §11).
4. **AI Layer**: Dedicated orchestration service abstracting LLM providers (OpenAI for high-value reasoning, Ollama-hosted Llama/Qwen for high-volume extraction/scoring) — Part 6.
5. **Data Layer**: PostgreSQL (primary OLTP + pgvector for embeddings), Redis (cache, session store, queues, pub/sub for real-time features), S3/Cloudinary (file storage).
6. **Event Layer**: Event bus connecting services for async workflows (resume processing, recommendation recompute, notifications, analytics).
7. **External Layer**: Source websites (scraping targets), OAuth providers, email/push providers.

---

## 11. Microservice Architecture (Detailed)

### 11.1 Service Inventory

| Service | Owns Data | Primary Tech | Scaling Profile |
|---|---|---|---|
| **Auth Service** | users, roles, sessions | Node.js/Express | Stateless, low-latency, high concurrency |
| **Profile Service** | profiles, education, skills, projects, certifications, experience, links | Node.js/Express | Read-heavy, cache-friendly |
| **Internship Service** | internships, internship_sources, sources_registry, internship_skills | Node.js/Express | Read-heavy (search), write via internal ingest only |
| **Application Service** | applications, status_history, notes, interview_logs, reminders | Node.js/Express | Moderate read/write, append-heavy history |
| **Resume Service** | resume_uploads, resume_analyses, resume_score_history | Node.js (API) + Python (workers) | Async/queue-heavy, CPU/GPU for parsing+embeddings |
| **AI Service** | copilot_conversations, copilot_messages, skill_gap_reports, career_scores, success_predictions | Python (FastAPI) | LLM-call-bound, streaming, variable latency |
| **Recommendation Service** | recommendations_cache, recommendation_feedback | Python (batch) + Node (API) | Batch-heavy (nightly), incremental event-driven |
| **Scraper Cluster** | (writes to Internship Service via internal API/event) | Python (Scrapy/Playwright) | Scheduled, bursty, horizontally shardable by source |
| **Analytics Service** | analytics_events, funnel_rollups | Python/Node + stream processor | Highest write volume, stream-processing |
| **Notification Service** | notification_preferences, notifications, device_tokens | Node.js/Express | Queue-consumer, channel-adapter pattern |
| **Tenant/College/Recruiter Service** (Phase 6) | tenants, tenant_memberships, consent records | Node.js/Express | Low volume initially, strict RLS |

### 11.2 Inter-Service Communication Patterns

| Pattern | Used For | Examples |
|---|---|---|
| **Synchronous REST (via Gateway)** | User-facing request/response | Frontend → Profile Service (get profile) |
| **Synchronous service-to-service (internal network)** | Real-time data needs within a request | Application Service → Internship Service (fetch internship details for a tracker entry) |
| **Asynchronous events (event bus)** | Cross-service side effects, decoupling | `resume.analyzed` → Recommendation Service, Career Score recompute, Notification |
| **Scheduled batch jobs** | Nightly recomputation | Recommendation Service nightly precompute, Skill Demand aggregate refresh |
| **Internal ingest API** | Scraper → Internship Service | `POST /internal/internships/ingest` |

### 11.3 Service Communication Diagram (Key Flows)

**Resume Upload Flow**:
```
Client → Gateway → Resume Service (API: create upload, store to S3, enqueue job)
                         │
                         ▼ (queue)
                  Resume Worker Pool
                         │
                  [extract → segment → extract skills → score → embed]
                         │
                         ▼ (DB write: resume_analyses)
                         ▼ (event: resume.analyzed)
        ┌────────────────┼────────────────────┬──────────────────────┐
        ▼                ▼                    ▼                      ▼
Recommendation Svc   Career Score (AI Svc)  Skill Gap (AI Svc)   Notification Svc
(recompute feed)     (recompute score)      (recompute report)   ("Resume analyzed!")
```

**Application Status Change Flow**:
```
Client → Gateway → Application Service (PATCH status)
                         │
              [write applications + status_history]
                         │
                         ▼ (event: application.status_changed)
        ┌────────────────┼────────────────────┐
        ▼                ▼                    ▼
Analytics Service   Success Prediction    Career Score
(funnel rollup)     (recompute p_offer)   (recompute activity sub-score)
```

---

## 12. Event-Driven Architecture (Detailed)

### 12.1 Technology Choice
- **Primary event bus**: Redis Streams for Phase 1–2 (simpler ops, sufficient for <100K users), with a migration path to **Kafka** at Phase 4+ when event volume (especially `analytics_events`) exceeds Redis Streams' comfortable throughput and multi-consumer-group requirements grow.
- Event bus topics are designed identically regardless of underlying tech (abstraction layer in each service) to make the Redis→Kafka migration non-breaking.

### 12.2 Core Event Catalog

| Event | Producer | Consumers | Payload Summary |
|---|---|---|---|
| `user.registered` | Auth Service | Profile Service (init empty profile), Notification Service (welcome email) | user_id, email, tenant_id |
| `resume.uploaded` | Resume Service | (internal — triggers worker) | upload_id, profile_id, s3_key |
| `resume.analyzed` | Resume Service | Recommendation Service, AI Service (Career Score, Skill Gap), Notification Service | profile_id, resume_analysis_id, resume_score |
| `profile.updated` | Profile Service | Recommendation Service, AI Service (Career Score) | profile_id, changed_fields |
| `internship.ingested` | Internship Service (from Scraper) | Recommendation Service (candidate pool update), Skill Gap aggregates job (signals refresh needed) | internship_id, skills_required |
| `internship.deadline_approaching` | Scheduled job (Internship Service) | Notification Service | internship_id, profile_ids[] (saved/applied) |
| `application.created` | Application Service | Analytics, Success Prediction, Career Score | application_id, profile_id, internship_id |
| `application.status_changed` | Application Service | Analytics, Success Prediction, Career Score, Notification (milestone celebration) | application_id, old_status, new_status |
| `recommendation.computed` | Recommendation Service | Notification Service (if high-match new listing) | profile_id, top_matches[] |
| `copilot.message_sent` | AI Service | Analytics (engagement tracking) | profile_id, conversation_id |

### 12.3 Event Schema Standards
- All events follow a CloudEvents-inspired envelope:
```json
{
  "event_id": "uuid",
  "event_type": "resume.analyzed",
  "tenant_id": "uuid|null",
  "profile_id": "uuid",
  "occurred_at": "ISO8601",
  "payload": { ... },
  "schema_version": "1.0"
}
```
- `schema_version` enables consumers to handle multiple payload versions during rolling deploys — critical for zero-downtime evolution at scale.

### 12.4 Reliability Patterns
- **At-least-once delivery** assumed; all consumers are **idempotent** (e.g., recomputation jobs key on `(profile_id, model_version)` and overwrite rather than append where appropriate).
- **Dead-letter handling**: events that fail processing after N retries route to a DLQ topic, monitored via DevOps alerting (Part 12).
- **Outbox pattern**: services that need to atomically update their DB and emit an event use a transactional outbox table, with a relay process publishing to the event bus — prevents "DB updated but event lost" inconsistencies.

---

## 13. Caching Strategy Overview (Cross-Service)

| Cache | Tech | TTL/Invalidation | Purpose |
|---|---|---|---|
| Session/JWT validation | Redis | TTL = token expiry | Avoid DB hit per authenticated request |
| Profile object | Redis | Invalidate on write | Profile read on nearly every page |
| Discovery feed (recommendations) | Redis | Refresh on `resume.analyzed`/`profile.updated`/nightly batch | Fast feed loads |
| Internship search results | Redis (short TTL) or search index | TTL ~5min for popular queries | Reduce DB load on hot searches |
| Skill taxonomy | In-memory per service instance | Refresh every N hours | Tiny, read-heavy, rarely changes |
| Career Score | Redis | Invalidate on recompute events | Dashboard headline metric |

---

*(Continue to Part 4: Database Design)*
