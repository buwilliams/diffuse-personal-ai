'use client';

import { useEffect, useMemo, useState } from 'react';
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

type WorkbookBrowserProps = {
  workbook: ReportWorkbook;
  sheet: ReportSheet;
  query: string;
  onQuery: (query: string) => void;
  onSheet: (name: string) => void;
  onClose: () => void;
  scenario: { label: string; value: string }[];
};

function WorkbookBrowser({ workbook, sheet, query, onQuery, onSheet, onClose, scenario }: WorkbookBrowserProps) {
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
        <p><span>Conjecture.</span> Within three years, model–harness systems will cross a practical threshold: they will perform profitable work well enough, and cheaply enough, that people prefer delegation to doing it themselves. The dividend is time returned from imposed demands to internalized wants—chosen contribution, relationships, play, and pleasure.</p>
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
        />
      )}
    </main>
  );
}
