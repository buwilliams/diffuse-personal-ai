import { forecastModel } from './snapshot-model';

export const CAPABILITY_CURVE = forecastModel.capability.curve.map(
  ({ date, score }: { date: string; score: number | null }) => {
    if (score === null) throw new Error(`Capability curve is missing a score for ${date}`);
    return [date, score * 100] as const;
  },
);

if (forecastModel.capability.currentScore === null) throw new Error('Latest snapshot has no current capability score');
export const DEFAULT_CAPABILITY_SCORE = forecastModel.capability.currentScore * 100;
export const CAPABILITY_REPORT_END = forecastModel.capability.reportEnd;
export const CAPABILITY_GAP_VELOCITY = forecastModel.capability.economicGapVelocity;
export const CAPABILITY_H50_VELOCITY = forecastModel.capability.h50Velocity;
export const CAPABILITY_H50_ACCELERATION = forecastModel.capability.h50Acceleration;
export const CAPABILITY_TRANSFER_COEFFICIENT = forecastModel.capability.transferCoefficient;
export const CAPABILITY_ECONOMIC_ACCELERATION = forecastModel.capability.economicAcceleration;
export const CAPABILITY_H80_ACCELERATION = forecastModel.capability.h80Acceleration;

export function capabilityAt(
  timestamp: number,
  currentCapability: number,
  scenarioH50Acceleration: number,
) {
  return forecastModel.capability.capabilityAt(
    timestamp,
    currentCapability / 100,
    scenarioH50Acceleration,
  ) * 100;
}
