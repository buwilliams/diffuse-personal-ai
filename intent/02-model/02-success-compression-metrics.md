# Two-model framework and success-compression metrics for personal AI

**Framework date:** 26 August 2026
**Forecast outcome:** the share of eligible consumer digital task episodes delegated to personal AI

## Decision

The forecast has two linked models:

1. **Supply and demand:** operational inference supply versus capability-induced tokens per user per day.
2. **Model-harness capability:** risk-adjusted, economically valuable stewardship under feedback, resource, authority, and reliability constraints.

The success-compression metrics are summary variables inside those models:

- **Economic Stewardship Horizon (`ESH50`)** is the preferred capability metric. Until a stable stewardship suite exists, the model-plus-harness task horizon (`Hsys50`) is its interim trend proxy.
- **Operational-compute capacity (`Cops`)** is the supply metric: energized accelerator capacity at covered AI data centers, expressed in H100-equivalents and translated into tokens by workload-specific serving goodput.

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

METR TH1.1 reports P50 doubling times of **196.5 days all-time**, **130.8 days for releases since 2023** with a 107–161 day interval, and **88.6 days since 2024**. The shorter windows suggest acceleration, but task composition, evaluation changes, a small number of frontier points, and a rising measurement ceiling make this directional rather than conclusive. [METR TH1.1 results](https://metr.org/blog/2026-1-29-time-horizon-1-1/)

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

## Supply-model metric: operational AI-compute capacity

Define:

> `Cops(t) = Σ operational H100-equivalent accelerator capacity at sites inside a fixed public-coverage rule`

The infrastructure doubling time is:

> `Tcompute = ln(2) / d ln Cops(t)/dt`

Only energized and operational capacity counts. Announced gigawatts, land purchases, permits, buildings under construction, cooling capacity, and ordered chips belong in a separate pipeline:

> `Cpipe(t,q) = dated projected H100e expected online by quarter q`

`Cpipe` is a lead indicator. It does not enter `Cops` until commissioning evidence appears.

Epoch AI's maintained data-center tracker covered **83 sites, 14.4 million operational H100-equivalents, and 13 GW of IT power** on 24 August 2026. This is a rigorous public tracker, not a complete global census. [Epoch AI data centers](https://epoch.ai/data/ai-data-centers)

Reconstructing the latest operational state of every covered site at each month-end gives a current-dataset series rising from approximately **0.60 million H100e in August 2024 to 14.41 million in August 2026**. A log-linear fit implies a doubling time of approximately **156 days**; the endpoint estimate is 158 days, and the last-twelve-month endpoint estimate is 163 days. These are derived estimates and will change when Epoch revises historical site timelines. [Epoch timeline CSV](https://epoch.ai/data/data_centers/data_center_timelines.csv)

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

For a scenario with inference allocation `s`, sustained utilization `u`, serving-goodput multiplier `g`, active parameter count `N`, and overhead `k`, a first-order capacity estimate is:

> `tokens/day = Cops × 1.979e15 × 86,400 × s × u × g / (2Nk)`

and:

> `supported users of archetype a = tokens/day / τa`

This is a scenario calculator, not a point forecast. It must vary inference allocation, utilization, active parameters, token mix, context length, latency target, and model architecture.

The archetypes should span at least:

- casual assistant;
- daily copilot;
- delegating agent;
- high-autonomy personal AI;
- agentic software builder;
- continuous digital proxy.

The key uncertainty is rebound. As capability rises, one user may consume orders of magnitude more tokens because the agent tackles longer tasks, runs parallel branches, verifies results, and maintains memory. Faster chips may therefore produce more intelligence per user rather than proportionally more users.

Epoch H100e already converts newer accelerators into H100-equivalent peak 8-bit compute. Do not multiply `Cops` again by a chip-generation factor. Add a separate goodput multiplier only for serving gains not captured by peak operations—memory bandwidth, interconnect, latency-aware scheduling, caching, quantization, and software.

The emerging inference architectures make it necessary to preserve the performance basis:

- NVIDIA reports workload-specific gains ranging from a **4× software throughput improvement** on GB200 over three months to **up to 10× throughput per watt** for Vera Rubin over Blackwell. [NVIDIA performance hub](https://developer.nvidia.com/deep-learning-performance-training-inference), [Rubin architecture](https://developer.nvidia.com/blog/inside-nvidia-rubin-gpu-architecture-powering-the-era-of-agentic-ai/)
- Cerebras says CS-4 can generate tokens **up to 30× faster than production GPU systems**, exceed 1,000 tokens/second on models over 10 trillion parameters, and deliver up to 10× more throughput per watt than CS-3. The 30× figure is primarily a speed/interactivity claim, not evidence that a whole mixed fleet serves 30× as many users per megawatt. [Cerebras CS-4](https://www.cerebras.ai/cs4)
- OpenAI's first Jalapeño results are more granular. Across GPT-OSS 120B, DeepSeek R1, and Kimi K2.5, it reports **1.5–1.9× more peak work per watt**, **1.7–3.6× lower end-to-end latency**, and **2.1–4.1× higher highly interactive performance** than GB200/GB300 comparisons. The reported **53.7×, 104.3×, and 56.1×** gains are throughput per kilowatt at the GPU system's *previous-best time-between-tokens* operating point. Thus “more than 50×” is real within that matched-interactivity comparison, but it is not the general peak-throughput multiplier. OpenAI plans deployment by the end of 2026. [OpenAI Jalapeño results](https://openai.com/index/jalapeno-first-results/)

The workbook therefore models a specialized architecture with `fleet multiplier = 1 + deployment share × (relative goodput − 1)`. It keeps peak-throughput, per-user speed, and matched-latency goodput as separate scenarios rather than blending them into one chip score.

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
3. Add data-center milestones as dated rows. Move capacity from pipeline to operational only when commissioning evidence supports it.
4. Append a monthly aggregate operational H100e snapshot and refit 12- and 24-month log slopes.
5. Re-estimate each archetype's token mix when telemetry or a material capability-stage change appears.
6. Report supported-user ranges across supply, model, utilization, and goodput assumptions; never publish one number without the assumptions beside it.

The evidence workbook implementing these definitions is `personal-ai-system-capability-and-data-center-buildouts.xlsx` in the thread output folder.
