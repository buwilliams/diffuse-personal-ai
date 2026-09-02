# Report-card calculation contract

This document is the authoritative mathematical contract for the capability and compute report cards. The builders and website must implement these rules; they do not redefine them.

## Joint diffusion gate

The countdown has two independent gates:

1. **Demand proxy — model–harness capability.** The confidence-weighted capability composite must reach the selected delegation threshold. The default is 80%, a practical delegation-quality scenario gate at the start of the B band.
2. **Supply — U.S. compute.** Operational U.S. compute must support the selected share of the U.S. population at the assumed workload.

The headline date is the later crossing:

> `diffusion date = max(capability crossing, compute crossing)`

If either gate does not cross within the website's 15-year search horizon, the result is **No crossing**. Capability alone can never determine the headline date.

The population share is applied once:

> `target users = U.S. population × selected population share`
>
> `supported users = IT GW × reference token-equivalents/IT GW-day × inference allocation × Personal-AI allocation ÷ compute-equivalent tokens/user/day`

The supply gate is 100% of that selected target. With the current defaults, `342.8M × 50% = 171.4M` users. A result near 85.7M would indicate that the population share was applied twice.

These are scenario extrapolations, not calibrated probabilities. The date must not be described as a probability forecast unless a probability layer is added explicitly.

## Capability calculation

### Normalization

Every graded benchmark score is normalized to `[0, 1]` using one defensible fixed interpretation:

- a native pass, success, or completion rate;
- a result divided by a published human, expert, oracle, or target result, capped at 100%; or
- another fixed transformation whose anchor and limitations are documented in the benchmark catalog.

Raw scores with incompatible units are never averaged before normalization. Elo is not converted by rescaling the visible leaderboard; it requires a fixed reference opponent or a stable probabilistic win-rate transformation. Without a defensible anchor, the series remains cataloged but ungraded.

### Benchmark motion

For normalized score `s`, convert the remaining failure gap to depth:

> `failure-gap depth = -log2(1 - s)`

One additional unit means the remaining gap to 100% has halved. Comparable longitudinal benchmarks estimate a raw failure-gap velocity separately for each of the four economic-work benchmark families. A benchmark with one observation contributes to the current score but not to its family's observed velocity.

Sparse family histories are partially pooled rather than held flat or assigned the fastest family's rate. Let `c_f` be the number of capped longitudinal history credits in family `f`, `p = 3` the prior strength, `v_f,raw` the family's observed velocity, and `v_global` the evidence-weighted velocity across families that have longitudinal evidence:

> `w_f = c_f ÷ (c_f + p)`
>
> `v_f = w_f × v_f,raw + (1 - w_f) × v_global`

A family with no longitudinal observation uses `v_global`; a mature family increasingly uses its own rate. The current pooled family velocities are **0.0766** gap halvings/quarter for direct economic stewardship, **0.2121** for operational execution, **0.1466** for personal stewardship transfer, and **0.1626** for economic value and governance. This makes the forecast updateable without pretending that Vending-Bench, computer use, and remote labor share one absolute curve.

Benchmark-local second derivatives remain visible as diagnostics, but they do not drive the forecast. The current economic suite is too sparse and benchmark definitions change too often for its local accelerations to be a defensible shared capability law.

### METR capability velocity and acceleration

METR's standardized task horizon supplies the model–harness capability-motion signal:

- **H50** is the primary horizon: the human task duration a model–harness system completes at 50% success.
- **H80** is the reliability guardrail on the same suite. It checks whether longer horizons are being purchased by accepting much lower dependability.

Let `y = log2(task-horizon minutes)` and `t` be quarters, centered at the newest included model release. Fit the recent H50 and H80 observations separately:

> `y(t) = β₀ + β₁t + β₂t²`
>
> `v_quad = β₁`
>
> `a_quad = 2β₂`
>
> `k = a_quad / v_quad`

The quadratic supplies **relative acceleration**, not the initial velocity. The H50 initial velocity `vₕ` comes from METR's published recent log-linear doubling-time estimate, converted to doublings per quarter. H80 uses its published endpoint check as a guardrail velocity. The default relative acceleration is:

> `k_eff = max(0, min(k_H50, k_H80))`

The slower positive estimate controls. A negative H80 estimate would therefore shut off positive acceleration rather than letting H50 outrun reliability. H80 is corroborating evidence, not an independent dataset, because both horizons are estimated from the same task suite and model runs.

The displayed capability acceleration is the real H50 second derivative:

> `a_H50 = vₕ × k_eff`

The aggregate bridge from task horizon to economically valuable work is explicit:

> `transfer coefficient τ = weighted_mean(v_f) / vₕ`
>
> `initial economic acceleration = τ × a_H50 = vₑ × k_eff`

This preserves the economic benchmark suite's observed current velocity while importing METR's evidence about whether capability progress itself is speeding up. The transfer is a causal conjecture and a direct refutation target; it is not identified by the current benchmark sample.

### Capability projection

The forecast makes recursive progress explicit:

> `dv_f/dh = k_eff × v_f(h)`
>
> `v_f(h) = v_f × exp(k_eff h)`
>
> `Δd_f(h) = v_f × (exp(k_eff h) − 1) / k_eff`
>
> `d_b(h) = d_b,now + max(0, Δd_f(h))`, for benchmark `b` in family `f`

When `k_eff = 0`, use the limit `Δd_f(h) = v_f × h`. Positive `k_eff` means progress increases the rate of future progress. This produces super-exponential failure-gap closure after converting depth back to a score while preserving differences among benchmark families.

Convert depth back to a score:

> `score(h) = 1 - 2^(-d(h))`

Negative feedback may flatten a projection but cannot make capability regress below the current frontier. Evidence confidence, the five-point acceleration fit, the H50 measurement ceiling, and the H80 check qualify how much trust to place in the trajectory; they do not suppress it by forcing sparsely observed benchmarks to remain static.

### Interactive acceleration scenario

The website exposes `a_H50` as an actual initial second derivative, never as a generic `1×` multiplier. The capability control is measured in **task-horizon doublings per quarter²**. Its default is the report card's METR-derived H50 acceleration. Changing it recomputes `k = a_H50 / vₕ`, transfers that relative acceleration to the observed economic velocity, and therefore changes recursive future velocity; it does not add a cosmetic percentage-point adjustment to the aggregate curve.

The four-year report remains the visible evidence window. If a selected threshold does not cross by 2028-Q4, the website must continue the same benchmark-level equations through its 15-year search horizon and label any resulting date **extended extrapolation beyond the report window**. It must not hold the 2028-Q4 aggregate flat merely because the report table ends there.

### Categories, confidence, and grades

Average the graded normalized benchmark scores within each category. Each benchmark earns one evidence credit for each distinct quarterly observation, capped at three. Category confidence is:

> `confidence weight = total evidence credits ÷ (3 × cataloged benchmarks in category)`

Confidence labels are High at 80% or above, Medium at 50% or above, and Low below 50%. This quantity is an **evidence-coverage weight**, not a statistical confidence interval or probability that a score is correct. The overall capability score, economic gap velocity, trajectory, and GPA use the continuous category evidence weights, so sparse evidence contributes less than mature longitudinal evidence. METR acceleration is reported separately with its own limitations rather than being averaged into the category weights.

Letter grades are A ≥90%, B ≥80%, C ≥70%, D ≥60%, and F <60%.

## Compute calculation

Gate 2 separates physical infrastructure from the amount of useful inference each watt can serve.

The countdown's productivity baseline is independent of the data-center capacity series. For a latency-constrained MLPerf Server power result:

> `measured tokens/joule = reported tokens/second ÷ reported system watts`
>
> `reference parameter ratio = tested active parameters ÷ 100B reference parameters`
>
> `reference productivity = measured tokens/joule × reference parameter ratio × 10⁹ watts/GW × 86,400 seconds/day`

For each quarter:

> `IT GW = U.S. IT power MW ÷ 1,000`
>
> `Personal-AI token-equivalents/day = IT GW × reference productivity × fleet inference allocation × Personal-AI inference share`
>
> `supported users = Personal-AI token-equivalents/day ÷ workload/user/day`
>
> `supply score = min(100%, supported users ÷ target users)`

The Epoch data-center registry supplies country and facility identity. The dated timeline supplies IT power, facility power, and H100-equivalents. At every cutoff, select the latest state on or before that date for each registry-identified U.S. site. Sum **IT power** as the physical series. Facility power includes cooling and other overhead and is retained only for audit. H100e and H100e/IT-GW remain audit cross-checks; neither enters reference productivity or supported-user capacity.

The base physical forecast uses dated expected or projected Epoch site states. The absolute productivity baseline is the MLPerf v5.1 Llama 3.1 405B Server power result: **1,249.04 measured tokens/second at 9,566.182 W**, normalized from 405B active parameters to the 100B reference. This yields **45.688453 trillion reference token-equivalents per IT GW-day** without using H100e.

The productivity velocity comes from a matched Llama 2 70B 99.9 Server power series: MLPerf v5.0 measures **16,848.6 tokens/s at 4,994.261 W**, and v5.1 measures **99,203.9 tokens/s at 10,434.706 W**. Reference productivity rises from **204.035T** to **574.990T token-equivalents/GW-day**, or **2.8181× in 160 days**. The resulting velocity is **0.853025 log₂ productivity per quarter**. Two comparable points identify a velocity but not acceleration, so the measured default acceleration is **0.000000 log₂ productivity per quarter²**. A third comparable observation is required before fitting productivity acceleration.

### Separate acceleration controls

Quarterly physical growth is the first difference of `log2(IT GW)`. Its default acceleration is the slope of the projected quarterly log-growth rates in the dated Epoch pipeline. Productivity velocity is fitted from comparable measured goodput-per-power observations; acceleration remains zero until at least three comparable observations provide two velocity intervals.

The website exposes two actual initial accelerations, never generic multipliers:

- **IT-power acceleration** in `log2 IT GW per quarter²`;
- **inference-productivity acceleration** in `log2 token-equivalents/IT GW-day per quarter²`.

For either path, let `v` be mean projected log growth, `a` the selected acceleration, and `k = a/v`. The live scenario follows:

> `dv/dh = k × v(h)`
>
> `v(h) = v × exp(kh)`

The adjustment to the published path is the difference between the selected and default recursive gains. Positive feedback produces super-exponential growth in ordinary units. Negative feedback may reduce growth toward zero but must not make projected operational power or productivity shrink. Increasing either acceleration must move the gate earlier or leave it unchanged.

Only operational U.S. IT power belongs in the observed physical series. Announced or under-construction projects enter the forward path only on a supported expected or projected commissioning date and remain labeled as projections.

Independent supply outlooks remain visible as diagnostics when their units or scope are not directly comparable with the countdown series. The August 2026 Dylan Patel interview estimates global incremental AI-compute additions of 30 GW in 2026, 50 GW in 2027, and roughly 70 GW in 2028, while estimating that about 70% of current new watts are deployed in the United States. It also estimates a current lab allocation of 40% inference, 50% research, and 10% development. Those claims corroborate rapid buildout and motivate the editable inference-allocation control; they do not replace the source-reconstructed U.S. IT-power path. Source: <https://www.dwarkesh.com/p/dylan-patel-3>.

### Default workload

The current high-autonomy workload is 16.75 million compute-equivalent tokens per user per day:

| Component | Raw tokens/day | Compute weight | Compute-equivalent tokens/day |
|---|---:|---:|---:|
| Uncached input | 2.00M | 1.00× | 2.00M |
| Visible output | 0.30M | 2.50× | 0.75M |
| Internal reasoning | 5.00M | 2.50× | 12.50M |
| Cached/reused context | 10.00M | 0.15× | 1.50M |
| **Total** |  |  | **16.75M** |

### Default serving envelope

The current absolute baseline is the independently measured **45.688453T reference token-equivalents per IT GW-day** above. The former H100e serving envelope remains reproducible as an audit: 13.524006M H100e divided by 11.879330 IT GW, multiplied by 199.4832M reference token-equivalents/H100e-day, implies **227.101365T/GW-day**. This fivefold difference is an exposed model diagnostic, not an average or an input to capacity.

The explicit allocations then apply:

- 40% of total AI service capacity allocated to inference;
- 60% of inference allocated to the modeled Personal-AI cohort.

With the 16.75M-token-equivalent workload, the independent baseline supports **7.776691M users**, or **4.5372%** of the 171.4M-user target at the snapshot. Under the measured two-point productivity velocity and the dated power path, the continuous compute crossing is **7 November 2027**; the website's daily-resolution crossing is **8 November 2027**.

The 40% inference allocation and 60% Personal-AI allocation are distinct, editable scenario assumptions. The former has an external expert cross-check; the latter is a forecast choice. The same fleet also serves training, research, development, enterprise applications, and other users, so changing either can materially move or remove the crossing. Epoch's tracker covers disclosed sites rather than a complete U.S. census, creating uncertainty in the opposite direction.

A Cerebras, Jalapeño, Rubin, or other serving system enters the productivity series only through comparable measured goodput, full-system power, service-level constraints, and a disclosed model normalization. H100e may diagnose the fleet's nominal accelerator mix, but it never multiplies the measured productivity series.

The current release values used to regression-test these formulas live in the [monthly refresh record](../05-operations/01-monthly-refresh.md#current-regression-anchors).
