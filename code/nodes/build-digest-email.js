// Generated from the "Build digest email" node in workflow/seek-job-alert-pipeline.json.
// Do not edit here: change the node in n8n, export the workflow, and re-run
// node scripts/extract-node-code.js

// Build one HTML digest email from all matching jobs.
const jobs = $input.all().map(i => i.json);
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const rows = jobs.map(j => {
  let flags = j.red_flags;
  if (typeof flags === 'string') { try { flags = JSON.parse(flags); } catch (e) { flags = []; } }
  if (!Array.isArray(flags)) flags = [];
  const colour = j.fit_score >= 80 ? '#1a7f37' : '#9a6700';
  const meta = [j.company, j.location, j.salary].filter(Boolean).map(esc).join(' &middot; ');
  return `
    <tr>
      <td style="padding:14px 12px;border-bottom:1px solid #eee;vertical-align:top;width:56px;">
        <div style="font-size:22px;font-weight:bold;color:${colour};">${j.fit_score}</div>
      </td>
      <td style="padding:14px 12px;border-bottom:1px solid #eee;">
        <a href="${esc(j.url)}" style="font-size:16px;font-weight:bold;color:#0b57d0;text-decoration:none;">${esc(j.title)}</a>
        ${meta ? `<div style="color:#555;margin-top:2px;">${meta}</div>` : ''}
        <div style="margin-top:6px;">${esc(j.fit_reason)}</div>
        ${flags.length ? `<div style="margin-top:6px;color:#b42318;">&#9888; ${flags.map(esc).join(' &middot; ')}</div>` : ''}
      </td>
    </tr>`;
}).join('');

const date = $now.setZone('Pacific/Auckland').toFormat('ccc d LLL');
const html = `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;color:#1f1f1f;">
  <h2 style="margin:0 0 4px;">Job matches for ${date}</h2>
  <p style="margin:0 0 16px;color:#555;">${jobs.length} new role${jobs.length === 1 ? '' : 's'} scored 60+ against your profile.</p>
  <table style="width:100%;border-collapse:collapse;">${rows}</table>
  <p style="margin-top:20px;font-size:12px;color:#888;">Sent by your n8n job alert pipeline. Scores are AI-generated: check each ad before applying.</p>
</div>`;

return [{ json: {
  subject: `${jobs.length} job match${jobs.length === 1 ? '' : 'es'} \u2013 ${date}`,
  html,
  ids: jobs.map(j => j.id),
}}];
