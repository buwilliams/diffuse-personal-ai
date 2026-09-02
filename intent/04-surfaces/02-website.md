# Website

## Purpose

The site makes one falsifiable forecast legible: the countdown ends when both the capability demand proxy and compute supply gate have crossed. The later gate controls the date.

## Data and calculation contract

- `predev` and `prebuild` deterministically consolidate both gates, then run `scripts/generate_site_snapshot.mjs`.
- The generator selects the newest valid `data/snapshot-YYYYMMDD/` directory, writes one ignored model bundle, and copies that snapshot to an ignored public `/data/` path for read-only inspection.
- The loader reads only `gate1-consolidated.json` and `gate2-consolidated.json`; individual source files are consolidated before the build.
- `app/snapshot-model.ts` evaluates that bundle through `model/forecast-model.mjs` once at module load.
- The countdown, controls, charts, report tables, publication stamp, defaults, and source modal all read that same model or snapshot.
- The browser does not parse XLSX files, copy curves by hand, or request every JSON file separately.
- A later snapshot changes the site without editing a date or evidence constant in React code.

## Public interface contract

- The hero shows years, months, days, and hours until the joint crossing.
- The publication date comes from the selected snapshot.
- **Meaning** sits beside **Tune model** and opens the implications argument: on-demand insurance-business software, agent managers, Management as a Service, and possible refutations. Its single content source is `app/meaning-modal.tsx`; it is editorial conjecture, not snapshot evidence or an additional calculation gate. The argument is dated independently of the evidence snapshot, and its September 2027 test date stays fixed until deliberately revised.
- The Meaning modal uses a native modal dialog with keyboard focus containment, Escape and backdrop dismissal, focus restoration, and one full-height reading scroll surface.
- Conjecture and Refutation remain terse and explicitly distinguish a scenario crossing from a calibrated probability.
- Both gate cards show current state, threshold, crossing, and which gate controls the clock.
- The model tuner exposes the major decisions: capability threshold, H50 acceleration, U.S. population, population target, current IT power, IT-power acceleration, current inference productivity, productivity acceleration, tokens per user/day, fleet inference allocation, and Personal-AI inference allocation.
- Acceleration fields display actual rates with units. A higher positive acceleration cannot push its gate later when other inputs are fixed.
- Population share is applied once. The supply gate then requires 100% of that selected target.
- Each report modal is a JSON-native Gate Report containing its chart, current scenario strip, flat numbered calculation audit, logical-dataset catalog, normalized source-file table, readable data views, filtering, and direct lineage links into Source data.
- The consolidated gate JSON is the primary download and audit record. XLSX remains a secondary convenience export.
- The full report modal is the vertical reading surface: headers, assumptions, charts, calculation audit, data-view navigation, and tables scroll together. Data tables use their own overflow only for wide horizontal content, never as a short nested vertical viewport.
- The footer has separate **Sources** and **Source data** controls.
- **Sources** opens a provenance modal grouped by gate. It lists every public source, access date, role, affected logical datasets, whether it directly affects the countdown, and a direct link to the original source.
- **Source data** opens a searchable JSON catalog containing the six logical datasets, manifest, two consolidated gate files, and every source-normalized file, including the Epoch site registry and dated timeline. Selecting an item shows its preparation, transformation pipeline, countdown effect, adjustable assumptions, site-hosted JSON, copy action, and raw-file link.
- Source URLs are clickable HTTPS links. No `C:\`, `file://`, WSL, or other local path may appear in public output.
- The site-hosted Geist and Geist Mono web fonts remain the production fonts so numeral metrics are stable across systems.

## Report and download contract

The HTML Gate Reports are generated directly from snapshot data and shared-model results. Each report names the logical JSON datasets behind every readable view and exposes the complete source-file index for its gate. The consolidated JSON files are the source-of-truth downloads. Workbooks are parallel convenience exports, not an upstream website database. Spreadsheet exports resolve to:

- `artifacts/report-cards/personal-ai-four-year-capability-report-card.xlsx`
- `artifacts/report-cards/personal-ai-compute-report-card.xlsx`

The build must fail if the latest snapshot cannot be loaded, its manifest and dataset IDs disagree, or a logical dataset lacks calculation-lineage metadata.

## Updating and publishing

Follow [Monthly evidence refresh and publication](../05-operations/01-monthly-refresh.md). This document defines the website surface contract and does not duplicate the operating procedure.
