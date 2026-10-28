-- Generated from the "Get errors to retry" node in workflow/seek-job-alert-pipeline.json.
-- Do not edit here: change the node in n8n, export the workflow, and re-run
-- node scripts/extract-node-code.js

-- Retry loop: jobs this run couldn't score yet (rate limits, bad replies) go back through
-- the scoring chain after a 60s wait, until they're scored or reach the retry_count cap.
SELECT * FROM jobs
WHERE status = 'error' AND retry_count < 3
ORDER BY created_at;
