import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile as execFileCallback } from 'node:child_process';
import { promisify } from 'node:util';
import { buildForecastModel } from '../model/forecast-model.mjs';
import { listSnapshotDirectories, loadLatestSnapshot } from './lib/snapshots.mjs';
import { buildSourceResults } from './lib/source-results.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataRoot = path.join(projectRoot, 'data');
const requiredMetadata = ['id', 'title', 'description', 'schemaVersion', 'snapshotDate', 'asOfDate', 'sources', 'update'];
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

async function listFiles(directory, prefix = '') {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) files.push(...await listFiles(path.join(directory, entry.name), relative));
    else files.push(relative);
  }
  return files.sort();
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
  try {
    await fs.access(path.join(projectRoot, ...file.split('/')));
  } catch {
    continue;
  }
  assert(
    /^data\/snapshot-\d{8}(?:-\d+)?\/(?:database\.json|gate[12]-consolidated\.json|gate[12]-sources\/[a-z0-9-]+-data\.json)$/.test(file),
    `${file} violates the source-first snapshot contract`,
  );
}

const directories = await listSnapshotDirectories(dataRoot);
assert(directories.length > 0, 'No dated data snapshots found');

for (const directory of directories) {
  const relativeFiles = await listFiles(directory.path);
  assert(relativeFiles.every((file) => file.endsWith('.json')), `${directory.name} contains a non-JSON file`);
  const envelopes = {};

  for (const relativeFile of relativeFiles) {
    const fullPath = path.join(directory.path, ...relativeFile.split('/'));
    const envelope = JSON.parse(await fs.readFile(fullPath, 'utf8'));
    envelopes[relativeFile] = envelope;
    assert(JSON.stringify(Object.keys(envelope)) === JSON.stringify(['metadata', 'data']), `${directory.name}/${relativeFile} must have only metadata and data at the root`);
    for (const field of requiredMetadata) assert(field in (envelope.metadata ?? {}), `${directory.name}/${relativeFile} is missing metadata.${field}`);
    assert(envelope.metadata.asOfDate <= envelope.metadata.snapshotDate, `${directory.name}/${relativeFile} has an as-of date after its snapshot date`);
    const sources = envelope.metadata.sources ?? [];
    const sourceIds = new Set(sources.map((source) => source.id));
    assert(sourceIds.size === sources.length, `${directory.name}/${relativeFile} has duplicate metadata source IDs`);
    for (const source of sources) {
      assert(JSON.stringify(Object.keys(source)) === JSON.stringify(['id', 'publisher', 'title', 'url', 'accessedAt', 'roles', 'notes']), `${directory.name}/${relativeFile} source ${source.id} does not match the common source schema`);
      assert(/^https:\/\//.test(source.url), `${directory.name}/${relativeFile} source ${source.id} is not an HTTPS URL`);
      assert(/^\d{4}-\d{2}-\d{2}$/.test(source.accessedAt), `${directory.name}/${relativeFile} source ${source.id} has an invalid accessedAt`);
      assert(Array.isArray(source.roles) && source.roles.every((role) => typeof role === 'string' && role.length <= 40), `${directory.name}/${relativeFile} source ${source.id} has invalid roles`);
    }
    for (const sourceId of collectSourceIds(envelope.data)) {
      assert(sourceIds.has(sourceId), `${directory.name}/${relativeFile} references missing source ${sourceId}`);
    }
    for (const value of collectStrings(envelope)) {
      assert(!/(?:[A-Za-z]:\\|file:\/\/|\\wsl\.localhost)/i.test(value), `${directory.name}/${relativeFile} contains a local filesystem reference`);
    }

    if (/^gate[12]-sources\//.test(relativeFile)) {
      assert(sources.length === 1, `${directory.name}/${relativeFile} must describe exactly one source`);
      assert(Array.isArray(envelope.data.fragments), `${directory.name}/${relativeFile} must contain data.fragments`);
      assert(Boolean(envelope.data.results), `${directory.name}/${relativeFile} must contain data.results`);
      assert(['reported-scores', 'reported-measurements', 'forecast-assumptions', 'descriptive-only'].includes(envelope.data.results?.status), `${directory.name}/${relativeFile} has an invalid results status`);
      assert(['direct-input', 'supporting-input', 'forecast-method', 'context-only'].includes(envelope.data.results?.countdownRole), `${directory.name}/${relativeFile} has an invalid countdown role`);
      assert(Array.isArray(envelope.data.results?.measurements), `${directory.name}/${relativeFile} must contain a results.measurements array`);
      assert(Boolean(envelope.data.results?.summary), `${directory.name}/${relativeFile} must explain its result status`);
      for (const result of envelope.data.results?.measurements ?? []) {
        assert(['score', 'measurement', 'assumption'].includes(result.measurementType), `${directory.name}/${relativeFile} has an invalid result measurement type`);
        assert(['source-reported', 'normalized-source-result', 'derived-from-source', 'forecast-assumption'].includes(result.origin), `${directory.name}/${relativeFile} has an invalid result origin`);
        assert(typeof result.value === 'number' && Number.isFinite(result.value), `${directory.name}/${relativeFile} has a non-finite result value`);
        assert(typeof result.usedInCountdown === 'boolean', `${directory.name}/${relativeFile} result does not state countdown use`);
      }
      const gateId = relativeFile.split('-sources/')[0];
      assert(envelope.data.gateId === gateId, `${directory.name}/${relativeFile} has the wrong gateId`);
      for (const fragment of envelope.data.fragments ?? []) {
        assert(['records', 'value'].includes(fragment.kind), `${directory.name}/${relativeFile} has an invalid fragment kind`);
        if (fragment.kind === 'records') {
          assert(Array.isArray(fragment.items), `${directory.name}/${relativeFile} record fragment is missing items`);
          assert(fragment.items.every((item) => Number.isInteger(item.order) && 'record' in item), `${directory.name}/${relativeFile} has an invalid record fragment item`);
        }
      }
    }
  }

  const manifest = envelopes['database.json'];
  assert(Boolean(manifest), `${directory.name} is missing database.json`);
  if (!manifest) continue;
  for (const [relativeFile, envelope] of Object.entries(envelopes).filter(([file]) => /^gate[12]-sources\//.test(file))) {
    assert(envelope.metadata.schemaVersion === manifest.metadata.schemaVersion, `${directory.name}/${relativeFile} does not use the manifest schema version`);
    assert(JSON.stringify(envelope.data.results) === JSON.stringify(buildSourceResults(envelope, manifest)), `${directory.name}/${relativeFile} has stale or inconsistent materialized results`);
  }
  const declaredFiles = new Set(['database.json']);

  for (const gate of manifest.data.gates ?? []) {
    declaredFiles.add(gate.consolidatedFile);
    const sourcePrefix = `${gate.sourceDirectory}/`;
    const sourcePaths = relativeFiles.filter((file) => file.startsWith(sourcePrefix));
    sourcePaths.forEach((file) => declaredFiles.add(file));
    assert(sourcePaths.length > 0, `${directory.name}/${gate.sourceDirectory} has no source files`);
    const consolidated = envelopes[gate.consolidatedFile];
    assert(Boolean(consolidated), `${directory.name} is missing ${gate.consolidatedFile}`);
    if (!consolidated) continue;
    assert(consolidated.metadata.id === `${gate.id}-consolidated`, `${directory.name}/${gate.consolidatedFile} has the wrong id`);
    const indexedPaths = new Set((consolidated.data.sourceFiles ?? []).map((source) => source.file));
    assert(indexedPaths.size === sourcePaths.length && sourcePaths.every((file) => indexedPaths.has(file)), `${directory.name}/${gate.consolidatedFile} source-file index is incomplete`);
    assert(gate.datasetIds.every((id) => consolidated.data.datasets?.[id]), `${directory.name}/${gate.consolidatedFile} is missing a declared dataset`);
  }

  assert(declaredFiles.size === relativeFiles.length && relativeFiles.every((file) => declaredFiles.has(file)), `${directory.name} manifest/file mismatch`);
  const logicalIds = (manifest.data.datasets ?? []).map((dataset) => dataset.id);
  assert(new Set(logicalIds).size === logicalIds.length, `${directory.name} has duplicate logical dataset IDs`);
  assert((manifest.data.datasets ?? []).filter((dataset) => dataset.requiredForCountdown).length >= 3, `${directory.name} must identify capability, METR, and compute as countdown inputs`);
  for (const descriptor of manifest.data.datasets ?? []) {
    assert(Boolean(descriptor.calculation?.role), `${directory.name}/${descriptor.id} is missing calculation.role`);
    assert(Boolean(descriptor.calculation?.preparation), `${directory.name}/${descriptor.id} is missing calculation.preparation`);
    assert(Boolean(descriptor.calculation?.countdownEffect), `${directory.name}/${descriptor.id} is missing calculation.countdownEffect`);
    assert(Array.isArray(descriptor.calculation?.pipeline) && descriptor.calculation.pipeline.length >= 3, `${directory.name}/${descriptor.id} has an incomplete calculation pipeline`);
    assert(Array.isArray(descriptor.calculation?.adjustableAssumptions), `${directory.name}/${descriptor.id} is missing adjustable assumptions`);
    const gate = envelopes[descriptor.consolidatedFile];
    const dataset = gate?.data?.datasets?.[descriptor.id];
    assert(Boolean(dataset), `${directory.name} cannot resolve logical dataset ${descriptor.id}`);
    if (!dataset) continue;
    const calculatedCount = descriptor.collections.reduce((sum, name) => sum + (Array.isArray(dataset.data[name]) ? dataset.data[name].length : 0), 0);
    assert(calculatedCount === descriptor.recordCount, `${directory.name}/${descriptor.id} recordCount is ${descriptor.recordCount}; calculated ${calculatedCount}`);
    const datasetSourceIds = new Set(dataset.metadata.sources.map((source) => source.id));
    for (const sourceId of collectSourceIds(dataset.data)) {
      assert(datasetSourceIds.has(sourceId), `${directory.name}/${descriptor.id} references missing source ${sourceId}`);
    }
  }
}

const latest = await loadLatestSnapshot(dataRoot);
const model = buildForecastModel(latest);
const capability = latest.datasets['capability-benchmarks'].data;
const frontier = latest.datasets['frontier-capability-signals']?.data;
const compute = latest.datasets['compute-capacity'].data;
assert(new Set(capability.benchmarks.map((row) => row.id)).size === capability.benchmarks.length, 'Capability benchmark IDs are not unique');
assert(capability.observations.every((row) => capability.benchmarks.some((benchmark) => benchmark.id === row.benchmarkId)), 'Capability observation has an unknown benchmark');
assert(model.capability.currentScore >= 0 && model.capability.currentScore <= 1, 'Current capability score is outside 0–1');
assert(Boolean(frontier), 'Latest snapshot is missing frontier-capability-signals');
assert(model.capability.frontierShock.qualified, 'Selected frontier capability shock does not meet the published qualification rule');
assert(model.capability.frontierShock.independentPublisherCount >= frontier.forecastPolicy.minimumIndependentPublishers,
  'Frontier shock lacks the required independent publishers');
assert(model.capability.frontierShock.capabilityDomainCount >= frontier.forecastPolicy.minimumCapabilityDomains,
  'Frontier shock lacks the required capability-domain breadth');
assert(model.capability.frontierShock.economicFrontierLeadQuarters > 0, 'Qualified frontier shock did not produce a positive trajectory lead');
assert(model.capability.currentScore > model.capability.observedCurrentScore,
  'Qualified frontier shock did not raise the live capability state above the direct observed basket');
assert(model.capability.overallSeries.length === model.capability.quarters.length, 'Capability quarterly aggregate is incomplete');
assert(model.capability.categories.every((category) => Number.isFinite(category.pooledGapVelocity) && category.pooledGapVelocity >= 0), 'Capability family has an invalid pooled velocity');
assert(new Set(model.capability.categories.map((category) => category.pooledGapVelocity.toFixed(12))).size > 1, 'Capability families still share one absolute projection velocity');
assert(model.capability.categories.filter((category) => category.rawGapVelocity === null)
  .every((category) => Math.abs(category.pooledGapVelocity - model.capability.globalGapVelocityPrior) < 1e-12), 'Sparse capability family does not use the cross-family prior');
assert(model.compute.quarterRows.length === model.capability.quarters.length, 'Capability and compute windows are misaligned');
assert(model.compute.targetUsers === compute.population.usResidents * compute.population.targetShare, 'Compute target users are inconsistent');
assert(model.defaults.supplyGateShareOfTarget === 1, 'Supply gate must require 100% of the already-selected population target');
assert(model.compute.currentScore === model.compute.currentSupportedUsers / model.compute.targetUsers, 'Current compute score is inconsistent');
const referenceObservation = model.compute.referenceProductivityObservation;
const reconstructedProductivity = referenceObservation.performanceTokensPerSecond / referenceObservation.systemPowerWatts *
  (referenceObservation.activeModelParameters / compute.serving.referenceActiveModelParameters) * 1e9 * compute.serving.secondsPerDay;
assert(Math.abs(reconstructedProductivity - model.compute.currentReferenceProductivity) / model.compute.currentReferenceProductivity < 1e-12,
  'Current inference productivity is not reconstructed from measured goodput and system power');
assert(model.compute.quarterRows.every((row, index, rows) => index === 0 || row.quarterIndex > rows[index - 1].quarterIndex), 'Compute quarters are not strictly ordered');
assert(model.compute.quarterRows.every((row) => row.usItPowerMw > 0 && row.usH100e > 0), 'Compute quarter is missing positive IT power or H100e audit data');
assert(compute.siteRegistry.some((site) => site.country === 'United States'), 'Compute site registry does not identify U.S. sites');
assert(model.compute.quarterRows.every((row) => {
  const reconstructed = row.itPowerGw * row.referenceTokensPerItGwDay * compute.serving.fleetShareAllocatedToInference * compute.serving.personalAiInferenceShare;
  return Math.abs(reconstructed - row.personalAiTokensPerDay) / row.personalAiTokensPerDay < 1e-12;
}), 'Compute service-capacity decomposition is inconsistent');
const h100PerturbedSnapshot = structuredClone(latest);
h100PerturbedSnapshot.datasets['compute-capacity'].data.quarters.forEach((row) => { row.usH100e *= 10; });
const h100PerturbedModel = buildForecastModel(h100PerturbedSnapshot);
assert(Math.abs(h100PerturbedModel.compute.currentReferenceProductivity - model.compute.currentReferenceProductivity) < 1e-6,
  'H100e still changes the independent inference-productivity baseline');
assert(Math.abs(h100PerturbedModel.compute.currentSupportedUsers - model.compute.currentSupportedUsers) < 1e-6,
  'H100e still changes supported-user capacity');

const snapshotTime = Date.parse(`${model.snapshotDate}T00:00:00Z`);
const maximumDays = Math.round(365.2425 * model.defaults.maximumForecastYears);
const capabilityThreshold = model.defaults.capabilityThreshold;
const capabilityBase = firstCrossing(snapshotTime, maximumDays, (timestamp) => model.capability.capabilityAt(timestamp, model.capability.currentScore, model.capability.h50Acceleration) >= capabilityThreshold);
const noShockSnapshot = structuredClone(latest);
noShockSnapshot.datasets['frontier-capability-signals'].data.observations
  .find((row) => row.id === frontier.forecastPolicy.selectedObservationId).pointGain = 0;
const noShockModel = buildForecastModel(noShockSnapshot);
const capabilityWithoutShock = firstCrossing(snapshotTime, maximumDays, (timestamp) =>
  noShockModel.capability.capabilityAt(timestamp, noShockModel.capability.currentScore, noShockModel.capability.h50Acceleration) >= capabilityThreshold);
assert(capabilityBase !== null && capabilityWithoutShock !== null && capabilityBase < capabilityWithoutShock,
  'Qualified frontier shock does not move the capability crossing earlier');
const capabilityFaster = firstCrossing(snapshotTime, maximumDays, (timestamp) => model.capability.capabilityAt(timestamp, model.capability.currentScore, model.capability.h50Acceleration + 0.1) >= capabilityThreshold);
assert(capabilityBase !== null && capabilityFaster !== null && capabilityFaster <= capabilityBase, 'Increasing capability acceleration does not shorten or preserve the gate date');

const computeBase = firstCrossing(snapshotTime, maximumDays, (timestamp) => model.compute.supportedUsersAt(timestamp) >= model.compute.targetUsers);
const powerFaster = firstCrossing(snapshotTime, maximumDays, (timestamp) => model.compute.supportedUsersAt(
  timestamp,
  model.compute.currentItPowerGw,
  model.compute.powerAcceleration + 0.01,
) >= model.compute.targetUsers);
const productivityFaster = firstCrossing(snapshotTime, maximumDays, (timestamp) => model.compute.supportedUsersAt(
  timestamp,
  model.compute.currentItPowerGw,
  model.compute.powerAcceleration,
  model.compute.currentReferenceProductivity,
  model.compute.productivityAcceleration + 0.01,
) >= model.compute.targetUsers);
assert(computeBase !== null && powerFaster !== null && powerFaster <= computeBase, 'Increasing IT-power acceleration does not shorten or preserve the gate date');
assert(computeBase !== null && productivityFaster !== null && productivityFaster <= computeBase, 'Increasing inference-productivity acceleration does not shorten or preserve the gate date');

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join('\n'));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({
    snapshots: directories.map((directory) => directory.name),
    selected: `snapshot-${latest.id}`,
    gates: Object.keys(latest.gates).length,
    sources: Object.values(latest.gates).reduce((sum, gate) => sum + gate.data.sourceFiles.length, 0),
    datasets: latest.manifest.data.datasets.length,
    capabilityScore: model.capability.currentScore,
    capabilityScorePercent: model.capability.currentScore * 100,
    capabilityAcceleration: model.capability.h50Acceleration,
    computeScore: model.compute.currentScore,
    powerAcceleration: model.compute.powerAcceleration,
    productivityAcceleration: model.compute.productivityAcceleration,
    status: 'valid',
  }, null, 2));
}
