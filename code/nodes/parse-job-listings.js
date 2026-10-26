// Generated from the "Parse job listings" node in workflow/seek-job-alert-pipeline.json.
// Do not edit here: change the node in n8n, export the workflow, and re-run
// node scripts/extract-node-code.js

// Parse SEEK "Recommendations" alert emails into one item per job.
// Works on the plain-text body, which has a stable layout:
//   Title / Company / Location / [salary] / [perks] / * bullets / [Recently posted] / [tracking URL]
// SEEK links are tracking redirects with no job number, so the dedupe key is
// title + company + location, normalised.

const URL_LINE = /^\[(https?:\/\/[^\]\s]+)\]/;
const NOISE = /^(logo|featured|recently posted|strong applicant|early applicant|be an early applicant|expiring soon|new to you|actively hiring|urgently hiring|\(AUD\))$/i;
const TAGS = /^(immediate start)$/i;   // kept as a note in the description
const SALARY = /\$|\bper (hour|year|annum|day)\b|\bp\.?a\.?\b|\b\d+k\b/i;
const LOCATION = /,\s*\S|\((Hybrid|Remote|On[- ]?site)\)$|^(Auckland|Wellington|Christchurch|Hamilton|Tauranga|Dunedin|Queenstown|Nelson|Napier|Hastings|Palmerston North|New Plymouth|Whangarei|Rotorua|Invercargill|Canterbury|Waikato|Otago|Northland|Bay of Plenty|New Zealand|Remote)\b/i;
const START = /We recommend these jobs/i;
const END = /^View more jobs/i;

function norm(s) {
  return String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function parseEmail(email) {
  const text = (email.text || '').replace(/\r/g, '');
  let lines = text.split('\n');

  // Keep only the job list: after the intro paragraph, before "View more jobs".
  const s = lines.findIndex(l => START.test(l));
  if (s === -1) return [];
  let i = s;
  while (i < lines.length && lines[i].trim() !== '') i++;   // skip rest of intro paragraph
  const e = lines.findIndex((l, idx) => idx > i && END.test(l.trim()));
  lines = lines.slice(i, e === -1 ? lines.length : e);

  const jobs = [];
  let block = [];
  for (const raw of lines) {
    const m = raw.trim().match(URL_LINE);
    if (!m) { block.push(raw); continue; }

    // A URL line closes the block of text above it.
    const job = parseBlock(block, m[1]);
    if (job) jobs.push(job);
    block = [];
  }
  return jobs;
}

function parseBlock(block, url) {
  const bullets = [];
  const plain = [];
  const tags = [];
  for (const raw of block) {
    const t = raw.trim();
    if (!t || NOISE.test(t)) continue;
    if (TAGS.test(t)) { tags.push(t); continue; }
    if (/^\* /.test(t)) { bullets.push(t.slice(2).trim()); continue; }
    if (/^ {3,}\S/.test(raw) && bullets.length) {            // wrapped bullet line
      bullets[bullets.length - 1] += ' ' + t;
      continue;
    }
    plain.push(t);
  }
  if (plain.length < 3) return null;                        // logo links, headers, etc.

  // Title is line 1, location is the first line that looks like a place.
  // Anything in between is the company (long company names can wrap onto 2 lines).
  let locIdx = plain.findIndex((l, idx) => idx >= 2 && LOCATION.test(l));
  if (locIdx === -1) locIdx = 2;
  const title = plain[0];
  const company = plain.slice(1, locIdx).join(' ');
  const location = plain[locIdx];
  const rest = plain.slice(locIdx + 1);
  if (title.length > 120 || company.length > 120 || location.length > 80) return null;

  const salary = rest.find(l => SALARY.test(l)) || null;
  const perks = rest.filter(l => l !== salary);
  const description = [...tags, ...perks, ...bullets.map(b => '- ' + b)].join('\n') || null;

  return { title, company, location, salary, description, url };
}

// ---- Main ----
const out = [];
const seen = new Set();
for (const item of $input.all()) {
  const email = item.json;
  const fromName = (email.from && email.from.value && email.from.value[0] && email.from.value[0].name) || '';
  if (!/Recommendations/i.test(fromName)) continue;        // skip application updates, reminders, etc.

  for (const job of parseEmail(email)) {
    const key = [norm(job.title), norm(job.company), norm(job.location)].join('|');
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ json: {
      source: 'seek_alert',
      external_id: key,
      url: job.url,
      title: job.title,
      company: job.company,
      location: job.location,
      salary: job.salary,
      work_type: null,
      description: job.description,
      listed_at: email.date || null,
    }});
  }
}
return out;
