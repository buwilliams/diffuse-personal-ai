import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile as execFileCallback } from 'node:child_process';
import { promisify } from 'node:util';
import { buildForecastModel } from '../model/forecast-model.mjs';
import { listSnapshotDirectories, loadLatestSnapshot } from './lib/snapshots.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataRoot = path.join(projectRoot, 'data');
const requiredMetadata = ['id', 'title', 'description', 'schemaVersion', 'snapshotDate', 'asOfDate', 'sources', 'update'];
const recordCollections = {
  'capability-benchmarks': ['categories', 'benchmarks', 'observations', 'supportingRegistry', 'supportingObservations'],
  'metr-task-horizon': ['series', 'trendEstimates'],
  'compute-capacity': ['quarters'],
  adoption: ['series', 'observations', 'releases'],
  'research-evidence': ['observations'],
  'user-capabilities': ['capabilities'],
};
const errors = [];
const execFile = promisify(execFileCallback);

function assert(condition, message) {
  if (!condition) errors.push(message);
}

function collectSourceIds(value, result = []) {
  if (Array.isArray(value)) value.forEach((item) => collectSourceIds(item, result));
  else if (value && typeof value === 'object') {
    for (const [key, nested] of Object.entries(value)) {
      if (key === 'sourceId' && typeof nested === 'string') result.push(nested);
      else collectSourceIds(nested, result);
    }
  }
  return result;
}

function collectStrings(value, result = []) {
  if (typeof value === 'string') result.push(value);
  else if (Array.isArray(value)) value.forEach((item) => collectStrings(item, result));
  else if (value && typeof value === 'object') Object.values(value).forEach((item) => collectStrings(item, result));
  return result;
}

function firstCrossing(snapshotTime, maximumDays, predicate) {
  if (predicate(snapshotTime)) return snapshotTime;
  for (let day = 1; day <= maximumDays; day += 1) {
    const timestamp = snapshotTime + day * 86_400_000;
    if (predicate(timestamp)) return timestamp;
  }
  return null;
}

const { stdout: trackedData } = await execFile('git', ['ls-files', '--cached', '--others', '--exclude-standard', 'data'], { cwd: projectRoot });
for (const file of trackedData.split(/\r?\n/).filter(Boolean)) {
  assert(/^data\/snapshot-\d{8}\/[a-z0-9-]+\.json$/.test(file), `${file} violates the snapshot-only tracked-data contract`);
}

const directories = await listSnapshotDirectories(dataRoot);
assert(directories.length > 0, 'No dated data snapshots found');

for (const directory of directories) {
  const files = (await fs.readdir(directory.path, { withFileTypes: true })).filter((entry) => entry.isFile());
  assert(files.every((file) => file.name.endsWith('.json')), `${directory.name} contains a non-JSON file`);
  const envelopes = {};
  for (const file of files) {
    const fullPath = path.join(directory.path, file.name);
    const envelope = JSON.parse(await fs.readFile(fullPath, 'utf8'));
    envelopes[file.name] = envelope;
    assert(JSON.stringify(Object.keys(envelope)) === JSON.stringify(['metadata', 'data']), `${directory.name}/${file.name} must have only metadata and data at the root`);
    for (const field of requiredMetadata) assert(field in (envelope.metadata ?? {}), `${directory.name}/${file.name} is missing metadata.${field}`);
    assert(envelope.metadata.snapshotDate === envelope.metadata.asOfDate || envelope.metadata.asOfDate <= envelope.metadata.snapshotDate,
      `${directory.name}/${file.name} has an as-of date after its snapshot date`);
    const sources = envelope.metadata.sources ?? [];
    const sourceIds = new Set(sources.map((source) => source.id));
    assert(sourceIds.size === sources.length, `${directory.name}/${file.name} has duplicate metadata source IDs`);
    for (const source of sources) {
      assert(JSON.stringify(Object.keys(source)) === JSON.stringify(['id', 'publisher', 'title', 'url', 'accessedAt', 'roles', 'notes']),
        `${directory.name}/${file.name} source ${source.id} does not match the common source schema`);
      assert(/^https:\/\//.test(source.url), `${directory.name}/${file.name} source ${source.id} is not an HTTPS URL`);
      assert(/^\d{4}-\d{2}-\d{2}$/.test(source.accessedAt), `${directory.name}/${file.name} source ${source.id} has an invalid accessedAt`);
      assert(Array.isArray(source.roles) && source.roles.every((role) => typeof role === 'string' && role.length <= 40),
        `${directory.name}/${file.name} source ${source.id} has invalid roles`);
    }
    for (const sourceId of collectSourceIds(envelope.data)) {
      assert(sourceIds.has(sourceId), `${directory.name}/${file.name} references missing source ${sourceId}`);
    }
    for (const value of collectStrings(envelope)) {
      assert(!/(?:[A-Za-z]:\\\\|file:\/\/|\\\\wsl\.localhost)/i.test(value), `${directory.name}/${file.name} contains a local filesystem reference`);
    }
  }

  const manifest = envelopes['database.json'];
  assert(Boolean(manifest), `${directory.name} is missing database.json`);
  if (manifest) {
    const declared = new Set((manifest.data.datasets ?? []).map((dataset) => dataset.file));
    const actual = new Set(files.map((file) => file.name).filter((name) => name !== 'database.json'));
    assert(declared.size === actual.size && [...declared].every((name) => actual.has(name)), `${directory.name} manifest/file mismatch`);
    assert((manifest.data.datasets ?? []).filter((dataset) => dataset.requiredForCountdown).length >= 3,
      `${directory.name} must identify capability, METR, and compute as countdown inputs`);
    for (const descriptor of manifest.data.datasets ?? []) {
      const dataset = envelopes[descriptor.file];
      const collections = recordCollections[descriptor.id] ?? [];
      const calculatedCount = collections.reduce((sum, name) => sum + (dataset?.data?.[name]?.length ?? 0), 0);
      assert(calculatedCount === descriptor.recordCount,
        `${directory.name}/${descriptor.file} recordCount is ${descriptor.recordCount}; calculated ${calculatedCount}`);
    }
  }
}

const latest = await loadLatestSnapshot(dataRoot);
const model = buildForecastModel(latest);
const capability = latest.datasets['capability-benchmarks'].data;
const compute = latest.datasets['compute-capacity'].data;
assert(new Set(capability.benchmarks.map((row) => row.id)).size === capability.benchmarks.length, 'Capability benchmark IDs are not unique');
assert(capability.observations.every((row) => capability.benchmarks.some((benchmark) => benchmark.id === row.benchmarkId)), 'Capability observation has an unknown benchmark');
assert(model.capability.currentScore >= 0 && model.capability.currentScore <= 1, 'Current capability score is outside 0–1');
assert(model.capability.overallSeries.length === model.capability.quarters.length, 'Capability quarterly aggregate is incomplete');
assert(model.compute.quarterRows.length === model.capability.quarters.length, 'Capability and compute windows are misaligned');
assert(model.compute.targetUsers === compute.population.usResidents * compute.population.targetShare, 'Compute target users are inconsistent');
assert(model.defaults.supplyGateShareOfTarget === 1, 'Supply gate must require 100% of the already-selected population target');
assert(model.compute.currentScore === model.compute.currentSupportedUsers / model.compute.targetUsers, 'Current compute score is inconsistent');
assert(model.compute.quarterRows.every((row, index, rows) => index === 0 || row.quarterIndex > rows[index - 1].quarterIndex), 'Compute quarters are not strictly ordered');

const snapshotTime = Date.parse(`${model.snapshotDate}T00:00:00Z`);
const maximumDays = Math.round(365.2425 * model.defaults.maximumForecastYears);
const capabilityThreshold = model.defaults.capabilityThreshold;
const capabilityBase = firstCrossing(snapshotTime, maximumDays, (timestamp) =>
  model.capability.capabilityAt(timestamp, model.capability.currentScore, model.capability.h50Acceleration) >= capabilityThreshold);
const capabilityFaster = firstCrossing(snapshotTime, maximumDays, (timestamp) =>
  model.capability.capabilityAt(timestamp, model.capability.currentScore, model.capability.h50Acceleration + 0.1) >= capabilityThreshold);
assert(capabilityBase !== null && capabilityFaster !== null && capabilityFaster <= capabilityBase,
  'Increasing capability acceleration does not shorten or preserve the gate date');

const requiredComputeM = model.compute.requiredH100e / 1_000_000;
const computeBase = firstCrossing(snapshotTime, maximumDays, (timestamp) =>
  model.compute.capacityAt(timestamp, model.compute.currentComputeM, model.compute.acceleration) >= requiredComputeM);
const computeFaster = firstCrossing(snapshotTime, maximumDays, (timestamp) =>
  model.compute.capacityAt(timestamp, model.compute.currentComputeM, model.compute.acceleration + 0.01) >= requiredComputeM);
assert(computeBase !== null && computeFaster !== null && computeFaster <= computeBase,
  'Increasing compute acceleration does not shorten or preserve the gate date');

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join('\n'));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({
    snapshots: directories.map((directory) => directory.name),
    selected: `snapshot-${latest.id}`,
    datasets: latest.manifest.data.datasets.length,
    capabilityScore: model.capability.currentScore,
    capabilityScorePercent: model.capability.currentScore * 100,
    capabilityAcceleration: model.capability.h50Acceleration,
    computeScore: model.compute.currentScore,
    computeAcceleration: model.compute.acceleration,
    status: 'valid',
  }, null, 2));
}
