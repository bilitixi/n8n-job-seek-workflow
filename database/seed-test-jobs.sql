-- Test data for building the AI scoring step before real SEEK alerts arrive.
-- Run in the Supabase SQL Editor. Each job tests a different scoring case.

INSERT INTO jobs (source, external_id, url, title, company, location, salary, work_type, description)
VALUES
  ('test', 'test-001', 'https://example.com/jobs/1',
   'Graduate Software Developer', 'Kiwi Fintech Ltd', 'Auckland CBD, Auckland', '$65,000 - $72,000', 'Full time',
   'Join our 2027 graduate programme building customer-facing web apps with React and .NET on Azure. You will work in an agile squad with mentoring from senior engineers. Recent or upcoming computing graduates welcome.'),

  ('test', 'test-002', 'https://example.com/jobs/2',
   'Senior Backend Engineer', 'ScaleUp Systems', 'Auckland', '$150,000 - $170,000', 'Full time',
   'We need a senior engineer with 7+ years of experience designing distributed systems in Go and Kubernetes. You will lead architecture decisions and mentor a team of five.'),

  ('test', 'test-003', 'https://example.com/jobs/3',
   'Junior Data Analyst', 'Harbour Health Insights', 'Auckland', NULL, 'Full time',
   'Entry-level role building Power BI dashboards and writing SQL queries for reporting. Excel skills essential. Great opportunity to grow into data engineering.'),

  ('test', 'test-004', 'https://example.com/jobs/4',
   'Full Stack Developer Intern (Summer)', 'EduTech Aotearoa', 'Wellington Central, Wellington', '$28 per hour', 'Contract/Temp',
   '12-week summer internship working on our learning platform (React, Node.js, PostgreSQL). On-site in Wellington. Must be a current tertiary student.'),

  ('test', 'test-005', 'https://example.com/jobs/5',
   'Customer Service Representative', 'Big Telco NZ', 'Manukau, Auckland', '$26 per hour', 'Full time',
   'Answer customer calls and resolve billing queries. No technical skills required. NZ citizenship or residency required.')
ON CONFLICT (source, external_id) DO NOTHING;

-- To remove the test data later:
-- DELETE FROM jobs WHERE source = 'test';
