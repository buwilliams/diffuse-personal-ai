# Report cards

## Purpose

The report cards are downloadable views of the same snapshot and calculation layer that feed the website.

## What must remain true

- Observations and projections are visually distinct.
- Benchmark scores are normalized only against defensible fixed anchors.
- Harness configuration and benchmark comparability are recorded.
- Sparse evidence receives lower confidence and simpler projections.
- Capability uses failure-gap velocity and acceleration.
- Gate 2 separately reports operational U.S. IT power, inference productivity, inference and Personal-AI allocations, workload, supported users, and H100e as an audit bridge.
- Both builders select the latest immutable JSON snapshot and call `model/forecast-model.mjs`; neither embeds an independent evidence table or forecast constant.
- Workbook sources and website source links come from the JSON metadata registry.
- Workbooks are generated into `artifacts/report-cards/`; `data/` remains JSON-only.
- Workbooks render, inspect, and error-scan cleanly before publication.

## Updating

The formulas are authoritative in [Report-card calculation contract](../02-model/06-report-card-calculations.md), and the build and verification sequence is authoritative in [Monthly evidence refresh and publication](../05-operations/01-monthly-refresh.md). This document defines the report-card contract; it does not duplicate those procedures.
