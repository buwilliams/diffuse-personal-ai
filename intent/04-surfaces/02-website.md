# Website

## Purpose

The website compresses the conjecture into one legible countdown, exposes the most date-sensitive assumptions, and lets readers inspect the complete capability and compute reports without downloading them.

## What must remain true

- The first viewport states the conjecture and shows years, months, days, and hours.
- The gate cards are introduced by a visible `Gates.` label explaining that both conditions must clear and the later crossing controls the countdown.
- The publication date signals evidence freshness.
- Readers can adjust capability threshold and actual failure-gap acceleration, population and coverage, workload, serving efficiency, and actual compute log-capacity acceleration.
- Acceleration controls show their real values and units: failure-gap halvings per quarter² for capability and `log2 H100e` per quarter² for compute. They are not labeled or represented as `1×` multipliers.
- The tuner also translates each initial acceleration into the implied quarterly growth of its progress velocity. The forward model recursively compounds that velocity so the conjectured causal loop—progress increasing future progress—is inspectable rather than hidden in prose.
- Each acceleration control defaults to its own report-card value. Raising it must increase the rate of progress and must never move that gate's crossing later when all other inputs are unchanged.
- Capability crossings after 2028-Q4 continue the report card's benchmark-level equations through the 15-year search horizon and are labeled as extended extrapolations. `No crossing within 15 years` is reserved for a genuine failure to cross under those equations.
- The tuner shows the capability crossing at one percentage point above the selected threshold so readers can see threshold sensitivity directly.
- The capability chart shows benchmark series plus the confidence-weighted aggregate.
- The compute chart shows H100-equivalent capacity and its implied gate.
- Both report modals explain the calculation in a flat numbered list and expose the full workbook tables.
- Workbook downloads resolve to the canonical files in `data/reports/` on the public GitHub repository.
- Source cells render as clickable HTTPS links. Repository documents point to their public GitHub view, while report-to-report references open the corresponding HTML report when possible.
- Public HTML, styles, generated report data, and URLs contain no local filesystem paths such as `C:\...`, `file://...`, or WSL mount paths.
- The interface uses the site-hosted Geist and Geist Mono variable fonts. Their numeral shapes and metrics are part of the visual identity; do not substitute system fallbacks in production.

## Updating and publishing

The authoritative synchronization, reconciliation, and publication procedure is [Monthly evidence refresh and publication](../05-operations/01-monthly-refresh.md). This document defines the website contract; it does not duplicate the operating procedure.
