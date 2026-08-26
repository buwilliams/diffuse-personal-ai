'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CAPABILITY_GAP_VELOCITY,
  CAPABILITY_H50_ACCELERATION,
  CAPABILITY_H50_VELOCITY,
  CAPABILITY_H80_ACCELERATION,
  CAPABILITY_TRANSFER_COEFFICIENT,
  DEFAULT_CAPABILITY_SCORE,
  capabilityAt,
} from './capability-projection';
import {
  BASE_COMPUTE_ACCELERATION,
  BASE_COMPUTE_VELOCITY,
  DEFAULT_COMPUTE_M,
  computeCapacityAt,
} from './compute-projection';
import { forecastModel, snapshotDatasets, snapshotGates, snapshotManifest } from './snapshot-model';
import { workbooks, type ReportCell, type ReportSheet, type ReportWorkbook } from './snapshot-report-data';

const DAY = 86_400_000;
const SNAPSHOT = new Date(`${forecastModel.snapshotDate}T00:00:00Z`).getTime();
const PUBLICATION_DATE = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
}).format(new Date(`${forecastModel.publicationDate}T00:00:00Z`));
const MAX_HORIZON_DAYS = Math.round(365.2425 * forecastModel.defaults.maximumForecastYears);
const computeInputs = snapshotDatasets['compute-capacity'].data;
const DEFAULT_PERSONAL_AI_SHARE = computeInputs.serving.personalAiInferenceShare;
const TOKENS_PER_H100E_DAY_M = forecastModel.compute.tokensPerH100eDay / DEFAULT_PERSONAL_AI_SHARE / 1_000_000;
const SUPPLY_GATE_SHARE_OF_TARGET = forecastModel.defaults.supplyGateShareOfTarget;
const SUPPLY_THRESHOLD = SUPPLY_GATE_SHARE_OF_TARGET * 100;

const REPORT_QUARTERS = forecastModel.capability.quarters.map((quarter: { label: string }) => quarter.label);
const OBSERVED_END_INDEX = forecastModel.capability.benchmarkRows.reduce(
  (maximum: number, benchmark: { series: Array<{ phase: string }> }) =>
    Math.max(maximum, benchmark.series.findLastIndex((point) => point.phase === 'observed')),
  0,
);

type ReportChartSeries = {
  id: string;
  name: string;
  category: string;
  values: Array<number | null>;
  aggregate?: boolean;
};

type CapabilityChartBenchmark = {
  id: string;
  name: string;
  category: string;
  series: Array<{ score: number | null }>;
};

const CAPABILITY_BENCHMARK_SERIES: ReportChartSeries[] = forecastModel.capability.benchmarkRows.map(
  (benchmark: CapabilityChartBenchmark) => ({
    id: benchmark.id,
    name: benchmark.name,
    category: benchmark.category,
    values: benchmark.series.map((point: { score: number | null }) =>
      point.score === null ? null : point.score * 100),
  }),
);

const CAPABILITY_AGGREGATE: ReportChartSeries = {
  id: 'aggregate',
  name: 'Aggregate',
  category: 'Overall',
  aggregate: true,
  values: forecastModel.capability.overallSeries.map((point: { score: number | null }) =>
    point.score === null ? null : point.score * 100),
};

const CAPABILITY_CONFIDENCE = {
  label: forecastModel.capability.confidence,
  weight: forecastModel.capability.confidenceWeight * 100,
};

const COMPUTE_SUPPLY_SERIES: ReportChartSeries = {
  id: 'us-h100e',
  name: 'U.S. operational compute',
  category: 'Compute supply',
  values: forecastModel.compute.quarterRows.map((quarter: { usH100e: number }) => quarter.usH100e / 1_000_000),
};

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
  currentCapability: DEFAULT_CAPABILITY_SCORE,
  capabilityThreshold: forecastModel.defaults.capabilityThreshold * 100,
  capabilityAcceleration: CAPABILITY_H50_ACCELERATION,
  populationM: computeInputs.population.usResidents / 1_000_000,
  coverageThreshold: computeInputs.population.targetShare * 100,
  currentComputeM: DEFAULT_COMPUTE_M,
  computeAcceleration: BASE_COMPUTE_ACCELERATION,
  workloadM: forecastModel.compute.workloadTokens / 1_000_000,
  servingEfficiency: computeInputs.serving.servingGoodputMultiplier,
  personalAiInferenceShare: DEFAULT_PERSONAL_AI_SHARE * 100,
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function signed(value: number, decimals = 4) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}`;
}

function supportedUsersAt(timestamp: number, inputs: ModelInputs) {
  return computeCapacityAt(timestamp, inputs.currentComputeM, inputs.computeAcceleration) * TOKENS_PER_H100E_DAY_M *
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
  if (!date) return 'No crossing within 15 years';
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
        let lastIndex = firstIndex;
        values.forEach((value, index) => {
          if (value !== null) lastIndex = index;
        });
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
            <p className="modal-eyebrow">Complete HTML data model</p>
            <h2 id="report-title">{workbook.title}</h2>
            <p>Every normalized table feeding this report is available below. The downloadable Excel file preserves a familiar spreadsheet view of the same snapshot.</p>
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

type DatasetDescriptor = {
  id: string;
  gateId: string;
  consolidatedFile: string;
  title: string;
  description: string;
  collections: string[];
  requiredForCountdown: boolean;
  recordCount: number;
  calculation: {
    role: string;
    preparation: string;
    countdownEffect: string;
    pipeline: string[];
    adjustableAssumptions: string[];
  };
};

type SourceFile = {
  id: string;
  file: string;
  publisher: string;
  title: string;
  url: string;
  accessedAt: string;
  roles?: string[];
  notes?: string | null;
  datasetIds: string[];
  recordCount: number;
};

function DataSourcesModal({ onClose, onOpenData }: { onClose: () => void; onOpenData: (selection: string) => void }) {
  const datasets = snapshotManifest.data.datasets as DatasetDescriptor[];
  const gateDescriptors = snapshotManifest.data.gates as Array<{
    id: string;
    label: string;
    consolidatedFile: string;
  }>;
  const gatesById = snapshotGates as unknown as Record<string, {
    metadata: { description: string };
    data: { sourceFiles: SourceFile[] };
  }>;
  const sourceFileCount = gateDescriptors.reduce((sum, gate) => sum + gatesById[gate.id].data.sourceFiles.length, 0);
  const sourceUrlCount = new Set(gateDescriptors.flatMap((gate) =>
    gatesById[gate.id].data.sourceFiles.map((source) => source.url))).size;

  return (
    <div className="modal-backdrop sources-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="sources-modal" role="dialog" aria-modal="true" aria-labelledby="sources-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="modal-close" aria-label="Close data sources" onClick={onClose}>×</button>
        <header className="sources-head">
          <p className="modal-eyebrow">Data provenance</p>
          <h2 id="sources-title">Sources behind the forecast</h2>
          <p>These are the {sourceUrlCount} public pages, papers, datasets, and methodology records used in <b>snapshot-{forecastModel.snapshotId}</b>, represented by {sourceFileCount} gate-specific source files. Open any source directly, or inspect the normalized JSON that entered the forecast.</p>
          <div className="sources-meta">
            <span><small>Snapshot</small><strong>{forecastModel.snapshotDate}</strong></span>
            <span><small>Schema</small><strong>{snapshotManifest.metadata.schemaVersion}</strong></span>
            <span><small>Countdown inputs</small><strong>{datasets.filter((dataset) => dataset.requiredForCountdown).length} datasets</strong></span>
            <a href={`https://github.com/buwilliams/diffuse-personal-ai/blob/main/data/snapshot-${forecastModel.snapshotId}/database.json`} target="_blank" rel="noreferrer">Open manifest ↗</a>
          </div>
        </header>

        <div className="sources-list">
          {gateDescriptors.map((descriptor, index) => {
            const gate = gatesById[descriptor.id];
            const sources = gate.data.sourceFiles;
            return (
              <article className="source-dataset" key={descriptor.id}>
                <div className="source-dataset-head">
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <p>Forecast gate</p>
                    <h3>{descriptor.label}</h3>
                    <small>{descriptor.consolidatedFile} · {sources.length} source files · {datasets.filter((dataset) => dataset.gateId === descriptor.id).length} logical datasets</small>
                  </div>
                </div>
                <p className="source-description">{gate.metadata.description}</p>
                <div className="source-links">
                  {sources.map((source) => (
                    <div className="source-file" key={`${descriptor.id}-${source.id}-${source.url}`}>
                      <a className="source-primary" href={source.url} target="_blank" rel="noreferrer">
                        <span>{source.publisher}</span>
                        <b>{source.title}</b>
                        <small>Accessed {source.accessedAt}{source.roles?.length ? ` · ${source.roles.join(', ')}` : ''}</small>
                        <small>Feeds {source.datasetIds.map((id) => datasets.find((dataset) => dataset.id === id)?.title ?? id).join(', ')} · {source.datasetIds.some((id) => datasets.find((dataset) => dataset.id === id)?.requiredForCountdown) ? 'direct countdown input' : 'context only'}</small>
                      </a>
                      <button className="source-json" onClick={() => onOpenData(`source:${source.file}`)}>View normalized data · {source.recordCount.toLocaleString('en-US')} records ↗</button>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>

        <footer className="sources-foot">
          <p>Snapshots are immutable. To refresh the forecast, create a new dated directory, update each source file through <code>database.json</code>, consolidate both gates, validate, and rebuild. The site and workbooks read only the consolidated files.</p>
          <a href="https://github.com/buwilliams/diffuse-personal-ai/tree/main/data" target="_blank" rel="noreferrer">Browse snapshot JSON ↗</a>
        </footer>
      </section>
    </div>
  );
}

type SourceDataItem = {
  id: string;
  kind: 'dataset' | 'system' | 'source';
  title: string;
  subtitle: string;
  file: string;
  datasetId?: string;
  datasetIds: string[];
  gateId?: string;
  recordCount?: number;
};

function SourceDataModal({ onClose, initialSelection }: { onClose: () => void; initialSelection: string | null }) {
  const datasets = snapshotManifest.data.datasets as DatasetDescriptor[];
  const gateDescriptors = snapshotManifest.data.gates as Array<{
    id: string;
    label: string;
    consolidatedFile: string;
  }>;
  const gatesById = snapshotGates as unknown as Record<string, {
    data: { sourceFiles: SourceFile[] };
  }>;
  const items: SourceDataItem[] = [
    ...datasets.map((dataset) => ({
      id: `dataset:${dataset.id}`,
      kind: 'dataset' as const,
      title: dataset.title,
      subtitle: `${dataset.recordCount.toLocaleString('en-US')} records · ${dataset.requiredForCountdown ? 'direct countdown input' : 'context / coverage'}`,
      file: dataset.consolidatedFile,
      datasetId: dataset.id,
      datasetIds: [dataset.id],
      gateId: dataset.gateId,
      recordCount: dataset.recordCount,
    })),
    {
      id: 'system:database.json',
      kind: 'system' as const,
      title: 'Snapshot manifest and ETL contract',
      subtitle: 'Gates, defaults, logical datasets, lineage, and update procedure',
      file: 'database.json',
      datasetIds: datasets.map((dataset) => dataset.id),
    },
    ...gateDescriptors.map((gate) => ({
      id: `system:${gate.consolidatedFile}`,
      kind: 'system' as const,
      title: `${gate.label} · consolidated`,
      subtitle: 'Deterministic calculation input generated from source files',
      file: gate.consolidatedFile,
      datasetIds: datasets.filter((dataset) => dataset.gateId === gate.id).map((dataset) => dataset.id),
      gateId: gate.id,
    })),
    ...gateDescriptors.flatMap((gate) => gatesById[gate.id].data.sourceFiles.map((source) => ({
      id: `source:${source.file}`,
      kind: 'source' as const,
      title: source.title,
      subtitle: `${source.publisher} · ${source.recordCount.toLocaleString('en-US')} normalized records`,
      file: source.file,
      datasetIds: source.datasetIds,
      gateId: gate.id,
      recordCount: source.recordCount,
    }))),
  ];
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(initialSelection ?? `dataset:${datasets[0].id}`);
  const [rawData, setRawData] = useState('');
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [copyState, setCopyState] = useState('Copy JSON');
  const selected = items.find((item) => item.id === selectedId) ?? items[0];
  const selectedDatasets = selected.datasetIds
    .map((id) => datasets.find((dataset) => dataset.id === id))
    .filter((dataset): dataset is DatasetDescriptor => Boolean(dataset));
  const rawUrl = `/data/snapshot-${forecastModel.snapshotId}/${selected.file}`;
  const groups = [
    { label: 'Logical datasets', items: items.filter((item) => item.kind === 'dataset') },
    { label: 'System files', items: items.filter((item) => item.kind === 'system') },
    { label: 'Source files', items: items.filter((item) => item.kind === 'source') },
  ].map((group) => ({
    ...group,
    items: group.items.filter((item) => !query || `${item.title} ${item.subtitle} ${item.file} ${item.datasetIds.join(' ')}`.toLowerCase().includes(query.toLowerCase())),
  }));

  useEffect(() => {
    const controller = new AbortController();
    fetch(rawUrl, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.text();
      })
      .then((text) => {
        if (selected.datasetId) {
          const parsed = JSON.parse(text);
          const dataset = parsed?.data?.datasets?.[selected.datasetId];
          if (!dataset) throw new Error(`Missing dataset ${selected.datasetId}`);
          setRawData(`${JSON.stringify(dataset, null, 2)}\n`);
        } else {
          setRawData(text);
        }
        setLoadState('ready');
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setRawData('This JSON file could not be loaded.');
          setLoadState('error');
        }
      });
    return () => controller.abort();
  }, [rawUrl, selected.datasetId]);

  const copyJson = async () => {
    if (loadState !== 'ready') return;
    try {
      await navigator.clipboard.writeText(rawData);
      setCopyState('Copied');
    } catch {
      setCopyState('Copy failed');
    }
    window.setTimeout(() => setCopyState('Copy JSON'), 1400);
  };

  const selectItem = (id: string) => {
    setLoadState('loading');
    setCopyState('Copy JSON');
    setSelectedId(id);
  };

  return (
    <div className="modal-backdrop sources-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="source-data-modal" role="dialog" aria-modal="true" aria-labelledby="source-data-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="modal-close" aria-label="Close source data" onClick={onClose}>×</button>
        <header className="sources-head data-head">
          <p className="modal-eyebrow">Open data</p>
          <h2 id="source-data-title">Source data and calculation lineage</h2>
          <p>Select a logical dataset, generated gate file, or source-specific JSON file. You can inspect and copy the exact data, then see how it was prepared and whether it changes the countdown.</p>
        </header>
        <div className="source-data-browser">
          <aside className="data-catalog">
            <label className="report-search data-search">
              <span>Find data</span>
              <input type="search" value={query} placeholder="Dataset, publisher, file…" onChange={(event) => setQuery(event.target.value)} />
            </label>
            {groups.map((group) => group.items.length > 0 && (
              <section key={group.label}>
                <h3>{group.label}<span>{group.items.length}</span></h3>
                {group.items.map((item) => (
                  <button key={item.id} className={item.id === selected.id ? 'active' : ''} onClick={() => selectItem(item.id)}>
                    <b>{item.title}</b><small>{item.subtitle}</small>
                  </button>
                ))}
              </section>
            ))}
          </aside>
          <section className="data-detail">
            <header className="data-detail-head">
              <p>{selected.kind === 'dataset' ? 'Logical dataset' : selected.kind === 'source' ? 'Source-normalized file' : 'System file'}</p>
              <h3>{selected.title}</h3>
              <code>{selected.datasetId ? `${selected.file} → data.datasets.${selected.datasetId}` : selected.file}</code>
            </header>

            <section className="data-lineage" aria-labelledby="lineage-title">
              <p className="modal-eyebrow">Meaning for the countdown</p>
              <h4 id="lineage-title">How this data is used</h4>
              {selectedDatasets.map((dataset) => (
                <article key={dataset.id}>
                  <div><span>{dataset.calculation.role}</span><h5>{dataset.title}</h5></div>
                  <p><b>Preparation.</b> {dataset.calculation.preparation}</p>
                  <p><b>Countdown effect.</b> {dataset.calculation.countdownEffect}</p>
                  <ol aria-label={`${dataset.title} calculation pipeline`}>
                    {dataset.calculation.pipeline.map((step) => <li key={step}>{step}</li>)}
                  </ol>
                  <div className="assumption-tags">
                    <b>Adjustable assumptions</b>
                    {dataset.calculation.adjustableAssumptions.length
                      ? dataset.calculation.adjustableAssumptions.map((assumption) => <span key={assumption}>{assumption}</span>)
                      : <span>None · evidence only</span>}
                  </div>
                </article>
              ))}
            </section>

            <section className="json-viewer">
              <div className="json-toolbar">
                <div><p>Snapshot JSON</p><small>{selected.datasetId ? 'Selected logical dataset extracted from the consolidated gate' : 'Complete site-hosted file'}</small></div>
                <span><button onClick={copyJson} disabled={loadState !== 'ready'}>{copyState}</button><a href={rawUrl} target="_blank" rel="noreferrer">{selected.datasetId ? 'Open parent file' : 'Open raw'} ↗</a></span>
              </div>
              <pre aria-live="polite">{loadState === 'loading' ? 'Loading JSON…' : rawData}</pre>
            </section>
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
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [sourceDataOpen, setSourceDataOpen] = useState(false);
  const [sourceDataSelection, setSourceDataSelection] = useState<string | null>(null);
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
        setSourcesOpen(false);
        setReportQuery('');
      }
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, []);

  useEffect(() => {
    const syncReport = window.setTimeout(() => {
      const report = new URLSearchParams(window.location.search).get('report');
      if (report === 'capability' || report === 'compute') {
        setActiveSheetName('Summary');
        setReportQuery('');
        setModal(report);
      }
    }, 0);
    return () => window.clearTimeout(syncReport);
  }, []);

  const projection = useMemo(() => {
    const targetUsersM = inputs.populationM * inputs.coverageThreshold / 100;
    const requiredComputeM = targetUsersM * SUPPLY_GATE_SHARE_OF_TARGET * inputs.workloadM /
      (TOKENS_PER_H100E_DAY_M * inputs.servingEfficiency * (inputs.personalAiInferenceShare / 100));
    const currentSupportedM = supportedUsersAt(SNAPSHOT, inputs);
    const capabilityCrossing = findCrossing((timestamp) =>
      capabilityAt(timestamp, inputs.currentCapability, inputs.capabilityAcceleration) >= inputs.capabilityThreshold);
    const nextCapabilityThreshold = Math.min(99, inputs.capabilityThreshold + 1);
    const nextCapabilityCrossing = findCrossing((timestamp) =>
      capabilityAt(timestamp, inputs.currentCapability, inputs.capabilityAcceleration) >= nextCapabilityThreshold);
    const computeCrossing = findCrossing((timestamp) =>
      computeCapacityAt(timestamp, inputs.currentComputeM, inputs.computeAcceleration) >= requiredComputeM);
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
      nextCapabilityThreshold,
      nextCapabilityCrossing,
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
  const nextCapabilityDate = formatDate(projection.nextCapabilityCrossing);
  const computeDate = formatDate(projection.computeCrossing);
  const horizonTimestamp = forecastModel.capability.reportEnd;
  const horizonComputeM = computeCapacityAt(
    horizonTimestamp,
    inputs.currentComputeM,
    inputs.computeAcceleration,
  );
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
  const capabilityRelativeAcceleration = CAPABILITY_H50_VELOCITY > 0
    ? inputs.capabilityAcceleration / CAPABILITY_H50_VELOCITY
    : 0;
  const capabilityFeedbackRate = Math.expm1(capabilityRelativeAcceleration) * 100;
  const capabilityEconomicAcceleration = CAPABILITY_GAP_VELOCITY * capabilityRelativeAcceleration;
  const computeFeedbackRate = Math.expm1(
    inputs.computeAcceleration / BASE_COMPUTE_VELOCITY,
  ) * 100;

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
      current: `${inputs.currentCapability.toFixed(1)}%`,
      grade: grade(inputs.currentCapability),
      threshold: `${inputs.capabilityThreshold.toFixed(0)}%`,
      crossing: capabilityDate,
    },
    compute: {
      current: `${projection.computeProgress.toFixed(1)}%`,
      grade: grade(projection.computeProgress),
      threshold: `${SUPPLY_THRESHOLD}%`,
      crossing: computeDate,
    },
  };
  const activeWorkbook = modal ? workbooks[modal] : null;
  const activeSheet = activeWorkbook
    ? activeWorkbook.sheets.find((sheet) => sheet.name === activeSheetName) || activeWorkbook.sheets[0]
    : null;
  const activeScenario = modal === 'capability' ? [
    { label: 'Current score', value: reports.capability.current },
    { label: 'Threshold', value: reports.capability.threshold },
    { label: 'H50 acceleration', value: `${signed(inputs.capabilityAcceleration)} doublings/q²` },
    { label: 'Crossing', value: reports.capability.crossing },
  ] : [
    { label: 'Gate rule', value: '100% of selected target' },
    { label: 'Required compute', value: `${projection.requiredComputeM.toFixed(2)}M H100e` },
    { label: 'Log acceleration', value: `${signed(inputs.computeAcceleration)} log₂/q²` },
    { label: 'Crossing', value: reports.compute.crossing },
  ];
  const activeCalculation = modal === 'capability' ? {
    title: 'How the demand-proxy score and gate are calculated',
    steps: [
      { title: 'Gather real-world benchmarks.', explanation: 'Collect published benchmarks, leaderboards, and evaluations that track model–harness systems doing economically useful work—not model knowledge in isolation.' },
      { title: 'Store each source separately.', explanation: 'Normalize every public source into its own dated JSON file, preserving its URL, access date, original meaning, and the logical datasets it feeds.' },
      { title: 'Consolidate Gate 1 deterministically.', explanation: 'Combine source fragments into the capability, METR, adoption, research, and user-capability datasets. Only the consolidated Gate 1 file enters the shared model; the footer exposes every input and join.' },
      { title: 'Normalize the benchmarks.', explanation: 'Convert each result to a 0–100% completion score against a fixed pass rate, human result, expert strategy, oracle, or published target.' },
      { title: 'Build four category scores.', explanation: 'Average the graded benchmarks within direct stewardship, operational execution, personal transfer, and economic value/governance.' },
      { title: 'Discount weak evidence.', explanation: `Give each benchmark up to three evidence credits, then confidence-weight the categories. The current evidence base is ${CAPABILITY_CONFIDENCE.label.toLowerCase()} confidence at ${CAPABILITY_CONFIDENCE.weight.toFixed(0)}%.` },
      { title: 'Measure capability acceleration with METR.', explanation: `Use H50 task horizon as the primary velocity signal and H80 as the reliability guardrail. The default H50 acceleration is ${signed(CAPABILITY_H50_ACCELERATION)} task-horizon doublings per quarter²; the H80 check is ${signed(CAPABILITY_H80_ACCELERATION)}. Both come from the same recent five-release window and remain low-confidence.` },
      { title: 'Transfer acceleration to economic work.', explanation: `Keep the observed economic failure-gap velocity at ${CAPABILITY_GAP_VELOCITY.toFixed(4)} halvings per quarter. The transfer coefficient is ${CAPABILITY_TRANSFER_COEFFICIENT.toFixed(3)}, so the current scenario starts at ${signed(capabilityEconomicAcceleration)} economic gap halvings per quarter² and implies ${signed(capabilityFeedbackRate, 1)}% quarterly growth in the progress rate.` },
      { title: 'Project the remaining failure gap.', explanation: 'Apply that recursively increasing shared velocity to each benchmark’s current failure-gap depth, back-transform to a bounded 0–100% score, rebuild the four categories, and confidence weight them.' },
      { title: 'Continue the same method when needed.', explanation: `The visible report ends at 2028-Q4, but the countdown evaluates the benchmark-level equations for the full 15-year search horizon. A crossing after the report window is explicitly marked as an extended extrapolation. At ${projection.nextCapabilityThreshold.toFixed(0)}%, the current scenario crosses on ${nextCapabilityDate}.` },
      { title: 'Set the capability gate.', explanation: `The major judgment call is the delegation threshold: ${inputs.capabilityThreshold.toFixed(0)}%. The live composite is ${inputs.currentCapability.toFixed(1)}%, producing a ${capabilityDate} crossing.` },
      { title: 'Use the later gate.', explanation: `The headline is not the capability date alone. It is the later of capability and compute. ${gateRule}` },
    ],
  } : {
    title: 'How compute becomes a supported-user score and gate',
    steps: [
      { title: 'Gather compute-supply sources.', explanation: 'Collect U.S. data-center projects, accelerator capacity, expected operational dates, and other evidence needed to reconstruct available inference supply over time.' },
      { title: 'Store each source separately.', explanation: 'Keep the compute timeline, population value, and forecast-authored serving assumptions in separate source JSON files with explicit provenance and roles.' },
      { title: 'Consolidate Gate 2 deterministically.', explanation: 'Merge the source fragments into one compute-capacity dataset. Only the generated Gate 2 file enters the shared model; the footer exposes every source record and transformation.' },
      { title: 'Build the forward U.S. compute path.', explanation: `Sum the dated expected or projected operating states in Epoch's current data-center timeline. Mean log growth is ${BASE_COMPUTE_VELOCITY.toFixed(4)} per quarter and the live initial acceleration is ${signed(inputs.computeAcceleration)} log₂ H100e per quarter², implying ${signed(computeFeedbackRate, 1)}% quarterly growth in the buildout rate. Positive feedback produces super-exponential capacity growth in ordinary units. The chart’s ${horizonComputeM.toFixed(2)}M in 2028-Q4 is hardware-equivalent capacity—not users.` },
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
        <p><span>Conjecture.</span> Delegating economically valuable work to personal AI is imminent because compute supply and model–harness systems demand are nearing a practical threshold: performing profitable work well enough, and cheaply enough, that people prefer delegation to doing it themselves. People will delegate work because they value the time it returns: time to pursue intrinsic desires rather than extrinsic demands—chosen contribution, relationships, play, and pleasure.</p>
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
        <span><button onClick={() => setSourcesOpen(true)}>Sources</button> · <button onClick={() => { setSourceDataSelection(null); setSourceDataOpen(true); }}>Source data</button> · Snapshot {forecastModel.snapshotId}</span>
      </footer>

      {sourcesOpen && (
        <DataSourcesModal
          onClose={() => setSourcesOpen(false)}
          onOpenData={(selection) => {
            setSourcesOpen(false);
            setSourceDataSelection(selection);
            setSourceDataOpen(true);
          }}
        />
      )}
      {sourceDataOpen && <SourceDataModal initialSelection={sourceDataSelection} onClose={() => setSourceDataOpen(false)} />}

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
            <p className="sensitivity-note">
              Acceleration is an editable initial rate, not a multiplier. Capability uses METR H50 task-horizon acceleration and an H80 reliability check; the current setting implies {signed(capabilityFeedbackRate, 1)}% quarterly growth in the transferred economic progress rate. Compute implies {signed(computeFeedbackRate, 1)}%. At a {projection.nextCapabilityThreshold.toFixed(0)}% capability threshold, this scenario crosses on {nextCapabilityDate}.
            </p>

            <div className="control-groups">
              <fieldset>
                <legend>Model–harness capability</legend>
                <ControlField label="Current score" note="Report-card composite" value={inputs.currentCapability} min={20} max={80} step={0.1} suffix="%" onChange={(value) => update('currentCapability', value)} />
                <ControlField label="Passing threshold" note="Practical delegation-quality gate" value={inputs.capabilityThreshold} min={50} max={90} step={1} suffix="%" decimals={0} onChange={(value) => update('capabilityThreshold', value)} />
                <ControlField label="METR H50 acceleration" note={`Task-horizon doublings/qtr² · ${signed(capabilityFeedbackRate, 1)}% transferred progress-rate growth/qtr`} value={inputs.capabilityAcceleration} min={-0.2} max={0.8} step={0.01} suffix="doublings/q²" decimals={3} onChange={(value) => update('capabilityAcceleration', value)} />
              </fieldset>

              <fieldset>
                <legend>U.S. compute supply</legend>
                <ControlField label="Population" note="Addressable U.S. population" value={inputs.populationM} min={250} max={450} step={0.1} suffix="M" onChange={(value) => update('populationM', value)} />
                <ControlField label="Population target" note="Selected once; supply must serve 100% of this share" value={inputs.coverageThreshold} min={10} max={100} step={1} suffix="%" decimals={0} onChange={(value) => update('coverageThreshold', value)} />
                <ControlField label="Current compute" note="Operational U.S. H100e" value={inputs.currentComputeM} min={5} max={50} step={0.1} suffix="M" onChange={(value) => update('currentComputeM', value)} />
                <ControlField label="Compute log acceleration" note={`Initial log₂ H100e/qtr² · ${signed(computeFeedbackRate, 1)}% buildout-rate growth/qtr`} value={inputs.computeAcceleration} min={-0.05} max={0.15} step={0.001} suffix="log₂/q²" decimals={4} onChange={(value) => update('computeAcceleration', value)} />
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
