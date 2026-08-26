# Website

## Purpose

The site makes one falsifiable forecast legible: the countdown ends when both the capability demand proxy and compute supply gate have crossed. The later gate controls the date.

## Data and calculation contract

- `predev` and `prebuild` deterministically consolidate both gates, then run `scripts/generate_site_snapshot.mjs`.
- The generator selects the newest valid `data/snapshot-YYYYMMDD/` directory and writes one ignored build bundle.
- The loader reads only `gate1-consolidated.json` and `gate2-consolidated.json`; individual source files are consolidated before the build.
- `app/snapshot-model.ts` evaluates that bundle through `model/forecast-model.mjs` once at module load.
- The countdown, controls, charts, report tables, publication stamp, defaults, and source modal all read that same model or snapshot.
- The browser does not parse XLSX files, copy curves by hand, or request every JSON file separately.
- A later snapshot changes the site without editing a date or evidence constant in React code.

## Public interface contract

- The hero shows years, months, days, and hours until the joint crossing.
- The publication date comes from the selected snapshot.
- Conjecture and Refutation remain terse and explicitly distinguish a scenario crossing from a calibrated probability.
- Both gate cards show current state, threshold, crossing, and which gate controls the clock.
- The model tuner exposes the major decisions: capability threshold, H50 acceleration, U.S. population, population target, current compute, compute acceleration, tokens per user/day, serving efficiency, and personal-AI inference allocation.
- Acceleration fields display actual rates with units. A higher positive acceleration cannot push its gate later when other inputs are fixed.
- Population share is applied once. The supply gate then requires 100% of that selected target.
- Each report modal contains its chart, current scenario strip, flat numbered calculation audit, normalized source tables, filtering, and XLSX download.
- A footer link opens a data-sources and provenance modal grouped by gate. It lists every public source, access date, role, normalized record count, and a direct link to that source's repository JSON.
- Source URLs are clickable HTTPS links. No `C:\`, `file://`, WSL, or other local path may appear in public output.
- The site-hosted Geist and Geist Mono web fonts remain the production fonts so numeral metrics are stable across systems.

## Report and download contract

The HTML report tables are generated directly from snapshot data and shared-model results. The workbooks are parallel downloadable views, not an upstream website database. Downloads resolve to:

- `artifacts/report-cards/personal-ai-four-year-capability-report-card.xlsx`
- `artifacts/report-cards/personal-ai-compute-report-card.xlsx`

The build must fail if the latest snapshot cannot be loaded or its manifest and dataset IDs disagree.

## Updating and publishing

Follow [Monthly evidence refresh and publication](../05-operations/01-monthly-refresh.md). This document defines the website surface contract and does not duplicate the operating procedure.
