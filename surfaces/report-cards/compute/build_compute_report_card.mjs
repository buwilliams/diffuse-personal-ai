import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "../../..");
const outputDir = path.join(projectRoot, "data", "reports");
const outputPath = `${outputDir}/personal-ai-compute-report-card.xlsx`;
const inspectPath = `${outputPath}.inspect.ndjson`;
const previewDir = path.join(projectRoot, "data", "previews", "compute");
const asOf = new Date(Date.UTC(2026, 7, 26));
const d = (iso) => new Date(`${iso}T00:00:00Z`);

const colors = {
  navy: "#081B2B", teal: "#0F766E", cyan: "#31D7C5", blue: "#CFE3F5",
  gold: "#C58B1B", lightGold: "#FFF3CF", pale: "#F5F8FA", white: "#FFFFFF",
  ink: "#17212B", muted: "#53606D", line: "#D6DFE6", green: "#147D64",
  greenFill: "#DDF4E8", red: "#B42318", redFill: "#FDE7E5", orangeFill: "#FFF0E0",
  yellowFill: "#FFF7CC", grayFill: "#EDF2F5",
};

const capacityCsvPath = path.join(projectRoot, "data", "sources", "compute-capacity-timeseries.csv");
const capacityInputs = (await fs.readFile(capacityCsvPath, "utf8"))
  .trim()
  .split(/\r?\n/)
  .slice(1)
  .map((line) => {
    const [quarterIndex, quarter, cutoffDate, h100e, includedSites, evidenceClass] = line.split(",");
    return [Number(quarterIndex), quarter, cutoffDate, Number(h100e), Number(includedSites), evidenceClass];
  });
const observed = capacityInputs.filter((row) => String(row[5]).startsWith("observed"));

const quarters = [];
for (let year = 2024; year <= 2028; year++) {
  for (let q = 1; q <= 4; q++) {
    const month = q * 3;
    const day = new Date(Date.UTC(year, month, 0)).getUTCDate();
    quarters.push({ index: quarters.length + 1, label: `${year}-Q${q}`, date: new Date(Date.UTC(year, month - 1, day)) });
  }
}
quarters[10].date = asOf;

const colName = (n) => { let s = ""; while (n > 0) { n--; s = String.fromCharCode(65 + n % 26) + s; n = Math.floor(n / 26); } return s; };

const workbook = Workbook.create();
const summary = workbook.worksheets.add("Summary");
const report = workbook.worksheets.add("Compute Report Card");
const model = workbook.worksheets.add("Quarterly Model");
const assumptions = workbook.worksheets.add("Assumptions");
const observations = workbook.worksheets.add("Observations");
const sources = workbook.worksheets.add("Sources");
for (const sheet of [summary, report, model, assumptions, observations, sources]) sheet.showGridLines = false;

function titleBand(sheet, range, title, subtitleRange, subtitle) {
  sheet.getRange(range).merge(); sheet.getRange(range).values = [[title]];
  sheet.getRange(range).format = { fill: colors.navy, font: { bold: true, color: colors.white, size: 18 }, verticalAlignment: "center" };
  sheet.getRange(subtitleRange).merge(); sheet.getRange(subtitleRange).values = [[subtitle]];
  sheet.getRange(subtitleRange).format = { fill: colors.navy, font: { color: "#BBD0DD", size: 10 }, verticalAlignment: "center", wrapText: true };
}
function sectionBand(sheet, range, text, fill = colors.teal) {
  sheet.getRange(range).merge(); sheet.getRange(range).values = [[text]];
  sheet.getRange(range).format = { fill, font: { bold: true, color: colors.white, size: 11 }, verticalAlignment: "center" };
}
function header(range, fill = colors.teal) {
  range.format = { fill, font: { bold: true, color: colors.white }, wrapText: true, verticalAlignment: "center", horizontalAlignment: "center", borders: { preset: "all", style: "thin", color: colors.line } };
}
function body(range) {
  range.format = { font: { color: colors.ink, size: 9 }, verticalAlignment: "top", wrapText: true, borders: { preset: "all", style: "thin", color: colors.line } };
}

// Assumptions and threshold logic.
titleBand(assumptions, "A1:I2", "Compute Threshold and Serving Envelope", "A3:I3", "Supply passes when U.S.-located operational compute can support 50% of the U.S. population at the high-autonomy personal-AI workload.");
sectionBand(assumptions, "A5:D5", "DIFFUSION THRESHOLD");
assumptions.getRange("A6:D12").values = [
  ["Input", "Value", "Unit", "Definition / source"],
  ["U.S. resident population", 342800000, "people", "User-specified rounded estimate; Census Population Clock"],
  ["Population share threshold", 0.50, "%", "User-selected supply threshold"],
  ["Target users", null, "people", "Population × threshold share"],
  ["Current quarter index", 11, "quarter", "2024-Q1 = 1; current is 2026-Q3"],
  ["As-of date", asOf, "date", "Evidence cutoff"],
  ["Required U.S. H100-equivalents", null, "H100e", "Capacity required under the serving and workload assumptions below"],
];
assumptions.getRange("B9").formulas = [["=B7*B8"]];
header(assumptions.getRange("A6:D6")); body(assumptions.getRange("A7:D12"));
assumptions.getRange("B7").format.numberFormat = "#,##0"; assumptions.getRange("B8").format.numberFormat = "0%"; assumptions.getRange("B9").format.numberFormat = "#,##0"; assumptions.getRange("B11").format.numberFormat = "yyyy-mm-dd"; assumptions.getRange("B12").format.numberFormat = "#,##0";

sectionBand(assumptions, "A14:D14", "SERVING ENVELOPE");
assumptions.getRange("A15:D25").values = [
  ["Input", "Value", "Unit", "Meaning"],
  ["Dense 8-bit ops per H100e-second", 1.979e15, "ops/s", "Epoch H100-equivalent convention"],
  ["Seconds per day", 86400, "seconds", "Calendar conversion"],
  ["Fleet share allocated to inference", 0.40, "%", "Remainder trains, fine-tunes, idles, or serves other workloads"],
  ["Sustained serving utilization", 0.35, "% of peak", "Latency, networking, availability, and utilization losses"],
  ["Active model parameters", 100000000000, "parameters", "Illustrative 100B active-parameter equivalent"],
  ["Forward-pass ops per parameter-token", 2, "ops", "Transformer rule of thumb"],
  ["System overhead multiplier", 1.5, "x", "Attention, routing, communication, and non-model overhead"],
  ["Serving-goodput multiplier", 1.0, "x", "No extra chip multiplier beyond H100e in the base case"],
  ["Personal-AI share of modeled inference", 0.50, "%", "Scenario allocation to the target cohort; not an observed fleet share"],
  ["Personal-AI compute-equivalent tokens / H100e / day", null, "tokens/day", "Derived serving supply available to the target cohort"],
];
assumptions.getRange("B25").formulas = [["=B16*B17*B18*B19*B23*B24/(B20*B21*B22)"]];
header(assumptions.getRange("A15:D15")); body(assumptions.getRange("A16:D25"));
assumptions.getRange("B16").format.numberFormat = "0.000E+00"; assumptions.getRange("B17").format.numberFormat = "#,##0"; assumptions.getRange("B18:B19").format.numberFormat = "0%"; assumptions.getRange("B20").format.numberFormat = "0.000E+00"; assumptions.getRange("B21:B23").format.numberFormat = "0.0"; assumptions.getRange("B24").format.numberFormat = "0%"; assumptions.getRange("B25").format.numberFormat = "#,##0";

sectionBand(assumptions, "F5:I5", "HIGH-AUTONOMY WORKLOAD");
assumptions.getRange("F6:I11").values = [
  ["Token component", "Tokens/user/day", "Compute weight", "Compute-equivalent/day"],
  ["Uncached input", 2000000, 1.0, null],
  ["Visible output", 300000, 2.5, null],
  ["Internal reasoning", 5000000, 2.5, null],
  ["Cached/reused context", 10000000, 0.15, null],
  ["Total", null, null, null],
];
for (let r = 7; r <= 10; r++) assumptions.getRange(`I${r}`).formulas = [[`=G${r}*H${r}`]];
assumptions.getRange("I11").formulas = [["=SUM(I7:I10)"]];
header(assumptions.getRange("F6:I6")); body(assumptions.getRange("F7:I11")); assumptions.getRange("F11:I11").format.fill = colors.lightGold; assumptions.getRange("F11:I11").format.font = { bold: true, color: colors.ink };
assumptions.getRange("G7:G10").format.numberFormat = "#,##0"; assumptions.getRange("H7:H10").format.numberFormat = "0.00x"; assumptions.getRange("I7:I11").format.numberFormat = "#,##0";
assumptions.getRange("B12").formulas = [["=B9*I11/B25"]];

sectionBand(assumptions, "F14:H14", "LETTER-GRADE SCALE");
assumptions.getRange("F15:H20").values = [["Letter", "Minimum score", "GPA"], ["A", 0.90, 4], ["B", 0.80, 3], ["C", 0.70, 2], ["D", 0.60, 1], ["F", 0.00, 0]];
header(assumptions.getRange("F15:H15")); body(assumptions.getRange("F16:H20")); assumptions.getRange("G16:G20").format.numberFormat = "0%";

sectionBand(assumptions, "A26:D26", "FORWARD CAPACITY PATH");
assumptions.getRange("A27:D35").values = [
  ["Parameter", "Value", "Unit", "Rule"],
  ["Pipeline log-capacity acceleration", null, "log2 H100e / quarter²", "OLS slope of the published forward-path quarterly log-growth rates"],
  ["Mean pipeline log growth", null, "log2 H100e / quarter", "Mean quarterly log growth across the published forward path"],
  ["First projected log growth", null, "log2 H100e / quarter", "Growth from the current snapshot to 2026-Q4"],
  ["First model row at full supply threshold", null, "position", "First score that reaches 100%; 'Beyond window' when extrapolation is required"],
  ["Projected supply crossing", null, "date", "Interpolate inside the report window; otherwise use dv/dh = k·v with k = acceleration / velocity"],
  ["Capability threshold", 0.60, "%", "First grade above F"],
  ["Projected capability crossing", d("2027-04-25"), "date", "First UTC day on which the shared-frontier capability path reaches 60%"],
  ["Countdown target", null, "date", "Later of supply and capability crossings"],
];
assumptions.getRange("B28").formulas = [["=SLOPE('Quarterly Model'!$G$17:$G$25,'Quarterly Model'!$A$17:$A$25)"]];
assumptions.getRange("B29").formulas = [["=AVERAGE('Quarterly Model'!$G$17:$G$25)"]];
assumptions.getRange("B30").formulas = [["='Quarterly Model'!G17"]];
assumptions.getRange("B31").formulas = [["=IFERROR(MATCH(1,'Quarterly Model'!$J$6:$J$25,0),\"Beyond window\")"]];
assumptions.getRange("B32").formulas = [["=IF(ISNUMBER(B31),INDEX('Quarterly Model'!$C$6:$C$25,B31-1)+(B12-INDEX('Quarterly Model'!$E$6:$E$25,B31-1))/(INDEX('Quarterly Model'!$E$6:$E$25,B31)-INDEX('Quarterly Model'!$E$6:$E$25,B31-1))*(INDEX('Quarterly Model'!$C$6:$C$25,B31)-INDEX('Quarterly Model'!$C$6:$C$25,B31-1)),'Quarterly Model'!$C$25+IF(ABS(B28)<0.000000001,(LN(B12/'Quarterly Model'!$E$25)/LN(2))/'Quarterly Model'!$G$25,IF(1+(B28/'Quarterly Model'!$G$25)*(LN(B12/'Quarterly Model'!$E$25)/LN(2))/'Quarterly Model'!$G$25<=0,NA(),LN(1+(B28/'Quarterly Model'!$G$25)*(LN(B12/'Quarterly Model'!$E$25)/LN(2))/'Quarterly Model'!$G$25)/(B28/'Quarterly Model'!$G$25)))*(365.2425/4))"]];
assumptions.getRange("B35").formulas = [["=MAX(B32,B34)"]];
header(assumptions.getRange("A27:D27")); body(assumptions.getRange("A28:D35")); assumptions.getRange("B28:B30").format.numberFormat = "0.000"; assumptions.getRange("B32").format.numberFormat = "yyyy-mm-dd"; assumptions.getRange("B33").format.numberFormat = "0%"; assumptions.getRange("B34:B35").format.numberFormat = "yyyy-mm-dd";
assumptions.freezePanes.freezeRows(3);

// Observed U.S. operational capacity.
titleBand(observations, "A1:G2", "U.S. AI-Compute Capacity Inputs", "A3:G3", "Observed operational capacity through 2026-08-26; later rows use the expected/projected site states and dates in the same Epoch timeline snapshot.");
observations.getRange("A5:G5").values = [["Quarter index", "Quarter", "Cutoff date", "U.S. operational H100e", "Included sites", "Evidence class", "Source URL"]];
observations.getRange("A6:G25").values = capacityInputs.map((r) => [r[0], r[1], d(r[2]), r[3], r[4], r[5] === "observed_quarter_end" ? "Observed quarter-end" : r[5] === "observed_qtd" ? "Observed QTD" : "Epoch projected pipeline", "https://epoch.ai/data/data_centers/data_center_timelines.csv"]);
header(observations.getRange("A5:G5")); body(observations.getRange("A6:G25")); observations.getRange("C6:C25").format.numberFormat = "yyyy-mm-dd"; observations.getRange("D6:E25").format.numberFormat = "#,##0";
observations.getRange("A17:G25").format.fill = colors.lightGold;
observations.tables.add("A5:G25", true, "USComputeCapacityInputsTable"); observations.freezePanes.freezeRows(5);

// Quarterly model.
titleBand(model, "A1:M2", "U.S. Compute Capacity — Observed and Projected", "A3:M3", "Observed capacity through 2026-Q3; later quarters aggregate the expected/projected site states in Epoch's dated buildout pipeline. Score is supported users ÷ 50% U.S. population, capped at 100%.");
model.getRange("A5:M5").values = [["Quarter index", "Quarter", "Cutoff", "Phase", "U.S. H100e", "log2 H100e", "Log growth / qtr", "Compute-eq tokens/day", "Supported users", "Score vs threshold", "Rate", "Letter", "GPA"]];
header(model.getRange("A5:M5"));
for (let i = 0; i < quarters.length; i++) {
  const row = 6 + i; const q = quarters[i];
  model.getRange(`A${row}:D${row}`).values = [[q.index, q.label, q.date, q.index <= 11 ? (q.index === 11 ? "Observed QTD" : "Observed") : "Projected"]];
  model.getRange(`E${row}`).formulas = [[`=SUMIFS('Observations'!$D$6:$D$25,'Observations'!$A$6:$A$25,A${row})`]];
  model.getRange(`F${row}`).formulas = [[`=LN(E${row})/LN(2)`]];
  model.getRange(`G${row}`).formulas = [[i === 0 ? `=""` : `=F${row}-F${row-1}`]];
  model.getRange(`H${row}`).formulas = [[`=E${row}*'Assumptions'!$B$25`]];
  model.getRange(`I${row}`).formulas = [[`=H${row}/'Assumptions'!$I$11`]];
  model.getRange(`J${row}`).formulas = [[`=MIN(1,I${row}/'Assumptions'!$B$9)`]];
  model.getRange(`K${row}`).formulas = [[i === 0 ? `=""` : `=J${row}-J${row-1}`]];
  model.getRange(`L${row}`).formulas = [[`=IF(J${row}>='Assumptions'!$G$16,"A",IF(J${row}>='Assumptions'!$G$17,"B",IF(J${row}>='Assumptions'!$G$18,"C",IF(J${row}>='Assumptions'!$G$19,"D","F"))))`]];
  model.getRange(`M${row}`).formulas = [[`=IF(J${row}>='Assumptions'!$G$16,'Assumptions'!$H$16,IF(J${row}>='Assumptions'!$G$17,'Assumptions'!$H$17,IF(J${row}>='Assumptions'!$G$18,'Assumptions'!$H$18,IF(J${row}>='Assumptions'!$G$19,'Assumptions'!$H$19,'Assumptions'!$H$20))))`]];
}
body(model.getRange("A6:M25")); model.getRange("C6:C25").format.numberFormat = "yyyy-mm-dd"; model.getRange("E6:E25").format.numberFormat = "#,##0"; model.getRange("F6:G25").format.numberFormat = "0.000"; model.getRange("H6:H25").format.numberFormat = "0.00E+00"; model.getRange("I6:I25").format.numberFormat = "#,##0"; model.getRange("J6:K25").format.numberFormat = "0.0%"; model.getRange("M6:M25").format.numberFormat = "0.0";
model.getRange("D17:M25").format.fill = colors.lightGold; model.tables.add("A5:M25", true, "QuarterlyComputeModelTable"); model.freezePanes.freezeRows(5); model.freezePanes.freezeColumns(2);

// Compute report card wide view.
titleBand(report, "A1:AV2", "Compute Report Card — U.S. Supply for Diffuse Personal AI", "A3:AV3", "One score: the share of the 50%-of-U.S.-population threshold that operational American compute can support. Observed through 2026-Q3; projected through 2028-Q4.");
report.getRange("A4:A5").merge(); report.getRange("B4:B5").merge(); report.getRange("A4:B4").values = [["Benchmark", "Definition"]];
for (let i = 0; i < quarters.length; i++) {
  const start = 3 + i * 2; const range = `${colName(start)}4:${colName(start + 1)}4`;
  report.getRange(range).merge(); report.getRange(range).values = [[quarters[i].label]];
  report.getRange(`${colName(start)}5:${colName(start + 1)}5`).values = [["Score", "Rate"]];
}
report.getRange("AQ4:AV4").merge(); report.getRange("AQ4:AV4").values = [["CURRENT STATUS & CROSSING"]];
report.getRange("AQ5:AV5").values = [["Current score", "Letter", "GPA", "Supply crossing", "First projected growth", "Pipeline acceleration"]];
header(report.getRange("A4:AV5"));
for (let i = 0; i < quarters.length; i++) { const start = 3 + i * 2; report.getRange(`${colName(start)}4:${colName(start + 1)}5`).format.fill = i < 11 ? colors.teal : colors.gold; }
report.getRange("A6:B6").values = [["U.S. high-autonomy population coverage", "Supported high-autonomy users ÷ 50% of U.S. resident population; capped at 100%"]];
for (let i = 0; i < quarters.length; i++) { const start = 3 + i * 2; const mrow = 6 + i; report.getRange(`${colName(start)}6:${colName(start + 1)}6`).formulas = [[`='Quarterly Model'!J${mrow}`, `='Quarterly Model'!K${mrow}`]]; report.getRange(`${colName(start)}6:${colName(start + 1)}6`).format.fill = i < 11 ? colors.blue : colors.lightGold; }
report.getRange("AQ6:AV6").formulas = [["='Quarterly Model'!J16", "='Quarterly Model'!L16", "='Quarterly Model'!M16", "='Assumptions'!B32", "='Assumptions'!B30", "='Assumptions'!B28"]];
body(report.getRange("A6:AV6")); report.getRange("C6:AR6").format.numberFormat = "0.0%"; report.getRange("AQ6").format.numberFormat = "0.0%"; report.getRange("AS6").format.numberFormat = "0.0"; report.getRange("AT6").format.numberFormat = "yyyy-mm-dd"; report.getRange("AU6:AV6").format.numberFormat = "0.000";
report.getRange("AR6").conditionalFormats.addCustom("=AR6=\"F\"", { fill: colors.redFill, font: { color: colors.red, bold: true } }); report.freezePanes.freezeRows(5); report.freezePanes.freezeColumns(2);

// Summary.
titleBand(summary, "A1:N2", "Compute Gate for Diffuse Personal AI", "A3:N3", "Supply is measured in U.S.-located operational H100-equivalents and translated into supported high-autonomy users under a visible serving envelope.");
const cards = [["A5:C5", "CURRENT SCORE"], ["D5:F5", "CURRENT U.S. H100e"], ["G5:I5", "SUPPORTED USERS"], ["J5:L5", "SUPPLY CROSSING"], ["M5:N5", "LETTER"]];
for (const [range, label] of cards) sectionBand(summary, range, label, label === "SUPPLY CROSSING" ? colors.gold : colors.teal);
for (const range of ["A6:C9", "D6:F9", "G6:I9", "J6:L9", "M6:N9"]) summary.getRange(range).merge();
summary.getRange("A6").formulas = [["='Quarterly Model'!J16"]]; summary.getRange("D6").formulas = [["='Quarterly Model'!E16"]]; summary.getRange("G6").formulas = [["='Quarterly Model'!I16"]]; summary.getRange("J6").formulas = [["='Assumptions'!B32"]]; summary.getRange("M6").formulas = [["='Quarterly Model'!L16"]];
for (const cell of ["A6", "D6", "G6", "J6", "M6"]) summary.getRange(cell).format = { fill: colors.white, font: { bold: true, color: colors.navy, size: 22 }, horizontalAlignment: "center", verticalAlignment: "center", borders: { preset: "all", style: "thin", color: colors.line } };
summary.getRange("A6").format.numberFormat = "0.0%"; summary.getRange("D6:G6").format.numberFormat = "#,##0"; summary.getRange("J6").format.numberFormat = "yyyy-mm-dd";

sectionBand(summary, "A11:F11", "TWO-KEY DIFFUSION GATE");
summary.getRange("A12:F15").values = [["Gate", "Threshold", "Current", "Projected crossing", "Status", "Source"], ["Demand / capability", "Capability report ≥60%", 0.45660533834944794, d("2027-04-25"), "Waiting", "Model-harness report card"], ["Supply / compute", "Serve 50% of U.S. population", null, null, "Waiting", "This workbook"], ["Countdown target", "Both gates passed", null, null, "Later crossing", "MAX(capability, supply)"]];
summary.getRange("C14").formulas = [["='Quarterly Model'!J16"]]; summary.getRange("D14").formulas = [["='Assumptions'!B32"]]; summary.getRange("D15").formulas = [["='Assumptions'!B35"]];
header(summary.getRange("A12:F12")); body(summary.getRange("A13:F15")); summary.getRange("C13:C14").format.numberFormat = "0.0%"; summary.getRange("D13:D15").format.numberFormat = "yyyy-mm-dd"; summary.getRange("A15:F15").format.fill = colors.lightGold; summary.getRange("A15:F15").format.font = { bold: true, color: colors.ink };

sectionBand(summary, "A18:C18", "QUARTERLY SUPPLY SCORE");
summary.getRange("A19:C19").values = [["Quarter", "Supply score", "Full threshold"]];
for (let i = 0; i < quarters.length; i++) { const row = 20 + i; const mrow = 6 + i; summary.getRange(`A${row}:C${row}`).formulas = [[`='Quarterly Model'!B${mrow}`, `='Quarterly Model'!J${mrow}`, "=1"]]; }
header(summary.getRange("A19:C19")); body(summary.getRange("A20:C39")); summary.getRange("B20:C39").format.numberFormat = "0%";
const chart = summary.charts.add("line", summary.getRange("A19:C39")); chart.title = "Published U.S. buildout pipeline approaches the threshold through 2028"; chart.hasLegend = true; chart.xAxis = { axisType: "textAxis", textStyle: { fontSize: 8 } }; chart.yAxis = { numberFormatCode: "0%", min: 0, max: 1 }; chart.setPosition("E18", "N36");

summary.getRange("A41:N44").values = [
  ["Interpretation", "At the 50% personal-AI inference allocation, current U.S. operational capacity supports about 32 million high-autonomy users—18.8% of the 171.4 million-user threshold.", null, null, null, null, null, null, null, null, null, null, null, null],
  ["Projection", "The base path sums dated expected or projected operating states in Epoch's current U.S. buildout timeline. Beyond that window, log-growth follows dv/dh = k·v with k = acceleration / velocity; this causal feedback is a scenario assumption.", null, null, null, null, null, null, null, null, null, null, null, null],
  ["Boundary", "H100e already normalizes chip peak compute. No separate Jalapeño, Cerebras, or Rubin multiplier is added unless it represents deployed serving goodput beyond the H100e convention.", null, null, null, null, null, null, null, null, null, null, null, null],
  ["Caution", "Epoch covers publicly tracked large sites rather than the full U.S. fleet. Project timing and quantity are uncertain. The editable base case allocates 50% of modeled inference supply to this personal-AI cohort.", null, null, null, null, null, null, null, null, null, null, null, null],
];
for (let r = 41; r <= 44; r++) { summary.getRange(`B${r}:N${r}`).merge(); body(summary.getRange(`A${r}:N${r}`)); summary.getRange(`A${r}`).format = { fill: colors.lightGold, font: { bold: true, color: colors.ink }, borders: { preset: "all", style: "thin", color: colors.line } }; }
summary.freezePanes.freezeRows(3);

// Sources.
titleBand(sources, "A1:F2", "Source Registry", "A3:F3", "Primary inputs and the main limitations that matter for the compute crossing date.");
sources.getRange("A5:F5").values = [["Source ID", "Publisher", "Title / dataset", "Updated / accessed", "Public URL", "Use and limitation"]];
sources.getRange("A6:F11").values = [
  ["SRC-001", "Epoch AI", "AI Data Centers", asOf, "https://epoch.ai/data/ai-data-centers", "Dataset scope, H100e convention, coverage, and uncertainty"],
  ["SRC-002", "Epoch AI", "AI Data Center Timelines CSV", d("2026-08-25"), "https://epoch.ai/data/data_centers/data_center_timelines.csv", "Observed quarters use latest operational state at each cutoff; forward quarters use the latest expected/projected state dated by each cutoff"],
  ["SRC-003", "Epoch AI", "AI Data Centers CSV", d("2026-08-25"), "https://epoch.ai/data/data_centers/data_centers.csv", "Country filter and current site registry"],
  ["SRC-004", "U.S. Census Bureau", "Population on a Date", d("2026-07-26"), "https://www.census.gov/popclock/", "Model uses the user-specified rounded estimate of 342.8M residents; the selected target is 50%, or 171.4M users"],
  ["SRC-005", "Personal AI forecast", "Report-card calculation contract", asOf, "https://github.com/buwilliams/diffuse-personal-ai/blob/main/intent/02-model/06-report-card-calculations.md", "Serving envelope and high-autonomy token mix; assumptions remain editable"],
  ["SRC-006", "Personal AI forecast", "Model-harness capability report card — HTML", asOf, "https://diffuse-personal-ai-countdown.buddywilliams.chatgpt.site/?report=capability", "Capability first reaches 60% on the daily shared-frontier path on 2027-04-25"],
];
header(sources.getRange("A5:F5")); body(sources.getRange("A6:F11")); sources.getRange("D6:D11").format.numberFormat = "yyyy-mm-dd"; sources.tables.add("A5:F11", true, "ComputeSourcesTable"); sources.freezePanes.freezeRows(5);

// Layout.
const widths = {
  Summary: [22, 28, 16, 17, 22, 22, 16, 16, 16, 16, 16, 16, 16, 16],
  "Compute Report Card": [34, 48, ...Array(40).fill(9), 13, 9, 9, 15, 13, 13],
  "Quarterly Model": [12, 12, 14, 14, 16, 14, 16, 21, 18, 17, 12, 9, 8],
  Assumptions: [35, 19, 21, 48, 3, 24, 21, 18, 24],
  Observations: [13, 12, 14, 23, 18, 22, 58],
  Sources: [12, 22, 35, 18, 58, 58],
};
for (const sheet of [summary, report, model, assumptions, observations, sources]) {
  const w = widths[sheet.name]; for (let i = 0; i < w.length; i++) sheet.getRangeByIndexes(0, i, 120, 1).format.columnWidth = w[i];
  sheet.getRange("1:1").format.rowHeight = 28; sheet.getRange("2:2").format.rowHeight = 28; sheet.getRange("3:3").format.rowHeight = 30; sheet.getUsedRange().format.autofitRows();
}
report.getRange("4:5").format.rowHeight = 34; report.getRange("6:6").format.rowHeight = 54; model.getRange("5:5").format.rowHeight = 42; assumptions.getRange("6:6").format.rowHeight = 34; summary.getRange("41:44").format.rowHeight = 38;

// Render, inspect, and export.
await fs.mkdir(previewDir, { recursive: true });
const previews = [["Summary", "A1:N44", "summary.png", 0.9], ["Compute Report Card", "A1:P6", "report-left.png", 0.9], ["Compute Report Card", "AO1:AV6", "report-current.png", 1], ["Quarterly Model", "A1:M25", "quarterly-model.png", 0.85], ["Assumptions", "A1:I35", "assumptions.png", 0.9], ["Observations", "A1:G25", "observations.png", 0.9], ["Sources", "A1:F11", "sources.png", 1]];
for (const [sheetName, range, name, scale] of previews) { const image = await workbook.render({ sheetName, range, autoCrop: "all", scale, format: "png" }); await fs.writeFile(`${previewDir}/${name}`, new Uint8Array(await image.arrayBuffer())); }
const key = await workbook.inspect({ kind: "table", sheetId: "Summary", range: "A5:N15", include: "values,formulas", tableMaxRows: 20, tableMaxCols: 16, maxChars: 12000 }); console.log(key.ndjson ?? key);
const errors = await workbook.inspect({ kind: "match", searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A", options: { useRegex: true, maxResults: 200 }, maxChars: 8000 }); console.log(errors.ndjson ?? errors);
const inspectTargets = [
  ["Summary", "A1:N44"],
  ["Compute Report Card", "A1:AV6"],
  ["Quarterly Model", "A1:M25"],
  ["Assumptions", "A1:I35"],
  ["Observations", "A1:G25"],
  ["Sources", "A1:F11"],
];
const inspectChunks = [];
for (const [sheetId, range] of inspectTargets) {
  const inspection = await workbook.inspect({ kind: "table", sheetId, range, include: "values,formulas", tableMaxRows: 500, tableMaxCols: 80, tableMaxCellChars: 500, maxChars: 2_000_000 });
  inspectChunks.push(inspection.ndjson ?? String(inspection));
}
await fs.mkdir(outputDir, { recursive: true });
await fs.writeFile(inspectPath, `${inspectChunks.join("\n")}\n`, "utf8");
const xlsx = await SpreadsheetFile.exportXlsx(workbook);
await xlsx.save(outputPath);
console.log(`SAVED ${outputPath}`);
