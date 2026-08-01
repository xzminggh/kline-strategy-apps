const fs = require('fs');
const path = require('path');

function dirSize(dir, ignore) {
  let total = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignore.includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      total += dirSize(full, ignore);
    } else {
      total += fs.statSync(full).size;
    }
  }
  return total;
}

const base = __dirname;
const size = dirSize(base, ['node_modules', '.expo', '.git', 'node_modules_bak']);
console.log('Project size (no node_modules): ' + Math.round(size / 1024 / 1024 * 10) / 10 + ' MB');
