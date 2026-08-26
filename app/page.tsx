'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { workbooks, type ReportCell, type ReportSheet, type ReportWorkbook } from './report-data';

const DAY = 86_400_000;
const QUARTER = (365.2425 / 4) * DAY;
const SNAPSHOT = new Date('2026-08-26T00:00:00Z').getTime();
const MAX_HORIZON_DAYS = Math.round(365.2425 * 15);
const TOKENS_PER_H100E_DAY_M = 79.79328;
const BASE_COMPUTE_ACCELERATION = -0.0311262;
const BASE_CAPABILITY_ACCELERATION_PP = -0.4421575;
const BASE_NEXT_COMPUTE_VELOCITY = Math.log2(18.127258 / 13.524006);

const CAPABILITY_CURVE = [
  ['2026-08-26', 44.6135738631],
  ['2026-12-31', 47.9175128052],
  ['2027-03-31', 51.644087357],
  ['2027-06-30', 55.0781956749],
  ['2027-09-30', 57.7892787858],
  ['2027-12-31', 59.6528495951],
  ['2028-03-31', 60.825037561],
  ['2028-06-30', 61.5416817656],
  ['2028-09-30', 62.0032352864],
  ['2028-12-31', 62.3376617338],
] as const;

const COMPUTE_CURVE = [
  ['2026-08-26', 13.524006],
  ['2026-12-31', 18.127258],
  ['2027-03-31', 23.778747],
  ['2027-06-30', 30.52642],
  ['2027-09-30', 38.352428],
  ['2027-12-31', 47.156323],
  ['2028-03-31', 56.743625],
  ['2028-06-30', 66.822743],
  ['2028-09-30', 77.012566],
  ['2028-12-31', 86.861828],
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
};

const DEFAULTS: ModelInputs = {
  currentCapability: 44.6136,
  capabilityThreshold: 60,
  capabilityAcceleration: 1,
  populationM: 342.697245,
  coverageThreshold: 50,
  currentComputeM: 13.524006,
  computeAcceleration: 1,
  workloadM: 16.75,
  servingEfficiency: 1,
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
    0.5 * BASE_CAPABILITY_ACCELERATION_PP *
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
  const acceleration = BASE_COMPUTE_ACCELERATION * inputs.computeAcceleration;
  const stopQuarter = acceleration < 0
    ? Math.max(0, 0.5 - BASE_NEXT_COMPUTE_VELOCITY / acceleration)
    : Number.POSITIVE_INFINITY;
  const effectiveQuarters = Math.min(quarters, stopQuarter);
  const accelerationAdjustment = effectiveQuarters <= 1 ? 0 :
    0.5 * BASE_COMPUTE_ACCELERATION * (inputs.computeAcceleration - 1) *
    effectiveQuarters * (effectiveQuarters - 1);
  const currentShift = Math.log2(inputs.currentComputeM / DEFAULTS.currentComputeM);
  return 2 ** (baselineComputeLogAtQuarter(effectiveQuarters) + accelerationAdjustment + currentShift);
}

function supportedUsersAt(timestamp: number, inputs: ModelInputs) {
  return computeCapacityAt(timestamp, inputs) * TOKENS_PER_H100E_DAY_M *
    inputs.servingEfficiency / inputs.workloadM;
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
  for (let index = Math.max(0, rowIndex - 5); index <= rowIndex; index += 1) {
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

function ReportChart({ kind, capabilityThreshold }: ReportChartProps) {
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
      const yMaximum = kind === 'capability' ? 100 : Math.max(20, Math.ceil(Math.max(...allValues) / 20) * 20);
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
  }, [capabilityThreshold, hiddenSeries, highlightedSeries, hoverIndex, kind, series]);

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
    ? `${CAPABILITY_BENCHMARK_SERIES.length} graded benchmarks and the equal-category aggregate, quarterly from 2024-Q1 through 2028-Q4.`
    : 'U.S. operational H100-equivalents in millions, quarterly from 2024-Q1 through 2028-Q4.';

  return (
    <section className={`report-chart report-chart-${kind}`} aria-labelledby={`report-chart-title-${kind}`}>
      <div className="report-chart-head">
        <div>
          <p>Workbook model · observed through 2026-Q3</p>
          <h3 id={`report-chart-title-${kind}`}>{chartTitle}</h3>
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
                  : `${(item.values[hoverIndex] as number).toFixed(2)}M`}</em>
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
  capabilityThreshold: number;
};

function WorkbookBrowser({ workbook, sheet, query, onQuery, onSheet, onClose, scenario, capabilityThreshold }: WorkbookBrowserProps) {
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

        <ReportChart kind={workbook.id} capabilityThreshold={capabilityThreshold} />

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

  const projection = useMemo(() => {
    const targetUsersM = inputs.populationM * inputs.coverageThreshold / 100;
    const currentSupportedM = supportedUsersAt(SNAPSHOT, inputs);
    const capabilityCrossing = findCrossing((timestamp) =>
      capabilityAt(timestamp, inputs) >= inputs.capabilityThreshold);
    const computeCrossing = findCrossing((timestamp) =>
      supportedUsersAt(timestamp, inputs) >= targetUsersM);
    const target = capabilityCrossing && computeCrossing
      ? new Date(Math.max(capabilityCrossing.getTime(), computeCrossing.getTime()))
      : null;
    return {
      targetUsersM,
      currentSupportedM,
      capabilityCrossing,
      computeCrossing,
      target,
      capabilityProgress: clamp(inputs.currentCapability / inputs.capabilityThreshold * 100, 0, 100),
      computeProgress: clamp(currentSupportedM / targetUsersM * 100, 0, 100),
    };
  }, [inputs]);

  const time = countdown(now, projection.target);
  const targetLabel = formatDate(projection.target);
  const capabilityDate = formatDate(projection.capabilityCrossing);
  const computeDate = formatDate(projection.computeCrossing);
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
      href: '/reports/personal-ai-four-year-capability-report-card.xlsx',
      rows: [
        ['Current composite', `${inputs.currentCapability.toFixed(1)}%`],
        ['Passing threshold', `${inputs.capabilityThreshold.toFixed(0)}%`],
        ['Acceleration', `${inputs.capabilityAcceleration.toFixed(2)}× baseline`],
        ['Projected crossing', capabilityDate],
        ['Workbook default', '27 Jan 2028'],
      ],
    },
    compute: {
      eyebrow: 'Supply / compute',
      title: 'Compute report card',
      current: `${projection.computeProgress.toFixed(1)}%`,
      grade: grade(projection.computeProgress),
      threshold: `${projection.targetUsersM.toFixed(1)}M users`,
      crossing: computeDate,
      note: 'The live scenario translates operational H100-equivalents into supported users using your population, workload, serving-efficiency, and acceleration settings.',
      href: '/reports/personal-ai-compute-report-card.xlsx',
      rows: [
        ['Current U.S. H100e', `${inputs.currentComputeM.toFixed(2)}M`],
        ['Supported users', `${projection.currentSupportedM.toFixed(1)}M`],
        ['Target users', `${projection.targetUsersM.toFixed(1)}M`],
        ['Compute acceleration', `${inputs.computeAcceleration.toFixed(2)}× baseline`],
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
    { label: 'Acceleration', value: `${inputs.capabilityAcceleration.toFixed(2)}×` },
  ] : [
    { label: 'Supported users', value: `${projection.currentSupportedM.toFixed(1)}M` },
    { label: 'Target users', value: reports.compute.threshold },
    { label: 'Crossing', value: reports.compute.crossing },
    { label: 'Progress', value: reports.compute.current },
  ];

  return (
    <main className="site-shell">
      <div className="space-field" aria-hidden="true">
        <span className="orbital orbital-one" />
        <span className="orbital orbital-two" />
        <span className="scanline" />
      </div>

      <header className="masthead">
        <span>Personal AI Observatory</span>
        <span className="mast-actions">
          <span className="signal"><i /> {isDefault ? 'Default projection' : 'Adjusted scenario'}</span>
          <button className="tune-button" onClick={() => setTunerOpen(true)}>Tune model <b>↗</b></button>
        </span>
      </header>

      <section className="hero" aria-labelledby="countdown-title">
        <p className="kicker" id="countdown-title">Countdown to diffuse Personal AI</p>
        {time ? (
          <div className="countdown" aria-live="polite" aria-label={`${time.years} years, ${time.months} months, ${time.days} days, ${time.hours} hours`}>
            <span><strong>{time.years}</strong><small>years</small></span>
            <b>:</b>
            <span><strong>{String(time.months).padStart(2, '0')}</strong><small>months</small></span>
            <b>:</b>
            <span><strong>{String(time.days).padStart(2, '0')}</strong><small>days</small></span>
            <b>:</b>
            <span><strong>{String(time.hours).padStart(2, '0')}</strong><small>hours</small></span>
          </div>
        ) : <div className="no-date">No crossing</div>}
        <p className="target-date">{projection.target ? `Projected gate clearance · ${targetLabel}` : 'One or more gates do not cross within 15 years'}</p>
      </section>

      <section className="conjecture">
        <p><span>Conjecture.</span> Delegating economically valuable work to personal AI is imminent because model–harness systems are nearing a practical threshold: performing profitable work well enough, and cheaply enough, that people prefer delegation to doing it themselves. People will delegate work because they value the time it returns: time to pursue internalized wants rather than imposed demands—chosen contribution, relationships, play, and pleasure.</p>
        <p><span>Refutation.</span> Treat the claim as a two-gate forecast. Demand is proxied by evidence that model–harness systems can perform economic work above the selected quality threshold; supply is the U.S. compute required to serve the selected population. The timetable fails if either gate does not clear. The explanation fails if both clear and delegation still does not diffuse. Instant distribution and universal value-add remain explicit assumptions.</p>
      </section>

      <section className="gates" aria-label="Projection gates">
        <button onClick={() => openReport('capability')} className="gate-card">
          <span className="gate-index">01 / demand proxy</span>
          <span className="gate-name">Model–harness</span>
          <span className="gate-meter"><i style={{ width: `${projection.capabilityProgress}%` }} /></span>
          <span className="gate-stats"><b>{inputs.currentCapability.toFixed(1)}%</b><em>of {inputs.capabilityThreshold.toFixed(0)}% · {capabilityDate}</em></span>
          <span className="open-label">Open report ↗</span>
        </button>
        <button onClick={() => openReport('compute')} className="gate-card">
          <span className="gate-index">02 / supply</span>
          <span className="gate-name">U.S. compute</span>
          <span className="gate-meter"><i style={{ width: `${projection.computeProgress}%` }} /></span>
          <span className="gate-stats"><b>{projection.computeProgress.toFixed(1)}%</b><em>of target · {computeDate}</em></span>
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
            </div>

            <div className="control-groups">
              <fieldset>
                <legend>Model–harness capability</legend>
                <ControlField label="Current score" note="Report-card composite" value={inputs.currentCapability} min={20} max={80} step={0.1} suffix="%" onChange={(value) => update('currentCapability', value)} />
                <ControlField label="Passing threshold" note="First grade above F" value={inputs.capabilityThreshold} min={50} max={90} step={1} suffix="%" decimals={0} onChange={(value) => update('capabilityThreshold', value)} />
                <ControlField label="Capability acceleration" note="Multiplier on fitted curvature" value={inputs.capabilityAcceleration} min={0} max={2} step={0.05} suffix="×" decimals={2} onChange={(value) => update('capabilityAcceleration', value)} />
              </fieldset>

              <fieldset>
                <legend>U.S. compute supply</legend>
                <ControlField label="Population" note="Addressable U.S. population" value={inputs.populationM} min={250} max={450} step={0.1} suffix="M" onChange={(value) => update('populationM', value)} />
                <ControlField label="Population served" note="Supply threshold" value={inputs.coverageThreshold} min={10} max={100} step={1} suffix="%" decimals={0} onChange={(value) => update('coverageThreshold', value)} />
                <ControlField label="Current compute" note="Operational U.S. H100e" value={inputs.currentComputeM} min={5} max={50} step={0.1} suffix="M" onChange={(value) => update('currentComputeM', value)} />
                <ControlField label="Compute acceleration" note="1× = −0.031 log₂/q²" value={inputs.computeAcceleration} min={0} max={2} step={0.05} suffix="×" decimals={2} onChange={(value) => update('computeAcceleration', value)} />
                <ControlField label="Agent workload" note="Compute-equivalent tokens/user/day" value={inputs.workloadM} min={5} max={50} step={0.25} suffix="M" decimals={2} onChange={(value) => update('workloadM', value)} />
                <ControlField label="Serving efficiency" note="Inference hardware / goodput uplift" value={inputs.servingEfficiency} min={0.5} max={10} step={0.1} suffix="×" onChange={(value) => update('servingEfficiency', value)} />
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
          capabilityThreshold={inputs.capabilityThreshold}
        />
      )}
    </main>
  );
}
