# Setting up the credentials

The workflow needs **four credentials**. They are created inside n8n and stored there in encrypted form; none of them are in this repository. Set them up in this order, then attach each one to the nodes listed.

| # | Credential | n8n credential type | Used by | You need |
|---|---|---|---|---|
| 1 | Database | **Postgres** | Insert new jobs, Skip senior roles, Get jobs to score, Save score, Get jobs to notify, Mark jobs notified | A Supabase project |
| 2 | Gmail | **Gmail OAuth2 API** | Get SEEK alert emails, Mark alerts as read, Send digest | A Gmail account and a Google Cloud project (free) |
| 3 | AI model | **OpenRouter** | OpenRouter (free model) | An OpenRouter account (free) |
| 4 | Webhook key | **Header Auth** | Daily run (webhook) | A random secret you generate |

> **Before you start:** import `workflow/seek-job-alert-pipeline.json` into n8n (**⋯ → Import from File**). Nodes without a credential show a red warning triangle; the triangles disappear as you work through this guide.

---

## 1. Postgres (Supabase)

### 1a. Prepare the database

1. Create a project at [supabase.com](https://supabase.com) (free plan). Save the **database password** you choose; Supabase does not show it again.
2. Open **SQL Editor**, paste [`database/schema.sql`](../database/schema.sql), and click **Run**. This creates the `jobs` and `workflow_runs` tables, enables Row Level Security, and creates the `n8n` schema.

### 1b. Get the connection details

1. In the Supabase dashboard, click **Connect** (top of the project page).
2. Choose **Session pooler**, not "Direct connection". The direct connection is IPv6-only on the free plan, and most servers and Docker setups can't reach it.
3. Click **View parameters** and note the values:

| Supabase shows | Example |
|---|---|
| host | `aws-0-ap-southeast-2.pooler.supabase.com` |
| port | `5432` |
| database | `postgres` |
| user | `postgres.abcdefghijklmnop` (includes your project ref after the dot) |

### 1c. Create the credential in n8n

1. **Overview → Credentials → Create credential** → search **Postgres** → **Continue**.
2. Fill in:

| Field | Value |
|---|---|
| Host | the pooler host |
| Database | `postgres` |
| User | `postgres.<project-ref>` (copy exactly; the part after the dot is required) |
| Password | your Supabase database password |
| Maximum Number of Connections | `5` |
| SSL | `Require` |
| Ignore SSL Issues | **On** (Supabase uses its own certificate authority) |
| Port | `5432` |

3. Rename it (e.g. **Supabase – jobs**) and click **Save**. You should see **Connection tested successfully**.

### 1d. Attach it

Open each of the **6 Postgres nodes** and select this credential: *Insert new jobs, Skip senior roles, Get jobs to score, Save score, Get jobs to notify, Mark jobs notified.*

### Troubleshooting

| Error | Fix |
|---|---|
| `connect ENETUNREACH 2406:…` (an IPv6 address) | You used the direct host. Use the `…pooler.supabase.com` host |
| `Tenant or user not found` | The user is missing the `.<project-ref>` suffix |
| `self-signed certificate in certificate chain` | Turn on **Ignore SSL Issues** |
| `password authentication failed` | Reset the database password (Project Settings → Database) and paste it again; avoid special characters |
| Timeouts after a quiet week | Free Supabase projects pause after 7 days without activity. Resume the project in the dashboard |
| `column "retry_count" does not exist` | Run `schema.sql` again; its `ALTER TABLE … ADD COLUMN IF NOT EXISTS` line adds it |

---

## 2. Gmail OAuth2

Gmail requires OAuth: n8n gets a limited access token that you approve, never your password. This takes about 15 minutes, once.

### 2a. Get the redirect URL from n8n

1. **Create credential** → search **Gmail OAuth2 API** → **Continue**.
2. Copy the **OAuth Redirect URL** shown at the top, for example:
   - local n8n: `http://localhost:5678/rest/oauth2-credential/callback`
   - deployed n8n: `https://<your-domain>/rest/oauth2-credential/callback`

   If the deployed URL shows the wrong host or `http`, fix `N8N_HOST` / `N8N_PROTOCOL` in your environment variables first.
3. Leave this tab open.

### 2b. Create a Google Cloud project

Go to [console.cloud.google.com](https://console.cloud.google.com) and sign in with **the Gmail account that receives the SEEK alerts**. No billing account is needed.

1. **Project selector → New Project** → name it (e.g. `n8n-job-alert`) → **Create**, then select it.
2. Search **Gmail API** → **Enable**.

### 2c. Configure the consent screen

1. Search **Google Auth Platform** (or **APIs & Services → OAuth consent screen**) → **Get started**.
2. App name `n8n Job Alert`, your email as support and contact email, **Audience: External** → agree → **Create**.
3. Go to **Audience → Test users → Add users** and add your Gmail address. **This step matters**: without it, sign-in fails with `Error 403: access_denied`.

Leave the app in **Testing** mode. Publishing requires extra branding details (homepage, privacy policy on a domain you own). The trade-off of Testing mode is that the sign-in **expires every 7 days** (see 2f).

### 2d. Create the OAuth client

1. **Clients → Create client → Web application**, name `n8n`.
2. **Authorized redirect URIs → Add URI**: paste the URL from 2a. If you use both a local and a deployed n8n, add **both** URLs.
3. **Create**, then copy the **Client ID** and **Client secret**.

### 2e. Finish the credential in n8n

1. Back in the n8n tab, paste the **Client ID** and **Client Secret**.
2. Click **Sign in with Google**, and choose the same Gmail account.
3. On "Google hasn't verified this app", click **Advanced → Go to n8n Job Alert (unsafe)**. It's your own app, so this is expected.
4. Tick all permissions → **Continue**. n8n should show **Account connected**.
5. Rename it (e.g. **Gmail – job alerts**) and **Save**.
6. Attach it to the **3 Gmail nodes**: *Get SEEK alert emails, Mark alerts as read, Send digest.*

### 2f. Weekly reconnect (Testing mode)

When runs fail with a Gmail authorisation error, open the credential and click **Sign in with Google** again. It takes about 30 seconds.

### 2g. Point it at your SEEK alerts

1. On SEEK, save a search and turn on **daily email alerts** to this Gmail address.
2. In Gmail (desktop), create a filter: **From** `noreply@s.seek.co.nz` (check the sender on one of your alerts) → **Apply the label** e.g. `Seek`.
3. In **Get SEEK alert emails → Search**, use your label name:
   ```
   label:Seek is:unread subject:"new jobs" newer_than:7d
   ```
   Test the same text in the Gmail search bar: it should list your SEEK recommendation emails only.
4. In **Send digest → To**, enter the address that should receive the digest.

### Troubleshooting

| Error | Fix |
|---|---|
| `Error 400: redirect_uri_mismatch` | The redirect URI in Google Cloud doesn't exactly match n8n's (check `http`/`https`, domain, trailing slash) |
| `Error 403: access_denied` | Your Gmail isn't listed under **Audience → Test users** |
| `Unable to sign without access token` | The credential has a Client ID but sign-in wasn't completed. Click **Sign in with Google** |
| `invalid_grant` / token expired | The 7-day Testing-mode limit. Reconnect (2f) |
| Gmail node returns 0 items | No unread emails match the search. Check the label name and that alerts are unread |

---

## 3. OpenRouter (free AI model)

1. Sign up at [openrouter.ai](https://openrouter.ai) (free).
2. Go to **Keys → Create key**, name it (e.g. `n8n-job-alert`), and copy it. It starts with `sk-or-`. Optionally set a credit limit of 0 so it can only use free models.
3. In n8n: **Create credential** → **OpenRouter** → paste the key → **Save** (e.g. **OpenRouter – free**).
4. Open the **OpenRouter (free model)** node (the small round node under **AI fit scoring**) and select the credential.
5. **Model**: `openrouter/free` lets OpenRouter pick whichever free model is available, which is the most reliable choice. You can instead pick a specific model whose id ends in `:free`. If you change it, also update `model_used` in **Save score** so the database records the right model.

Free models allow a limited number of requests per day. Because jobs are scored 10 per request, a normal day uses only 1–3 requests.

### Troubleshooting

| Error | Fix |
|---|---|
| `429` / "rate-limited upstream" | That free model is busy. Use `openrouter/free` or another `:free` model; failed jobs are retried on the next run |
| `502` / "Bad gateway" | A provider failed. **AI fit scoring** already retries 3 times, 5 seconds apart |
| `404` / model not found | The model was removed or renamed. Pick another from openrouter.ai/models (filter: free) |
| `402` / credits | You selected a paid model. Use one ending in `:free`, or `openrouter/free` |
| Parser error ("Failed to parse") | The model replied without valid JSON. Try a different model |

You can see every request and its error at **openrouter.ai/activity**.

---

## 4. Header Auth (webhook key)

The webhook URL is public, so a secret header stops anyone else from starting the workflow.

1. Generate a random secret and keep it in a password manager:
   - macOS / Linux: `openssl rand -hex 24`
   - Windows PowerShell: `-join ((48..57)+(97..122) | Get-Random -Count 40 | % {[char]$_})`
2. Open **Daily run (webhook)**:
   - **Path**: replace `seek-run-CHANGE-ME` with something hard to guess.
   - **Credential for Header Auth → Create new credential**: **Name** `X-Run-Key`, **Value** your secret → **Save**.
3. Save the workflow and click **Publish**. The production URL only works while the workflow is published.
4. Copy the **Production URL** from the node and test it:

   macOS / Linux:
   ```bash
   curl -X POST "https://<your-domain>/webhook/<your-path>" -H "X-Run-Key: <your secret>"
   ```
   Windows PowerShell:
   ```powershell
   Invoke-RestMethod -Method Post -Uri "https://<your-domain>/webhook/<your-path>" -Headers @{ "X-Run-Key" = "<your secret>" }
   ```
   Expected reply: `Workflow got started.` A new run then appears under **Executions**.

5. Use the same URL and header in your scheduler (see [deployment.md](deployment.md#4-scheduler-cron-joborg)).

### Troubleshooting

| Result | Fix |
|---|---|
| `403` / authorization error | The header name must be exactly `X-Run-Key`, and the value must match the credential |
| `404` / webhook not registered | The workflow isn't published, or the path in the URL doesn't match the node |
| Waits about a minute, then works | The host was asleep (Render free tier). Expected on the first call |

---

## Final checklist

- [ ] Postgres credential on all 6 Postgres nodes, "Connection tested successfully"
- [ ] Gmail credential shows **Account connected** and is on all 3 Gmail nodes
- [ ] **Get SEEK alert emails → Search** uses your Gmail label
- [ ] **Send digest → To** is your email address
- [ ] OpenRouter credential on **OpenRouter (free model)**
- [ ] **Daily run (webhook)** has your own path and the `X-Run-Key` credential
- [ ] The candidate profile in **AI fit scoring** describes you
- [ ] Workflow saved and **published**
- [ ] Test call returns `Workflow got started.` and the run succeeds in **Executions**

To test scoring before real alerts arrive, run [`database/seed-test-jobs.sql`](../database/seed-test-jobs.sql) in Supabase, call the webhook, and check the `jobs` table. Remove the test rows afterwards with `DELETE FROM jobs WHERE source = 'test';`.
