const SCORE_COLLECTIONS = new Set([
  'capability-benchmarks.observations',
  'capability-benchmarks.supportingObservations',
]);

function recordPath(fragment, record, index) {
  const id = record?.id ?? record?.quarter ?? index;
  return `${fragment.datasetId}.${fragment.collection}.${id}`;
}

function displayNumber(value, unit) {
  if (unit === 'percent') return `${value.toLocaleString('en-US', { maximumFractionDigits: 4 })}%`;
  if (unit === 'proportion') return `${(value * 100).toLocaleString('en-US', { maximumFractionDigits: 4 })}%`;
  if (unit === 'USD') return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
  const suffix = unit ? ` ${unit}` : '';
  return `${value.toLocaleString('en-US', { maximumFractionDigits: 6 })}${suffix}`;
}

function measurement({
  id,
  metric,
  value,
  unit,
  subject = null,
  observationDate = null,
  measurementType = 'measurement',
  origin = 'source-reported',
  usedInCountdown = false,
  normalizedScore = null,
  normalization = null,
  sourceLocation = null,
  sourceRecord,
  caveat = null,
}) {
  return {
    id,
    metric,
    value,
    unit,
    displayValue: displayNumber(value, unit),
    subject,
    observationDate,
    measurementType,
    origin,
    usedInCountdown,
    normalizedScore,
    normalization,
    sourceLocation,
    sourceRecord,
    caveat,
  };
}

function numericLeaves(value, prefix = '', result = []) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    result.push({ path: prefix, value });
  } else if (Array.isArray(value)) {
    value.forEach((item, index) => numericLeaves(item, `${prefix}[${index}]`, result));
  } else if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, nested]) => numericLeaves(nested, prefix ? `${prefix}.${key}` : key, result));
  }
  return result;
}

function valueMetric(path) {
  return path
    .replaceAll(/\[(\d+)\]/g, ' $1')
    .replaceAll('.', ' · ')
    .replaceAll(/([a-z])([A-Z])/g, '$1 $2');
}

export function buildSourceResults(envelope, manifest) {
  const source = envelope.metadata.sources?.[0];
  const fragments = envelope.data.fragments ?? [];
  const requiredDatasets = new Set((manifest.data.datasets ?? [])
    .filter((dataset) => dataset.requiredForCountdown)
    .map((dataset) => dataset.id));
  const roles = new Set((source?.roles ?? []).map((role) => role.toLowerCase()));
  const methodology = [...roles].some((role) => role.includes('methodology') || role.includes('normalization') || role.includes('model configuration'));
  const benchmarkDefinitions = new Map();

  for (const fragment of fragments) {
    if (`${fragment.datasetId}.${fragment.collection}` !== 'capability-benchmarks.benchmarks') continue;
    for (const item of fragment.items ?? []) benchmarkDefinitions.set(item.record.id, item.record);
  }

  const measurements = [];
  for (const fragment of fragments) {
    const collectionId = `${fragment.datasetId}.${fragment.collection}`;
    const directDataset = requiredDatasets.has(fragment.datasetId);

    if (fragment.kind === 'value') {
      for (const leaf of numericLeaves(fragment.value)) {
        const assumption = methodology || ['targetShare', 'reportEndQuarterIndex', 'firstForecastQuarterIndex', 'currentQuarterIndex', 'maximumEvidenceCreditsPerBenchmark', 'exactOneDepth'].some((name) => leaf.path.endsWith(name));
        measurements.push(measurement({
          id: `${collectionId}.${leaf.path}`,
          metric: valueMetric(leaf.path),
          value: leaf.value,
          unit: leaf.path.toLowerCase().includes('share') || leaf.path.toLowerCase().includes('multiplier') || leaf.path.toLowerCase().includes('utilization') ? 'proportion' : 'value',
          measurementType: assumption ? 'assumption' : 'measurement',
          origin: assumption ? 'forecast-assumption' : 'source-reported',
          usedInCountdown: directDataset,
          sourceRecord: `${collectionId}.${leaf.path}`,
          caveat: assumption ? 'Scenario or calculation input authored by the forecast; not a source-reported benchmark result.' : null,
        }));
      }
      continue;
    }

    for (const [index, item] of (fragment.items ?? []).entries()) {
      const record = item.record;
      if (!record || typeof record !== 'object') continue;
      const path = recordPath(fragment, record, index);

      if (collectionId === 'capability-benchmarks.observations' && typeof record.score === 'number') {
        const definition = benchmarkDefinitions.get(record.benchmarkId);
        measurements.push(measurement({
          id: path,
          metric: record.scoreBasis ?? definition?.metric ?? 'Normalized benchmark score',
          value: record.score,
          unit: 'proportion',
          subject: record.systemHarness ?? null,
          observationDate: record.observationDate ?? record.releaseDate ?? null,
          measurementType: 'score',
          origin: 'normalized-source-result',
          usedInCountdown: true,
          normalizedScore: record.score,
          normalization: definition?.normalization ?? null,
          sourceLocation: source?.id === 'gate1-arxiv-org-weavebench' ? 'Table 3' : null,
          sourceRecord: path,
          caveat: record.notes ?? null,
        }));
      } else if (collectionId === 'capability-benchmarks.supportingObservations' && typeof record.score === 'number') {
        measurements.push(measurement({
          id: path,
          metric: record.metric ?? 'Supporting benchmark result',
          value: record.score,
          unit: record.unit ?? 'value',
          subject: record.modelSystem ?? null,
          observationDate: record.observationDate ?? record.modelReleaseDate ?? null,
          measurementType: 'score',
          origin: 'source-reported',
          usedInCountdown: false,
          sourceLocation: source?.id === 'gate1-arxiv-org-weavebench' ? 'Table 3' : null,
          sourceRecord: path,
          caveat: record.comparabilityNote ?? null,
        }));
      } else if (collectionId === 'metr-task-horizon.series' && typeof record.horizonMinutes === 'number') {
        measurements.push(measurement({
          id: path,
          metric: `${record.metric} task-completion horizon`,
          value: record.horizonMinutes,
          unit: 'minutes',
          subject: record.modelSystem ?? null,
          observationDate: record.releaseDate ?? null,
          origin: 'source-reported',
          usedInCountdown: true,
          sourceRecord: path,
          caveat: record.comparabilityNote ?? null,
        }));
      } else if (collectionId === 'metr-task-horizon.trendEstimates' && typeof record.value === 'number') {
        measurements.push(measurement({
          id: path,
          metric: record.name ?? 'METR trend estimate',
          value: record.value,
          unit: record.unit ?? 'value',
          subject: record.role ?? null,
          observationDate: record.observationDate ?? null,
          origin: 'source-reported',
          usedInCountdown: true,
          sourceRecord: path,
          caveat: record.comparabilityNote ?? null,
        }));
      } else if (collectionId === 'compute-capacity.inferenceProductivityObservations' &&
        typeof record.performanceTokensPerSecond === 'number' && typeof record.systemPowerWatts === 'number') {
        measurements.push(measurement({
          id: `${path}.performanceTokensPerSecond`,
          metric: 'Latency-constrained inference goodput',
          value: record.performanceTokensPerSecond,
          unit: 'tokens/s',
          subject: `${record.model} · ${record.system}`,
          observationDate: record.observationDate ?? null,
          origin: 'source-reported',
          usedInCountdown: true,
          sourceLocation: record.sourceLocation ?? null,
          sourceRecord: `${path}.performanceTokensPerSecond`,
          caveat: record.comparabilityNote ?? null,
        }));
        measurements.push(measurement({
          id: `${path}.systemPowerWatts`,
          metric: 'Measured system power',
          value: record.systemPowerWatts,
          unit: 'W',
          subject: `${record.model} · ${record.system}`,
          observationDate: record.observationDate ?? null,
          origin: 'source-reported',
          usedInCountdown: true,
          sourceLocation: record.sourceLocation ?? null,
          sourceRecord: `${path}.systemPowerWatts`,
          caveat: record.comparabilityNote ?? null,
        }));
        measurements.push(measurement({
          id: `${path}.referenceTokenEquivalentsPerItGwDay`,
          metric: 'Reference inference productivity',
          value: record.referenceTokenEquivalentsPerItGwDay,
          unit: 'reference token-eq/IT GW-day',
          subject: `${record.model} · ${record.system}`,
          observationDate: record.observationDate ?? null,
          origin: 'derived-from-source',
          usedInCountdown: true,
          sourceLocation: record.sourceLocation ?? null,
          sourceRecord: `${path}.referenceTokenEquivalentsPerItGwDay`,
          caveat: record.comparabilityNote ?? null,
        }));
      } else if (collectionId === 'compute-capacity.quarters' && typeof record.usItPowerMw === 'number') {
        measurements.push(measurement({
          id: `${path}.usItPowerMw`,
          metric: 'U.S. operational or projected AI IT power',
          value: record.usItPowerMw,
          unit: 'MW IT',
          subject: record.quarter ?? null,
          observationDate: record.cutoffDate ?? null,
          origin: 'derived-from-source',
          usedInCountdown: true,
          sourceRecord: `${path}.usItPowerMw`,
          caveat: `${record.evidenceClass}: ${record.methodNote}`,
        }));
        measurements.push(measurement({
          id: `${path}.usH100e`,
          metric: 'U.S. operational or projected H100-equivalent audit bridge',
          value: record.usH100e,
          unit: 'H100e',
          subject: record.quarter ?? null,
          observationDate: record.cutoffDate ?? null,
          origin: 'derived-from-source',
          usedInCountdown: false,
          sourceRecord: `${path}.usH100e`,
          caveat: `${record.evidenceClass}: Audit cross-check only. It does not set physical IT power, inference productivity, or supported-user capacity.`,
        }));
      } else if (collectionId === 'compute-capacity.siteRegistry') {
        if (typeof record.currentH100e === 'number') {
          measurements.push(measurement({
            id: `${path}.currentH100e`,
            metric: 'Current facility H100-equivalent capacity',
            value: record.currentH100e,
            unit: 'H100e',
            subject: record.name ?? null,
            origin: 'source-reported',
            usedInCountdown: false,
            sourceRecord: `${path}.currentH100e`,
            caveat: 'Facility-level registry field retained to audit the U.S. geography join and current state.',
          }));
        }
        if (typeof record.currentItPowerMw === 'number') {
          measurements.push(measurement({
            id: `${path}.currentItPowerMw`,
            metric: 'Current facility-level IT power',
            value: record.currentItPowerMw,
            unit: 'MW IT',
            subject: record.name ?? null,
            origin: 'source-reported',
            usedInCountdown: false,
            sourceRecord: `${path}.currentItPowerMw`,
            caveat: 'Facility-level registry value retained to audit current IT power; the quarterly path is reconstructed from dated timeline states.',
          }));
        }
      } else if (collectionId === 'compute-capacity.supportingEvidence' && typeof record.value === 'number') {
        measurements.push(measurement({
          id: path,
          metric: record.metric ?? 'Compute-supply supporting evidence',
          value: record.value,
          unit: record.unit ?? 'value',
          subject: record.scope ?? record.entity ?? null,
          observationDate: record.metricDate ?? record.observationDate ?? null,
          origin: 'source-reported',
          usedInCountdown: false,
          sourceLocation: record.sourceLocation ?? null,
          sourceRecord: path,
          caveat: record.caveat ?? record.comparabilityNote ?? null,
        }));
      } else if (['adoption.observations', 'research-evidence.observations'].includes(collectionId) && typeof record.value === 'number') {
        measurements.push(measurement({
          id: path,
          metric: record.metric ?? 'Source observation',
          value: record.value,
          unit: record.unit ?? 'value',
          subject: record.entity ?? record.scope ?? null,
          observationDate: record.observationDate ?? record.metricDate ?? null,
          origin: 'source-reported',
          usedInCountdown: false,
          sourceRecord: path,
          caveat: record.caveat ?? record.comparabilityNote ?? null,
        }));
      }
    }
  }

  const counts = {
    scores: measurements.filter((item) => item.measurementType === 'score').length,
    measurements: measurements.filter((item) => item.measurementType === 'measurement').length,
    assumptions: measurements.filter((item) => item.measurementType === 'assumption').length,
    directInputs: measurements.filter((item) => item.usedInCountdown).length,
  };
  const feedsRequiredDataset = fragments.some((fragment) => requiredDatasets.has(fragment.datasetId));
  const status = methodology
    ? 'forecast-assumptions'
    : counts.scores
      ? 'reported-scores'
      : counts.measurements
        ? 'reported-measurements'
        : 'descriptive-only';
  const countdownRole = methodology
    ? 'forecast-method'
    : counts.directInputs
      ? 'direct-input'
      : feedsRequiredDataset
        ? 'supporting-input'
        : 'context-only';
  const summary = status === 'forecast-assumptions'
    ? `Forecast-authored method with ${counts.assumptions + counts.measurements} explicit numeric input(s); these are labeled as assumptions, not source-reported results.`
    : counts.scores
      ? `${counts.scores} explicit benchmark score(s) and ${counts.measurements} other numeric measurement(s); ${counts.directInputs} item(s) affect the countdown.`
      : counts.measurements
        ? `${counts.measurements} explicit numeric measurement(s); ${counts.directInputs} item(s) affect the countdown.`
        : feedsRequiredDataset
          ? 'No numeric result is recorded from this source. It catalogs or supports a countdown dataset but does not contribute a scored observation.'
          : 'No numeric result is recorded from this source. It supplies descriptive, release, or coverage evidence and does not change the countdown.';

  return { status, countdownRole, summary, counts, measurements };
}
