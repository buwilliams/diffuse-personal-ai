'use client';

import { useEffect, useMemo, useState } from 'react';

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
  const remaining = Math.max(0, target.getTime() - now);
  const totalDays = Math.floor(remaining / DAY);
  const years = Math.floor(totalDays / 365.2425);
  const days = Math.floor(totalDays - years * 365.2425);
  return {
    years,
    days,
    hours: Math.floor((remaining % DAY) / 3_600_000),
    minutes: Math.floor((remaining % 3_600_000) / 60_000),
    seconds: Math.floor((remaining % 60_000) / 1_000),
  };
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

export default function Home() {
  const [now, setNow] = useState(SNAPSHOT);
  const [inputs, setInputs] = useState<ModelInputs>(DEFAULTS);
  const [modal, setModal] = useState<ModalName>(null);
  const [tunerOpen, setTunerOpen] = useState(false);

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
  const active = modal ? reports[modal] : null;

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
          <div className="countdown" aria-live="polite" aria-label={`${time.years} years, ${time.days} days, ${time.hours} hours, ${time.minutes} minutes, ${time.seconds} seconds`}>
            <span><strong>{time.years}</strong><small>years</small></span>
            <b>:</b>
            <span><strong>{String(time.days).padStart(3, '0')}</strong><small>days</small></span>
            <b className="minor-separator">:</b>
            <span className="minor"><strong>{String(time.hours).padStart(2, '0')}</strong><small>hours</small></span>
            <b className="minor-separator">:</b>
            <span className="minor"><strong>{String(time.minutes).padStart(2, '0')}</strong><small>min</small></span>
            <b className="minor-separator">:</b>
            <span className="minor"><strong>{String(time.seconds).padStart(2, '0')}</strong><small>sec</small></span>
          </div>
        ) : <div className="no-date">No crossing</div>}
        <p className="target-date">{projection.target ? `Projected gate clearance · ${targetLabel}` : 'One or more gates do not cross within 15 years'}</p>
      </section>

      <section className="conjecture">
        <p><span>Conjecture.</span> Personal AI diffuses when two gates clear: model–harness capability rises above F, and U.S. inference supply can serve the selected share of the country. The later modeled crossing sets the clock.</p>
        <p>Delegation has rocket economics: failure is tolerated when the upside is large and risk can be bounded. Frontier labs can distribute a passing system through products already connected to the internet; once both gates clear, demand should follow capability rather than wait for a separate adoption curve.</p>
      </section>

      <section className="gates" aria-label="Projection gates">
        <button onClick={() => setModal('capability')} className="gate-card">
          <span className="gate-index">01 / demand proxy</span>
          <span className="gate-name">Model–harness</span>
          <span className="gate-meter"><i style={{ width: `${projection.capabilityProgress}%` }} /></span>
          <span className="gate-stats"><b>{inputs.currentCapability.toFixed(1)}%</b><em>of {inputs.capabilityThreshold.toFixed(0)}% · {capabilityDate}</em></span>
          <span className="open-label">Open report ↗</span>
        </button>
        <button onClick={() => setModal('compute')} className="gate-card">
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

      {active && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setModal(null)}>
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" aria-label="Close report" onClick={() => setModal(null)}>×</button>
            <p className="modal-eyebrow">{active.eyebrow}</p>
            <h2 id="modal-title">{active.title}</h2>
            <p className="modal-note">{active.note}</p>
            <div className="modal-score">
              <span><small>Current</small><strong>{active.current}</strong></span>
              <span><small>Letter</small><strong>{active.grade}</strong></span>
              <span><small>Threshold</small><strong>{active.threshold}</strong></span>
              <span><small>Crossing</small><strong>{active.crossing}</strong></span>
            </div>
            <dl className="data-table">
              {active.rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
            </dl>
            <a className="workbook-link" href={active.href}>Open default data workbook <span>↗</span></a>
          </section>
        </div>
      )}
    </main>
  );
}
