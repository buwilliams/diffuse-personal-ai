'use client';

import { useEffect, useState } from 'react';

const TARGET = new Date('2028-01-27T00:00:00Z').getTime();
const SNAPSHOT = new Date('2026-08-26T00:00:00Z').getTime();

type ModalName = 'capability' | 'compute' | null;

function countdown(now: number) {
  const remaining = Math.max(0, TARGET - now);
  const totalDays = Math.floor(remaining / 86_400_000);
  const years = Math.floor(totalDays / 365.2425);
  const days = Math.floor(totalDays - years * 365.2425);
  const hours = Math.floor((remaining % 86_400_000) / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1_000);
  return { years, days, hours, minutes, seconds };
}

const reports = {
  capability: {
    eyebrow: 'Demand proxy / capability',
    title: 'Model–harness report card',
    current: '44.6%',
    grade: 'F',
    threshold: '60.0%',
    crossing: '27 Jan 2028',
    note: 'A four-year, quarterly report card across economically useful agent benchmarks. The threshold is the first score above F.',
    href: '/reports/personal-ai-four-year-capability-report-card.xlsx',
    rows: [
      ['Current composite', '44.6%'],
      ['Current letter', 'F'],
      ['Passing threshold', '60.0%'],
      ['Projected crossing', '27 Jan 2028'],
      ['2028-Q4 projection', '62.3%'],
    ],
  },
  compute: {
    eyebrow: 'Supply / compute',
    title: 'Compute report card',
    current: '37.6%',
    grade: 'F',
    threshold: '171.3M users',
    crossing: 'Sep 2027',
    note: 'U.S.-located operational H100-equivalents translated into supported high-autonomy users under an explicit serving envelope.',
    href: '/reports/personal-ai-compute-report-card.xlsx',
    rows: [
      ['Current U.S. H100e', '13.5M'],
      ['Supported users', '64.4M'],
      ['Target users', '171.3M'],
      ['Progress to target', '37.6%'],
      ['Projected crossing', 'Sep 2027'],
    ],
  },
};

export default function Home() {
  const [now, setNow] = useState(SNAPSHOT);
  const [modal, setModal] = useState<ModalName>(null);

  useEffect(() => {
    const sync = window.setTimeout(() => setNow(Date.now()), 0);
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      window.clearTimeout(sync);
      window.clearInterval(tick);
    };
  }, []);

  useEffect(() => {
    const close = (event: KeyboardEvent) => event.key === 'Escape' && setModal(null);
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, []);

  const time = countdown(now);
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
        <span className="signal"><i /> Live projection · 26 Aug 2026</span>
      </header>

      <section className="hero" aria-labelledby="countdown-title">
        <p className="kicker" id="countdown-title">Countdown to diffuse Personal AI</p>
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
        <p className="target-date">Projected gate clearance · 27 January 2028</p>
      </section>

      <section className="conjecture">
        <p><span>Conjecture.</span> Personal AI diffuses when two gates clear: model–harness capability rises above F, and U.S. inference supply can serve half the country. The later projection sets the clock.</p>
        <p>Delegation has rocket economics: failure is tolerated when the upside is large and risk can be bounded. Frontier labs can distribute a passing system through products already connected to the internet; once both gates clear, demand should follow capability rather than wait for a separate adoption curve.</p>
      </section>

      <section className="gates" aria-label="Projection gates">
        <button onClick={() => setModal('capability')} className="gate-card">
          <span className="gate-index">01 / demand proxy</span>
          <span className="gate-name">Model–harness</span>
          <span className="gate-meter"><i style={{ width: '74.4%' }} /></span>
          <span className="gate-stats"><b>44.6%</b><em>of 60% · Jan 2028</em></span>
          <span className="open-label">Open report ↗</span>
        </button>
        <button onClick={() => setModal('compute')} className="gate-card">
          <span className="gate-index">02 / supply</span>
          <span className="gate-name">U.S. compute</span>
          <span className="gate-meter"><i style={{ width: '37.6%' }} /></span>
          <span className="gate-stats"><b>37.6%</b><em>of target · Sep 2027</em></span>
          <span className="open-label">Open report ↗</span>
        </button>
      </section>

      <footer>
        <span>Two gates. One date.</span>
        <span><a href="https://epoch.ai/data/ai-data-centers" target="_blank" rel="noreferrer">Epoch AI</a> · <a href="https://www.census.gov/popclock/" target="_blank" rel="noreferrer">U.S. Census</a></span>
      </footer>

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
            <a className="workbook-link" href={active.href}>Open data workbook <span>↗</span></a>
          </section>
        </div>
      )}
    </main>
  );
}
