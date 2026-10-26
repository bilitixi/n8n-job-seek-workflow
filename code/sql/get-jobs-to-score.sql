-- Generated from the "Get jobs to score" node in workflow/seek-job-alert-pipeline.json.
-- Do not edit here: change the node in n8n, export the workflow, and re-run
-- node scripts/extract-node-code.js

SELECT * FROM jobs
WHERE status IN ('new', 'error') AND retry_count < 3
ORDER BY created_at;
