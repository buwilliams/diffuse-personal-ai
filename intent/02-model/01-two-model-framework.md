# Two-model forecast framework for personal AI

**Framework date:** 26 August 2026
**Forecast outcome:** the share of eligible digital task episodes delegated to personal AI

## Core claim

The forecast is best organized as two linked models:

1. **Supply and demand:** can the available inference fleet economically serve the token intensity created by agentic use?
2. **Model-harness capability:** can an AI system perform economically valuable, closed-loop stewardship for long enough and reliably enough to replace human task execution?

The two earlier success-compression metrics sit inside these models rather than constituting the models themselves. Operational U.S. AI IT power and reference-token productivity are the physical and technical supply variables. Model-plus-harness task horizon is a capability variable. Adoption is the dependent outcome.

The central forecasting condition is:

> Broad personal delegation becomes technically viable when model-harness systems cross the relevant stewardship threshold **and** inference supply can serve the resulting token demand at an acceptable price, latency, and reliability.

Distribution, trust, permissions, regulation, and habit determine how quickly technical viability becomes actual adoption.

## Model 1: supply and demand

### Supply

Supply is not merely chips or nameplate facility power. It is the daily volume of reference token-equivalents that an operational fleet can deliver under a specified service level:

> `S_PAI(t) = P_IT(t) × η_ref(t) × s_inference(t) × s_PAI(t)`

where:

- `P_IT(t)` is operational U.S. AI IT power in GW, excluding facility overhead;
- `η_ref(t)` is reference token-equivalents served per IT GW-day under the disclosed model-size, utilization, overhead, latency, and goodput envelope;
- `s_inference(t)` is the share of total AI service capacity allocated to inference rather than training, research, or development; and
- `s_PAI(t)` is the share of inference allocated to the modeled Personal-AI cohort.

The current source data also report H100-equivalents. The model retains them only as a transparent calibration bridge:

> `η_ref(t) = [H100e(t) ÷ P_IT(t)] × reference tokens/H100e-day`

This lets the model separate physical buildout from inference productivity. H100e is not the headline gate unit and facility MW is never substituted for IT MW.

This makes four distinctions essential:

- operational capacity versus announced or under-construction capacity;
- peak throughput versus throughput at an acceptable time-between-tokens;
- single-chip performance versus the deployed share of the fleet;
- raw billed tokens versus compute-equivalent tokens.

Cerebras CS-4 and OpenAI's Jalapeño therefore enter through measured, deployed `η_ref` at a defined service level, not as blanket multipliers on the entire fleet. Cerebras describes CS-4 as up to 30× faster than production GPU systems; OpenAI reports Jalapeño's much larger gains at a matched, highly interactive operating point but a smaller 1.5–1.9× peak work-per-watt advantage. These are valuable serving observations with different denominators, not interchangeable capacity claims. [Cerebras CS-4](https://www.cerebras.ai/cs4), [OpenAI Jalapeño](https://openai.com/index/jalapeno-first-results/)

### Demand

Demand is the sum of token intensity across user archetypes:

> `D(t) = Σa Na(t) × τa(t)`

where `Na` is the number of active users in archetype `a` and `τa` is compute-equivalent tokens per user per day.

Each `τa` should separately estimate:

- uncached input;
- visible output;
- internal reasoning;
- tool and environment observations;
- retries and verification branches;
- cached or reused context;
- background monitoring and scheduled work.

Demand must be recorded in two forms:

- **realized demand:** tokens actually served at the current price and product limits;
- **latent demand:** tokens a user would consume if the system could perform the target work at the required cost and reliability.

Capability makes demand endogenous. A more capable system does not merely complete today's prompts more cheaply: it accepts longer tasks, runs parallel searches, verifies actions, maintains memory, and works while the user is absent. Faster inference may consequently produce deeper service per person rather than proportionally more supported people.

### Supply-demand outputs

The main outputs are:

> `ρ(t) = D(t) ÷ S(t)`

and:

> `supported users(a,t) = S(t) ÷ τa(t)`

`ρ < 1` is necessary but not sufficient. The service must also satisfy the relevant price, latency, and availability envelope. Results should therefore be reported by archetype and service level, not as one universal user count.

## Model 2: model-harness capability as economic stewardship

### Why a business is the right abstraction

A business and a household are not identical objective functions, but they share a control architecture. Both receive inflows, incur recurring and contingent outflows, hold stocks, protect buffers, invest to improve future conditions, manage obligations, respond to shocks, and learn through feedback.

That makes business operation a strong proxy for personal AI when the evaluated capability is **stewardship**, rather than profit maximization alone. The system must preserve resources, fulfill obligations, improve future inflows or outflows, and remain inside the principal's authority and risk constraints.

The transferable state can be represented as:

- `K_t`: liquid capital or resource stock;
- `B_t`: protected buffer or runway;
- `R_t`: inflow, such as revenue or income;
- `O_t`: mandatory and discretionary operating outflow;
- `I_t`: investment intended to increase future inflow or reduce future outflow;
- `Q_t`: obligations, backlog, and commitments;
- `L_t`: liabilities, risk exposure, and potential losses; and
- `X_t`: external conditions and observed feedback.

A minimal transition model is:

> `K_(t+1) = K_t + R_t - O_t - I_t - losses_t`

> `R_(t+1) = R_t + f(I_t, actions_t, market_feedback_t)`

> `O_(t+1) = O_t - g(I_t, optimization_t) + shocks_t`

The agent observes the state, chooses actions through digital tools, receives feedback, updates its plan, and escalates when the action exceeds its authority.

### Business-to-person mapping

| Business system | Personal or household analogue |
|---|---|
| Sales and revenue | Wages, benefits, returns, refunds, discounts, or side income |
| Operations | Scheduling, travel, shopping, household administration, records, and correspondence |
| Rent, payroll, and bills | Housing, utilities, insurance, taxes, debt service, subscriptions, and recurring obligations |
| Working capital | Checking balance and short-term liquidity |
| Operating buffer | Emergency fund, time margin, and contingency capacity |
| Investment | Education, health, maintenance, tools, and purchases that raise future income or reduce future cost |
| Customers and suppliers | Employer, family, merchants, agencies, schools, insurers, and professionals |
| Corporate policy and approvals | Personal values, permissions, budgets, risk tolerance, and “ask before” rules |

The personal version adds important nonfinancial stocks: time, health, privacy, relationships, reputation, and legal or identity standing. This is why profit cannot compensate for a serious privacy breach, unauthorized purchase, illegal act, or damaged relationship.

### Objective and hard constraints

A useful net-value diagnostic is:

> `NVA = inflow created or preserved + outflow avoided - agent cost - human-attention cost - realized losses`

But a weighted value score is not enough. Some conditions must be noncompensable. An episode is successful only if it satisfies all prespecified hard constraints, such as:

- the reserve floor is not breached;
- required obligations are completed by their deadlines;
- no critical legal, policy, security, privacy, or authorization violation occurs;
- irreversible actions receive required approval;
- human attention remains under its budget;
- the system recovers or escalates correctly after shocks; and
- terminal stocks are not depleted to manufacture short-term performance.

This prevents a benchmark from rewarding spam, hidden risk, unauthorized financial actions, or the liquidation of long-term resources for apparent near-term profit.

## Primary capability metric: Economic Stewardship Horizon

Define `ESH50(t)` as:

> The longest calendar duration or equivalent number of operating cycles for which the best publicly available model-plus-harness system has at least a 50% probability of producing positive risk-adjusted net value relative to a baseline while satisfying every hard constraint, under a fixed starting state, permissions envelope, shock distribution, and token, dollar, wall-clock, and human-attention budget.

Also report:

- `ESH80` as the reliability guardrail;
- value per million compute-equivalent tokens;
- human minutes and approvals per operating month;
- critical-violation and irreversible-error rates;
- recovery and correct-escalation rates; and
- terminal capital, buffer, obligation, and nonfinancial-stock conditions.

The frontier trend is:

> `ln ESH50(t) = α + βt`

with doubling time:

> `T_ESH = ln(2) ÷ β`

A rolling or quadratic fit can test whether the doubling time is shrinking, holding steady, or growing. Until a stable stewardship suite exists, METR's task-completion horizon remains a useful interim trend proxy, while Vending-Bench, tool-policy benchmarks, computer-use suites, and real-work benchmarks supply component evidence rather than substitutes for `ESH50`.

## Benchmark design

The benchmark should contain matched **business and household twins** built from the same underlying control problem. A system that manages an invoice, vendor, reserve, and renewal in the business environment should face an analogous bill, merchant, emergency fund, and subscription in the household environment. The transfer coefficient between the two variants tests the claim that professional and personal agency are substantially the same capability.

Each episode should include:

1. A seeded starting state: capital, buffer, obligations, permissions, accounts, documents, and preferences.
2. An event tape lasting 30, 90, 180, or 365 simulated days.
3. Inflows, recurring outflows, investments, deadlines, messages, tool actions, and ambiguous requests.
4. Randomized but reproducible shocks: price changes, account lockouts, duplicate charges, refunds, fraud signals, website changes, vendor failures, and conflicting instructions.
5. Consequential actions that require approval and lower-risk actions the agent may execute autonomously.
6. Independent verification of the final external state, not acceptance of the agent's self-report.

For comparability, freeze the event tape, tools, permissions, starting resources, resource budgets, and scoring rules. Record the full evaluated system:

> `model + memory + planning + tool routing + computer use + verification + context management + scheduling + escalation policy`

Run two diagnostic controls whenever possible:

- the new model in a fixed reference harness, to estimate model contribution;
- a fixed model in the new harness, to estimate harness contribution.

The main frontier should still allow both to improve, because users consume the deployed system rather than the base checkpoint.

## What the Grok Bot example contributes

The attached Grok Bot narrative is useful as a **scenario and harness-feature generator**, not as evidence that the product can already run a business successfully. Its suggested architecture identifies benchmarkable functions: a persistent computer, parallel specialized agents, shared files and sessions, reusable learned routines, schedules and triggers, handoffs, role charters, approval boundaries, and evidence-producing completion checks.

xAI's official documentation verifies the core product mechanics: bots are persistent named agents on a cloud computer; they can work across apps and websites, run in parallel, and hand off work; bots on one account share files, browser sessions, and logins; and that shared computer is not a security boundary. xAI also describes the product as early beta. Those facts create both capability hypotheses and concrete failure tests, especially around credential blast radius, dropped sessions, approvals, and cross-agent interference. [Grok Bot overview](https://docs.x.ai/grok-bot/overview), [teams and enterprises](https://docs.x.ai/grok-bot/teams-and-enterprises), [approvals and security](https://docs.x.ai/grok-bot/approvals-security-and-privacy), [launch announcement](https://x.ai/news/introducing-grok-bot)

## How the two models determine the forecast

| Capability model | Supply-demand model | Technical interpretation |
|---|---|---|
| Below stewardship threshold | Ample supply | Cheap tokens do not create dependable delegation. |
| Above threshold | Constrained supply | Capable agents remain rationed, slow, or expensive. |
| Below threshold | Constrained supply | Neither prerequisite is present. |
| Above threshold | Ample supply | Necessary technical conditions for rapid delegation are present. |

The adoption transmission can be expressed as:

> `delegation = eligible tasks × access × willingness × P(success | ESH, task) × affordability × authority`

The forecast should update upward when `ESH50` crosses the time horizon of common personal workflows and the supply model can serve the corresponding user archetype. It should update downward when capability gains fail to transfer from business to household twins, when human attention or critical-error rates remain high, or when latent token demand outruns operational supply.

## Append-only update protocol

A new release should not require a new framework:

- **New model or harness:** add the system configuration and its stewardship episodes, component benchmarks, costs, tokens, human attention, and failures.
- **New agent product:** add shipped permissions, tools, persistence, memory, scheduling, availability, and approval policy; do not infer performance from the feature list.
- **New chip or serving method:** add workload-specific throughput, latency, power, service level, deployment date, and deployed share; update reference-token productivity only when the evidence is commensurable.
- **New data-center evidence:** add the dated IT-power milestone; move capacity into observed operational supply only after commissioning evidence.
- **New usage evidence:** update archetype counts and realized token intensity without overwriting prior observations.

The forecast can then be recomputed from the distribution of `ESH` across relevant tasks and supported user-equivalents produced by operational IT power, reference-token productivity, allocation, and capability-induced token demand.
