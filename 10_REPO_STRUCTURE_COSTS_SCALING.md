# INTERNFLOW — MASTER ENGINEERING NOTEBOOK
## Part 10: Repository Structure, Tech Stack Justification, Cost Estimates & Scaling Strategy

---

## 45. Monorepo & Repository Structure

### 45.1 Monorepo Tooling
- **Turborepo** (or Nx) for JS/TS services + frontend; Python services (Resume workers, AI Service, Scrapers, Data Science) live in the same monorepo under `services/` with their own dependency management (Poetry/uv), orchestrated via Turborepo's task pipeline using thin wrapper scripts.
- Shared TypeScript types (DB schema types, event schemas, API contracts) generated from a single source of truth (e.g., Zod schemas / OpenAPI specs) in `packages/shared-types`.

### 45.2 Folder Structure
```
internflow/
├── apps/
│   ├── web/                          # Next.js frontend (student app + college/recruiter portals)
│   │   ├── app/
│   │   │   ├── (public)/
│   │   │   ├── (auth)/
│   │   │   ├── (app)/
│   │   │   ├── (college)/
│   │   │   └── (recruiter)/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── public/
│   └── browser-extension/            # Phase 7/Phase 5 — Manifest V3 extension
│       ├── src/content-scripts/
│       ├── src/background/
│       └── src/popup/
│
├── services/
│   ├── auth-service/                 # Node.js/Express — Module 1
│   ├── profile-service/              # Node.js/Express — Module 2
│   ├── internship-service/           # Node.js/Express — Module 4, 13
│   ├── application-service/          # Node.js/Express — Module 5, 7
│   ├── resume-service/               # Node.js (API) + Python workers — Module 3
│   │   ├── api/
│   │   └── workers/
│   │       ├── extraction/
│   │       ├── segmentation/
│   │       ├── skill_extraction/
│   │       ├── scoring/
│   │       └── embedding/
│   ├── ai-service/                   # Python (FastAPI) — Module 8, 9, 10, 12
│   │   ├── routers/
│   │   ├── rag/
│   │   ├── prompts/
│   │   ├── model_router/
│   │   └── providers/                # openai_client.py, ollama_client.py
│   ├── recommendation-service/       # Python (batch) + Node (API) — Module 6
│   │   ├── api/
│   │   └── batch/
│   ├── analytics-service/            # Python/Node + stream processor — Module 11
│   ├── notification-service/         # Node.js/Express — Module 14
│   ├── tenant-service/                # Node.js/Express — Module 15, 16 (Phase 6)
│   └── scraper-cluster/               # Python (Scrapy/Playwright) — Part 6
│       ├── orchestrator/
│       ├── adapters/                  # per-source adapter configs
│       └── workers/
│
├── packages/
│   ├── shared-types/                  # Zod/TS types shared across services + frontend
│   ├── event-schemas/                 # Versioned event payload schemas (Part 3 §12.3)
│   ├── ui-components/                 # Shared Shadcn-based component library
│   └── config/                        # Shared lint/tsconfig/prettier configs
│
├── infrastructure/
│   ├── terraform/
│   │   ├── modules/
│   │   └── environments/
│   │       ├── dev/
│   │       ├── staging/
│   │       └── production/
│   ├── k8s/                            # Kubernetes manifests (Phase 3+)
│   └── docker-compose.yml              # Local dev environment (all services)
│
├── db/
│   ├── migrations/                     # SQL migration files (Part 4 schema)
│   └── seeds/                          # Skill taxonomy seed, sources_registry seed
│
├── docs/
│   ├── prd/
│   ├── srs/
│   ├── hld/
│   ├── lld/
│   ├── runbooks/
│   └── traceability-matrix.xlsx
│
├── .github/
│   └── workflows/                      # CI/CD pipelines (Part 7 §31.1)
│
├── turbo.json
├── package.json
└── README.md
```

### 45.3 Service Independence Principles
- Each service in `services/` has its own `Dockerfile`, can be deployed independently, and has its own database migration namespace (logical schemas within the shared PostgreSQL instance initially — e.g., `auth.*`, `profile.*` — enabling future extraction to separate database instances per service without cross-cutting rework).

---

## 46. Technology Stack Justification

| Layer | Choice | Justification |
|---|---|---|
| Frontend Framework | Next.js + TypeScript | SSR/ISR for SEO on public internship pages (critical for organic growth); unified React ecosystem for both public marketing and authenticated app |
| UI Components | Tailwind + Shadcn UI | Fast iteration, accessible primitives, consistent design system without heavy custom CSS overhead |
| Backend (core services) | Node.js + Express | Team familiarity, large ecosystem, good fit for I/O-bound CRUD services (Auth, Profile, Internship, Application, Notification) |
| AI/ML Services | Python + FastAPI | Best ecosystem for ML/AI (LangChain-style RAG, embeddings, model serving), async-capable for streaming |
| Database | PostgreSQL + pgvector | Single database handles both relational and vector workloads at Phase 1–3 scale, reducing operational complexity vs running a separate vector DB from day one |
| Cache/Queue | Redis | Multi-purpose (cache, session store, pub/sub for streaming, queue backend for resume pipeline via BullMQ) — single technology covers multiple Phase 1–2 needs |
| Event Bus | Redis Streams → Kafka (Phase 4+) | Start simple (Redis already in stack), migrate only when volume justifies Kafka's operational overhead — abstraction layer (Part 3 §12.1) makes this low-risk |
| Object Storage | AWS S3 + Cloudinary | S3 for resumes/documents (access-controlled, signed URLs); Cloudinary for user avatars/images (transformation features) |
| AI Models | OpenAI (Tier 3) + Ollama/Llama/Qwen (Tier 1-2) | Hybrid balances quality (OpenAI for Copilot) with cost-at-scale (self-hosted for high-volume extraction) |
| Search | Postgres FTS → OpenSearch (Phase 4+) | Avoid premature infrastructure; Postgres FTS sufficient until inventory/query complexity demands dedicated search |
| Container Orchestration | ECS Fargate (Phase 1-2) → EKS (Phase 3+) | Lower ops overhead initially; migrate to Kubernetes when service count and scaling sophistication justify it |
| IaC | Terraform | Industry standard, multi-cloud portability, strong ecosystem |
| Monitoring | Prometheus/Grafana + Sentry + OpenTelemetry | Open-source-first stack keeps costs predictable at scale; OpenTelemetry avoids vendor lock-in for tracing |

---

## 47. Cost Estimates

### 47.1 Phase 1 (MVP, ~1,000–5,000 users)
| Item | Est. Monthly Cost (USD) |
|---|---|
| Compute (ECS Fargate, 4-6 small services) | $150–300 |
| PostgreSQL (RDS, small instance + pgvector) | $80–150 |
| Redis (ElastiCache, small) | $40–60 |
| S3 + CloudFront | $20–40 |
| Email (SES) | ~$5 (low volume) |
| Monitoring (Grafana Cloud free/small tier, Sentry free tier) | $0–30 |
| Domain/SSL | ~$2 |
| **Total** | **~$300–600/month** |

### 47.2 Phase 2–3 (~20,000–100,000 users, AI features live)
| Item | Est. Monthly Cost (USD) |
|---|---|
| Compute (more services, autoscaling) | $800–2,000 |
| PostgreSQL (larger instance, read replica) | $300–600 |
| Redis (larger, with persistence) | $150–300 |
| Self-hosted Ollama (GPU instances for Tier-1/2) | $500–1,500 (depends on GPU type/utilization) |
| OpenAI API (Tier-3, Copilot — usage-based) | $1,000–5,000 (highly dependent on Copilot adoption + conversation length controls) |
| S3 + CloudFront (more resumes, more traffic) | $100–300 |
| Notifications (SES + FCM, larger volume; SMS if used) | $50–300 |
| Monitoring/Observability (paid tiers) | $100–300 |
| **Total** | **~$3,000–10,000/month** |

### 47.3 Phase 4–5 (~500,000–1,000,000 users)
| Item | Est. Monthly Cost (USD) |
|---|---|
| Compute (Kubernetes/EKS, many services, autoscaled) | $5,000–15,000 |
| PostgreSQL (multi-AZ, read replicas, possibly sharded) | $2,000–6,000 |
| Redis cluster | $500–1,500 |
| Kafka (managed — MSK/Confluent) | $1,000–3,000 |
| Self-hosted AI infra (GPU fleet, larger) | $3,000–10,000 |
| OpenAI API (optimized via caching/routing) | $5,000–20,000 (cost-control mechanisms from Part 5 §18.3 critical here) |
| Search (OpenSearch managed) | $500–2,000 |
| S3/CDN (significant traffic) | $500–1,500 |
| Notifications (multi-channel, large volume) | $500–2,000 |
| Monitoring/Observability/Security tooling | $500–1,500 |
| **Total** | **~$19,000–62,000/month** |

> **Note**: AI inference cost (OpenAI especially) is the single largest variable and the primary lever for cost optimization at scale — the tiered model strategy (Part 5 §18) and conversation summarization (Part 5 §19.4) are not optional optimizations at this scale; they are load-bearing for unit economics.

---

## 48. Scaling Strategy: 100 Users → 1,000,000 Users

### 48.1 Stage: 100–1,000 users (Pre-Phase 1 / Early Pilot)
- Single-region deployment, single Postgres instance (no read replicas), all services on minimal Fargate tasks (1 instance each, no autoscaling needed).
- AI: Tier-3 (OpenAI) only for Copilot if Phase 3 features are even live this early; resume pipeline can run synchronously in early pilots if volume is low enough (<100 uploads/day).
- Manual scraper runs (cron-triggered, not yet a "cluster").

### 48.2 Stage: 1,000–20,000 users (Phase 1–2)
- Introduce autoscaling on stateless services (min 1, max 3 instances) based on CPU/request count.
- Postgres: vertical scaling (larger instance) sufficient; add a read replica for analytics/reporting queries to isolate from transactional load.
- Resume pipeline becomes properly async (queue-based) — this is the first hard scaling requirement (Part 5 §20.4).
- Recommendation batch job: nightly, single-node, processes all profiles sequentially — fine at this scale.

### 48.3 Stage: 20,000–100,000 users (Phase 2–3)
- Introduce Redis-based caching aggressively (Part 3 §13) — profile reads, feed reads now cache-first.
- Recommendation batch job: shard by `profile_id` hash across multiple worker instances (Part 5 §21.2) — single-node nightly batch starts becoming a bottleneck around this range.
- Self-hosted Ollama infrastructure introduced (Phase 2 dependency) — GPU instance(s), autoscaled based on queue depth.
- Database: connection pooling (PgBouncer) becomes necessary as service instance count grows (each instance otherwise holds its own connection pool, multiplying total connections).
- Event bus: Redis Streams handles this volume comfortably; monitor `analytics_events` growth rate as the leading indicator for Kafka migration timing.

### 48.4 Stage: 100,000–500,000 users (Phase 3–4)
- Database: consider read replicas per major read-heavy domain (Internship search, Analytics rollups) to distribute load; `analytics_events` and `application_status_history` partitioning (Part 4 §16) becomes operationally important, not just "nice to have."
- Search: migrate to OpenSearch if Postgres FTS query latency degrades under combined filter+full-text load (Part 5 §23.2).
- Event bus: migrate to Kafka if Redis Streams consumer lag becomes persistent under burst loads (e.g., large scraper ingestion batches) — Part 9 §42.2.
- Kubernetes (EKS) migration from Fargate — more services, more nuanced autoscaling/scheduling needs.
- AI: introduce request-level caching for common Copilot query patterns (e.g., "why am I getting rejected" with similar profile archetypes might share cacheable sub-responses for the generic-advice portion, though personalized portions remain dynamic) — careful design needed to avoid genericizing responses (trust risk, Part 9 §41.5).

### 48.5 Stage: 500,000–1,000,000 users (Phase 4–5 and beyond)
- Database sharding/partitioning by `tenant_id` or `profile_id` range becomes a live discussion — likely starting with **functional partitioning** (separate database instances per service domain, e.g., Analytics gets its own Postgres instance) before resorting to horizontal sharding of any single domain.
- Vector search: evaluate dedicated vector database (Qdrant/Pinecone/Weaviate) if pgvector ANN performance at >5-10M embedding rows (resumes + internships combined) degrades beyond acceptable recommendation-latency budgets (Part 5 §21.2 note).
- Multi-region consideration: if user base becomes geographically distributed (e.g., India + SEA + global expansion), introduce regional read replicas / regional deployments with data residency considerations (especially relevant given DPDP Act / GDPR — Part 7 §32.3).
- AI cost optimization becomes a dedicated workstream: fine-tuning smaller open models on InternFlow's accumulated conversation/resume data (Phase 4+ `model_training_runs` infrastructure, Part 4 §15.6) to reduce Tier-3 dependency for increasingly large categories of Copilot queries.
- College/Recruiter portals (Phase 6, beyond this roadmap's Phase 5 cutoff) introduce true multi-tenant scale considerations — but because RLS and `tenant_id` columns were designed in from Phase 1 (Part 4 §17, NFR-6.1/6.2), this scaling stage does not require retroactive schema migration, only activation of dashboards and tenant-scoped query paths.

### 48.6 Guiding Principle Across All Stages
**Every scaling decision in this notebook follows the same pattern**: design the schema/event/abstraction correctly from Phase 1 (even if the "scaled" component — Kafka, OpenSearch, sharded DB, dedicated vector DB — isn't deployed yet), so that scaling transitions are **infrastructure swaps behind stable interfaces**, not architectural rewrites. This is what allows InternFlow to credibly claim "designed for 1M users" while still shipping a lean Phase 1 MVP in 10-12 weeks.

---

## 49. Closing Summary

This master engineering notebook covers Phases 1–5 of InternFlow's evolution from a Career Discovery MVP to a Career Ecosystem, with:
- 16 fully-specified modules (Part 2)
- A complete, partitioned, multi-tenant-ready database schema (Part 4)
- Hybrid AI architecture balancing cost and quality (Part 5)
- Compliance-first scraping infrastructure (Part 6)
- Production-grade DevOps, security, and testing strategy (Part 7)
- Full documentation suite and operational runbooks (Part 8)
- Detailed phase-by-phase roadmap with team sizing, timelines, and risk analysis (Part 9)
- Repository structure, technology justification, cost modeling, and a concrete 100→1M user scaling path (Part 10)

This notebook is intended as a living document — updated as architectural decisions are made (per the HLD Review Checklist, Part 8 §36) — and as the primary reference for engineering onboarding, investor technical due diligence, and incubation program submissions.

---

**END OF MASTER ENGINEERING NOTEBOOK — INTERNFLOW v1.0**
