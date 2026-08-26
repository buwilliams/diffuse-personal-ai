'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { workbooks, type ReportCell, type ReportSheet, type ReportWorkbook } from './report-data';

const DAY = 86_400_000;
const QUARTER = (365.2425 / 4) * DAY;
const SNAPSHOT = new Date('2026-08-26T00:00:00Z').getTime();
const PUBLICATION_DATE = '26 Aug 2026';
const MAX_HORIZON_DAYS = Math.round(365.2425 * 15);
const TOKENS_PER_H100E_DAY_M = 79.79328;
const BASE_COMPUTE_ACCELERATION = 0.003372653;
const BASE_NEXT_COMPUTE_VELOCITY = Math.log2(17.39977 / 13.524006);
const SUPPLY_GATE_SHARE_OF_TARGET = 1;
const SUPPLY_THRESHOLD = SUPPLY_GATE_SHARE_OF_TARGET * 100;

const CAPABILITY_CURVE = [
  ['2026-08-26', 45.6605338349],
  ['2026-12-31', 48.6645999787],
  ['2027-03-31', 51.9462756313],
  ['2027-06-30', 54.9025505410],
  ['2027-09-30', 57.1877199175],
  ['2027-12-31', 58.6955518339],
  ['2028-03-31', 59.5793794544],
  ['2028-06-30', 60.0567089955],
  ['2028-09-30', 60.3092346948],
  ['2028-12-31', 60.4522275615],
] as const;

const BASE_CAPABILITY_ACCELERATION_PP = (() => {
  const scores = CAPABILITY_CURVE.slice(1).map(([, score]) => score);
  const deltas = scores.slice(1).map((score, index) => score - scores[index]);
  const xMean = (deltas.length - 1) / 2;
  const yMean = deltas.reduce((sum, value) => sum + value, 0) / deltas.length;
  const numerator = deltas.reduce((sum, value, index) => sum + (index - xMean) * (value - yMean), 0);
  const denominator = deltas.reduce((sum, _, index) => sum + (index - xMean) ** 2, 0);
  return numerator / denominator;
})();
const CAPABILITY_ACCELERATION_RESPONSE_PP = Math.abs(BASE_CAPABILITY_ACCELERATION_PP);
const COMPUTE_ACCELERATION_RESPONSE_LOG2 = Math.abs(BASE_COMPUTE_ACCELERATION);

const COMPUTE_CURVE = [
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

const REPORT_QUARTERS = [
  '2024-Q1', '2024-Q2', '2024-Q3', '2024-Q4',
  '2025-Q1', '2025-Q2', '2025-Q3', '2025-Q4',
  '2026-Q1', '2026-Q2', '2026-Q3', '2026-Q4',
  '2027-Q1', '2027-Q2', '2027-Q3', '2027-Q4',
  '2028-Q1', '2028-Q2', '2028-Q3', '2028-Q4',
] as const;
const OBSERVED_END_INDEX = REPORT_QUARTERS.indexOf('2026-Q3');

type ReportChartSeries = {
  id: string;
  name: string;
  category: string;
  values: Array<number | null>;
  aggregate?: boolean;
};

const CAPABILITY_BENCHMARK_SERIES: ReportChartSeries[] = (() => {
  const sheet = workbooks.capability.sheets.find((item) => item.name === 'Report Card');
  if (!sheet) return [];
  return sheet.rows
    .filter((row) => typeof row[1] === 'string' && typeof row[2] === 'string' &&
      REPORT_QUARTERS.some((_, index) => typeof row[4 + index * 2] === 'number'))
    .map((row) => ({
      id: String(row[1]),
      name: String(row[2]),
      category: String(row[0]),
      values: REPORT_QUARTERS.map((_, index) => {
        const value = row[4 + index * 2];
        return typeof value === 'number' ? value * 100 : null;
      }),
    }));
})();

const CAPABILITY_AGGREGATE: ReportChartSeries = (() => {
  const sheet = workbooks.capability.sheets.find((item) => item.name === 'Summary');
  return {
    id: 'aggregate',
    name: 'Aggregate',
    category: 'Overall',
    aggregate: true,
    values: REPORT_QUARTERS.map((quarter) => {
      const row = sheet?.rows.find((item) => item[0] === quarter);
      return typeof row?.[5] === 'number' ? row[5] * 100 : null;
    }),
  };
})();

const CAPABILITY_CONFIDENCE = (() => {
  const sheet = workbooks.capability.sheets.find((item) => item.name === 'Summary');
  const row = sheet?.rows.find((item) => item[0] === 'Overall (confidence-weighted)');
  return {
    label: typeof row?.[9] === 'string' ? row[9] : 'Unknown',
    weight: typeof row?.[10] === 'number' ? row[10] * 100 : 0,
  };
})();

const COMPUTE_SUPPLY_SERIES: ReportChartSeries = (() => {
  const sheet = workbooks.compute.sheets.find((item) => item.name === 'Quarterly Model');
  return {
    id: 'us-h100e',
    name: 'U.S. operational compute',
    category: 'Compute supply',
    values: REPORT_QUARTERS.map((quarter) => {
      const row = sheet?.rows.find((item) => item[1] === quarter);
      return typeof row?.[4] === 'number' ? row[4] / 1_000_000 : null;
    }),
  };
})();

type ModalName = 'capability' | 'compute' | null;

type ModelInputs = {
  currentCapability: number;
  capabilityThreshold: number;
  capabilityAcceleration: number;
  populationM: number;
  coverageThreshold: number;
  currentComputeM: number;
  computeAcceleration: number;
  workloadM: number;
  servingEfficiency: number;
  personalAiInferenceShare: number;
};

const DEFAULTS: ModelInputs = {
  currentCapability: CAPABILITY_CURVE[0][1],
  capabilityThreshold: 60,
  capabilityAcceleration: 1,
  populationM: 342.8,
  coverageThreshold: 50,
  currentComputeM: 13.524006,
  computeAcceleration: 1,
  workloadM: 16.75,
  servingEfficiency: 1,
  personalAiInferenceShare: 100,
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function baselineCapabilityAt(timestamp: number) {
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
  return points[points.length - 1].score;
}

function capabilityAt(timestamp: number, inputs: ModelInputs) {
  const quarters = Math.max(0, (timestamp - SNAPSHOT) / QUARTER);
  const currentShift = inputs.currentCapability - DEFAULTS.currentCapability;
  const accelerationShift =
    0.5 * CAPABILITY_ACCELERATION_RESPONSE_PP *
    (inputs.capabilityAcceleration - 1) * quarters * quarters;
  return clamp(baselineCapabilityAt(timestamp) + currentShift + accelerationShift, 0, 99);
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
  return logs[lastIndex] + lastVelocity * extra +
    0.5 * BASE_COMPUTE_ACCELERATION * extra * (extra + 1);
}

function computeCapacityAt(timestamp: number, inputs: ModelInputs) {
  const quarters = modelQuarterAt(timestamp);
  const netAcceleration = BASE_COMPUTE_ACCELERATION +
    COMPUTE_ACCELERATION_RESPONSE_LOG2 * (inputs.computeAcceleration - 1);
  const stopQuarter = netAcceleration < 0
    ? Math.max(0, 0.5 - BASE_NEXT_COMPUTE_VELOCITY / netAcceleration)
    : Number.POSITIVE_INFINITY;
  const effectiveQuarters = Math.min(quarters, stopQuarter);
  const accelerationAdjustment = effectiveQuarters <= 1 ? 0 :
    0.5 * COMPUTE_ACCELERATION_RESPONSE_LOG2 * (inputs.computeAcceleration - 1) *
    effectiveQuarters * (effectiveQuarters - 1);
  const currentShift = Math.log2(inputs.currentComputeM / DEFAULTS.currentComputeM);
  return 2 ** (baselineComputeLogAtQuarter(effectiveQuarters) + accelerationAdjustment + currentShift);
}

function supportedUsersAt(timestamp: number, inputs: ModelInputs) {
  return computeCapacityAt(timestamp, inputs) * TOKENS_PER_H100E_DAY_M *
    inputs.servingEfficiency * (inputs.personalAiInferenceShare / 100) / inputs.workloadM;
}

function findCrossing(test: (timestamp: number) => boolean) {
  if (test(SNAPSHOT)) return new Date(SNAPSHOT);
  for (let day = 1; day <= MAX_HORIZON_DAYS; day += 1) {
    const timestamp = SNAPSHOT + day * DAY;
    if (test(timestamp)) return new Date(timestamp);
  }
  return null;
}

function formatDate(date: Date | null) {
  if (!date) return 'Beyond horizon';
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
  }).format(date);
}

function countdown(now: number, target: Date | null) {
  if (!target) return null;
  const targetTime = target.getTime();
  if (targetTime <= now) return { years: 0, months: 0, days: 0, hours: 0 };

  const addYears = (date: Date, years: number) => {
    const result = new Date(date);
    const month = result.getUTCMonth();
    result.setUTCFullYear(result.getUTCFullYear() + years, month, 1);
    const lastDay = new Date(Date.UTC(result.getUTCFullYear(), month + 1, 0)).getUTCDate();
    result.setUTCDate(Math.min(date.getUTCDate(), lastDay));
    return result;
  };
  const addMonths = (date: Date, months: number) => {
    const result = new Date(date);
    const desiredMonth = result.getUTCMonth() + months;
    result.setUTCDate(1);
    result.setUTCMonth(desiredMonth);
    const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
    result.setUTCDate(Math.min(date.getUTCDate(), lastDay));
    return result;
  };

  let cursor = new Date(now);
  let years = target.getUTCFullYear() - cursor.getUTCFullYear();
  if (addYears(cursor, years).getTime() > targetTime) years -= 1;
  cursor = addYears(cursor, years);

  let months = (target.getUTCFullYear() - cursor.getUTCFullYear()) * 12 +
    target.getUTCMonth() - cursor.getUTCMonth();
  if (addMonths(cursor, months).getTime() > targetTime) months -= 1;
  cursor = addMonths(cursor, months);

  const days = Math.floor((targetTime - cursor.getTime()) / DAY);
  cursor = new Date(cursor.getTime() + days * DAY);
  const hours = Math.floor((targetTime - cursor.getTime()) / 3_600_000);
  return { years, months, days, hours };
}

function grade(score: number) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

type ControlFieldProps = {
  label: string;
  note: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix: string;
  decimals?: number;
  onChange: (value: number) => void;
};

function ControlField({ label, note, value, min, max, step, suffix, decimals = 1, onChange }: ControlFieldProps) {
  const change = (raw: string) => {
    const next = Number(raw);
    if (Number.isFinite(next)) onChange(clamp(next, min, max));
  };

  return (
    <label className="control-field">
      <span className="control-heading"><b>{label}</b><small>{note}</small></span>
      <span className="control-inputs">
        <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => change(event.target.value)} />
        <span className="number-wrap">
          <input aria-label={`${label} value`} type="number" min={min} max={max} step={step} value={value.toFixed(decimals)} onChange={(event) => change(event.target.value)} />
          <em>{suffix}</em>
        </span>
      </span>
    </label>
  );
}

function reportContext(sheet: ReportSheet, rowIndex: number, columnIndex: number) {
  const labels: string[] = [];
  const row = sheet.rows[rowIndex] || [];
  const rowLabel = row.find((value) => typeof value === 'string');
  if (typeof rowLabel === 'string') labels.push(rowLabel);
  for (let index = rowIndex; index >= 0 && labels.length < 6; index -= 1) {
    const value = sheet.rows[index]?.[columnIndex];
    if (typeof value === 'string') labels.push(value);
  }
  return labels.join(' ').toLowerCase();
}

function excelDate(serial: number) {
  const timestamp = Date.UTC(1899, 11, 30) + Math.floor(serial) * DAY;
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC',
  }).format(new Date(timestamp));
}

function formattedReportValue(value: ReportCell, sheet: ReportSheet, rowIndex: number, columnIndex: number) {
  if (value === null || value === '') return '';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
      return new Intl.DateTimeFormat('en-CA', {
        year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC',
      }).format(new Date(value));
    }
    return value;
  }

  const context = reportContext(sheet, rowIndex, columnIndex);
  if (value > 30_000 && value < 60_000 && /(date|cutoff|crossing|updated|accessed|as-of)/.test(context)) {
    return excelDate(value);
  }
  if (Math.abs(value) <= 1.1 && /(score|rate|share|coverage|utilization|threshold|percent|minimum)/.test(context)) {
    return `${(value * 100).toFixed(Math.abs(value) < 0.01 ? 2 : 1)}%`;
  }
  if (Math.abs(value) >= 1e12) return value.toExponential(2).replace('e+', 'E+');
  if (Number.isInteger(value)) return value.toLocaleString('en-US');
  if (Math.abs(value) >= 1000) return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
  return value.toLocaleString('en-US', { maximumFractionDigits: 4 });
}

function reportRowClass(row: ReportCell[]) {
  const filled = row.filter((value) => value !== null && value !== '');
  if (filled.length === 1 && typeof filled[0] === 'string' && filled[0].length > 8) return 'report-section-row';
  if (filled.length > 1 && filled.every((value) => typeof value === 'string')) return 'report-header-row';
  return '';
}

type ReportChartProps = {
  kind: 'capability' | 'compute';
  capabilityThreshold: number;
  computeThresholdM: number;
};

const CHART_CATEGORIES = [
  'Direct economic stewardship',
  'Operational execution',
  'Personal stewardship transfer',
  'Economic value & governance',
] as const;

function chartSeriesColorToken(item: ReportChartSeries, kind: ReportChartProps['kind']) {
  if (item.aggregate || kind === 'compute') return '--chart-aggregate';
  const categoryIndex = CHART_CATEGORIES.indexOf(item.category as typeof CHART_CATEGORIES[number]);
  return `--chart-${Math.max(1, categoryIndex + 1)}`;
}

function ReportChart({ kind, capabilityThreshold, computeThresholdM }: ReportChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(() => new Set());
  const [highlightedSeries, setHighlightedSeries] = useState<string | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const series = useMemo(() => kind === 'capability'
    ? [CAPABILITY_AGGREGATE, ...CAPABILITY_BENCHMARK_SERIES]
    : [COMPUTE_SUPPLY_SERIES], [kind]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const draw = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (!width || !height) return;
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      const context = canvas.getContext('2d');
      if (!context) return;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);

      const styles = getComputedStyle(canvas);
      const color = (token: string) => styles.getPropertyValue(token).trim();
      const fontFamily = styles.fontFamily;
      const margin = { top: 28, right: 22, bottom: 34, left: width < 520 ? 45 : 54 };
      const plotWidth = width - margin.left - margin.right;
      const plotHeight = height - margin.top - margin.bottom;
      const xAt = (index: number) => margin.left + index / (REPORT_QUARTERS.length - 1) * plotWidth;
      const allValues = series.flatMap((item) => item.values.filter((value): value is number => value !== null));
      const yMaximum = kind === 'capability'
        ? 100
        : Math.max(20, Math.ceil(Math.max(...allValues, computeThresholdM) / 20) * 20);
      const yAt = (value: number) => margin.top + plotHeight - value / yMaximum * plotHeight;
      const projectionX = (xAt(OBSERVED_END_INDEX) + xAt(OBSERVED_END_INDEX + 1)) / 2;

      context.save();
      context.fillStyle = color('--chart-projection');
      context.globalAlpha = 0.04;
      context.fillRect(projectionX, margin.top, margin.left + plotWidth - projectionX, plotHeight);
      context.restore();

      context.font = `9px ${fontFamily}`;
      context.textBaseline = 'middle';
      for (let tickIndex = 0; tickIndex <= 5; tickIndex += 1) {
        const tickValue = yMaximum / 5 * tickIndex;
        const y = yAt(tickValue);
        context.strokeStyle = color('--chart-grid');
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(margin.left, y);
        context.lineTo(margin.left + plotWidth, y);
        context.stroke();
        context.fillStyle = color('--muted');
        context.textAlign = 'right';
        context.fillText(kind === 'capability' ? `${tickValue.toFixed(0)}%` : tickValue.toFixed(0), margin.left - 8, y);
      }

      const xLabels = width < 520 ? [0, 4, 8, 12, 16, 19] : [0, 4, 8, 12, 16, 19];
      context.textBaseline = 'top';
      xLabels.forEach((index) => {
        context.fillStyle = color('--muted');
        context.textAlign = index === 0 ? 'left' : index === REPORT_QUARTERS.length - 1 ? 'right' : 'center';
        context.fillText(REPORT_QUARTERS[index].replace('20', ''), xAt(index), margin.top + plotHeight + 10);
      });

      context.strokeStyle = color('--chart-frame');
      context.lineWidth = 1;
      context.strokeRect(margin.left, margin.top, plotWidth, plotHeight);
      context.setLineDash([3, 4]);
      context.strokeStyle = color('--chart-projection');
      context.beginPath();
      context.moveTo(projectionX, margin.top);
      context.lineTo(projectionX, margin.top + plotHeight);
      context.stroke();
      context.setLineDash([]);
      context.fillStyle = color('--chart-projection');
      context.textAlign = 'left';
      context.textBaseline = 'bottom';
      context.fillText('PROJECTION →', Math.min(projectionX + 6, margin.left + plotWidth - 72), margin.top - 7);

      if (kind === 'capability') {
        const thresholdY = yAt(capabilityThreshold);
        context.save();
        context.setLineDash([2, 5]);
        context.strokeStyle = color('--chart-threshold');
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(margin.left, thresholdY);
        context.lineTo(margin.left + plotWidth, thresholdY);
        context.stroke();
        context.restore();
        context.fillStyle = color('--chart-threshold');
        context.textAlign = 'right';
        context.textBaseline = 'bottom';
        context.fillText(`GATE ${capabilityThreshold.toFixed(0)}%`, margin.left + plotWidth - 5, thresholdY - 4);
      }

      if (kind === 'compute') {
        const thresholdY = yAt(computeThresholdM);
        context.save();
        context.setLineDash([2, 5]);
        context.strokeStyle = color('--chart-threshold');
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(margin.left, thresholdY);
        context.lineTo(margin.left + plotWidth, thresholdY);
        context.stroke();
        context.restore();
        context.fillStyle = color('--chart-threshold');
        context.textAlign = 'right';
        context.textBaseline = 'bottom';
        context.fillText(`GATE ${computeThresholdM.toFixed(1)}M H100e`, margin.left + plotWidth - 5, thresholdY - 4);
      }

      if (kind === 'compute') {
        const values = COMPUTE_SUPPLY_SERIES.values;
        const firstIndex = values.findIndex((value) => value !== null);
        const lastIndex = values.reduce((last, value, index) => value !== null ? index : last, firstIndex);
        if (firstIndex >= 0 && lastIndex >= firstIndex) {
          context.save();
          const gradient = context.createLinearGradient(0, margin.top, 0, margin.top + plotHeight);
          gradient.addColorStop(0, color('--chart-area-top'));
          gradient.addColorStop(1, color('--chart-area-bottom'));
          context.fillStyle = gradient;
          context.beginPath();
          context.moveTo(xAt(firstIndex), yAt(values[firstIndex] as number));
          for (let index = firstIndex + 1; index <= lastIndex; index += 1) {
            const value = values[index];
            if (value !== null) context.lineTo(xAt(index), yAt(value));
          }
          context.lineTo(xAt(lastIndex), yAt(0));
          context.lineTo(xAt(firstIndex), yAt(0));
          context.closePath();
          context.fill();
          context.restore();
        }
      }

      const drawLine = (item: ReportChartSeries, start: number, end: number, projected: boolean) => {
        if (hiddenSeries.has(item.id)) return;
        const isHighlighted = highlightedSeries === item.id;
        const isDimmed = highlightedSeries !== null && !isHighlighted && !item.aggregate;
        const token = chartSeriesColorToken(item, kind);
        context.save();
        context.strokeStyle = color(token);
        context.globalAlpha = isDimmed ? 0.1 : item.aggregate || kind === 'compute' || isHighlighted ? 1 : 0.38;
        context.lineWidth = item.aggregate || kind === 'compute' ? 3 : isHighlighted ? 2.5 : 1.35;
        context.lineJoin = 'round';
        context.lineCap = 'round';
        context.setLineDash(projected ? [6, 5] : []);
        context.beginPath();
        let drawing = false;
        for (let index = start; index <= end; index += 1) {
          const value = item.values[index];
          if (value === null) {
            drawing = false;
            continue;
          }
          if (!drawing) {
            context.moveTo(xAt(index), yAt(value));
            drawing = true;
          } else {
            context.lineTo(xAt(index), yAt(value));
          }
        }
        context.stroke();
        context.restore();
      };

      const orderedSeries = [...series].sort((a, b) => Number(Boolean(a.aggregate)) - Number(Boolean(b.aggregate)));
      orderedSeries.forEach((item) => drawLine(item, 0, OBSERVED_END_INDEX, false));
      orderedSeries.forEach((item) => drawLine(item, OBSERVED_END_INDEX, REPORT_QUARTERS.length - 1, true));

      if (hoverIndex !== null) {
        const hoverX = xAt(hoverIndex);
        context.save();
        context.strokeStyle = color('--ink');
        context.globalAlpha = 0.42;
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(hoverX, margin.top);
        context.lineTo(hoverX, margin.top + plotHeight);
        context.stroke();
        context.restore();
      }
    };

    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [capabilityThreshold, computeThresholdM, hiddenSeries, highlightedSeries, hoverIndex, kind, series]);

  const updateHover = (clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const bounds = canvas.getBoundingClientRect();
    const left = bounds.width < 520 ? 45 : 54;
    const right = 22;
    const fraction = clamp((clientX - bounds.left - left) / Math.max(1, bounds.width - left - right), 0, 1);
    setHoverIndex(Math.round(fraction * (REPORT_QUARTERS.length - 1)));
  };

  const hoverItems = hoverIndex === null ? [] : series
    .filter((item) => !hiddenSeries.has(item.id) && item.values[hoverIndex] !== null)
    .sort((a, b) => Number(Boolean(b.aggregate)) - Number(Boolean(a.aggregate)) ||
      (b.values[hoverIndex] as number) - (a.values[hoverIndex] as number))
    .slice(0, kind === 'capability' ? 6 : 1);

  const toggleSeries = (id: string) => {
    setHiddenSeries((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const chartTitle = kind === 'capability'
    ? 'Four-year capability trajectory'
    : 'Four-year compute trajectory';
  const chartDescription = kind === 'capability'
    ? `${CAPABILITY_BENCHMARK_SERIES.length} graded benchmarks and the confidence-weighted aggregate, quarterly from 2024-Q1 through 2028-Q4.`
    : `U.S. operational H100-equivalent accelerators in millions—not users—from 2024-Q1 through 2028-Q4. The gate line is ${computeThresholdM.toFixed(1)} million H100-equivalents under the live assumptions.`;

  return (
    <section className={`report-chart report-chart-${kind}`} aria-labelledby={`report-chart-title-${kind}`}>
      <div className="report-chart-head">
        <div>
          <p>Workbook model · observed through 2026-Q3</p>
          <h3 id={`report-chart-title-${kind}`}>{chartTitle}</h3>
          <small className="chart-unit">{kind === 'capability' ? 'Vertical axis · normalized benchmark score' : 'Vertical axis · millions of H100-equivalents, not users'}</small>
        </div>
        <div className="chart-phase-key" aria-label="Line styles">
          <span><i className="solid" />Observed</span>
          <span><i className="projected" />Projected</span>
        </div>
      </div>
      <div className="report-chart-canvas-wrap">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={chartDescription}
          onPointerMove={(event) => updateHover(event.clientX)}
          onPointerLeave={() => setHoverIndex(null)}
          onPointerDown={(event) => updateHover(event.clientX)}
        />
        {hoverIndex !== null && hoverItems.length > 0 && (
          <div className="chart-tooltip" role="tooltip">
            <strong>{REPORT_QUARTERS[hoverIndex]}</strong>
            {hoverItems.map((item) => (
              <span key={item.id}>
                <i style={{ background: `var(${chartSeriesColorToken(item, kind)})` }} />
                <b>{item.name}</b>
                <em>{kind === 'capability'
                  ? `${(item.values[hoverIndex] as number).toFixed(1)}%`
                  : `${(item.values[hoverIndex] as number).toFixed(2)}M H100e`}</em>
              </span>
            ))}
            {kind === 'capability' && hoverItems.length === 6 && <small>Hover a legend label to isolate its line.</small>}
          </div>
        )}
      </div>
      {kind === 'capability' && (
        <div className="report-chart-legend" aria-label="Capability benchmark lines">
          {series.map((item) => {
            const visible = !hiddenSeries.has(item.id);
            return (
              <button
                type="button"
                key={item.id}
                className={item.aggregate ? 'aggregate' : ''}
                aria-pressed={visible}
                onClick={() => toggleSeries(item.id)}
                onMouseEnter={() => setHighlightedSeries(item.id)}
                onMouseLeave={() => setHighlightedSeries(null)}
                onFocus={() => setHighlightedSeries(item.id)}
                onBlur={() => setHighlightedSeries(null)}
              >
                <i style={{ background: `var(${chartSeriesColorToken(item, kind)})` }} />{item.name}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

type WorkbookBrowserProps = {
  workbook: ReportWorkbook;
  sheet: ReportSheet;
  query: string;
  onQuery: (query: string) => void;
  onSheet: (name: string) => void;
  onClose: () => void;
  scenario: { label: string; value: string }[];
  calculationTitle: string;
  calculationSteps: { title: string; explanation: string }[];
  capabilityThreshold: number;
  computeThresholdM: number;
};

function WorkbookBrowser({ workbook, sheet, query, onQuery, onSheet, onClose, scenario, calculationTitle, calculationSteps, capabilityThreshold, computeThresholdM }: WorkbookBrowserProps) {
  const rows = sheet.rows
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => !query || row.some((value) => String(value ?? '').toLowerCase().includes(query.toLowerCase())));
  const totalCells = workbook.sheets.reduce((sum, item) => sum + item.nonEmptyCells, 0);

  return (
    <div className="modal-backdrop report-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="report-browser" role="dialog" aria-modal="true" aria-labelledby="report-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="modal-close report-close" aria-label="Close HTML report" onClick={onClose}>×</button>
        <header className="report-head">
          <div>
            <p className="modal-eyebrow">Complete HTML workbook</p>
            <h2 id="report-title">{workbook.title}</h2>
            <p>Every populated worksheet is available below. The Excel file remains the formula-preserving source of record.</p>
          </div>
          <a className="report-download" href={workbook.download} download>Download .xlsx <span>↓</span></a>
        </header>

        <div className="report-scenario">
          {scenario.map((item) => <span key={item.label}><small>{item.label}</small><strong>{item.value}</strong></span>)}
        </div>

        <ReportChart kind={workbook.id} capabilityThreshold={capabilityThreshold} computeThresholdM={computeThresholdM} />

        <section className="model-explainer" aria-labelledby={`model-explainer-${workbook.id}`}>
          <div>
            <p>Plain-language audit</p>
            <h3 id={`model-explainer-${workbook.id}`}>{calculationTitle}</h3>
          </div>
          <ol>
            {calculationSteps.map((step) => (
              <li key={step.title}><strong>{step.title}</strong><span>{step.explanation}</span></li>
            ))}
          </ol>
        </section>

        <div className="report-shell">
          <nav className="sheet-nav" aria-label="Workbook sheets">
            <p>{workbook.sheets.length} worksheets · {totalCells.toLocaleString('en-US')} populated cells</p>
            {workbook.sheets.map((item, index) => (
              <button key={item.name} className={item.name === sheet.name ? 'active' : ''} onClick={() => onSheet(item.name)}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <b>{item.name}</b>
                <small>{item.sourceRows} × {item.sourceColumns}</small>
              </button>
            ))}
          </nav>

          <section className="sheet-view" aria-labelledby="sheet-title">
            <div className="sheet-toolbar">
              <div>
                <p className="sheet-address">{sheet.address} · {sheet.nonEmptyCells} populated cells</p>
                <h3 id="sheet-title">{sheet.name}</h3>
                <p>{sheet.description}</p>
              </div>
              <label className="report-search">
                <span>Filter rows</span>
                <input type="search" value={query} placeholder="Benchmark, source, quarter…" onChange={(event) => onQuery(event.target.value)} />
              </label>
            </div>

            <div className="report-table-wrap">
              <table className="report-table">
                <tbody>
                  {rows.map(({ row, index }) => (
                    <tr key={`${sheet.name}-${index}`} className={reportRowClass(row)}>
                      {row.map((value, columnIndex) => {
                        const formatted = formattedReportValue(value, sheet, index, columnIndex);
                        const isUrl = typeof value === 'string' && /^https?:\/\//.test(value);
                        return (
                          <td key={columnIndex} className={typeof value === 'number' ? 'numeric' : ''}>
                            {isUrl ? <a href={value as string} target="_blank" rel="noreferrer">{value}</a> : formatted}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length === 0 && <p className="no-results">No rows match “{query}”.</p>}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

export default function Home() {
  const [now, setNow] = useState(SNAPSHOT);
  const [inputs, setInputs] = useState<ModelInputs>(DEFAULTS);
  const [modal, setModal] = useState<ModalName>(null);
  const [tunerOpen, setTunerOpen] = useState(false);
  const [activeSheetName, setActiveSheetName] = useState('Summary');
  const [reportQuery, setReportQuery] = useState('');

  useEffect(() => {
    const sync = window.setTimeout(() => setNow(Date.now()), 0);
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      window.clearTimeout(sync);
      window.clearInterval(tick);
    };
  }, []);

  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setModal(null);
        setTunerOpen(false);
        setReportQuery('');
      }
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, []);

  useEffect(() => {
    const report = new URLSearchParams(window.location.search).get('report');
    if (report === 'capability' || report === 'compute') {
      setActiveSheetName('Summary');
      setReportQuery('');
      setModal(report);
    }
  }, []);

  const projection = useMemo(() => {
    const targetUsersM = inputs.populationM * inputs.coverageThreshold / 100;
    const requiredComputeM = targetUsersM * SUPPLY_GATE_SHARE_OF_TARGET * inputs.workloadM /
      (TOKENS_PER_H100E_DAY_M * inputs.servingEfficiency * (inputs.personalAiInferenceShare / 100));
    const currentSupportedM = supportedUsersAt(SNAPSHOT, inputs);
    const capabilityCrossing = findCrossing((timestamp) =>
      capabilityAt(timestamp, inputs) >= inputs.capabilityThreshold);
    const computeCrossing = findCrossing((timestamp) =>
      computeCapacityAt(timestamp, inputs) >= requiredComputeM);
    const target = capabilityCrossing && computeCrossing
      ? new Date(Math.max(capabilityCrossing.getTime(), computeCrossing.getTime()))
      : null;
    const controllingGate = capabilityCrossing && computeCrossing
      ? capabilityCrossing.getTime() === computeCrossing.getTime()
        ? 'both'
        : capabilityCrossing.getTime() > computeCrossing.getTime() ? 'capability' : 'compute'
      : 'none';
    return {
      targetUsersM,
      requiredComputeM,
      currentSupportedM,
      capabilityCrossing,
      computeCrossing,
      target,
      controllingGate,
      capabilityProgress: clamp(inputs.currentCapability / inputs.capabilityThreshold * 100, 0, 100),
      computeProgress: clamp(currentSupportedM / targetUsersM * 100, 0, 100),
    };
  }, [inputs]);

  const time = countdown(now, projection.target);
  const targetLabel = formatDate(projection.target);
  const capabilityDate = formatDate(projection.capabilityCrossing);
  const computeDate = formatDate(projection.computeCrossing);
  const horizonTimestamp = new Date('2028-12-31T00:00:00Z').getTime();
  const horizonComputeM = computeCapacityAt(horizonTimestamp, inputs);
  const horizonSupportedM = supportedUsersAt(horizonTimestamp, inputs);
  const gateGapDays = projection.capabilityCrossing && projection.computeCrossing
    ? Math.round(Math.abs(projection.capabilityCrossing.getTime() - projection.computeCrossing.getTime()) / DAY)
    : null;
  const controllingGateLabel = projection.controllingGate === 'capability'
    ? 'Model–harness capability'
    : projection.controllingGate === 'compute' ? 'Compute supply'
      : projection.controllingGate === 'both' ? 'Both gates' : 'No joint crossing';
  const gateRule = projection.controllingGate === 'both'
    ? `Both gates clear together on ${targetLabel}.`
    : projection.controllingGate === 'none'
      ? 'At least one gate does not clear inside the 15-year horizon.'
      : `${controllingGateLabel} controls the clock because it clears ${gateGapDays?.toLocaleString('en-US')} days later.`;
  const isDefault = (Object.keys(DEFAULTS) as Array<keyof ModelInputs>)
    .every((key) => Math.abs(inputs[key] - DEFAULTS[key]) < 0.00001);

  const update = <Key extends keyof ModelInputs>(key: Key, value: ModelInputs[Key]) => {
    setInputs((current) => ({ ...current, [key]: value }));
  };

  const openReport = (name: Exclude<ModalName, null>) => {
    setActiveSheetName('Summary');
    setReportQuery('');
    setModal(name);
  };

  const reports = {
    capability: {
      eyebrow: 'Demand proxy / capability',
      title: 'Model–harness report card',
      current: `${inputs.currentCapability.toFixed(1)}%`,
      grade: grade(inputs.currentCapability),
      threshold: `${inputs.capabilityThreshold.toFixed(0)}%`,
      crossing: capabilityDate,
      note: 'The live scenario applies your threshold and acceleration setting to the workbook curve. The workbook preserves the default evidence model.',
      href: 'https://raw.githubusercontent.com/buwilliams/diffuse-personal-ai/main/data/reports/personal-ai-four-year-capability-report-card.xlsx',
      rows: [
        ['Current composite', `${inputs.currentCapability.toFixed(1)}%`],
        ['Passing threshold', `${inputs.capabilityThreshold.toFixed(0)}%`],
        ['Acceleration setting', `${inputs.capabilityAcceleration.toFixed(2)}× · higher increases quarterly gains`],
        ['Projected crossing', capabilityDate],
        ['Evidence confidence', `${CAPABILITY_CONFIDENCE.label} · ${CAPABILITY_CONFIDENCE.weight.toFixed(0)}%`],
        ['Workbook default', '20 Jun 2028'],
      ],
    },
    compute: {
      eyebrow: 'Supply / compute',
      title: 'Compute report card',
      current: `${projection.computeProgress.toFixed(1)}%`,
      grade: grade(projection.computeProgress),
      threshold: `${SUPPLY_THRESHOLD}%`,
      crossing: computeDate,
      note: 'The population share selects the target; the supply gate then clears at 100% of that target. There is no second population-share multiplier.',
      href: 'https://raw.githubusercontent.com/buwilliams/diffuse-personal-ai/main/data/reports/personal-ai-compute-report-card.xlsx',
      rows: [
        ['Supply threshold', `${SUPPLY_THRESHOLD}%`],
        ['Population target', `${inputs.coverageThreshold.toFixed(0)}% of U.S. · ${projection.targetUsersM.toFixed(1)}M users`],
        ['Current U.S. H100e', `${inputs.currentComputeM.toFixed(2)}M`],
        ['Required U.S. H100e', `${projection.requiredComputeM.toFixed(2)}M`],
        ['Supported users', `${projection.currentSupportedM.toFixed(1)}M`],
        ['Personal-AI inference share', `${inputs.personalAiInferenceShare.toFixed(0)}% of modeled inference supply`],
        ['Compute acceleration', `${inputs.computeAcceleration.toFixed(2)}× · higher increases quarterly gains`],
        ['Projected crossing', computeDate],
      ],
    },
  };
  const activeWorkbook = modal ? workbooks[modal] : null;
  const activeSheet = activeWorkbook
    ? activeWorkbook.sheets.find((sheet) => sheet.name === activeSheetName) || activeWorkbook.sheets[0]
    : null;
  const activeScenario = modal === 'capability' ? [
    { label: 'Current score', value: reports.capability.current },
    { label: 'Threshold', value: reports.capability.threshold },
    { label: 'Crossing', value: reports.capability.crossing },
    { label: 'Confidence', value: `${CAPABILITY_CONFIDENCE.label} · ${CAPABILITY_CONFIDENCE.weight.toFixed(0)}%` },
  ] : [
    { label: 'Gate rule', value: '100% of selected target' },
    { label: 'Current compute', value: `${inputs.currentComputeM.toFixed(2)}M H100e` },
    { label: 'Required compute', value: `${projection.requiredComputeM.toFixed(2)}M H100e` },
    { label: 'Supported / target users', value: `${projection.currentSupportedM.toFixed(1)}M / ${projection.targetUsersM.toFixed(1)}M` },
    { label: 'Personal-AI inference share', value: `${inputs.personalAiInferenceShare.toFixed(0)}%` },
    { label: 'Crossing', value: reports.compute.crossing },
  ];
  const activeCalculation = modal === 'capability' ? {
    title: 'How the demand-proxy score and gate are calculated',
    steps: [
      { title: 'Gather real-world benchmarks.', explanation: 'Collect published benchmarks, leaderboards, and evaluations that track model–harness systems doing economically useful work—not model knowledge in isolation.' },
      { title: 'Normalize the benchmarks.', explanation: 'Convert each result to a 0–100% completion score against a fixed pass rate, human result, expert strategy, oracle, or published target.' },
      { title: 'Build four category scores.', explanation: 'Average the graded benchmarks within direct stewardship, operational execution, personal transfer, and economic value/governance.' },
      { title: 'Discount weak evidence.', explanation: `Give each benchmark up to three evidence credits, then confidence-weight the categories. The current evidence base is ${CAPABILITY_CONFIDENCE.label.toLowerCase()} confidence at ${CAPABILITY_CONFIDENCE.weight.toFixed(0)}%.` },
      { title: 'Project the remaining failure gap.', explanation: `Estimate how quickly each benchmark closes its distance to 100%. At 1× the workbook path is unchanged; above 1×, each quarter adds more progress than the baseline path. The current setting is ${inputs.capabilityAcceleration.toFixed(2)}×.` },
      { title: 'Set the capability gate.', explanation: `The major judgment call is the delegation threshold: ${inputs.capabilityThreshold.toFixed(0)}%. The live composite is ${inputs.currentCapability.toFixed(1)}%, producing a ${capabilityDate} crossing.` },
      { title: 'Use the later gate.', explanation: `The headline is not the capability date alone. It is the later of capability and compute. ${gateRule}` },
    ],
  } : {
    title: 'How compute becomes a supported-user score and gate',
    steps: [
      { title: 'Gather compute-supply sources.', explanation: 'Collect U.S. data-center projects, accelerator capacity, expected operational dates, and other evidence needed to reconstruct available inference supply over time.' },
      { title: 'Build the forward U.S. compute path.', explanation: `Sum the dated expected or projected operating states in Epoch's current data-center timeline. At 1× the workbook path is unchanged; above 1×, each quarter adds more compute than that published pipeline. The chart’s ${horizonComputeM.toFixed(2)}M in 2028-Q4 is hardware-equivalent capacity—not users.` },
      { title: 'Allocate inference to personal AI.', explanation: `Multiply H100-equivalents by ${TOKENS_PER_H100E_DAY_M.toFixed(2)}M tokens per H100e per day, the ${inputs.servingEfficiency.toFixed(2)}× serving-efficiency assumption, and the explicit ${inputs.personalAiInferenceShare.toFixed(0)}% personal-AI share. This allocation is a scenario choice, not an observed fact.` },
      { title: 'Set demand per person.', explanation: `Divide total daily tokens by ${inputs.workloadM.toFixed(2)}M compute-equivalent tokens per user per day. This workload assumption is one of the largest date-moving decisions.` },
      { title: 'Select the population target once.', explanation: `${inputs.coverageThreshold.toFixed(0)}% of ${inputs.populationM.toFixed(1)}M Americans equals ${projection.targetUsersM.toFixed(1)}M target users. This is the only population-share multiplication.` },
      { title: 'Require 100% of that target.', explanation: `The supply gate is fixed at ${SUPPLY_THRESHOLD}% of the selected ${projection.targetUsersM.toFixed(1)}M-user target—not ${inputs.coverageThreshold.toFixed(0)}% of it. That requires ${projection.requiredComputeM.toFixed(2)}M H100e.` },
      { title: 'Find the supply crossing.', explanation: `The compute gate passes when projected capacity reaches ${projection.requiredComputeM.toFixed(2)}M H100e, equivalent to ${projection.targetUsersM.toFixed(1)}M users. The crossing is ${computeDate}. At 2028-Q4, ${horizonComputeM.toFixed(2)}M H100e supports about ${horizonSupportedM.toFixed(1)}M users.` },
      { title: 'Use the later gate.', explanation: `Both capability and supply must pass. The headline is MAX(${capabilityDate}, ${computeDate}) = ${targetLabel}. ${gateRule}` },
    ],
  };

  return (
    <main className="site-shell">
      <div className="space-field" aria-hidden="true">
        <span className="orbital orbital-one" />
        <span className="orbital orbital-two" />
        <span className="scanline" />
      </div>

      <header className="masthead">
        <span className="publication-stamp"><b>Personal AI Observatory</b><small>Published · {PUBLICATION_DATE}</small></span>
        <span className="mast-actions">
          <span className="signal"><i /> {isDefault ? 'Default projection' : 'Adjusted scenario'}</span>
          <button className="tune-button" onClick={() => setTunerOpen(true)}>Tune model <b>↗</b></button>
        </span>
      </header>

      <section className="hero" aria-labelledby="countdown-title">
        <p className="kicker" id="countdown-title">Countdown to diffuse Personal AI</p>
        {time ? (
          <div className="countdown" aria-live="polite" aria-label={`${time.years} ${time.years === 1 ? 'year' : 'years'}, ${time.months} ${time.months === 1 ? 'month' : 'months'}, ${time.days} ${time.days === 1 ? 'day' : 'days'}, ${time.hours} ${time.hours === 1 ? 'hour' : 'hours'}`}>
            <span><strong>{time.years}</strong><small>{time.years === 1 ? 'year' : 'years'}</small></span>
            <b>:</b>
            <span><strong>{String(time.months).padStart(2, '0')}</strong><small>{time.months === 1 ? 'month' : 'months'}</small></span>
            <b>:</b>
            <span><strong>{String(time.days).padStart(2, '0')}</strong><small>{time.days === 1 ? 'day' : 'days'}</small></span>
            <b>:</b>
            <span><strong>{String(time.hours).padStart(2, '0')}</strong><small>{time.hours === 1 ? 'hour' : 'hours'}</small></span>
          </div>
        ) : <div className="no-date">No crossing</div>}
        <p className="target-date">{projection.target ? `Projected joint clearance · ${targetLabel} · ${controllingGateLabel} is the later gate` : 'One or more gates do not cross within 15 years'}</p>
      </section>

      <section className="conjecture">
        <p><span>Conjecture.</span> Delegating economically valuable work to personal AI is imminent because compute supply and model–harness systems demand are nearing a practical threshold: performing profitable work well enough, and cheaply enough, that people prefer delegation to doing it themselves. People will delegate work because they value the time it returns: time to pursue internalized wants rather than imposed demands—chosen contribution, relationships, play, and pleasure.</p>
        <p><span>Refutation.</span> Treat the claim as a two-gate forecast. Demand is proxied by evidence that model–harness systems can perform economic work above the selected quality threshold; supply is the U.S. compute required to serve the selected population. The timetable fails if either gate does not clear. The explanation fails if both clear and delegation still does not diffuse. The date is a base-case scenario crossing, not a calibrated probability; instant distribution and universal value-add remain explicit assumptions.</p>
      </section>

      <p className="gate-label"><span>Gates.</span> Both conditions must clear; the later crossing controls the countdown.</p>
      <section className="gates" aria-label="Projection gates">
        <button onClick={() => openReport('capability')} className="gate-card">
          <span className="gate-index">01 / demand proxy{projection.controllingGate === 'capability' ? ' · controls clock' : ''}</span>
          <span className="gate-name">Model–harness</span>
          <span className="gate-meter"><i style={{ width: `${projection.capabilityProgress}%` }} /></span>
          <span className="gate-stats"><b>{inputs.currentCapability.toFixed(1)}%</b><em>of {inputs.capabilityThreshold.toFixed(0)}% · {capabilityDate}</em></span>
          <span className="open-label">Open report ↗</span>
        </button>
        <button onClick={() => openReport('compute')} className="gate-card">
          <span className="gate-index">02 / supply{projection.controllingGate === 'compute' ? ' · controls clock' : ''}</span>
          <span className="gate-name">U.S. compute</span>
          <span className="gate-meter"><i style={{ width: `${projection.computeProgress}%` }} /></span>
          <span className="gate-stats"><b>{projection.computeProgress.toFixed(1)}%</b><em>{projection.currentSupportedM.toFixed(1)}M of {projection.targetUsersM.toFixed(1)}M users · 100% required · {computeDate}</em></span>
          <span className="open-label">Open report ↗</span>
        </button>
      </section>

      <footer>
        <span>Two gates. One date. <button onClick={() => setTunerOpen(true)}>Adjust assumptions</button></span>
        <span><a href="https://epoch.ai/data/ai-data-centers" target="_blank" rel="noreferrer">Epoch AI</a> · <a href="https://www.census.gov/popclock/" target="_blank" rel="noreferrer">U.S. Census</a></span>
      </footer>

      {tunerOpen && (
        <div className="modal-backdrop tuner-backdrop" role="presentation" onMouseDown={() => setTunerOpen(false)}>
          <section className="tuner" role="dialog" aria-modal="true" aria-labelledby="tuner-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" aria-label="Close model controls" onClick={() => setTunerOpen(false)}>×</button>
            <div className="tuner-head">
              <div>
                <p className="modal-eyebrow">Live scenario</p>
                <h2 id="tuner-title">Tune the projection</h2>
                <p>Every change recomputes both gates and the headline clock. Defaults reproduce the report-card scenario.</p>
              </div>
              <button className="reset-button" onClick={() => setInputs(DEFAULTS)} disabled={isDefault}>Reset defaults</button>
            </div>

            <div className="scenario-strip">
              <span><small>Headline date</small><strong>{targetLabel}</strong></span>
              <span><small>Capability gate</small><strong>{capabilityDate}</strong></span>
              <span><small>Compute gate</small><strong>{computeDate}</strong></span>
              <span><small>Controls clock</small><strong>{controllingGateLabel}</strong></span>
            </div>

            <div className="control-groups">
              <fieldset>
                <legend>Model–harness capability</legend>
                <ControlField label="Current score" note="Report-card composite" value={inputs.currentCapability} min={20} max={80} step={0.1} suffix="%" onChange={(value) => update('currentCapability', value)} />
                <ControlField label="Passing threshold" note="First grade above F" value={inputs.capabilityThreshold} min={50} max={90} step={1} suffix="%" decimals={0} onChange={(value) => update('capabilityThreshold', value)} />
                <ControlField label="Capability acceleration" note="1× = report path; higher = faster quarterly gains" value={inputs.capabilityAcceleration} min={0} max={2} step={0.05} suffix="×" decimals={2} onChange={(value) => update('capabilityAcceleration', value)} />
              </fieldset>

              <fieldset>
                <legend>U.S. compute supply</legend>
                <ControlField label="Population" note="Addressable U.S. population" value={inputs.populationM} min={250} max={450} step={0.1} suffix="M" onChange={(value) => update('populationM', value)} />
                <ControlField label="Population target" note="Selected once; supply must serve 100% of this share" value={inputs.coverageThreshold} min={10} max={100} step={1} suffix="%" decimals={0} onChange={(value) => update('coverageThreshold', value)} />
                <ControlField label="Current compute" note="Operational U.S. H100e" value={inputs.currentComputeM} min={5} max={50} step={0.1} suffix="M" onChange={(value) => update('currentComputeM', value)} />
                <ControlField label="Compute acceleration" note="1× = report path; higher = faster quarterly gains" value={inputs.computeAcceleration} min={0} max={2} step={0.05} suffix="×" decimals={2} onChange={(value) => update('computeAcceleration', value)} />
                <ControlField label="Agent workload" note="Compute-equivalent tokens/user/day" value={inputs.workloadM} min={5} max={50} step={0.25} suffix="M" decimals={2} onChange={(value) => update('workloadM', value)} />
                <ControlField label="Serving efficiency" note="Inference hardware / goodput uplift" value={inputs.servingEfficiency} min={0.5} max={10} step={0.1} suffix="×" onChange={(value) => update('servingEfficiency', value)} />
                <ControlField label="Personal-AI inference share" note="Modeled inference supply allocated to the target cohort" value={inputs.personalAiInferenceShare} min={10} max={100} step={5} suffix="%" decimals={0} onChange={(value) => update('personalAiInferenceShare', value)} />
              </fieldset>
            </div>
            <div className="tuner-foot">
              <p>Scenario controls change the live projection only. The linked workbooks remain the auditable default.</p>
              <button onClick={() => setTunerOpen(false)}>Use scenario</button>
            </div>
          </section>
        </div>
      )}

      {activeWorkbook && activeSheet && (
        <WorkbookBrowser
          workbook={activeWorkbook}
          sheet={activeSheet}
          query={reportQuery}
          onQuery={setReportQuery}
          onSheet={(name) => { setActiveSheetName(name); setReportQuery(''); }}
          onClose={() => { setModal(null); setReportQuery(''); }}
          scenario={activeScenario}
          calculationTitle={activeCalculation.title}
          calculationSteps={activeCalculation.steps}
          capabilityThreshold={inputs.capabilityThreshold}
          computeThresholdM={projection.requiredComputeM}
        />
      )}
    </main>
  );
}
