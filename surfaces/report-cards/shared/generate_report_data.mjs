import fs from 'node:fs/promises';

const githubDataBase = 'https://raw.githubusercontent.com/buwilliams/diffuse-personal-ai/main/data/reports';

const [capabilityPath, computePath, outputPath] = process.argv.slice(2);

const descriptions = {
  capability: {
    Summary: 'Current grades, category balance, and the quarterly capability trajectory.',
    'Report Card': 'Every benchmark, quarterly score, rate of change, current grade, and projection.',
    Observations: 'The dated benchmark observations that anchor the historical series.',
    Catalog: 'The benchmark universe, normalization rules, grading status, and scope notes.',
    Model: 'Quarter-level model inputs, fitted motion, and projected benchmark paths.',
    Methodology: 'Definitions, scoring rules, grade scale, projection method, and limitations.',
  },
  compute: {
    Summary: 'The current serving score, two-gate status, quarterly path, and interpretation.',
    'Compute Report Card': 'The four-year quarterly supply score, velocity, and acceleration.',
    'Quarterly Model': 'Observed and projected U.S. H100-equivalents, serving capacity, users, and grades.',
    Assumptions: 'Population threshold, workload, serving envelope, grade scale, and growth model.',
    Observations: 'Quarterly operational U.S. compute reconstructed from the source timeline.',
    Sources: 'Primary datasets, access dates, uses, and limitations.',
  },
};

function isBlank(value) {
  return value === null || value === undefined || value === '';
}

function normalizeRows(rows) {
  const normalized = [];
  for (const sourceRow of rows) {
    let last = sourceRow.length - 1;
    while (last >= 0 && isBlank(sourceRow[last])) last -= 1;
    if (last < 0) continue;
    const row = sourceRow.slice(0, last + 1);

    for (let start = 0; start < row.length;) {
      const value = row[start];
      let end = start + 1;
      while (end < row.length && row[end] === value) end += 1;
      if (end - start > 1 && typeof value === 'string' && value.length > 3) {
        for (let index = start + 1; index < end; index += 1) row[index] = null;
      }
      start = end;
    }
    normalized.push(row);
  }
  return normalized;
}

async function extract(file, id, title, download) {
  const lines = (await fs.readFile(file, 'utf8')).split(/\r?\n/).filter(Boolean);
  const best = new Map();
  for (const line of lines) {
    let record;
    try {
      record = JSON.parse(line);
    } catch {
      continue;
    }
    if (record.kind !== 'table' || !record.sheet || !Array.isArray(record.values)) continue;
    const size = (record.rows || 0) * (record.cols || 0);
    if (!best.has(record.sheet) || size > best.get(record.sheet).size) {
      best.set(record.sheet, { ...record, size });
    }
  }

  const sheets = [...best.values()].map((sheet) => {
    const rows = normalizeRows(sheet.values);
    return {
      name: sheet.sheet,
      address: sheet.address,
      description: descriptions[id][sheet.sheet] || 'Workbook data.',
      sourceRows: sheet.rows,
      sourceColumns: sheet.cols,
      nonEmptyCells: rows.flat().filter((value) => !isBlank(value)).length,
      rows,
    };
  });

  return { id, title, download, sheets };
}

const workbooks = {
  capability: await extract(
    capabilityPath,
    'capability',
    'Model–harness capability report card',
    `${githubDataBase}/personal-ai-four-year-capability-report-card.xlsx`,
  ),
  compute: await extract(
    computePath,
    'compute',
    'U.S. compute report card',
    `${githubDataBase}/personal-ai-compute-report-card.xlsx`,
  ),
};

const source = `export type ReportCell = string | number | boolean | null;
export type ReportSheet = {
  name: string;
  address: string;
  description: string;
  sourceRows: number;
  sourceColumns: number;
  nonEmptyCells: number;
  rows: ReportCell[][];
};
export type ReportWorkbook = {
  id: 'capability' | 'compute';
  title: string;
  download: string;
  sheets: ReportSheet[];
};

export const workbooks: Record<'capability' | 'compute', ReportWorkbook> = ${JSON.stringify(workbooks, null, 2)};
`;

await fs.writeFile(outputPath, source, 'utf8');
console.log(JSON.stringify({
  outputPath,
  workbooks: Object.fromEntries(Object.entries(workbooks).map(([key, workbook]) => [key, {
    sheets: workbook.sheets.map((sheet) => ({ name: sheet.name, rows: sheet.sourceRows, columns: sheet.sourceColumns, nonEmptyCells: sheet.nonEmptyCells })),
  }])),
}, null, 2));
