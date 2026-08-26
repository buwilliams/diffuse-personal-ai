import { workbooks } from './report-data.ts';

const DAY = 86_400_000;
const QUARTER = (365.2425 / 4) * DAY;

export const CAPABILITY_CURVE = [
  ['2026-08-26', 45.6605338349],
  ['2026-12-31', 50.6951630999],
  ['2027-03-31', 56.7303543099],
  ['2027-06-30', 63.6895931331],
  ['2027-09-30', 71.3077702043],
  ['2027-12-31', 79.0864616343],
  ['2028-03-31', 86.3228894897],
  ['2028-06-30', 92.2676013712],
  ['2028-09-30', 96.4050064412],
  ['2028-12-31', 98.7146564482],
] as const;

export const DEFAULT_CAPABILITY_SCORE = CAPABILITY_CURVE[0][1];
export const CAPABILITY_REPORT_END = new Date(
  `${CAPABILITY_CURVE[CAPABILITY_CURVE.length - 1][0]}T00:00:00Z`,
).getTime();

type BenchmarkProjection = {
  category: string;
  currentDepth: number;
};

type CategoryWeight = {
  category: string;
  weight: number;
};

const capabilityModelSheet = workbooks.capability.sheets.find((sheet) => sheet.name === 'Model');
const capabilitySummarySheet = workbooks.capability.sheets.find((sheet) => sheet.name === 'Summary');
const metrHorizonSheet = workbooks.capability.sheets.find((sheet) => sheet.name === 'METR Horizon');

const benchmarkProjections: BenchmarkProjection[] = capabilityModelSheet?.rows
  .filter((row) =>
    typeof row[2] === 'string' &&
    typeof row[3] === 'number' && row[3] > 0 &&
    typeof row[12] === 'number')
  .map((row) => ({
    category: row[2] as string,
    currentDepth: row[12] as number,
  })) ?? [];

const categoryWeights: CategoryWeight[] = capabilitySummarySheet?.rows
  .filter((row) =>
    typeof row[0] === 'string' &&
    typeof row[10] === 'number' &&
    benchmarkProjections.some((benchmark) => benchmark.category === row[0]))
  .map((row) => ({ category: row[0] as string, weight: row[10] as number })) ?? [];

const overallSummaryRow = capabilitySummarySheet?.rows.find(
  (row) => row[0] === 'Overall (confidence-weighted)',
);

export const CAPABILITY_GAP_VELOCITY =
  typeof overallSummaryRow?.[6] === 'number' ? overallSummaryRow[6] : 0;

function metrBridgeValue(label: string) {
  const row = metrHorizonSheet?.rows.find((candidate) => candidate[13] === label);
  return typeof row?.[14] === 'number' ? row[14] : 0;
}

export const CAPABILITY_H50_VELOCITY = metrBridgeValue('H50 source velocity');
export const CAPABILITY_RELATIVE_ACCELERATION = metrBridgeValue('Effective relative acceleration');
export const CAPABILITY_H50_ACCELERATION = metrBridgeValue('Default H50 acceleration');
export const CAPABILITY_TRANSFER_COEFFICIENT = metrBridgeValue('Economic transfer coefficient');
export const CAPABILITY_ECONOMIC_ACCELERATION = metrBridgeValue('Initial economic acceleration');
export const CAPABILITY_H80_ACCELERATION = metrBridgeValue('H80 implied acceleration');

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function modelHorizonAt(timestamp: number) {
  const points = CAPABILITY_CURVE.map(([date], horizon) => ({
    timestamp: new Date(`${date}T00:00:00Z`).getTime(),
    horizon,
  }));

  if (timestamp <= points[0].timestamp) return 0;
  for (let index = 1; index < points.length; index += 1) {
    if (timestamp <= points[index].timestamp) {
      const previous = points[index - 1];
      const next = points[index];
      const fraction = (timestamp - previous.timestamp) / (next.timestamp - previous.timestamp);
      return previous.horizon + fraction;
    }
  }

  return points[points.length - 1].horizon +
    (timestamp - points[points.length - 1].timestamp) / QUARTER;
}

function frontierDepthGain(horizon: number, scenarioH50Acceleration: number) {
  if (horizon <= 0 || CAPABILITY_GAP_VELOCITY <= 0) return 0;
  const feedbackCoefficient = CAPABILITY_H50_VELOCITY > 0
    ? scenarioH50Acceleration / CAPABILITY_H50_VELOCITY
    : 0;
  if (Math.abs(feedbackCoefficient) < 1e-9) return CAPABILITY_GAP_VELOCITY * horizon;
  return Math.max(
    0,
    CAPABILITY_GAP_VELOCITY * Math.expm1(feedbackCoefficient * horizon) / feedbackCoefficient,
  );
}

function benchmarkCompositeAt(horizon: number, scenarioH50Acceleration: number) {
  let weightedScore = 0;
  let totalWeight = 0;
  const sharedDepthGain = frontierDepthGain(horizon, scenarioH50Acceleration);

  for (const { category, weight } of categoryWeights) {
    const categoryBenchmarks = benchmarkProjections.filter(
      (benchmark) => benchmark.category === category,
    );
    if (categoryBenchmarks.length === 0 || weight <= 0) continue;

    const categoryScore = categoryBenchmarks.reduce((sum, benchmark) => {
      const depth = benchmark.currentDepth + sharedDepthGain;
      return sum + 1 - 2 ** -depth;
    }, 0) / categoryBenchmarks.length;

    weightedScore += categoryScore * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? weightedScore / totalWeight * 100 : DEFAULT_CAPABILITY_SCORE;
}

function reportPathAt(timestamp: number) {
  const points = CAPABILITY_CURVE.map(([date, score]) => ({
    timestamp: new Date(`${date}T00:00:00Z`).getTime(),
    score,
  }));

  if (timestamp <= points[0].timestamp) return points[0].score;
  for (let index = 1; index < points.length; index += 1) {
    if (timestamp <= points[index].timestamp) {
      const previous = points[index - 1];
      const next = points[index];
      const fraction = (timestamp - previous.timestamp) / (next.timestamp - previous.timestamp);
      return previous.score + (next.score - previous.score) * fraction;
    }
  }

  return benchmarkCompositeAt(modelHorizonAt(timestamp), CAPABILITY_H50_ACCELERATION);
}

/**
 * Preserve the published quarterly path at the report's H50 acceleration. A
 * live H50 acceleration changes the METR-derived relative feedback before the
 * economic benchmark scores are recovered, averaged, and confidence weighted.
 */
export function capabilityAt(
  timestamp: number,
  currentCapability: number,
  scenarioH50Acceleration: number,
) {
  const horizon = modelHorizonAt(timestamp);
  const baseline = reportPathAt(timestamp);
  const accelerationAdjustment = benchmarkCompositeAt(horizon, scenarioH50Acceleration) -
    benchmarkCompositeAt(horizon, CAPABILITY_H50_ACCELERATION);
  const currentShift = currentCapability - DEFAULT_CAPABILITY_SCORE;
  return clamp(baseline + accelerationAdjustment + currentShift, 0, 99);
}
