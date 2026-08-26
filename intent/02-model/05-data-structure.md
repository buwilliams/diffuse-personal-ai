# Forecast data structure

**Design:** immutable dated JSON snapshots

**Current snapshot:** `data/snapshot-20260826/`

## Contract

The repository tracks evidence only under:

```text
data/snapshot-YYYYMMDD/database.json
data/snapshot-YYYYMMDD/[data-source].json
```

Every JSON file has exactly two root fields:

```json
{
  "metadata": {
    "id": "dataset-id",
    "title": "Human-readable title",
    "description": "What the dataset contains and how it is used",
    "schemaVersion": "1.0.0",
    "snapshotDate": "YYYY-MM-DD",
    "asOfDate": "YYYY-MM-DD",
    "sources": [],
    "update": {}
  },
  "data": {}
}
```

`metadata.sources` is the provenance registry for that file. Every source has a stable snapshot-local `id`, publisher, title, public HTTPS URL, access date, role list, and optional note. Records inside `data` use `sourceId` to reference this registry. Local filesystem paths are forbidden.

Snapshots are immutable. A refresh copies the latest schema into a new dated directory, updates and normalizes the evidence there, validates it, and publishes it. Earlier directories remain unchanged so any published result can be reproduced.

## Manifest and ETL entry point

`database.json` is the entry point for both software and an updating agent. Its `data` object contains:

- `datasets`: filename, stable dataset ID, human title, record count, and whether the dataset drives the countdown;
- `defaults`: threshold, forecast horizon, report window, and the rule that supply must serve 100% of the already-selected population target;
- `etl`: directory pattern, selection rule, required root fields, immutability rule, and refresh workflow.

The loader in `scripts/lib/snapshots.mjs` selects the lexicographically greatest valid `snapshot-YYYYMMDD` directory. The site bundler, validator, shared forecast model, and workbook builders all call this loader. No surface chooses its own evidence cutoff.

## Current datasets

| File | Purpose | Countdown input |
|---|---|---:|
| `capability-benchmarks.json` | Four-category economic benchmark basket, normalized observations, and supporting registry | Yes |
| `metr-task-horizon.json` | H50 capability-velocity series, H80 reliability guardrail, published trend estimates, and forecast policy | Yes |
| `compute-capacity.json` | U.S. operational/expected H100e path, population target, token workload, serving envelope, and projection policy | Yes |
| `adoption.json` | Adoption-series definitions, observations, and agent-product events | No; triangulation |
| `research-evidence.json` | Evidence ledger supporting the conjecture and assumptions | No; triangulation |
| `user-capabilities.json` | Consumer capability catalog and operational metrics | No; ontology |

The capability file deliberately distinguishes the forecast-driving benchmark basket from the older supporting registry. Supporting observations remain visible for provenance and future model revisions, but only records explicitly labeled as forecast inputs affect the current gate.

## Update rules

1. Preserve source meaning before normalization. A benchmark reset, metric change, task-budget change, or materially different harness is a new series or an explicit comparability break.
2. Keep model and harness together. Tools, planning, memory, verification, environment policy, and budgets are part of the evaluated system.
3. Separate release date, observation date, and snapshot date.
4. Never convert vague prose, an Elo value, or an unmatched benchmark version into a percentage without a documented normalization rule.
5. Unknown values remain null or explicitly unknown; they are not zero.
6. Observed and projected compute rows remain distinguishable through `evidenceClass`.
7. Adoption series retain their units and populations; users, subscriptions, seats, downloads, and stars are not one curve.
8. `sourceId` foreign keys must resolve inside the same JSON file.
9. New snapshot schemas require a `schemaVersion` change and corresponding loader/validator update.

## Adding a model, agent, benchmark, or compute update

- Add or update the appropriate record in the new snapshot, never the old one.
- Add every cited public page to that file's `metadata.sources` and reference it by `sourceId`.
- For a model–harness score, preserve benchmark version, metric, release date, system/harness label, normalization basis, and comparability note.
- For an agent product, preserve availability, authority, computer use, authenticated integration, memory, verification, and rollback facts separately from adoption.
- For compute, reconstruct each cutoff under one coverage rule and keep operational observations separate from expected/projected pipeline rows.
- Update `database.json` record counts and dataset descriptors.
- Run `scripts/validate_snapshots.mjs` before rebuilding either surface.

The data structure is the updating mechanism: future work should add a snapshot and preserve definitions, not copy values into code or rebuild the forecast from disconnected spreadsheets.
