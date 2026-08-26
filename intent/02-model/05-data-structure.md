# Personal AI forecast data structure

**Design:** normalized, append-only evidence tables
**Evidence cutoff:** 26 August 2026

## Purpose

The data should accept a new model, harness, agent product, benchmark result, data-center milestone, operational-capacity snapshot, token-demand estimate, chip-serving result, or adoption observation without changing the forecast's conceptual framework. New evidence is added as rows; existing rows remain historical records.

The structure separates ten things that are often conflated:

1. **What was released?** A model, harness, or agent product.
2. **What did it score?** A dated observation on a specific benchmark version and metric.
3. **What can the product actually do and who can access it?** A shipped product event with objective capability and availability fields.
4. **How many people use it?** A dated adoption observation with a stable series definition.
5. **How well can the system steward resources through time?** Business-and-household episodes with inflows, outflows, stocks, buffers, investments, obligations, shocks, authority limits, and feedback.
6. **What is the interim system-capability frontier?** Model-plus-harness task horizon under a stable resource envelope.
7. **What is operational now?** Energized H100-equivalent capacity under a fixed public-coverage rule.
8. **What may come online?** Dated, confidence-tagged project and phase milestones.
9. **How much does one user consume?** Raw and compute-equivalent tokens per user per day by archetype.
10. **How many such users can supply serve?** Scenario calculations over model size, utilization, inference allocation, and serving goodput.

## Tables and relationships

```text
release-registry.csv
    release_id ───────────────┐
                              │
                              ├── benchmark-timeseries.csv
                              │       benchmark_id ── benchmark-registry.csv
                              │
                              └── agent-product-events.csv

adoption-series-registry.csv
    series_id ─────────────────── adoption-timeseries.csv

scm-registry.csv
    scm_id ───────────────┬────── scm-trend-estimates.csv
                          └────── serving-observations.csv

personal-ai-system-capability-and-data-center-buildouts.xlsx
    Capability Evidence ───────────────┐
    Buildout Ledger ─── Milestones     ├── Summary
    Capacity History ──────────────────┤
    Demand Archetypes ─ Serving Model ─┘
```

### `scm-registry.csv`, `scm-trend-estimates.csv`, and `serving-observations.csv`

These three CSVs represent the earlier capability-plus-fixed-price formulation and are now **legacy pending migration**. The current causal definitions are system capability and operational H100-equivalent capacity, implemented in the workbook. Do not append new observations to the legacy serving-price table as if it were the operational-compute SCM.

Fixed-capability price and service observations remain useful diagnostics. They can be revived as a downstream economics table, but no longer define the second SCM.

### Evidence workbook

`personal-ai-system-capability-and-data-center-buildouts.xlsx` is the current authoritative updating surface for the two SCMs and the token-demand bridge.

| Sheet | Append or revise when | Key rule |
|---|---|---|
| `Capability Evidence` | A model or harness result appears | Preserve model, harness, track, tools, budget, cost, and comparability. |
| `Buildout Ledger` | A site's current or expected capacity changes | Current H100e must be operational; projected H100e stays in milestone fields. |
| `Milestones` | A phase is announced, delayed, observed, or commissioned | Preserve the old dated row when the evidence history matters. |
| `Capacity History` | A new monthly aggregate snapshot is available | Reconstruct with the same coverage rule; label historical source revisions. |
| `Demand Archetypes` | Product telemetry or autonomy changes token intensity | Separate uncached input, visible output, internal reasoning, and cached context. |
| `Serving Model` | Supply, model size, allocation, utilization, or goodput changes | Report ranges; do not double-count chip gains already embedded in H100e. |
| `Sources` | Any evidence row is added | Record publication/update date, access date, URL, and limitation. |

The primary formulas are:

> `T_ESH = ln(2) / d ln ESH50(t)/dt`

> `Tsys = ln(2) / d ln Hsys50(t)/dt`

> `Tcompute = ln(2) / d ln Cops(t)/dt`

> `supported users(a) = available compute-equivalent tokens/day ÷ tokens/user/day(a)`

`ESH50` is the preferred capability construct. `Hsys50` remains an interim trend proxy until a stable stewardship benchmark has enough release observations for a frontier fit.

### Stewardship episode table to add

The next workbook revision should add an append-only `Stewardship Episodes` table. One row represents one independently scored system run, not one model average.

| Field group | Required fields |
|---|---|
| Identity | `episode_id`, `system_release_id`, `model_id`, `harness_id`, `run_date` |
| Environment | `suite_version`, `variant_business_or_household`, `event_tape_id`, `horizon_days`, `seed` |
| Envelope | `tools`, `permissions`, `token_budget`, `dollar_budget`, `wall_clock_budget`, `human_attention_budget` |
| Starting state | `capital_start`, `buffer_floor`, `obligations_start`, `risk_profile`, `nonfinancial_stocks` |
| Outcomes | `inflow`, `outflow`, `investment`, `losses`, `capital_end`, `buffer_min`, `obligations_met` |
| Autonomy | `human_minutes`, `approval_count`, `correct_escalations`, `missed_escalations` |
| Safety and recovery | `critical_violation`, `irreversible_error`, `shock_count`, `recovery_rate` |
| Efficiency | `input_tokens`, `output_tokens`, `reasoning_tokens`, `cached_tokens`, `compute_equivalent_tokens` |
| Score | `risk_adjusted_net_value`, `all_hard_constraints_met`, `episode_success` |
| Provenance | `evaluator`, `source_url`, `source_date`, `comparability_note` |

The frontier calculation groups comparable runs by system and horizon, estimates success probability, and selects the longest horizon at or above 50%. Business and household twins retain the same `event_tape_id` so their transfer gap can be estimated rather than assumed.

### `release-registry.csv`

One row per model, harness, or agent-product release.

| Field | Meaning |
|---|---|
| `release_id` | Stable primary key; never reused. |
| `entity_type` | `model`, `harness`, or `agent_product`. |
| `provider`, `name` | Human-readable identity. |
| `release_date` | Public release date, not evaluation date. |
| `parent_release_id` | Prior version or model family relationship when useful. |
| `availability_stage` | `research`, `preview`, `limited`, or `general_availability`. |
| `availability_scope` | Where or to whom it was available. |
| `source` | Primary release source. |

Adding a new model or agent begins here.

### `benchmark-registry.csv`

One row per benchmark-version-metric combination. A benchmark version and its harder successor receive different IDs.

| Field | Meaning |
|---|---|
| `benchmark_id` | Stable primary key used by every score observation. |
| `benchmark_family`, `benchmark_version`, `metric` | Human-readable definition. |
| `unit`, `higher_is_better` | Interpretation of the score. |
| `preferred_for_forecast` | Whether the metric belongs in the core adoption-relevant basket. |
| `curve_policy` | Whether it is a fixed-version frontier, retrospective release curve, log-scale horizon, or separate reset. |

For example, `osworld_verified_success` and `osworld2_binary` are distinct IDs. This prevents a harder benchmark reset from appearing as a collapse in capability.

### `benchmark-timeseries.csv`

One row per evaluated system × benchmark metric × observation date.

| Field | Meaning |
|---|---|
| `observation_id` | Stable primary key such as `benchobs_0045`. |
| `release_id` | Foreign key to the evaluated model or agent in `release-registry.csv`. |
| `benchmark_id` | Foreign key to `benchmark-registry.csv`. |
| `model_release_date` | Repeated for convenient plotting; canonical date remains in the registry. |
| `observation_date` | When the score became available. This controls evidence timing. |
| `score`, `unit` | Reported value without cross-benchmark normalization. |
| `series_role` | `frontier`, `nonfrontier`, or `baseline`. |
| `curve_type` | Repeated evaluation, release snapshot, retrospective leaderboard, paper baseline, or internal comparison. |
| `harness_scope` | Tools, effort, retrieval, step budget, and environment needed to interpret the result. |
| `comparability_note` | Anything that prevents a clean comparison. |

Never replace a non-frontier result merely because a later model performs better. A release can matter for price or distribution even when it does not set a benchmark record.

### `agent-product-events.csv`

One row per product launch, expansion, feature addition, restriction, or withdrawal. The table is intentionally factual rather than scored.

| Field group | Examples |
|---|---|
| Identity | `event_id`, `release_id`, `provider`, `product_name` |
| Availability | `availability_stage`, `eligible_plans`, `geography` |
| Authority | `autonomy_level`, `write_actions`, `background_execution` |
| Computer use and integration | `computer_use`, `authenticated_access`, `cross_app` |
| Personal continuity | `persistent_memory` |
| Reliability controls | `confirmation_controls`, `verification`, `rollback` |
| Observed reach | `reported_users`, `user_unit` |

Use `yes`, `no`, `partial`, or `unknown` for capability flags. Do not turn unknown into no. Use a new event row when the same agent gains computer use, persistent memory, broader plan availability, or a materially different confirmation policy.

### `adoption-series-registry.csv` and `adoption-timeseries.csv`

The registry defines what a series means; the observation table stores its dated values. This prevents “people,” monthly users, weekly users, subscriptions, seats, downloads, and GitHub stars from becoming one adoption curve.

Every new adoption figure either:

- appends to an existing `series_id` when its definition is comparable; or
- creates a new registry row and new `series_id` when cadence, population, or measurement meaning changes.

## Adding a new model

1. Add one row to `release-registry.csv` with a unique `release_id`.
2. Add every available benchmark result to `benchmark-timeseries.csv`, one metric per row.
3. Reuse an existing `benchmark_id` only when the version and metric are genuinely identical.
4. Record the actual harness in `harness_scope`; the evaluated object is model plus harness, not the naked model.
5. Add later corrections as new observations or explicitly document a correction. Do not silently rewrite history.

Example identifiers:

```text
release_id: openai_gpt57sol_20261104
observation_id: benchobs_0045
benchmark_id: osworld2_binary
```

## Adding a new personal agent

1. Add the agent itself to `release-registry.csv` with `entity_type=agent_product`.
2. Add a launch row to `agent-product-events.csv`.
3. Add another event row for each material expansion: computer use, authenticated apps, cross-app action, background work, memory, broader plans, verification, or rollback.
4. If the agent is benchmarked as a complete system, add those results to `benchmark-timeseries.csv` using the agent's `release_id`.
5. If reach or usage is disclosed, either append it to a compatible adoption series or create a new series definition first.

## Identifier conventions

- Lowercase ASCII with underscores.
- Release IDs: `provider_product_or_model_yyyymmdd`.
- Benchmark IDs: `family_version_metric`.
- Observation IDs: `benchobs_NNNN` and `adoptobs_NNNN`.
- Event IDs: `provider_product_event_yyyymmdd`.
- IDs never change when display names change.

## Comparability rules

1. Model release date and score observation date are different fields.
2. Full completion and partial credit are different metrics.
3. A benchmark reset starts a new `benchmark_id`.
4. A harness change is recorded even if the base model is unchanged.
5. Vendor-run, independent, retrospective, and internal results remain distinguishable through `curve_type`.
6. Product access, product use, and task delegation remain different adoption series.
7. Unknown values stay blank or `unknown`; estimates are labeled in `comparability_note`.

## Current scale

The structured dataset currently contains:

- 15 model releases;
- 14 benchmark-version-metric definitions;
- 52 benchmark observations;
- 15 adoption-series definitions;
- 34 adoption observations;
- 2 current success-compression metric definitions in the evidence workbook;
- 13 model-and-harness capability observations and diagnostics in the workbook;
- 15 curated frontier data-center projects and 18 selected capacity milestones;
- a 25-point reconstructed monthly operational-capacity series;
- 6 editable token-demand archetypes;
- an assumption-driven supported-user calculator with 1×, 4×, and 10× serving-goodput sensitivities;
- legacy SCM CSVs retained for provenance but not used as the current causal definitions;
- an empty, schema-ready agent-product event table for subsequent product releases and expansions.

This structure is the updating mechanism: future work consists primarily of adding rows, updating explicitly labeled assumptions, and preserving definitions—not rebuilding the framework or treating projections as observations.
