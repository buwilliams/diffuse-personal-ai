# Data

All structured data and workbooks live here.

```text
sources/       Append-only CSV registries and evidence tables
reports/       Canonical capability and compute workbooks plus generated inspections
previews/      Generated workbook renderings used for visual QA (ignored by Git)
```

The CSV registries are research inputs and migration targets; the current live workbook builders still contain their operative benchmark and compute arrays. The workbooks in `reports/` are generated artifacts but are committed because the public website links to them directly.

See [`../spec.md`](../spec.md) for the update procedure and [`../intent/02-model/05-data-structure.md`](../intent/02-model/05-data-structure.md) for the normalized schema.
