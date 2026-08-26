# Intent

This folder is the authoritative statement of the Diffuse Personal AI conjecture. The website and report cards are surfaces derived from it.

## Contents

- [The conjecture](01-conjecture.md)
- Model
  - [Two-model framework](02-model/01-two-model-framework.md)
  - [Success-compression metrics](02-model/02-success-compression-metrics.md)
  - [Consumer delegation metric](02-model/03-consumer-delegation-metric.md)
  - [Benchmark velocity](02-model/04-benchmark-velocity.md)
  - [Data structure](02-model/05-data-structure.md)
  - [Report-card calculations](02-model/06-report-card-calculations.md)
- Capabilities
  - [User capability catalog](03-capabilities/01-user-capability-catalog.md)
- Surfaces
  - [Surface principles](04-surfaces/01-surface-principles.md)
  - [Website](04-surfaces/02-website.md)
  - [Report cards](04-surfaces/03-report-cards.md)
- Operations
  - [Monthly evidence refresh and publication](05-operations/01-monthly-refresh.md)

## Key ideas

- **Two gates:** capability creates the demand proxy; operational compute supplies it.
- **System capability:** the evaluated object is the model plus its harness, tools, memory, planning, verification, and environment policy.
- **Delegation value:** people delegate when the time returned is worth more than the remaining risk and supervision cost.
- **Evidence before date:** new evidence changes the model; the desired headline never changes the evidence.
- **Refutability:** thresholds, assumptions, data confidence, and failure conditions remain visible.

## Updating

Change intent first. Create a new immutable dated snapshot in `data/`. Then rebuild the report cards and website by following the [monthly refresh procedure](05-operations/01-monthly-refresh.md). A surface that contradicts this folder or the latest valid snapshot is wrong by definition.
