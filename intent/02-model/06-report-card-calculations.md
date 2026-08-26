# Report-card calculation contract

This document is the authoritative mathematical contract for the capability and compute report cards. The builders and website must implement these rules; they do not redefine them.

## Joint diffusion gate

The countdown has two independent gates:

1. **Demand proxy — model–harness capability.** The confidence-weighted capability composite must reach the selected delegation threshold. The default is 75%, a practical delegation-quality scenario gate within the C band.
2. **Supply — U.S. compute.** Operational U.S. compute must support the selected share of the U.S. population at the assumed workload.

The headline date is the later crossing:

> `diffusion date = max(capability crossing, compute crossing)`

If either gate does not cross within the website's 15-year search horizon, the result is **No crossing**. Capability alone can never determine the headline date.

The population share is applied once:

> `target users = U.S. population × selected population share`
>
> `required H100e = target users × compute-equivalent tokens/user/day ÷ tokens/H100e/day`

The supply gate is 100% of that selected target. With the current defaults, `342.8M × 50% = 171.4M` users; a target near 85.7M indicates that the population share was applied twice.

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

One additional unit means the remaining gap to 100% has halved. Comparable longitudinal economic benchmarks estimate the confidence-weighted current economic gap velocity `vₑ`. Scores with one observation are not held flat: every graded benchmark receives the same projected frontier depth gain from its own current depth. This treats missing history as uncertainty rather than permanent zero progress.

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

The bridge from task horizon to economically valuable work is explicit:

> `transfer coefficient τ = vₑ / vₕ`
>
> `initial economic acceleration = τ × a_H50 = vₑ × k_eff`

This preserves the economic benchmark suite's observed current velocity while importing METR's evidence about whether capability progress itself is speeding up. The transfer is a causal conjecture and a direct refutation target; it is not identified by the current benchmark sample.

### Capability projection

The forecast makes recursive progress explicit:

> `dvₑ/dh = k_eff × vₑ(h)`
>
> `vₑ(h) = vₑ × exp(k_eff h)`
>
> `Δd(h) = vₑ × (exp(k_eff h) − 1) / k_eff`
>
> `d_b(h) = d_b,now + max(0, Δd(h))`

When `k_eff = 0`, use the limit `Δd(h) = vₑ × h`. Positive `k_eff` means progress increases the rate of future progress. This produces super-exponential failure-gap closure after converting depth back to a score.

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

For each observed quarter:

> `compute-equivalent tokens/day = operational H100e × tokens/H100e/day`
>
> `supported users = compute-equivalent tokens/day ÷ workload/user/day`
>
> `supply score = min(100%, supported users ÷ target users)`

The base forecast uses dated expected or projected site states in the same Epoch data-center timeline used for the historical reconstruction. At each future quarter cutoff, take the latest published state for every covered U.S. site and sum its H100-equivalents. This makes the default a **published buildout-pipeline scenario**, not a regression extrapolation of recent fleet growth. A trend extrapolation may be shown as a separate sensitivity case, but it must not silently replace known project dates.

Quarterly log growth is still the first difference of `log2(H100e)`. The reported forward-path acceleration is the slope of those projected quarterly log-growth rates; it describes the source pipeline and is not a fitted causal law.

The website's compute-acceleration control is the actual initial pipeline acceleration in **log2 H100e per quarter²**, not a multiplier. The default equals the report's measured forward-path acceleration. Let `v_c` be mean pipeline log growth and `k_c = a_c / v_c`; the live scenario follows `dv_c/dh = k_c v_c` and therefore `v_c(h) = v_c exp(k_c h)`. The adjustment to the published pipeline is the difference between the selected and default recursive gains. Positive feedback therefore represents super-exponential capacity growth in ordinary H100e units. Negative feedback may reduce growth toward zero but must not make projected operational capacity shrink.

Only operational U.S. capacity belongs in the observed series. Announced or under-construction projects enter the forward path only on a supported expected or projected commissioning date and must remain visibly labeled as projections.

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

The current serving envelope produces 79.79328 million compute-equivalent inference tokens per H100e per day before the personal-AI cohort allocation, from:

- 1.979e15 dense 8-bit operations per H100e-second;
- 40% of the fleet allocated to inference;
- 35% sustained serving utilization;
- 100B active model parameters;
- two forward-pass operations per parameter-token;
- 1.5× system overhead; and
- 1.0× additional serving-goodput multiplier.
- 50% of modeled inference supply allocated to the target personal-AI cohort, leaving 39.89664 million compute-equivalent tokens per H100e per day available to that cohort.

The 50% personal-AI allocation is an explicit, editable scenario assumption—not an observed fleet share. The same inference capacity also serves enterprise applications, research, and other users, so changing this input can materially move or remove the supply crossing. Epoch's public tracker also covers large disclosed sites rather than a complete U.S. census, which creates uncertainty in the opposite direction. Neither effect is resolved by the H100e conversion itself.

H100e already normalizes hardware peak compute. A Cerebras, Jalapeño, Rubin, or other chip multiplier is added only when it represents measured deployed serving goodput not already captured by H100e. Hardware gains must not be counted twice.

The current release values used to regression-test these formulas live in the [monthly refresh record](../05-operations/01-monthly-refresh.md#current-published-release).
