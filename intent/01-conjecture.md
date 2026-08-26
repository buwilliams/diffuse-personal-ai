# Personal AI delegation forecast

**Forecast origin:** 25 August 2026

**Resolution dates:** 25 February 2027 and 25 August 2027
**Evidence cutoff:** 25 August 2026

## Executive judgment

The original claim—“Personal AI will do 50% of interactions for users”—is directionally meaningful but not yet forecastable. “Users,” “interactions,” “doing,” and even “Personal AI” can each move the result by an order of magnitude. Counting clicks, messages, tokens, or background tool calls would also let a more verbose harness appear to automate more work without saving more human time.

The strongest resolvable version is:

> **Among US active paid users of a general-purpose AI product, at least 50% will delegate at least 50% of their eligible digital task episodes to a general-purpose agent during the preceding four weeks.**

My current probabilities are:

| Resolution date | Probability |
|---|---:|
| 25 February 2027 | **60%** |
| 25 August 2027 | **85%** |

The original 50%/80% intuition is therefore defensible—and slightly conservative at twelve months—if it applies to a selected, already-paying population and we explicitly assume that rising usable agent capability produces rising adoption. It remains too high if “users” means all internet users.

| Population to which the same 50%-of-tasks threshold is applied | Feb. 2027 | Aug. 2027 |
|---|---:|---:|
| Active paid general-purpose AI users in the US | **60%** | **85%** |
| Weekly general-purpose AI users in the US | 40% | 70% |
| All US digital knowledge workers | 20% | 50% |
| All global internet users | 4% | 18% |

These are probabilities that the cohort crosses the threshold—not forecasts of the eventual percentage delegated. They should not be merged into one headline.

## Resolution protocol

The forecast needs a prospective measurement instrument; no public dataset currently measures the claimed behavior.

- **Personal AI / general-purpose agent:** a system that can plan and execute a user goal across more than one app, website, or local tool and can retain user-specific context across sessions. A single-purpose recommender or ordinary chatbot answer does not qualify.
- **Active paid user:** a US adult covered by a paid individual or employer plan who used the product on at least four days in the preceding 28 days.
- **Eligible digital task episode:** a user goal that can in principle be completed using a networked computer. Physical work and tasks legally requiring a human actor are excluded. One goal is one episode, regardless of the number of prompts, clicks, tokens, or tool calls.
- **Delegated / agent-led:** the user states the goal and may set constraints, approve consequential actions, or review the result, while the agent performs at least half of the state-changing subtasks needed to complete the goal. Recommendation-only use is assisted, not delegated.
- **50% threshold:** at least half of the eligible task episodes recorded for an individual are agent-led; at least half of the measured cohort must meet that individual threshold.
- **Measurement:** preregister a four-week activity diary for a representative panel of at least 2,000 qualifying adults, validate a subsample against device or vendor telemetry, and publish task-level coding. Resolve “yes” only if the weighted point estimate is at least 50%; treat a 95% confidence interval crossing 50% as indeterminate until a prespecified follow-up.

This operationalization follows the attached paper’s important distinction between assistance and delegation. It also reflects the broader source argument more accurately as: **value chooses the mission; risk controls the size of the experiment; reliability governs production authority.** Reliability is a gating variable for authority, but usefulness and saved time can produce rapid adoption before reliability is complete.

## 1. Distribution: how many people are in reach?

Public reporting is asymmetric. OpenAI and xAI disclose usable counts; Anthropic does not disclose consumer subscriptions; OpenClaw is open-source software and has no product subscription count. Unknowns should remain unknown rather than being filled with app-download estimates.

| Product | Best public count | What it actually measures | Forecast use and caveat |
|---|---:|---|---|
| ChatGPT / OpenAI | **More than 50 million consumer subscribers** reported by Sam Altman in February 2026; OpenAI later reported more than **1 billion people** using ChatGPT. Codex exceeded **5 million weekly active users** by June. | Paid consumer plans; broad ChatGPT reach; selected Codex usage | The best scale evidence, but ChatGPT use is not agent delegation and Codex users are a highly selected early-adopter population. [AP subscriber report](https://apnews.com/article/a0a915c32b85337d799fe2f9525a932a), [OpenAI reach](https://openai.com/index/how-the-world-is-putting-chatgpt-to-work/), [Codex reach](https://openai.com/index/codex-for-knowledge-work/)
| OpenAI business | **More than 1 million business customers** and **more than 7 million ChatGPT for Work seats** as of November 2025. | Organizations paying for ChatGPT Work or the API; Work seats | A distribution rail, not a count of active agents. [OpenAI](https://openai.com/index/1-million-businesses-putting-ai-to-work/)
| Claude / Anthropic | Consumer subscribers **not disclosed**. Anthropic reported **more than 300,000 business customers** in September 2025; Claude Code’s annualized revenue exceeded **$2.5 billion** by February 2026, while its weekly users had doubled since January. | Business accounts and revenue/growth—not unique consumer subscribers | Strong commercial momentum, but it cannot be converted responsibly into people or subscriptions without pricing and mix. [September disclosure](https://www.anthropic.com/news/anthropic-raises-series-f-at-usd183b-post-money-valuation), [February disclosure](https://www.anthropic.com/news/anthropic-raises-30-billion-series-g-funding-380-billion-post-money-valuation)
| Grok / xAI | **6.3 million active paid subscriptions** at 31 March 2026: 4.4 million X subscriptions and 1.9 million SuperGrok/Heavy/Lite; **117 million monthly users** used Grok features. | Paid plans that include Grok; Grok-feature monthly users | The cleanest audited current disclosure, but many paid X users may not delegate tasks. [SEC filing](https://www.sec.gov/Archives/edgar/data/1181412/000162828026039276/spaceexplorationtechnologi.htm)
| OpenClaw | No subscription. On 25 August 2026 its GitHub repository had **387,590 stars** and **81,363 forks**; the npm package recorded **11.37 million downloads** over the preceding month. | Developer interest, code forks, and package downloads | None is a unique-user, active-install, or paid-subscription measure. Automated installs and upgrades can create many downloads per user. [GitHub API](https://api.github.com/repos/openclaw/openclaw), [npm](https://api.npmjs.org/downloads/point/last-month/openclaw), [project](https://openclaw.ai/)

For scale, the ITU estimates that **6 billion people** were online in 2025. Even one billion ChatGPT users would be about one-sixth of that denominator before asking whether they use an agent, whether use is weekly, and whether half their eligible tasks are delegated. This is why the global-population version receives a much lower forecast. [ITU](https://www.itu.int/en/mediacentre/Pages/PR-2025-11-17-Facts-and-Figures.aspx)

### The most important early behavioral evidence

OpenAI reports that in May 2026, among individual Codex users, 80.6% made at least one request estimated to require more than 30 minutes of human work, 70.2% made one exceeding an hour, and 25.6% made one exceeding eight hours. At the 99th percentile, heavy users orchestrated more than 60 agent-hours per day. This is strong evidence that real users delegate long tasks, but it says nothing about the fraction of *all* their eligible task episodes and comes from a selected population. [OpenAI](https://openai.com/index/how-agents-are-transforming-work/)

Among enterprise customers, Codex produced 64% of the combined ChatGPT-plus-Codex output tokens by June 2026. Frontier firms produced 8.3 times as many output tokens per user as typical firms, and 21% used plugins weekly versus 9% of typical firms. This supports an agent-first diffusion path, but output-token share is not task share: agents naturally emit more tokens than chat. [OpenAI Signals](https://openai.com/signals/enterprise-data/)

## 2. Adoption velocity over the previous 12 months

Yes: the installed base should be treated as a time series, not a snapshot. The comparable public series show a consistent sequence: **broad AI reach is approaching maturity in digitally intensive cohorts; frequency and paid adoption are still deepening; agent adoption is growing much faster from a small base; majority task delegation remains unmeasured.**

| Adoption layer | Earlier observation | Latest comparable observation | Change | Interpretation |
|---|---:|---:|---:|---|
| ChatGPT reach | More than **700M weekly users**, July/September 2025 | More than **900M weekly users** by May 2026; more than **1B people** in an August disclosure that does not specify cadence | At least **+29%** on the comparable weekly measure in about ten months | Mass distribution is no longer speculative. The one-billion disclosure should not be silently treated as weekly active users, and none of these figures identifies computer-use or agent users. [OpenAI 2025](https://openai.com/index/how-people-are-using-chatgpt/), [OpenAI May 2026](https://openai.com/index/grupo-folha-grupo-uol-partnership/), [OpenAI August 2026](https://openai.com/index/how-the-world-is-putting-chatgpt-to-work/)
| ChatGPT paid consumers | Approximately **35M**, July 2025 | More than **50M**, February 2026 | At least **+43%** in seven months | Strong willingness to pay, although the earlier figure was reported from internal projections and OpenAI has not supplied a later comparable count. [Reuters/The Information](https://www.investing.com/news/stock-market-news/openai-projected-at-least-220-million-people-will-pay-for-chatgpt-by-2030-the-information-reports-4378677), [AP](https://apnews.com/article/a0a915c32b85337d799fe2f9525a932a)
| Codex weekly users | More than **3M**, April 2026 | More than **5M**, June 2026 | At least **+67%** in about two months | The most direct OpenAI agent-adoption series, but it begins with technically oriented early adopters and is not a 12-month history. [OpenAI April](https://openai.com/index/next-phase-of-enterprise-ai/), [OpenAI June](https://openai.com/index/codex-for-knowledge-work/)
| US work-related GenAI, any use | **31.0%** of workers, November 2024 | **40.7%**, November 2025 | **+9.7 pp / +31%** YoY | Broad workplace reach expanded substantially. “Any use” includes occasional assistance. [Federal Reserve](https://www.federalreserve.gov/econres/notes/feds-notes/monitoring-ai-adoption-in-the-u-s-economy-20260403.html)
| US work-related GenAI, weekly | **26.3%** of workers, November 2024 | **35.2%**, November 2025 | **+8.9 pp / +34%** YoY | A better intensive-margin measure, still not autonomous execution. [Federal Reserve](https://www.federalreserve.gov/econres/notes/feds-notes/monitoring-ai-adoption-in-the-u-s-economy-20260403.html)
| US non-work GenAI use | About **39.6%** of the population, November 2024 | About **50.0%**, November 2025 | **+10.4 pp / +26%** YoY | Consumer familiarity is now broad enough to reduce the learning barrier for personal agents. [Federal Reserve](https://www.federalreserve.gov/econres/notes/feds-notes/monitoring-ai-adoption-in-the-u-s-economy-20260403.html)
| US employees using AI at work | **46%**, Q4 2025 | **50%**, Q1 2026 | **+4 pp** QoQ | Gallup finds breadth still increasing, but only 28% used AI a few times a week and 13% daily in Q1. [Gallup](https://www.gallup.com/workplace/704225/rising-adoption-spurs-workforce-changes.aspx)
| Businesses paying for AI, Ramp sample | **35.0%**, March 2025 | **50.4%**, March 2026; **55.0%** by June | **+15.4 pp / +44%** YoY to March | Paid organizational adoption crossed a genuine threshold, but Ramp’s customers are not representative of all US businesses. [Ramp March](https://ramp.com/data/april-2026-ai-index), [Ramp June](https://ramp.com/data/)
| Microsoft 365 active agents | Index **1×**, March 2025 | **15×**, March 2026; **18×** in large enterprises | **+1,400%** YoY | The strongest year-over-year agent-specific growth indicator. Microsoft discloses ratios, not absolute agents or users, and one use in 28 days qualifies. [Microsoft](https://www.microsoft.com/en-us/worklab/work-trend-index/agents-human-agency-and-the-opportunity-for-every-organization)
| Claude directive task delegation | **27%** of sampled conversations, January 2025 | **39%** in August, then **32%** in November 2025 | **+5 pp** over ten months, after a 7-point reversal | The closest public behavioral proxy to delegation. The August spike was real but not persistent, showing why a smooth exponential forecast would be misleading. [Anthropic](https://www.anthropic.com/research/anthropic-economic-index-january-2026-report)
| Grok paid subscriptions | **4.9M**, December 2025 | **6.3M**, March 2026 | **+29%** in one quarter | Fast paid expansion; includes X plans with access rather than demonstrated agent use. [SEC](https://www.sec.gov/Archives/edgar/data/1181412/000162828026039276/spaceexplorationtechnologi.htm)
| Grok-feature monthly users | **89M**, December 2025 | **117M**, March 2026 | **+31%** in one quarter | Strong reach growth, but feature use ranges from chat to image generation and is not equivalent to Grok Bot. [SEC](https://www.sec.gov/Archives/edgar/data/1181412/000162828026039276/spaceexplorationtechnologi.htm)
| OpenClaw ecosystem | Repository launched November 2025; about **247K stars** by early March 2026 | **387,590 stars** and 11.37M monthly npm downloads by August | Stars **+57%** after early March | Extraordinary developer diffusion from nearly zero, but stars and package downloads cannot be converted to active users. [GitHub](https://api.github.com/repos/openclaw/openclaw), [npm](https://api.npmjs.org/downloads/point/last-month/openclaw)

The Census Bureau provides a useful latest cross-check. In March 2026, 55% of US workers reported having used AI for at least one of 11 work tasks. Among those users, 24% used it every workday in the preceding week and another 46% used it on at least one day. Only 3% said AI added time, while 30% reported saving at least three hours in the week. This is evidence of usefulness and repeat use, not yet evidence that the agent performed half of the worker’s eligible tasks. [US Census Bureau](https://www.census.gov/library/stories/2026/08/ai-use-at-work.html)

Perplexity’s Comet field study supplies another important diffusion base rate. After the agent became generally available, the new cohort supplied 60% of agent adopters but only 50% of agentic queries. Pre-general-availability users were twice as likely to adopt and generated nine times as many agentic queries per user as the general-availability cohort. In other words, broad distribution adds users faster than it adds intensive use. [Perplexity/HBS study](https://www.hbs.edu/ris/Publication%20Files/26-040_ac431922-9f75-4f7d-b6dc-b67bb1c02c50.pdf)

### What the adoption curve does to the forecast

The last year strongly raises the prior that personal agents can acquire distribution quickly: ChatGPT added at least 200 million weekly users on a comparable measure; paid business adoption crossed 50% in Ramp’s sample; and Microsoft’s active-agent count grew 15×. It does **not** justify projecting that task delegation itself will grow 15×. The Anthropic and Perplexity evidence says the conversion from access to intensive delegation is both selected and non-monotonic.

A simple continuation of the Federal Reserve’s linear work-adoption trend would put “any work use” near 50% in late 2026 and the high-50s by August 2027. That supports the reach component of the forecast. But the forecast event requires a much stricter transition:

> access → repeated use → agent use → majority of eligible task episodes delegated

When rising usable capability is explicitly treated as a cause of adoption rather than merely a correlated trend, the adoption evidence supports raising the primary forecast to **60% at six months and 85% at twelve months**. The broader cohorts remain lower because distribution, task eligibility, and organizational constraints delay the transmission.

## 3. Capability: how quickly is the frontier moving?

Consumer task benchmarks measure whether the capability reaches the right kinds of outcomes; they are not the forecast's causal architecture. That architecture has two linked models: **supply and demand**, and **model-harness capability as economic stewardship**. A business is a particularly useful capability proxy because businesses and households both manage inflows, outflows, stocks, buffers, investments, obligations, shocks, and feedback. The transfer is architectural rather than objective: a personal agent must also protect nonfinancial stocks such as time, health, privacy, relationships, and legal standing.

**Consumer Delegation Success Rate**—the frequency-weighted share of real consumer digital task episodes completed correctly, safely, affordably, and with little human attention—is the resolution outcome. Tokens per user per day are the demand term linking capability to supply. MyPCBench Perfect Task Rate is its closest frozen consumer benchmark reference; Remote Labor Index measures professional labor and is secondary.

| Dimension | Evidence | What it says—and does not say |
|---|---|---|
| Personal authenticated task completion | MyPCBench contains **184 tasks adapted from real OpenClaw personal-assistant requests** in one coherent logged-in digital life: banking, travel, food delivery, email, calendar, messaging, tax, orders, rides, browser history, files, and office apps. In the canonical 100-step evaluation, Claude Opus 4.6 completes **58.2% perfectly**; GPT-5.5 and GPT-5.6 Sol score 45.1% and 55.4%. | This is the closest consumer reference, but it is not a current frontier: Opus 5 and Fable 5 are unevaluated, while a self-reported Opus 4.8 row uses a different 200-step budget. It is also one simulated persona and is not weighted by real task frequency. [MyPCBench](https://mypcbench.pages.dev/leaderboard.html) |
| Economically valuable remote work | On Remote Labor Index, the release-date system frontier rose from **1.67% for GPT-5 to 15.80% for Claude Fable 5** in 306 days under a maximum $30 generation budget. | Strong evidence that model-plus-harness systems are improving on professional artifacts, but the task population is freelance workers rather than consumers planning travel, paying bills, shopping, scheduling, and managing personal accounts. [RLI](https://www.remotelabor.ai/) |
| Long-horizon work | METR’s 50%-success task horizon rose from about **7 minutes for GPT-4o** (May 2024) to **1,045 minutes / 17.4 hours for Claude Mythos Preview** (April 2026), roughly **149×** in 23 months. The 80%-success horizon rose from 1.3 to 185.9 minutes, roughly **143×**. | This is unusually fast progress, but the tasks are clean, well specified, and concentrated in software, ML, and cybersecurity. METR warns that estimates beyond 16 hours are unreliable. It is a human-task-difficulty measure, not literal unattended runtime. [METR](https://metr.org/time-horizons/)
| Desktop computer use | On the original OSWorld family, OpenAI’s CUA scored **38.1%** in 2025; GPT-5.5 later scored **78.7%** on OSWorld-Verified. On the harder 108-workflow OSWorld 2.0, GPT-5.6 Sol scores **62.6% partial credit**. In the benchmark paper’s full/binary measure, Claude Opus 4.8 completed only **20.6%** of workflows even with 500 steps. | GUI competence has risen rapidly, but partial credit can conceal failure to complete the user’s goal. Results from OSWorld v1/Verified and 2.0 are not one continuous series. [OpenAI CUA](https://openai.com/index/new-tools-for-building-agents/), [GPT-5.5](https://openai.com/index/introducing-gpt-5-5/), [OSWorld 2.0](https://osworld-v2.xlang.ai/), [GPT-5.6](https://openai.com/index/gpt-5-6/)
| Business operation | On the year-long simulated Vending-Bench 2 business, Claude Opus 5 averaged **$11,182** profit, GPT-5.6 Sol **$9,619**, Grok 4.6 **$9,047**, and GPT-5.5 **$7,524**. Andon Labs fits a frontier trend of about **+$734 profit per month** with R²=.96. | Sustained tool use and product sourcing now work surprisingly well. It remains one simulated business with five runs per model; profit and alignment are stochastic and not monotonic. [Andon Labs](https://andonlabs.com/evals/vending-bench-2)
| Tools, retrieval, and policy | On τ³-Bench Banking, a demanding conversational tool-and-policy benchmark, the current top score is **55.2%**; current frontier models cluster around roughly 45–55%. | Integrated business agents are no longer near zero, but a near-even failure rate is far below what many consequential workflows require. [τ-bench leaderboard](https://taubench.com/leaderboard/?benchmark=knowledge)
| Broad real work | Agents’ Last Exam contains more than 1,500 expert tasks across 55 non-physical occupations. The best broad ALE-CLI result reported at launch was **25.2%**, and every agent scored **0%** on the hardest tier. In a later OpenAI joint comparison, GPT-5.5 scored **46.9%** and GPT-5.6 Sol **52.7%** under OpenAI’s current configuration. | Narrow software benchmarks substantially overstate “all digital work.” The launch and current provider figures should not be silently spliced, but the same-table 5.8-point generational gain is useful. Common failures still include declaring success without verifying the requested artifact. [Berkeley RDI](https://rdi.berkeley.edu/blog/agents-last-exam/), [OpenAI](https://openai.com/index/gpt-5-6/)
| Hallucination / factuality | OpenAI reports GPT-5.6 Sol reduced factual errors by about **60%** versus GPT-5.5 Instant across three curated factuality-heavy sets. Earlier, GPT-5 thinking had 65% fewer claim-level hallucinations than o3. | The rate of improvement is real and large, but these relative reductions are not production error rates and different test sets cannot be spliced into one curve. Errors remain. [GPT-5.6 safety evaluation](https://deploymentsafety.openai.com/gpt-5-6-august-update/model-safety-training-and-evaluation), [GPT-5](https://deploymentsafety.openai.com/gpt-5)
| Memory | A hybrid raw-history plus extracted-fact memory system reached **86.1%** task-averaged accuracy on the 500-question LongMemEval suite. | Retrieval over prior conversations is becoming usable, but memory is not continual learning. On CL-Bench, dedicated memory systems still failed to accumulate reusable skills reliably, and naive in-context learning could outperform them. [LongMemEval](https://redis.github.io/redis-ai-research-public/longmemeval-agent-memory/), [CL-Bench](https://arxiv.org/abs/2606.05661)
| Forecasting and markets | In 2026 forecasting tournaments, several AI systems became statistically indistinguishable from superforecasters on probability accuracy. In MarketBench, however, even the top GPT-5R agent failed to break even. | Epistemic forecasting skill is approaching elite humans under a scoring rule; autonomous information acquisition, pricing, execution, and profitable trading remain harder. [Forecasting Research Institute](https://forecastingresearch.substack.com/p/ai-models-have-likely-reached-parity), [MarketBench](https://openreview.net/pdf?id=Go9otu0U90)
| AI research / self-improvement | OpenAI’s internal RSI index rose from **41.7 for GPT-5.5 to 57.9 for GPT-5.6 Sol**. Anthropic reports that its agent produced a roughly **52×** speedup on one narrow, fixed training-optimization problem compared with an unoptimized baseline. | AI is accelerating parts of AI R&D. Neither is open-ended recursive self-improvement: OpenAI still assesses GPT-5.6 below its “High” self-improvement threshold, and Anthropic’s result is a narrow optimization with a fixed objective. [OpenAI](https://openai.com/index/gpt-5-6/), [OpenAI system card](https://deploymentsafety.openai.com/gpt-5-6), [Anthropic](https://www.anthropic.com/institute/recursive-self-improvement)

### Capability velocity during the forecast window

The relevant benchmarks do not supply twelve monthly observations. The defensible method is to plot either repeated fixed-benchmark measurements or current joint evaluations against each model’s release date, while starting a new curve whenever the benchmark becomes harder.

The closest consumer proxy is too new and insufficiently current for a twelve-month slope. In the comparable MyPCBench evaluation, GPT-5.5 to GPT-5.6 Sol moved **45.1%→55.4%** on perfect completion, while the canonical 100-step frontier is **58.2% for the earlier Opus 4.6** and later agents remain unevaluated. The RLI professional-work comparator rose from **1.67% for GPT-5 in August 2025 to 15.80% for Claude Fable 5 in June 2026**, a 9.46× increase, but should not be treated as the consumer curve. METR’s 50%-success horizon rose from **203 minutes to 1,045 minutes**, a 5.15× increase; the 80% horizon rose 4.85×. The OSWorld-Verified frontier rose from **61.4% to 78.7%**, and τ³ Banking rose from **25.3% to 55.2%**. More recent same-table comparisons show GPT-5.5 to GPT-5.6 Sol moving **47.5%→62.6%** on OSWorld 2.0 partial reward, **46.9%→52.7%** on Agents’ Last Exam, and **12.9%→18.1%** on AutomationBench.

These are strong positive slopes, but the benchmark resets are at least as important as the gains. On the harder OSWorld 2.0 binary measure, tested systems complete only about **13–21%** of workflows; MyPCBench remains below **60% perfect** and falls sharply on seven-app tasks. The forecast should therefore update from strict full completion, cost, critical-error rate, and supervision—not from partial credit alone.

### Two models and their compression metrics

The forecast has two causal gates:

1. **Model-harness capability:** the preferred primary metric is `ESH50`, the longest duration for which the system has at least a 50% probability of producing positive risk-adjusted net value while preserving required buffers, fulfilling obligations, remaining within authority, recovering from shocks, and respecting token, dollar, wall-clock, and human-attention budgets. Until a stable stewardship suite exists, the 50%-success model-plus-harness task horizon is the interim trend proxy. Frozen-harness reruns remain attribution diagnostics; ESH80 or H80 is the reliability guardrail.
2. **Supply and demand:** operational supply is energized accelerator capacity translated into serviceable tokens by workload-specific goodput and deployment share. Demand is the sum of users in each archetype multiplied by compute-equivalent tokens per user per day. Planned capacity remains a dated lead indicator until commissioned.

Current METR TH1.1 estimates put the P50 system-horizon doubling time at **196.5 days all-time**, **130.8 days for releases since 2023**, and **88.6 days since 2024**. The shortening is suggestive, not conclusive, because task composition and evaluation infrastructure changed and the recent window is short. ARC-AGI-3 supplies the central harness warning: verified model results and near-saturating community systems use different tracks, so their gap demonstrates system-envelope sensitivity but is not a causal harness multiplier.

Epoch AI's maintained tracker covered **83 operational sites, 14.4 million H100-equivalents, and 13 GW of IT power** in August 2026. Reconstructing aggregate operational capacity from its current site timelines implies a roughly **156-day log-linear doubling time from August 2024 to August 2026**; the largest-site frontier separately doubled about every seven months. This is public-tracker capacity, not a complete global census, and source revisions can change the historical series.

The bridge between supply and adoption is **compute-equivalent tokens per user per day**. Estimate uncached input, visible output, internal reasoning, and cached context separately for each user archetype. Supported users equal available daily token supply divided by archetype demand. This exposes a rebound risk: faster inference may be consumed by deeper reasoning, verification, parallel branches, and memory rather than yielding proportionally more users.

Specialized inference architectures are modeled outside the H100e count until their deployed capacity is known. Cerebras' CS-4 claim of up to **30× faster inference** is a speed/interactivity result. OpenAI's Jalapeño exceeds **50× throughput per kilowatt** at matched previous-best GPU time-between-tokens on three workloads, but its general peak advantage is **1.5–1.9× work per watt**. The forecast therefore varies both deployment share and workload-specific goodput instead of applying 30× or 50× to the whole fleet. [Cerebras CS-4](https://www.cerebras.ai/cs4), [OpenAI Jalapeño](https://openai.com/index/jalapeno-first-results/)

Consumer Delegation Success Rate is the dependent outcome, not a causal metric. MyPCBench supplies a consumer construct reference, while adoption, trust, permissions, and task-level use test whether technical viability transmits into behavior. The business-and-household benchmark design is in [the two-model framework](02-model/01-two-model-framework.md); the current proxy series and infrastructure evidence are in [the metric framework](02-model/02-success-compression-metrics.md). The consumer measurement gap remains documented in [the consumer-metric assessment](02-model/03-consumer-delegation-metric.md).

## 4. Harnesses are part of the capability, not benchmark plumbing

The right evaluated object is **model + harness + context + tools + environment + feedback**. Current evidence shows three distinct harness effects.

### Success-rate uplift

On OSWorld-MCP, supplying structured MCP tools raised o3 from **8.3% to 20.4%** at 15 steps (2.46×) and Claude 4 Sonnet from **40.1% to 43.3%** at 50 steps. That is a controlled example of tools raising completion without changing the base model. [OSWorld-MCP](https://arxiv.org/abs/2510.24563)

ARC-AGI-3 makes the potential scale visible but not cleanly causal. At launch, humans scored 100% and frontier systems scored about 0.51%. Under the official standard harness in May, GPT-5.5 scored 0.43% and Opus 4.7 0.18% on semi-private evaluation. On the separate public-demo community leaderboard, custom systems later approached 100%. Because the tasks, disclosure rules, and validation tracks differ, **0.43% to 100% is not an apples-to-apples model improvement**. It is still powerful evidence that state representation, exploration, memory, test-time computation, and feedback can dominate the naked-model result. [ARC-AGI-3 launch](https://arcprize.org/blog/arc-agi-3-launch), [standard analysis](https://arcprize.org/blog/arc-agi-3-gpt-5-5-opus-4-7-analysis), [community leaderboard](https://arcprize.org/leaderboard/community)

### Efficiency uplift

The Scaffold Effect study found up to **40× variation in tokens per solved task** across harnesses using the same models, while pass-rate differences were only 0–8 percentage points and often statistically uncertain. A separate 4,643-run study found the same model-task combinations could cost **5–30× more per success** in one harness than another; prompt wording alone changed reasoning-token use 2.4–7.4× without improving results. Harness progress may therefore appear first as lower cost, latency, and supervision rather than a dramatic benchmark jump. [Scaffold Effect](https://arxiv.org/abs/2607.22585), [cost study](https://arxiv.org/abs/2608.01347)

### Reliability uplift

Harnesses also change the delegation proposition: permissions, spending limits, confirmation, deterministic execution, verification, rollback, escalation, and durable memory can turn an imperfect model into a useful service. The attached DAD paper’s example of an 80% classifier supporting a dependable state-based workflow is exactly this point. A benchmark should therefore record not only pass rate but critical-error rate, verification, recoverability, supervision time, cost per successful task, and repeatability over long runs.

## 5. Why the paid-user forecast is still aggressive

The positive case is unusually strong:

1. Distribution is already at consumer scale. OpenAI alone reports tens of millions of paying consumers and more than a billion broad users.
2. Long-horizon capability has grown by roughly two orders of magnitude in two years on METR’s suite.
3. Computer-use products are shipping: Grok Bot gives an agent its own computer, existing-app logins, persistent memory, and 24/7 operation; ChatGPT Work acts across apps and files. [Grok Bot](https://x.ai/news/introducing-grok-bot), [ChatGPT Work](https://openai.com/index/chatgpt-for-your-most-ambitious-work/)
4. Selected users already delegate hours-long tasks, and enterprise token production is shifting from chat toward agents.
5. Harness improvements can convert model gains into product gains and can lower cost by far more than the pass-rate leaderboard suggests.

The negative case is equally concrete:

1. Broad professional-work scores have improved into roughly the 50% range in current provider evaluations, but strict cross-application and hardest-tier results remain much lower and independent replication is sparse.
2. Hard GUI benchmarks show a large gap between partial progress and completed workflows.
3. Integrated business-policy performance is near 50%, too low for autonomous high-consequence actions without containment.
4. Consumer subscription, weekly use, agent use, and majority task delegation are four separate filters. Public data measure the first two much better than the last two.
5. Memory retrieval is improving faster than genuine continual learning.
6. Verification, exception handling, permissions, identity, payment, and liability can become the bottleneck after model capability improves.
7. The claim is about the median qualifying person, not spectacular behavior by the top 1% of Codex or OpenClaw users.

## 6. Capability-driven adoption assumption

The forecast now makes the following causal assumption explicit:

> **As the usable end-to-end capability of personal agents rises, adoption and delegation rise in expectation, with a lag.**

This is a monotonic assumption about the expected trend, not a claim that every model release immediately raises adoption. The relevant independent variable is not raw benchmark intelligence. It is **effective agent capability**:

> effective capability = task coverage × end-to-end completion × affordability × recoverability × user-specific fit

Agentic harnesses raise effective capability by adding tools, planning, persistent state, memory, verification, permissions, rollback, and escalation. Model improvement raises the quality of reasoning inside that system. Product distribution then converts the resulting usefulness into adoption.

For forecast updating, the system-capability and operational-compute SCMs are the causal inputs. Tokens per user per day translate the second SCM into user-equivalents. MyPCBench Perfect, its seven-plus-app slice, OSWorld 2.0 binary completion, adoption series, and product releases remain triangulation and transmission evidence rather than ingredients in a synthetic score.

A separate [user capability catalog](03-capabilities/01-user-capability-catalog.md) operationalizes this construct across 34 measurable capabilities. Its central finding is that computer use should not be represented by one benchmark score: visual control, authenticated access, cross-app state, clarification, persistence, verification, recovery, security, and attention efficiency each contribute separately to adoption-relevant capability. The companion [benchmark-velocity analysis](02-model/04-benchmark-velocity.md) models the fixed-test frontier, retrospective release curves, and harder-benchmark resets over the last year.

A compact behavioral model is:

> probability of delegation = logistic(effective capability after a lag − setup friction − supervision burden − failure exposure)

The forecast assumes the coefficient on effective capability is positive and substantial. The expected lag differs by population:

| Population | Assumed capability-to-adoption lag |
|---|---:|
| Active paid AI users and technical early adopters | 0–3 months |
| Weekly consumer AI users | 1–2 quarters |
| Knowledge workers inside organizations | 2–4 quarters |
| Broad global population | 4+ quarters, with large access variation |

The assumption is supported by the joint movement in capability and adoption: rapidly expanding long-horizon performance coincided with steep Codex and Microsoft-agent growth, while Claude users became more likely than at the start of 2025 to issue directive tasks. It is not yet possible to estimate a stable elasticity. Claude’s 39% to 32% reversal and the lower usage intensity of Perplexity’s general-availability cohort show that product mix, new-user composition, friction, and trust can temporarily overpower the capability trend.

This creates a falsifiable transmission test. If end-to-end benchmark performance and product availability rise materially for two consecutive quarters while intensive agent use remains flat, the assumed capability-to-adoption relationship should be weakened and the forecast reduced.

### Updateable evidence structure

New model and agent releases enter through the normalized, append-only [forecast data structure](02-model/05-data-structure.md). A stable release registry identifies each model, harness, or agent product; benchmark observations preserve benchmark version, system configuration, and resource envelope; the data-center ledger separates current capacity from dated milestones; monthly operational snapshots preserve the compute trend; demand archetypes preserve token-mix assumptions; and adoption observations retain stable series definitions. The legacy companion workbook in [`../data/reports/legacy/`](../data/reports/legacy/) implements the earlier buildout, capacity-history, token-demand, and supported-user calculations. The forecast can therefore be revisited without silently changing definitions or treating a product launch, nominal price, or planned data center as delivered capability.

## 7. Scenario model

This is a structured judgment rather than a false-precision multiplication of dependent variables.

| Scenario | Prior weight | What happens by Aug. 2027 | Probability paid-user threshold is met, Feb./Aug. |
|---|---:|---|---:|
| Weak transmission | 15% | Capability improves, but supervision, trust, permissions, integration, and price prevent it from converting into majority delegation. | 15% / 40% |
| Managed delegation | 50% | Capability gains convert into normal use for low- and medium-consequence tasks; confirmation and rollback allow broad bounded authority after a short lag. | 55% / 85% |
| Agent default | 35% | Computer use becomes a low-cost default in major paid plans; capability, memory, and verification improve; users rapidly reorganize workflows around agents. | 90% / 99% |

Weighted results are approximately 61% for February and 83% for August, rounded to **60% and 85%**. Relative to the previous formulation, more weight moves from slow diffusion to agent default because capability and adoption are now explicitly linked rather than forecast as independent processes.

## 8. Update rules

Reforecast monthly, but move probabilities only for prespecified evidence.

### Raise the forecast

- **+8 points:** a representative, preregistered US study finds at least 35% of active paid users already delegate at least half their eligible digital task episodes.
- **+5 points:** a major product reports at least 25 million monthly active computer-use/agent users using a task-based—not tool-call or token-based—definition.
- **+5 points:** the comparable model-plus-harness H50 system-capability doubling time falls below 100 days with an upper uncertainty bound below 130 days and confirmation on a harder unsaturated suite.
- **+5 points:** the twelve-month operational H100e series accelerates to a doubling time below 120 days, with commissioned—not planned—capacity and no material deterioration in inference allocation or availability.
- **+3 points:** same-workload serving goodput improves at least 4× while compute-equivalent token demand for the target archetype grows less than 2×, materially increasing supported user-equivalents.
- **+5 points:** a current canonical MyPCBench run or successor consumer benchmark—including the newest major agent products—exceeds 70% perfect overall and 50% on high-complexity tasks, with fixed cost, attention, and critical-error reporting.
- **+8 points instead of +5:** the same series exceeds 85% overall and 70% on seven-plus-app tasks; do not add the two adjustments.
- **+5 points:** OSWorld 2.0 exceeds 50% on binary full-workflow completion at a normal user budget, not only partial credit.
- **+5 points:** broad ALE performance exceeds 50% with artifact verification and no benchmark contamination concern.
- **+4 points:** τ³ Banking exceeds 75% pass@1 with critical policy violations separately reported.
- **+3 points:** a controlled study shows a harness lifts two or more frontier models by at least 15 percentage points on an unseen end-to-end benchmark, with no more than 2× cost.

### Lower the forecast

- **−8 points:** a representative study finds fewer than 15% of paid users delegate even one-quarter of eligible tasks by January 2027.
- **−6 points:** serious agent-caused financial, privacy, or identity incidents lead the major platforms to withdraw general computer-use authority or require confirmation for nearly every action.
- **−5 points:** active agent use plateaus for three consecutive months despite continued model and product releases.
- **−8 points:** end-to-end agent performance and broad product availability improve for two consecutive quarters while intensive use per eligible paid user remains flat—the direct falsification test for the capability-to-adoption assumption.
- **−5 points:** the comparable H50 capability doubling time rises above 180 days after at least three new release observations.
- **−5 points:** the twelve-month operational H100e doubling time rises above 365 days, or multiple capacity milestones slip by more than two quarters without replacement supply.
- **−3 points:** compute-equivalent token demand for the high-autonomy archetype grows more than twice as fast as usable inference capacity for two consecutive quarters.
- **−4 points:** a current canonical consumer benchmark remains below 65% perfect overall or below 40% on high-complexity tasks through February 2027 after evaluating at least two new frontier agent products.
- **−4 points:** OSWorld 2.0 binary completion and ALE remain below 30% through February 2027.
- **−3 points:** costs per successfully completed ordinary task stop falling or persistent-memory features materially increase critical privacy failures.

Do not update from a new model announcement, planned gigawatts, a nominal API price, a cherry-picked demo, GitHub stars, aggregate tokens generated, or a benchmark maximum alone. Apply at most one overlapping adjustment from each SCM per review. Do not double-count newer chips: H100e already converts their peak compute, while a separate serving-goodput multiplier should capture only workload-specific gains in memory, interconnect, latency-aware scheduling, caching, quantization, and software.

## Bottom line

The risky argument survives, but only after separating **system capability**, **operational compute**, **per-user token demand**, **reach**, and **delegation**. Model and harness progress make majority delegation among active paying AI users a live 6–12 month possibility; commissioned capacity and serving efficiency must support the token intensity of increasingly autonomous users. The evidence does not support claiming that a median internet user—or even a median knowledge worker—will cross that boundary on the same schedule.

The decisive missing dataset is not another model benchmark. It is a repeated, task-episode-level panel measuring what people actually hand over, how much supervision and repair they perform, and whether the system finishes the intended job. Commissioning that panel would improve this forecast more than another dozen leaderboard results.
