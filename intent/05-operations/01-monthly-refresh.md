# Monthly evidence refresh and publication

This is the authoritative operating procedure for updating the Diffuse Personal AI forecast.

**Current publication and evidence cutoff:** 3 September 2026

**Published site:** <https://diffuse-personal-ai-countdown.buddywilliams.chatgpt.site/>

## Authority map

| Layer | Path | Role |
|---|---|---|
| Meaning and rules | `intent/` | Normative source of truth |
| Source evidence | `data/snapshot-YYYYMMDD[-N]/gate[1|2]-sources/[source]-data.json` | One immutable normalized file per public source |
| Consolidated inputs | `data/snapshot-YYYYMMDD[-N]/gate[1|2]-consolidated.json` | Deterministic calculation inputs generated from source files |
| ETL manifest | `data/snapshot-YYYYMMDD[-N]/database.json` | Agent-readable gate, source, dataset, and refresh contract |
| Consolidator | `scripts/consolidate_snapshot.mjs` | Rebuilds both gate inputs from source fragments |
| Epoch compute refresh | `scripts/refresh_epoch_compute.mjs` | Fetches the registry and timeline together, reconstructs U.S. quarterly IT power, and writes the source-normalized audit rows |
| Shared calculations | `model/forecast-model.mjs` | One implementation for capability and compute |
| Snapshot loader | `scripts/lib/snapshots.mjs` | Selects the latest valid dated directory |
| Validator | `scripts/validate_snapshots.mjs` | Schema, provenance, foreign-key, and forecast-invariant checks |
| Website bundle | `scripts/generate_site_snapshot.mjs` | Build-time model bundle plus generated public JSON copy of the latest snapshot |
| Workbook builders | `surfaces/report-cards/` | Render the shared model as downloadable XLSX files |
| Website | `surfaces/website/` | Renders the shared model as the countdown, controls, charts, tables, and source modal |
| Published workbooks | `artifacts/report-cards/*.xlsx` | Generated downloads |

The repository root owns Git history. The existing Sites project is configured by `surfaces/website/.openai/hosting.json` and must be reused.

## Standard refresh

### 1. Set the cutoff and create a snapshot

Choose one evidence cutoff for capability, METR, compute, adoption, and publication. Copy the latest `data/snapshot-YYYYMMDD[-N]/` directory to the new date and immediately update. Use `-2`, `-3`, and so on when a same-day successor is required; same-day evidence must never overwrite an already published directory.

- every source file's `metadata.snapshotDate`, `metadata.asOfDate`, source access date, and update note;
- `database.json` description, gate inventory, logical dataset inventory, and record counts;
- the publication date implicit in the selected snapshot.

Never revise a previously published snapshot.

### 2. Gather evidence

Start with sources, not a desired crossing date.

For capability, gather benchmarks, leaderboards, and evaluations of model–harness systems doing real-world economic work across:

1. direct economic stewardship;
2. operational execution;
3. personal stewardship transfer; and
4. economic value and governance.

Refresh METR H50 and H80 task-horizon observations and official trend estimates. H50 is the capability-velocity signal; H80 is the reliability guardrail. Preserve release date, model, scaffold, metric, source, confidence interval when available, and measurement-ceiling warnings.

Also test major frontier releases against the frontier-shock contract. Require an independent aggregate comparison, at least two independent publishers, and at least three capability domains. Translate a qualifying aggregate gain through its published frontier trend and the existing economic transfer coefficient. Do not promote any single general benchmark score into the direct delegation basket.

For Gate 2, gather U.S. data-center registries, IT power, facility power, accelerator capacity, operational or expected operating dates, independently measured latency-constrained goodput and full-system power, and allocation evidence. Refresh Epoch's registry and timeline together, then reconstruct quarter cutoffs under a stable U.S. coverage rule. Refresh the matched MLPerf productivity series separately, preserving model, accuracy target, scenario, system power, and service-level constraints. Preserve H100e as an audit-only cross-check. Keep global build-rate, allocation, and financing outlooks as separately labeled supporting evidence when they cannot be reconciled to the U.S. IT-power, productivity, or allocation series without additional assumptions. Prefer primary sources and preserve uncertainty.

For every value, update or create exactly one `[source]-data.json` file under the appropriate gate. Each file names one public HTTPS source in `metadata.sources`; its `data.fragments` attributes normalized records or model values to logical datasets. The consolidator materializes `data.results` so readers see every explicit score or measurement, its origin, normalization, and countdown use before the lower-level fragments. Do not infer an exact score from vague prose; a source without a numerical result must say so.

### 3. Normalize into the new snapshot

Follow [the data structure](../02-model/05-data-structure.md) and [the calculation contract](../02-model/06-report-card-calculations.md).

- Append comparable observations; do not erase earlier frontier points.
- Create a new benchmark ID or explicit series break when version, task set, tools, reasoning effort, budget, judge, or scoring rule changes materially.
- Keep the model and harness together in the system label.
- Do not fabricate pre-release quarters.
- Keep ungraded benchmarks visible, but exclude them from the current score.
- Preserve both the forecast-driving capability basket and supporting observations; do not silently promote supporting data into the forecast.
- Keep compute observations and projected pipeline rows visibly distinct.
- Keep IT power, facility power, H100e, and reference-token productivity distinct; facility power and H100e are audit fields, not substitutes for IT power.
- Change population, workload, inference allocation, Personal-AI allocation, or serving assumptions only with new evidence or an explicit scenario decision.
- Keep `supplyGateShareOfTarget = 1`: population share is selected once, then compute must serve 100% of that selected target.

After source normalization, rebuild both calculation inputs:

```powershell
& $NodeExe scripts/consolidate_snapshot.mjs
```

Do not hand-edit either `gate1-consolidated.json` or `gate2-consolidated.json`. They are deterministic products of the source files and manifest.

### 4. Validate the snapshot and model

Run from the repository root with the bundled Node runtime:

```powershell
& $NodeExe scripts/validate_snapshots.mjs
```

Validation must confirm:

- `data/` tracks only the manifest, two consolidated gate files, and source JSON files under `snapshot-YYYYMMDD[-N]/`;
- every file has exactly `metadata` and `data` at its root;
- every source file represents exactly one source and uses the common fragment schema;
- every source file has a current `data.results` inventory, and every missing numerical result is labeled rather than guessed;
- the manifest, source directories, source-file indexes, logical datasets, and consolidated files agree;
- every logical dataset explains its preparation, transformation pipeline, countdown effect, and adjustable assumptions;
- source IDs resolve and every source is a public HTTPS URL;
- no local filesystem path appears in data;
- benchmark and observation IDs are coherent;
- capability and compute use the same four-year window;
- population share is not applied twice;
- all scores and derived values are finite and in range; and
- raising capability, IT-power, or inference-productivity acceleration while holding other inputs fixed never moves its gate later.

Treat validation failure as a publication blocker.

### 5. Rebuild and visually inspect both workbooks

```powershell
& $NodeExe surfaces/report-cards/capability/build_report_card.mjs
& $NodeExe surfaces/report-cards/compute/build_compute_report_card.mjs
```

The builders select the latest snapshot and call `model/forecast-model.mjs`; they contain no independent evidence arrays or forecast constants. They write:

- `artifacts/report-cards/personal-ai-four-year-capability-report-card.xlsx`;
- `artifacts/report-cards/personal-ai-compute-report-card.xlsx`;
- ignored previews under `artifacts/previews/`; and
- ignored inspection records beside each workbook.

Review every preview. Check number formats, clipped text, chart series, source URLs, date labels, observation/projection distinctions, and absence of spreadsheet errors.

### 6. Build and reconcile the website

```powershell
cd surfaces/website
pnpm run lint
pnpm run typecheck
pnpm run build
```

`prebuild` first runs `scripts/consolidate_snapshot.mjs`, then `scripts/generate_site_snapshot.mjs`. The latter selects the latest snapshot and writes an ignored bundle at `surfaces/website/app/generated/latest-snapshot.json`. The browser loads that bundle once; it does not fetch dozens of files or calculate from a workbook at runtime.

Reconcile the default scenario:

1. Publication date equals the latest snapshot.
2. Capability score, confidence, category path, H50 acceleration, H80 guardrail, transfer coefficient, and crossing match the shared model, consolidated Gate 1 JSON, and optional spreadsheet export.
3. Current IT power, inference productivity, H100e audit bridge, allocations, supported users, population target, both velocities, both accelerations, and crossing match the shared model, consolidated Gate 2 JSON, and optional spreadsheet export.
4. Supply progress equals supported users divided by the selected target population.
5. The headline is the later of the capability and compute crossings.
6. Population, population share, tokens per user/day, fleet inference allocation, Personal-AI allocation, threshold, and all three acceleration controls affect only their intended terms.
7. The Sources modal groups every public source by gate and links directly to the original evidence.
8. The Source data modal lists every logical dataset, system file, and source-normalized JSON file; view, copy, and raw-file actions work from the site-hosted snapshot copy.
9. Each selected source shows its explicit scores or measurements, source-vs-normalized status, countdown use, and an unambiguous notice when no numerical result was extracted.
10. Each selected dataset explains its preparation, calculation path, countdown effect, and adjustable assumptions.
11. Each HTML Gate Report identifies its logical datasets, exposes the complete gate source-file index, downloads the consolidated gate JSON as its audit record, and offers an XLSX convenience export from `artifacts/report-cards/`.
12. Built output contains no local filesystem paths.

### 7. Commit and publish

**Standing owner authorization (2 September 2026):** commit, push, and publish requested updates to this existing public site after validation without asking again. This does not authorize unrelated changes, new sites, or changes to who can access the site.

1. Review `git diff` and confirm that `data/` contains only the source-first JSON snapshot(s).
2. Commit the exact source and artifacts being published.
3. Push to the public GitHub repository.
4. Package the committed `surfaces/website/dist` output and deploy it to the existing Sites project.
5. Preserve public access unless the owner requests otherwise.
6. Wait for deployment success and open the production URL.

Temporary credentials never belong in source, Git configuration, shell history, or committed remote URLs.

## Definition of done

A refresh is complete only when:

- every changed evidence value has source metadata and a comparability note where needed;
- the new immutable snapshot validates;
- the shared model produces finite, directionally correct gate projections;
- both workbooks rebuild, render, inspect, and error-scan cleanly;
- lint, TypeScript, and the production site build pass;
- website charts, tables, controls, dates, and workbooks reconcile;
- GitHub and the existing public site contain the same committed release; and
- the working tree is clean.

## Current regression anchors

These values describe snapshot `20260903`; they are checks, not permanent assumptions.

| Check | Value |
|---|---:|
| Capability composite | 46.1414% |
| Capability evidence confidence | Low, 48.6111% |
| Pooled economic gap velocity | 0.157069 gap halvings / quarter |
| Cross-family velocity prior | 0.149865 gap halvings / quarter |
| METR H50 acceleration | 0.209121 task-horizon doublings / quarter² |
| METR H80 guardrail | 0.342917 task-horizon doublings / quarter² |
| Economic transfer coefficient | 0.221460 |
| Capability threshold | 80% |
| Continuous capability crossing | 3 December 2027 |
| Daily-resolution capability crossing | 4 December 2027 |
| 2028-Q4 capability | 98.3608% |
| Current U.S. operational IT power | 12.109330 GW |
| Current inference productivity | 45.688453T reference token-equivalents / IT GW-day; MLPerf measured baseline |
| Current H100e audit bridge | 13.046294M H100e |
| H100e-derived audit productivity | 214.918293T reference token-equivalents / IT GW-day; excluded from capacity |
| Population target | 171.4M users (50% of 342.8M U.S. residents) |
| Fleet inference allocation | 40% |
| Personal-AI inference share | 60% |
| Current supported users | 7.9273M |
| Current compute progress | 4.6250% |
| IT-power log acceleration | −0.004726 log₂ IT GW / quarter² |
| Inference-productivity log velocity | +0.853025 log₂ productivity / quarter |
| Inference-productivity log acceleration | 0.000000 log₂ productivity / quarter²; two comparable points |
| Continuous service-capacity crossing | 1 November 2027 |
| Daily-resolution service-capacity crossing | 2 November 2027 |
| Headline date | 4 December 2027; capability is the limiter |

## Refresh record template

```text
Publication date:
Snapshot directory:
Capability sources added or revised:
Compute sources added or revised:
Other datasets revised:
Assumptions changed:
Current capability / confidence:
Capability crossing:
Current IT power / productivity / supported users:
Compute crossing:
Headline date and controlling gate:
Git commit:
Sites version:
Notes or comparability breaks:
```
