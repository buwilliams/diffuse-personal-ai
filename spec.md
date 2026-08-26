# Diffuse Personal AI Countdown — data and site update specification

**Purpose:** operating manual for refreshing the evidence, rebuilding both report cards, synchronizing the countdown model, and publishing the site.

**Project root:** the directory containing this file.

**Current publication:** 26 August 2026

**Current evidence cutoff:** 26 August 2026

**Published site:** <https://diffuse-personal-ai-countdown.buddywilliams.chatgpt.site/>

**Sites project ID:** `appgprj_6a8eb358ab688191adac7d7dad7cb152`

## 1. The model that must remain intact

The countdown has two independent gates:

1. **Demand proxy — model–harness capability.** The confidence-weighted capability composite must reach the adjustable delegation threshold. The default threshold is **60%**, the first grade above F.
2. **Supply — U.S. compute.** Operational U.S. compute must support the selected share of the U.S. population at the assumed workload. The default population is **342.8 million** and the default selected share is **50%**, so the target is **171.4 million users**.

The headline date is the later crossing:

> `diffusion date = max(capability crossing, compute crossing)`

If either gate does not cross within the site's 15-year search horizon, the site must display **No crossing**. Never use the capability date by itself.

The population percentage is applied exactly once. The supply gate is **100% of the selected target**, not the selected percentage a second time:

> `target users = U.S. population × selected population share`
>
> `required H100e = target users × compute-equivalent tokens/user/day ÷ tokens/H100e/day`

At the defaults, `342.8M × 50% = 171.4M` target users. A result near 85.7M is evidence that the population share was applied twice and is wrong.

The report-card forecasts are transparent scenario extrapolations, not calibrated probabilities. Do not describe the date as a probability forecast unless a probability layer is added later.

## 2. Source-of-truth map

| Path | Role | Edit by hand? |
|---|---|---|
| `surfaces/report-cards/capability/build_report_card.mjs` | Capability catalog, observations, normalization rules, confidence model, forecast formulas, and workbook builder | **Yes — primary capability source** |
| `surfaces/report-cards/compute/build_compute_report_card.mjs` | Compute observations, population/workload/serving assumptions, forecast formulas, and workbook builder | **Yes — primary compute source** |
| `surfaces/report-cards/shared/generate_report_data.mjs` | Converts inspected workbook tables into TypeScript data for the HTML report viewer | Only when the HTML extraction format changes |
| `surfaces/website/app/page.tsx` | Live countdown, adjustable inputs, synchronized forecast curves, report modals, and page copy | **Yes — site model and UI** |
| `surfaces/website/app/globals.css` | Visual design and responsive behavior | Yes, for design changes |
| `surfaces/website/app/layout.tsx` | Site metadata and root layout | Yes, for metadata changes |
| `surfaces/website/app/report-data.ts` | Generated HTML representation of both workbooks | **No — regenerate it** |
| `data/reports/*.xlsx` | Canonical generated workbooks and public downloads | **No — rebuild them** |
| `data/previews/` | Rendered workbook previews for visual review | No |
| `data/sources/*.csv` | Research/evidence registries | Yes, but they are **not currently wired into the two live builders** |
| `data/research/` | Exploratory source notes and papers that are not canonical inputs | Yes |
| `surfaces/report-cards/legacy/` | Earlier combined-workbook implementation | **Legacy; do not use for the live site** |
| `intent/02-model/05-data-structure.md` | Longer-term normalized data design and migration direction | Reference only |

The repository is a monorepo. Git operations run from the project root; the deployable Sites project is `surfaces/website/`.

## 3. Standard monthly refresh

Use one evidence cutoff for the entire release. Record it before gathering data, then apply it to both builders and the site publication date.

### Step 1 — gather the evidence

Start with the sources, not with a desired date.

For capability, gather published benchmarks, leaderboards, and evaluations that measure model–harness systems doing real-world economic work. Search all four categories:

1. Direct economic stewardship
2. Operational execution
3. Personal stewardship transfer
4. Economic value and governance

For compute, gather U.S. data-center projects, accelerator capacity, operational or expected operational dates, and serving evidence. The current primary capacity source is Epoch AI's data-center timeline; the population reference is the U.S. Census Bureau.

Prefer primary sources. For each new value, record the source URL, publication or observation date, evaluated model, harness, tools, budget, benchmark version, judge, and any comparability break. Do not infer an exact score from vague prose.

### Step 2 — update the capability builder

Edit `surfaces/report-cards/capability/build_report_card.mjs`.

1. Update `asOf`.
2. At a quarter rollover, update `currentQuarterIndex` and `firstForecastQuarterIndex`.
3. Add a `catalog` row for every genuinely new benchmark-version-metric series.
4. Append new `observations`; do not replace older frontier observations.
5. Use the release quarter for the observation's model quarter unless the benchmark supplies a better, consistently applied dating rule.
6. Keep model and harness together in the system label. A harness improvement is real system-level capability, but its configuration must be recorded.
7. Pin benchmark version, task set, tools, reasoning effort, budget, judge, and scoring rule wherever they affect comparability.
8. If a benchmark changes materially, create a new benchmark ID or document the series break. Do not splice incompatible versions into one trend.

Normalized scores must be in `[0, 1]` and use a defensible fixed interpretation:

- native pass/success/completion rate;
- result divided by a published human, expert, oracle, or target result, capped at 100%; or
- another fixed transformation whose anchor and limitations are written into the catalog.

Do not convert Elo to a percentage merely by rescaling the visible leaderboard. Elo requires a fixed reference opponent or a probabilistic win-rate transformation with a stable anchor. If that anchor is not defensible, leave the benchmark cataloged but ungraded.

Do not fabricate earlier quarters for a newly released benchmark. One observation forecasts flat, two use constant velocity, and three or more permit an acceleration estimate.

### Step 3 — update the compute builder

Edit `surfaces/report-cards/compute/build_compute_report_card.mjs`.

1. Update `asOf` and the current quarter-to-date cutoff.
2. Reconstruct each quarter's operational U.S. H100-equivalent total using the same coverage rule: at each cutoff, sum the latest operational state for every covered U.S. data center.
3. Append or revise the `observed` array only when the underlying source supports the change; preserve the source access date and explain historical source revisions.
4. Update the operational-site count and evidence class.
5. Refresh the population estimate when appropriate.
6. Change workload or serving-envelope assumptions only when evidence or an explicit scenario decision warrants it. Document the change in the workbook and site audit text.

The current default high-autonomy workload is **16.75 million compute-equivalent tokens per user per day**:

| Component | Raw tokens/day | Compute weight | Compute-equivalent tokens/day |
|---|---:|---:|---:|
| Uncached input | 2.00M | 1.00× | 2.00M |
| Visible output | 0.30M | 2.50× | 0.75M |
| Internal reasoning | 5.00M | 2.50× | 12.50M |
| Cached/reused context | 10.00M | 0.15× | 1.50M |
| **Total** |  |  | **16.75M** |

The current serving envelope yields **79.79328 million compute-equivalent tokens per H100e per day** from:

- 1.979e15 dense 8-bit ops per H100e-second;
- 40% of the fleet allocated to inference;
- 35% sustained serving utilization;
- 100B active model parameters;
- two forward-pass ops per parameter-token;
- 1.5× system overhead; and
- 1.0× additional serving-goodput multiplier.

H100e already normalizes hardware peak compute. Do not add a separate Cerebras, Jalapeño, Rubin, or other chip multiplier unless it represents measured deployed serving goodput not already captured by the H100e convention. Avoid double-counting hardware gains.

### Step 4 — remove cross-workbook staleness before building

The compute builder currently embeds capability values in its `TWO-KEY DIFFUSION GATE`, assumptions, source note, and explanatory copy. These values can become stale even when the site is correct.

Before every compute build, replace all embedded capability-current and capability-crossing values with the newly generated capability result. Search the file for the previous date and score rather than assuming there are only two occurrences. The current synchronized literals are `2027-10-08` and `0.475454716275`; replace them together when the capability report changes.

Also refresh prose containing calculated numbers, including supported users, threshold users, score percentages, and chart titles. Prefer formulas over prose literals when the workbook library permits it.

### Step 5 — rebuild and inspect both workbooks

Use the current bundled workspace runtime. In Codex, load the workspace dependencies first and use the returned Node executable; do not hardcode an old runtime version into the project.

PowerShell outline:

```powershell
$ProjectRoot = (Resolve-Path '.').Path
$OutputRoot = Join-Path $ProjectRoot 'data\reports'

& $NodeExe (Join-Path $ProjectRoot 'surfaces\report-cards\capability\build_report_card.mjs')
& $NodeExe (Join-Path $ProjectRoot 'surfaces\report-cards\compute\build_compute_report_card.mjs')
```

`$NodeExe` means the Node path returned by the workspace dependency loader.

Both builds must:

- export a fresh `.xlsx`;
- render all preview images;
- inspect the important summary/model ranges; and
- return no spreadsheet errors matching `#REF!`, `#DIV/0!`, `#VALUE!`, `#NAME?`, or `#N/A`.

Review every preview image, especially Summary, current-status columns, Model/Quarterly Model, Assumptions, Observations, and Sources. Check text clipping, broken merges, incorrect number formats, and charts that no longer match the data.

Both builders write full `.inspect.ndjson` files. Confirm their modification times match the fresh workbooks before generating the HTML tables. Never reuse a previous inspection after changing a workbook.

### Step 6 — synchronize the live site model

Edit `surfaces/website/app/page.tsx` after the workbooks are final.

Update all of these together:

- `SNAPSHOT`
- `PUBLICATION_DATE`
- `CAPABILITY_CURVE`
- `COMPUTE_CURVE`
- `TOKENS_PER_H100E_DAY_M` if the serving envelope changed
- `BASE_COMPUTE_ACCELERATION`
- `BASE_NEXT_COMPUTE_VELOCITY` inputs
- `DEFAULTS.currentCapability`
- `DEFAULTS.populationM`
- `DEFAULTS.currentComputeM`
- `DEFAULTS.workloadM`
- `DEFAULTS.servingEfficiency`
- any report text or “workbook default” date that embeds a calculated result
- `REPORT_QUARTERS` and `OBSERVED_END_INDEX` if the displayed window changes

`CAPABILITY_CURVE` is the confidence-weighted overall series from the capability workbook's Summary trajectory, beginning at the evidence cutoff and continuing through the forecast horizon.

`COMPUTE_CURVE` is the `U.S. H100e` series from the compute workbook's `Quarterly Model`, expressed in **millions of H100e**, beginning at the evidence cutoff.

The HTML charts read workbook rows from generated `report-data.ts`, but the countdown uses the constants above. Updating only one side creates a visually plausible but internally inconsistent publication.

Keep these invariants unless the model itself is deliberately revised:

- `SUPPLY_GATE_SHARE_OF_TARGET = 1`
- `SUPPLY_THRESHOLD = 100`
- `requiredComputeM = targetUsersM × workloadM ÷ (tokensPerH100eDayM × servingEfficiency)`
- headline target is `max(capabilityCrossing, computeCrossing)`
- current compute is operational H100e, not announced or under-construction capacity
- compute chart values are hardware-equivalent capacity, not supported users

### Step 7 — regenerate the HTML workbook data and downloads

After both `.inspect.ndjson` files are fresh:

```powershell
$CapabilityInspect = Join-Path $OutputRoot 'personal-ai-four-year-capability-report-card.xlsx.inspect.ndjson'
$ComputeInspect = Join-Path $OutputRoot 'personal-ai-compute-report-card.xlsx.inspect.ndjson'
$SiteRoot = Join-Path $ProjectRoot 'surfaces\website'

& $NodeExe (Join-Path $ProjectRoot 'surfaces\report-cards\shared\generate_report_data.mjs') `
  $CapabilityInspect `
  $ComputeInspect `
  (Join-Path $SiteRoot 'app\report-data.ts')
```

`app/report-data.ts` and the two files in `data/reports/` are generated artifacts. Commit them, but do not edit them by hand. The website download links point to the canonical workbooks through the public GitHub repository, so no duplicate `.xlsx` files belong under `surfaces/website/public/`.

### Step 8 — build and reconcile

Use the pnpm executable returned by the workspace dependency loader:

```powershell
Push-Location $SiteRoot
& $PnpmExe run build
Pop-Location
```

The build must succeed without TypeScript or bundling errors. Then reconcile the default scenario in the page against the two workbooks.

At minimum, verify:

1. publication date and evidence cutoff match;
2. current capability composite, confidence label/weight, and forecast curve match the capability workbook;
3. current H100e, projected H100e, acceleration, and supported users match the compute workbook;
4. population × share equals the displayed target users;
5. supply progress equals supported users ÷ selected target users;
6. capability crossing matches the site calculation;
7. compute crossing matches the site calculation;
8. the headline date is the later crossing;
9. changing population share, tokens/user/day, serving efficiency, capability threshold, and both acceleration controls changes the correct gate;
10. both report modals show the fresh data and both downloads open the fresh workbooks.

For the current default publication, the reconciliation anchors are:

| Check | Expected value |
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

These are regression anchors, not permanent assumptions. Replace this table in `spec.md` after each published refresh so it describes the current production release.

## 4. Capability calculation details

### Benchmark motion

For a normalized score `s`, convert the remaining failure gap to depth:

> `failure-gap depth = -log2(1 - s)`

A one-unit increase means the remaining gap to 100% has halved. The model uses the latest comparable quarter frontiers:

- zero observations: blank/ungraded;
- one observation: flat forecast;
- two observations: constant failure-gap velocity; and
- three or more observations: latest velocity plus acceleration from the latest three points.

Forecast depth is monotonic:

> `d(h) = max(d_now, d_now + velocity × h + 0.5 × acceleration × h²)`

Convert forecast depth back to a score:

> `score(h) = 1 - 2^(-d(h))`

Negative acceleration may flatten the frontier but must not make projected capability regress below the current frontier.

### Categories and confidence

Within each category, average the graded benchmark scores. Do not average raw scores across incompatible native units; normalization happens first.

Each benchmark earns one evidence credit per distinct quarterly observation, capped at three. Category confidence is:

> `confidence weight = total evidence credits ÷ (3 × cataloged benchmarks in category)`

Labels are High at 80% or above, Medium at 50% or above, and Low below 50%. The overall capability score, GPA, trajectory, and acceleration use continuous category confidence weights. Sparse evidence therefore contributes less than mature longitudinal evidence.

Letter grades are A ≥90%, B ≥80%, C ≥70%, D ≥60%, and F <60%.

## 5. Compute calculation details

For each observed quarter:

> `compute-equivalent tokens/day = operational H100e × tokens/H100e/day`
>
> `supported users = compute-equivalent tokens/day ÷ workload/user/day`
>
> `supply score = min(100%, supported users ÷ target users)`

The forecast models `log2(H100e)`. Quarterly log growth is the first difference. The slope of observed quarterly log-growth rates is the acceleration, and the fitted current rate is the velocity. Forecast later quarters using that velocity and acceleration.

Only operational U.S. capacity belongs in the observed series. Announced or under-construction projects may inform future evidence or scenario analysis, but must not be counted as operational before their supported commissioning date.

## 6. Publication procedure

The site is a Sites project configured by `surfaces/website/.openai/hosting.json`. Reuse that project; do not create a new site.

1. Confirm `git status --short` contains only the intended intent, data, report-card, and website changes.
2. Build successfully.
3. Commit the exact nested-site state being published.
4. Follow the current `sites-hosting` workflow: create a temporary source-repository write credential, push without persisting the credential, package the committed site, save a site version using the commit SHA, and deploy that version.
5. Preserve public access unless the owner explicitly requests a different audience.
6. Wait for deployment status `succeeded`.
7. Open the production URL and verify the publication stamp, countdown, controls, charts, report tables, and downloads.

Never put a temporary write token, authorization header, or credential in this file, Git configuration, shell history, or a committed remote URL.

## 7. Definition of done

A refresh is complete only when:

- every new evidence value has a source and comparability note;
- both workbooks share one evidence cutoff;
- the capability and compute workbooks build, inspect, render, and error-scan cleanly;
- both inspect files were generated from the new workbooks;
- `report-data.ts` and both workbooks in `data/reports/` are refreshed;
- all live constants and publication text are synchronized;
- the site build passes;
- the default scenario reconciles numerically across workbook, HTML report, charts, and countdown;
- the monorepo is clean after publication; and
- the deployed public site shows the new publication date.

## 8. Known maintenance debt

Address these before or during the next substantive refresh:

1. **Automate site-curve extraction.** `CAPABILITY_CURVE` and `COMPUTE_CURVE` are manually copied into `page.tsx`; this is the largest silent-drift risk.
2. **Remove duplicated capability literals from the compute builder.** Prefer a generated shared input or pass the capability result into the compute build.
3. **Migrate from embedded arrays to normalized registries.** The CSVs in `data/sources/` and the data-structure document describe an append-only design, but the current live builders still embed their input arrays.
4. **Clarify the rolling window policy.** The current publication is fixed at `2024-Q1` through `2028-Q4`. Do not silently change the window at a quarter rollover; record the chosen policy and update both builders plus `REPORT_QUARTERS` together.

## 9. Refresh log template

Append a short entry here after each publication.

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

### 26 August 2026

- Evidence cutoff: 26 August 2026
- Current capability: 47.545%; Medium confidence (~50.7%)
- Capability crossing: 8 October 2027
- Current compute: 13.524006M H100e; about 64.4M supported users
- Compute crossing: 2 September 2027
- Headline: 8 October 2027; capability controls by about 36 days
- Access: public
