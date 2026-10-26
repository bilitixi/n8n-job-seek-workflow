-- Generated from the "Get jobs to notify" node in workflow/seek-job-alert-pipeline.json.
-- Do not edit here: change the node in n8n, export the workflow, and re-run
-- node scripts/extract-node-code.js

SELECT * FROM jobs
WHERE status = 'scored' AND fit_score >= 60
ORDER BY fit_score DESC;
