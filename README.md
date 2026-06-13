# INTERNFLOW — Master Engineering Notebook v1.1

A production-grade architecture notebook for InternFlow, an AI-powered Career Operating System for Students, designed to scale from 100 to 1,000,000+ users — with a **$0/month MVP stack**.

## Document Index

| File | Contents |
|---|---|
| `00_PRODUCT_VISION_AND_MARKET.md` | Product Vision, Market Opportunity, Problem Analysis |
| `01_PERSONAS_JOURNEYS_REQUIREMENTS.md` | User Personas, Journey Maps, User Flows, Functional & Non-Functional Requirements |
| `02_MODULE_BREAKDOWN.md` | Modules 1–16: Purpose, Business Value, Logic, DB Entities, APIs, Security, Scaling |
| `03_SYSTEM_ARCHITECTURE.md` | Service Boundaries, System Architecture, Microservices, Event-Driven Architecture, Caching |
| `04_DATABASE_DESIGN.md` | Complete ERD, Tables (full SQL DDL), Indexes, Partitioning, Row-Level Security |
| `05_AI_RAG_RECOMMENDATION_SEARCH.md` | AI Architecture, RAG Architecture, Resume Pipeline, Recommendation Engine, Analytics, Search |
| `06_SCRAPING_NOTIFICATION_FRONTEND_PORTALS.md` | Scraping Infrastructure, Notifications, Frontend, Browser Extension, Recruiter/College Portals |
| `07_DEVOPS_SECURITY_TESTING.md` | CI/CD, Monitoring, DR, Security (Auth/Encryption/OWASP/LLM), Testing Strategy |
| `08_DOCUMENTATION_SUITE.md` | PRD, SRS, HLD, LLD, API Documentation Index, Operational Runbooks |
| `09_ROADMAP_PHASES_1_5.md` | Detailed Phase 1–5 roadmap: features, dependencies, team, timelines, risks |
| `10_REPO_STRUCTURE_COSTS_SCALING.md` | Monorepo structure, Tech Stack Justification, Cost Estimates, Scaling 100→1M |
| `11_ZERO_COST_STACK.md` | **NEW** — Complete $0/mo free-tier stack mapping + Master Plan vs Notebook verification |

## What's New in v1.1
- **Part 11**: Full zero-cost infrastructure mapping — every service (frontend, backend, DB, AI, storage, auth, scraping, notifications, search, DevOps, CDN) mapped to a free tier with limits and alternatives.
- **Verification matrix**: Every module in the original master plan cross-referenced with the notebook, showing matched, expanded, and new additions.
- **Interactive prototype**: See `internflow-prototype.jsx` — a React artifact showing all 8 product screens with the zero-cost stack reference.

## Suggested Reading Order
1. Start with `00` and `01` for product/business context.
2. Read `02` for the full feature/module catalog.
3. Read `03` and `04` for core architecture and data model.
4. Read `05` and `06` for AI and infrastructure deep dives.
5. Read `07` and `08` for operational and documentation standards.
6. Read `09` and `10` for execution roadmap and scaling economics.
7. **Read `11` for the zero-cost stack and plan verification.**
