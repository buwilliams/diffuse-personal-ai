# Diffuse Personal AI

A falsifiable conjecture about when personal AI becomes broadly delegable: the later of a model–harness capability threshold and the U.S. compute capacity required to serve the target population.

The live countdown and its adjustable assumptions are at <https://diffuse-personal-ai-countdown.buddywilliams.chatgpt.site/>.

This repository follows an **intent → surfaces** architecture. The argument lives once in `intent/`; the report cards and website render it. Evidence and generated datasets live in `data/`.

```text
intent/                     Authoritative conjecture, model, and capability definitions
  01-conjecture.md          Main argument and forecast framing
  02-model/                 Two-gate model, metrics, benchmark trends, data design
  03-capabilities/          User-relevant capability catalog
  04-surfaces/              Rules each public surface must preserve
  05-operations/            Authoritative refresh and publication procedure

data/
  sources/                  Append-only CSV registries and observations
  reports/                  Current capability and compute workbooks
  research/                 Exploratory source notes and papers
  previews/                 Generated workbook previews (ignored)

surfaces/
  report-cards/             Workbook builders and HTML-data generator
  website/                  Vinext/Next site deployed with ChatGPT Sites

DEPLOY.md                   Pointer to the authoritative publication procedure
```

**Rule: change `intent/` first, update `data/` second, then regenerate or re-verify every affected surface.** A surface that contradicts intent or data is wrong by definition.

## Website

```powershell
cd surfaces/website
pnpm install
pnpm run dev
```

The production build is `pnpm run build`.

## Report cards

The canonical downloadable workbooks are:

- [`data/reports/personal-ai-four-year-capability-report-card.xlsx`](data/reports/personal-ai-four-year-capability-report-card.xlsx)
- [`data/reports/personal-ai-compute-report-card.xlsx`](data/reports/personal-ai-compute-report-card.xlsx)

Build commands are in [`surfaces/report-cards/README.md`](surfaces/report-cards/README.md). The authoritative monthly operating procedure is in [`intent/05-operations/01-monthly-refresh.md`](intent/05-operations/01-monthly-refresh.md).

## Status

Evidence cutoff: **26 August 2026**. The public date is a scenario result, not a calibrated probability forecast. Its inputs, confidence, thresholds, and acceleration controls are visible in the site.
