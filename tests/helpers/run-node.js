// Runs an n8n Code node's script outside n8n by providing the globals it expects.
//   input  - items arriving at the node: [{ json: {...} }, ...]
//   nodes  - outputs of earlier nodes, for $('Node name').all()
//   now    - a fake $now with .setZone().toFormat()
const fs = require('fs');
const path = require('path');

function runNode(file, { input = [], nodes = {}, now } = {}) {
  const code = fs.readFileSync(path.join(__dirname, '..', '..', 'code', 'nodes', file), 'utf8');
  const $input = { all: () => input };
  const $ = (name) => {
    if (!(name in nodes)) throw new Error(`Referenced node doesn't exist: ${name}`);
    return { all: () => nodes[name] };
  };
  const $now = now || { setZone: () => ({ toFormat: () => 'Tue 27 Oct' }) };
  return new Function('$input', '$', '$now', code)($input, $, $now);
}

module.exports = { runNode };
