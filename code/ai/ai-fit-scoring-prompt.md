<!-- Generated from the "AI fit scoring" node. {{ ... }} parts are filled in by n8n for each batch. -->

```text
You are screening job ads for one candidate. Score how well EACH job below fits them.

CANDIDATE
- Final-year Bachelor of Computing Systems student (graduating Dec 2026), based in Auckland, New Zealand
- Currently working as a full-stack software engineering intern
- Skills: JavaScript, React, HTML/CSS, C#/.NET, Python, Java, SQL (PostgreSQL, MySQL), Azure (incl. Entra ID), Docker, Git, n8n
- Looking for: graduate programmes, junior roles, and internships
- Prefers web / full-stack / software development over data analytics
- Location: Auckland preferred, open to relocating within NZ; prefers on-site roles
- Sector interests: tech startups, education, finance, consulting

SCORING GUIDE
- 85-100: Entry-level software/web role, strong skill overlap, suitable location
- 65-84: Good fit with minor gaps (some unfamiliar tech, less preferred location or sector)
- 40-64: Partial fit (adjacent field such as data analytics, or notable skill gaps)
- 0-39: Poor fit (not a software role, or clearly too senior)

HARD RULES
- Senior, lead, principal, or manager roles, or roles requiring 3+ years of experience: score no higher than 25
- Non-technical roles: score no higher than 15
- Roles outside New Zealand: score no higher than 20
- If details are missing, judge from what is given and do not invent requirements
- Score each job on its own merits; do not compare jobs against each other

RED FLAGS
For each job, list short phrases for anything the candidate should check before applying, for example:
"5+ years required", "citizenship required", "security clearance", "outside Auckland", "unpaid".
Use an empty list if there are none.

OUTPUT
Return exactly one result for every job below ({{ $json.count }} jobs), using the job's id exactly as given.
Give fit_reason as one sentence (max 30 words) explaining the main reason for the score.

JOBS
{{ $json.jobsText }}
```
