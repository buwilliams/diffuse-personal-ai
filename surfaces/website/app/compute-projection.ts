import { forecastModel } from './snapshot-model';

export const DEFAULT_COMPUTE_M = forecastModel.compute.currentComputeM;
export const BASE_COMPUTE_ACCELERATION = forecastModel.compute.acceleration;
export const BASE_COMPUTE_VELOCITY = forecastModel.compute.velocity ?? 0;
export const COMPUTE_CURVE = forecastModel.compute.curve.map(
  ({ date, capacityM }: { date: string; capacityM: number }) => [date, capacityM] as const,
);

export function computeCapacityAt(
  timestamp: number,
  currentComputeM: number,
  scenarioAcceleration: number,
) {
  return forecastModel.compute.capacityAt(timestamp, currentComputeM, scenarioAcceleration);
}
