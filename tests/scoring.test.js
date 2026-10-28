const test = require('node:test');
const assert = require('node:assert/strict');
const { runNode } = require('./helpers/run-node');

const job = (id, retry_count = 0) => ({ json: { id, title: `Job ${id}`, company: 'Co', location: 'Auckland', salary: null, description: null, retry_count } });

// ---------- Batch jobs (10 per call) ----------

test('groups jobs into batches of 10 with ids, retry counts and item links', () => {
  const input = Array.from({ length: 23 }, (_, k) => job(k + 1, k === 0 ? 2 : 0));
  const batches = runNode('batch-jobs.js', { input });

  assert.deepEqual(batches.map(b => b.json.count), [10, 10, 3]);
  assert.deepEqual(batches[2].json.ids, [21, 22, 23]);
  assert.equal(batches[0].json.retries[1], 2);
  assert.deepEqual(batches[2].pairedItem, [{ item: 20 }, { item: 21 }, { item: 22 }]);
  assert.match(batches[0].json.jobsText, /^\[id: 1\]\nTitle: Job 1\nCompany: Co\nLocation: Auckland\nSalary: Not stated/);
});

// ---------- Split batch scores ----------

const batches = [
  { json: { ids: [1, 2, 3], retries: { 1: 0, 2: 1, 3: 0 }, count: 3 } },
  { json: { ids: [4, 5], retries: { 4: 2, 5: 0 }, count: 2 } },
];
const split = (aiItems) =>
  runNode('split-batch-scores.js', { input: aiItems, nodes: { 'Batch jobs (10 per call)': batches } }).map(o => o.json);

test('every job sent comes out exactly once, matched by id', () => {
  const out = split([
    { json: { output: { results: [
      { id: 1, fit_score: 88, fit_reason: 'Good fit', red_flags: [] },
      { id: '2', fit_score: '140', fit_reason: 'Too keen', red_flags: null },
      { id: 99, fit_score: 5, fit_reason: 'Made-up id', red_flags: [] },
    ] } } },
    { json: { error: 'Bad gateway' } },   // second AI call failed
  ]);

  assert.deepEqual(out.map(j => j.id), [1, 2, 3, 4, 5]);
  assert.deepEqual(out.map(j => j.status), ['scored', 'scored', 'error', 'error', 'error']);
});

test('cleans up scores: text to number, clamped to 0-100, missing flags to []', () => {
  const out = split([{ json: { output: { results: [
    { id: 2, fit_score: '140', fit_reason: 'x', red_flags: null },
    { id: 3, fit_score: -20, fit_reason: 'y', red_flags: ['5+ years'] },
  ] } } }]);
  const byId = Object.fromEntries(out.map(j => [j.id, j]));
  assert.equal(byId[2].fit_score, 100);
  assert.deepEqual(byId[2].red_flags, []);
  assert.equal(byId[3].fit_score, 0);
});

test('unanswered jobs get retry_count + 1; answered jobs keep theirs', () => {
  const out = split([{ json: { output: { results: [{ id: 2, fit_score: 70, fit_reason: 'ok', red_flags: [] }] } } }]);
  const byId = Object.fromEntries(out.map(j => [j.id, j]));
  assert.equal(byId[2].retry_count, 1);   // answered: unchanged
  assert.equal(byId[1].retry_count, 1);   // 0 -> 1
  assert.equal(byId[4].retry_count, 3);   // 2 -> 3, so it won't be picked up again (retry_count < 3)
});

test('if every AI call fails, every job is marked error instead of crashing', () => {
  const out = split([{ json: { error: '502' } }, { json: { error: '502' } }]);
  assert.equal(out.length, 5);
  assert.ok(out.every(j => j.status === 'error' && j.fit_score === null));
});

// ---------- Build digest email ----------

test('builds one digest email with escaped content and the job ids', () => {
  const [mail] = runNode('build-digest-email.js', { input: [
    { json: { id: 7, title: 'Dev <Junior>', company: 'A & B', location: 'Auckland', salary: null, url: 'https://example.com/7', fit_score: 91, fit_reason: 'Strong match', red_flags: '["citizenship required"]' } },
    { json: { id: 9, title: 'Tester', company: 'C', location: 'Wellington', salary: '$30 per hour', url: 'https://example.com/9', fit_score: 64, fit_reason: 'Partial match', red_flags: [] } },
  ] }).map(o => o.json);

  assert.equal(mail.subject, '2 job matches – Tue 27 Oct');
  assert.deepEqual(mail.ids, [7, 9]);
  assert.match(mail.html, /Dev &lt;Junior&gt;/);
  assert.match(mail.html, /A &amp; B/);
  assert.match(mail.html, /citizenship required/);
});

// ---------- Same-run retry pass ----------

test('retry batching matches the main batching', () => {
  const input = Array.from({ length: 12 }, (_, k) => job(k + 1, 1));
  assert.deepEqual(runNode('batch-retry-jobs.js', { input }), runNode('batch-jobs.js', { input }));
});

test('retry split reads the "Batch retry jobs" node, not the first-pass batches', () => {
  const retryBatches = [{ json: { ids: [3, 4], retries: { 3: 1, 4: 2 }, count: 2 } }];
  const out = runNode('split-retry-scores.js', {
    input: [{ json: { output: { results: [{ id: 3, fit_score: 72, fit_reason: 'ok', red_flags: [] }] } } }],
    nodes: { 'Batch retry jobs': retryBatches },
  }).map(o => o.json);

  assert.deepEqual(out.map(j => [j.id, j.status, j.retry_count]), [[3, 'scored', 1], [4, 'error', 3]]);
});
