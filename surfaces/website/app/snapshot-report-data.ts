import { forecastModel, snapshotDatasets } from './snapshot-model';

export type ReportCell = string | number | boolean | null;

export type ReportSheet = {
  name: string;
  address: string;
  description: string;
  rows: ReportCell[][];
  sourceRows: number;
  sourceColumns: number;
  nonEmptyCells: number;
};

export type ReportWorkbook = {
  id: 'capability' | 'compute';
  title: string;
  download: string;
  sheets: ReportSheet[];
};

type Source = {
  id: string;
  publisher: string;
  title: string;
  url: string;
  accessedAt: string;
  roles?: string[];
  notes?: string | null;
};

type CapabilityCategory = {
  category: string;
  currentScore: number;
  currentGpa: number;
  graded: number;
  total: number;
  confidence: string;
  confidenceWeight: number;
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
  usH100e: number;
  log2H100e: number;
  logGrowth: number | null;
  tokensPerDay: number;
  supportedUsers: number;
  score: number;
  letter: string;
  gpa: number;
  sourceId: string;
  methodNote: string;
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

function sheet(name: string, description: string, rows: ReportCell[][]): ReportSheet {
  const sourceColumns = rows.reduce((maximum, row) => Math.max(maximum, row.length), 0);
  return {
    name,
    address: `A1:${columnName(sourceColumns)}${rows.length}`,
    description,
    rows,
    sourceRows: rows.length,
    sourceColumns,
    nonEmptyCells: rows.flat().filter((cell) => cell !== null && cell !== '').length,
  };
}

function columnName(columnCount: number) {
  let value = Math.max(1, columnCount);
  let label = '';
  while (value > 0) {
    value -= 1;
    label = String.fromCharCode(65 + (value % 26)) + label;
    value = Math.floor(value / 26);
  }
  return label;
}

function sourceRows(sources: Source[]) {
  return [
    ['Source ID', 'Publisher', 'Title', 'Accessed', 'Roles', 'Public URL', 'Notes'],
    ...sources.map((source) => [
      source.id,
      source.publisher,
      source.title,
      source.accessedAt,
      (source.roles ?? []).join(', '),
      source.url,
      source.notes ?? '',
    ]),
  ];
}

const capabilityDataset = snapshotDatasets['capability-benchmarks'];
const metrDataset = snapshotDatasets['metr-task-horizon'];
const computeDataset = snapshotDatasets['compute-capacity'];

const capabilitySummaryRows: ReportCell[][] = [
  ['Metric', 'Value', 'Unit / interpretation'],
  ['Snapshot', forecastModel.snapshotDate, 'Latest dated snapshot selected at build'],
  ['Current confidence-weighted capability', forecastModel.capability.currentScore, '0–1 score'],
  ['Current letter grade', forecastModel.capability.currentGrade, 'A ≥90%, B ≥80%, C ≥70%, D ≥60%, F <60%'],
  ['Current GPA', forecastModel.capability.currentGpa, '0–4'],
  ['Evidence confidence', forecastModel.capability.confidence, `${forecastModel.capability.confidenceWeight.toFixed(3)} evidence weight`],
  ['Economic failure-gap velocity', forecastModel.capability.economicGapVelocity, 'gap halvings / quarter'],
  ['METR H50 acceleration', forecastModel.capability.h50Acceleration, 'task-horizon doublings / quarter²'],
  ['METR H80 guardrail', forecastModel.capability.h80Acceleration, 'task-horizon doublings / quarter²'],
  ['Economic transfer coefficient', forecastModel.capability.transferCoefficient, 'economic gap velocity / H50 velocity'],
  [],
  ['Category', 'Current score', 'GPA', 'Graded benchmarks', 'Total benchmarks', 'Confidence', 'Confidence weight', 'Gap velocity'],
  ...forecastModel.capability.categories.map((category: CapabilityCategory) => [
    category.category,
    category.currentScore,
    category.currentGpa,
    category.graded,
    category.total,
    category.confidence,
    category.confidenceWeight,
    category.economicGapVelocity,
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

const computeSummaryRows: ReportCell[][] = [
  ['Metric', 'Value', 'Unit / interpretation'],
  ['Snapshot', forecastModel.snapshotDate, 'Latest dated snapshot selected at build'],
  ['Current operational U.S. H100e', forecastModel.compute.currentRow.usH100e, 'H100-equivalents'],
  ['Current supported high-autonomy users', forecastModel.compute.currentSupportedUsers, 'users'],
  ['Target users', forecastModel.compute.targetUsers, `${(computeDataset.data.population.targetShare * 100).toFixed(0)}% of modeled U.S. population`],
  ['Required H100e', forecastModel.compute.requiredH100e, 'H100-equivalents'],
  ['Current supply score', forecastModel.compute.currentScore, 'supported users / target users'],
  ['Tokens per H100e per day', forecastModel.compute.tokensPerH100eDay, 'compute-equivalent tokens'],
  ['Agent workload per user per day', forecastModel.compute.workloadTokens, 'compute-equivalent tokens'],
  ['Mean projected log velocity', forecastModel.compute.velocity, 'log₂ H100e / quarter'],
  ['Projected log acceleration', forecastModel.compute.acceleration, 'log₂ H100e / quarter²'],
  ['Continuous base-case crossing', forecastModel.compute.continuousCrossing, 'UTC'],
];

const computeQuarterRows: ReportCell[][] = [
  ['Quarter index', 'Quarter', 'Cutoff', 'Phase', 'U.S. operational H100e', 'log2 H100e', 'Log growth / quarter', 'Compute-equivalent tokens/day', 'Supported users', 'Score vs target', 'Letter', 'GPA', 'Source ID', 'Method note'],
  ...forecastModel.compute.quarterRows.map((quarter: ComputeQuarter) => [
    quarter.quarterIndex,
    quarter.quarter,
    quarter.cutoffDate,
    quarter.phase,
    quarter.usH100e,
    quarter.log2H100e,
    quarter.logGrowth,
    quarter.tokensPerDay,
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
  ['Serving', 'Personal-AI inference share', computeDataset.data.serving.personalAiInferenceShare, 'share of modeled inference supply'],
  ['Serving', 'Serving goodput', computeDataset.data.serving.servingGoodputMultiplier, 'multiplier'],
  ['Serving', 'H100e dense 8-bit operations', computeDataset.data.serving.dense8BitOpsPerH100eSecond, 'operations / second'],
  ['Serving', 'Seconds per day', computeDataset.data.serving.secondsPerDay, 'seconds'],
  ['Workload', 'Compute-equivalent tokens per user/day', forecastModel.compute.workloadTokens, 'tokens'],
  ...forecastModel.compute.components.map((component: WorkloadComponent) => [
    'Workload component',
    component.label,
    component.tokensPerUserDay,
    `${component.computeWeight}× compute weight; ${component.computeEquivalentTokens.toLocaleString('en-US')} compute-equivalent tokens`,
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

export const workbooks: Record<'capability' | 'compute', ReportWorkbook> = {
  capability: {
    id: 'capability',
    title: 'Model–harness capability report card',
    download: 'https://raw.githubusercontent.com/buwilliams/diffuse-personal-ai/main/artifacts/report-cards/personal-ai-four-year-capability-report-card.xlsx',
    sheets: [
      sheet('Summary', 'Current score, evidence weight, acceleration, and the quarterly aggregate path.', capabilitySummaryRows),
      sheet('Benchmarks', 'The normalized benchmark basket that drives the capability forecast.', capabilityBenchmarkRows),
      sheet('Observations', 'Every model–harness observation compiled for the forecast basket.', capabilityObservationRows),
      sheet('METR Horizon', 'Task-horizon observations and recent-fit acceleration estimates used for capability feedback.', metrRows),
      sheet('Sources', 'Public sources and provenance for the capability datasets.', sourceRows([...(capabilityDataset.metadata.sources as Source[]), ...(metrDataset.metadata.sources as Source[])])),
    ],
  },
  compute: {
    id: 'compute',
    title: 'Compute supply report card',
    download: 'https://raw.githubusercontent.com/buwilliams/diffuse-personal-ai/main/artifacts/report-cards/personal-ai-compute-report-card.xlsx',
    sheets: [
      sheet('Summary', 'Current supply, serving assumptions, and the base-case crossing.', computeSummaryRows),
      sheet('Quarterly Model', 'Observed and expected U.S. operational H100-equivalent capacity by quarter.', computeQuarterRows),
      sheet('Assumptions', 'Population, workload, allocation, and serving assumptions.', computeAssumptionRows),
      sheet('Supporting Evidence', 'Independent quantitative supply diagnostics retained in their reported units; these rows do not directly enter the countdown.', computeSupportingEvidenceRows),
      sheet('Sources', 'Public sources and provenance for the compute dataset.', sourceRows(computeDataset.metadata.sources as Source[])),
    ],
  },
};
