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

One additional unit means the remaining gap to 100% has halved. Forecast behavior depends on the number of comparable quarterly frontier observations:

- zero observations: blank and ungraded;
- one observation: flat forecast;
- two observations: constant failure-gap velocity; and
- three or more observations: latest velocity plus acceleration estimated from the latest three points.

Forecast depth is monotonic:

> `d(h) = max(d_now, d_now + velocity × h + 0.5 × acceleration × h²)`

Convert depth back to a score:

> `score(h) = 1 - 2^(-d(h))`

Negative acceleration may flatten a projection but cannot make capability regress below the current frontier.

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
