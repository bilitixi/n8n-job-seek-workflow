#!/usr/bin/env node
// Generates the readable files in code/ from the exported n8n workflow.
// The workflow JSON is the source of truth; never edit code/nodes, code/sql or code/ai by hand.
//
// Usage:
//   node scripts/extract-node-code.js [workflow/seek-job-alert-pipeline.json]

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const input = path.resolve(root, process.argv[2] || 'workflow/seek-job-alert-pipeline.json');
const workflow = JSON.parse(fs.readFileSync(input, 'utf8'));

const slug = (name) =>
  name.toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const header = (node, comment) =>
  `${comment} Generated from the "${node.name}" node in ${path.relative(root, input)}.\n` +
  `${comment} Do not edit here: change the node in n8n, export the workflow, and re-run\n` +
  `${comment} node scripts/extract-node-code.js\n\n`;

const write = (rel, content) => {
  const file = path.join(root, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  console.log('wrote', rel);
};

// Clear previously generated files so renamed or removed nodes don't leave stale copies behind
for (const dir of ['code/nodes', 'code/sql', 'code/ai']) {
  fs.rmSync(path.join(root, dir), { recursive: true, force: true });
}

for (const node of workflow.nodes) {
  const p = node.parameters || {};

  // Code nodes -> code/nodes/<name>.js
  if (node.type === 'n8n-nodes-base.code' && p.jsCode) {
    write(`code/nodes/${slug(node.name)}.js`, header(node, '//') + p.jsCode);
  }

  // Postgres "Execute Query" nodes -> code/sql/<name>.sql
  if (node.type === 'n8n-nodes-base.postgres' && p.operation === 'executeQuery' && p.query) {
    const sql = p.query.replace(/^=/, '');   // a leading "=" only marks an n8n expression
    write(`code/sql/${slug(node.name)}.sql`, header(node, '--') + sql + '\n');
  }

  // LLM chain prompt -> code/ai/<name>-prompt.md
  if (node.type === '@n8n/n8n-nodes-langchain.chainLlm' && p.text) {
    const prompt = p.text.replace(/^=/, '');
    write(`code/ai/${slug(node.name)}-prompt.md`,
      `<!-- Generated from the "${node.name}" node. {{ ... }} parts are filled in by n8n for each batch. -->\n\n` +
      '```text\n' + prompt + '\n```\n');
  }

  // Structured Output Parser schema -> code/ai/<name>.schema.json
  if (node.type === '@n8n/n8n-nodes-langchain.outputParserStructured' && p.inputSchema) {
    write(`code/ai/${slug(node.name)}.schema.json`, JSON.stringify(JSON.parse(p.inputSchema), null, 2) + '\n');
  }
}
