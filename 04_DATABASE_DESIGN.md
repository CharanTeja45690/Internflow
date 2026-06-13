# INTERNFLOW — MASTER ENGINEERING NOTEBOOK
## Part 4: Database Design

---

## 14. Complete Entity-Relationship Diagram (Textual ERD)

```
tenants ──┬───────────────────────────────────────────────────────────────┐
          │ (tenant_id FK on many tables for multi-tenant scoping)         │
          │                                                                 │
users ────┼──< roles                                                        │
  │       │                                                                 │
  │       └──< tenant_memberships >── profiles                              │
  │                                       │                                 │
  ├──< sessions                           ├──< education                    │
  │                                       ├──< profile_skills >── skills_taxonomy
  │                                       ├──< projects                     │
  │                                       ├──< certifications               │
  │                                       ├──< experience                   │
  │                                       ├──< portfolio_links              │
  │                                       ├──< resume_uploads ──< resume_analyses ──< resume_score_history
  │                                       ├──< applications ──< application_status_history
  │                                       │        │           ├──< application_notes
  │                                       │        │           ├──< interview_logs
  │                                       │        │           └──< follow_up_reminders
  │                                       │        └──< success_predictions
  │                                       ├──< recommendations_cache >── internships
  │                                       ├──< recommendation_feedback >── internships
  │                                       ├──< skill_gap_reports
  │                                       ├──< career_scores
  │                                       ├──< copilot_conversations ──< copilot_messages
  │                                       ├──< notification_preferences
  │                                       ├──< notifications
  │                                       ├──< device_tokens
  │                                       ├──< analytics_events
  │                                       └──< candidate_visibility_consent

internships ──< internship_sources >── sources_registry
internships ──< internship_skills >── skills_taxonomy
internships ──< startup_company_profiles (via company_name match)
internships ──< application_events
internships ──< recruiter_posted_roles (extension/subtype)
internships ──< shortlists >── tenant_memberships (recruiter side)

skill_demand_aggregates ──< skills_taxonomy
funnel_rollups >── profiles / tenants
model_training_runs (standalone, ML ops)
```

---

## 15. Complete Table Definitions

> Conventions: `id` = UUID primary key (`gen_random_uuid()`); `created_at`/`updated_at` = `TIMESTAMPTZ DEFAULT now()`; `tenant_id` nullable UUID present on tables that need future multi-tenant scoping even pre-Phase-6.

### 15.1 Identity & Tenancy
```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('college','recruiter','platform')),
  plan_tier TEXT NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  auth_provider TEXT NOT NULL DEFAULT 'email' CHECK (auth_provider IN ('email','google')),
  tenant_id UUID REFERENCES tenants(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','deleted')),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tenant ON users(tenant_id);

CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL CHECK (role_name IN ('student','college_admin','recruiter','mentor','admin')),
  tenant_id UUID REFERENCES tenants(id),
  UNIQUE(user_id, role_name, tenant_id)
);

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash TEXT NOT NULL,
  device_info JSONB,
  ip_address INET,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_sessions_user ON sessions(user_id) WHERE revoked_at IS NULL;

CREATE TABLE tenant_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  profile_id UUID NOT NULL,  -- FK to profiles, defined below
  role TEXT NOT NULL,
  consent_individual_visibility BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, profile_id)
);
```

### 15.2 Profile Domain
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id),
  full_name TEXT,
  phone TEXT,
  location TEXT,
  bio TEXT,
  avatar_url TEXT,
  completeness_score SMALLINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_profiles_tenant ON profiles(tenant_id);

CREATE TABLE education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  institution TEXT NOT NULL,
  degree TEXT,
  field_of_study TEXT,
  start_date DATE,
  end_date DATE,
  gpa NUMERIC(4,2)
);
CREATE INDEX idx_education_profile ON education(profile_id);

CREATE TABLE skills_taxonomy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  category TEXT,
  aliases TEXT[] DEFAULT '{}'
);
CREATE INDEX idx_skills_taxonomy_name ON skills_taxonomy USING gin (aliases);

CREATE TABLE profile_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills_taxonomy(id),
  proficiency_level SMALLINT CHECK (proficiency_level BETWEEN 1 AND 5),
  source TEXT CHECK (source IN ('manual','resume_extracted')),
  UNIQUE(profile_id, skill_id)
);
CREATE INDEX idx_profile_skills_profile ON profile_skills(profile_id);
CREATE INDEX idx_profile_skills_skill ON profile_skills(skill_id);

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  tech_stack TEXT[],
  url TEXT,
  quality_score SMALLINT
);
CREATE INDEX idx_projects_profile ON projects(profile_id);

CREATE TABLE certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  issuer TEXT,
  issue_date DATE,
  url TEXT
);

CREATE TABLE experience (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company TEXT NOT NULL,
  role TEXT,
  start_date DATE,
  end_date DATE,
  description TEXT
);

CREATE TABLE portfolio_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('github','linkedin','portfolio','other')),
  url TEXT NOT NULL
);
```

### 15.3 Resume Intelligence Domain
```sql
CREATE TABLE resume_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  s3_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed')),
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ
);
CREATE INDEX idx_resume_uploads_profile ON resume_uploads(profile_id);

CREATE TABLE resume_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_upload_id UUID NOT NULL REFERENCES resume_uploads(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  resume_score SMALLINT,
  skill_matrix JSONB,
  experience_matrix JSONB,
  project_quality_avg NUMERIC(5,2),
  ats_issues JSONB,
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_resume_analyses_profile ON resume_analyses(profile_id);
CREATE INDEX idx_resume_analyses_embedding ON resume_analyses
  USING hnsw (embedding vector_cosine_ops);

CREATE TABLE resume_score_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  resume_analysis_id UUID NOT NULL REFERENCES resume_analyses(id),
  score SMALLINT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_resume_score_history_profile ON resume_score_history(profile_id, created_at);
```

### 15.4 Internship Domain
```sql
CREATE TABLE sources_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  base_url TEXT NOT NULL,
  type TEXT CHECK (type IN ('career_page','job_board','startup','college','incubator')),
  robots_txt_status TEXT,
  crawl_frequency_minutes INT DEFAULT 1440,
  last_crawled_at TIMESTAMPTZ,
  compliance_status TEXT DEFAULT 'reviewed'
);

CREATE TABLE internships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  role_title TEXT NOT NULL,
  role_category TEXT,
  description TEXT,
  requirements TEXT,
  deadline DATE,
  location TEXT,
  remote_type TEXT CHECK (remote_type IN ('remote','onsite','hybrid')),
  stipend_min NUMERIC,
  stipend_max NUMERIC,
  stipend_currency TEXT DEFAULT 'INR',
  difficulty_score SMALLINT,
  apply_url TEXT NOT NULL,
  is_startup BOOLEAN DEFAULT false,
  funding_stage TEXT,
  company_size_estimate TEXT,
  embedding VECTOR(1536),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','filled')),
  first_seen_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ DEFAULT now()
) PARTITION BY LIST (status);

CREATE TABLE internships_active PARTITION OF internships FOR VALUES IN ('active');
CREATE TABLE internships_archived PARTITION OF internships FOR VALUES IN ('expired','filled');

CREATE INDEX idx_internships_role_category ON internships(role_category);
CREATE INDEX idx_internships_deadline ON internships(deadline);
CREATE INDEX idx_internships_embedding ON internships USING hnsw (embedding vector_cosine_ops);
CREATE INDEX idx_internships_search ON internships USING gin (to_tsvector('english', company_name || ' ' || role_title || ' ' || description));

CREATE TABLE internship_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  internship_id UUID NOT NULL REFERENCES internships(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES sources_registry(id),
  source_url TEXT NOT NULL,
  source_listing_id TEXT
);
CREATE INDEX idx_internship_sources_internship ON internship_sources(internship_id);

CREATE TABLE internship_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  internship_id UUID NOT NULL REFERENCES internships(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills_taxonomy(id),
  importance_weight NUMERIC(3,2) DEFAULT 1.0
);
CREATE INDEX idx_internship_skills_internship ON internship_skills(internship_id);
CREATE INDEX idx_internship_skills_skill ON internship_skills(skill_id);

CREATE TABLE startup_company_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT UNIQUE NOT NULL,
  website TEXT,
  funding_stage TEXT,
  sector TEXT,
  last_enriched_at TIMESTAMPTZ
);
```

### 15.5 Application Domain
```sql
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  internship_id UUID REFERENCES internships(id),
  company_name TEXT NOT NULL,
  role_title TEXT NOT NULL,
  current_status TEXT NOT NULL DEFAULT 'saved'
    CHECK (current_status IN ('saved','applied','assessment','interview','offer','rejected','joined')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_applications_profile ON applications(profile_id);
CREATE INDEX idx_applications_status ON applications(profile_id, current_status);

CREATE TABLE application_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT now(),
  note TEXT
) PARTITION BY RANGE (changed_at);
-- Monthly partitions created via scheduled maintenance job

CREATE TABLE application_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  note_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE interview_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  round_name TEXT,
  date DATE,
  feedback TEXT,
  outcome TEXT
);

CREATE TABLE follow_up_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  remind_at TIMESTAMPTZ NOT NULL,
  message TEXT,
  completed BOOLEAN DEFAULT false
);
CREATE INDEX idx_reminders_due ON follow_up_reminders(remind_at) WHERE completed = false;

CREATE TABLE application_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  internship_id UUID REFERENCES internships(id),
  profile_id UUID REFERENCES profiles(id),
  event_type TEXT CHECK (event_type IN ('click','mark_applied')),
  created_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB
);
```

### 15.6 AI / Recommendation / Scoring Domain
```sql
CREATE TABLE recommendations_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  internship_id UUID NOT NULL REFERENCES internships(id) ON DELETE CASCADE,
  score NUMERIC(6,4),
  rank INT,
  generated_at TIMESTAMPTZ DEFAULT now(),
  model_version TEXT,
  UNIQUE(profile_id, internship_id, model_version)
);
CREATE INDEX idx_reco_profile_rank ON recommendations_cache(profile_id, rank);

CREATE TABLE recommendation_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  internship_id UUID NOT NULL REFERENCES internships(id),
  action TEXT CHECK (action IN ('viewed','clicked','applied','dismissed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE skill_demand_aggregates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id UUID NOT NULL REFERENCES skills_taxonomy(id),
  role_category TEXT,
  demand_score NUMERIC(8,4),
  computed_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_skill_demand_skill_role ON skill_demand_aggregates(skill_id, role_category);

CREATE TABLE skill_gap_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  missing_skills JSONB,
  generated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_skill_gap_profile ON skill_gap_reports(profile_id, generated_at DESC);

CREATE TABLE career_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  overall_score SMALLINT,
  sub_scores JSONB,
  weights_version TEXT,
  computed_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_career_scores_profile ON career_scores(profile_id, computed_at DESC);

CREATE TABLE success_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  p_interview NUMERIC(5,4),
  p_selection NUMERIC(5,4),
  p_offer NUMERIC(5,4),
  model_version TEXT,
  computed_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE model_training_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_version TEXT,
  trained_at TIMESTAMPTZ DEFAULT now(),
  metrics JSONB,
  dataset_snapshot_ref TEXT
);

CREATE TABLE copilot_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE copilot_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES copilot_conversations(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user','assistant')),
  content TEXT,
  retrieved_context_refs JSONB,
  model_used TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_copilot_messages_conv ON copilot_messages(conversation_id, created_at);
```

### 15.7 Notification & Analytics Domain
```sql
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email','push','sms','whatsapp','telegram')),
  enabled BOOLEAN DEFAULT true,
  UNIQUE(profile_id, category, channel)
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  channel TEXT NOT NULL,
  content TEXT,
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued','sent','failed','read')),
  created_at TIMESTAMPTZ DEFAULT now(),
  sent_at TIMESTAMPTZ
) PARTITION BY RANGE (created_at);

CREATE TABLE device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  platform TEXT CHECK (platform IN ('ios','android','web')),
  token TEXT NOT NULL,
  active BOOLEAN DEFAULT true
);

CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id),
  event_type TEXT NOT NULL,
  metadata JSONB,
  occurred_at TIMESTAMPTZ DEFAULT now()
) PARTITION BY RANGE (occurred_at);
CREATE INDEX idx_analytics_profile_time ON analytics_events(profile_id, occurred_at);

CREATE TABLE funnel_rollups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id),
  tenant_id UUID REFERENCES tenants(id),
  period_start DATE,
  period_end DATE,
  searches INT DEFAULT 0,
  views INT DEFAULT 0,
  applications INT DEFAULT 0,
  interviews INT DEFAULT 0,
  offers INT DEFAULT 0,
  computed_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_funnel_profile_period ON funnel_rollups(profile_id, period_start);
CREATE INDEX idx_funnel_tenant_period ON funnel_rollups(tenant_id, period_start);
```

### 15.8 Recruiter / Consent Domain (Phase 6+)
```sql
CREATE TABLE candidate_visibility_consent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  visible_to_recruiters BOOLEAN DEFAULT false,
  visible_fields JSONB
);

CREATE TABLE shortlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  internship_id UUID NOT NULL REFERENCES internships(id),
  profile_id UUID NOT NULL REFERENCES profiles(id),
  status TEXT DEFAULT 'shortlisted',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 16. Partitioning Strategy Summary

| Table | Partition Key | Rationale |
|---|---|---|
| `internships` | LIST (status) | Active listings (hot, frequently queried) separated from expired/filled (cold, archival) |
| `application_status_history` | RANGE (changed_at), monthly | Append-only, fastest-growing audit table; old months rarely queried |
| `analytics_events` | RANGE (occurred_at), daily/weekly | Highest write volume; enables cheap retention/archival of old partitions to S3 |
| `notifications` | RANGE (created_at), monthly | High volume, time-bound relevance; old partitions purged per retention policy |
| `resume_score_history` | (not partitioned initially) | Low volume per user; revisit if user count >1M |

**General rule**: partitions are created automatically via a scheduled maintenance job (e.g., `pg_partman` extension) that pre-creates next-period partitions and drops/archives partitions beyond retention window.

---

## 17. Row-Level Security (Multi-Tenancy)

```sql
-- Example RLS policy for profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profile_owner_access ON profiles
  USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY tenant_admin_aggregate_access ON funnel_rollups
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID
         OR profile_id = (SELECT id FROM profiles WHERE user_id = current_setting('app.current_user_id')::UUID));
```
Application services set `app.current_user_id` / `app.current_tenant_id` session variables per request (via connection middleware), ensuring RLS is enforced at the database layer as defense-in-depth beyond application-layer checks.

---

*(Continue to Part 5: AI Architecture & RAG)*
