-- Generated from the "Get errors to retry" node in workflow/seek-job-alert-pipeline.json.
-- Do not edit here: change the node in n8n, export the workflow, and re-run
-- node scripts/extract-node-code.js

-- Same-run retry: jobs the first scoring pass couldn't score (rate limits, bad replies).
-- Still capped by retry_count, so a job that keeps failing stops using quota.
SELECT * FROM jobs
WHERE status = 'error' AND retry_count < 3
ORDER BY created_at;
