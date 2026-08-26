# Monthly evidence refresh and publication

This is the authoritative operating procedure for updating the Diffuse Personal AI forecast. It governs evidence gathering, report generation, site synchronization, validation, and publication.

**Current publication:** 26 August 2026

**Current evidence cutoff:** 26 August 2026

**Published site:** <https://diffuse-personal-ai-countdown.buddywilliams.chatgpt.site/>

## Authority and implementation map

The repository separates meaning, evidence, implementation, and output:

| Layer | Path | Authority |
|---|---|---|
| Model meaning and rules | `intent/` | **Normative source of truth** |
| Evidence ledger | `data/sources/*.csv` | **Canonical evidence record** |
| Capability implementation | `surfaces/report-cards/capability/build_report_card.mjs` | Executable implementation of intent; its embedded arrays remain a tracked migration debt |
| Compute implementation | `surfaces/report-cards/compute/build_compute_report_card.mjs` | Executable implementation of intent; its embedded arrays remain a tracked migration debt |
| HTML-data generator | `surfaces/report-cards/shared/generate_report_data.mjs` | Generated-surface transformation |
| Live countdown and controls | `surfaces/website/app/page.tsx` | Website implementation of the model and current scenario |
| Generated HTML report data | `surfaces/website/app/report-data.ts` | Generated artifact; never edit by hand |
| Generated workbooks | `data/reports/*.xlsx` | Generated artifacts and public downloads; never edit by hand |
| Workbook previews and inspections | `data/previews/`, `data/reports/*.inspect.ndjson` | Generated verification artifacts |
| Exploratory notes | `data/research/` | Non-canonical research material |
| Legacy builder | `surfaces/report-cards/legacy/` | Historical implementation; never use for the live site |

The repository root owns Git history. The deployable Sites project is `surfaces/website/`, whose existing project identity must be reused.

The mathematical contract is [report-card calculations](../02-model/06-report-card-calculations.md). The normalized evidence schema is [data structure](../02-model/05-data-structure.md). The public surfaces must also satisfy the [website](../04-surfaces/02-website.md) and [report-card](../04-surfaces/03-report-cards.md) contracts.

## Standard monthly refresh

Use one evidence cutoff for the whole release. Record it before gathering data and apply it to both builders and the site publication date.

### 1. Gather evidence

Start with sources, not a desired date.

For capability, gather benchmarks, leaderboards, and evaluations of model–harness systems doing real-world economic work across all four categories:

1. Direct economic stewardship
2. Operational execution
3. Personal stewardship transfer
4. Economic value and governance

For compute, gather U.S. data-center projects, accelerator capacity, operational or expected operational dates, and serving evidence. Prefer primary sources. For every new value, preserve its URL, publication or observation date, model, harness, tools, budget, benchmark version, judge, and any comparability break. Never infer an exact score from vague prose.

### 2. Update capability evidence and implementation

Update the relevant rows in `data/sources/`, then mirror the operative values in `surfaces/report-cards/capability/build_report_card.mjs` until the builder reads the normalized registries directly.

1. Update `asOf`.
2. At a quarter rollover, update `currentQuarterIndex` and `firstForecastQuarterIndex`.
3. Add a catalog row for each genuinely new benchmark-version-metric series.
4. Append observations; do not erase older frontier observations.
5. Use release quarter unless the benchmark supplies a better consistently applied dating rule.
6. Keep model and harness together in the system label and record material configuration.
7. Pin benchmark version, task set, tools, reasoning effort, budget, judge, and scoring rule when they affect comparability.
8. Create a new benchmark ID or explicit series break when the benchmark changes materially.

Follow the normalization and forecasting rules in [the calculation contract](../02-model/06-report-card-calculations.md#capability-calculation). Do not fabricate earlier quarters for a new benchmark.

### 3. Update compute evidence and implementation

Update the relevant rows in `data/sources/`, then mirror the operative values in `surfaces/report-cards/compute/build_compute_report_card.mjs` until the builder reads the normalized registries directly.

1. Update `asOf` and the quarter-to-date cutoff.
2. Reconstruct every quarter's operational U.S. H100e total under one coverage rule: at each cutoff, sum the latest operational state for each covered U.S. data center.
3. Append or revise observations only when a source supports the change; preserve source-access dates and explain historical revisions.
4. Update operational-site count and evidence class.
5. Refresh the population estimate when appropriate.
6. Change workload or serving assumptions only with new evidence or an explicit scenario decision, and document the change in both report and site audit text.

Follow the supply, workload, and serving rules in [the calculation contract](../02-model/06-report-card-calculations.md#compute-calculation).

### 4. Remove cross-workbook staleness

The compute builder currently embeds capability values in its two-key gate, assumptions, source note, and explanatory copy. Before every compute build, replace every embedded capability-current and capability-crossing value with the newly generated capability result. Search for the previous score and date instead of assuming a fixed number of occurrences.

For the current release, the synchronized literals are `0.475454716275` and `2027-10-08`. Change them together when the capability report changes. Also refresh prose containing calculated supported users, threshold users, score percentages, and dates. Prefer formulas where the workbook library permits them.

### 5. Rebuild and inspect both workbooks

Use the Node executable returned by the bundled workspace dependency loader; do not hardcode a runtime version.

```powershell
$ProjectRoot = (Resolve-Path '.').Path
$OutputRoot = Join-Path $ProjectRoot 'data\reports'

& $NodeExe (Join-Path $ProjectRoot 'surfaces\report-cards\capability\build_report_card.mjs')
& $NodeExe (Join-Path $ProjectRoot 'surfaces\report-cards\compute\build_compute_report_card.mjs')
```

Each build must:

- export a fresh workbook;
- render every preview image;
- inspect important summary and model ranges; and
- return no `#REF!`, `#DIV/0!`, `#VALUE!`, `#NAME?`, or `#N/A` errors.

Review every preview, especially Summary, current-status columns, Model or Quarterly Model, Assumptions, Observations, and Sources. Check for clipping, broken merges, incorrect number formats, and charts that no longer match the data.

Both builders write full `.inspect.ndjson` files. Confirm that their modification times match the fresh workbooks. Never generate HTML tables from a stale inspection.

### 6. Synchronize the website model

After the workbooks are final, update these values together in `surfaces/website/app/page.tsx`:

- `SNAPSHOT`
- `PUBLICATION_DATE`
- `CAPABILITY_CURVE`
- `COMPUTE_CURVE`
- `TOKENS_PER_H100E_DAY_M` when the serving envelope changes
- `BASE_COMPUTE_ACCELERATION`
- inputs to `BASE_NEXT_COMPUTE_VELOCITY`
- `DEFAULTS.currentCapability`
- `DEFAULTS.populationM`
- `DEFAULTS.currentComputeM`
- `DEFAULTS.workloadM`
- `DEFAULTS.servingEfficiency`
- report prose or workbook-default dates containing calculated results
- `REPORT_QUARTERS` and `OBSERVED_END_INDEX` if the window changes

`CAPABILITY_CURVE` is the confidence-weighted Summary trajectory beginning at the evidence cutoff. `COMPUTE_CURVE` is the compute workbook's `U.S. H100e` quarterly series in millions, also beginning at the evidence cutoff.

The HTML charts read generated workbook rows, while the countdown reads these constants. Updating only one side creates an internally inconsistent publication.

Keep `SUPPLY_GATE_SHARE_OF_TARGET = 1` and `SUPPLY_THRESHOLD = 100` unless the model contract itself changes. Current compute means operational H100e, and compute chart values mean hardware-equivalent capacity rather than supported users.

### 7. Regenerate the HTML reports

After both inspections are fresh:

```powershell
$CapabilityInspect = Join-Path $OutputRoot 'personal-ai-four-year-capability-report-card.xlsx.inspect.ndjson'
$ComputeInspect = Join-Path $OutputRoot 'personal-ai-compute-report-card.xlsx.inspect.ndjson'
$SiteRoot = Join-Path $ProjectRoot 'surfaces\website'

& $NodeExe (Join-Path $ProjectRoot 'surfaces\report-cards\shared\generate_report_data.mjs') `
  $CapabilityInspect `
  $ComputeInspect `
  (Join-Path $SiteRoot 'app\report-data.ts')
```

Commit `report-data.ts` and both workbooks, but never edit them manually. The website downloads the canonical workbooks from the public GitHub repository; no duplicate XLSX files belong under `surfaces/website/public/`.

### 8. Build and reconcile

Run the production build from `surfaces/website/` with the bundled pnpm runtime. It must pass without TypeScript or bundling errors.

Then verify the default scenario end to end:

1. Publication date and evidence cutoff match.
2. Capability composite, confidence, and forecast curve match the capability workbook.
3. Current and projected H100e, acceleration, and supported users match the compute workbook.
4. Population multiplied by selected share equals displayed target users.
5. Supply progress equals supported users divided by selected target users.
6. Capability crossing matches the site calculation.
7. Compute crossing matches the site calculation.
8. The headline is the later crossing.
9. Population share, tokens per user per day, serving efficiency, capability threshold, and both acceleration controls affect the correct gate.
10. Both report modals show current data and both downloads open the current workbooks.

## Publication

The existing Sites project is configured by `surfaces/website/.openai/hosting.json`; never create a replacement site during a refresh.

1. Confirm that Git contains only the intended changes.
2. Build successfully.
3. Commit the exact source state being published.
4. Push it to the public GitHub repository and the existing Sites source repository without persisting temporary credentials.
5. Package the committed website, save a site version using the same commit, and deploy it.
6. Preserve public access unless the owner explicitly requests another audience.
7. Wait for deployment success and open the production URL.
8. Verify the publication stamp, countdown, controls, charts, report tables, and downloads.

Temporary write credentials never belong in source files, Git configuration, shell history, or committed remote URLs.

## Definition of done

A refresh is complete only when:

- every new evidence value has a source and comparability note;
- both workbooks share one evidence cutoff;
- both workbooks build, inspect, render, and error-scan cleanly;
- both inspection files were regenerated from those workbooks;
- `report-data.ts` and both workbooks are current;
- live constants and publication text are synchronized;
- the website build passes;
- workbook, HTML report, charts, and countdown reconcile numerically;
- Git is clean after publication; and
- the public site shows the new publication date.

## Maintenance debt

1. **Automate site-curve extraction.** `CAPABILITY_CURVE` and `COMPUTE_CURVE` are copied manually into `page.tsx`, creating the largest silent-drift risk.
2. **Remove capability literals from the compute builder.** Generate or pass a shared capability result.
3. **Read normalized registries directly.** The builders still embed operative arrays even though `data/sources/` defines the intended append-only evidence structure.
4. **Set a rolling-window policy.** The current publication is fixed at `2024-Q1` through `2028-Q4`; do not change it silently at a quarter rollover.

## Refresh record template

Append one entry after each publication:

```text
Publication date:
Evidence cutoff:
Capability sources added or revised:
Compute sources added or revised:
Assumptions changed:
Current capability / confidence:
Capability crossing:
Current H100e / supported users:
Compute crossing:
Headline date and controlling gate:
Site commit:
Sites version:
Notes or comparability breaks:
```

## Current published release

### 26 August 2026

| Regression check | Published value |
|---|---:|
| Current capability composite | 47.545% |
| Capability confidence | Medium, about 50.7% |
| Capability threshold | 60% |
| Capability crossing | 8 October 2027 |
| Current U.S. compute | 13.524006M H100e |
| Population target | 171.4M users |
| Current supported users | about 64.4M |
| Required compute | about 35.98M H100e |
| Compute progress | about 37.6% |
| Compute crossing | 2 September 2027 |
| Headline date | 8 October 2027 |

These are regression anchors for the current production release, not permanent assumptions. Replace this table after every published refresh.
