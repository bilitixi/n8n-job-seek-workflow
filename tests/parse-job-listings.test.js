const test = require('node:test');
const assert = require('node:assert/strict');
const { runNode } = require('./helpers/run-node');
const { email1, email2, applicationUpdate } = require('./fixtures/sample-emails');

const parse = (emails) => runNode('parse-job-listings.js', { input: emails.map(e => ({ json: e })) }).map(o => o.json);

test('parses every job in a recommendation email', () => {
  const jobs = parse([email1]);
  assert.deepEqual(jobs.map(j => j.title), [
    'Graduate Software Developer',
    'Junior Frontend Developer',
    'English Language Teacher',
    'Data Analyst',
  ]);
});

test('extracts company, location, salary and the job link', () => {
  const [grad] = parse([email1]);
  assert.equal(grad.company, 'Kiwi Fintech Limited');
  assert.equal(grad.location, 'Auckland CBD, Auckland');
  assert.equal(grad.salary, '$65,000 – $72,000 per year');
  assert.equal(grad.url, 'https://url.example.com/t2');   // the link after the job, not the logo link
  assert.equal(grad.source, 'seek_alert');
  assert.equal(grad.listed_at, email1.date);
});

test('joins wrapped bullet lines into one bullet', () => {
  const [grad] = parse([email1]);
  assert.match(grad.description, /- Structured graduate programme .* and a clear path to intermediate/);
  assert.equal(grad.description.split('\n').length, 3);
});

test('keeps "Immediate start" as a note and treats perks as description, not salary', () => {
  const junior = parse([email1])[1];
  assert.equal(junior.location, 'Ponsonby, Auckland (Hybrid)');
  assert.equal(junior.salary, null);
  assert.equal(junior.description, 'Immediate start\nFree coffee + flexible hours');
});

test('joins a company name that wraps onto two lines', () => {
  const teacher = parse([email1])[2];
  assert.equal(teacher.company,
    'Canterbury International College Limited trading as Example International English College (EIEC)');
  assert.equal(teacher.location, 'Auckland CBD, Auckland');
});

test('ignores label lines like "Featured", "Strong applicant" and "(AUD)"', () => {
  const analyst = parse([email1])[3];
  assert.equal(analyst.company, 'Harbour Insights');
  assert.equal(analyst.location, 'Auckland');
  assert.equal(analyst.description, '- SQL and Power BI reporting');
});

test('de-duplicates the same job across emails by title + company + location', () => {
  const jobs = parse([email1, email2]);
  assert.equal(jobs.filter(j => j.title === 'Graduate Software Developer').length, 1);
  assert.equal(jobs.length, 5);
  const fullStack = jobs.find(j => j.title === 'Full Stack Developer');
  assert.equal(fullStack.salary, '$80k - $95k p.a.');
  assert.equal(fullStack.external_id, 'full stack developer|example software ltd|wellington central, wellington');
});

test('skips emails that are not SEEK recommendations', () => {
  assert.deepEqual(parse([applicationUpdate]), []);
});
