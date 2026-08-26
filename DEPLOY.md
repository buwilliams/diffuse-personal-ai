# Deploying Diffuse Personal AI

The public website is a ChatGPT Site. Its project identity remains in `surfaces/website/.openai/hosting.json`.

## Before publishing

1. Update `intent/` if the conjecture or model changed.
2. Update the evidence in `data/sources/` and the report-card builders.
3. Rebuild both workbooks into `data/reports/`.
4. Regenerate `surfaces/website/app/report-data.ts`.
5. Synchronize the live curves and publication date in `surfaces/website/app/page.tsx`.
6. Run `pnpm run build` from `surfaces/website/`.
7. Reconcile both gate dates and confirm the headline uses the later date.

## Publish

Use the current Sites hosting workflow against the existing project ID. Package `surfaces/website/`, save the exact committed version, deploy it, and preserve the configured public access policy.

The full evidence, calculation, validation, and publication procedure is in [`spec.md`](spec.md).
