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
const capability = snapshot.datasets["capability-benchmarks"];
const frontier = snapshot.datasets["frontier-capability-signals"];
const metr = snapshot.datasets["metr-task-horizon"];
const research = snapshot.datasets["research-evidence"];
const adoption = snapshot.datasets.adoption;
const outputDir = path.join(projectRoot, "artifacts", "report-cards");
const outputPath = path.join(outputDir, "personal-ai-four-year-capability-report-card.xlsx");
const inspectPath = `${outputPath}.inspect.ndjson`;
const previewDir = path.join(projectRoot, "artifacts", "previews", "capability");

const colors = {
  navy: "#0B1F33", teal: "#0F766E", blue: "#DCEAF7", gold: "#C58B1B",
  lightGold: "#FFF4D6", ink: "#17212B", muted: "#53606D", line: "#D7DEE5",
  pale: "#F7F9FB", white: "#FFFFFF", green: "#147D64", red: "#B42318",
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
  ["Snapshot", forecast.snapshotDate, "Latest immutable snapshot selected automatically", null, null, null, null, null, null, null, null],
  ["Observed direct-basket capability", forecast.capability.observedCurrentScore, "Direct delegation benchmarks only", null, null, null, null, null, null, null, null],
  ["Frontier-adjusted live capability", forecast.capability.currentScore, "Includes Astra's qualified one-time trajectory lead", null, null, null, null, null, null, null, null],
  ["Letter grade", forecast.capability.currentGrade, "A ≥90%, B ≥80%, C ≥70%, D ≥60%, F <60%", null, null, null, null, null, null, null, null],
  ["GPA", forecast.capability.currentGpa, "0–4", null, null, null, null, null, null, null, null],
  ["Evidence confidence", forecast.capability.confidence, forecast.capability.confidenceWeight, null, null, null, null, null, null, null, null],
  ["Pooled economic gap velocity", forecast.capability.economicGapVelocity, "confidence-weighted family gap halvings / quarter", null, null, null, null, null, null, null, null],
  ["Cross-family velocity prior", forecast.capability.globalGapVelocityPrior, "evidence-weighted prior for sparse families", null, null, null, null, null, null, null, null],
  ["Partial-pooling prior strength", forecast.capability.partialPoolingPriorCredits, "history credits", null, null, null, null, null, null, null, null],
  ["METR H50 acceleration", forecast.capability.h50Acceleration, "task-horizon doublings / quarter²", null, null, null, null, null, null, null, null],
  ["METR H80 guardrail", forecast.capability.h80Acceleration, "task-horizon doublings / quarter²", null, null, null, null, null, null, null, null],
  ["Astra broad frontier lead", forecast.capability.frontierShock.broadFrontierLeadQuarters, "quarters: 6 ECI points ÷ 14 points/year", null, null, null, null, null, null, null, null],
  ["Astra economic-equivalent lead", forecast.capability.frontierShock.economicFrontierLeadQuarters, "quarters after economic transfer coefficient", null, null, null, null, null, null, null, null],
  ["Independent corroborating publishers", forecast.capability.frontierShock.independentPublisherCount, "minimum 2", null, null, null, null, null, null, null, null],
  ["Corroborated capability domains", forecast.capability.frontierShock.capabilityDomainCount, "minimum 3", null, null, null, null, null, null, null, null],
  ...forecast.capability.categories.map((row) => [
    row.category, row.currentScore, row.confidence, row.confidenceWeight,
    row.currentGpa, row.graded, row.total, row.rawGapVelocity, row.historyCredits,
    row.poolingWeight, row.pooledGapVelocity,
  ]),
];
const summary = makeSheet(
  "Summary",
  "Model–Harness Capability Report Card",
  `Snapshot ${forecast.snapshotDate}. Every value is calculated from the latest dated JSON snapshot through the same shared model used by the website.`,
  ["Metric / benchmark family", "Score / value", "Interpretation / confidence", "Confidence weight", "GPA", "Graded", "Total", "Raw gap velocity", "History credits", "Pooling weight", "Pooled gap velocity"],
  summaryRows,
  "CapabilitySummaryTable",
);
summary.getRange("B7:B8").format.numberFormat = "0.0%";
summary.getRange("B10:B18").format.numberFormat = "0.0000";
summary.getRange("C11:C11").format.numberFormat = "0.000";
summary.getRange("B19:B20").format.numberFormat = "0";
summary.getRange("B21:B24").format.numberFormat = "0.0%";
summary.getRange("D21:D24").format.numberFormat = "0%";
summary.getRange("H21:H24").format.numberFormat = "0.0000";
summary.getRange("J21:J24").format.numberFormat = "0%";
summary.getRange("K21:K24").format.numberFormat = "0.0000";
summary.getRange("A21:K24").format.fill = colors.lightGold;

const benchmarkRows = forecast.capability.benchmarkRows.map((row) => [
  row.category, row.id, row.name, row.metric, row.normalization, row.status,
  row.firstReleaseQuarter, row.currentScore, row.letter, row.gpa, row.observationCount,
  row.evidenceCredits, row.recentVelocity, row.localAcceleration, row.sourceId, row.notes,
]);
const benchmarks = makeSheet(
  "Benchmarks",
  "Economic Capability Benchmark Basket",
  "Normalized benchmark definitions, latest score, velocity, confidence evidence, and source reference.",
  ["Category", "ID", "Benchmark", "Metric", "Normalization", "Status", "First release", "Current score", "Letter", "GPA", "Observations", "Evidence credits", "Recent gap velocity", "Local acceleration", "Source ID", "Notes"],
  benchmarkRows,
  "CapabilityBenchmarksTable",
);
benchmarks.getRange(`H6:H${benchmarkRows.length + 5}`).format.numberFormat = "0.0%";
benchmarks.getRange(`M6:N${benchmarkRows.length + 5}`).format.numberFormat = "0.0000";

const observationRows = capability.data.observations.map((row) => [
  row.id, row.benchmarkId, row.releaseDate, row.quarter, row.quarterIndex, row.score,
  row.systemHarness, row.scoreBasis, row.sourceId, row.notes,
]);
const observations = makeSheet(
  "Observations",
  "Normalized Model–Harness Observations",
  "Release-quarter frontier observations. Source IDs resolve through the Sources sheet and JSON metadata.",
  ["Observation ID", "Benchmark ID", "Release date", "Quarter", "Quarter index", "Score", "System / harness", "Score basis", "Source ID", "Notes"],
  observationRows,
  "CapabilityObservationsTable",
);
observations.getRange(`C6:C${observationRows.length + 5}`).format.numberFormat = "yyyy-mm-dd";
observations.getRange(`F6:F${observationRows.length + 5}`).format.numberFormat = "0.0%";

const pathRows = forecast.capability.quarters.map((quarter, index) => [
  quarter.label,
  quarter.date,
  forecast.capability.overallSeries[index].score,
  ...forecast.capability.categories.map((category) => category.series[index].score),
]);
const quarterly = makeSheet(
  "Quarterly Path",
  "Four-Year Capability Path",
  "Observed or carried values through the snapshot quarter; projected values after it. The aggregate is confidence weighted.",
  ["Quarter", "Date", "Aggregate", ...forecast.capability.categories.map((row) => row.category)],
  pathRows,
  "CapabilityQuarterlyPathTable",
);
quarterly.getRange(`B6:B${pathRows.length + 5}`).format.numberFormat = "yyyy-mm-dd";
quarterly.getRange(`C6:${colName(3 + forecast.capability.categories.length)}${pathRows.length + 5}`).format.numberFormat = "0.0%";
const chart = quarterly.charts.add("line", { chartType: "line", title: "Economic capability by category and aggregate", hasLegend: true });
for (let index = 0; index < 1 + forecast.capability.categories.length; index++) {
  const column = colName(3 + index);
  const name = index === 0 ? "Aggregate" : forecast.capability.categories[index - 1].category;
  const series = chart.series.add(name);
  series.categoryFormula = `'Quarterly Path'!$A$6:$A$${pathRows.length + 5}`;
  series.formula = `'Quarterly Path'!$${column}$6:$${column}$${pathRows.length + 5}`;
}
chart.title = "Economic capability by category and aggregate";
chart.hasLegend = true;
chart.yAxis = { numberFormatCode: "0%", min: 0, max: 1 };
chart.xAxis = { axisType: "textAxis", textStyle: { fontSize: 8 } };
chart.setPosition("I5", "Q23");

const metrRows = [
  ...metr.data.series.map((row) => [
    "Observation", row.id, row.metric, row.modelSystem, row.releaseDate, row.horizonMinutes,
    row.harnessScope, row.sourceId, row.comparabilityNote,
  ]),
  ...metr.data.trendEstimates.map((row) => [
    "Trend", row.id, row.role, row.name, row.observationDate, row.value,
    `${row.unit}; ${row.method}`, row.sourceId, row.comparabilityNote,
  ]),
];
const metrSheet = makeSheet(
  "METR Horizon",
  "Task-Horizon Acceleration Bridge",
  "H50 sets the primary capability-velocity signal; H80 is a reliability guardrail. These series are not direct economic outcomes.",
  ["Record type", "ID", "Metric / role", "Model / estimate", "Date", "Value", "Harness / method", "Source ID", "Comparability note"],
  metrRows,
  "MetrHorizonTable",
);
metrSheet.getRange(`E6:E${metrRows.length + 5}`).format.numberFormat = "yyyy-mm-dd";

const frontierRows = [
  ...frontier.data.observations.map((row) => [
    "Aggregate observation", row.id, row.model, row.releaseDate, row.metric, row.eciScore,
    row.confidenceInterval90.join("–"), row.independentPublisher, row.sourceId,
    "Sets shock magnitude; not a delegation percentage",
  ]),
  ...frontier.data.trend.map((row) => [
    "Trend", row.id, row.series, row.metricDate, row.method, row.annualPointsPerYear,
    row.unit, "Epoch AI", row.sourceId, "Converts ECI gain to broad frontier-progress time",
  ]),
  ...frontier.data.corroboratingSignals.map((row) => [
    "Corroboration", row.id, row.model, forecast.snapshotDate, row.summary, null,
    row.capabilityDomains.join(", "), row.publisher, row.sourceId,
    row.publisherClass === "model provider" ? "Portfolio evidence; not an independent publisher" : "Independent qualification evidence",
  ]),
  [
    "Forecast policy", frontier.data.forecastPolicy.selectedObservationId,
    frontier.data.forecastPolicy.selectedTrendId, forecast.snapshotDate,
    frontier.data.forecastPolicy.applicationRule,
    forecast.capability.frontierShock.economicFrontierLeadQuarters,
    `${frontier.data.forecastPolicy.minimumIndependentPublishers} independent publishers; ${frontier.data.forecastPolicy.minimumCapabilityDomains} domains`,
    "Diffuse Personal AI", "gate1-diffuse-personal-ai-gate-1-model-harness-capability-calculation-contract",
    "One-time economic-equivalent lead; direct benchmark observations unchanged",
  ],
];
const frontierSheet = makeSheet(
  "Frontier Signals",
  "Independently Corroborated Frontier-Capability Shock",
  "Astra's overall capability portfolio changes the trajectory through an explicit trend-and-transfer bridge; ARC-AGI-3 and ECI are not treated as delegation percentages.",
  ["Record type", "ID", "Model / series", "Date", "Metric / summary", "Value", "Interval / domains", "Publisher", "Source ID", "Countdown treatment"],
  frontierRows,
  "CapabilityFrontierSignalsTable",
);
frontierSheet.getRange(`D6:D${frontierRows.length + 5}`).format.numberFormat = "yyyy-mm-dd";

const researchRows = research.data.observations.map((row) => [
  row.id, row.category, row.metricDate, row.entity, row.metric, row.value,
  row.unit, row.sourceId, row.caveat,
]);
const researchSheet = makeSheet(
  "Research Evidence",
  "Supporting Capability Evidence",
  "Release-day, vendor, and independent signals that inform interpretation but do not enter the direct economic-delegation basket unless the calculation contract explicitly promotes them.",
  ["Evidence ID", "Category", "Metric date", "Entity", "Metric", "Value", "Unit", "Source ID", "Caveat / comparability note"],
  researchRows,
  "CapabilityResearchEvidenceTable",
);
researchSheet.getRange(`C6:C${researchRows.length + 5}`).format.numberFormat = "yyyy-mm-dd";

const releaseRows = adoption.data.releases.map((row) => [
  row.id, row.provider, row.name, row.releaseDate, row.availabilityStage,
  row.availabilityScope, row.parentReleaseId ?? "", row.sourceId, row.notes ?? "",
]);
const releases = makeSheet(
  "Model Releases",
  "Model Release and Availability Signals",
  "Dated release metadata used to align observations and distinguish limited, trusted-access, and generally available deployments.",
  ["Release ID", "Provider", "Model", "Release date", "Availability stage", "Availability scope", "Parent release", "Source ID", "Notes"],
  releaseRows,
  "CapabilityModelReleasesTable",
);
releases.getRange(`D6:D${releaseRows.length + 5}`).format.numberFormat = "yyyy-mm-dd";

const sources = [
  ...capability.metadata.sources,
  ...frontier.metadata.sources,
  ...metr.metadata.sources,
  ...research.metadata.sources,
  ...adoption.metadata.sources,
]
  .filter((source, index, rows) => rows.findIndex((candidate) => candidate.url === source.url) === index)
  .map((source) => [
    source.id, source.publisher, source.title, source.accessedAt,
    source.roles.join(", "), source.url, source.notes ?? "",
  ]);
makeSheet(
  "Sources",
  "Source Registry and Provenance",
  "Public source URLs captured in the selected snapshot. The same metadata appears in the website's data-sources modal.",
  ["Source ID", "Publisher", "Title", "Accessed", "Roles", "Public URL", "Notes"],
  sources,
  "CapabilitySourcesTable",
);

const widths = {
  Summary: [34, 18, 45, 18, 10, 10, 10, 17, 15, 15, 18],
  Benchmarks: [31, 12, 28, 40, 52, 12, 14, 14, 9, 9, 12, 15, 17, 17, 13, 50],
  Observations: [20, 14, 14, 12, 12, 14, 32, 48, 13, 52],
  "Quarterly Path": [13, 14, 15, 21, 21, 21, 21, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
  "METR Horizon": [14, 18, 18, 28, 14, 14, 55, 13, 55],
  "Frontier Signals": [20, 38, 24, 14, 74, 14, 60, 26, 28, 56],
  "Research Evidence": [16, 24, 14, 34, 42, 14, 18, 20, 72],
  "Model Releases": [28, 18, 28, 14, 22, 60, 28, 20, 58],
  Sources: [13, 24, 40, 14, 24, 58, 55],
};
for (const sheet of workbook.worksheets.items) {
  const sheetWidths = widths[sheet.name];
  for (let index = 0; index < sheetWidths.length; index++) {
    sheet.getRangeByIndexes(0, index, Math.max(100, sheet.getUsedRange().rowCount), 1).format.columnWidth = sheetWidths[index];
  }
}

await fs.mkdir(previewDir, { recursive: true });
for (const [sheetName, range, filename] of [
  ["Summary", "A1:K24", "summary.png"],
  ["Benchmarks", `A1:P${benchmarkRows.length + 5}`, "benchmarks.png"],
  ["Observations", `A1:J${observationRows.length + 5}`, "observations.png"],
  ["Quarterly Path", `A1:Q${pathRows.length + 5}`, "quarterly-path.png"],
  ["METR Horizon", `A1:I${metrRows.length + 5}`, "metr.png"],
  ["Frontier Signals", `A1:J${frontierRows.length + 5}`, "frontier-signals.png"],
  ["Research Evidence", `A1:I${researchRows.length + 5}`, "research-evidence.png"],
  ["Model Releases", `A1:I${releaseRows.length + 5}`, "model-releases.png"],
  ["Sources", `A1:G${sources.length + 5}`, "sources.png"],
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
  kind: "table", sheetId: "Summary", range: "A1:K24",
  include: "values,formulas", tableMaxRows: 40, tableMaxCols: 10, maxChars: 30_000,
});
await fs.mkdir(outputDir, { recursive: true });
await fs.writeFile(inspectPath, `${inspection.ndjson ?? inspection}\n`, "utf8");
const xlsx = await SpreadsheetFile.exportXlsx(workbook);
await xlsx.save(outputPath);
console.log(JSON.stringify({ snapshot: snapshot.id, outputPath, currentScore: forecast.capability.currentScore }, null, 2));
