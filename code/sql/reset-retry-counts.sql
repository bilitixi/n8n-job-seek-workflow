-- Generated from the "Reset retry counts" node in workflow/seek-job-alert-pipeline.json.
-- Do not edit here: change the node in n8n, export the workflow, and re-run
-- node scripts/extract-node-code.js

-- Give recent jobs that used up their retries a fresh set of attempts each run.
-- Limited to the last 7 days so a job that can never be scored doesn't use quota forever.
UPDATE jobs
SET retry_count = 0
WHERE status = 'error'
  AND retry_count >= 3
  AND created_at > now() - interval '7 days';
