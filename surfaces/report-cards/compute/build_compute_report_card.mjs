import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";
import { loadLatestSnapshot } from "../../../scripts/lib/snapshots.mjs";
import { buildForecastModel } from "../../../model/forecast-model.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "../../..");
const snapshot = await loadLatestSnapshot(path.join(projectRoot, "data"));
const forecast = buildForecastModel(snapshot);
const compute = snapshot.datasets["compute-capacity"];
const outputDir = path.join(projectRoot, "artifacts", "report-cards");
const outputPath = path.join(outputDir, "personal-ai-compute-report-card.xlsx");
const inspectPath = `${outputPath}.inspect.ndjson`;
const previewDir = path.join(projectRoot, "artifacts", "previews", "compute");

const colors = {
  navy: "#081B2B", teal: "#0F766E", gold: "#C58B1B", lightGold: "#FFF3CF",
  white: "#FFFFFF", ink: "#17212B", line: "#D6DFE6",
};

const colName = (value) => {
  let result = "";
  for (let n = value; n > 0; n = Math.floor((n - 1) / 26)) result = String.fromCharCode(65 + ((n - 1) % 26)) + result;
  return result;
};

const workbook = Workbook.create();

function makeSheet(name, title, subtitle, headers, rows, tableName) {
  const sheet = workbook.worksheets.add(name);
  sheet.showGridLines = false;
  const width = Math.max(headers.length, ...rows.map((row) => row.length));
  const end = colName(width);
  sheet.getRange(`A1:${end}2`).merge();
  sheet.getRange("A1").values = [[title]];
  sheet.getRange(`A1:${end}2`).format = {
    fill: colors.navy, font: { bold: true, color: colors.white, size: 18 },
    verticalAlignment: "center",
  };
  sheet.getRange(`A3:${end}3`).merge();
  sheet.getRange("A3").values = [[subtitle]];
  sheet.getRange(`A3:${end}3`).format = {
    fill: colors.navy, font: { color: "#BBD0DD", size: 10 },
    wrapText: true, verticalAlignment: "center",
  };
  sheet.getRange(`A5:${end}5`).values = [headers];
  sheet.getRange(`A5:${end}5`).format = {
    fill: colors.teal, font: { bold: true, color: colors.white },
    wrapText: true, verticalAlignment: "center", horizontalAlignment: "center",
    borders: { preset: "all", style: "thin", color: colors.line },
  };
  if (rows.length) {
    sheet.getRange(`A6:${end}${rows.length + 5}`).values = rows;
    sheet.getRange(`A6:${end}${rows.length + 5}`).format = {
      font: { color: colors.ink, size: 9 }, verticalAlignment: "top", wrapText: true,
      borders: { preset: "all", style: "thin", color: colors.line },
    };
    sheet.tables.add(`A5:${end}${rows.length + 5}`, true, tableName);
  }
  sheet.freezePanes.freezeRows(5);
  sheet.getRange("1:1").format.rowHeight = 26;
  sheet.getRange("2:2").format.rowHeight = 26;
  sheet.getRange("3:3").format.rowHeight = 30;
  sheet.getUsedRange().format.autofitRows();
  return sheet;
}

const summaryRows = [
  ["Snapshot", forecast.snapshotDate, "Latest immutable snapshot selected automatically"],
  ["Current U.S. operational IT power", forecast.compute.currentItPowerGw, "IT GW"],
  ["Current reference inference productivity", forecast.compute.currentReferenceProductivityT, "trillion reference token-equivalents / IT GW-day"],
  ["Current H100e audit bridge", forecast.compute.currentRow.usH100e, "secondary productivity calibration"],
  ["Current supported users", forecast.compute.currentSupportedUsers, "Personal-AI user-equivalents"],
  ["Target users", forecast.compute.targetUsers, `${(compute.data.population.targetShare * 100).toFixed(0)}% of U.S. population`],
  ["Current supply score", forecast.compute.currentScore, "supported users / target users"],
  ["Reference tokens per H100e/day", forecast.compute.referenceTokensPerH100eDay, "excludes inference and Personal-AI allocations"],
  ["Workload per user/day", forecast.compute.workloadTokens, "compute-equivalent tokens"],
  ["Fleet inference allocation", compute.data.serving.fleetShareAllocatedToInference, "scenario allocation"],
  ["Personal-AI inference share", compute.data.serving.personalAiInferenceShare, "share of inference allocated to Personal AI"],
  ["IT-power mean projected log velocity", forecast.compute.powerVelocity, "log₂ IT GW / quarter"],
  ["IT-power projected log acceleration", forecast.compute.powerAcceleration, "log₂ IT GW / quarter²"],
  ["Productivity mean projected log velocity", forecast.compute.productivityVelocity, "log₂ token productivity / quarter"],
  ["Productivity projected log acceleration", forecast.compute.productivityAcceleration, "log₂ token productivity / quarter²"],
  ["Continuous base-case crossing", new Date(forecast.compute.continuousCrossing), "100% of selected target"],
];
const summary = makeSheet(
  "Summary",
  "U.S. Service-Capacity Report Card",
  `Snapshot ${forecast.snapshotDate}. The supply gate combines operational IT power, inference productivity, allocation, and workload; it passes only at 100% of the selected population target.`,
  ["Metric", "Value", "Unit / interpretation"],
  summaryRows,
  "ComputeSummaryTable",
);
summary.getRange("B12:B12").format.numberFormat = "0.0%";
summary.getRange("B15:B16").format.numberFormat = "0.0%";
summary.getRange(`B${summaryRows.length + 5}:B${summaryRows.length + 5}`).format.numberFormat = "yyyy-mm-dd";
summary.getRange(`A6:C${summaryRows.length + 5}`).format.fill = colors.lightGold;

const quarterRows = forecast.compute.quarterRows.map((row) => [
  row.quarterIndex, row.quarter, row.cutoffDate, row.phase, row.usItPowerMw, row.itPowerGw,
  row.usFacilityPowerMw, row.usH100e, row.includedSites, row.h100ePerItGw,
  row.referenceTokensPerItGwDay / 1e12, row.logGrowthItPower, row.logGrowthProductivity,
  row.logGrowthH100e, row.personalAiTokensPerDay, row.supportedUsers, forecast.compute.targetUsers,
  row.score, row.letter, row.gpa, row.sourceId, row.methodNote,
]);
const quarterly = makeSheet(
  "Quarterly Model",
  "U.S. AI Service Capacity — Observed and Projected",
  "Quarterly IT power and reference-token productivity from the selected snapshot, translated to supported Personal-AI user-equivalents. H100e remains a secondary audit bridge.",
  ["Quarter index", "Quarter", "Cutoff", "Phase", "U.S. IT power MW", "U.S. IT power GW", "U.S. facility power MW", "H100e audit bridge", "Included sites", "H100e / IT GW", "Productivity T token-eq / IT GW-day", "IT-power log growth / qtr", "Productivity log growth / qtr", "H100e log growth / qtr", "Personal-AI token-eq/day", "Supported users", "Target users", "Score vs target", "Letter", "GPA", "Source ID", "Method note"],
  quarterRows,
  "ComputeQuarterlyModelTable",
);
quarterly.getRange(`C6:C${quarterRows.length + 5}`).format.numberFormat = "yyyy-mm-dd";
quarterly.getRange(`E6:J${quarterRows.length + 5}`).format.numberFormat = "#,##0.00";
quarterly.getRange(`K6:N${quarterRows.length + 5}`).format.numberFormat = "0.0000";
quarterly.getRange(`O6:Q${quarterRows.length + 5}`).format.numberFormat = "#,##0";
quarterly.getRange(`R6:R${quarterRows.length + 5}`).format.numberFormat = "0.0%";
const chart = quarterly.charts.add("line", { chartType: "line", title: "Supported Personal-AI user-equivalents", hasLegend: true });
const capacitySeries = chart.series.add("Supported users");
capacitySeries.categoryFormula = `'Quarterly Model'!$B$6:$B$${quarterRows.length + 5}`;
capacitySeries.formula = `'Quarterly Model'!$P$6:$P$${quarterRows.length + 5}`;
const targetSeries = chart.series.add("Selected target");
targetSeries.categoryFormula = `'Quarterly Model'!$B$6:$B$${quarterRows.length + 5}`;
targetSeries.formula = `'Quarterly Model'!$Q$6:$Q$${quarterRows.length + 5}`;
chart.title = "Supported Personal-AI user-equivalents";
chart.hasLegend = true;
chart.xAxis = { axisType: "textAxis", textStyle: { fontSize: 8 } };
chart.setPosition("X5", "AF23");

const assumptionRows = [
  ["Population", "U.S. residents", compute.data.population.usResidents, "people"],
  ["Population", "Selected target", compute.data.population.targetShare, "share of residents"],
  ["Population", "Supply gate share of selected target", forecast.defaults.supplyGateShareOfTarget, "100% in the default"],
  ["Serving", "Dense 8-bit ops / H100e-second", compute.data.serving.dense8BitOpsPerH100eSecond, "ops/s"],
  ["Serving", "Seconds per day", compute.data.serving.secondsPerDay, "seconds"],
  ["Serving", "Fleet share allocated to inference", compute.data.serving.fleetShareAllocatedToInference, "share"],
  ["Serving", "Sustained utilization", compute.data.serving.sustainedServingUtilization, "share of peak"],
  ["Serving", "Active model parameters", compute.data.serving.activeModelParameters, "parameters"],
  ["Serving", "Forward-pass ops / parameter-token", compute.data.serving.forwardPassOpsPerParameterToken, "ops"],
  ["Serving", "System overhead", compute.data.serving.systemOverheadMultiplier, "multiplier"],
  ["Serving", "Serving goodput", compute.data.serving.servingGoodputMultiplier, "multiplier"],
  ["Serving", "Personal-AI inference share", compute.data.serving.personalAiInferenceShare, "scenario allocation"],
  ...forecast.compute.components.map((component) => [
    "Workload", component.label, component.tokensPerUserDay,
    `${component.computeWeight}× compute weight = ${component.computeEquivalentTokens.toLocaleString("en-US")} compute-equivalent tokens`,
  ]),
];
const assumptions = makeSheet(
  "Assumptions",
  "Serving Envelope and Demand Archetype",
  "All population, allocation, workload, and hardware-normalization assumptions read from the compute-capacity logical dataset in gate2-consolidated.json.",
  ["Group", "Variable", "Value", "Unit / explanation"],
  assumptionRows,
  "ComputeAssumptionsTable",
);
assumptions.getRange("C7:C8").format.numberFormat = "0%";
assumptions.getRange("C11:C12").format.numberFormat = "0%";
assumptions.getRange("C17:C17").format.numberFormat = "0%";

const siteRegistryRows = compute.data.siteRegistry.map((site) => [
  site.name, site.country ?? "", site.currentH100e, site.currentFacilityPowerMw,
  site.owner ?? "", site.users ?? "", site.address ?? "", site.sourceId,
]);
const siteRegistry = makeSheet(
  "Site Registry",
  "Epoch AI Data-Center Registry",
  "Facility-level source rows used to identify U.S. sites and audit the timeline join. Facility power includes non-IT overhead and is not substituted for IT power in the gate.",
  ["Site", "Country", "Current H100e", "Current facility power MW", "Owner", "Users", "Address", "Source ID"],
  siteRegistryRows,
  "ComputeSiteRegistryTable",
);
siteRegistry.getRange(`C6:D${siteRegistryRows.length + 5}`).format.numberFormat = "#,##0.00";

const supportingEvidenceRows = compute.data.supportingEvidence.map((record) => [
  record.id, record.metric, record.value, record.unit, record.scope, record.metricDate,
  record.evidenceClass, record.valueQualifier, record.sourceLocation, record.sourceId,
  record.claim, record.caveat, "No",
]);
const supportingEvidence = makeSheet(
  "Supporting Evidence",
  "Independent Compute-Supply Diagnostics",
  "Source-reported global build-rate, geography, performance, and allocation estimates. These retain their original units and do not directly enter the U.S. service-capacity countdown.",
  ["Evidence ID", "Metric", "Value", "Unit", "Scope", "Metric date", "Evidence class", "Qualifier", "Source location", "Source ID", "Claim", "Caveat", "Countdown input"],
  supportingEvidenceRows,
  "ComputeSupportingEvidenceTable",
);

const sourceRows = compute.metadata.sources.map((source) => [
  source.id, source.publisher, source.title, source.accessedAt,
  source.roles.join(", "), source.url, source.notes ?? "",
]);
const sources = makeSheet(
  "Sources",
  "Source Registry and Provenance",
  "Public source URLs captured in the selected snapshot. The same metadata appears in the website's data-sources modal.",
  ["Source ID", "Publisher", "Title", "Accessed", "Roles", "Public URL", "Notes"],
  sourceRows,
  "ComputeSourcesTable",
);

const sheetsAndWidths = [
  [summary, [35, 22, 54]],
  [quarterly, [12, 12, 14, 20, 18, 18, 20, 18, 14, 18, 24, 20, 22, 20, 22, 18, 18, 17, 9, 9, 20, 58, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3]],
  [assumptions, [16, 38, 22, 62]],
  [siteRegistry, [40, 18, 18, 24, 34, 34, 52, 20]],
  [supportingEvidence, [38, 35, 14, 13, 38, 15, 18, 20, 15, 20, 62, 68, 16]],
  [sources, [13, 24, 40, 14, 24, 58, 55]],
];
for (const [sheet, widths] of sheetsAndWidths) {
  for (let index = 0; index < widths.length; index++) {
    sheet.getRangeByIndexes(0, index, Math.max(100, sheet.getUsedRange().rowCount), 1).format.columnWidth = widths[index];
  }
}

await fs.mkdir(previewDir, { recursive: true });
for (const [sheetName, range, filename] of [
  ["Summary", `A1:C${summaryRows.length + 5}`, "summary.png"],
  ["Quarterly Model", `A1:AF${quarterRows.length + 5}`, "quarterly-model.png"],
  ["Assumptions", `A1:D${assumptionRows.length + 5}`, "assumptions.png"],
  ["Site Registry", `A1:H${siteRegistryRows.length + 5}`, "site-registry.png"],
  ["Supporting Evidence", `A1:M${supportingEvidenceRows.length + 5}`, "supporting-evidence.png"],
  ["Sources", `A1:G${sourceRows.length + 5}`, "sources.png"],
]) {
  const image = await workbook.render({ sheetName, range, autoCrop: "all", scale: 0.85, format: "png" });
  await fs.writeFile(path.join(previewDir, filename), new Uint8Array(await image.arrayBuffer()));
}

const errors = await workbook.inspect({
  kind: "match", searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 200 }, maxChars: 8000,
});
if (!(errors.ndjson ?? "").includes("matched 0 entries")) throw new Error(errors.ndjson);
const inspection = await workbook.inspect({
  kind: "table", sheetId: "Summary", range: `A1:C${summaryRows.length + 5}`,
  include: "values,formulas", tableMaxRows: 40, tableMaxCols: 6, maxChars: 30_000,
});
await fs.mkdir(outputDir, { recursive: true });
await fs.writeFile(inspectPath, `${inspection.ndjson ?? inspection}\n`, "utf8");
const xlsx = await SpreadsheetFile.exportXlsx(workbook);
await xlsx.save(outputPath);
console.log(JSON.stringify({ snapshot: snapshot.id, outputPath, currentScore: forecast.compute.currentScore }, null, 2));
