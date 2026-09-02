'use client';

import { useEffect, useRef } from 'react';

export function MeaningModal({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';

    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (trigger?.isConnected) trigger.focus();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      id="meaning-dialog"
      className="meaning-dialog"
      aria-labelledby="meaning-title"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <article className="meaning-panel">
        <button className="modal-close meaning-close" aria-label="Close Meaning" onClick={onClose}>×</button>
        <div className="meaning-scroll" tabIndex={0} role="region" aria-label="Meaning argument">
          <header className="meaning-head">
            <p className="modal-eyebrow">Implications of the scenario</p>
            <h2 id="meaning-title">Meaning</h2>
            <p className="meaning-deck">What changes when software becomes something you ask for?</p>
            <p className="meaning-date">Conjecture dated <time dateTime="2026-09-02">2 September 2026</time></p>
          </header>

          <section className="meaning-section" aria-labelledby="meaning-conjectures">
            <h3 id="meaning-conjectures">Conjectures.</h3>
            <p className="meaning-thesis">Ephemeral, bespoke software will rapidly displace centralized software and SaaS: built for the work, revised on demand, and retired when no longer needed.</p>

            <ol className="meaning-claims">
              <li>
                <h4>On-demand business software</h4>
                <p>Within a year—by September 2027—I conjecture that insurance carriers, managing general underwriters (MGUs), and managing general agents (MGAs) will be able to ask an agent to build and operate software for their businesses.</p>
                <p>Why would they choose this?</p>
                <ul className="meaning-reasons">
                  <li><strong>Speed and efficiency.</strong> Launch new programs and improve existing ones faster.</li>
                  <li><strong>Customizability.</strong> Shape software around the business, rather than the business around a vendor’s product.</li>
                  <li><strong>Delegation.</strong> Let agents manage software operations; the agent becomes the interface.</li>
                  <li><strong>Cost.</strong> Spend less building and operating bespoke software than buying comparable third-party platforms, such as Insurity.</li>
                </ul>
              </li>
              <li>
                <h4>A new role: agent managers</h4>
                <p>These companies will want people to manage the agents. This management role collapses what are currently multiple roles into one. These people will need business skills (what and why) and technical skills (architecture, performance, monitoring). They need to be entrepreneurially minded, with a holistic, end-to-end perspective that connects dollars and opportunity to technology.</p>
                <p>These managers could command very high salaries and still be profitable for the business.</p>
              </li>
            </ol>

            <aside className="meaning-maas" aria-labelledby="meaning-maas-title">
              <p className="modal-eyebrow">A new service offering</p>
              <h4 id="meaning-maas-title">MaaS <span>Management as a Service</span></h4>
              <p>Individuals or small teams of 2–5 people, paid to design, direct, and oversee a company’s agents and the software they operate.</p>
            </aside>
          </section>

          <section className="meaning-section meaning-refutations" aria-labelledby="meaning-refutations">
            <h3 id="meaning-refutations">Refutations.</h3>
            <p>What could prevent this scenario—or make its proposed path obsolete?</p>
            <ul className="meaning-risks">
              <li><strong>In-house talent.</strong> Prospects may prefer to develop agent-management talent internally rather than outsource it, limiting demand for MaaS.</li>
              <li><strong>Capability lags.</strong> Progress falls short, or regulation and pause efforts delay deployment.</li>
              <li><strong>AI takeoff.</strong> Rapid acceleration bypasses the transition described here, including the need for human agent managers.</li>
              <li><strong>Loss of control.</strong> Agents cannot be kept within their objectives and acceptable operating risks.</li>
              <li><strong>Compute scarcity.</strong> Chip or power constraints prevent affordable deployment at scale.</li>
              <li><strong>Catastrophe.</strong> A major disruption breaks the conditions needed for this transition.</li>
            </ul>
            <p className="meaning-test"><strong>The near-term test:</strong> by September 2027, can agents build and operate usable insurance-business software at a lower total cost than comparable third-party systems?</p>
          </section>

          <section className="meaning-section" aria-labelledby="meaning-actions">
            <h3 id="meaning-actions">Take Action.</h3>
            <ol className="meaning-actions">
              <li>
                Stop thinking in terms of customizable and centralized software. Start thinking in terms of bespoke on-demand software.
                <p className="meaning-example"><strong>Example: Blitzy.</strong> Its <a href="https://blitzy.com/" target="_blank" rel="noopener noreferrer">enterprise offering pairs a paid platform with forward-deployed engineers (FDEs)</a>. My conjecture: agents will soon do what Blitzy’s software does. The lasting value may be the FDE role—understanding the business, directing agents, and owning delivery—rather than the software license.</p>
              </li>
              <li>Fund and isolate <a href="https://insurity-growth-lab.fly.dev/" target="_blank" rel="noopener noreferrer">Insurity Growth Lab</a> as an independent division of Insurity reporting directly to the CEO.</li>
              <li>Train and mentor MaaS talent.</li>
              <li>Pilot bespoke software for partner carriers.</li>
            </ol>
          </section>

          <p className="meaning-footnote">These are implications proposed from the scenario, not additional outputs of its two-gate calculation.</p>
        </div>
      </article>
    </dialog>
  );
}
