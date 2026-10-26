-- Generated from the "Mark jobs notified" node in workflow/seek-job-alert-pipeline.json.
-- Do not edit here: change the node in n8n, export the workflow, and re-run
-- node scripts/extract-node-code.js

UPDATE jobs
SET status = 'notified', notified_at = now()
WHERE id IN ({{ $('Build digest email').item.json.ids.join(',') }});
