# Forecast data structure

**Design:** immutable, source-first dated JSON snapshots

**Current snapshot:** `data/snapshot-20260826/`

## Contract

The repository keeps forecast evidence only in this shape:

```text
data/snapshot-YYYYMMDD/
  database.json
  gate1-sources/
    [source]-data.json
  gate2-sources/
    [source]-data.json
  gate1-consolidated.json
  gate2-consolidated.json
```

Gate 1 is model–harness capability, the demand proxy. Gate 2 is operational inference-compute supply. Each file under a gate's source directory represents exactly one public source. The consolidated files are deterministic generated views and are the only data files consumed by the shared model, website, and workbook builders.

Every JSON file has exactly two root fields:

```json
{
  "metadata": {
    "id": "stable-id",
    "title": "Human-readable title",
    "description": "Contents and forecast role",
    "schemaVersion": "1.2.0",
    "snapshotDate": "YYYY-MM-DD",
    "asOfDate": "YYYY-MM-DD",
    "sources": [],
    "update": {}
  },
  "data": {}
}
```

All sources use the same schema: `id`, `publisher`, `title`, public HTTPS `url`, `accessedAt`, `roles`, and nullable `notes`. Local filesystem paths are forbidden.

Snapshots are immutable. A refresh creates a new dated directory, updates sources there, rebuilds the consolidated gates, validates the release, and publishes it. Earlier directories remain unchanged so every published result is reproducible.

## Source files

Every `[source]-data.json` has exactly one entry in `metadata.sources`. Its `data` object is:

```json
{
  "gateId": "gate1",
  "results": {
    "status": "reported-scores",
    "countdownRole": "direct-input",
    "summary": "Plain-language result inventory",
    "counts": {
      "scores": 1,
      "measurements": 0,
      "assumptions": 0,
      "directInputs": 1
    },
    "measurements": [
      {
        "metric": "Source metric",
        "value": 0.412,
        "unit": "proportion",
        "displayValue": "41.2%",
        "origin": "normalized-source-result",
        "usedInCountdown": true,
        "normalizedScore": 0.412,
        "sourceLocation": "Table 3",
        "sourceRecord": "capability-benchmarks.observations.forecast-observation-039"
      }
    ]
  },
  "fragments": [
    {
      "datasetId": "capability-benchmarks",
      "collection": "observations",
      "kind": "records",
      "items": [
        { "order": 0, "record": {} }
      ]
    }
  ]
}
```

A source's `results` block is the reader-facing evidence inventory. It exposes reported scores and measurements before the ETL fragments, distinguishes raw source values, normalized results, derived values, and forecast-authored assumptions, and states whether each item changes the countdown. A source with no numerical result must use `descriptive-only` and say so; an updating agent must never fill that gap by inference. The consolidator deterministically rematerializes this block from the fragments, and the validator rejects stale or inconsistent result inventories.

A fragment assigns source-specific data to one logical dataset and collection. `kind: "records"` is used for ordered arrays; `kind: "value"` is used for one object or scalar. The `order` field preserves deterministic ordering when records from many sources are merged. Records with a `sourceId` use the ID of the source file's single metadata source.

Forecast-authored definitions, normalization rules, and scenario assumptions live in a methodology source file for their gate. They are not mixed into an external source's file. One public URL may appear once per gate if it supplies evidence to both gates, but it should not be duplicated within a gate.

## Consolidated gates

Run:

```powershell
& $NodeExe scripts/consolidate_snapshot.mjs
```

The consolidator reads `database.json`, loads every source file, orders and merges its fragments, and writes:

- `gate1-consolidated.json`, containing the capability, METR, adoption, research-evidence, and user-capability logical datasets;
- `gate2-consolidated.json`, containing the compute-capacity logical dataset.

Each consolidated file also includes a `sourceFiles` index with repository path, publisher, original URL, access date, roles, affected logical datasets, record count, result status, result counts, and countdown role. The website uses this index for its provenance modal. Consolidated files must never be hand-edited.

Every logical dataset descriptor in `database.json` also includes a plain-language `calculation` block: its forecast role, preparation method, countdown effect, transformation pipeline, and adjustable assumptions. That lineage travels with the snapshot rather than living only in interface copy.

## Manifest and ETL entry point

`database.json` is the entry point for software and an updating agent. Its `data` object contains:

- `gates`: gate IDs, source directories, consolidated filenames, labels, and logical dataset membership;
- `datasets`: stable logical dataset IDs, gate assignment, collection names, descriptions, record counts, and whether the dataset drives the countdown;
- `defaults`: threshold, forecast horizon, report window, and the rule that supply must serve 100% of the already-selected population target;
- `etl`: directory patterns, source-first workflow, immutable-snapshot rule, latest-snapshot rule, and the declaration that calculations use consolidated gates only.

The loader in `scripts/lib/snapshots.mjs` selects the lexicographically greatest valid `snapshot-YYYYMMDD` directory and loads its two consolidated files. The site bundler, validator, shared forecast model, and workbook builders all call this loader. No calculation surface chooses its own cutoff or reads individual source fragments independently. The website build also copies the selected snapshot to a generated same-origin `/data/snapshot-YYYYMMDD/` path so readers can view and copy every source file without downloading the repository.

## Logical datasets

| Logical dataset | Gate | Purpose | Countdown input |
|---|---|---|---:|
| `capability-benchmarks` | 1 | Four-category economic benchmark basket, normalized observations, and supporting registry | Yes |
| `metr-task-horizon` | 1 | H50 capability velocity, H80 reliability guardrail, trend estimates, and forecast policy | Yes |
| `adoption` | 1 | Adoption definitions, observations, and agent-product events | No; triangulation |
| `research-evidence` | 1 | Evidence ledger supporting the conjecture and assumptions | No; triangulation |
| `user-capabilities` | 1 | Consumer capability catalog and operational metrics | No; ontology |
| `compute-capacity` | 2 | U.S. H100-equivalent path, population target, workload, serving envelope, projection policy, and separately labeled supporting supply evidence | Yes; only the compatible H100e path and serving inputs |

The capability dataset distinguishes the forecast-driving benchmark basket from the supporting registry. Supporting observations remain visible for provenance and future revisions, but only records explicitly labeled as forecast inputs affect the gate.

## Update rules

1. Preserve source meaning before normalization. A benchmark reset, metric change, task-budget change, or materially different harness is a new series or explicit comparability break.
2. Keep model and harness together. Tools, planning, memory, verification, environment policy, and budgets are part of the evaluated system.
3. Separate release date, observation date, source access date, and snapshot date.
4. Never convert vague prose, an Elo value, or an unmatched benchmark version into a percentage without a documented normalization rule.
5. Unknown values remain null or explicitly unknown; they are not zero.
6. Observed and projected compute rows remain distinguishable through `evidenceClass`.
7. Global gigawatt outlooks, lab-allocation estimates, and other expert supply diagnostics remain in `supportingEvidence` unless they can be converted to the U.S. H100-equivalent series without hidden geography, hardware-mix, or performance-per-watt assumptions.
8. Adoption series retain their units and populations; users, subscriptions, seats, downloads, and stars are not one curve.
9. Every `sourceId` must resolve to the source file that contributed the record and to the consolidated gate's source registry.
10. Every source must materialize its numerical results and say whether each one is source-reported, normalized, derived, or a forecast assumption; missing scores remain explicitly missing.
11. New schemas require a `schemaVersion` change and corresponding consolidator, loader, and validator update.

## Adding evidence

- Create a new snapshot and update the relevant source file; never modify a published snapshot.
- Add a new source file when the URL is new to that gate.
- Preserve benchmark version, metric, release date, system/harness label, normalization basis, and comparability note for model–harness results.
- Preserve availability, authority, computer use, authenticated integration, memory, verification, and rollback separately for agent products.
- Reconstruct compute cutoffs under one coverage rule and keep operational observations separate from expected or projected pipeline rows.
- Update the manifest's record counts and logical dataset descriptors.
- Run the consolidator before validation, workbook builds, or the website build.

The source files are the evidence layer; the consolidated gates are the calculation layer. Keeping them separate makes updates auditable without asking every public surface to reimplement the same joins.
