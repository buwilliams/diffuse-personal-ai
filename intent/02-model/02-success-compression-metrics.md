# Two-model framework and success-compression metrics for personal AI

**Framework date:** 26 August 2026
**Forecast outcome:** the share of eligible consumer digital task episodes delegated to personal AI

## Decision

The forecast has two linked models:

1. **Supply and demand:** operational inference supply versus capability-induced tokens per user per day.
2. **Model-harness capability:** risk-adjusted, economically valuable stewardship under feedback, resource, authority, and reliability constraints.

The success-compression metrics are summary variables inside those models:

- **Economic Stewardship Horizon (`ESH50`)** is the preferred capability metric. Until a stable stewardship suite exists, the model-plus-harness task horizon (`Hsys50`) is its interim trend proxy.
- **Supported Personal-AI user-equivalents (`U_PAI`)** are the gate metric. They are produced by operational U.S. AI IT power (`P_IT`) and inference productivity (`η_ref`), then reduced by explicit allocation and per-user workload assumptions.

They answer different questions: *How rapidly is usable agent stewardship advancing?* and *Can the physical fleet economically serve the token demand that capability creates?*

Consumer delegation is the outcome. **Tokens per user per day** are the demand term that connects the models, not a third success-compression metric. The complete hierarchy and business-to-household mapping are in [the two-model framework](01-two-model-framework.md).

## Capability-model metric: system-capability horizon

Define `Hsys50(t)` as the longest human-duration task at which the best publicly released **model-plus-harness system** succeeds 50% of the time on a fixed task suite under a common tools, permissions, time, step, and cost envelope.

The evaluated object is:

> **model + memory + planning + tool routing + verification + context management + environment policy**

The harness is not frozen in the primary series because harness progress is part of deployed capability. A frozen-harness rerun remains essential as an attribution diagnostic: it estimates how much of a release-to-release gain came from the model rather than the surrounding system.

METR's task-completion time horizon is the best-maintained starting series. It reports human task duration rather than a bounded pass rate, though its tasks remain concentrated in software, ML, and cybersecurity and its suite and evaluation infrastructure have changed. [METR TH1.1](https://metr.org/blog/2026-1-29-time-horizon-1-1/)

### Doubling time

Fit the frontier in log space:

> `ln Hsys50(t) = α + βt`

The implied system-capability doubling time is:

> `Tsys = ln(2) / β`

To test acceleration, fit a local quadratic or compare prespecified rolling windows:

> `ln Hsys50(t) = α + βt + γt²`

- `γ > 0`: the log slope is rising and doubling time is shrinking.
- `γ ≈ 0`: doubling time is roughly steady.
- `γ < 0`: doubling time is growing.

METR TH1.1's current raw file reports P50 doubling times of **187.778 days all-time** and **128.744 days for releases since 2023**, with a **104.428–158.012 day** interval for the recent fit. The forecast also records a **102.811-day** GPT-5-to-Claude-Mythos endpoint check, but this is directional rather than an independent acceleration fit; the Mythos estimate exceeds METR's 16-hour reliable range. Task composition, evaluation changes, the small number of frontier points, and a rising measurement ceiling therefore prevent a strong statistical acceleration claim. [METR TH1.1 raw results](https://metr.org/assets/benchmark_results_1_1.yaml)

### Harness contribution

Define a controlled harness effect for the same model, task split, and resource budget:

> `Δh = ln(Hsystem / Hreference)`

or, on a pass-rate benchmark, report the paired score difference with cost, latency, and failure bars.

ARC-AGI-3 shows why this distinction matters. GPT-5.5 and Claude Opus 4.7 scored **0.43%** and **0.18%** under the standard semi-private harness in May 2026; later community systems reached **99–100%** on the separate public-demo track by constructing persistent, executable world models and verification loops. The gap demonstrates extreme system-envelope sensitivity, but it is **not** a causal harness multiplier because the tracks, budgets, and validation differ. [Standard analysis](https://arcprize.org/blog/arc-agi-3-gpt-5-5-opus-4-7-analysis), [community systems](https://arcprize.org/leaderboard/community)

A valid harness study must hold fixed:

- model checkpoint and sampling;
- benchmark version and split;
- tools and permissions;
- token, compute, step, and wall-clock budgets;
- environment version, run count, and success criteria.

It may vary memory, planning, routing, verification, reflection, parallelism, and context management. Report capability uplift together with token cost, latency, irreversible-error rate, and rollback rate.

## Supply-model metric: supported Personal-AI user-equivalents

The gate compresses four distinct quantities without hiding them:

> `P_IT(t) = Σ operational IT power at U.S. AI sites inside a fixed public-coverage rule`
>
> `η_ref(t) = reference token-equivalents served per IT GW-day`
>
> `S_PAI(t) = P_IT(t) × η_ref(t) × s_inference(t) × s_PAI(t)`
>
> `U_PAI(t) = S_PAI(t) ÷ τ_user(t)`

The physical and productivity trends are fitted separately:

> `T_power = ln(2) / d ln P_IT(t)/dt`
>
> `T_productivity = ln(2) / d ln η_ref(t)/dt`

Only energized and operational IT power counts in the observed physical series. Announced gigawatts, land purchases, permits, buildings under construction, cooling capacity, and ordered chips belong in a separate pipeline:

> `P_pipe(t,q) = dated projected IT power expected online by quarter q`

`P_pipe` is a lead indicator. It does not enter observed `P_IT` until commissioning evidence appears, although a dated commissioning estimate may appear in the visibly projected path.

Epoch AI's maintained data-center tracker covered **83 sites, 14.4 million operational H100-equivalents, and 13 GW of IT power** on 24 August 2026. This is a rigorous public tracker, not a complete global census. [Epoch AI data centers](https://epoch.ai/data/ai-data-centers)

The current snapshot joins Epoch's registry to its timeline, identifies U.S. sites, and reconstructs the latest state at each quarterly cutoff. U.S. IT power rises from **0.473 GW in 2024-Q1 to 11.879 GW on 26 August 2026**. The same states contain **13.524 million H100e**, retained as an audit cross-check rather than a productivity input. The base forward path uses Epoch's dated expected/projected site states rather than extending a historical doubling-time regression. Mean projected IT-power growth is **0.157207 log₂ GW per quarter**, with acceleration **−0.001503 log₂ GW per quarter²**. [Epoch registry CSV](https://epoch.ai/data/data_centers/data_centers.csv), [Epoch timeline CSV](https://epoch.ai/data/data_centers/data_center_timelines.csv)

Inference productivity is measured independently. MLPerf v5.1's available Llama 3.1 405B Server power result reports **1,249.04 tokens/s at 9,566.182 W**; normalizing 405B active parameters to a 100B reference yields **45.688T reference token-equivalents per IT GW-day**. A matched Llama 2 70B 99.9 Server series improves **2.818× in 160 days** from v5.0 to v5.1, giving **0.853025 log₂ productivity growth per quarter**. With only two comparable points, measured productivity acceleration is **zero pending a third observation**. The old H100e bridge implies 227.101T/GW-day and remains visible precisely because its disagreement with the independent measure is informative. [MLPerf v5.0](https://mlcommons.org/2025/04/mlperf-inference-v5-0-results/), [MLPerf v5.1](https://mlcommons.org/2025/09/mlperf-inference-v5-1-results/)

The largest-site frontier is a useful diagnostic, not the aggregate SCM. Epoch estimates that record single-site capacity has doubled about every **seven months** since August 2024. [Largest-site trend](https://epoch.ai/data-insights/largest-data-center-compute)

### Buildout pipeline

The current watchlist shows both near-term additions and a larger 2027–28 wave:

| Project | Current operational estimate | Next or ultimate estimate | Expected timing |
|---|---:|---:|---|
| Colossus 2 | 1.112M H100e / 946 MW | 1.824M / 1,531 MW | Q1 2027 |
| Stargate Abilene | 0.509M / 421 MW | 1.019M / 843 MW | Q4 2026 |
| QTS Cedar Rapids | 0 | 1.137M, then 3.669M | Nov. 2026; Nov. 2027 |
| Goodnight | 0 | 2.279M / 1,006 MW | Q4 2027 |
| Meta Hyperion | 0 | 4.254M / 1,676 MW | Q1 2028 first phase |
| Fairwater Wisconsin | 0.446M / 369 MW | 4.528M / 2,263 MW | Q2 2028 tracker estimate |
| Stargate New Mexico | 0 | 5.104M / 1,750 MW | Q4 2028 |

These are dated estimates, not commitments. The tracker itself is frequently revised as satellite imagery, permits, power agreements, chip availability, and commissioning evidence change. The updateable ledger preserves the source date and distinguishes current from projected capacity. [Epoch updates](https://epoch.ai/data/ai-data-centers/updates)

## Tokens per user per day: the supply-to-adoption bridge

For user archetype `a`, define:

> `τa(t) = compute-equivalent tokens consumed per user per day`

Estimate uncached input, visible output, internal reasoning, and cached/reused context separately. Weight them by measured serving burden rather than assuming every billed token requires identical compute.

For a scenario with operational IT power `P_IT`, reference-token productivity `η_ref`, inference allocation `s_inference`, and Personal-AI allocation `s_PAI`, the service estimate is:

> `Personal-AI token-equivalents/day = P_IT × η_ref × s_inference × s_PAI`

and:

> `supported users of archetype a = Personal-AI token-equivalents/day / τa`

This is a scenario calculator, not a point forecast. It must vary IT power, productivity, inference allocation, Personal-AI allocation, utilization, active parameters, token mix, context length, latency target, and model architecture.

The archetypes should span at least:

- casual assistant;
- daily copilot;
- delegating agent;
- high-autonomy personal AI;
- agentic software builder;
- continuous digital proxy.

The key uncertainty is rebound. As capability rises, one user may consume orders of magnitude more tokens because the agent tackles longer tasks, runs parallel branches, verifies results, and maintains memory. Faster chips may therefore produce more intelligence per user rather than proportionally more users.

The current snapshot derives `η_ref` directly from measured latency-constrained tokens per second and full-system watts, normalized by active model size. H100e is excluded. Add a new productivity point only for a comparable workload and service level; preserve memory bandwidth, interconnect, latency-aware scheduling, caching, quantization, software, and architecture as part of the measured system rather than stacking promotional multipliers.

The emerging inference architectures make it necessary to preserve the performance basis:

- NVIDIA reports workload-specific gains ranging from a **4× software throughput improvement** on GB200 over three months to **up to 10× throughput per watt** for Vera Rubin over Blackwell. [NVIDIA performance hub](https://developer.nvidia.com/deep-learning-performance-training-inference), [Rubin architecture](https://developer.nvidia.com/blog/inside-nvidia-rubin-gpu-architecture-powering-the-era-of-agentic-ai/)
- Cerebras says CS-4 can generate tokens **up to 30× faster than production GPU systems**, exceed 1,000 tokens/second on models over 10 trillion parameters, and deliver up to 10× more throughput per watt than CS-3. The 30× figure is primarily a speed/interactivity claim, not evidence that a whole mixed fleet serves 30× as many users per megawatt. [Cerebras CS-4](https://www.cerebras.ai/cs4)
- OpenAI's first Jalapeño results are more granular. Across GPT-OSS 120B, DeepSeek R1, and Kimi K2.5, it reports **1.5–1.9× more peak work per watt**, **1.7–3.6× lower end-to-end latency**, and **2.1–4.1× higher highly interactive performance** than GB200/GB300 comparisons. The reported **53.7×, 104.3×, and 56.1×** gains are throughput per kilowatt at the GPU system's *previous-best time-between-tokens* operating point. Thus “more than 50×” is real within that matched-interactivity comparison, but it is not the general peak-throughput multiplier. OpenAI plans deployment by the end of 2026. [OpenAI Jalapeño results](https://openai.com/index/jalapeno-first-results/)

The forecast therefore keeps peak throughput, per-user speed, matched-latency goodput, and deployment share separate. A future refresh may update `η_ref` with `fleet productivity = baseline productivity × [1 + deployment share × (relative goodput − 1)]`, but only when both deployment share and a comparable workload/service-level result are available.

## How the metrics determine the forecast

| System capability | Operational compute | Forecast implication |
|---|---|---|
| Low | Low | No basis for broad delegation. |
| High | Low | Capable systems remain rationed, slow, or expensive. |
| Low | High | Abundant tokens do not create reliable agency. |
| High | High | Necessary technical conditions for rapid delegation are present. |

The demand bridge then asks whether `Cops` can support the relevant population at the token intensity implied by the capability stage. Distribution, price, trust, permissions, and product UX determine whether that capacity becomes actual delegation.

## Update protocol

1. Add every material model-plus-harness result with model, harness, benchmark version, tools, budget, cost, and observation date.
2. Run frozen-harness comparisons when possible to attribute model gains; run same-model paired harness tests to attribute harness gains.
3. Add data-center milestones as dated rows. Move IT power from pipeline to observed operational supply only when commissioning evidence supports it.
4. Append monthly operational IT-power snapshots and comparable measured reference-token-productivity observations, preserving H100e as an audit-only cross-check; refit their log slopes separately.
5. Re-estimate each archetype's token mix when telemetry or a material capability-stage change appears.
6. Report supported-user ranges across supply, model, utilization, and goodput assumptions; never publish one number without the assumptions beside it.

The evidence workbook implementing these definitions is `personal-ai-system-capability-and-data-center-buildouts.xlsx` in the thread output folder.
