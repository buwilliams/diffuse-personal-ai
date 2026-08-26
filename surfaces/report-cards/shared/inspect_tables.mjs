import fs from 'node:fs';

for (const file of process.argv.slice(2)) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(Boolean);
  const best = {};
  for (const line of lines) {
    let record;
    try {
      record = JSON.parse(line);
    } catch {
      continue;
    }
    if (record.kind === 'table' && record.sheet && Array.isArray(record.values)) {
      const size = (record.rows || 0) * (record.cols || 0);
      if (!best[record.sheet] || size > best[record.sheet].size) {
        best[record.sheet] = { size, address: record.address, rows: record.rows, cols: record.cols, keys: Object.keys(record) };
      }
    }
  }
  console.log(file);
  console.log(JSON.stringify(best, null, 2));
}
