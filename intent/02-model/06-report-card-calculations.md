# Report-card calculation contract

This document is the authoritative mathematical contract for the capability and compute report cards. The builders and website must implement these rules; they do not redefine them.

## Joint diffusion gate

The countdown has two independent gates:

1. **Demand proxy — model–harness capability.** The confidence-weighted capability composite must reach the selected delegation threshold. The default is 60%, the first grade above F.
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

One additional unit means the remaining gap to 100% has halved. Comparable longitudinal benchmarks estimate a confidence-weighted shared-frontier velocity `v₀` and initial acceleration `a₀`. Scores with one observation are not held flat: every graded benchmark receives the same projected frontier depth gain from its own current depth. This treats missing history as uncertainty rather than permanent zero progress.

The forecast makes the conjectured causal feedback explicit:

> `k = a₀ / v₀`
>
> `dv/dh = k × v(h)`
>
> `v(h) = v₀ × exp(kh)`
>
> `Δd(h) = v₀ × (exp(kh) − 1) / k`
>
> `d_b(h) = d_b,now + max(0, Δd(h))`

When `k = 0`, use the limit `Δd(h) = v₀ × h`. Because `dv/dh` at the evidence cutoff equals `a₀`, the control is exactly the initial second derivative it claims to represent. Positive `k` means that progress increases the rate of future progress. This produces super-exponential failure-gap closure after converting depth back to a score. It is a causal scenario assumption about transferable model, harness, research, and tooling improvement—not a causal effect identified by the benchmark sample.

Convert depth back to a score:

> `score(h) = 1 - 2^(-d(h))`

Negative feedback may flatten a projection but cannot make capability regress below the current frontier. Evidence confidence and acceleration coverage qualify how much trust to place in the shared rate; they do not suppress the central trajectory by forcing sparsely observed benchmarks to remain static.

### Interactive acceleration scenario

The website exposes `a₀` as an actual initial second derivative, never as a generic `1×` multiplier. The capability control is measured in **failure-gap halvings per quarter²**. Its default is the report card's confidence-weighted observed acceleration summary. Changing it recomputes `k = a₀ / v₀` and therefore the recursive future velocity; it does not add a cosmetic percentage-point adjustment to the aggregate curve.

The four-year report remains the visible evidence window. If a selected threshold does not cross by 2028-Q4, the website must continue the same benchmark-level equations through its 15-year search horizon and label any resulting date **extended extrapolation beyond the report window**. It must not hold the 2028-Q4 aggregate flat merely because the report table ends there.

### Categories, confidence, and grades

Average the graded normalized benchmark scores within each category. Each benchmark earns one evidence credit for each distinct quarterly observation, capped at three. Category confidence is:

> `confidence weight = total evidence credits ÷ (3 × cataloged benchmarks in category)`

Confidence labels are High at 80% or above, Medium at 50% or above, and Low below 50%. This quantity is an **evidence-coverage weight**, not a statistical confidence interval or probability that a score is correct. The overall capability score, trajectory, acceleration, and GPA use the continuous category evidence weights, so sparse evidence contributes less than mature longitudinal evidence.

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
