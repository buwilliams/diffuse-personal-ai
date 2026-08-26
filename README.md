# Diffuse Personal AI

A falsifiable conjecture about when personal AI becomes broadly delegable: the later of a model–harness capability threshold and the U.S. compute capacity required to serve the target population.

The live countdown and its adjustable assumptions are at <https://diffuse-personal-ai-countdown.buddywilliams.chatgpt.site/>.

The repository follows an **intent → data snapshot → shared model → surfaces** architecture. Intent defines the claim, one immutable JSON snapshot contains the evidence and assumptions, one calculation module derives both gates, and the site and workbooks render that result.

```text
intent/                         Normative conjecture, model, schema, and operating procedure
data/
  snapshot-YYYYMMDD/            Immutable normalized JSON snapshot
    database.json               Gate manifest, defaults, and ETL instructions
    gate1-sources/              One normalized JSON file per capability source
    gate2-sources/              One normalized JSON file per compute source
    gate1-consolidated.json     Deterministic model–harness calculation input
    gate2-consolidated.json     Deterministic compute calculation input
model/forecast-model.mjs        Shared capability and compute calculations
scripts/
  lib/snapshots.mjs             Latest-snapshot selection and loading
  consolidate_snapshot.mjs      Rebuilds both gates from source files
  generate_site_snapshot.mjs    Build-time website bundle
  validate_snapshots.mjs        Schema, provenance, and forecast-invariant checks
artifacts/report-cards/         Downloadable capability and compute workbooks
surfaces/
  report-cards/                 Workbook builders reading the latest snapshot
  website/                      Vinext/Next site deployed with ChatGPT Sites
```

The `data/` directory tracks only JSON inside dated snapshots. Each `gateN-sources/` file represents one public source; the two consolidated files are generated from those files and are the only calculation inputs. A refresh creates a new directory and never revises a prior snapshot. Every JSON file has exactly two root fields, `metadata` and `data`. The website build selects the lexicographically latest valid snapshot and bundles its consolidated gates once, so charts, report tables, defaults, controls, and the countdown all use the same values.

## Build and validate

```powershell
& $NodeExe scripts/consolidate_snapshot.mjs
& $NodeExe scripts/validate_snapshots.mjs
& $NodeExe surfaces/report-cards/capability/build_report_card.mjs
& $NodeExe surfaces/report-cards/compute/build_compute_report_card.mjs

cd surfaces/website
pnpm install
pnpm run lint
pnpm run typecheck
pnpm run build
```

The current downloadable workbooks are:

- [`artifacts/report-cards/personal-ai-four-year-capability-report-card.xlsx`](artifacts/report-cards/personal-ai-four-year-capability-report-card.xlsx)
- [`artifacts/report-cards/personal-ai-compute-report-card.xlsx`](artifacts/report-cards/personal-ai-compute-report-card.xlsx)

The authoritative update procedure is [`intent/05-operations/01-monthly-refresh.md`](intent/05-operations/01-monthly-refresh.md). The mathematical contract is [`intent/02-model/06-report-card-calculations.md`](intent/02-model/06-report-card-calculations.md).

## Status

Evidence cutoff: **26 August 2026**. The public date is a scenario result, not a calibrated probability forecast. Its sources, confidence, thresholds, acceleration rates, and serving assumptions are visible on the site.
