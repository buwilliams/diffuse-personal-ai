import { forecastModel } from './snapshot-model';

export const DEFAULT_IT_POWER_GW = forecastModel.compute.currentItPowerGw;
export const DEFAULT_PRODUCTIVITY_T = forecastModel.compute.currentReferenceProductivityT;
export const BASE_POWER_ACCELERATION = forecastModel.compute.powerAcceleration;
export const BASE_POWER_VELOCITY = forecastModel.compute.powerVelocity ?? 0;
export const BASE_PRODUCTIVITY_ACCELERATION = forecastModel.compute.productivityAcceleration;
export const BASE_PRODUCTIVITY_VELOCITY = forecastModel.compute.productivityVelocity ?? 0;

export function itPowerAt(
  timestamp: number,
  currentItPowerGw: number,
  scenarioAcceleration: number,
) {
  return forecastModel.compute.itPowerAt(timestamp, currentItPowerGw, scenarioAcceleration);
}

export function productivityAt(
  timestamp: number,
  currentProductivityT: number,
  scenarioAcceleration: number,
) {
  return forecastModel.compute.productivityAt(timestamp, currentProductivityT * 1e12, scenarioAcceleration) / 1e12;
}
