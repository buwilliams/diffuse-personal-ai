import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { listSnapshotDirectories } from './lib/snapshots.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataRoot = path.join(projectRoot, 'data');
const timelineUrl = 'https://epoch.ai/data/data_centers/data_center_timelines.csv';
const registryUrl = 'https://epoch.ai/data/data_centers/data_centers.csv';

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ',') {
      row.push(field);
      field = '';
    } else if (character === '\n') {
      row.push(field.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += character;
    }
  }
  if (field || row.length) {
    row.push(field.replace(/\r$/, ''));
    rows.push(row);
  }
  const headers = rows.shift();
  return rows
    .filter((values) => values.some((value) => value !== ''))
    .map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ''])));
}

function number(value) {
  if (value === '' || value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

async function selectedSnapshotDirectory() {
  const requested = process.argv[2];
  if (requested) return path.resolve(projectRoot, requested);
  const snapshots = await listSnapshotDirectories(dataRoot);
  if (!snapshots.length) throw new Error('No snapshot-YYYYMMDD directories found');
  return snapshots.at(-1).path;
}

async function fetchCsv(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: ${response.status} ${response.statusText}`);
  return parseCsv(await response.text());
}

const snapshotDirectory = await selectedSnapshotDirectory();
const sourceDirectory = path.join(snapshotDirectory, 'gate2-sources');
const timelineFile = path.join(sourceDirectory, 'epoch-ai-ai-data-center-timelines-csv-data.json');
const registryFile = path.join(sourceDirectory, 'epoch-ai-ai-data-centers-csv-data.json');
const [timelineRows, registryRows, timelineEnvelope] = await Promise.all([
  fetchCsv(timelineUrl),
  fetchCsv(registryUrl),
  readJson(timelineFile),
]);

const snapshotDate = timelineEnvelope.metadata.snapshotDate;
const accessedAt = timelineEnvelope.metadata.sources[0].accessedAt;
const usSites = new Set(registryRows.filter((row) => row.Country === 'United States').map((row) => row.Name));
const timelinesBySite = new Map();
for (const row of timelineRows) {
  if (!usSites.has(row['Data center'])) continue;
  if (!timelinesBySite.has(row['Data center'])) timelinesBySite.set(row['Data center'], []);
  timelinesBySite.get(row['Data center']).push(row);
}
for (const rows of timelinesBySite.values()) rows.sort((a, b) => a.Date.localeCompare(b.Date));

const quarterFragment = timelineEnvelope.data.fragments.find(
  (fragment) => fragment.datasetId === 'compute-capacity' && fragment.collection === 'quarters',
);
if (!quarterFragment) throw new Error('Missing compute-capacity.quarters fragment');

for (const item of quarterFragment.items) {
  const record = item.record;
  let usH100e = 0;
  let usItPowerMw = 0;
  let usFacilityPowerMw = 0;
  let includedSites = 0;
  for (const rows of timelinesBySite.values()) {
    const state = rows.filter((row) => row.Date <= record.cutoffDate).at(-1);
    if (!state) continue;
    const h100e = number(state['H100 equivalents']) ?? 0;
    const itPowerMw = number(state['IT power (MW)']) ?? 0;
    const facilityPowerMw = number(state['Power (MW)']) ?? 0;
    usH100e += h100e;
    usItPowerMw += itPowerMw;
    usFacilityPowerMw += facilityPowerMw;
    if (h100e > 0 || itPowerMw > 0 || facilityPowerMw > 0) includedSites += 1;
  }
  if (Math.abs(usH100e - record.usH100e) > 0.5) {
    throw new Error(`${record.quarter}: reconstructed ${usH100e} H100e, expected ${record.usH100e}`);
  }
  Object.assign(record, {
    usItPowerMw: Number(usItPowerMw.toFixed(6)),
    usFacilityPowerMw: Number(usFacilityPowerMw.toFixed(6)),
    usH100e: Math.round(usH100e),
    includedSites,
    methodNote: `${record.evidenceClass}: Latest published state on or before cutoff for each Epoch-covered U.S. site. U.S. sites are selected through Epoch's data-center registry; IT power is the physical source metric and H100e is retained as a productivity audit bridge.`,
  });
}

timelineEnvelope.metadata.description = 'Normalized U.S. operational IT-power and secondary H100-equivalent audit data attributable to Epoch AI timelines.';
timelineEnvelope.metadata.sources[0].roles = ['IT-power observation', 'IT-power projection', 'H100e productivity audit bridge'];
timelineEnvelope.metadata.sources[0].notes = 'Observed quarters use the latest operational state at each cutoff; forward quarters use the latest expected/projected state dated by each cutoff. U.S. geography is joined from Epoch’s data-center registry.';
timelineEnvelope.data.results = {};
await fs.writeFile(timelineFile, `${JSON.stringify(timelineEnvelope, null, 2)}\n`, 'utf8');

const registryItems = registryRows.map((row, order) => ({
  order,
  id: `compute-capacity.siteRegistry.${String(order + 1).padStart(3, '0')}`,
  record: {
    id: row.Name,
    name: row.Name,
    country: row.Country || null,
    currentH100e: number(row['Current H100 equivalents']),
    currentItPowerMw: number(row['Current power (MW)']),
    owner: row.Owner || null,
    users: row.Users || null,
    address: row.Address || null,
    sourceId: 'gate2-epoch-ai-ai-data-centers-csv',
  },
}));

const registryEnvelope = {
  metadata: {
    id: 'gate2-epoch-ai-ai-data-centers-csv',
    title: 'AI Data Centers CSV',
    description: 'Epoch AI data-center registry used to identify U.S. sites and audit current facility-level capacity.',
    schemaVersion: timelineEnvelope.metadata.schemaVersion,
    snapshotDate,
    asOfDate: timelineEnvelope.metadata.asOfDate,
    sources: [{
      id: 'gate2-epoch-ai-ai-data-centers-csv',
      publisher: 'Epoch AI',
      title: 'AI Data Centers CSV',
      url: registryUrl,
      accessedAt,
      roles: ['site registry', 'geography filter', 'facility audit'],
      notes: 'Country identifies the U.S. sites included in the quarterly timeline reconstruction. Current power is the registry’s current IT-power estimate and is retained as a facility-level audit field; the quarterly gate path is reconstructed from the dated timeline.',
    }],
    update: {
      method: 'deterministic source extraction and normalization with human review',
      notes: 'Refresh this file together with Epoch’s timeline CSV in a new dated snapshot; never revise a published snapshot.',
    },
  },
  data: {
    gateId: 'gate2',
    results: {},
    fragments: [{
      datasetId: 'compute-capacity',
      collection: 'siteRegistry',
      kind: 'records',
      items: registryItems,
    }],
  },
};
await fs.writeFile(registryFile, `${JSON.stringify(registryEnvelope, null, 2)}\n`, 'utf8');

console.log(`Refreshed ${quarterFragment.items.length} quarterly states and ${registryItems.length} data-center records.`);
