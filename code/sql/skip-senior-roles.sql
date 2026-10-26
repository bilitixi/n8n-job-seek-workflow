-- Generated from the "Skip senior roles" node in workflow/seek-job-alert-pipeline.json.
-- Do not edit here: change the node in n8n, export the workflow, and re-run
-- node scripts/extract-node-code.js

-- Cheap keyword filter before spending AI calls: clearly senior roles are skipped.
UPDATE jobs
SET status = 'filtered_out'
WHERE status = 'new'
  AND (
    title ~* '\m(senior|lead|principal|manager|head of|architect|staff)\M'
    OR coalesce(description, '') ~* '\m([5-9]|1[0-9])\+?\s*(years|yrs)'
  );
