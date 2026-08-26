const DAY = 86_400_000;
const QUARTER = (365.2425 / 4) * DAY;

export const DEFAULT_COMPUTE_M = 13.524006;
export const BASE_COMPUTE_ACCELERATION = 0.003372653;
export const BASE_COMPUTE_VELOCITY = 0.2437905573;

export const COMPUTE_CURVE = [
  ['2026-08-26', 13.524006],
  ['2026-12-31', 17.39977],
  ['2027-03-31', 20.368064],
  ['2027-06-30', 21.439292],
  ['2027-09-30', 23.242366],
  ['2027-12-31', 30.057691],
  ['2028-03-31', 37.048243],
  ['2028-06-30', 46.037632],
  ['2028-09-30', 47.106859],
  ['2028-12-31', 61.887051],
] as const;

export function recursiveProgressGain(
  horizon: number,
  velocity: number,
  acceleration: number,
) {
  if (horizon <= 0 || velocity <= 0) return 0;
  const feedbackCoefficient = acceleration / velocity;
  if (Math.abs(feedbackCoefficient) < 1e-9) return velocity * horizon;
  return Math.max(
    0,
    velocity * Math.expm1(feedbackCoefficient * horizon) / feedbackCoefficient,
  );
}

function modelQuarterAt(timestamp: number) {
  const points = COMPUTE_CURVE.map(([date]) => new Date(`${date}T00:00:00Z`).getTime());
  if (timestamp <= points[0]) return 0;
  for (let index = 1; index < points.length; index += 1) {
    if (timestamp <= points[index]) {
      return index - 1 + (timestamp - points[index - 1]) / (points[index] - points[index - 1]);
    }
  }
  return points.length - 1 + (timestamp - points[points.length - 1]) / QUARTER;
}

function baselineComputeLogAtQuarter(quarter: number) {
  const capacities = COMPUTE_CURVE.map(([, capacity]) => capacity);
  const logs = capacities.map((capacity) => Math.log2(capacity));
  if (quarter <= 0) return logs[0];
  if (quarter < logs.length - 1) {
    const lower = Math.floor(quarter);
    const fraction = quarter - lower;
    return Math.log2(capacities[lower] + (capacities[lower + 1] - capacities[lower]) * fraction);
  }
  const lastIndex = logs.length - 1;
  const extra = quarter - lastIndex;
  const lastVelocity = logs[lastIndex] - logs[lastIndex - 1];
  return logs[lastIndex] + recursiveProgressGain(extra, lastVelocity, BASE_COMPUTE_ACCELERATION);
}

/**
 * Preserve the dated build-out curve at the report's default acceleration.
 * Scenario acceleration changes recursive log-compute growth around that path.
 */
export function computeCapacityAt(
  timestamp: number,
  currentComputeM: number,
  scenarioAcceleration: number,
) {
  const quarters = modelQuarterAt(timestamp);
  const accelerationAdjustment =
    recursiveProgressGain(quarters, BASE_COMPUTE_VELOCITY, scenarioAcceleration) -
    recursiveProgressGain(quarters, BASE_COMPUTE_VELOCITY, BASE_COMPUTE_ACCELERATION);
  const currentShift = Math.log2(currentComputeM / DEFAULT_COMPUTE_M);
  const scenarioLog = Math.max(
    Math.log2(DEFAULT_COMPUTE_M),
    baselineComputeLogAtQuarter(quarters) + accelerationAdjustment,
  );
  return 2 ** (scenarioLog + currentShift);
}
