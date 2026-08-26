import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "../../..");
const outputDir = path.join(projectRoot, "data", "reports", "legacy");
const outputPath = `${outputDir}/personal-ai-system-capability-and-data-center-buildouts.xlsx`;
const previewDir = path.join(projectRoot, "data", "previews", "legacy");
const asOf = new Date(Date.UTC(2026, 7, 26));
const d = (iso) => iso ? new Date(`${iso}T00:00:00Z`) : null;

const colors = {
  navy: "#0B1F33",
  teal: "#0F766E",
  lightTeal: "#DDF4F1",
  blue: "#DCEAF7",
  gold: "#C58B1B",
  lightGold: "#FFF4D6",
  ink: "#17212B",
  muted: "#53606D",
  line: "#D7DEE5",
  pale: "#F5F8FA",
  white: "#FFFFFF",
  red: "#B42318",
  green: "#147D64",
};

const workbook = Workbook.create();
const summary = workbook.worksheets.add("Summary");
const ledger = workbook.worksheets.add("Buildout Ledger");
const milestones = workbook.worksheets.add("Milestones");
const history = workbook.worksheets.add("Capacity History");
const capability = workbook.worksheets.add("Capability Evidence");
const demand = workbook.worksheets.add("Demand Archetypes");
const serving = workbook.worksheets.add("Serving Model");
const sources = workbook.worksheets.add("Sources");

for (const sheet of [summary, ledger, milestones, history, capability, demand, serving, sources]) {
  sheet.showGridLines = false;
}

function titleBand(sheet, range, title, subtitleRange, subtitle) {
  sheet.getRange(range).merge();
  sheet.getRange(range).values = [[title]];
  sheet.getRange(range).format = {
    fill: colors.navy,
    font: { bold: true, color: colors.white, size: 18 },
    verticalAlignment: "center",
  };
  sheet.getRange(subtitleRange).merge();
  sheet.getRange(subtitleRange).values = [[subtitle]];
  sheet.getRange(subtitleRange).format = {
    fill: colors.navy,
    font: { color: "#C9D7E3", size: 10 },
    verticalAlignment: "center",
    wrapText: true,
  };
}

function sectionBand(sheet, range, text, fill = colors.teal) {
  sheet.getRange(range).merge();
  sheet.getRange(range).values = [[text]];
  sheet.getRange(range).format = {
    fill,
    font: { bold: true, color: colors.white, size: 11 },
    verticalAlignment: "center",
  };
}

function styleHeader(range) {
  range.format = {
    fill: colors.teal,
    font: { bold: true, color: colors.white },
    wrapText: true,
    verticalAlignment: "center",
    borders: { preset: "all", style: "thin", color: colors.line },
  };
}

function styleBody(range) {
  range.format = {
    font: { color: colors.ink, size: 9 },
    verticalAlignment: "top",
    wrapText: true,
    borders: { preset: "all", style: "thin", color: colors.line },
  };
}

// Summary
titleBand(
  summary,
  "A1:L2",
  "Personal AI Forecast — Two Success-Compression Metrics",
  "A3:L3",
  "System capability includes the model and its harness. Infrastructure counts only energized, operational AI compute. As of 2026-08-26."
);
sectionBand(summary, "A5:D5", "SCM 1 — SYSTEM CAPABILITY");
sectionBand(summary, "E5:H5", "SCM 2 — OPERATIONAL COMPUTE");
sectionBand(summary, "I5:L5", "FORECAST INTERPRETATION", colors.gold);

summary.getRange("A6:D10").values = [
  ["Measure", "Value", "Unit", "Interpretation"],
  ["METR TH1.1 P50 doubling, ≥2023", 130.8, "days", "Model + evaluation scaffold system trend"],
  ["METR TH1.1 P50 doubling, ≥2024", 88.6, "days", "Recent fit; sensitive to task mix and ceiling"],
  ["Best verified ARC-AGI-3 model", 0.3016, "score", "Claude Opus 5 High, standard verified run"],
  ["Best ARC-AGI-3 public-demo system", 1, "score", "Tycho; self-reported public-demo track"],
];
summary.getRange("E6:H10").values = [
  ["Measure", "Value", "Unit", "Interpretation"],
  ["Epoch tracked operational capacity", 14400000, "H100e", "83 covered sites; not a complete global census"],
  ["Epoch tracked operational IT power", 13000, "MW", "Current public estimate across covered sites"],
  ["Reconstructed aggregate doubling", 156.4, "days", "OLS on monthly log capacity, Aug 2024–Aug 2026"],
  ["Largest-site frontier doubling", 7, "months", "Published Epoch trend since Aug 2024"],
];
summary.getRange("I6:L10").values = [
  ["State", "Capability", "Compute", "Implication"],
  ["Constrained", "Low", "Low", "No broad delegation"],
  ["Scarce competence", "High", "Low", "Capable but rationed/expensive"],
  ["Unused capacity", "Low", "High", "Cheap inference without reliable agency"],
  ["Deployment window", "High", "High", "Necessary condition for rapid delegation"],
];
for (const r of [summary.getRange("A6:D6"), summary.getRange("E6:H6"), summary.getRange("I6:L6")]) styleHeader(r);
for (const r of [summary.getRange("A7:D10"), summary.getRange("E7:H10"), summary.getRange("I7:L10")]) styleBody(r);
summary.getRange("B9:B10").format.numberFormat = "0.0%";
summary.getRange("F7:F8").format.numberFormat = "#,##0";
summary.getRange("F9:F10").format.numberFormat = "0.0";

sectionBand(summary, "A12:L12", "DEFINITIONS AND MEASUREMENT RULES");
summary.getRange("A13:L19").values = [
  ["Metric", "Symbol", "Numerator / object", "Unit", "What is held fixed", "What may improve", "Primary series", "Diagnostic", "Update trigger", "Main caveat", "Current signal", "Decision use"],
  ["System capability", "Hsys50(t)", "Longest human-duration task at 50% success", "minutes or hours", "Task suite, tools/permissions envelope, time/step/cost budget", "Model, memory, planning, tool routing, verification, UI policy", "METR-style time horizon", "Frozen-harness reruns for model attribution", "Every material model or harness release", "Suite/eval changes can move the level", "Doubling roughly 3–4 months on recent fits", "Is reliable autonomy arriving fast enough?"],
  ["Harness contribution", "Δh", "Same model and task under two harnesses", "log-ratio or score points", "Model, benchmark split, resource budget", "Harness only", "Controlled paired evaluation", "ARC-AGI-3 public systems are evidence, not a controlled estimate", "Every material harness release", "Different tracks cannot identify causal uplift", "Public-demo systems reached 99–100%", "How much capability is unlocked above the base model?"],
  ["Operational compute", "Cops(t)", "Energized accelerator capacity at covered AI sites", "H100-equivalents", "Equivalence convention and coverage rule", "New sites, chips, commissioning", "Epoch data-center timeline", "IT MW and largest-site frontier", "New site/phase becomes operational", "Public tracker coverage is incomplete", "14.4M H100e across 83 covered sites", "Can capability be served economically at scale?"],
  ["Buildout pipeline", "Cpipe(t,q)", "Dated capacity milestones weighted by confidence", "H100e by quarter", "Project scope and milestone definitions", "Construction, power, chips, schedule", "Project milestone ledger", "IT MW, permitting, power source", "Any revised milestone or commissioning evidence", "Announcements do not equal live capacity", "Multi-million-H100e sites cluster in 2027–28", "Lead indicator; excluded from Cops until live"],
  ["Consumer delegation", "D(t)", "Share of eligible consumer interactions completed by agents", "% of eligible interactions", "Eligibility taxonomy and denominator", "Capability, availability, trust, product UX", "Observed adoption/outcome series", "Task-level conversion funnel", "Monthly/quarterly product data", "Capability is necessary but not sufficient", "Not yet directly measured", "Resolution criterion for the prediction"],
  ["Per-user token demand", "τa(t)", "Daily raw and compute-equivalent tokens for archetype a", "tokens/user/day", "Archetype definition and token weights", "Agent activity, reasoning, memory/context use", "Demand Archetypes sheet", "Input/output/internal/cached mix", "Product telemetry or capability-stage change", "A token is not a fixed amount of compute", "Illustrative span: 1e4–1e8 compute-equivalent tokens/day", "Translate operational capacity into supported users"],
];
styleHeader(summary.getRange("A13:L13"));
styleBody(summary.getRange("A14:L19"));

sectionBand(summary, "A20:L20", "WATCHLIST ROLL-UP — FORMULA-DRIVEN FROM BUILDOUT LEDGER");
summary.getRange("A21:L23").values = [
  ["Watchlist metric", null, "Value", "Unit", null, "Watchlist metric", null, "Value", "Unit", null, "Scope", "Note"],
  ["Current operational capacity", null, null, "H100e", null, "Ultimate named-project capacity", null, null, "H100e", null, "15 selected frontier projects", "Not the full Epoch dataset"],
  ["Additions due within 24 months", null, null, "H100e", null, "Current operational IT power", null, null, "MW", null, "Selected projects only", "Projected dates remain uncertain"],
];
summary.getRange("C22").formulas = [["=SUM('Buildout Ledger'!$H$6:$H$30)"]];
summary.getRange("H22").formulas = [["=SUM('Buildout Ledger'!$N$6:$N$30)"]];
summary.getRange("C23").formulas = [["=SUMIFS('Buildout Ledger'!$T$6:$T$30,'Buildout Ledger'!$J$6:$J$30,\">=\"&$B$34,'Buildout Ledger'!$J$6:$J$30,\"<=\"&$B$34+731)"]];
summary.getRange("H23").formulas = [["=SUM('Buildout Ledger'!$I$6:$I$30)"]];
styleHeader(summary.getRange("A21:L21"));
styleBody(summary.getRange("A22:L23"));
summary.getRange("C22:C23").format.numberFormat = "#,##0";
summary.getRange("H22:H23").format.numberFormat = "#,##0";

sectionBand(summary, "A25:L25", "UPDATE PROTOCOL");
summary.getRange("A26:L29").values = [
  ["1", "Add the new model–harness result to Capability Evidence; preserve model, harness, tools, budget, benchmark version, and track.", null, null, null, null, null, null, null, null, null, null],
  ["2", "Add or revise site milestones in Buildout Ledger and Milestones; do not move projected capacity into current capacity without commissioning evidence.", null, null, null, null, null, null, null, null, null, null],
  ["3", "Append the new aggregate operational snapshot to Capacity History and recompute the log-linear doubling estimate over fixed 12- and 24-month windows.", null, null, null, null, null, null, null, null, null, null],
  ["4", "Update the adoption forecast only after translating both SCMs through availability, price, trust, and consumer-product distribution.", null, null, null, null, null, null, null, null, null, null],
];
for (let row = 26; row <= 29; row++) {
  summary.getRange(`B${row}:L${row}`).merge();
  summary.getRange(`A${row}:L${row}`).format = {
    fill: row % 2 === 0 ? colors.pale : colors.white,
    font: { color: colors.ink, size: 10 },
    wrapText: true,
    verticalAlignment: "center",
    borders: { preset: "all", style: "thin", color: colors.line },
  };
  summary.getRange(`A${row}`).format = { fill: colors.lightTeal, font: { bold: true, color: colors.teal, size: 12 }, horizontalAlignment: "center", verticalAlignment: "center", borders: { preset: "all", style: "thin", color: colors.line } };
}
summary.getRange("A31:L32").merge();
summary.getRange("A31:L32").values = [["Key warning: ARC-AGI-3 verified model scores and community public-demo systems use different tracks and budgets. Their gap shows that the system envelope matters, but it is not a causal harness multiplier. Likewise, planned GW or H100e are pipeline evidence—not operational capacity."]];
summary.getRange("A31:L32").format = { fill: colors.lightGold, font: { color: "#6B4B00", italic: true }, wrapText: true, verticalAlignment: "center", borders: { preset: "outside", style: "thin", color: colors.gold } };
summary.getRange("A34:B34").values = [["As-of date", asOf]];
summary.getRange("A34:B34").format = { fill: colors.pale, font: { bold: true, color: colors.ink }, borders: { preset: "all", style: "thin", color: colors.line } };
summary.getRange("B34").format.numberFormat = "yyyy-mm-dd";
summary.freezePanes.freezeRows(3);

// Buildout Ledger
titleBand(ledger, "A1:U2", "Frontier AI Data-Center Buildout Ledger", "A3:U3", "Curated watchlist. Current capacity is operational; next and ultimate milestones are projections unless explicitly marked otherwise. Source estimates updated 2026-08-24/25.");
const ledgerHeaders = ["Project ID", "Project", "Owner", "Primary user", "Location", "Status", "Current evidence date", "Current H100e", "Current IT MW", "Next milestone", "Next H100e", "Next IT MW", "Ultimate date", "Ultimate H100e", "Ultimate IT MW", "Construction start", "Power / delivery note", "Confidence", "Months to next", "Next addition H100e", "Source URL"];
ledger.getRange("A5:U5").values = [ledgerHeaders];
const ledgerRows = [
  ["DC-001", "Colossus 2", "SpaceXAI", "SpaceXAI; Anthropic; Cursor", "Memphis, TN, US", "Operational + expanding", d("2026-08-25"), 1112000, 946, d("2027-03-31"), 1824000, 1531, d("2027-03-31"), 1824000, 1531, d("2025-02-28"), "On-site gas turbines plus grid; staged cooling/commissioning", "Medium-high", null, null, "https://epoch.ai/data/ai-data-centers/directory/colossus-2"],
  ["DC-002", "Microsoft Fairwater Atlanta", "Microsoft", "OpenAI; Microsoft (likely)", "Fayetteville, GA, US", "Operational", d("2026-08-25"), 769000, 636, null, null, null, d("2026-06-14"), 769000, 636, d("2023-04-09"), "Grid; buildings 3–4 operational by June 2026 estimate", "Medium-high", null, null, "https://epoch.ai/data/ai-data-centers/directory/microsoft-fairwater-atlanta"],
  ["DC-003", "Google Pryor (North)", "Google", "Google DeepMind (speculative)", "Pryor, OK, US", "Operational", d("2026-08-25"), 763000, 368, null, null, null, d("2026-08-24"), 763000, 368, d("2024-07-19"), "Grid; TPU equivalence estimate jumped when Building 2 entered service", "Medium", null, null, "https://epoch.ai/data/ai-data-centers/directory/google-pryor-north"],
  ["DC-004", "Anthropic–Amazon New Carlisle", "Amazon", "Anthropic", "New Carlisle, IN, US", "Operational + expanding", d("2026-08-25"), 686000, 910, d("2028-03-31"), 1746000, 1925, d("2028-03-31"), 1746000, 1925, d("2025-05-10"), "Grid; Project Rainier; Trainium2-equivalent estimate", "Medium", null, null, "https://epoch.ai/data/ai-data-centers/directory/anthropic-amazon-new-carlisle"],
  ["DC-005", "Meta Prometheus", "Meta", "Meta", "New Albany, OH, US", "Operational + expanding", d("2026-08-25"), 677000, 562, d("2026-10-01"), 864000, 716, d("2027-01-28"), 1031000, 854, d("2025-06-01"), "Grid plus Socrates gas plants; modular/tent buildout", "Medium", null, null, "https://epoch.ai/data/ai-data-centers/directory/meta-prometheus"],
  ["DC-006", "Google New Albany", "Google", "Google DeepMind (speculative)", "New Albany, OH, US", "Operational", d("2026-08-25"), 616000, 453, null, null, null, d("2026-08-25"), 616000, 453, null, "Grid; mixed TPU generations; H100e estimate depends on equivalence model", "Medium", null, null, "https://epoch.ai/data/ai-data-centers/directory/google-new-albany"],
  ["DC-007", "OpenAI Stargate Abilene", "Oracle", "OpenAI", "Abilene, TX, US", "Operational + expanding", d("2026-08-25"), 509000, 421, d("2026-12-31"), 1019000, 843, d("2026-12-31"), 1019000, 843, d("2024-04-01"), "Grid/on-site generation; first Stargate site", "Medium-high", null, null, "https://epoch.ai/data/ai-data-centers/directory/openai-stargate-abilene"],
  ["DC-008", "Microsoft Fairwater Wisconsin", "Microsoft", "OpenAI; Microsoft (likely)", "Mount Pleasant, WI, US", "Operational + expanding", d("2026-08-25"), 446000, 369, d("2027-03-31"), 891000, null, d("2028-06-30"), 4528000, 2263, d("2025-09-26"), "Grid; ultimate estimate much larger than first-phase hardware table", "Medium-low", null, null, "https://epoch.ai/data/ai-data-centers/directory/microsoft-fairwater-wisconsin"],
  ["DC-009", "Goodnight", "Google (speculative)", "Google DeepMind (speculative)", "Claude, TX, US", "Under construction", d("2026-08-24"), 0, 0, d("2027-10-01"), 2279000, 1006, d("2027-10-01"), 2279000, 1006, d("2025-01-01"), "Grid; six-building commissioning projection", "Medium-low", null, null, "https://epoch.ai/data/ai-data-centers/directory/goodnight"],
  ["DC-010", "QTS Cedar Rapids", "Undisclosed / QTS", "Undisclosed", "Cedar Rapids, IA, US", "Under construction", d("2026-08-24"), 0, 0, d("2026-11-15"), 1137000, 448, d("2027-11-15"), 3669000, 1133, d("2025-01-17"), "Grid request; Phase 1 late-2026 and Phase 2 late-2027 estimates", "Medium-low", null, null, "https://epoch.ai/data/ai-data-centers/directory/qts-cedar-rapids"],
  ["DC-011", "Meta Hyperion", "Meta", "Meta", "Holly Ridge, LA, US", "Under construction", d("2026-08-25"), 0, 0, d("2028-01-01"), 4254000, 1676, d("2028-01-01"), 4254000, 1676, d("2024-12-20"), "1.8 GW grid load plus gas turbines; Meta cites 5 GW ultimate cluster", "Medium", null, null, "https://epoch.ai/data/ai-data-centers/directory/meta-hyperion"],
  ["DC-012", "OpenAI Stargate New Mexico", "Oracle", "OpenAI", "Santa Teresa, NM, US", "Under construction", d("2026-08-25"), 0, 0, d("2028-12-31"), 5104000, 1750, d("2028-12-31"), 5104000, 1750, d("2025-10-01"), "Up to 2.45 GW fuel-cell microgrid; construction visible June 2026", "Medium-low", null, null, "https://epoch.ai/data/ai-data-centers/directory/openai-stargate-new-mexico"],
  ["DC-013", "OpenAI Stargate Shackelford", "Oracle", "OpenAI", "Abilene, TX, US", "Under construction", d("2026-08-24"), 0, 0, d("2027-01-01"), 310000, null, d("2028-11-11"), 4563000, 1400, d("2025-07-01"), "Vantage Frontier campus; 10-building staged estimate", "Medium-low", null, null, "https://epoch.ai/data/ai-data-centers/directory/openai-stargate-shackelford"],
  ["DC-014", "OpenAI Stargate Michigan", "Oracle", "OpenAI", "Benton, MI, US", "Under construction", d("2026-08-24"), 0, 0, d("2028-12-31"), 2880000, 988, d("2028-12-31"), 2880000, 988, d("2025-12-04"), "Grid; maximum load timing may slip by one year", "Low-medium", null, null, "https://epoch.ai/data/ai-data-centers/directory/openai-stargate-michigan"],
  ["DC-015", "OpenAI Stargate UAE", "G42 (likely)", "OpenAI", "Abu Dhabi, UAE", "Under construction", d("2026-08-25"), 0, 0, d("2026-12-01"), 253000, null, d("2028-03-31"), 2021000, 1000, d("2025-01-01"), "Power source not resolved in tracker; export approvals are a gating risk", "Low-medium", null, null, "https://epoch.ai/data/ai-data-centers/directory/openai-stargate-uae"],
];
ledger.getRange(`A6:U${5 + ledgerRows.length}`).values = ledgerRows;
ledger.getRange("S6").formulas = [["=IF(J6=\"\",\"\",(J6-Summary!$B$34)/30.4375)"]];
ledger.getRange(`S6:S${5 + ledgerRows.length}`).fillDown();
ledger.getRange("T6").formulas = [["=IF(K6=\"\",0,MAX(0,K6-H6))"]];
ledger.getRange(`T6:T${5 + ledgerRows.length}`).fillDown();
styleHeader(ledger.getRange("A5:U5"));
styleBody(ledger.getRange(`A6:U${5 + ledgerRows.length}`));
ledger.getRange(`H6:I${5 + ledgerRows.length}`).format.numberFormat = "#,##0";
ledger.getRange(`K6:L${5 + ledgerRows.length}`).format.numberFormat = "#,##0";
ledger.getRange(`N6:O${5 + ledgerRows.length}`).format.numberFormat = "#,##0";
ledger.getRange(`G6:G${5 + ledgerRows.length}`).format.numberFormat = "yyyy-mm-dd";
ledger.getRange(`J6:J${5 + ledgerRows.length}`).format.numberFormat = "yyyy-mm-dd";
ledger.getRange(`M6:M${5 + ledgerRows.length}`).format.numberFormat = "yyyy-mm-dd";
ledger.getRange(`P6:P${5 + ledgerRows.length}`).format.numberFormat = "yyyy-mm-dd";
ledger.getRange(`S6:S${5 + ledgerRows.length}`).format.numberFormat = "0.0";
ledger.getRange(`T6:T${5 + ledgerRows.length}`).format.numberFormat = "#,##0";
ledger.getRange(`F6:F${5 + ledgerRows.length}`).dataValidation = { rule: { type: "list", values: ["Operational", "Operational + expanding", "Under construction", "Announced", "Cancelled"] } };
ledger.getRange(`R6:R${5 + ledgerRows.length}`).dataValidation = { rule: { type: "list", values: ["High", "Medium-high", "Medium", "Medium-low", "Low-medium", "Low"] } };
ledger.tables.add(`A5:U${5 + ledgerRows.length}`, true, "BuildoutLedgerTable");
ledger.freezePanes.freezeRows(5);
ledger.freezePanes.freezeColumns(2);

// Milestones
titleBand(milestones, "A1:I2", "Selected Capacity Milestones", "A3:I3", "Observed and projected commissioning steps for the largest watchlist projects. Projection rows are forecast inputs and do not enter operational capacity before verification.");
const milestoneHeaders = ["Project ID", "Project", "Date", "Evidence class", "H100e after milestone", "IT MW after milestone", "Change vs prior", "Source URL", "Note"];
milestones.getRange("A5:I5").values = [milestoneHeaders];
const milestoneRows = [
  ["DC-001", "Colossus 2", d("2025-10-19"), "Observed estimate", 278000, 239, null, "https://epoch.ai/data/ai-data-centers/directory/colossus-2", "First reported cluster online"],
  ["DC-001", "Colossus 2", d("2026-04-06"), "Observed estimate", 556000, 490, 278000, "https://epoch.ai/data/ai-data-centers/directory/colossus-2", "Second expansion stage"],
  ["DC-001", "Colossus 2", d("2026-08-25"), "Current estimate", 1112000, 946, 556000, "https://epoch.ai/data/ai-data-centers/directory/colossus-2", "Largest currently tracked site"],
  ["DC-001", "Colossus 2", d("2027-03-31"), "Projected", 1824000, 1531, 712000, "https://epoch.ai/data/ai-data-centers/directory/colossus-2", "Q1 2027 projection"],
  ["DC-005", "Meta Prometheus", d("2026-08-25"), "Current estimate", 677000, 562, null, "https://epoch.ai/data/ai-data-centers/directory/meta-prometheus", "Operational patchwork campus"],
  ["DC-005", "Meta Prometheus", d("2026-10-01"), "Projected", 864000, 716, 187000, "https://epoch.ai/data/ai-data-centers/directory/meta-prometheus", "Gas plants and buildings 15–19"],
  ["DC-005", "Meta Prometheus", d("2027-01-28"), "Projected", 1031000, 854, 167000, "https://epoch.ai/data/ai-data-centers/directory/meta-prometheus", "Building 14"],
  ["DC-007", "Stargate Abilene", d("2026-08-25"), "Current estimate", 509000, 421, null, "https://epoch.ai/data/ai-data-centers/directory/openai-stargate-abilene", "Current operational phase"],
  ["DC-007", "Stargate Abilene", d("2026-12-31"), "Projected", 1019000, 843, 510000, "https://epoch.ai/data/ai-data-centers/directory/openai-stargate-abilene", "Q4 2026 completion estimate"],
  ["DC-008", "Fairwater Wisconsin", d("2026-08-25"), "Current estimate", 446000, 369, null, "https://epoch.ai/data/ai-data-centers/directory/microsoft-fairwater-wisconsin", "First phase"],
  ["DC-008", "Fairwater Wisconsin", d("2027-03-31"), "Projected", 891000, null, 445000, "https://epoch.ai/data/ai-data-centers/directory/microsoft-fairwater-wisconsin", "Near-term hardware projection"],
  ["DC-008", "Fairwater Wisconsin", d("2028-06-30"), "Projected", 4528000, 2263, 3637000, "https://epoch.ai/data/ai-data-centers/directory/microsoft-fairwater-wisconsin", "Ultimate tracker estimate"],
  ["DC-010", "QTS Cedar Rapids", d("2026-11-15"), "Projected", 1137000, 448, 1137000, "https://epoch.ai/data/ai-data-centers/directory/qts-cedar-rapids", "Phase 1"],
  ["DC-010", "QTS Cedar Rapids", d("2027-11-15"), "Projected", 3669000, 1133, 2532000, "https://epoch.ai/data/ai-data-centers/directory/qts-cedar-rapids", "Phase 2"],
  ["DC-009", "Goodnight", d("2027-10-01"), "Projected", 2279000, 1006, 2279000, "https://epoch.ai/data/ai-data-centers/directory/goodnight", "Six-building estimate"],
  ["DC-011", "Meta Hyperion", d("2028-01-01"), "Projected", 4254000, 1676, 4254000, "https://epoch.ai/data/ai-data-centers/directory/meta-hyperion", "First operational phase; 5 GW ultimate claim not counted"],
  ["DC-012", "Stargate New Mexico", d("2028-12-31"), "Projected", 5104000, 1750, 5104000, "https://epoch.ai/data/ai-data-centers/directory/openai-stargate-new-mexico", "Full-site estimate"],
  ["DC-013", "Stargate Shackelford", d("2028-11-11"), "Projected", 4563000, 1400, 4563000, "https://epoch.ai/data/ai-data-centers/directory/openai-stargate-shackelford", "Ten-building estimate"],
];
milestones.getRange(`A6:I${5 + milestoneRows.length}`).values = milestoneRows;
styleHeader(milestones.getRange("A5:I5"));
styleBody(milestones.getRange(`A6:I${5 + milestoneRows.length}`));
milestones.getRange(`C6:C${5 + milestoneRows.length}`).format.numberFormat = "yyyy-mm-dd";
milestones.getRange(`E6:G${5 + milestoneRows.length}`).format.numberFormat = "#,##0";
milestones.getRange(`D6:D${5 + milestoneRows.length}`).dataValidation = { rule: { type: "list", values: ["Observed estimate", "Current estimate", "Projected", "Announced"] } };
milestones.tables.add(`A5:I${5 + milestoneRows.length}`, true, "MilestonesTable");
milestones.freezePanes.freezeRows(5);

// Capacity history
titleBand(history, "A1:F2", "Tracked Operational AI-Compute History", "A3:F3", "Reconstructed from Epoch's current data-center timeline: for each month-end, sum the latest operational H100e state for every covered site. Historical revisions to the source will revise this series.");
history.getRange("A5:F5").values = [["Date", "Tracked operational H100e", "ln(H100e)", "Elapsed days", "Endpoint doubling days", "Source / method"]];
const historyData = [
  ["2024-08-31",598873],["2024-09-30",722180],["2024-10-30",783322],["2024-11-30",1012483],["2024-12-30",1012483],
  ["2025-01-30",1075836],["2025-02-28",1297463],["2025-03-28",1385639],["2025-04-28",1385639],["2025-05-28",1547150],
  ["2025-06-28",2372009],["2025-07-28",2981296],["2025-08-28",3089432],["2025-09-28",3472231],["2025-10-28",4578757],
  ["2025-11-28",4898131],["2025-12-28",5581955],["2026-01-28",6330085],["2026-02-28",6547316],["2026-03-28",6993213],
  ["2026-04-28",8002914],["2026-05-28",9607077],["2026-06-28",11704023],["2026-07-28",12708951],["2026-08-26",14414863],
];
history.getRange(`A6:F${5 + historyData.length}`).values = historyData.map(([date, value]) => [d(date), value, null, null, null, "Epoch data_center_timelines.csv; latest state per site"]);
history.getRange("C6").formulas = [["=LN(B6)"]];
history.getRange(`C6:C${5 + historyData.length}`).fillDown();
history.getRange("D6").formulas = [["=A6-$A$6"]];
history.getRange(`D6:D${5 + historyData.length}`).fillDown();
history.getRange("E6").formulas = [["=IF(B6=$B$6,\"\",(A6-$A$6)*LN(2)/LN(B6/$B$6))"]];
history.getRange(`E6:E${5 + historyData.length}`).fillDown();
styleHeader(history.getRange("A5:F5"));
styleBody(history.getRange(`A6:F${5 + historyData.length}`));
history.getRange(`A6:A${5 + historyData.length}`).format.numberFormat = "yyyy-mm-dd";
history.getRange(`B6:B${5 + historyData.length}`).format.numberFormat = "#,##0";
history.getRange(`C6:C${5 + historyData.length}`).format.numberFormat = "0.000";
history.getRange(`D6:E${5 + historyData.length}`).format.numberFormat = "0.0";
history.tables.add(`A5:F${5 + historyData.length}`, true, "CapacityHistoryTable");
history.getRange("A33:F36").values = [
  ["Estimate", "Window start", "Window end", "Start H100e", "End H100e", "Doubling time"],
  ["24-month endpoint", d("2024-08-31"), d("2026-08-26"), 598873, 14414863, null],
  ["12-month endpoint", d("2025-08-28"), d("2026-08-26"), 3089432, 14414863, null],
  ["OLS monthly log series", d("2024-08-31"), d("2026-08-26"), 598873, 14414863, 156.4],
];
history.getRange("F34").formulas = [["=(C34-B34)*LN(2)/LN(E34/D34)"]];
history.getRange("F35").formulas = [["=(C35-B35)*LN(2)/LN(E35/D35)"]];
styleHeader(history.getRange("A33:F33"));
styleBody(history.getRange("A34:F36"));
history.getRange("B34:C36").format.numberFormat = "yyyy-mm-dd";
history.getRange("D34:E36").format.numberFormat = "#,##0";
history.getRange("F34:F36").format.numberFormat = "0.0 \"days\"";
history.freezePanes.freezeRows(5);

// Capability evidence
titleBand(capability, "A1:K2", "System Capability Evidence — Models and Harnesses", "A3:K3", "The primary capability object is the deployed system. Frozen-harness runs are retained as attribution diagnostics; cross-track benchmark gaps are not treated as causal harness multipliers.");
const capHeaders = ["Date", "Benchmark", "System / model", "Harness / track", "Metric", "Value", "Unit", "Resource envelope", "Comparability", "Source URL", "Forecast use"];
capability.getRange("A5:K5").values = [capHeaders];
const capRows = [
  [d("2026-01-29"), "METR TH1.1", "Frontier systems, all time", "Changing model + eval infrastructure", "P50 doubling time", 196.5, "days", "METR evaluation setup", "Trend-level; suite changed", "https://metr.org/blog/2026-1-29-time-horizon-1-1/", "Long-run baseline"],
  [d("2026-01-29"), "METR TH1.1", "Frontier systems, ≥2023", "Changing model + eval infrastructure", "P50 doubling time", 130.8, "days", "METR evaluation setup", "Trend-level; 107–161 day interval", "https://metr.org/blog/2026-1-29-time-horizon-1-1/", "Primary capability trend"],
  [d("2026-01-29"), "METR TH1.1", "Frontier systems, ≥2024", "Changing model + eval infrastructure", "P50 doubling time", 88.6, "days", "METR evaluation setup", "Short window; ceiling sensitivity", "https://metr.org/blog/2026-1-29-time-horizon-1-1/", "Acceleration diagnostic"],
  [d("2025-08-07"), "METR TH1.1", "GPT-5", "METR evaluation infrastructure", "P50 time horizon", 214, "minutes", "METR task suite", "Comparable within TH1.1", "https://metr.org/blog/2026-1-29-time-horizon-1-1/", "System frontier point"],
  [d("2025-11-01"), "METR TH1.1", "Claude Opus 4.5", "METR evaluation infrastructure", "P50 time horizon", 320, "minutes", "METR task suite", "Comparable within TH1.1", "https://metr.org/blog/2026-1-29-time-horizon-1-1/", "System frontier point"],
  [d("2026-05-01"), "ARC-AGI-3", "GPT-5.5", "Standard harness; semi-private", "Score", 0.0043, "% solved", "Official standard tests", "Comparable to Opus 4.7 row", "https://arcprize.org/blog/arc-agi-3-gpt-5-5-opus-4-7-analysis", "Base-system reference"],
  [d("2026-05-01"), "ARC-AGI-3", "Claude Opus 4.7", "Standard harness; semi-private", "Score", 0.0018, "% solved", "Official standard tests", "Comparable to GPT-5.5 row", "https://arcprize.org/blog/arc-agi-3-gpt-5-5-opus-4-7-analysis", "Base-system reference"],
  [d("2026-07-24"), "ARC-AGI-3", "Claude Opus 5 High", "Verified model result", "Score", 0.3016, "% solved", "Official verified run", "Verified; later model generation", "https://arcprize.org/results/anthropic-claude-opus-5", "Current verified model frontier"],
  [d("2026-05-15"), "ARC-AGI-3 Public Demo", "OpenClaw", "Memory + code-execution harness", "Score", 0.052, "% solved", "$2,912 reported cost", "Self-reported public set", "https://arcprize.org/leaderboard/community", "Harness case study"],
  [d("2026-03-13"), "ARC-AGI-3 Public Demo", "Read-Grep-Bash Agent", "Search + Python over logs", "Score", 0.502, "% solved", "Cost not reported", "Self-reported public set", "https://arcprize.org/leaderboard/community", "Harness case study"],
  [d("2026-05-18"), "ARC-AGI-3 Public Demo", "Vision — Continual Learning v1", "Weights carried across games", "Score", 0.631, "% solved", "$4,788 reported cost", "Self-reported public set", "https://arcprize.org/leaderboard/community", "Continual-learning case study"],
  [d("2026-07-19"), "ARC-AGI-3 Public Demo", "Retrodict", "Falsification-tested executable world model", "Score", 0.999, "% solved", "$654 reported cost", "Self-reported public set", "https://arcprize.org/leaderboard/community", "Harness-frontier case study"],
  [d("2026-07-29"), "ARC-AGI-3 Public Demo", "Tycho", "Multimodal conversation + delegated world-model builder", "Score", 1.0, "% solved", "$2,986 reported cost", "Self-reported public set", "https://arcprize.org/leaderboard/community", "Harness-frontier case study"],
];
capability.getRange(`A6:K${5 + capRows.length}`).values = capRows;
styleHeader(capability.getRange("A5:K5"));
styleBody(capability.getRange(`A6:K${5 + capRows.length}`));
capability.getRange(`A6:A${5 + capRows.length}`).format.numberFormat = "yyyy-mm-dd";
capability.getRange(`F6:F${5 + capRows.length}`).format.numberFormat = "0.00";
capability.getRange("F11:F18").format.numberFormat = "0.0%";
capability.tables.add(`A5:K${5 + capRows.length}`, true, "CapabilityEvidenceTable");
capability.getRange("A21:K25").values = [
  ["Controlled harness study specification", null, null, null, null, null, null, null, null, null, null],
  ["Hold fixed", "model checkpoint", "benchmark version/split", "tool/permission envelope", "wall-clock/step budget", "token/compute budget", "sampling", "success criteria", "environment version", "run count", "reporting date"],
  ["Vary", "memory architecture", "planning loop", "tool routing", "verification", "reflection/retry", "parallelism", "context management", "UI policy", "human escalation", "other harness code"],
  ["Report", "paired score delta", "capability-horizon ratio", "cost ratio", "latency ratio", "failure taxonomy", "confidence interval", "pass@k", "rollback rate", "irreversible-error rate", "full configuration"],
  ["Rule", "Only this design identifies harness contribution. Public-demo vs verified-track comparisons demonstrate envelope sensitivity but cannot estimate Δh.", null, null, null, null, null, null, null, null, null],
];
sectionBand(capability, "A21:K21", "CONTROLLED HARNESS STUDY SPECIFICATION");
for (const row of [22, 23, 24]) {
  styleBody(capability.getRange(`A${row}:K${row}`));
  capability.getRange(`A${row}`).format = { fill: colors.lightTeal, font: { bold: true, color: colors.teal }, borders: { preset: "all", style: "thin", color: colors.line } };
}
capability.getRange("B25:K25").merge();
styleBody(capability.getRange("A25:K25"));
capability.getRange("A25").format = { fill: colors.lightGold, font: { bold: true, color: "#6B4B00" }, borders: { preset: "all", style: "thin", color: colors.line } };
capability.freezePanes.freezeRows(5);

// Demand archetypes
titleBand(demand, "A1:K2", "Daily Token Demand by User Archetype", "A3:K3", "Illustrative starting assumptions, designed to be replaced by telemetry. Compute-equivalent tokens weight token classes by relative serving burden; they are a planning unit, not a universal physical constant.");
sectionBand(demand, "A5:K5", "TOKEN WEIGHTS — EDIT THESE ASSUMPTIONS");
demand.getRange("A6:K7").values = [
  ["Input weight", 1, "Output weight", 2.5, "Internal reasoning weight", 2.5, "Cached/reused weight", 0.15, "Days/year", 365, "Output and reasoning weights proxy lower decode utilization; cached context gets a steep discount."],
  ["Interpretation", "1 unit", null, "2.5 units", null, "2.5 units", null, "0.15 units", null, "365", "Revise weights when workload-specific tokens/s measurements are available."],
];
styleBody(demand.getRange("A6:K7"));
demand.getRange("A6:K6").format.fill = colors.lightTeal;
demand.getRange("A6:K6").format.font = { bold: true, color: colors.ink };

demand.getRange("A9:K9").values = [["Archetype", "Representative behavior", "Uncached input/day", "Visible output/day", "Internal reasoning/day", "Cached context/day", "Raw tokens/day", "Compute-equivalent/day", "Agent-active hours/day", "Demand vs prior stage", "Calibration note"]];
const archetypeRows = [
  ["Casual assistant", "A few searches, summaries and messages", 8000, 2000, 0, 5000, null, null, 0.3, null, "Anchor with consumer chat telemetry"],
  ["Daily copilot", "Workday drafting, research, email and planning", 60000, 15000, 10000, 60000, null, null, 2, null, "Knowledge-worker usage"],
  ["Delegating agent", "Several multi-step errands and workflows", 500000, 100000, 500000, 1000000, null, null, 6, null, "Includes tool-result/context traffic"],
  ["High-autonomy personal AI", "Runs throughout the day; travel, bills, shopping, coordination", 2000000, 300000, 5000000, 10000000, null, null, 16, null, "Central archetype for the forecast"],
  ["Agentic software builder", "Parallel coding, testing, browsing and review", 2000000, 500000, 10000000, 20000000, null, null, 12, null, "High internal-reasoning and tool traffic"],
  ["Continuous digital proxy", "Always-on monitoring, memory, simulation and proactive work", 10000000, 1000000, 50000000, 100000000, null, null, 24, null, "Upper-bound stress case"],
];
demand.getRange(`A10:K${9 + archetypeRows.length}`).values = archetypeRows;
demand.getRange("G10").formulas = [["=SUM(C10:F10)"]];
demand.getRange(`G10:G${9 + archetypeRows.length}`).fillDown();
demand.getRange("H10").formulas = [["=C10*$B$6+D10*$D$6+E10*$F$6+F10*$H$6"]];
demand.getRange(`H10:H${9 + archetypeRows.length}`).fillDown();
demand.getRange("J10").values = [[1]];
demand.getRange("J11").formulas = [["=H11/H10"]];
demand.getRange(`J11:J${9 + archetypeRows.length}`).fillDown();
styleHeader(demand.getRange("A9:K9"));
styleBody(demand.getRange(`A10:K${9 + archetypeRows.length}`));
demand.getRange(`C10:H${9 + archetypeRows.length}`).format.numberFormat = "#,##0";
demand.getRange(`I10:I${9 + archetypeRows.length}`).format.numberFormat = "0.0";
demand.getRange(`J10:J${9 + archetypeRows.length}`).format.numberFormat = "0.0x";
demand.tables.add(`A9:K${9 + archetypeRows.length}`, true, "DemandArchetypesTable");
demand.getRange("A18:K21").values = [
  ["Update rule", "Estimate tokens/day separately for uncached input, visible output, internal/reasoning, and cached/reused context. Do not infer demand from API billing tokens alone.", ...Array(9).fill(null)],
  ["Capability effect", "As agents become more capable, demand can rise faster than user count because they attempt longer tasks, run parallel branches, verify work, and maintain memory.", ...Array(9).fill(null)],
  ["Efficiency rebound", "Cheaper/faster inference may be absorbed by more reasoning and autonomy rather than lowering total compute demand—a Jevons-style rebound to test empirically.", ...Array(9).fill(null)],
  ["Resolution link", "The 50%-interaction prediction should specify whether autonomous background tokens count as interactions or only completed user-facing tasks. Track both demand and outcomes.", ...Array(9).fill(null)],
];
for (let row = 18; row <= 21; row++) {
  demand.getRange(`B${row}:K${row}`).merge();
  styleBody(demand.getRange(`A${row}:K${row}`));
  demand.getRange(`A${row}`).format = { fill: colors.lightGold, font: { bold: true, color: "#6B4B00" }, borders: { preset: "all", style: "thin", color: colors.line } };
}
demand.freezePanes.freezeRows(9);

// Serving model
titleBand(serving, "A1:J2", "Operational Compute → Supported User-Equivalents", "A3:J3", "Scenario calculator. It converts operational H100-equivalent capacity into compute-equivalent tokens/day, then divides by each archetype's demand. The result is highly assumption-sensitive and should be reported as a range.");
sectionBand(serving, "A5:D5", "BASE SUPPLY AND WORKLOAD ASSUMPTIONS");
serving.getRange("A6:D16").values = [
  ["Assumption", "Value", "Unit", "Meaning"],
  ["Operational capacity", 14400000, "H100e", "Epoch-covered operational sites, 2026-08-24"],
  ["Dense 8-bit ops per H100e-second", 1.979e15, "ops/s", "Epoch H100e convention inferred from published 8-bit OP/s"],
  ["Seconds per day", 86400, "seconds", "Calendar conversion"],
  ["Share allocated to inference", 0.4, "%", "Remainder trains, fine-tunes, idles, or serves other workloads"],
  ["Sustained serving utilization", 0.35, "% of peak", "Includes utilization, latency, networking and availability losses"],
  ["Active model parameters", 100, "billions", "Illustrative MoE active-parameter equivalent"],
  ["Forward-pass ops per parameter-token", 2, "ops", "Transformer rule-of-thumb"],
  ["System overhead multiplier", 1.5, "x", "Attention, routing, communication and non-model overhead"],
  ["Serving-goodput multiplier", 1, "x", "Extra tokens per H100e beyond peak-op normalization"],
  ["Available compute-equivalent tokens/day", null, "tokens/day", "Derived supply under current assumptions"],
];
serving.getRange("B16").formulas = [["=B7*B8*B9*B10*B11*B15/(B12*1000000000*B13*B14)"]];
styleHeader(serving.getRange("A6:D6"));
styleBody(serving.getRange("A7:D16"));
serving.getRange("B10:B11").format.numberFormat = "0%";
serving.getRange("B7").format.numberFormat = "#,##0";
serving.getRange("B8").format.numberFormat = "0.000E+00";
serving.getRange("B9").format.numberFormat = "#,##0";
serving.getRange("B12").format.numberFormat = "#,##0";
serving.getRange("B13:B15").format.numberFormat = "0.0";
serving.getRange("B16").format.numberFormat = "0.00E+00";

sectionBand(serving, "F5:J5", "SUPPORTED USERS — GOODPUT SENSITIVITY");
serving.getRange("F6:J6").values = [["Archetype", "Tokens/user/day", "1x goodput", "4x goodput", "10x goodput"]];
const demandRows = [10, 11, 12, 13, 14, 15];
for (let i = 0; i < demandRows.length; i++) {
  const row = 7 + i;
  const demandRow = demandRows[i];
  serving.getRange(`F${row}:G${row}`).formulas = [[`='Demand Archetypes'!A${demandRow}`, `='Demand Archetypes'!H${demandRow}`]];
  serving.getRange(`H${row}`).formulas = [[`=$B$16/G${row}`]];
  serving.getRange(`I${row}`).formulas = [[`=$B$16*4/G${row}`]];
  serving.getRange(`J${row}`).formulas = [[`=$B$16*10/G${row}`]];
}
styleHeader(serving.getRange("F6:J6"));
styleBody(serving.getRange("F7:J12"));
serving.getRange("G7:J12").format.numberFormat = "#,##0";

sectionBand(serving, "A19:J19", "FASTER-INFERENCE EVIDENCE — DO NOT APPLY MULTIPLIERS BLINDLY");
serving.getRange("A20:J20").values = [["Date", "Platform / change", "Claimed result", "Comparison", "Workload", "Metric type", "Use in model", "Source URL", "Caution", "Status"]];
const chipRows = [
  [d("2026-04-01"), "TensorRT-LLM on GB200", "4x token-output improvement in three months", "Same hardware/software evolution", "Vendor benchmark summary", "Software/harness goodput", "Sensitivity evidence for 4x column", "https://developer.nvidia.com/deep-learning-performance-training-inference", "Workload-specific vendor result", "Measured/claimed"],
  [d("2026-04-01"), "Blackwell Ultra GB300", "Up to 50x throughput/MW and 35x lower token cost", "Versus Hopper", "Low-latency agentic workloads", "Throughput and cost", "Upper-bound infrastructure scenario", "https://developer.nvidia.com/deep-learning-performance-training-inference", "Not a universal token multiplier; partly already reflected in H100e", "Vendor + third-party benchmark claim"],
  [d("2026-07-21"), "Vera Rubin NVL72", "Up to 10x inference throughput per watt", "Versus Blackwell", "Kimi-K2-Thinking / internal agentic workloads", "Throughput per watt", "Sensitivity evidence for 10x column", "https://developer.nvidia.com/blog/inside-nvidia-rubin-gpu-architecture-powering-the-era-of-agentic-ai/", "Future/current rollout; workload and interactivity dependent", "Vendor measurement"],
  [d("2026-08-24"), "Vera Rubin + Groq 3 LPX", "3,400 output tok/s at 100k context; 4x nearest alternative", "System comparison", "Gemma 4 31B", "Interactive output speed", "Long-context latency case", "https://blogs.nvidia.com/blog/vera-rubin-lpx-spectrum-x-nvlink-fusion/", "System-level result; not per-H100e capacity", "Vendor-reported benchmark"],
  [d("2026-08-26"), "Cerebras CS-4", "Up to 30x faster inference than GPU systems; >1,000 tok/s on >10T-parameter models", "Production GPU systems", "Model/configuration dependent", "Per-user speed / interactivity", "Architecture scenario; not a default fleet multiplier", "https://www.cerebras.ai/cs4", "30x speed does not establish 30x aggregate throughput per watt; first shipments begin this quarter", "Vendor claim"],
  [d("2026-08-25"), "OpenAI Jalapeño", "1.5–1.9x peak work/W; 53.7–104.3x throughput/W at the GPU's prior-best TBT", "GB200/GB300", "GPT-OSS 120B; DeepSeek R1; Kimi K2.5 1T", "Peak and matched-latency goodput", "Use peak range for capacity; >50x only for matched-interactivity scenario", "https://openai.com/index/jalapeno-first-results/", "The >50x figure is operating-point-specific, not a universal chip multiplier; deployment planned by year-end", "First-party InferenceX results"],
];
serving.getRange(`A21:J${20 + chipRows.length}`).values = chipRows;
styleHeader(serving.getRange("A20:J20"));
styleBody(serving.getRange(`A21:J${20 + chipRows.length}`));
serving.getRange(`A21:A${20 + chipRows.length}`).format.numberFormat = "yyyy-mm-dd";
serving.getRange("A27:J29").values = [
  ["Critical anti-double-counting rule", "Epoch H100e already converts newer chips into H100-equivalent peak 8-bit compute. Apply a separate multiplier only for measured serving goodput not captured by peak ops: memory bandwidth, interconnect, latency-aware scheduling, caching, quantization and software.", ...Array(8).fill(null)],
  ["Demand-side rule", "Re-estimate tokens/user/day whenever agent autonomy or reasoning depth changes. A 10x hardware gain can be fully consumed by 10x more reasoning tokens per user.", ...Array(8).fill(null)],
  ["Reporting rule", "Publish a range over inference allocation, sustained utilization, active parameters, overhead, token mix and goodput. Never quote one supported-user number without the assumptions beside it.", ...Array(8).fill(null)],
];
for (let row = 27; row <= 29; row++) {
  serving.getRange(`B${row}:J${row}`).merge();
  styleBody(serving.getRange(`A${row}:J${row}`));
  serving.getRange(`A${row}`).format = { fill: colors.lightGold, font: { bold: true, color: "#6B4B00" }, borders: { preset: "all", style: "thin", color: colors.line } };
}
sectionBand(serving, "A32:J32", "SPECIALIZED-ARCHITECTURE FLEET SCENARIOS — EDIT FLEET SHARE");
serving.getRange("A33:J33").values = [["Platform / metric", "Relative multiplier", "Basis", "Model / workload", "Fleet share assumption", "Fleet goodput if applied", "High-autonomy users", "Source URL", "Interpretation", "Status"]];
const architectureRows = [
  ["H100e-normalized base", 1, "Peak-op-normalized fleet", "Mixed", 1, null, null, "https://epoch.ai/data/ai-data-centers", "Reference case", "Operational estimate"],
  ["Cerebras CS-4 speed claim", 30, "Per-user token speed", "Unspecified mix; >10T model claim also reported", 0, null, null, "https://www.cerebras.ai/cs4", "Use for latency/autonomy sensitivity, not aggregate capacity without throughput-per-watt evidence", "Shipments begin this quarter"],
  ["Jalapeño peak throughput/W", 1.7, "Midpoint of 1.5–1.9x peak range", "Three open models", 0, null, null, "https://openai.com/index/jalapeno-first-results/", "Best simple capacity proxy once deployed", "Planned OpenAI deployment by year-end"],
  ["Jalapeño matched TBT — GPT-OSS", 53.7, "Throughput/kW at GB200 prior-best TBT", "GPT-OSS 120B", 0, null, null, "https://openai.com/index/jalapeno-first-results/", "Interactive operating-point upper bound", "Measured first-party"],
  ["Jalapeño matched TBT — DeepSeek", 104.3, "Throughput/kW at GB300 prior-best TBT", "DeepSeek R1 670B", 0, null, null, "https://openai.com/index/jalapeno-first-results/", "Interactive operating-point upper bound", "Measured first-party"],
  ["Jalapeño matched TBT — Kimi", 56.1, "Throughput/kW at GB300 prior-best TBT", "Kimi K2.5 1T", 0, null, null, "https://openai.com/index/jalapeno-first-results/", "Interactive operating-point upper bound", "Measured first-party"],
  ["Vera Rubin throughput/W", 10, "Vendor upper-bound versus Blackwell", "Agentic reasoning workloads", 0, null, null, "https://developer.nvidia.com/blog/inside-nvidia-rubin-gpu-architecture-powering-the-era-of-agentic-ai/", "Workload-specific architecture scenario", "Vendor measurement"],
];
serving.getRange(`A34:J${33 + architectureRows.length}`).values = architectureRows;
serving.getRange("F34").formulas = [["=1+E34*(B34-1)"]];
serving.getRange(`F34:F${33 + architectureRows.length}`).fillDown();
serving.getRange("G34").formulas = [["=$B$16*F34/'Demand Archetypes'!$H$13"]];
serving.getRange(`G34:G${33 + architectureRows.length}`).fillDown();
styleHeader(serving.getRange("A33:J33"));
styleBody(serving.getRange(`A34:J${33 + architectureRows.length}`));
serving.getRange(`B34:B${33 + architectureRows.length}`).format.numberFormat = "0.0x";
serving.getRange(`E34:E${33 + architectureRows.length}`).format.numberFormat = "0%";
serving.getRange(`F34:F${33 + architectureRows.length}`).format.numberFormat = "0.00x";
serving.getRange(`G34:G${33 + architectureRows.length}`).format.numberFormat = "#,##0";
serving.getRange(`E34:E${33 + architectureRows.length}`).dataValidation = { rule: { type: "decimal", operator: "between", formula1: 0, formula2: 1 } };
serving.freezePanes.freezeRows(5);

// Sources
titleBand(sources, "A1:G2", "Source Registry", "A3:G3", "Primary benchmark pages and Epoch's maintained data-center dataset. Accessed 2026-08-26 unless noted.");
sources.getRange("A5:G5").values = [["Source ID", "Publisher", "Title / dataset", "Published / updated", "Accessed", "URL", "Use and limitation"]];
const sourceRows = [
  ["SRC-001", "METR", "Time Horizon 1.1", d("2026-01-29"), asOf, "https://metr.org/blog/2026-1-29-time-horizon-1-1/", "Capability doubling and model horizons; suite/evaluation changes affect comparability"],
  ["SRC-002", "METR", "Task-completion time horizons", d("2026-05-08"), asOf, "https://metr.org/time-horizons/", "Definition and current dashboard"],
  ["SRC-003", "ARC Prize Foundation", "GPT-5.5 and Opus 4.7 analysis", d("2026-05-01"), asOf, "https://arcprize.org/blog/arc-agi-3-gpt-5-5-opus-4-7-analysis", "Standard harness scores and failure analysis"],
  ["SRC-004", "ARC Prize Foundation", "Claude Opus 5 result", d("2026-07-24"), asOf, "https://arcprize.org/results/anthropic-claude-opus-5", "Verified ARC-AGI-3 frontier score"],
  ["SRC-005", "ARC Prize Foundation", "Community leaderboard", null, asOf, "https://arcprize.org/leaderboard/community", "Harness case studies; public-demo scores are self-reported"],
  ["SRC-006", "Epoch AI", "AI Data Centers dataset", d("2026-08-24"), asOf, "https://epoch.ai/data/ai-data-centers", "83 covered sites, 14.4M operational H100e, 13 GW IT; incomplete public census"],
  ["SRC-007", "Epoch AI", "Data center timelines CSV", d("2026-08-24"), asOf, "https://epoch.ai/data/data_centers/data_center_timelines.csv", "Reconstructed monthly aggregate operational series; source revisions change history"],
  ["SRC-008", "Epoch AI", "Largest data-center compute", d("2026-06-11"), asOf, "https://epoch.ai/data-insights/largest-data-center-compute", "Published seven-month largest-site frontier doubling"],
  ["SRC-009", "Epoch AI", "Introducing the Frontier Data Centers Hub", d("2025-11-01"), asOf, "https://epoch.ai/latest/introducing-the-frontier-data-centers-hub", "Methods, construction lead times, cost and original projections"],
  ["SRC-010", "Epoch AI", "Colossus 2 directory", d("2026-08-25"), asOf, "https://epoch.ai/data/ai-data-centers/directory/colossus-2", "Current and Q1 2027 estimate"],
  ["SRC-011", "Epoch AI", "Fairwater Wisconsin directory", d("2026-08-25"), asOf, "https://epoch.ai/data/ai-data-centers/directory/microsoft-fairwater-wisconsin", "Current and Q2 2028 estimate; internal phase details vary"],
  ["SRC-012", "Epoch AI", "Meta Hyperion directory", d("2026-08-25"), asOf, "https://epoch.ai/data/ai-data-centers/directory/meta-hyperion", "Under-construction estimate; 5 GW ultimate claim not yet evidenced at one site"],
  ["SRC-013", "Epoch AI", "QTS Cedar Rapids directory", d("2026-08-24"), asOf, "https://epoch.ai/data/ai-data-centers/directory/qts-cedar-rapids", "Phase 1 late-2026 and Phase 2 late-2027 estimates"],
  ["SRC-014", "Epoch AI", "Stargate New Mexico directory", d("2026-08-25"), asOf, "https://epoch.ai/data/ai-data-centers/directory/openai-stargate-new-mexico", "Under-construction full-site estimate and fuel-cell power plan"],
  ["SRC-015", "Epoch AI", "AI data center updates", d("2026-08-24"), asOf, "https://epoch.ai/data/ai-data-centers/updates", "Revision log; demonstrates why projections require date-stamped snapshots"],
  ["SRC-016", "NVIDIA", "H100 product specifications", null, asOf, "https://www.nvidia.com/en-us/data-center/h100/", "Peak tensor performance context; sparse vs dense conventions matter"],
  ["SRC-017", "NVIDIA", "Deep-learning performance hub", d("2026-04-01"), asOf, "https://developer.nvidia.com/deep-learning-performance-training-inference", "Blackwell/GB300 throughput, software and token-cost claims; workload-specific"],
  ["SRC-018", "NVIDIA", "Inside Rubin GPU architecture", d("2026-07-21"), asOf, "https://developer.nvidia.com/blog/inside-nvidia-rubin-gpu-architecture-powering-the-era-of-agentic-ai/", "Rubin throughput-per-watt claim; vendor measurement"],
  ["SRC-019", "NVIDIA", "Vera Rubin LPX serving result", d("2026-08-24"), asOf, "https://blogs.nvidia.com/blog/vera-rubin-lpx-spectrum-x-nvlink-fusion/", "Long-context output speed; system-level vendor benchmark"],
  ["SRC-020", "Cerebras", "CS-4 product page", d("2026-08-26"), asOf, "https://www.cerebras.ai/cs4", "Up to 30x inference-speed claim; workload-dependent and not automatically a throughput-per-watt multiplier"],
  ["SRC-021", "OpenAI", "Jalapeño first results", d("2026-08-25"), asOf, "https://openai.com/index/jalapeno-first-results/", "Peak and matched-latency InferenceX comparisons; >50x applies at the prior GPU TBT, not universally"],
];
sources.getRange(`A6:G${5 + sourceRows.length}`).values = sourceRows;
styleHeader(sources.getRange("A5:G5"));
styleBody(sources.getRange(`A6:G${5 + sourceRows.length}`));
sources.getRange(`D6:E${5 + sourceRows.length}`).format.numberFormat = "yyyy-mm-dd";
sources.tables.add(`A5:G${5 + sourceRows.length}`, true, "SourcesTable");
sources.freezePanes.freezeRows(5);

// Layout and typography
const widths = {
  Summary: [22, 14, 15, 28, 22, 14, 15, 28, 19, 18, 22, 34],
  "Buildout Ledger": [11, 26, 18, 25, 22, 21, 15, 14, 13, 15, 14, 13, 15, 15, 14, 15, 34, 14, 14, 17, 48],
  Milestones: [11, 25, 15, 18, 18, 17, 16, 48, 42],
  "Capacity History": [15, 24, 14, 14, 23, 56],
  "Capability Evidence": [15, 23, 28, 32, 22, 12, 13, 24, 30, 48, 27],
  "Demand Archetypes": [23, 36, 18, 18, 20, 19, 18, 24, 19, 20, 38],
  "Serving Model": [22, 25, 20, 42, 14, 28, 22, 48, 42, 25],
  Sources: [12, 22, 35, 18, 15, 52, 55],
};
for (const sheet of [summary, ledger, milestones, history, capability, demand, serving, sources]) {
  const w = widths[sheet.name];
  for (let i = 0; i < w.length; i++) sheet.getRangeByIndexes(0, i, 200, 1).format.columnWidth = w[i];
  sheet.getRange("1:1").format.rowHeight = 30;
  sheet.getRange("2:2").format.rowHeight = 30;
  sheet.getRange("3:3").format.rowHeight = 30;
  sheet.getUsedRange().format.autofitRows();
}
summary.getRange("1:2").format.rowHeight = 27;
summary.getRange("13:19").format.rowHeight = 56;
summary.getRange("26:29").format.rowHeight = 36;
ledger.getRange("5:5").format.rowHeight = 42;
milestones.getRange("5:5").format.rowHeight = 38;
capability.getRange("5:5").format.rowHeight = 42;

// Verification artifacts and export
await fs.mkdir(previewDir, { recursive: true });
const previewNames = [
  ["Summary", "summary.png"],
  ["Buildout Ledger", "buildout-ledger.png"],
  ["Milestones", "milestones.png"],
  ["Capacity History", "capacity-history.png"],
  ["Capability Evidence", "capability-evidence.png"],
  ["Demand Archetypes", "demand-archetypes.png"],
  ["Serving Model", "serving-model.png"],
  ["Sources", "sources.png"],
];
for (const [sheetName, fileName] of previewNames) {
  const image = await workbook.render({ sheetName, autoCrop: "all", scale: 1, format: "png" });
  await fs.writeFile(`${previewDir}/${fileName}`, new Uint8Array(await image.arrayBuffer()));
}

const overview = await workbook.inspect({ kind: "workbook,sheet,table", maxChars: 8000, tableMaxRows: 4, tableMaxCols: 6, tableMaxCellChars: 80 });
console.log(overview.ndjson ?? overview);
const formulaCheck = await workbook.inspect({ kind: "formula", sheetId: "Summary", range: "A1:L35", maxChars: 5000, options: { maxResults: 50 } });
console.log(formulaCheck.ndjson ?? formulaCheck);
const errorCheck = await workbook.inspect({ kind: "match", searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A", options: { useRegex: true, maxResults: 100 }, maxChars: 5000 });
console.log(errorCheck.ndjson ?? errorCheck);

await fs.mkdir(outputDir, { recursive: true });
const xlsx = await SpreadsheetFile.exportXlsx(workbook);
await xlsx.save(outputPath);
console.log(`SAVED ${outputPath}`);
