# INTERNFLOW — MASTER ENGINEERING NOTEBOOK
## Part 7: DevOps, Security & Testing Strategy

---

## 31. DevOps Design

### 31.1 CI/CD Pipeline
```
Developer Push → GitHub
    │
    ▼
GitHub Actions:
    1. Lint + Type Check (per affected package, using monorepo change detection)
    2. Unit Tests (per service)
    3. Build Docker images (tagged with git SHA)
    4. Integration Tests (docker-compose spin-up of dependent services + test DB)
    5. Push images to container registry (ECR/GHCR)
    │
    ▼
CD (per environment):
    - dev: auto-deploy on merge to `develop`
    - staging: auto-deploy on merge to `main`, runs E2E suite
    - production: manual approval gate → blue-green or rolling deploy
```

- **Monorepo-aware**: CI uses path-based filters (e.g., Turborepo/Nx) so only affected services rebuild/retest on each PR — critical as the number of services grows.
- **Database migrations**: run as a separate, gated CI step (e.g., via Prisma/Knex migrations) with automatic rollback scripts generated alongside each migration.

### 31.2 Infrastructure (IaC)
- **Terraform** modules per environment (dev/staging/prod) provisioning: VPC, ECS/EKS clusters (or equivalent managed container service), RDS PostgreSQL (with pgvector extension enabled), ElastiCache (Redis), S3 buckets (with lifecycle policies), CloudFront (CDN for static assets/Next.js), SES (email).
- **Container orchestration**: Kubernetes (EKS) recommended once service count exceeds ~6–8 (Phase 3+); ECS Fargate acceptable for Phase 1–2 to reduce ops overhead.
- **Secrets management**: AWS Secrets Manager / HashiCorp Vault — no secrets in environment files committed to repo; injected at runtime.

### 31.3 Monitoring & Observability
| Layer | Tool | What's Tracked |
|---|---|---|
| Application metrics | Prometheus + Grafana | Request latency (P50/P95/P99), error rates, queue depths |
| Distributed tracing | OpenTelemetry → Jaeger/Tempo | Cross-service request traces (e.g., resume upload → worker → event consumers) |
| Logging | Structured JSON logs → Loki/CloudWatch Logs | Centralized, queryable, correlated via `trace_id` |
| Error tracking | Sentry | Exception capture across frontend + backend, release tracking |
| Uptime | Better Uptime / Pingdom-style | External health checks on public endpoints |
| AI-specific | Custom dashboard | LLM call latency/cost per tier, token usage, fallback rates (Tier-1→Tier-2 escalation frequency) |

### 31.4 Alerting Thresholds (Examples)
- API P95 latency > 500ms for 5min → page on-call
- Resume processing queue depth > 1000 → scale worker pool / alert
- Event bus consumer lag > 5min on critical topics (`application.status_changed`) → alert
- LLM provider error rate > 5% → trigger fallback routing + alert

### 31.5 Backups & Disaster Recovery
- **PostgreSQL**: automated daily snapshots + continuous WAL archiving (point-in-time recovery up to 5min granularity); cross-region replica for prod.
- **S3 (resumes/assets)**: versioning enabled, cross-region replication for prod bucket.
- **RPO/RTO targets**: RPO ≤ 5 minutes (WAL-based PITR), RTO ≤ 1 hour for full region failover (documented runbook, tested quarterly via DR drills).
- **Event bus**: Kafka (Phase 4+) configured with replication factor ≥3; Redis Streams (Phase 1–3) backed by persistent storage (AOF) + replica.

---

## 32. Security Design

### 32.1 Authentication & Authorization
- JWT (RS256) access tokens (15min) + rotating refresh tokens (7d, reuse-detection per Module 1).
- RBAC enforced at: (a) API Gateway (coarse — role required for route), (b) service layer (fine — ownership/tenant checks), (c) database RLS (defense-in-depth, Part 4 §17).
- Service-to-service auth via mTLS within the internal network; internal-only endpoints (e.g., scraper ingest) never exposed via public gateway.

### 32.2 Data Classification & Encryption
| Tier | Data | At-Rest | In-Transit | Access Pattern |
|---|---|---|---|---|
| Tier 1 (Highest sensitivity) | Resume files, copilot conversations, interview notes | AES-256, dedicated KMS key, restricted bucket | TLS 1.3 | Signed URLs, short expiry, owner-only |
| Tier 2 (PII) | Profile (name, phone, email, location) | AES-256 (RDS encryption at rest) | TLS 1.3 | Owner + consent-gated tenant access |
| Tier 3 (Aggregated/Public) | Internship listings, skill taxonomy, aggregate funnel stats | Standard RDS encryption | TLS 1.3 | Broad read access |

### 32.3 Privacy & Consent Architecture
- Consent flags (`tenant_memberships.consent_individual_visibility`, `candidate_visibility_consent.visible_to_recruiters`) are **opt-in, default false**, field-granular where applicable.
- Data export/deletion requests (DPDP Act / GDPR-style "right to be forgotten") supported via a documented deletion workflow: cascading deletes on `profiles` (FK CASCADE) + S3 object deletion + event emitted (`user.deletion_requested`) for downstream consumers (analytics) to anonymize rather than hard-delete aggregated records.

### 32.4 Audit Trails
- `audit_logs` table (append-only, partitioned): records every access to Tier-1 data (resume downloads, copilot conversation reads by anyone other than owner, tenant admin views of individual student data) — `(actor_user_id, action, resource_type, resource_id, accessed_at, ip_address)`.

### 32.5 OWASP Top 10 Considerations
| Risk | Mitigation |
|---|---|
| Injection | Parameterized queries/ORM everywhere; no raw SQL string concatenation |
| Broken Auth | JWT rotation, refresh reuse detection, rate-limited auth endpoints |
| Sensitive Data Exposure | Tiered encryption (above), signed URLs, no PII in logs |
| XXE/Insecure Deserialization | Resume parsing libraries sandboxed; no `eval`/unsafe deserialization of uploaded content |
| Broken Access Control | RLS + service-layer ownership checks + RBAC at gateway (defense-in-depth) |
| Security Misconfiguration | IaC-enforced configs, no default credentials, automated config drift detection |
| XSS | React's default escaping + sanitization of user-generated content (bio, project descriptions, portfolio URLs) before render |
| Insecure Deserialization (events) | Event payloads validated against versioned JSON schemas before processing |
| Vulnerable Dependencies | Automated dependency scanning (Dependabot/Snyk) in CI |
| Insufficient Logging | Centralized structured logging + audit trails (above) |

### 32.6 LLM-Specific Security
- Prompt injection defenses (Part 5, §19.2).
- Output filtering: Copilot responses scanned for accidental PII leakage (e.g., if retrieved context inadvertently contains another user's data — should never happen given per-user scoping, but defense-in-depth check included).
- Rate limiting on AI endpoints (per-user token budget per day) to prevent abuse/cost exhaustion attacks.

---

## 33. Testing Strategy

### 33.1 Unit Tests
- Per-service unit tests for business logic (scoring formulas, status transition validation, skill matching logic) — target >80% coverage on core domain logic (not infrastructure glue).
- AI Service: unit tests for prompt template rendering, model router logic (given confidence X, routes to tier Y), and post-processing/parsing of LLM outputs (mocked LLM responses).

### 33.2 Integration Tests
- Service-level integration tests using docker-compose (real Postgres + Redis, mocked external providers — OpenAI/email/push mocked via local stub servers).
- Event-driven flows tested end-to-end within a service boundary (e.g., "resume.uploaded event → worker processes → resume_analyses row created → resume.analyzed event emitted").

### 33.3 End-to-End (E2E) Tests
- Playwright-based E2E covering critical user journeys (Part 1 §5):
  - Registration → onboarding → first feed render
  - Resume upload → score reveal
  - Apply → tracker status update → analytics funnel reflects it
  - Copilot conversation → grounded response contains expected reference type
- Run against staging on every merge to `main`.

### 33.4 Load Testing
- k6/Locust scripts simulating realistic traffic patterns (discovery feed reads dominate; resume uploads and copilot calls are lower-volume but higher-cost).
- Target scenarios: 10K concurrent users (Phase 2 milestone), 100K (Phase 4), with specific attention to: recommendation cache hit rates, DB connection pool saturation, event bus consumer lag under burst ingestion (e.g., scraper dumping 10K new listings).

### 33.5 Security Testing
- Automated: dependency scanning (CI-integrated), SAST (CodeQL/Semgrep) on every PR.
- Periodic: third-party penetration testing (annual, or before major B2B launches — Phase 6), focused on multi-tenant isolation (RLS bypass attempts) and resume/file upload handling (malicious file tests).
- RLS-specific test suite: automated tests that attempt cross-tenant/cross-user data access and assert denial (run in CI against a seeded multi-tenant test DB).

---

*(Continue to Part 8: Documentation, Roadmap, Repository Structure, Cost & Scaling)*
