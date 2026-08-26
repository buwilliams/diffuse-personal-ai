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
  ["Current U.S. operational capacity", forecast.compute.currentRow.usH100e, "H100-equivalents"],
  ["Current supported users", forecast.compute.currentSupportedUsers, "high-autonomy users"],
  ["Target users", forecast.compute.targetUsers, `${(compute.data.population.targetShare * 100).toFixed(0)}% of U.S. population`],
  ["Required U.S. capacity", forecast.compute.requiredH100e, "H100-equivalents"],
  ["Current supply score", forecast.compute.currentScore, "supported users / target users"],
  ["Personal-AI inference share", compute.data.serving.personalAiInferenceShare, "scenario allocation"],
  ["Workload per user/day", forecast.compute.workloadTokens, "compute-equivalent tokens"],
  ["Tokens per H100e/day", forecast.compute.tokensPerH100eDay, "after personal-AI allocation"],
  ["Mean projected log velocity", forecast.compute.velocity, "log₂ H100e / quarter"],
  ["Projected log acceleration", forecast.compute.acceleration, "log₂ H100e / quarter²"],
  ["Continuous base-case crossing", new Date(forecast.compute.continuousCrossing), "100% of selected target"],
];
const summary = makeSheet(
  "Summary",
  "Compute Supply Report Card",
  `Snapshot ${forecast.snapshotDate}. The supply gate passes only when modeled U.S. capacity can serve 100% of the selected target population.`,
  ["Metric", "Value", "Unit / interpretation"],
  summaryRows,
  "ComputeSummaryTable",
);
summary.getRange("B11:B12").format.numberFormat = "0.0%";
summary.getRange("B17:B17").format.numberFormat = "yyyy-mm-dd";
summary.getRange("A6:C17").format.fill = colors.lightGold;

const quarterRows = forecast.compute.quarterRows.map((row) => [
  row.quarterIndex, row.quarter, row.cutoffDate, row.phase, row.usH100e, row.includedSites,
  row.log2H100e, row.logGrowth, row.tokensPerDay, row.supportedUsers, row.score,
  row.letter, row.gpa, row.sourceId, row.methodNote,
]);
const quarterly = makeSheet(
  "Quarterly Model",
  "U.S. Compute Capacity — Observed and Projected",
  "Quarterly operational H100-equivalent supply from the selected snapshot, translated to supported users under the visible serving envelope.",
  ["Quarter index", "Quarter", "Cutoff", "Phase", "U.S. H100e", "Included sites", "log₂ H100e", "Log growth / quarter", "Compute-equivalent tokens/day", "Supported users", "Score vs target", "Letter", "GPA", "Source ID", "Method note"],
  quarterRows,
  "ComputeQuarterlyModelTable",
);
quarterly.getRange(`C6:C${quarterRows.length + 5}`).format.numberFormat = "yyyy-mm-dd";
quarterly.getRange(`E6:F${quarterRows.length + 5}`).format.numberFormat = "#,##0";
quarterly.getRange(`G6:H${quarterRows.length + 5}`).format.numberFormat = "0.000";
quarterly.getRange(`I6:J${quarterRows.length + 5}`).format.numberFormat = "#,##0";
quarterly.getRange(`K6:K${quarterRows.length + 5}`).format.numberFormat = "0.0%";
const chart = quarterly.charts.add("line", { chartType: "line", title: "U.S. operational H100-equivalent capacity", hasLegend: false });
const capacitySeries = chart.series.add("U.S. H100e");
capacitySeries.categoryFormula = `'Quarterly Model'!$B$6:$B$${quarterRows.length + 5}`;
capacitySeries.formula = `'Quarterly Model'!$E$6:$E$${quarterRows.length + 5}`;
chart.title = "U.S. operational H100-equivalent capacity";
chart.hasLegend = false;
chart.xAxis = { axisType: "textAxis", textStyle: { fontSize: 8 } };
chart.setPosition("Q5", "Y23");

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
  "All population, allocation, workload, and hardware-normalization assumptions read directly from compute-capacity.json.",
  ["Group", "Variable", "Value", "Unit / explanation"],
  assumptionRows,
  "ComputeAssumptionsTable",
);
assumptions.getRange("C7:C8").format.numberFormat = "0%";
assumptions.getRange("C11:C12").format.numberFormat = "0%";
assumptions.getRange("C17:C17").format.numberFormat = "0%";

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
  [quarterly, [12, 12, 14, 20, 18, 14, 16, 18, 22, 19, 17, 9, 9, 13, 55, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3]],
  [assumptions, [16, 38, 22, 62]],
  [sources, [13, 24, 40, 14, 24, 58, 55]],
];
for (const [sheet, widths] of sheetsAndWidths) {
  for (let index = 0; index < widths.length; index++) {
    sheet.getRangeByIndexes(0, index, Math.max(100, sheet.getUsedRange().rowCount), 1).format.columnWidth = widths[index];
  }
}

await fs.mkdir(previewDir, { recursive: true });
for (const [sheetName, range, filename] of [
  ["Summary", "A1:C17", "summary.png"],
  ["Quarterly Model", `A1:Y${quarterRows.length + 5}`, "quarterly-model.png"],
  ["Assumptions", `A1:D${assumptionRows.length + 5}`, "assumptions.png"],
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
  kind: "table", sheetId: "Summary", range: "A1:C17",
  include: "values,formulas", tableMaxRows: 40, tableMaxCols: 6, maxChars: 30_000,
});
await fs.mkdir(outputDir, { recursive: true });
await fs.writeFile(inspectPath, `${inspection.ndjson ?? inspection}\n`, "utf8");
const xlsx = await SpreadsheetFile.exportXlsx(workbook);
await xlsx.save(outputPath);
console.log(JSON.stringify({ snapshot: snapshot.id, outputPath, currentScore: forecast.compute.currentScore }, null, 2));
