# Website

## Purpose

The website compresses the conjecture into one legible countdown, exposes the most date-sensitive assumptions, and lets readers inspect the complete capability and compute reports without downloading them.

## What must remain true

- The first viewport states the conjecture and shows years, months, days, and hours.
- The publication date signals evidence freshness.
- Readers can adjust capability threshold and acceleration, population and coverage, workload, serving efficiency, and compute acceleration.
- Each acceleration control is anchored at `1×`, which preserves the report-card path. Raising it must increase quarter-over-quarter gains and must never move that gate's crossing later when all other inputs are unchanged.
- The capability chart shows benchmark series plus the confidence-weighted aggregate.
- The compute chart shows H100-equivalent capacity and its implied gate.
- Both report modals explain the calculation in a flat numbered list and expose the full workbook tables.
- Workbook downloads resolve to the canonical files in `data/reports/` on the public GitHub repository.
- Source cells render as clickable HTTPS links. Repository documents point to their public GitHub view, while report-to-report references open the corresponding HTML report when possible.
- Public HTML, styles, generated report data, and URLs contain no local filesystem paths such as `C:\...`, `file://...`, or WSL mount paths.
- The interface uses the site-hosted Geist and Geist Mono variable fonts. Their numeral shapes and metrics are part of the visual identity; do not substitute system fallbacks in production.

## Updating and publishing

The authoritative synchronization, reconciliation, and publication procedure is [Monthly evidence refresh and publication](../05-operations/01-monthly-refresh.md). This document defines the website contract; it does not duplicate the operating procedure.
