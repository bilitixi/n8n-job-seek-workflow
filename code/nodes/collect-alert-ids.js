// Generated from the "Collect alert IDs" node in workflow/seek-job-alert-pipeline.json.
// Do not edit here: change the node in n8n, export the workflow, and re-run
// node scripts/extract-node-code.js

// One item per alert email, so each can be marked as read.
return $('Get SEEK alert emails').all().map(i => ({ json: { id: i.json.id } }));
