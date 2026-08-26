# Measuring the consumer outcome

**Revised:** 25 August 2026
**Status:** Consumer Delegation Success Rate is the forecast's resolution outcome, not one of its causal success-compression metrics. The causal framework is now [model-plus-harness system capability plus operational AI-compute capacity](02-success-compression-metrics.md), with tokens per user per day as the supply-to-adoption bridge. MyPCBench remains the closest frozen consumer outcome reference and Remote Labor Index a professional-work comparator.

## The correction

Remote Labor Index measures automation of remote paid work. That is relevant to economically valuable agents, but it samples the wrong world for a forecast about consumer personal AI. A consumer delegates vacations, flights, bills, reimbursements, shopping, reservations, email, calendars, accounts, forms, files, and recurring household administration—not a representative portfolio of Upwork projects.

The closest existing benchmark is [MyPCBench](https://github.com/ljang0/MyPCBench), explicitly designed for “personally intelligent computer-use agents.” It places the agent inside one coherent, pre-authenticated digital life containing banking, travel, food delivery, email, calendar, messaging, work, tax, browser history, orders, rides, and documents.

Its 184 tasks were adapted from real OpenClaw personal-assistant requests. Examples include ordering the user's usual food, inferring normal tipping behavior, and paying back a contact. Of the tasks, 112 require actions and 68% span multiple applications. This is much closer to the forecast's construct than remote labor.

## Why MyPCBench is not a live SCM

For comparable MyPCBench version 0.1 observations, define:

> **Frontier Personal Task Completion at time _t_ = the highest MyPCBench Perfect Task Rate achieved by a publicly available agent system released by _t_, evaluated on the unchanged persona, task set, rubric, step limit, environment, and judging procedure.**

“Perfect” is strict: every rubric criterion for the task must pass. Partial rubric credit remains diagnostic and does not count as completion.

The current canonical 100-step joint results include:

| System | Release date | Perfect Task Rate |
|---|---:|---:|
| Claude Opus 4.6 | 5 Feb. 2026 | **58.2%** |
| GPT-5.4 mini | 17 Mar. 2026 | 23.9% |
| GPT-5.5 | 23 Apr. 2026 | 45.1% |
| GPT-5.6 Sol | 9 July 2026 | 55.4% |

GPT-5.5 to GPT-5.6 Sol improved 10.3 percentage points in the same evaluation. The canonical frontier has remained 58.2% since Opus 4.6. On tasks spanning seven or more applications, the leader falls to about 36%, GPT-5.6 to 18%, and GPT-5.5 to 9%. [MyPCBench results](https://github.com/ljang0/MyPCBench#results)

The live board also lists a self-reported Opus 4.8 result of 62.0%, but that run uses a 200-step budget rather than the canonical 100 steps. More importantly, it has no Opus 5 or Fable 5 evaluation. MyPCBench therefore has excellent construct validity but inadequate release coverage and protocol consistency for a live frontier metric. It cannot yet supply a twelve-month slope or a current frontier.

## Why it remains the best consumer benchmark reference

### Construct coverage

A high Perfect Task Rate requires the agent to combine:

- user-specific context across accounts and history;
- computer use, structured tools, files, and applications;
- cross-source reasoning and preference inference;
- long-horizon cross-app state maintenance;
- action execution, artifact production, and outcome verification;
- an agent harness capable of completing the whole request.

The metric therefore compresses much of the model, memory, computer-use, integration, and harness evidence already in the project.

### Outcome proximity

Higher perfect completion expands the set of ordinary personal outcomes a user can hand over. That should reduce the need to perform the corresponding interactions manually and create a direct path from capability to adoption.

### Intervention relevance

Holding the personal environment and tasks fixed, an intervention that raises strict completion directly increases what the consumer could delegate. That makes it a useful transmission and outcome check even though capability horizon and delivered inference per dollar are the forecast's causal SCMs.

## The single metric we actually want

> **Consumer Delegation Success Rate = Σ task-frequency weight × successful unattended completion**

A task counts as successful only when the intended final state is correct, no critical safety or policy error occurs, agent cost stays below a task-specific ceiling, and required human attention stays below a preset limit.

The frequency weights should come from a prospective diary or telemetry sample of actual consumer requests. The evaluated system must be the newest publicly available **agent product**, including its harness, permissions, connectors, memory, and computer-use environment—not merely a base model. Without the weights and current product coverage, a benchmark score cannot be interpreted as “percentage of user interactions.”

## Why the alternatives are secondary

| Candidate | Useful signal | Why it is not the consumer SCM |
|---|---|---|
| Remote Labor Index Automation Rate | Professional artifact quality, economic substitution, harness capability, fixed inference budget | Samples paid freelance work rather than a consumer's personal digital life. [RLI](https://www.remotelabor.ai/) |
| OSWorld 2.0 binary completion | Long-horizon desktop workflows and strict completion | Mixes everyday and professional tasks without one persistent personal identity or consumer task-frequency weights. [OSWorld 2.0](https://osworld-v2.xlang.ai/) |
| METR 80% task horizon | Longitudinal reliability and task length | Concentrated in software, ML, and cybersecurity. [METR](https://metr.org/time-horizons/) |
| Agents' Last Exam | Broad occupational workflows and artifact production | Intentionally measures professional occupations rather than ordinary personal administration. [ALE](https://rdi.berkeley.edu/blog/agents-last-exam/) |
| Subscriptions or monthly users | Distribution and broad adoption | Does not distinguish chatting from delegating completed personal outcomes. |

## How to use it in the prediction

Do not designate a current benchmark as the primary observed input. Use MyPCBench Perfect as a frozen construct-validity reference, its seven-plus-app slice as a complexity audit, and current OSWorld 2.0 results as a faster but less personal release signal. Neither substitutes for Consumer Delegation Success Rate.

Keep three transmission checks outside the headline metric:

1. **Distribution:** is this capability available to the forecast population at an ordinary price?
2. **Intensive use:** are people repeatedly delegating tasks rather than using chat?
3. **Behavioral transmission:** after capability rises, does the share of completed consumer task episodes actually delegated rise within the forecast lag?

The normalized comparable observations are stored in the supporting registry and observations of the current snapshot's [`capability-benchmarks.json`](../../data/snapshot-20260826/capability-benchmarks.json). A new model or harness result enters a new snapshot only when it uses the canonical protocol. A changed persona, task set, rubric, judge, environment, or step budget begins a new benchmark ID; self-reported 200-step results must not be spliced into the 100-step series.

## Shelf life and Goodhart risks

Version or retire the metric if the task set leaks, agents are trained directly against it, the simulated apps cease to resemble ordinary products, the judge changes materially, or the benchmark saturates. A successor should use multiple personas, actual consumer task-frequency weights, fixed cost and human-attention budgets, critical-error reporting, and prospective hidden tasks.
