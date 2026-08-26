import latestSnapshot from './generated/latest-snapshot.json';
import { buildForecastModel } from '../../../model/forecast-model.mjs';

export const forecastModel = buildForecastModel(latestSnapshot);
export const snapshotManifest = latestSnapshot.manifest;
export const snapshotGates = latestSnapshot.gates;
export const snapshotDatasets = latestSnapshot.datasets;
