export const DAY_MS = 86_400_000;
export const QUARTER_DAYS = 365.2425 / 4;
export const QUARTER_MS = QUARTER_DAYS * DAY_MS;

export function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function failureGapDepth(score, exactOneDepth = 30) {
  if (score === null || score === undefined || Number.isNaN(score)) return null;
  if (score >= 1) return exactOneDepth;
  return -Math.log2(1 - clamp(score, 0, 1));
}

export function scoreFromDepth(depth) {
  return clamp(1 - 2 ** -Math.max(0, depth), 0, 1);
}

export function grade(score) {
  if (score === null || score === undefined) return { letter: 'N/A', gpa: null };
  if (score >= 0.9) return { letter: 'A', gpa: 4 };
  if (score >= 0.8) return { letter: 'B', gpa: 3 };
  if (score >= 0.7) return { letter: 'C', gpa: 2 };
  if (score >= 0.6) return { letter: 'D', gpa: 1 };
  return { letter: 'F', gpa: 0 };
}

export function confidenceLabel(weight) {
  if (weight >= 0.8) return 'High';
  if (weight >= 0.5) return 'Medium';
  return 'Low';
}

function average(values) {
  const numbers = values.filter((value) => typeof value === 'number' && Number.isFinite(value));
  return numbers.length ? numbers.reduce((sum, value) => sum + value, 0) / numbers.length : null;
}

function weightedAverage(rows, valueKey, weightKey) {
  const valid = rows.filter((row) => typeof row[valueKey] === 'number' && typeof row[weightKey] === 'number' && row[weightKey] > 0);
  const weight = valid.reduce((sum, row) => sum + row[weightKey], 0);
  return weight ? valid.reduce((sum, row) => sum + row[valueKey] * row[weightKey], 0) / weight : null;
}

function solve3x3(matrix, vector) {
  const augmented = matrix.map((row, index) => [...row, vector[index]]);
  for (let column = 0; column < 3; column += 1) {
    let pivot = column;
    for (let row = column + 1; row < 3; row += 1) {
      if (Math.abs(augmented[row][column]) > Math.abs(augmented[pivot][column])) pivot = row;
    }
    [augmented[column], augmented[pivot]] = [augmented[pivot], augmented[column]];
    const divisor = augmented[column][column];
    if (Math.abs(divisor) < 1e-12) throw new Error('Singular quadratic fit');
    for (let index = column; index < 4; index += 1) augmented[column][index] /= divisor;
    for (let row = 0; row < 3; row += 1) {
      if (row === column) continue;
      const factor = augmented[row][column];
      for (let index = column; index < 4; index += 1) augmented[row][index] -= factor * augmented[column][index];
    }
  }
  return augmented.map((row) => row[3]);
}

export function quadraticLogHorizonFit(rows) {
  const ordered = [...rows].sort((a, b) => a.releaseDate.localeCompare(b.releaseDate));
  const latestTimestamp = Math.max(...ordered.map((row) => Date.parse(`${row.releaseDate}T00:00:00Z`)));
  const points = ordered.map((row) => ({
    t: (Date.parse(`${row.releaseDate}T00:00:00Z`) - latestTimestamp) / DAY_MS / QUARTER_DAYS,
    y: Math.log2(row.horizonMinutes),
  }));
  const sums = points.reduce((accumulator, point) => ({
    t0: accumulator.t0 + 1,
    t1: accumulator.t1 + point.t,
    t2: accumulator.t2 + point.t ** 2,
    t3: accumulator.t3 + point.t ** 3,
    t4: accumulator.t4 + point.t ** 4,
    y0: accumulator.y0 + point.y,
    y1: accumulator.y1 + point.t * point.y,
    y2: accumulator.y2 + point.t ** 2 * point.y,
  }), { t0: 0, t1: 0, t2: 0, t3: 0, t4: 0, y0: 0, y1: 0, y2: 0 });
  const [beta0, beta1, beta2] = solve3x3(
    [[sums.t0, sums.t1, sums.t2], [sums.t1, sums.t2, sums.t3], [sums.t2, sums.t3, sums.t4]],
    [sums.y0, sums.y1, sums.y2],
  );
  const fitted = points.map(({ t }) => beta0 + beta1 * t + beta2 * t * t);
  const mean = average(points.map((point) => point.y));
  const sse = points.reduce((sum, point, index) => sum + (point.y - fitted[index]) ** 2, 0);
  const sst = points.reduce((sum, point) => sum + (point.y - mean) ** 2, 0);
  const acceleration = 2 * beta2;
  return {
    beta0,
    beta1,
    beta2,
    acceleration,
    relativeAcceleration: beta1 > 0 ? acceleration / beta1 : 0,
    velocityGrowthPerQuarter: beta1 > 0 ? Math.expm1(acceleration / beta1) : 0,
    rSquared: sst > 0 ? 1 - sse / sst : 1,
    points: ordered.map((row, index) => ({
      ...row,
      elapsedQuarters: points[index].t,
      log2Minutes: points[index].y,
      fittedLog2Minutes: fitted[index],
      residual: points[index].y - fitted[index],
    })),
  };
}

export function recursiveProgressGain(horizon, velocity, acceleration) {
  if (horizon <= 0 || velocity <= 0) return 0;
  const feedbackCoefficient = acceleration / velocity;
  if (Math.abs(feedbackCoefficient) < 1e-9) return velocity * horizon;
  return Math.max(0, velocity * Math.expm1(feedbackCoefficient * horizon) / feedbackCoefficient);
}

function quarterEnd(label, snapshotDate, currentQuarterIndex, quarterIndex) {
  if (quarterIndex === currentQuarterIndex) return snapshotDate;
  const [yearText, quarterText] = label.split('-Q');
  const year = Number(yearText);
  const quarter = Number(quarterText);
  const month = quarter * 3;
  const day = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10);
}

function reportQuarters(startLabel, endLabel, snapshotDate, currentQuarterIndex) {
  const [startYear, startQuarter] = startLabel.split('-Q').map(Number);
  const [endYear, endQuarter] = endLabel.split('-Q').map(Number);
  const quarters = [];
  let year = startYear;
  let quarter = startQuarter;
  while (year < endYear || (year === endYear && quarter <= endQuarter)) {
    const index = quarters.length + 1;
    const label = `${year}-Q${quarter}`;
    quarters.push({
      index,
      label,
      date: quarterEnd(label, snapshotDate, currentQuarterIndex, index),
      phase: index < currentQuarterIndex ? 'observed' : index === currentQuarterIndex ? 'observed-qtd' : 'projected',
    });
    quarter += 1;
    if (quarter === 5) {
      quarter = 1;
      year += 1;
    }
  }
  return quarters;
}

function modelHorizonAt(timestamp, curve) {
  const points = curve.map((point, horizon) => ({ timestamp: Date.parse(`${point.date}T00:00:00Z`), horizon }));
  if (timestamp <= points[0].timestamp) return 0;
  for (let index = 1; index < points.length; index += 1) {
    if (timestamp <= points[index].timestamp) {
      const previous = points[index - 1];
      const next = points[index];
      return previous.horizon + (timestamp - previous.timestamp) / (next.timestamp - previous.timestamp);
    }
  }
  return points.at(-1).horizon + (timestamp - points.at(-1).timestamp) / QUARTER_MS;
}

function interpolateCurve(timestamp, curve, valueKey) {
  const points = curve.map((point) => ({ timestamp: Date.parse(`${point.date}T00:00:00Z`), value: point[valueKey] }));
  if (timestamp <= points[0].timestamp) return points[0].value;
  for (let index = 1; index < points.length; index += 1) {
    if (timestamp <= points[index].timestamp) {
      const previous = points[index - 1];
      const next = points[index];
      const fraction = (timestamp - previous.timestamp) / (next.timestamp - previous.timestamp);
      return previous.value + (next.value - previous.value) * fraction;
    }
  }
  return null;
}

function linearSlope(points) {
  const xMean = average(points.map((point) => point.x));
  const yMean = average(points.map((point) => point.y));
  const numerator = points.reduce((sum, point) => sum + (point.x - xMean) * (point.y - yMean), 0);
  const denominator = points.reduce((sum, point) => sum + (point.x - xMean) ** 2, 0);
  return denominator ? numerator / denominator : 0;
}

function capabilityModel(snapshot, defaults) {
  const capability = snapshot.datasets['capability-benchmarks'].data;
  const metr = snapshot.datasets['metr-task-horizon'].data;
  const currentQuarterIndex = capability.model.currentQuarterIndex;
  const maxCredits = capability.model.maximumEvidenceCreditsPerBenchmark;
  const exactOneDepth = capability.model.exactOneDepth;
  const quarters = reportQuarters(defaults.reportStartQuarter, defaults.reportEndQuarter, snapshot.manifest.metadata.snapshotDate, currentQuarterIndex);

  const benchmarkRows = capability.benchmarks.map((benchmark) => {
    const observations = capability.observations
      .filter((observation) => observation.benchmarkId === benchmark.id && observation.quarterIndex <= currentQuarterIndex)
      .sort((a, b) => a.quarterIndex - b.quarterIndex);
    const latest = observations.at(-1) ?? null;
    const prior = observations.at(-2) ?? null;
    const prior2 = observations.at(-3) ?? null;
    const latestDepth = latest ? failureGapDepth(latest.score, exactOneDepth) : null;
    const priorDepth = prior ? failureGapDepth(prior.score, exactOneDepth) : null;
    const prior2Depth = prior2 ? failureGapDepth(prior2.score, exactOneDepth) : null;
    const recentVelocity = latest && prior ? (latestDepth - priorDepth) / (latest.quarterIndex - prior.quarterIndex) : 0;
    const priorVelocity = prior && prior2 ? (priorDepth - prior2Depth) / (prior.quarterIndex - prior2.quarterIndex) : 0;
    const localAcceleration = latest && prior && prior2
      ? (recentVelocity - priorVelocity) / (((latest.quarterIndex - prior.quarterIndex) + (prior.quarterIndex - prior2.quarterIndex)) / 2)
      : 0;
    return {
      ...benchmark,
      observations,
      observationCount: observations.length,
      currentScore: latest?.score ?? null,
      currentDepth: latestDepth,
      recentVelocity,
      priorVelocity,
      localAcceleration,
      evidenceCredits: Math.min(new Set(observations.map((observation) => observation.quarterIndex)).size, maxCredits),
      ...grade(latest?.score ?? null),
    };
  });

  const seriesFor = (metric) => metr.series.filter((row) => row.metric === metric);
  const trendFor = (role) => metr.trendEstimates.find((row) => row.role === role);
  const h50Fit = quadraticLogHorizonFit(seriesFor('H50'));
  const h80Fit = quadraticLogHorizonFit(seriesFor('H80'));
  const h50Trend = trendFor(metr.forecastPolicy.primaryVelocityEstimateRole);
  const h80Trend = trendFor(metr.forecastPolicy.reliabilityVelocityEstimateRole);
  const h50Velocity = QUARTER_DAYS / h50Trend.value;
  const h80Velocity = QUARTER_DAYS / h80Trend.value;
  const effectiveRelativeAcceleration = Math.max(0, Math.min(h50Fit.relativeAcceleration, h80Fit.relativeAcceleration));

  const emptyCategories = capability.categories.map((category) => {
    const rows = benchmarkRows.filter((benchmark) => benchmark.category === category);
    const contributors = rows.filter((benchmark) => benchmark.observationCount >= 2);
    const confidenceWeight = rows.length
      ? rows.reduce((sum, benchmark) => sum + benchmark.evidenceCredits, 0) / (maxCredits * rows.length)
      : 0;
    return {
      category,
      graded: rows.filter((row) => row.currentScore !== null).length,
      total: rows.length,
      currentScore: average(rows.map((row) => row.currentScore)),
      currentGpa: average(rows.map((row) => row.gpa)),
      economicGapVelocity: average(contributors.map((row) => row.recentVelocity)),
      confidenceWeight,
      confidence: confidenceLabel(confidenceWeight),
    };
  });
  const totalCategoryWeight = emptyCategories.reduce((sum, category) => sum + category.confidenceWeight, 0);
  const economicGapVelocity = totalCategoryWeight
    ? emptyCategories.reduce((sum, category) => sum + (category.economicGapVelocity ?? 0) * category.confidenceWeight, 0) / totalCategoryWeight
    : 0;
  const h50Acceleration = h50Velocity * effectiveRelativeAcceleration;
  const h80Acceleration = h80Velocity * h80Fit.relativeAcceleration;
  const transferCoefficient = economicGapVelocity / h50Velocity;
  const economicAcceleration = economicGapVelocity * effectiveRelativeAcceleration;

  const depthGain = (horizon, acceleration = h50Acceleration) => {
    const relative = h50Velocity > 0 ? acceleration / h50Velocity : 0;
    if (Math.abs(relative) < 1e-9) return economicGapVelocity * horizon;
    return Math.max(0, economicGapVelocity * Math.expm1(relative * horizon) / relative);
  };
  const compositeAtHorizon = (horizon, acceleration = h50Acceleration) => {
    const projectedBenchmarks = benchmarkRows.filter((row) => row.currentDepth !== null).map((row) => ({
      ...row,
      projectedScore: scoreFromDepth(row.currentDepth + depthGain(horizon, acceleration)),
    }));
    const categoryRows = emptyCategories.map((category) => ({
      ...category,
      projectedScore: average(projectedBenchmarks.filter((row) => row.category === category.category).map((row) => row.projectedScore)),
    }));
    return weightedAverage(categoryRows, 'projectedScore', 'confidenceWeight');
  };

  for (const benchmark of benchmarkRows) {
    benchmark.series = quarters.map((quarter) => {
      const exact = benchmark.observations.find((observation) => observation.quarterIndex === quarter.index);
      const carried = benchmark.observations.filter((observation) => observation.quarterIndex <= quarter.index).at(-1);
      const score = quarter.index <= currentQuarterIndex
        ? carried?.score ?? null
        : benchmark.currentDepth === null ? null : scoreFromDepth(benchmark.currentDepth + depthGain(quarter.index - currentQuarterIndex));
      return { quarter: quarter.label, quarterIndex: quarter.index, score, phase: exact ? 'observed' : quarter.index <= currentQuarterIndex ? 'carried' : 'projected' };
    });
  }

  const categories = emptyCategories.map((category) => ({
    ...category,
    series: quarters.map((quarter) => ({
      quarter: quarter.label,
      score: average(benchmarkRows.filter((benchmark) => benchmark.category === category.category).map((benchmark) => benchmark.series[quarter.index - 1].score)),
    })),
  }));
  const overallSeries = quarters.map((quarter) => ({
    quarter: quarter.label,
    date: quarter.date,
    score: weightedAverage(categories.map((category) => ({ value: category.series[quarter.index - 1].score, weight: category.confidenceWeight })), 'value', 'weight'),
  }));
  const currentScore = overallSeries[currentQuarterIndex - 1].score;
  const overallConfidenceWeight = categories.reduce((sum, category) => sum + category.confidenceWeight * category.total, 0) /
    categories.reduce((sum, category) => sum + category.total, 0);
  const currentGpa = weightedAverage(categories.map((category) => ({ value: category.currentGpa, weight: category.confidenceWeight })), 'value', 'weight');

  const curve = overallSeries.filter((point) => point.quarter >= quarters[currentQuarterIndex - 1].label).map((point) => ({ date: point.date, score: point.score }));
  const reportEnd = Date.parse(`${curve.at(-1).date}T00:00:00Z`);
  const capabilityAt = (timestamp, scenarioCurrent = currentScore, scenarioH50Acceleration = h50Acceleration) => {
    const horizon = modelHorizonAt(timestamp, curve);
    const baseline = timestamp <= reportEnd ? interpolateCurve(timestamp, curve, 'score') : compositeAtHorizon(horizon, h50Acceleration);
    const accelerationAdjustment = compositeAtHorizon(horizon, scenarioH50Acceleration) - compositeAtHorizon(horizon, h50Acceleration);
    return clamp(baseline + accelerationAdjustment + scenarioCurrent - currentScore, 0, 0.99);
  };

  return {
    quarters,
    benchmarkRows,
    categories,
    overallSeries,
    curve,
    currentScore,
    currentGpa,
    currentGrade: grade(currentScore).letter,
    confidenceWeight: overallConfidenceWeight,
    confidence: confidenceLabel(overallConfidenceWeight),
    economicGapVelocity,
    h50Velocity,
    h80Velocity,
    h50Fit,
    h80Fit,
    effectiveRelativeAcceleration,
    h50Acceleration,
    h80Acceleration,
    transferCoefficient,
    economicAcceleration,
    capabilityAt,
    compositeAtHorizon,
    reportEnd,
  };
}

function computeModel(snapshot, defaults) {
  const compute = snapshot.datasets['compute-capacity'].data;
  const components = compute.workload.components.map((component) => ({
    ...component,
    computeEquivalentTokens: component.tokensPerUserDay * component.computeWeight,
  }));
  const workloadTokens = components.reduce((sum, component) => sum + component.computeEquivalentTokens, 0);
  const serving = compute.serving;
  const tokensPerH100eDay = serving.dense8BitOpsPerH100eSecond * serving.secondsPerDay *
    serving.fleetShareAllocatedToInference * serving.sustainedServingUtilization * serving.servingGoodputMultiplier *
    serving.personalAiInferenceShare /
    (serving.activeModelParameters * serving.forwardPassOpsPerParameterToken * serving.systemOverheadMultiplier);
  const targetUsers = compute.population.usResidents * compute.population.targetShare;
  const requiredH100e = targetUsers * workloadTokens / tokensPerH100eDay;
  const quarterRows = [...compute.quarters].sort((a, b) => a.quarterIndex - b.quarterIndex).map((quarter, index, rows) => {
    const log2H100e = Math.log2(quarter.usH100e);
    const priorLog = index ? Math.log2(rows[index - 1].usH100e) : null;
    const supportedUsers = quarter.usH100e * tokensPerH100eDay / workloadTokens;
    const score = Math.min(1, supportedUsers / targetUsers);
    return {
      ...quarter,
      phase: quarter.evidenceClass.startsWith('observed') ? quarter.evidenceClass : 'projected',
      log2H100e,
      logGrowth: priorLog === null ? null : log2H100e - priorLog,
      tokensPerDay: quarter.usH100e * tokensPerH100eDay,
      supportedUsers,
      score,
      ...grade(score),
    };
  });
  const currentRow = quarterRows.filter((row) => row.evidenceClass.startsWith('observed')).at(-1);
  const projectedRows = quarterRows.filter((row) => row.quarterIndex > currentRow.quarterIndex);
  const growthPoints = projectedRows.map((row) => ({ x: row.quarterIndex, y: row.logGrowth }));
  const acceleration = linearSlope(growthPoints);
  const velocity = average(growthPoints.map((point) => point.y));
  const curve = quarterRows.filter((row) => row.quarterIndex >= currentRow.quarterIndex).map((row) => ({ date: row.cutoffDate, capacityM: row.usH100e / 1_000_000 }));

  const baselineLogAt = (quarter) => {
    const capacities = curve.map((point) => point.capacityM);
    const logs = capacities.map(Math.log2);
    if (quarter <= 0) return logs[0];
    if (quarter < logs.length - 1) {
      const lower = Math.floor(quarter);
      const fraction = quarter - lower;
      return Math.log2(capacities[lower] + (capacities[lower + 1] - capacities[lower]) * fraction);
    }
    const lastIndex = logs.length - 1;
    return logs[lastIndex] + recursiveProgressGain(quarter - lastIndex, logs[lastIndex] - logs[lastIndex - 1], acceleration);
  };
  const capacityAt = (timestamp, scenarioCurrentM = currentRow.usH100e / 1_000_000, scenarioAcceleration = acceleration) => {
    const quarter = modelHorizonAt(timestamp, curve);
    const adjustment = recursiveProgressGain(quarter, velocity, scenarioAcceleration) - recursiveProgressGain(quarter, velocity, acceleration);
    const currentShift = Math.log2(scenarioCurrentM / (currentRow.usH100e / 1_000_000));
    return 2 ** (Math.max(Math.log2(currentRow.usH100e / 1_000_000), baselineLogAt(quarter) + adjustment) + currentShift);
  };

  let continuousCrossing = null;
  const fullRowIndex = quarterRows.findIndex((row) => row.usH100e >= requiredH100e);
  if (fullRowIndex > 0) {
    const previous = quarterRows[fullRowIndex - 1];
    const next = quarterRows[fullRowIndex];
    const fraction = (requiredH100e - previous.usH100e) / (next.usH100e - previous.usH100e);
    continuousCrossing = Date.parse(`${previous.cutoffDate}T00:00:00Z`) + fraction *
      (Date.parse(`${next.cutoffDate}T00:00:00Z`) - Date.parse(`${previous.cutoffDate}T00:00:00Z`));
  } else {
    const final = quarterRows.at(-1);
    const remainingLog = Math.log2(requiredH100e / final.usH100e);
    const finalVelocity = final.logGrowth;
    const relative = acceleration / finalVelocity;
    const extraQuarters = Math.abs(acceleration) < 1e-9
      ? remainingLog / finalVelocity
      : Math.log(1 + relative * remainingLog / finalVelocity) / relative;
    continuousCrossing = Date.parse(`${final.cutoffDate}T00:00:00Z`) + extraQuarters * QUARTER_MS;
  }

  return {
    components,
    workloadTokens,
    tokensPerH100eDay,
    targetUsers,
    requiredH100e,
    quarterRows,
    curve,
    currentRow,
    currentComputeM: currentRow.usH100e / 1_000_000,
    currentSupportedUsers: currentRow.supportedUsers,
    currentScore: currentRow.score,
    acceleration,
    velocity,
    continuousCrossing,
    capacityAt,
  };
}

export function buildForecastModel(snapshot) {
  const defaults = snapshot.manifest.data.defaults;
  const capability = capabilityModel(snapshot, defaults);
  const compute = computeModel(snapshot, defaults);
  return {
    snapshotId: snapshot.id,
    snapshotDate: snapshot.manifest.metadata.snapshotDate,
    publicationDate: snapshot.manifest.metadata.asOfDate,
    manifest: snapshot.manifest,
    datasets: snapshot.datasets,
    defaults,
    capability,
    compute,
  };
}
