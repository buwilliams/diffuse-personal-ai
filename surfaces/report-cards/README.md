# Report cards

The capability and compute workbooks are generated into `data/reports/`. Preview images are generated into `data/previews/`.

```text
capability/    Capability workbook builder and verification helpers
compute/       Compute workbook builder
shared/        Workbook-to-HTML data generator and inspection helper
legacy/        Superseded combined-workbook builder
```

Using the Node executable supplied by the Codex workspace runtime, run from the repository root:

```powershell
& $NodeExe surfaces/report-cards/capability/build_report_card.mjs
& $NodeExe surfaces/report-cards/compute/build_compute_report_card.mjs
& $NodeExe surfaces/report-cards/shared/generate_report_data.mjs `
  data/reports/personal-ai-four-year-capability-report-card.xlsx.inspect.ndjson `
  data/reports/personal-ai-compute-report-card.xlsx.inspect.ndjson `
  surfaces/website/app/report-data.ts
```

Then synchronize the live curves in `surfaces/website/app/page.tsx` and follow [`intent/05-operations/01-monthly-refresh.md`](../../intent/05-operations/01-monthly-refresh.md) for reconciliation and publication.
