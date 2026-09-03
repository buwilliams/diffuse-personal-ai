import { forecastModel, snapshotDatasets, snapshotGates, snapshotManifest } from './snapshot-model';

export type ReportCell = string | number | boolean | null;

export type ReportDataView = {
  name: string;
  description: string;
  datasetIds: string[];
  rows: ReportCell[][];
  rowCount: number;
  fieldCount: number;
  populatedValues: number;
};

export type GateReport = {
  id: 'capability' | 'compute';
  gateId: 'gate1' | 'gate2';
  title: string;
  consolidatedJson: string;
  spreadsheetExport: string;
  datasetCount: number;
  recordCount: number;
  sourceCount: number;
  views: ReportDataView[];
};

type SourceFile = {
  id: string;
  file: string;
  publisher: string;
  title: string;
  url: string;
  accessedAt: string;
  roles?: string[];
  notes?: string | null;
  datasetIds: string[];
  recordCount: number;
  resultStatus: string;
  countdownRole: string;
  resultCounts: {
    scores: number;
    measurements: number;
    assumptions: number;
    directInputs: number;
  };
};

type ManifestDataset = {
  id: string;
  gateId: 'gate1' | 'gate2';
  title: string;
  description: string;
  requiredForCountdown: boolean;
  recordCount: number;
  collections: string[];
  calculation: {
    role: string;
    preparation: string;
    countdownEffect: string;
  };
};

type CapabilityCategory = {
  category: string;
  currentScore: number;
  currentGpa: number;
  graded: number;
  total: number;
  confidence: string;
  confidenceWeight: number;
  rawGapVelocity: number | null;
  historyCredits: number;
  poolingWeight: number;
  pooledGapVelocity: number;
  economicGapVelocity: number;
};

type CapabilityBenchmark = {
  category: string;
  id: string;
  name: string;
  metric: string;
  normalization: string;
  status: string;
  firstReleaseQuarter: string;
  currentScore: number | null;
  letter: string;
  gpa: number | null;
  observationCount: number;
  evidenceCredits: number;
  recentVelocity: number | null;
  localAcceleration: number | null;
  sourceId: string;
  notes: string;
};

type CapabilityObservation = {
  id: string;
  benchmarkId: string;
  releaseDate: string;
  quarter: string;
  score: number;
  systemHarness: string;
  scoreBasis: string;
  sourceId: string;
  notes: string;
};

type MetrPoint = {
  id: string;
  releaseId: string;
  metric: string;
  modelSystem: string;
  releaseDate: string;
  horizonMinutes: number;
  harnessScope: string;
  sourceId: string;
  comparabilityNote: string;
};

type MetrTrend = {
  id: string;
  role: string;
  windowStart: string;
  windowEnd: string;
  observationDate: string;
  name: string;
  value: number;
  unit: string;
  confidenceInterval: number[] | null;
  method: string;
  sourceId: string;
  comparabilityNote: string;
};

type ComputeQuarter = {
  quarterIndex: number;
  quarter: string;
  cutoffDate: string;
  phase: string;
  usItPowerMw: number;
  usFacilityPowerMw: number;
  usH100e: number;
  itPowerGw: number;
  h100ePerItGw: number;
  h100eAuditReferenceProductivity: number;
  referenceTokensPerItGwDay: number;
  log2H100e: number;
  logGrowthItPower: number | null;
  logGrowthProductivity: number | null;
  logGrowthH100e: number | null;
  personalAiTokensPerDay: number;
  supportedUsers: number;
  score: number;
  letter: string;
  gpa: number;
  sourceId: string;
  methodNote: string;
};

type InferenceProductivityObservation = {
  id: string;
  release: string;
  observationDate: string;
  model: string;
  scenario: string;
  submitter: string;
  system: string;
  accelerator: string;
  acceleratorCount: number;
  activeModelParameters: number;
  performanceTokensPerSecond: number;
  systemPowerWatts: number;
  tokensPerJoule: number;
  referenceTokenEquivalentsPerItGwDay: number;
  roles: string[];
  rawResultId: string;
  sourceId: string;
  sourceLocation: string;
  comparabilityNote: string;
};

type ComputeSite = {
  id: string;
  name: string;
  country: string | null;
  currentH100e: number | null;
  currentItPowerMw: number | null;
  owner: string | null;
  users: string | null;
  address: string | null;
  sourceId: string;
};

type WorkloadComponent = {
  label: string;
  tokensPerUserDay: number;
  computeWeight: number;
  computeEquivalentTokens: number;
};

type ComputeSupportingEvidence = {
  id: string;
  metric: string;
  value: number;
  unit: string;
  scope: string;
  metricDate: string;
  evidenceClass: string;
  valueQualifier: string;
  sourceId: string;
  sourceLocation: string;
  claim: string;
  caveat: string;
};

type CapabilityQuarter = {
  quarter: string;
  date: string;
  score: number | null;
};

type FrontierObservation = {
  id: string;
  model: string;
  releaseDate: string;
  metric: string;
  eciScore: number;
  confidenceInterval90: number[];
  independentPublisher: string;
  sourceId: string;
};

type FrontierTrend = {
  id: string;
  series: string;
  metricDate: string;
  method: string;
  annualPointsPerYear: number;
  unit: string;
  sourceId: string;
};

type FrontierCorroboration = {
  id: string;
  model: string;
  summary: string;
  capabilityDomains: string[];
  publisher: string;
  publisherClass: string;
  sourceId: string;
};

function dataView(name: string, description: string, datasetIds: string[], rows: ReportCell[][]): ReportDataView {
  const fieldCount = rows.reduce((maximum, row) => Math.max(maximum, row.length), 0);
  return {
    name,
    description,
    datasetIds,
    rows,
    rowCount: rows.filter((row) => row.some((cell) => cell !== null && cell !== '')).length,
    fieldCount,
    populatedValues: rows.flat().filter((cell) => cell !== null && cell !== '').length,
  };
}

function sourceFileRows(sources: SourceFile[], gateId: 'gate1' | 'gate2') {
  return [
    ['Source ID', 'Source JSON', 'Publisher', 'Title', 'Accessed', 'Logical datasets', 'Records', 'Result status', 'Countdown role', 'Scores', 'Measurements', 'Assumptions', 'Direct inputs', 'Roles', 'Public URL', 'Notes'],
    ...sources.map((source) => [
      source.id,
      `/data/snapshot-${forecastModel.snapshotId}/${gateId}-sources/${source.file.split('/').at(-1)}`,
      source.publisher,
      source.title,
      source.accessedAt,
      source.datasetIds.join(', '),
      source.recordCount,
      source.resultStatus,
      source.countdownRole,
      source.resultCounts.scores,
      source.resultCounts.measurements,
      source.resultCounts.assumptions,
      source.resultCounts.directInputs,
      (source.roles ?? []).join(', '),
      source.url,
      source.notes ?? '',
    ]),
  ];
}

function datasetCatalogRows(datasets: ManifestDataset[]) {
  return [
    ['Dataset ID', 'Title', 'Required for countdown', 'Records', 'Collections', 'Calculation role', 'Preparation', 'Countdown effect'],
    ...datasets.map((dataset) => [
      dataset.id,
      dataset.title,
      dataset.requiredForCountdown,
      dataset.recordCount,
      dataset.collections.join(', '),
      dataset.calculation.role,
      dataset.calculation.preparation,
      dataset.calculation.countdownEffect,
    ]),
  ];
}

const capabilityDataset = snapshotDatasets['capability-benchmarks'];
const frontierDataset = snapshotDatasets['frontier-capability-signals'];
const metrDataset = snapshotDatasets['metr-task-horizon'];
const computeDataset = snapshotDatasets['compute-capacity'];
const manifestDatasets = snapshotManifest.data.datasets as ManifestDataset[];
const gate1Datasets = manifestDatasets.filter((dataset) => dataset.gateId === 'gate1');
const gate2Datasets = manifestDatasets.filter((dataset) => dataset.gateId === 'gate2');
const gate1SourceFiles = snapshotGates.gate1.data.sourceFiles as SourceFile[];
const gate2SourceFiles = snapshotGates.gate2.data.sourceFiles as SourceFile[];

const capabilitySummaryRows: ReportCell[][] = [
  ['Metric', 'Value', 'Unit / interpretation'],
  ['Snapshot', forecastModel.snapshotDate, 'Latest dated snapshot selected at build'],
  ['Observed direct-basket capability', forecastModel.capability.observedCurrentScore, '0–1 score; direct delegation benchmarks only'],
  ['Frontier-adjusted live capability', forecastModel.capability.currentScore, '0–1 score; includes the qualified Astra trajectory lead'],
  ['Current letter grade', forecastModel.capability.currentGrade, 'A ≥90%, B ≥80%, C ≥70%, D ≥60%, F <60%'],
  ['Current GPA', forecastModel.capability.currentGpa, '0–4'],
  ['Evidence confidence', forecastModel.capability.confidence, `${forecastModel.capability.confidenceWeight.toFixed(3)} evidence weight`],
  ['Pooled economic failure-gap velocity', forecastModel.capability.economicGapVelocity, 'confidence-weighted family gap halvings / quarter'],
  ['Cross-family velocity prior', forecastModel.capability.globalGapVelocityPrior, 'evidence-weighted prior for sparse benchmark families'],
  ['Partial-pooling prior strength', forecastModel.capability.partialPoolingPriorCredits, 'history credits'],
  ['METR H50 acceleration', forecastModel.capability.h50Acceleration, 'task-horizon doublings / quarter²'],
  ['METR H80 guardrail', forecastModel.capability.h80Acceleration, 'task-horizon doublings / quarter²'],
  ['Economic transfer coefficient', forecastModel.capability.transferCoefficient, 'economic gap velocity / H50 velocity'],
  ['Astra broad frontier lead', forecastModel.capability.frontierShock.broadFrontierLeadQuarters, 'quarters from 6 ECI points ÷ 14 points/year'],
  ['Astra economic-equivalent lead', forecastModel.capability.frontierShock.economicFrontierLeadQuarters, 'quarters after the economic transfer coefficient'],
  ['Independent corroborating publishers', forecastModel.capability.frontierShock.independentPublisherCount, 'minimum 2'],
  ['Corroborated capability domains', forecastModel.capability.frontierShock.capabilityDomainCount, 'minimum 3'],
  [],
  ['Benchmark family', 'Current score', 'GPA', 'Graded benchmarks', 'Total benchmarks', 'Confidence', 'Confidence weight', 'Raw gap velocity', 'History credits', 'Pooling weight', 'Pooled gap velocity'],
  ...forecastModel.capability.categories.map((category: CapabilityCategory) => [
    category.category,
    category.currentScore,
    category.currentGpa,
    category.graded,
    category.total,
    category.confidence,
    category.confidenceWeight,
    category.rawGapVelocity,
    category.historyCredits,
    category.poolingWeight,
    category.pooledGapVelocity,
  ]),
  [],
  ['Quarter', 'Date', 'Confidence-weighted aggregate'],
  ...forecastModel.capability.overallSeries.map((point: CapabilityQuarter) => [point.quarter, point.date, point.score]),
];

const capabilityBenchmarkRows: ReportCell[][] = [
  ['Category', 'Benchmark ID', 'Benchmark', 'Metric', 'Normalization', 'Status', 'First release', 'Current score', 'Letter', 'GPA', 'Observations', 'Evidence credits', 'Recent gap velocity', 'Local acceleration', 'Source ID', 'Notes'],
  ...forecastModel.capability.benchmarkRows.map((benchmark: CapabilityBenchmark) => [
    benchmark.category,
    benchmark.id,
    benchmark.name,
    benchmark.metric,
    benchmark.normalization,
    benchmark.status,
    benchmark.firstReleaseQuarter,
    benchmark.currentScore,
    benchmark.letter,
    benchmark.gpa,
    benchmark.observationCount,
    benchmark.evidenceCredits,
    benchmark.recentVelocity,
    benchmark.localAcceleration,
    benchmark.sourceId,
    benchmark.notes,
  ]),
];

const capabilityObservationRows: ReportCell[][] = [
  ['Observation ID', 'Benchmark ID', 'Release date', 'Quarter', 'Score', 'System / harness', 'Score basis', 'Source ID', 'Notes'],
  ...capabilityDataset.data.observations.map((observation: CapabilityObservation) => [
    observation.id,
    observation.benchmarkId,
    observation.releaseDate,
    observation.quarter,
    observation.score,
    observation.systemHarness,
    observation.scoreBasis,
    observation.sourceId,
    observation.notes,
  ]),
];

const metrRows: ReportCell[][] = [
  ['Series ID', 'Release ID', 'Metric', 'Model / system', 'Release date', 'Horizon minutes', 'Harness scope', 'Source ID', 'Comparability note'],
  ...metrDataset.data.series.map((point: MetrPoint) => [
    point.id,
    point.releaseId,
    point.metric,
    point.modelSystem,
    point.releaseDate,
    point.horizonMinutes,
    point.harnessScope,
    point.sourceId,
    point.comparabilityNote,
  ]),
  [],
  ['Trend', 'Role', 'Window start', 'Window end', 'Observation date', 'Name', 'Value', 'Unit', 'Confidence interval', 'Method', 'Source ID', 'Comparability note'],
  ...metrDataset.data.trendEstimates.map((trend: MetrTrend) => [
    trend.id,
    trend.role,
    trend.windowStart,
    trend.windowEnd,
    trend.observationDate,
    trend.name,
    trend.value,
    trend.unit,
    trend.confidenceInterval?.join('–') ?? '',
    trend.method,
    trend.sourceId,
    trend.comparabilityNote,
  ]),
];

const frontierRows: ReportCell[][] = [
  ['Record type', 'ID', 'Model / series', 'Date', 'Metric / summary', 'Value', 'Interval / domains', 'Publisher', 'Source ID', 'Countdown treatment'],
  ...frontierDataset.data.observations.map((record: FrontierObservation) => [
    'Aggregate observation', record.id, record.model, record.releaseDate, record.metric,
    record.eciScore, record.confidenceInterval90.join('–'), record.independentPublisher,
    record.sourceId, 'Sets the qualified shock magnitude; not a delegation percentage',
  ]),
  ...frontierDataset.data.trend.map((record: FrontierTrend) => [
    'Trend', record.id, record.series, record.metricDate, record.method,
    record.annualPointsPerYear, record.unit, 'Epoch AI', record.sourceId,
    'Converts the ECI gain to broad frontier-progress time',
  ]),
  ...frontierDataset.data.corroboratingSignals.map((record: FrontierCorroboration) => [
    'Corroboration', record.id, record.model, forecastModel.snapshotDate, record.summary,
    null, record.capabilityDomains.join(', '), record.publisher, record.sourceId,
    record.publisherClass === 'model provider' ? 'Portfolio evidence; does not count as an independent publisher' : 'Independent qualification evidence',
  ]),
  [],
  ['Forecast policy', 'Selected observation', 'Selected trend', 'Minimum independent publishers', 'Minimum domains', 'Application rule'],
  ['Policy', frontierDataset.data.forecastPolicy.selectedObservationId, frontierDataset.data.forecastPolicy.selectedTrendId,
    frontierDataset.data.forecastPolicy.minimumIndependentPublishers, frontierDataset.data.forecastPolicy.minimumCapabilityDomains,
    frontierDataset.data.forecastPolicy.applicationRule],
];

const computeSummaryRows: ReportCell[][] = [
  ['Metric', 'Value', 'Unit / interpretation'],
  ['Snapshot', forecastModel.snapshotDate, 'Latest dated snapshot selected at build'],
  ['Current operational U.S. IT power', forecastModel.compute.currentItPowerGw, 'IT GW'],
  ['Current reference inference productivity', forecastModel.compute.currentReferenceProductivityT, 'trillion reference token-equivalents / IT GW-day'],
  ['Current H100e audit cross-check', forecastModel.compute.currentRow.usH100e, 'H100-equivalents; does not enter supported-user capacity'],
  ['H100e-derived audit productivity', forecastModel.compute.currentRow.h100eAuditReferenceProductivity / 1e12, 'trillion reference token-equivalents / IT GW-day; audit only'],
  ['Current supported Personal-AI users', forecastModel.compute.currentSupportedUsers, 'user-equivalents'],
  ['Target users', forecastModel.compute.targetUsers, `${(computeDataset.data.population.targetShare * 100).toFixed(0)}% of modeled U.S. population`],
  ['Current supply score', forecastModel.compute.currentScore, 'supported users / target users'],
  ['Productivity baseline result', forecastModel.compute.referenceProductivityObservation.id, `${forecastModel.compute.referenceProductivityObservation.model} ${forecastModel.compute.referenceProductivityObservation.scenario}`],
  ['Measured baseline goodput', forecastModel.compute.referenceProductivityObservation.performanceTokensPerSecond, 'tokens / second'],
  ['Measured baseline system power', forecastModel.compute.referenceProductivityObservation.systemPowerWatts, 'watts'],
  ['Agent workload per user per day', forecastModel.compute.workloadTokens, 'compute-equivalent tokens'],
  ['Fleet inference allocation', computeDataset.data.serving.fleetShareAllocatedToInference, 'share of total AI service capacity'],
  ['Personal-AI inference share', computeDataset.data.serving.personalAiInferenceShare, 'share of inference allocated to Personal AI'],
  ['IT-power mean projected log velocity', forecastModel.compute.powerVelocity, 'log₂ IT GW / quarter'],
  ['IT-power projected log acceleration', forecastModel.compute.powerAcceleration, 'log₂ IT GW / quarter²'],
  ['Productivity measured log velocity', forecastModel.compute.productivityVelocity, 'log₂ reference-token productivity / quarter; matched MLPerf series'],
  ['Productivity measured log acceleration', forecastModel.compute.productivityAcceleration, 'log₂ reference-token productivity / quarter²; zero with only two comparable points'],
  ['Continuous base-case crossing', forecastModel.compute.continuousCrossing === null
    ? 'No crossing within horizon'
    : new Date(forecastModel.compute.continuousCrossing).toISOString(), 'UTC'],
];

const computeQuarterRows: ReportCell[][] = [
  ['Quarter index', 'Quarter', 'Cutoff', 'Phase', 'U.S. IT power MW', 'U.S. IT power GW', 'U.S. facility power MW', 'H100e audit bridge', 'H100e / IT GW', 'H100e-derived audit productivity / IT GW-day', 'Independent reference token-equivalents / IT GW-day', 'IT-power log growth / quarter', 'Productivity log growth / quarter', 'H100e log growth / quarter', 'Personal-AI token-equivalents/day', 'Supported users', 'Score vs target', 'Letter', 'GPA', 'Source ID', 'Method note'],
  ...forecastModel.compute.quarterRows.map((quarter: ComputeQuarter) => [
    quarter.quarterIndex,
    quarter.quarter,
    quarter.cutoffDate,
    quarter.phase,
    quarter.usItPowerMw,
    quarter.itPowerGw,
    quarter.usFacilityPowerMw,
    quarter.usH100e,
    quarter.h100ePerItGw,
    quarter.h100eAuditReferenceProductivity,
    quarter.referenceTokensPerItGwDay,
    quarter.logGrowthItPower,
    quarter.logGrowthProductivity,
    quarter.logGrowthH100e,
    quarter.personalAiTokensPerDay,
    quarter.supportedUsers,
    quarter.score,
    quarter.letter,
    quarter.gpa,
    quarter.sourceId,
    quarter.methodNote,
  ]),
];

const computeAssumptionRows: ReportCell[][] = [
  ['Group', 'Variable', 'Value', 'Unit / note'],
  ['Population', 'U.S. population', computeDataset.data.population.usResidents, 'people'],
  ['Population', 'Coverage target', computeDataset.data.population.targetShare, 'share of U.S. population'],
  ['Population', 'Supply gate share of selected target', forecastModel.defaults.supplyGateShareOfTarget, 'must remain 100% in the default'],
  ['Serving', 'Fleet inference allocation', computeDataset.data.serving.fleetShareAllocatedToInference, 'share of total AI service capacity'],
  ['Serving', 'Personal-AI inference share', computeDataset.data.serving.personalAiInferenceShare, 'share of modeled inference supply'],
  ['Serving', 'Reference active model size', computeDataset.data.serving.referenceActiveModelParameters, 'parameters used to normalize measured tokens'],
  ['Serving', 'Seconds per day', computeDataset.data.serving.secondsPerDay, 'seconds'],
  ['Audit only', 'H100e dense 8-bit operations', computeDataset.data.serving.h100eAudit.dense8BitOpsPerH100eSecond, 'operations / second; excluded from capacity'],
  ['Audit only', 'H100e sustained utilization', computeDataset.data.serving.h100eAudit.sustainedServingUtilization, 'share; excluded from capacity'],
  ['Workload', 'Compute-equivalent tokens per user/day', forecastModel.compute.workloadTokens, 'tokens'],
  ...forecastModel.compute.components.map((component: WorkloadComponent) => [
    'Workload component',
    component.label,
    component.tokensPerUserDay,
    `${component.computeWeight}× compute weight; ${component.computeEquivalentTokens.toLocaleString('en-US')} compute-equivalent tokens`,
  ]),
];

const inferenceProductivityRows: ReportCell[][] = [
  ['Observation ID', 'Release', 'Date', 'Model', 'Scenario', 'Submitter', 'System', 'Accelerator', 'Count', 'Active parameters', 'Measured tokens/s', 'Measured system W', 'Tokens/J', 'Reference token-eq / IT GW-day', 'Role', 'Raw result ID', 'Source ID', 'Source location', 'Comparability note'],
  ...(computeDataset.data.inferenceProductivityObservations as InferenceProductivityObservation[]).map((record) => [
    record.id,
    record.release,
    record.observationDate,
    record.model,
    record.scenario,
    record.submitter,
    record.system,
    record.accelerator,
    record.acceleratorCount,
    record.activeModelParameters,
    record.performanceTokensPerSecond,
    record.systemPowerWatts,
    record.tokensPerJoule,
    record.referenceTokenEquivalentsPerItGwDay,
    record.roles.join(', '),
    record.rawResultId,
    record.sourceId,
    record.sourceLocation,
    record.comparabilityNote,
  ]),
];

const computeSiteRows: ReportCell[][] = [
  ['Site', 'Country', 'Current H100e', 'Current IT power MW', 'Owner', 'Users', 'Address', 'Source ID'],
  ...(computeDataset.data.siteRegistry as ComputeSite[]).map((site) => [
    site.name,
    site.country,
    site.currentH100e,
    site.currentItPowerMw,
    site.owner,
    site.users,
    site.address,
    site.sourceId,
  ]),
];

const computeSupportingEvidenceRows: ReportCell[][] = [
  ['Evidence ID', 'Metric', 'Value', 'Unit', 'Scope', 'Metric date', 'Evidence class', 'Qualifier', 'Source location', 'Source ID', 'Claim', 'Caveat', 'Countdown input'],
  ...(computeDataset.data.supportingEvidence as ComputeSupportingEvidence[]).map((record) => [
    record.id,
    record.metric,
    record.value,
    record.unit,
    record.scope,
    record.metricDate,
    record.evidenceClass,
    record.valueQualifier,
    record.sourceLocation,
    record.sourceId,
    record.claim,
    record.caveat,
    false,
  ]),
];

export const gateReports: Record<'capability' | 'compute', GateReport> = {
  capability: {
    id: 'capability',
    gateId: 'gate1',
    title: 'Model–harness capability report card',
    consolidatedJson: `/data/snapshot-${forecastModel.snapshotId}/gate1-consolidated.json`,
    spreadsheetExport: 'https://raw.githubusercontent.com/buwilliams/diffuse-personal-ai/main/artifacts/report-cards/personal-ai-four-year-capability-report-card.xlsx',
    datasetCount: gate1Datasets.length,
    recordCount: gate1Datasets.reduce((sum, dataset) => sum + dataset.recordCount, 0),
    sourceCount: gate1SourceFiles.length,
    views: [
      dataView('Overview', 'Observed direct score, Astra-adjusted live score, evidence weight, acceleration, and the quarterly aggregate path calculated from the snapshot.', ['capability-benchmarks', 'frontier-capability-signals', 'metr-task-horizon'], capabilitySummaryRows),
      dataView('Dataset Catalog', 'Every Gate 1 logical dataset, including contextual and falsification evidence that does not directly move the countdown.', gate1Datasets.map((dataset) => dataset.id), datasetCatalogRows(gate1Datasets)),
      dataView('Benchmarks', 'The normalized benchmark basket that drives the capability forecast.', ['capability-benchmarks'], capabilityBenchmarkRows),
      dataView('Observations', 'Every model–harness observation compiled for the forecast basket.', ['capability-benchmarks'], capabilityObservationRows),
      dataView('Frontier Signals', 'The independent aggregate, cross-domain corroboration, trend bridge, and policy that qualify Astra as a model-level capability shock.', ['frontier-capability-signals'], frontierRows),
      dataView('METR Horizon', 'Task-horizon observations and recent-fit acceleration estimates used for capability feedback.', ['metr-task-horizon'], metrRows),
      dataView('Source Files', 'Every source-normalized JSON file consolidated into Gate 1, with result counts and countdown role.', gate1Datasets.map((dataset) => dataset.id), sourceFileRows(gate1SourceFiles, 'gate1')),
    ],
  },
  compute: {
    id: 'compute',
    gateId: 'gate2',
    title: 'Service-capacity report card',
    consolidatedJson: `/data/snapshot-${forecastModel.snapshotId}/gate2-consolidated.json`,
    spreadsheetExport: 'https://raw.githubusercontent.com/buwilliams/diffuse-personal-ai/main/artifacts/report-cards/personal-ai-compute-report-card.xlsx',
    datasetCount: gate2Datasets.length,
    recordCount: gate2Datasets.reduce((sum, dataset) => sum + dataset.recordCount, 0),
    sourceCount: gate2SourceFiles.length,
    views: [
      dataView('Overview', 'Current physical supply, inference productivity, allocations, and the base-case crossing calculated from the snapshot.', ['compute-capacity'], computeSummaryRows),
      dataView('Dataset Catalog', 'Every Gate 2 logical dataset and its calculation lineage.', gate2Datasets.map((dataset) => dataset.id), datasetCatalogRows(gate2Datasets)),
      dataView('Quarterly Model', 'Observed and expected U.S. IT power, inference productivity, and supported-user equivalents by quarter.', ['compute-capacity'], computeQuarterRows),
      dataView('Inference Productivity', 'Measured MLPerf goodput and full-system power rows used for the absolute productivity baseline and matched trend.', ['compute-capacity'], inferenceProductivityRows),
      dataView('Assumptions', 'Population, workload, allocation, and serving assumptions.', ['compute-capacity'], computeAssumptionRows),
      dataView('Site Registry', 'Epoch data-center registry used to select U.S. sites and audit the facility join.', ['compute-capacity'], computeSiteRows),
      dataView('Supporting Evidence', 'Independent quantitative supply diagnostics retained in their reported units; these rows do not directly enter the countdown.', ['compute-capacity'], computeSupportingEvidenceRows),
      dataView('Source Files', 'Every source-normalized JSON file consolidated into Gate 2, with result counts and countdown role.', gate2Datasets.map((dataset) => dataset.id), sourceFileRows(gate2SourceFiles, 'gate2')),
    ],
  },
};
