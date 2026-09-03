# Agent benchmark velocity: the last twelve months

**Measurement window:** 3 September 2025–3 September 2026

**Evidence cutoff:** 3 September 2026
**Companion data:** the `capability-benchmarks`, `frontier-capability-signals`, and `metr-task-horizon` logical datasets in [`gate1-consolidated.json`](../../data/snapshot-20260903-2/gate1-consolidated.json)

## Bottom line

For the question “how quickly is model capability advancing?”, **METR's standardized 50%-success task horizon is the primary success-compression metric**. Its official raw-data fit implies a 187.8-day all-time doubling time and 128.7 days for releases from 2023 onward; the GPT-5-to-Mythos endpoint comparison implies about 102.8 days. This suggests acceleration but does not yet establish it statistically. The remaining benchmarks diagnose breadth, consumer relevance, and harness effects:

| Capability | Comparable observed window | Earlier → later | Change | What can be inferred |
|---|---:|---:|---:|---|
| Personal authenticated multi-app work, MyPCBench Perfect | Canonical joint evaluation of Feb.–July 2026 releases | 23.9%–58.2%; GPT-5.5 → GPT-5.6: 45.1% → 55.4% | **+10.3 pp within GPT** | Closest frozen consumer reference, but not a current frontier: Opus 5 and Fable 5 are missing, and noncanonical submissions use a different step budget. |
| Long-horizon technical work, METR 50% horizon | Aug. 2025 → Apr. 2026 | 203 → 1,045 minutes | **5.15×** | A recent implied doubling about every **103 days**, although METR warns that the final estimate above 16 hours is unreliable. |
| Long-horizon technical work, METR 80% horizon | Aug. 2025 → Apr. 2026 | 38.3 → 185.9 minutes | **4.85×** | Higher-reliability capability moved almost as quickly as the 50% horizon; it did not merely trade reliability for length. |
| Desktop computer use, OSWorld-Verified frontier | Sep. 2025 → Apr. 2026 | 61.4% → 78.7% | **+17.3 pp** | The remaining error fell about **45%** in 206 days. This benchmark is now too easy to stand alone. |
| Banking knowledge, tools, and policy, τ³ frontier | Sep. 2025 → Jul. 2026 | 25.3% → 55.2% | **+29.9 pp** | The system frontier more than doubled, but leaderboard entries use different retrieval and reasoning configurations. |
| Long-horizon computer use, OSWorld 2.0 partial score | Jul. 2026 → Sep. 2026 model generations | GPT-5.6 Sol 65.7% → GPT-6 Astra 72.6%; Fable 5.1 77.9% | **+6.9 pp within OpenAI** | Fast recent progress on partial completion, but vendor configurations differ. Anthropic separately reports 41.7% strict completion for Fable 5.1. |
| Personal authenticated multi-app work, MyPCBench | Apr. 2026 → Jul. 2026 model generations | 45.1% → 55.4% perfect | **+10.3 pp** | GPT-5.6 improves markedly on GPT-5.5, but the comparable canonical 100-step frontier is the older Opus 4.6 system at 58.2%; newer agents are missing. |
| Broad professional workflows, Agents' Last Exam | Jul. 2026 → Sep. 2026 | GPT-5.6 Sol 53.6% → GPT-6 Astra 59.3% | **+5.7 pp** | Broad work improved, though much more slowly than abstract reasoning. The provider table is supporting evidence, not the original ALE-CLI launch series. |
| Cross-application automation, AutomationBench public 600-task table | May 2026 → Jul. 2026 releases, observed Sep. 2026 | Claude Opus 4.8 41.0% → Claude Opus 5 50.3% | **+9.3 pp** | Direct forecast input. The live repository rescored Opus 4.8 upward from the 30.33% preserved in the August snapshot, so the new snapshot uses the current coherent table while retaining the old publication as an immutable audit record. |
| Abstract interactive reasoning, ARC-AGI-3 | Jul. 2026 → Sep. 2026 | GPT-5.6 Sol 7.8% → GPT-6 Astra 62.7% on ARC Prize's standard harness / 99.9% with OpenAI's provider adapter | **Large harness-sensitive leap** | ARC Prize independently confirms a major jump and unusually high action efficiency. It helps qualify Astra's overall frontier shock but is not itself converted into a delegation percentage. |
| Frontier mathematical reasoning, FrontierMath Tier 4 | Sep. 2026 | GPT-6 Astra 98.0% | **Near saturation** | Vendor-reported maximum-at-any-effort result; strong capability evidence, but not a direct economic-delegation outcome. |
| Offensive cyber capability, ExploitBench | Sep. 2026 | GPT-6 Astra 100.0% | **Saturated** | Capability and safety signal accompanying OpenAI's Critical cyber designation; excluded from the Personal-AI delegation fit. |
| Economically valuable remote work, RLI Automation Rate | Aug. 2025 → June 2026 | 1.67% → 15.80% | **9.46×; +14.13 pp** | Strong system progress under a fixed task budget, but the projects represent professional freelancers rather than consumer personal tasks. |
| AI-research capability, OpenAI RSI Index | Apr. 2026 → Jul. 2026 | 41.7% → 57.9% | **+16.2 pp** | A large one-generation increase on an internal, non-independent benchmark. |
| Year-long simulated business, Vending-Bench 2 | Release-date fit through current models | — | **+$734/month**, R²=.96 | Long-horizon business performance has a strong release-date trend, but dollars, run variance, and benchmark-specific strategy make it unsuitable as a general pass rate. |

The result is not “agents are now 60% capable.” The result is narrower: **the model-plus-harness frontier has been moving fast enough to make a six-to-twelve-month capability shock plausible, while strict end-to-end completion on hard, personal, and cross-application work remains well below dependable autonomy.**

## Consumer outcome reference

The forecast resolves against **Consumer Delegation Success Rate**: the frequency-weighted share of eligible consumer digital task episodes completed end-to-end by the latest publicly available agent product, subject to correct final state, no critical error, and fixed cost and human-attention ceilings. It is the dependent outcome rather than a causal SCM.

MyPCBench shows what the task environment should resemble: its 184 tasks are adapted from real OpenClaw personal-assistant requests inside one coherent pre-authenticated digital life containing banking, travel, food, email, calendar, messaging, tax, orders, rides, browsing, and files. [MyPCBench](https://github.com/ljang0/MyPCBench)

But it is not a live outcome measure. The canonical table's newest OpenAI system is GPT-5.6 Sol, while Opus 5, Fable 5.1, and GPT-6 Astra are absent; the dynamic board's newer self-reported Opus 4.8 score uses 200 rather than 100 steps. It also lacks task-frequency weights, multiple personas, cost and attention constraints, and real-world adoption. The full measurement-gap analysis is in [the consumer-metric assessment](03-consumer-delegation-metric.md); comparable history remains in the supporting observations within [`gate1-consolidated.json`](../../data/snapshot-20260903-2/gate1-consolidated.json).

## 1. What counts as a time series

Three kinds of curves must be kept separate.

1. **Repeated evaluation on a fixed benchmark.** This is the best evidence. METR periodically reevaluates released systems on Time Horizon 1.1; current provider tables also evaluate two generations under one stated configuration.
2. **Retrospective release-date curve.** A current leaderboard evaluates old and new models now, then plots each result at the model's release date. τ³, MyPCBench, and Vending-Bench 2 mostly work this way. It estimates generational progress, not what the leaderboard actually showed on that historical day.
3. **Benchmark reset.** A harder successor starts a new series. OSWorld-Verified and OSWorld 2.0 cannot be connected as though a score fell from 78.7% to 20.6%. The task distribution and metric changed.

For a fixed bounded benchmark (b), define the release frontier as:

> **F_b(t) = the best score achieved by a system released on or before date t under a comparable evaluation configuration.**

Also retain a same-vendor or same-harness series even when it is below the frontier. That helps distinguish broad model progress from a one-off configuration advantage.

For pass rates, track both percentage-point change and remaining error:

> **remaining error = 1 − score**

The error view avoids claiming that a move from 90% to 95% is smaller than 40% to 45%; the former removes half of the residual failures. For METR horizons, model the logarithm of minutes because an exponential curve fits much better than a linear one. For Vending-Bench profit, preserve the benchmark author's dollar-per-month fit rather than forcing it into a pass-rate index.

## 2. The computer-use curve

### OSWorld-Verified: fast progress and then saturation

The cleanest recent release-frontier sequence is:

| Model | Release date | OSWorld-Verified |
|---|---:|---:|
| Claude Sonnet 4.5 | 29 Sep. 2025 | 61.4% |
| Claude Opus 4.5 | 24 Nov. 2025 | 66.3% |
| Claude Opus 4.6 | 5 Feb. 2026 | 72.7% |
| GPT-5.4 | 5 Mar. 2026 | 75.0% |
| GPT-5.5 | 23 Apr. 2026 | 78.7% |

This is a **17.3-point gain in 6.8 months**, or a reduction in remaining error from 38.6% to 21.3%. A naive linear extension would cross 100%, which is a warning that the benchmark is saturating—not a forecast. The correct move is to retire it as the main adoption proxy and preserve it only as a regression and low-complexity computer-use check. [Anthropic Sonnet 4.5](https://www.anthropic.com/news/claude-sonnet-4-5), [Anthropic Opus 4.6 system card](https://www-cdn.anthropic.com/6a5fa276ac68b9aeb0c8b6af5fa36326e0e166dd.pdf), [OpenAI GPT-5.4](https://openai.com/index/introducing-gpt-5-4/), [OpenAI GPT-5.5](https://openai.com/index/introducing-gpt-5-5/)

### OSWorld 2.0: the harder replacement

OSWorld 2.0 contains 108 workflows with a median human operation time around 1.6 hours and more than 250 average agent steps. OpenAI's current release table reports partial reward rising from 65.7% for GPT-5.6 Sol to 72.6% for GPT-6 Astra, while Anthropic reports 77.9% partial and 41.7% strict completion for Fable 5.1. Under the benchmark authors' earlier strict 500-step binary metric, GPT-5.5 plateaued near 13% and Opus 4.8 reached 20.6%. [OSWorld 2.0](https://osworld-v2.xlang.ai/), [paper record](https://arxiv.org/abs/2606.29537), [GPT-6 Astra](https://openai.com/index/gpt-6-astra/), [Fable 5.1](https://www.anthropic.com/claude-fable-and-mythos-5-1)

These figures answer different questions:

- Partial reward asks whether the agent made useful progress through the workflow.
- Binary completion asks whether it actually finished the user's whole job.
- Adoption can respond to partial progress for supervised work, but majority delegation requires binary completion, low critical-error rates, and inexpensive recovery.

The forecast should therefore update from OSWorld 2.0 **binary completion at a normal user budget**, not from partial credit alone.

### MyPCBench: the closest current personal-agent test

MyPCBench uses 184 tasks across 17 pre-authenticated web apps plus Firefox and LibreOffice, with a coherent personal history and 68% multi-app tasks. Its current joint evaluation shows GPT-5.5 at 45.1% perfect and GPT-5.6 Sol at 55.4%, while Claude Opus 4.6 remains first at 58.2%. On tasks involving seven or more apps, even the leader is only about 36% perfect. [MyPCBench](https://github.com/ljang0/MyPCBench/blob/main/README.md)

This benchmark is too new to have a genuine twelve-month history. Its model release-date plot is still valuable, but it must be labeled **retrospective**. The key finding is not a smooth frontier advance; it is a large within-family gain alongside a frontier plateau and a severe complexity penalty.

## 3. Integrations, policy, and business operation

### τ³ Banking

The τ³ Banking system frontier progresses from 25.3% for Claude Sonnet 4.5 in September 2025 to 32.2% for GPT-5.2, 39.4% for GPT-5.4, 44.6% for GPT-5.5, and 55.2% for Qwen 3.8 Max in July 2026. That is a **29.9-point increase in 9.6 months** and a 40% reduction in residual failures. [τ³ leaderboard](https://taubench.com/leaderboard/?benchmark=knowledge)

This is a system leaderboard: retrieval mode, reasoning effort, and tool exposure differ. That is not a defect for the personal-agent forecast, because users receive a system rather than a base model. It does mean the curve must be called **model-plus-harness frontier**, not model intelligence.

Absolute performance remains the check against exuberance. A top pass@1 of 55.2% is not sufficient for unsupervised banking, especially without a separate critical-policy-violation rate.

### Vending-Bench 2

Andon Labs reports a Western frontier fit of **+$734 in ending balance per month of model release date, R²=.96**. Current means include $8,018 for Opus 4.6, $10,937 for Opus 4.7, and $11,182 for Opus 5; GPT-5.5 and GPT-5.6 Sol move from $7,524 to $9,619. [Vending-Bench 2](https://andonlabs.com/evals/vending-bench-2)

This is meaningful evidence of improving long-run coherence, tool use, product sourcing, and strategy. It is not a general business-autonomy percentage. The metric is stochastic, standard errors are large, and a model can make money while still behaving unsafely or requiring unrealistic affordances.

## 4. A provisional personal-agent capability basket

No published index yet combines the capabilities in the user catalog. A provisional basket can be calculated only when the same two systems appear on a common set of current evaluations. For GPT-5.5 and GPT-5.6 Sol, four relevant comparisons are available:

| Component | GPT-5.5 | GPT-5.6 Sol |
|---|---:|---:|
| OSWorld 2.0 partial reward | 47.5 | 62.6 |
| MyPCBench perfect | 45.1 | 55.4 |
| Agents' Last Exam | 46.9 | 52.7 |
| AutomationBench | 12.9 | 18.1 |
| **Geometric mean** | **33.7** | **42.7** |

The experimental basket rises **26.4% over 77 days**. The geometric mean is preferable to an arithmetic average because a near-zero integration score should bottleneck an end-to-end agent rather than be washed out by a strong desktop score.

This is a diagnostic, not a publishable index. The four evaluations are not independent; one uses partial credit; MyPCBench uses a native provider harness; and the benchmark owners differ. Do not annualize the 26.4% increase from one model-generation step. Its proper use is to establish a baseline for a prospectively frozen basket.

## 5. Where a twelve-month slope does not yet exist

Several important dimensions have current baselines but no defensible fixed-test year curve:

- **Hallucination/factuality:** vendors report large relative reductions, but the test sets and error definitions change. Do not splice “60% fewer errors” claims into a synthetic time series.
- **Persistent memory and personalization:** LongMemEval and newer personal-agent suites provide baselines, but no repeated frontier series yet.
- **Continual learning:** current work mostly demonstrates that memory retrieval is not the same as accumulating reusable skills. There is no mature monthly frontier series.
- **Critical safety, prompt injection, and recovery:** results are commonly reported under changing defenses and attack sets. Track attack success, harmful-action rate, recoverability, and confirmation burden separately.
- **New hard suites:** WindowsWorld, SaaS-Bench, WeaveBench, AppWorld-UL, and similar 2026 benchmarks begin new curves; they cannot supply twelve months of observations retrospectively.

An absence of history is itself informative. The evaluation ecosystem is repeatedly introducing harder, more realistic tasks because prior benchmarks saturate before agents are dependable in ordinary life.

## 6. How this enters the adoption forecast

The forecast's causal assumption is that adoption rises with **effective end-to-end capability**, after a lag. Consumer Delegation Success Rate is the resolution outcome, but it is not currently observed. Astra requires the model to distinguish two questions: the direct economic basket estimates the delegation level, while independently corroborated, cross-domain frontier jumps can advance the trajectory. Epoch's record ECI result, its domain-suite records, ARC Prize's standard/provider and action-efficiency results, and OpenAI's broader release portfolio jointly qualify Astra; ARC-AGI-3 alone does not. Interpret the proxy evidence through the following latent construct:

> effective capability = coverage × full completion × affordability × recoverability × personal fit

MyPCBench, its complexity slice, OSWorld 2.0, adoption series, and agent-product releases should be triangulated rather than averaged into a synthetic headline index. A 90% visual-control score cannot compensate for low full-workflow completion or a critical-action error rate that makes the agent unsafe to leave unattended.

The past twelve months justify a stronger prior on rapid capability growth. They do **not** by themselves establish the elasticity from capability to delegation. The forecast should rise only when capability gains coincide with lower supervision burden and then transmit into repeated task-level use after the prespecified population lag.

### Recommended monthly update rule

For each benchmark snapshot, record:

- evaluation date and model release date;
- benchmark version or commit;
- full-completion and partial-credit scores separately;
- tools, retrieval, reasoning effort, step/token budget, and safety configuration;
- cost, latency, human interventions, verification, and recovery;
- independent versus vendor-run status.

Maintain four outputs:

1. fixed-benchmark frontier envelope;
2. same-vendor or same-harness generational series;
3. harder-benchmark reset ledger;
4. controlled harness ablations for the same model.

Re-estimate a slope only after at least three comparable release points or two independent repeats. Do not change the delegation forecast from a single benchmark maximum, partial score, model announcement, or community result on a different evaluation track.

Operationally, new results are added to the relevant source file under a new snapshot's `gate1-sources/` directory. Source fragments target the `capability-benchmarks`, `frontier-capability-signals`, `metr-task-horizon`, or `adoption` logical dataset, and the consolidator preserves those distinctions inside `gate1-consolidated.json`. This prevents a product rollout from being mistaken for a benchmark gain while allowing a qualified broad capability shock to influence the trajectory. The complete relationships and update rules are in the [forecast data structure](05-data-structure.md).

## 7. Forecast-relevant interpretation

The evidence supports three conclusions.

1. **The upside case is no longer speculative.** Long-horizon technical capability increased roughly fivefold inside eight months, fixed desktop performance removed nearly half its remaining error, and integrated banking systems gained about 30 points.
2. **The median personal-agent bottleneck is still end-to-end reliability.** The harder OSWorld 2.0 binary metric is near 20%, AutomationBench is 18.1%, MyPCBench is below 60% perfect, and multi-app complexity sharply lowers completion.
3. **Harness progress belongs inside the forecast variable.** The best current curves measure systems with tools, retrieval, reasoning budgets, and provider-native agent loops. They predict product capability better than naked-model scores, provided configuration changes are recorded rather than hidden.

That combination—fast slope, low hard-task base, and large harness sensitivity—is precisely why a 6–12 month prediction can be both plausible and risky.
