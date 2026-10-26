// Generated from the "Split batch scores" node in workflow/seek-job-alert-pipeline.json.
// Do not edit here: change the node in n8n, export the workflow, and re-run
// node scripts/extract-node-code.js

// Turn the AI answers back into one item per job.
// Matches answers to jobs by id, so it doesn't need n8n item linking
// (the Basic LLM Chain doesn't keep it). Every job that was sent in a batch
// comes out once: 'scored' if the AI answered it, otherwise 'error' with
// retry_count + 1 (so failed batches and skipped jobs are retried later).
const batches = $('Batch jobs (10 per call)').all().map(i => i.json);

// Collect every answer from every AI call (failed calls have no output.results).
const answers = new Map();
for (const item of $input.all()) {
  const results = (item.json.output && item.json.output.results) || [];
  for (const r of results) {
    const id = Number(r.id);
    if (!answers.has(id)) answers.set(id, r);
  }
}

const out = [];
for (const batch of batches) {
  for (const id of batch.ids) {
    const tries = (batch.retries && batch.retries[id]) || 0;
    const r = answers.get(id);
    if (r && Number.isFinite(Number(r.fit_score))) {
      out.push({ json: {
        id,
        fit_score: Math.max(0, Math.min(100, Math.round(Number(r.fit_score)))),
        fit_reason: r.fit_reason || '',
        red_flags: Array.isArray(r.red_flags) ? r.red_flags : [],
        status: 'scored',
        retry_count: tries,
      }});
    } else {
      out.push({ json: {
        id, fit_score: null, fit_reason: null, red_flags: [],
        status: 'error',
        retry_count: tries + 1,
      }});
    }
  }
}
return out;
