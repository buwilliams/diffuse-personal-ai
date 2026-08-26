# Report cards

The capability and compute builders select the latest `data/snapshot-YYYYMMDD/` directory and use `model/forecast-model.mjs`, the same calculation layer as the website.

```text
capability/build_report_card.mjs   Capability workbook
compute/build_compute_report_card.mjs  Compute workbook
shared/inspect_tables.mjs          Optional inspection-summary helper
```

Using the bundled Node runtime, run from the repository root:

```powershell
& $NodeExe scripts/validate_snapshots.mjs
& $NodeExe surfaces/report-cards/capability/build_report_card.mjs
& $NodeExe surfaces/report-cards/compute/build_compute_report_card.mjs
```

Outputs:

- `artifacts/report-cards/personal-ai-four-year-capability-report-card.xlsx`
- `artifacts/report-cards/personal-ai-compute-report-card.xlsx`
- ignored PNG previews under `artifacts/previews/`
- ignored `.inspect.ndjson` files beside the workbooks

The site does not read the XLSX files. It renders snapshot JSON directly and offers the workbooks as parallel downloads. Follow [`intent/05-operations/01-monthly-refresh.md`](../../intent/05-operations/01-monthly-refresh.md) for reconciliation and publication.
