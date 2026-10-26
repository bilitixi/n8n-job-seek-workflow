-- Job alert workflow: database schema (PostgreSQL / Supabase)

-- n8n's own tables (workflows, credentials, run history) live in a separate schema
-- when n8n is configured with DB_POSTGRESDB_SCHEMA=n8n (see docs/deployment.md).
CREATE SCHEMA IF NOT EXISTS n8n;

-- One row per job posting, from discovery through to notification.
CREATE TABLE IF NOT EXISTS jobs (
    id            SERIAL PRIMARY KEY,
    source        TEXT        NOT NULL DEFAULT 'seek_alert',  -- where it came from (room for Adzuna etc. later)
    external_id   TEXT        NOT NULL,                       -- e.g. the SEEK job number from the job URL
    url           TEXT        NOT NULL,
    title         TEXT        NOT NULL,
    company       TEXT,
    location      TEXT,
    salary        TEXT,                                       -- kept as text: SEEK salary formats vary
    work_type     TEXT,                                       -- full time / part time / contract
    description   TEXT,                                       -- teaser or full text, whatever the source gives
    listed_at     TIMESTAMPTZ,

    -- Filled in by the AI scoring step
    fit_score     SMALLINT    CHECK (fit_score BETWEEN 0 AND 100),
    fit_reason    TEXT,
    red_flags     JSONB       DEFAULT '[]'::jsonb,            -- e.g. ["5+ years required", "citizenship required"]
    model_used    TEXT,                                       -- which model scored it, e.g. openrouter/free
    scored_at     TIMESTAMPTZ,

    -- Pipeline state
    status        TEXT        NOT NULL DEFAULT 'new'
                  CHECK (status IN ('new', 'filtered_out', 'scored', 'notified', 'error')),
    notified_at   TIMESTAMPTZ,
    retry_count   SMALLINT    NOT NULL DEFAULT 0,             -- failed AI scoring attempts; retried while < 3
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Deduplication: the same job from the same source is only stored once
    CONSTRAINT uq_jobs_source_external UNIQUE (source, external_id)
);

CREATE INDEX IF NOT EXISTS idx_jobs_status    ON jobs (status);
CREATE INDEX IF NOT EXISTS idx_jobs_fit_score ON jobs (fit_score DESC);

-- Migration for tables created before retry_count existed (safe to run more than once):
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS retry_count SMALLINT NOT NULL DEFAULT 0;

-- One row per workflow run: useful for debugging and for the README screenshots.
CREATE TABLE IF NOT EXISTS workflow_runs (
    id              SERIAL PRIMARY KEY,
    started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    finished_at     TIMESTAMPTZ,
    jobs_found      INT  DEFAULT 0,   -- parsed from the alert emails
    jobs_new        INT  DEFAULT 0,   -- not seen before
    jobs_notified   INT  DEFAULT 0,   -- included in the digest email
    status          TEXT DEFAULT 'running' CHECK (status IN ('running', 'success', 'failed')),
    error_message   TEXT
);

-- Supabase: lock these tables away from the public Data API.
-- n8n connects as the postgres role, which bypasses RLS, so the workflow is unaffected.
-- With RLS on and no policies, the anon/authenticated API keys can't read or write anything.
ALTER TABLE jobs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_runs ENABLE ROW LEVEL SECURITY;
