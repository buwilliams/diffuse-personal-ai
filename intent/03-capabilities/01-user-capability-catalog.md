# User-relevant personal-agent capability catalog

**Snapshot:** 3 September 2026
**Purpose:** Identify the capabilities that convert model and harness progress into user adoption, with particular attention to computer use.

## Executive view

Computer use is the **universal adapter** for personal AI. It lets an agent act in software that has no API or connector and turns a generated answer into an outcome in the user’s actual digital environment. But basic clicking is not the binding constraint anymore. The hard capabilities are maintaining state across apps, using personal context correctly, noticing changing conditions, asking when information is missing, verifying the real result, and recovering safely.

The useful abstraction is a capability ladder:

| Level | User experience | Representative capability | Adoption meaning |
|---|---|---|---|
| L0 — Answer | “Tell me how.” | Information retrieval and explanation | Chatbot use; no task delegation |
| L1 — Create | “Make this for me.” | Produce a document, analysis, image, spreadsheet, or code artifact | Output delegation, but the user still moves work into place |
| L2 — Act | “Do this in the app.” | Complete a bounded action in one application | Real computer use begins |
| L3 — Orchestrate | “Handle this outcome.” | Cross-app execution with personal context, clarification, verification, and approval | Majority delegation becomes plausible |
| L4 — Persist | “Keep this handled.” | Background work, triggers, monitoring, memory, and recovery over days | Personal agent becomes part of the user’s operating routine |
| L5 — Adapt | “Learn how I want this done.” | Learn routines and preferences, propose useful work, and improve from outcomes | Personal AI becomes a durable delegate rather than a tool |

The forecast that agents perform at least half of eligible digital task episodes does not require universal L5 performance. It likely requires **reliable L3 across common, reversible tasks; economical L4 for recurring work; and early L5 personalization.**

The dated evidence for how the associated benchmark families moved is maintained separately in [agent benchmark velocity](../02-model/04-benchmark-velocity.md) and the `capability-benchmarks` logical dataset inside the current snapshot's [`gate1-consolidated.json`](../../data/snapshot-20260903-2/gate1-consolidated.json). This keeps the capability ontology stable while benchmark versions and frontier models change.

No live leaderboard currently measures the consumer resolution outcome. MyPCBench Perfect Task Rate is the closest frozen construct-validity reference, but it omits current frontier agents and mixes different step budgets in its broader leaderboard. The outcome is frequency-weighted Consumer Delegation Success Rate under cost, safety, and human-attention constraints; the two causal SCMs are defined in [the two-SCM framework](../02-model/02-success-compression-metrics.md). See also [the consumer-metric assessment](../02-model/03-consumer-delegation-metric.md).

## 1. The user jobs that matter

These task families should form the denominator of a user-centered benchmark or activity diary. They are not equally frequent, valuable, or risky.

| User task family | Examples | Adoption leverage | Computer-use dependence | Main constraint |
|---|---|---|---|---|
| Research and comparison | Compare products, vendors, policies, travel, schools, or medical information | High frequency; low commitment until action | Medium: browser and source access | Source reconciliation and factual verification |
| Communication | Triage email, draft and send replies, post updates, prepare outreach | Very high frequency and time burden | High: inboxes, contacts, collaboration apps | Tone, recipients, privacy, and irreversible sending |
| Calendar and coordination | Find time, schedule, reschedule, prepare agendas, coordinate participants | High frequency; immediate visible value | High: calendar, email, conferencing | Constraints distributed across people and apps |
| Documents, files, and forms | Create, edit, format, convert, file, upload, submit | High frequency across work and life administration | Very high | Visual precision, file location, and final-state verification |
| Spreadsheets and structured data | Clean data, update trackers, reconcile records, build models | High economic value | Very high unless a structured API is available | Exactness, formulas, multi-item state, and silent corruption |
| Shopping and household procurement | Search, compare, add to cart, reorder, return, track | High consumer frequency | High | Preference fit, price changes, payments, and confirmation |
| Travel and reservations | Plan, book, change, monitor, claim reimbursement | High pain removed per successful task | Very high and cross-app | Dynamic inventory, identity, payment, and cascading failures |
| Accounts and subscriptions | Register, change settings, cancel, recover access, manage plans | High friction and strong user demand | Very high | Authentication, dark patterns, identity, and irreversible changes |
| Personal administration | Bills, receipts, expenses, taxes, insurance, school and family logistics | Large cumulative time burden | Very high | Sensitive data, deadlines, cross-source evidence, and compliance |
| Enterprise systems | CRM, ERP, HRIS, ticketing, procurement, customer service | High employer value and repeatability | High, often hybrid API+GUI | Policy compliance, cross-app state, and auditability |
| Software and technical work | Build, test, deploy, debug, configure systems | Most mature long-horizon agent domain | Hybrid terminal, code, browser, and GUI | Verification, environment access, and security |
| Creative and media production | Slides, images, video, audio, layout, publishing | High output leverage | High for editing and publishing | Visual-spatial precision and subjective quality |
| Monitoring and routines | Watch inboxes, prices, dashboards, deadlines, inventory, or news; act on changes | Central to persistent-agent adoption | High plus triggers and background execution | Change detection, stale state, false alarms, and escalation |
| High-consequence decisions | Finance, health, legal, employment, security | Potentially high value but not required for majority adoption | Variable | Required reliability, regulation, and accountability |

The first majority-delegation wave should come from research, communication preparation, calendar coordination, documents/files, reversible account administration, technical work, and monitoring. Fully autonomous financial, health, and legal decisions are not necessary for the 50% forecast and should not be allowed to dominate the capability index.

## 2. Computer use is a stack of capabilities

The structured catalog is the `user-capabilities` logical dataset inside the current snapshot's [`gate1-consolidated.json`](../../data/snapshot-20260903-2/gate1-consolidated.json). Its 34 capabilities fall into six layers.

### A. Understand the user and task

The agent must interpret an underspecified goal, recover relevant constraints, distinguish preferences from hard rules, follow unfamiliar tutorials, and ask a concise question when it cannot safely infer the answer. OSWorld 2.0 identifies cross-source reasoning, implicit-state inference, conflict disambiguation, tutorial following, and proactive clarification as separate failure phenomena—not one generic “reasoning” ability. [OSWorld 2.0](https://osworld-v2.xlang.ai/)

### B. Access the user’s digital world

A useful agent needs authenticated sessions, personal files, email, calendars, browser history, and app data while respecting least privilege. MyPCBench is the most directly relevant evaluation: it places agents in one seeded personal desktop with 17 logged-in applications and 42,000 linked records. The strongest model in the paper fully solved 55.4% of 184 tasks, but performance fell sharply as the number of applications increased; the project’s current canonical run reports 58.2% overall and 36% on tasks spanning seven or more apps. [MyPCBench paper](https://arxiv.org/abs/2606.16748), [current project](https://mypcbench.com/)

Connectors, APIs, MCP tools, terminals, and GUI control should be treated as complementary. A well-designed harness uses a structured interface where possible and computer use where no reliable interface exists. Computer use expands coverage; structured tools usually improve speed, precision, and verifiability.

### C. Execute and maintain state

The agent must ground clicks and text accurately, navigate scrolling and dynamic interfaces, move artifacts between apps, maintain a durable task ledger, incorporate information that arrives mid-task, and complete rather than merely approach the goal.

This is where benchmark realism changes the conclusion:

| Evaluation | What it tests | Current signal |
|---|---|---|
| AndroidWorld | Short, reproducible tasks in individual Android apps | Recent systems exceed 90%, so the benchmark is becoming saturated. [MobileWorld paper](https://aclanthology.org/2026.acl-long.278/) |
| MobileWorld | 201 longer mobile tasks across 20 apps; 62.2% multi-app; user interaction and MCP | Best agentic framework 51.7%; best end-to-end model 20.9%. |
| OSWorld 2.0 | 108 long-horizon everyday and professional workflows; median human time 1.6 hours | Claude Opus 4.8 completed 20.6% under binary scoring at 500 steps despite 54.8% partial credit. [OSWorld 2.0](https://osworld-v2.xlang.ai/) |
| WindowsWorld | 181 professional tasks across 17 desktop apps; 78% multi-app | Every evaluated agent remained below 21% on multi-app tasks. [WindowsWorld](https://arxiv.org/abs/2604.27776) |
| SaaS-Bench | 106 realistic workflows across 23 deployable SaaS systems | Strongest model completed fewer than 4% end-to-end. [SaaS-Bench](https://arxiv.org/abs/2605.15777) |
| WeaveBench | 114 tasks combining GUI, terminal, code, and external tools | Best model-runtime pairing reached 41.2%; outcome-only grading overstated performance. [WeaveBench](https://arxiv.org/abs/2606.09426) |
| AppWorld-UL | 516 tasks requiring diverse user-agent interactions | Claude Opus 4.7 reached 48.6% overall and 35.7% on the harder compositional subset. [AppWorld-UL](https://arxiv.org/abs/2607.20536) |

The apparent contradiction—90% on one computer-use benchmark and under 4% on another—is informative. Agents increasingly master **interface mechanics** but still fail at **workflow semantics**.

### D. Persist and adapt

Persistent personal agents must continue when the user leaves, respond to schedules or events, preserve state across sessions, remember preferences, and learn a routine after demonstration. These capabilities are now shipping in products: ChatGPT Work can run scheduled or triggered work across connected apps and desktop computer use, while Grok Bot advertises persistent named agents with cloud computers, browser sessions, memory, routines learned from demonstration, and parallel collaboration. Product availability establishes feasibility, not reliability. [ChatGPT Work](https://openai.com/index/chatgpt-for-your-most-ambitious-work/), [Grok Bot](https://docs.x.ai/grok-bot/overview)

Continual learning remains distinct from persistence. Saving a workflow or retrieving a preference is easier than learning a general reusable skill from experience without corrupting prior behavior.

### E. Verify, recover, and remain under user control

For adoption, an agent that notices and repairs a mistake may be more valuable than one with a slightly higher first-pass score. Required capabilities include:

- verify the actual application state and deliverable, not the agent’s own narrative;
- distinguish “file exists” from “artifact is correct”;
- detect incomplete or conflicting evidence and ask the user;
- retry intelligently, choose an alternate tool, or restore a checkpoint;
- preview consequential actions and request approval at the right boundary;
- expose an action log and make outcomes auditable;
- resist instructions embedded in webpages, email, documents, and images.

OSWorld 2.0’s failure analyses repeatedly show agents checking an incomplete internal story rather than the real target state. OpenAI reports 91% general confirmation recall and 99.9–100% recall on several critical confirmation categories in its agent safety evaluation, demonstrating that a harness can strongly improve control behavior. This does not establish task correctness or prompt-injection immunity. [OpenAI system card](https://deploymentsafety.openai.com/chatgpt-agent)

Prompt injection remains a structural computer-use problem because the open environment becomes model input. Anthropic recommends isolated environments, scoped permissions, domain allowlists, human confirmation for consequential actions, and complete action logs; it explicitly says classifiers are one layer rather than a complete solution. [Anthropic guidance](https://claude.com/blog/best-practices-for-computer-and-browser-use-with-claude)

### F. Save attention at an acceptable cost

User adoption depends more on **human attention saved** than agent runtime. An agent can take an hour in the background and still create value if it needs thirty seconds of user attention. Conversely, a five-minute task is unattractive if the user must supervise every click.

Computer-use latency is still material. OSWorld-Human finds the best agents use 2.7–4.3 times as many steps as necessary; planning, reflection, and judging dominate latency, and later steps can take three times longer than early ones. [OSWorld-Human](https://proceedings.mlsys.org/paper_files/paper/2026/hash/5edb57c05c81d04beb716ef1d542fe9e-Abstract-Conference.html)

## 3. What should be measured

For current forecast updating, triangulate MyPCBench Perfect, its complexity slices, and current computer-use benchmarks; do not average them into a fabricated live SCM. For a purpose-built personal-agent dataset, capability should be computed over actual user task episodes, not benchmark questions or tool calls. For each task family *j*:

> delegation value(j) = coverage × full-completion probability × safe-outcome probability × human-attention savings

Cost, elapsed time, and setup burden then act as adoption gates. Aggregate across task families using their observed share of eligible user tasks:

> user-relevant agent capability = Σ task-frequency(j) × delegation value(j)

This construction makes several desirable distinctions:

- Partial benchmark credit does not equal a completed user outcome.
- A task that requires constant supervision produces little delegation value.
- A correct but dangerous action is not successful.
- A background task can be valuable even if its wall-clock time is longer than a human’s.
- High performance on rare tasks cannot compensate for inability to handle email, files, calendars, forms, and routine web work.

At minimum, every computer-use evaluation should publish:

| Metric | Why it matters |
|---|---|
| Binary pass@1 end-to-end completion | Whether the user’s goal was actually achieved |
| Milestone/partial score | Diagnoses progress, but must not replace completion |
| Critical-error and policy-violation rate | Captures downside hidden by average success |
| Human interventions per task | Measures retained coordination burden |
| Human attention minutes | Directly measures scarcity relieved |
| Verification success | Whether the agent checks the real outcome correctly |
| Recovery success after injected failure | Whether normal interface problems become user cleanup |
| Cross-app and long-horizon slices | Exposes compounding state failures |
| Cost and elapsed time per successful task | Determines economic viability |
| Repeatability across reruns | Prevents one lucky trajectory from looking production-ready |
| Prompt-injection and data-boundary failures | Measures whether broad access is safe enough to grant |

## 4. Forecast watchlist

These thresholds would be stronger evidence for mass personal-agent adoption than a new short-task leaderboard record:

1. **Personal context:** MyPCBench exceeds 80% full completion overall and 60% on its seven-plus-app slice.
2. **Long horizon:** OSWorld 2.0 exceeds 50% binary completion at a normal user cost, with no zero-success long-duration bin.
3. **Professional cross-app work:** WindowsWorld exceeds 50% and SaaS-Bench exceeds 30% end-to-end.
4. **User interaction:** AppWorld-UL’s compositional subset exceeds 70%, including correct clarification and refusal behavior.
5. **Recovery:** more than 80% of ordinary pop-up, network, stale-state, and application-crash failures are resolved without user repair.
6. **Attention:** median human attention falls below 20% of unaided task time for successful episodes.
7. **Safety:** critical unintended actions stay below 1% and consequential actions have greater than 99% appropriate-confirmation recall in independent testing.
8. **Economics:** median cost per successful common personal task falls below either $1 or 10% of the task’s estimated human-time value.

The thresholds are forecast triggers, not claims about present performance. The decisive leading indicator is a simultaneous rise in **coverage, binary completion, attention saved, and safe recoverability**. That combination should transmit rapidly into adoption among existing paid AI users.
