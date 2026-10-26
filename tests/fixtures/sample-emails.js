// Synthetic emails in the same plain-text layout as SEEK "Recommendations" alerts.
// All names, companies and links are made up; no real email content is stored in this repo.

const recommendation = (id, date, jobsText) => ({
  id,
  date,
  subject: 'Graduate Software Developer + 11 new jobs',
  from: { value: [{ name: 'SEEK Recommendations', address: 'noreply@example.com' }] },
  text: `View job recommendations just for you

seek
[https://url.example.com/header]

Hi Alex, we've got new job recommendations for you
We want to help find the job that's right for you - and these roles could be a
match.
We recommend these jobs based on your profile, past viewed jobs and
applications.

${jobsText}
View more jobs [https://url.example.com/more]

These recommendations are based on your past activity.
[https://url.example.com/footer]
`,
});

// Covers: logo links, salary, wrapped bullet, "Immediate start" tag, perks line,
// a company name wrapped over two lines, "Featured"/"Strong applicant" labels and "(AUD)".
const email1 = recommendation('msg-1', '2026-10-24T05:11:54.000Z', `logo
[https://url.example.com/t1]

Graduate Software Developer
Kiwi Fintech Limited

Auckland CBD, Auckland
$65,000 – $72,000 per year
 * Build web apps with React and .NET on Azure
 * Structured graduate programme with mentoring from senior engineers and a
   clear path to intermediate
 * Hybrid working

Recently posted

[https://url.example.com/t2]
Junior Frontend Developer
Tiny Startup Co

Immediate start

Ponsonby, Auckland (Hybrid)
Free coffee + flexible hours
Recently posted

[https://url.example.com/t3]

logo
[https://url.example.com/t4]

English Language Teacher
Canterbury International College Limited trading as Example International
English College (EIEC)
Auckland CBD, Auckland

[https://url.example.com/t5]
Data Analyst
Harbour Insights

Featured

Strong applicant

Auckland
(AUD)
 * SQL and Power BI reporting

[https://url.example.com/t6]
`);

// Repeats one job from email1 (should be de-duplicated) and adds one new job.
const email2 = recommendation('msg-2', '2026-10-25T05:11:54.000Z', `Graduate Software Developer
Kiwi Fintech Limited

Auckland CBD, Auckland
$65,000 – $72,000 per year

[https://url.example.com/t8]
Full Stack Developer
Example Software Ltd

Wellington Central, Wellington
$80k - $95k p.a.

[https://url.example.com/t9]
`);

// Not a recommendation email: must be ignored.
const applicationUpdate = {
  id: 'msg-3',
  date: '2026-10-25T23:41:54.000Z',
  subject: 'New activity in jobs you applied for',
  from: { value: [{ name: 'SEEK Applications', address: 'noreply@example.com' }] },
  text: 'We recommend these jobs\n\nSome Job\nSome Company\nAuckland\n[https://url.example.com/x]\n',
};

module.exports = { email1, email2, applicationUpdate };
