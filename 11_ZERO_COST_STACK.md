# INTERNFLOW — MASTER ENGINEERING NOTEBOOK
## Part 11: Zero-Cost Infrastructure — Free Tier Stack Mapping

---

## 49. Design Principle: Zero Marginal Cost at MVP

Every infrastructure component is mapped to a production-grade free tier. The stack supports 1,000–5,000 users at $0/month. Paid tiers are only needed beyond that threshold, and each service has a listed alternative to avoid vendor lock-in.

---

## 50. Frontend & Hosting

| Need | Free Service | Limits | Alternatives |
|---|---|---|---|
| Next.js Hosting + SSR | **Vercel Free Tier** | 100GB bandwidth/mo, serverless functions, automatic HTTPS, preview deploys | Netlify Free, Cloudflare Pages |
| UI Component Library | **shadcn/ui + Tailwind CSS** | Fully open-source, MIT licensed, unlimited | Radix UI, Headless UI |
| Icons | **Lucide React** | Open-source, tree-shakable | Heroicons, Phosphor |

---

## 51. Backend & API

| Need | Free Service | Limits | Alternatives |
|---|---|---|---|
| Node.js/Express API Server | **Render Free Tier** | 750 hrs/mo, auto-deploy from GitHub, auto-sleep on inactivity | Railway Free (500 hrs), Fly.io (3 shared VMs) |
| Python AI Workers | **HuggingFace Spaces (CPU)** | Free CPU instances for inference workers | Render background workers (free tier) |
| API Rate Limiting | **express-rate-limit** | Open-source middleware, no external dependency | Upstash rate-limit (free tier) |
| Job Queue | **BullMQ + Redis** | Open-source, runs on Upstash Redis | Inngest Free Tier |

---

## 52. Database

| Need | Free Service | Limits | Alternatives |
|---|---|---|---|
| PostgreSQL (Primary DB) | **Neon Free Tier** | 0.5GB storage, auto-suspend, database branching, 1 project | Supabase Free (500MB, 2 projects), ElephantSQL (20MB) |
| pgvector (Embeddings/Vector Search) | **Neon (pgvector extension)** | Included in free tier — no separate vector DB needed | Supabase with pgvector |
| Redis (Cache + Sessions + Queue) | **Upstash Free Tier** | 10,000 commands/day, 256MB storage, REST API | Redis Cloud Free (30MB), Vercel KV Free |

---

## 53. AI & LLM

| Need | Free Service | Limits | Alternatives |
|---|---|---|---|
| Resume Parsing — Tier 1/2 (High Volume) | **Ollama + Llama 3.1 8B / Qwen 2.5** | Self-hosted on any machine, unlimited inference, quantized models (Q4/Q5) for efficiency | LM Studio, LocalAI, llama.cpp |
| Career Copilot — Tier 3 (User-Facing) | **Groq Free API** | 14,400 tokens/min, Llama 3.1 70B and 8B available, extremely fast inference | Together.ai free tier (limited), OpenRouter free models |
| Embeddings (Resume + Internship) | **HuggingFace Inference API** | 30,000 characters/month free, sentence-transformers models | Ollama local embeddings (all-minilm-l6-v2), Xenova/transformers.js |
| Fallback / Secondary LLM | **Google Gemini API Free Tier** | 15 RPM, 1 million tokens/day, Gemini 1.5 Flash | Mistral free tier, Cohere free tier |

**Cost Control Strategy at Scale:**
- Tier 1–2 tasks (resume parsing, skill extraction, embeddings) always use self-hosted Ollama — zero marginal cost regardless of volume.
- Tier 3 tasks (Copilot conversations) use Groq free → Gemini free as fallback → paid API only if free limits exhausted.
- Aggressive caching: embeddings computed once per resume/internship version, cached in pgvector.
- Conversation summarization: compress long Copilot sessions to stay within token limits.

---

## 54. File Storage

| Need | Free Service | Limits | Alternatives |
|---|---|---|---|
| Resume PDFs / Documents | **Cloudflare R2 Free Tier** | 10GB storage, 10M Class B reads/mo, 1M Class A writes/mo, **$0 egress** | Supabase Storage (1GB free), Backblaze B2 (10GB free) |
| Profile Images / Avatars | **Cloudinary Free Tier** | 25,000 transformations/mo, 25GB bandwidth | Uploadthing Free, imgix Free |

---

## 55. Authentication & Security

| Need | Free Service | Limits | Alternatives |
|---|---|---|---|
| Auth (Email + OAuth) | **NextAuth.js (Auth.js)** | Self-hosted, unlimited users, zero cost — runs in your Next.js app | Supabase Auth (50K MAU free), Clerk Free (10K MAU) |
| Google OAuth Provider | **Google Cloud OAuth 2.0** | Always free, unlimited, standard consent screen | GitHub OAuth (also free) |
| SSL / HTTPS | **Cloudflare Free + Let's Encrypt** | Unlimited certificates, automatic renewal | Vercel auto-SSL (included with hosting) |
| Password Hashing | **argon2 (npm package)** | Open-source, runs in-process | bcrypt |

---

## 56. Scraping & Data Pipelines

| Need | Free Service | Limits | Alternatives |
|---|---|---|---|
| Web Scraping Engine | **Playwright + Cheerio** | Open-source, self-hosted, handles JS-rendered pages (Playwright) and static HTML (Cheerio) | Puppeteer, Scrapy (Python), crawlee |
| Cron Scheduler | **GitHub Actions (scheduled workflows)** | 2,000 minutes/month free for public repos, unlimited for public | cron-job.org (free), Render Cron Jobs |
| Data Processing Pipeline | **BullMQ** | Open-source job queue on Redis, priorities, retries, rate limiting built-in | Inngest Free Tier, custom Node.js workers |

---

## 57. Notifications

| Need | Free Service | Limits | Alternatives |
|---|---|---|---|
| Transactional Email | **Resend Free Tier** | 3,000 emails/month, custom domain support, React Email templates | Brevo (300 emails/day), Mailgun (1,000/month) |
| Push Notifications | **Firebase Cloud Messaging (FCM)** | Unlimited push notifications to web and mobile | OneSignal Free (10K subscribers) |
| In-App Notifications | **Custom WebSocket (Socket.io)** | Runs on existing backend, zero additional cost | Novu Open Source (self-hosted) |

---

## 58. Search

| Need | Free Service | Limits | Alternatives |
|---|---|---|---|
| Full-Text Search (Internships) | **PostgreSQL tsvector + GIN indexes** | Built into Postgres, zero additional cost, supports ranking and highlighting | Meilisearch Cloud Free (10K documents) |
| Semantic Search (Recommendations) | **pgvector similarity search** | Cosine/L2 distance on embeddings, built into Neon/Supabase Postgres | Qdrant Cloud Free (1M vectors), Weaviate Sandbox |

---

## 59. DevOps & Monitoring

| Need | Free Service | Limits | Alternatives |
|---|---|---|---|
| CI/CD | **GitHub Actions** | 2,000 min/mo (private), unlimited (public repos), matrix builds, caching | GitLab CI Free Tier |
| Metrics & Dashboards | **Grafana Cloud Free** | 10,000 metrics, 50GB logs, 50GB traces | Betterstack Free |
| Error Tracking | **Sentry Free Tier** | 5,000 errors/month, 1 team member, source maps | GlitchTip (self-hosted, unlimited) |
| Product Analytics | **PostHog Free** | 1M events/month, feature flags, session replay | Umami (self-hosted, unlimited), Plausible CE |
| Uptime Monitoring | **Better Stack Free** | 5 monitors, 3-minute check interval | UptimeRobot Free (50 monitors) |

---

## 60. CDN & Domain

| Need | Free Service | Limits | Alternatives |
|---|---|---|---|
| CDN + DDoS Protection | **Cloudflare Free Plan** | Unlimited bandwidth, automatic caching, DDoS protection, Web Application Firewall | Vercel Edge Network (included) |
| DNS | **Cloudflare DNS** | Unlimited queries, DNSSEC, fast propagation | Vercel DNS (included) |
| Domain Name | **Vercel subdomain (*.vercel.app)** | Free — custom domain ~$10/year from Namecheap/Cloudflare Registrar | *.pages.dev (Cloudflare) |

---

## 61. Total Monthly Cost Summary

### Phase 1 (MVP, <5,000 users): **$0/month**

| Category | Service | Cost |
|---|---|---|
| Frontend Hosting | Vercel Free | $0 |
| Backend API | Render Free | $0 |
| Database (PostgreSQL + pgvector) | Neon Free | $0 |
| Cache/Queue (Redis) | Upstash Free | $0 |
| AI Inference (Tier 1–2) | Ollama (self-hosted) | $0 |
| AI Inference (Tier 3) | Groq Free + Gemini Free | $0 |
| Embeddings | HuggingFace API Free | $0 |
| File Storage | Cloudflare R2 Free | $0 |
| Auth | NextAuth.js (self-hosted) | $0 |
| Email | Resend Free | $0 |
| Push | Firebase FCM | $0 |
| Scraping/Cron | Playwright + GitHub Actions | $0 |
| Search | PostgreSQL tsvector + pgvector | $0 |
| CI/CD | GitHub Actions | $0 |
| Monitoring | Grafana Cloud + Sentry Free | $0 |
| CDN/DNS | Cloudflare Free | $0 |
| Domain | *.vercel.app subdomain | $0 |
| **TOTAL** | | **$0/month** |

### When to Scale to Paid

| Trigger | What to Upgrade | Estimated Monthly Cost |
|---|---|---|
| >5,000 users | Render → paid ($7/mo), Neon → paid ($19/mo) | ~$30/mo |
| >10,000 users | Add dedicated Redis ($10/mo), upgrade Vercel ($20/mo) | ~$60/mo |
| >50,000 users | Dedicated GPU for Ollama, managed Postgres | ~$500–2,000/mo |
| >100,000 users | See Part 10 §47.2 for full cost breakdown | ~$3,000–10,000/mo |

---

## 62. Verification: Engineering Notebook vs Master Plan

| Master Plan Module | Notebook Coverage | Status |
|---|---|---|
| Module 1: Internship Discovery | Part 2 — Modules 4 (Discovery Engine) + 13 (Startup Discovery) | **Expanded** — split into structured + startup sources |
| Module 2: Resume Intelligence | Part 2 — Module 3 + Part 5 (AI Pipeline) | **Expanded** — full extraction pipeline, scoring, ATS analysis |
| Module 3: Match Engine | Part 2 — Module 6 + Part 5 (Recommendation Engine) | **Expanded** — cosine similarity + collaborative filtering |
| Module 4: Application Tracker | Part 2 — Modules 5 (Direct Apply) + 7 (Tracker) | **Expanded** — split apply logic from tracking |
| Module 5: AI Career Copilot | Part 2 — Module 8 + Part 5 (RAG Architecture) | **Expanded** — tiered model routing, context injection |
| Module 6: Career Analytics | Part 2 — Module 11 (Analytics Engine) | **Expanded** — funnel tracking, cohort analysis |
| Module 7: Career Readiness Score | Part 2 — Module 10 (Career Readiness Score) | **Matched** |
| Module 8: Startup Discovery | Part 2 — Module 13 (Startup Discovery Engine) | **Matched** |
| Authentication (Section 13) | Part 2 — Module 1 + Part 7 (Security) | **Expanded** — JWT rotation, RS256, OWASP compliance |
| Database Design (Section 9) | Part 4 — Full DDL, indexes, RLS, partitioning | **Expanded** — 40+ tables with SQL |
| Scraping (Section 11) | Part 6 §24 — Full crawler architecture | **Expanded** — adapter pattern, compliance review |
| AI Architecture (Section 10) | Part 5 — Tiered model strategy, cost control | **Expanded** — 3-tier routing, caching, batch processing |
| Build Guide Steps 1–8 | Part 9 — Phases 1–5 with timelines, teams, risks | **Expanded** — detailed sprint plans |
| Future Phases 5–11 | Part 9–10 — Phases 1–5 detailed, 6+ outlined | **Partially covered** — Phases 6+ are future scope |
| — | Part 2 — Module 9 (Skill Gap Analyzer) | **New** — standalone module |
| — | Part 2 — Module 12 (Success Prediction) | **New** — ML prediction engine |
| — | Part 2 — Module 14 (Notification Engine) | **New** — multi-channel notifications |
| — | Part 2 — Module 15 (College Dashboard) | **New** — B2B analytics portal |
| — | Part 2 — Module 16 (Recruiter Dashboard) | **New** — future B2B module |

**Summary**: The engineering notebook is a strict superset of the master plan. Every master plan module has a corresponding notebook section, typically expanded with deeper architecture, database schemas, API contracts, and security considerations. The notebook adds 5 new modules not present in the original plan (Skill Gap, Success Prediction, Notifications, College Dashboard, Recruiter Dashboard).

