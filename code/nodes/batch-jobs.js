// Generated from the "Batch jobs (10 per call)" node in workflow/seek-job-alert-pipeline.json.
// Do not edit here: change the node in n8n, export the workflow, and re-run
// node scripts/extract-node-code.js

// Group jobs into batches of 10, so each AI call scores 10 jobs at once.
const SIZE = 10;
const jobs = $input.all().map(i => i.json);
const out = [];

for (let i = 0; i < jobs.length; i += SIZE) {
  const batch = jobs.slice(i, i + SIZE);
  const jobsText = batch.map(j => [
    `[id: ${j.id}]`,
    `Title: ${j.title}`,
    `Company: ${j.company || 'Not stated'}`,
    `Location: ${j.location || 'Not stated'}`,
    `Salary: ${j.salary || 'Not stated'}`,
    `Description: ${j.description || 'Not provided'}`,
  ].join('\n')).join('\n\n');

  out.push({
    json: {
      ids: batch.map(j => j.id),
      retries: Object.fromEntries(batch.map(j => [j.id, j.retry_count || 0])),
      count: batch.length,
      jobsText,
    },
    pairedItem: batch.map((_, k) => ({ item: i + k })),
  });
}
return out;
