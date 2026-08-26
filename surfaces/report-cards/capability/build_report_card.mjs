import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "../../..");
const outputDir = path.join(projectRoot, "data", "reports");
const outputPath = `${outputDir}/personal-ai-four-year-capability-report-card.xlsx`;
const inspectPath = `${outputPath}.inspect.ndjson`;
const previewDir = path.join(projectRoot, "data", "previews", "capability");
const asOf = new Date(Date.UTC(2026, 7, 26));
const d = (iso) => iso ? new Date(`${iso}T00:00:00Z`) : null;
const currentQuarterIndex = 11; // 2026-Q3 in the 2024-Q1 = 1 sequence
const firstForecastQuarterIndex = 12;
const quarterDays = 365.2425 / 4;

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') { field += '"'; index++; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') { row.push(field); field = ""; }
    else if (char === '\n') { row.push(field.replace(/\r$/, "")); rows.push(row); row = []; field = ""; }
    else field += char;
  }
  if (field.length || row.length) { row.push(field.replace(/\r$/, "")); rows.push(row); }
  const [headers, ...body] = rows;
  return body.filter((values) => values.some((value) => value !== "")).map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])),
  );
}

function solveLinearSystem(matrix, vector) {
  const size = vector.length;
  for (let pivot = 0; pivot < size; pivot++) {
    let best = pivot;
    for (let row = pivot + 1; row < size; row++) {
      if (Math.abs(matrix[row][pivot]) > Math.abs(matrix[best][pivot])) best = row;
    }
    [matrix[pivot], matrix[best]] = [matrix[best], matrix[pivot]];
    [vector[pivot], vector[best]] = [vector[best], vector[pivot]];
    const divisor = matrix[pivot][pivot];
    for (let column = pivot; column < size; column++) matrix[pivot][column] /= divisor;
    vector[pivot] /= divisor;
    for (let row = 0; row < size; row++) {
      if (row === pivot) continue;
      const factor = matrix[row][pivot];
      for (let column = pivot; column < size; column++) matrix[row][column] -= factor * matrix[pivot][column];
      vector[row] -= factor * vector[pivot];
    }
  }
  return vector;
}

function quadraticLogHorizonFit(rows) {
  const latestTimestamp = Math.max(...rows.map((row) => Date.parse(row.model_release_date)));
  const points = rows.map((row) => ({
    t: (Date.parse(row.model_release_date) - latestTimestamp) / 86_400_000 / quarterDays,
    y: Math.log2(Number(row.score)),
  }));
  const design = points.map(({ t }) => [1, t, t * t]);
  const normalMatrix = Array.from({ length: 3 }, (_, i) =>
    Array.from({ length: 3 }, (_, j) => design.reduce((sum, values) => sum + values[i] * values[j], 0)),
  );
  const normalVector = Array.from({ length: 3 }, (_, i) =>
    design.reduce((sum, values, index) => sum + values[i] * points[index].y, 0),
  );
  const [beta0, beta1, beta2] = solveLinearSystem(normalMatrix, normalVector);
  const fitted = points.map(({ t }) => beta0 + beta1 * t + beta2 * t * t);
  const mean = points.reduce((sum, point) => sum + point.y, 0) / points.length;
  const sse = points.reduce((sum, point, index) => sum + (point.y - fitted[index]) ** 2, 0);
  const sst = points.reduce((sum, point) => sum + (point.y - mean) ** 2, 0);
  const acceleration = 2 * beta2;
  return {
    beta0,
    beta1,
    beta2,
    acceleration,
    relativeAcceleration: beta1 > 0 ? acceleration / beta1 : 0,
    rSquared: sst > 0 ? 1 - sse / sst : 1,
    latestTimestamp,
  };
}

const benchmarkRegistry = parseCsv(await fs.readFile(path.join(projectRoot, "data", "sources", "benchmark-timeseries.csv"), "utf8"));
const trendRegistry = parseCsv(await fs.readFile(path.join(projectRoot, "data", "sources", "scm-trend-estimates.csv"), "utf8"));
const metrSeries = [
  { key: "H50", benchmarkId: "metr_th11_p50", sourceRole: "primary_recent_fit", role: "Primary capability-velocity signal" },
  { key: "H80", benchmarkId: "metr_th11_p80", sourceRole: "reliability_guardrail", role: "Reliability guardrail" },
].map((definition) => {
  const rows = benchmarkRegistry
    .filter((row) => row.benchmark_id === definition.benchmarkId)
    .sort((a, b) => a.model_release_date.localeCompare(b.model_release_date));
  const trend = trendRegistry.find((row) => row.estimate_role === definition.sourceRole);
  if (rows.length < 3 || !trend) throw new Error(`Missing METR evidence for ${definition.key}`);
  const fit = quadraticLogHorizonFit(rows);
  return {
    ...definition,
    rows,
    fit,
    sourceVelocity: quarterDays / Number(trend.value),
    trendDays: Number(trend.value),
    trendSource: trend.source,
    trendNote: trend.comparability_note,
  };
});
const h50Series = metrSeries.find((series) => series.key === "H50");
const h80Series = metrSeries.find((series) => series.key === "H80");

const colors = {
  navy: "#0B1F33", teal: "#0F766E", teal2: "#15847B", lightTeal: "#DDF4F1",
  blue: "#DCEAF7", actual: "#CFE3F5", carry: "#F0F4F7", gold: "#C58B1B",
  lightGold: "#FFF4D6", ink: "#17212B", muted: "#53606D", line: "#D7DEE5",
  pale: "#F7F9FB", white: "#FFFFFF", red: "#B42318", redFill: "#FDE7E5",
  orange: "#B54708", orangeFill: "#FFF0E0", yellowFill: "#FFF7CC",
  green: "#147D64", greenFill: "#DDF4E8", aFill: "#CDEEDC", gray: "#88939E",
};

const categories = [
  "Direct economic stewardship",
  "Operational execution",
  "Personal stewardship transfer",
  "Economic value & governance",
];

const catalog = [
  ["DES-01", categories[0], "Vending-Bench 2", "Frontier ending balance / $63,000 published good-strategy target", "Cap at 100%; target is a published strategy anchor, not a human ceiling", "Graded", "2025-Q4", "https://andonlabs.com/evals/vending-bench-2", "Year-long autonomous retail operation; balance is path dependent."],
  ["DES-02", categories[0], "CEO-Bench", "Frontier best-run final cash / $2.2B estimated upper bound", "Cap at 100%; only three runs per model, so treat as high variance", "Graded", "2026-Q2", "https://ceobench.com/", "500-day startup simulation from $1M initial cash."],
  ["DES-03", categories[0], "YC-Bench", "Frontier mean final funds / $1M published substantial-profit threshold", "Cap at 100%; provisional target-normalized score because no human/oracle result is published", "Graded", "2026-Q2", "https://arxiv.org/abs/2604.01212", "The frontier exceeds the paper's 5×-capital threshold, so this score is saturated and needs a harder future anchor."],
  ["DES-04", categories[0], "Business Arena", "Best-model mean final worth / $436,195 expert-strategy final worth", "Cap at 100%; fixed expert strategy uses agent-visible information in the same world", "Graded", "2026-Q3", "https://arxiv.org/abs/2608.08621", "Ten-run model mean divided by the strongest published expert-designed strategy outcome."],
  ["DES-05", categories[0], "EnterpriseArena", "Best-system full-horizon survival rate", "Already a 0–100% rate; use the best published full-survival result", "Graded", "2026-Q1", "https://arxiv.org/html/2603.23638v2", "132-month CFO simulator; only five seeds per system and the best published result is a tie."],
  ["DES-06", categories[0], "RetailBench", "Best LLM final net worth / $131,510.42 oracle final net worth", "Cap at 100%; privileged oracle is a ceiling-like reference, not a human-equivalent baseline", "Graded", "2026-Q1", "https://arxiv.org/abs/2603.16453", "Uses the v3 selected-run table; result is framework-selected and not a repeated-run mean."],
  ["DES-07", categories[0], "MerchantBench", "Best LLM mean final net assets / human-participant mean", "Use the authors' reported 27.3% human-relative ratio", "Graded", "2026-Q3", "https://arxiv.org/abs/2607.28956", "Three runs per model-framework pairing; human reference is three non-expert participants."],

  ["OPS-01", categories[1], "AutomationBench", "Public 600-task pass rate, max reasoning", "Already a 0–100% pass rate; compare only within the public 600-task version", "Graded", "2026-Q2", "https://github.com/zapier/AutomationBench", "Pinned to the current public 600-task table after the July 2026 stricter-classifier rescore; the private leaderboard is a different evaluation."],
  ["OPS-02", categories[1], "EnterpriseOps-Gym-AA", "Strict task success across enterprise workflows", "Already a 0–100% success rate; all verifier conditions must pass", "Graded", "2025-Q2", "https://artificialanalysis.ai/evaluations/enterprise-ops-gym-aa", "Artificial Analysis implementation using the Stirrup harness, ServiceNow dataset, oracle tool mode, and three repeats per task."],
  ["OPS-03", categories[1], "Commerce Agent Bench", "Pi-harness full-suite pass rate", "Already a 0–100% pass rate; pin 107 tasks and Pi harness", "Graded", "2025-Q4", "https://github.com/Accio-org/CommerceAgentBench", "Harness is held fixed so model release changes are more comparable."],
  ["OPS-04", categories[1], "ClawMark", "Avg@3 weighted deterministic-checker score", "Already a 0–100% score; pin 100-task repo snapshot", "Graded", "2026-Q1", "https://github.com/evolvent-ai/ClawMark", "Multi-day, multimodal coworker tasks across 13 domains."],
  ["OPS-05", categories[1], "TheAgentCompany", "Fraction of workplace tasks completed", "Already a 0–100% completion rate; community harness rows flagged", "Graded", "2024-Q4", "https://arxiv.org/abs/2412.14161", "Later points may include harness changes and should not be read as model-only uplift."],
  ["OPS-06", categories[1], "WorkArena++", "Browser workplace task success", "Ungraded until a consistent current frontier series is entered", "Ungraded", "2024-Q3", "https://arxiv.org/abs/2407.05291", "Cataloged as an important browser/computer-use signal."],
  ["OPS-07", categories[1], "Finch / FinWorkBench", "Strict finance-work task pass rate", "Already a 0–100% pass rate", "Graded", "2026-Q2", "https://aclanthology.org/2026.findings-acl.523/", "Professional finance work with artifact and workflow requirements."],
  ["OPS-08", categories[1], "tau3 Banking", "Pass^k / strict banking-agent success", "Already a 0–100% success rate; use one fixed leaderboard definition", "Graded", "2025-Q3", "https://taubench.com/leaderboard/", "Customer-service policy and tool execution under realistic state."],

  ["PER-01", categories[2], "MyPCBench", "Perfect task success rate", "Already a 0–100% strict rate", "Graded", "2026-Q1", "https://mypcbench.com/", "Direct desktop computer use; current leaderboard may omit newer model generations."],
  ["PER-02", categories[2], "pi-Bench", "Completeness checklist score", "Already a 0–100% score", "Graded", "2026-Q2", "https://arxiv.org/html/2605.14678v3", "Personal-computing workflows scored for completion."],
  ["PER-03", categories[2], "ClawBench", "V1 six-model comparison score", "Already a 0–100% score; pin benchmark repo/version and scoring table", "Graded", "2026-Q2", "https://github.com/TIGER-AI-Lab/ClawBench", "Uses the repository's 33.3 headline/comparison score, not the separately reported 61.4% original-rubric pass rate."],
  ["PER-04", categories[2], "AssistantBench (HAL)", "Assistant task accuracy on the current HAL configuration", "Already a 0–100% score; do not splice the 33-task HAL configuration to the 2024 full benchmark", "Graded", "2025-Q2", "https://hal.cs.princeton.edu/assistantbench", "Current HAL result covers 33 tasks and is treated as a one-point series, so it projects flat."],

  ["VAL-01", categories[3], "GDPval", "Expert preference / economic task quality", "Ungraded here: public headline is approximate and newer variants report Elo", "Ungraded", "2025-Q3", "https://openai.com/index/gdpval/", "Keep the benchmark, but do not turn ‘just under half’ or Elo into a fake percentage."],
  ["VAL-02", categories[3], "Remote Labor Index", "Strict end-to-end job automation rate", "Already a 0–100% rate", "Graded", "2025-Q3", "https://www.remotelabor.ai/", "Professional-worker benchmark used as a transfer signal, not a consumer denominator."],
  ["VAL-03", categories[3], "OmegaUse-OfficeVal", "Economic value of office-computer work", "Ungraded until a stable percentage-completion frontier series is entered", "Ungraded", "2026-Q2", "https://omegause-officeval.github.io/", "Economic value and computer-use signal."],
  ["VAL-04", categories[3], "Claw-Eval", "Pass^3 on governed agent tasks", "Already a 0–100% strict reliability score", "Graded", "2026-Q1", "https://github.com/claw-eval/claw-eval", "Governance/reliability emphasis; one current frontier point."],
];

const observations = [
  ["DES-01", "2026-02-05", "2026-Q1", 9, 8017.59 / 63000, "Claude Opus 4.6", "Frontier balance / $63,000 strategy target", "https://andonlabs.com/evals/vending-bench-2", "Observed release-quarter frontier."],
  ["DES-01", "2026-04-16", "2026-Q2", 10, 10936.76 / 63000, "Claude Opus 4.7", "Frontier balance / $63,000 strategy target", "https://andonlabs.com/evals/vending-bench-2", "Observed release-quarter frontier."],
  ["DES-01", "2026-07-24", "2026-Q3", 11, 11181.87 / 63000, "Claude Opus 5", "Frontier balance / $63,000 strategy target", "https://andonlabs.com/evals/vending-bench-2", "Observed release-quarter frontier."],
  ["DES-02", "2026-06-09", "2026-Q2", 10, 12630078 / 2200000000, "Claude Fable 5", "Best-run final cash / $2.2B upper bound", "https://ceobench.com/", "Three runs/model; best-run statistic is noisy."],
  ["DES-02", "2026-08-01", "2026-Q3", 11, 22148357 / 2200000000, "Kimi K3", "Best-run final cash / $2.2B upper bound", "https://ceobench.com/", "Three runs/model; best-run statistic is noisy."],
  ["DES-03", "2026-04-01", "2026-Q2", 10, Math.min(1, 1270000 / 1000000), "Claude Opus 4.6", "Mean final funds / $1M published substantial-profit threshold", "https://arxiv.org/abs/2604.01212", "Provisional target-normalized score. Saturated at launch; no human or oracle ceiling is published."],
  ["DES-04", "2026-08-11", "2026-Q3", 11, 188488 / 436195, "Gemini 3.1 Pro", "Best-model mean final worth / expert-strategy final worth", "https://arxiv.org/abs/2608.08621", "Ten matched runs per model; reference strategy uses only agent-visible information."],
  ["DES-05", "2026-03-20", "2026-Q1", 9, 0.60, "Codex CLI + GPT-5.5 / DeepSeek-V4 + ReAct (tie)", "Best-system full-horizon survival", "https://arxiv.org/html/2603.23638v2", "Five seeds per system. The paper reports 60% full survival for both leaders and 20% for Qwen3.5-9B."],
  ["DES-06", "2026-07-08", "2026-Q3", 11, 24350.98 / 131510.42, "GPT-5.5 + ReAct", "Best LLM final net worth / oracle final net worth", "https://arxiv.org/abs/2603.16453", "Selected-run protocol; oracle has privileged simulator access and is a ceiling-like reference."],
  ["DES-07", "2026-08-04", "2026-Q3", 11, 0.273, "Qwen3.7-Max + Hermes", "Best LLM mean final net assets / human mean", "https://arxiv.org/abs/2607.28956", "Authors' reported ratio; three LLM runs per configuration and three non-expert human participants."],

  ["OPS-01", "2026-05-28", "2026-Q2", 10, 0.3033, "Claude Opus 4.8", "Public 600-task pass rate, max reasoning", "https://github.com/zapier/AutomationBench", "Current public frontier after the July 2026 stricter-classifier rescore; 182/600 tasks. Later private-leaderboard results are not comparable."],
  ["OPS-02", "2025-06-17", "2025-Q2", 6, 0.200, "Gemini 2.5 Pro + Stirrup", "Strict task success in oracle tool mode", "https://artificialanalysis.ai/evaluations/enterprise-ops-gym-aa", "Retrospective release-date point from the EnterpriseOps-Gym-AA table."],
  ["OPS-02", "2025-09-29", "2025-Q3", 7, 0.341, "Claude Sonnet 4.5 + Stirrup", "Strict task success in oracle tool mode", "https://artificialanalysis.ai/evaluations/enterprise-ops-gym-aa", "Retrospective release-date point from the EnterpriseOps-Gym-AA table."],
  ["OPS-02", "2025-11-24", "2025-Q4", 8, 0.394, "Claude Opus 4.5 + Stirrup", "Strict task success in oracle tool mode", "https://artificialanalysis.ai/evaluations/enterprise-ops-gym-aa", "Retrospective release-date point from the EnterpriseOps-Gym-AA table."],
  ["OPS-02", "2026-02-05", "2026-Q1", 9, 0.459, "Claude Opus 4.6 + Stirrup", "Strict task success in oracle tool mode", "https://artificialanalysis.ai/evaluations/enterprise-ops-gym-aa", "Retrospective release-date point from the EnterpriseOps-Gym-AA table."],
  ["OPS-02", "2026-07-01", "2026-Q3", 11, 0.511, "Claude Fable 5 + Stirrup + Opus 4.8 fallback", "Strict task success in oracle tool mode", "https://artificialanalysis.ai/evaluations/enterprise-ops-gym-aa", "Current 51.1% frontier; adaptive max-effort configuration includes an Opus 4.8 fallback."],
  ["OPS-03", "2025-12-17", "2025-Q4", 8, 0.290, "Gemini 3 Flash + Pi", "Pi-harness full-suite pass rate", "https://github.com/Accio-org/CommerceAgentBench", "107-task benchmark snapshot."],
  ["OPS-03", "2026-05-01", "2026-Q2", 10, 0.523, "Claude Opus 4.8 + Pi", "Pi-harness full-suite pass rate", "https://github.com/Accio-org/CommerceAgentBench", "Quarter frontier; fixed Pi harness."],
  ["OPS-03", "2026-07-24", "2026-Q3", 11, 0.607, "Claude Opus 5 + Pi", "Pi-harness full-suite pass rate", "https://github.com/Accio-org/CommerceAgentBench", "65/107 tasks; fixed Pi harness."],
  ["OPS-04", "2026-03-01", "2026-Q1", 9, 0.758, "Claude Sonnet 4.6", "Avg@3 weighted deterministic-checker score", "https://github.com/evolvent-ai/ClawMark", "One pinned 100-task repo snapshot."],
  ["OPS-05", "2024-12-19", "2024-Q4", 4, 0.240, "Launch-paper best system", "Fraction of tasks completed", "https://arxiv.org/abs/2412.14161", "Primary-paper baseline."],
  ["OPS-05", "2025-06-17", "2025-Q2", 6, 0.303, "Gemini 2.5 Pro", "Fraction of tasks completed", "https://the-agent-company.com/", "Later leaderboard configuration; comparability caveat."],
  ["OPS-05", "2025-09-01", "2025-Q3", 7, 0.429, "DeepSeek V3.2 + specialized harness", "Fraction of tasks completed", "https://the-agent-company.com/", "Community/specialized harness; system-level frontier."],
  ["OPS-07", "2025-11-13", "2025-Q4", 8, 0.384, "GPT-5.1 Pro", "Strict finance-work task pass rate", "https://aclanthology.org/2026.findings-acl.523/", "Model release-quarter assignment; publication followed in 2026."],
  ["OPS-08", "2025-09-29", "2025-Q3", 7, 0.253, "Claude Sonnet 4.5", "tau3 Banking strict success", "https://taubench.com/leaderboard/", "Release-quarter frontier."],
  ["OPS-08", "2025-12-11", "2025-Q4", 8, 0.322, "GPT-5.2", "tau3 Banking strict success", "https://taubench.com/leaderboard/", "Release-quarter frontier."],
  ["OPS-08", "2026-03-05", "2026-Q1", 9, 0.394, "GPT-5.4", "tau3 Banking strict success", "https://taubench.com/leaderboard/", "Release-quarter frontier."],
  ["OPS-08", "2026-05-01", "2026-Q2", 10, 0.446, "GPT-5.5", "tau3 Banking strict success", "https://taubench.com/leaderboard/", "Release-quarter frontier."],
  ["OPS-08", "2026-08-01", "2026-Q3", 11, 0.552, "Qwen 3.8 Max", "tau3 Banking strict success", "https://taubench.com/leaderboard/", "Current quarter frontier."],

  ["PER-01", "2026-02-05", "2026-Q1", 9, 0.582, "Claude Opus 4.6", "Perfect task success rate", "https://mypcbench.com/", "Current published frontier; newer models may be missing."],
  ["PER-02", "2026-02-05", "2026-Q1", 9, 0.676, "Claude Opus 4.6", "Completeness checklist score", "https://arxiv.org/html/2605.14678v3", "One comparable frontier point."],
  ["PER-03", "2026-06-01", "2026-Q2", 10, 0.333, "Claude Sonnet 4.6", "ClawBench V1 six-model comparison score", "https://github.com/TIGER-AI-Lab/ClawBench", "Repository headline/comparison score. Do not mix with its separate original-rubric pass-rate table."],
  ["PER-04", "2025-04-16", "2025-Q2", 6, 0.3881, "Browser-Use + o3 Medium", "Assistant task accuracy on current HAL 33-task configuration", "https://hal.cs.princeton.edu/assistantbench", "Verified HAL leaderboard result. Kept separate from the 2024 full-benchmark configuration and projected flat."],

  ["VAL-02", "2025-09-29", "2025-Q3", 7, 0.0208, "Claude Sonnet 4.5", "Strict end-to-end automation rate", "https://www.remotelabor.ai/", "Quarter frontier."],
  ["VAL-02", "2025-11-24", "2025-Q4", 8, 0.0375, "Claude Opus 4.5", "Strict end-to-end automation rate", "https://www.remotelabor.ai/", "Quarter frontier."],
  ["VAL-02", "2026-02-05", "2026-Q1", 9, 0.0417, "Claude Opus 4.6", "Strict end-to-end automation rate", "https://www.remotelabor.ai/", "Quarter frontier."],
  ["VAL-02", "2026-06-09", "2026-Q2", 10, 0.1580, "Claude Fable 5", "Strict end-to-end automation rate", "https://www.remotelabor.ai/", "Current frontier; large quarter jump merits caution."],
  ["VAL-04", "2026-02-05", "2026-Q1", 9, 0.704, "Claude Opus 4.6", "Pass^3 governed-agent score", "https://github.com/claw-eval/claw-eval", "One current frontier point."],
];

const quarters = [];
for (let year = 2024; year <= 2028; year++) {
  for (let q = 1; q <= 4; q++) quarters.push({ label: `${year}-Q${q}`, index: quarters.length + 1 });
}

const colName = (n) => {
  let s = "";
  while (n > 0) { n--; s = String.fromCharCode(65 + (n % 26)) + s; n = Math.floor(n / 26); }
  return s;
};

const workbook = Workbook.create();
const summary = workbook.worksheets.add("Summary");
const report = workbook.worksheets.add("Report Card");
const obs = workbook.worksheets.add("Observations");
const cat = workbook.worksheets.add("Catalog");
const model = workbook.worksheets.add("Model");
const metr = workbook.worksheets.add("METR Horizon");
const method = workbook.worksheets.add("Methodology");
for (const sheet of [summary, report, obs, cat, model, metr, method]) sheet.showGridLines = false;

function titleBand(sheet, range, title, subtitleRange, subtitle) {
  sheet.getRange(range).merge();
  sheet.getRange(range).values = [[title]];
  sheet.getRange(range).format = { fill: colors.navy, font: { bold: true, color: colors.white, size: 18 }, verticalAlignment: "center" };
  sheet.getRange(subtitleRange).merge();
  sheet.getRange(subtitleRange).values = [[subtitle]];
  sheet.getRange(subtitleRange).format = { fill: colors.navy, font: { color: "#C9D7E3", size: 10 }, verticalAlignment: "center", wrapText: true };
}
function sectionBand(sheet, range, text, fill = colors.teal) {
  sheet.getRange(range).merge(); sheet.getRange(range).values = [[text]];
  sheet.getRange(range).format = { fill, font: { bold: true, color: colors.white, size: 11 }, verticalAlignment: "center" };
}
function styleHeader(range, fill = colors.teal) {
  range.format = { fill, font: { bold: true, color: colors.white }, wrapText: true, verticalAlignment: "center", horizontalAlignment: "center", borders: { preset: "all", style: "thin", color: colors.line } };
}
function styleBody(range) {
  range.format = { font: { color: colors.ink, size: 9 }, verticalAlignment: "top", wrapText: true, borders: { preset: "all", style: "thin", color: colors.line } };
}

// Methodology first so all other formulas can reference stable assumption cells.
titleBand(method, "A1:J2", "Methodology — Four-Year Capability Report Card", "A3:J3", "Observed frontier scores are kept separate from carried values and projections. The forecast models system capability: model + harness + tools + budget.");
sectionBand(method, "A5:D5", "MODEL PARAMETERS");
method.getRange("A6:D14").values = [
  ["Parameter", "Value", "Unit", "Rule"],
  ["As-of date", asOf, "date", "Current report cutoff"],
  ["Current quarter index", currentQuarterIndex, "quarter", "2024-Q1 = 1; 2026-Q3 = 11"],
  ["First forecast quarter", firstForecastQuarterIndex, "quarter", "2026-Q4"],
  ["Projection horizon", 20, "quarter", "Ends 2028-Q4"],
  ["Projection transform", "-LOG2(1-score)", "failure-gap halvings", "One unit means the remaining gap to 100% is halved"],
  ["Monotonic frontier floor", "Enabled", "rule", "Forecast cannot fall below the current frontier"],
  ["Sparse-history rule", "Shared frontier", "rule", "Every graded benchmark receives the pooled frontier depth gain; sparse evidence widens uncertainty instead of forcing zero progress"],
  ["Capability feedback", "METR H50 + H80", "rule", "H50 sets task-horizon acceleration; H80 is a reliability guardrail. Benchmark-local acceleration remains diagnostic only."],
];
styleHeader(method.getRange("A6:D6")); styleBody(method.getRange("A7:D14")); method.getRange("B7").format.numberFormat = "yyyy-mm-dd";

sectionBand(method, "F5:H5", "LETTER-GRADE SCALE");
method.getRange("F6:H11").values = [
  ["Letter", "Minimum score", "Grade points"], ["A", 0.90, 4], ["B", 0.80, 3], ["C", 0.70, 2], ["D", 0.60, 1], ["F", 0.00, 0],
];
styleHeader(method.getRange("F6:H6")); styleBody(method.getRange("F7:H11")); method.getRange("G7:G11").format.numberFormat = "0%";

sectionBand(method, "A15:J15", "FORECAST EQUATIONS AND INTERPRETATION");
method.getRange("A16:J22").values = [
  ["Object", "Equation / rule", "Interpretation", null, null, null, null, null, null, null],
  ["Economic depth", "d = -LOG2(1 - score)", "Transforms each bounded economic benchmark into halvings of its remaining failure gap. Exact 100% is represented as 30 halvings for finite computation.", null, null, null, null, null, null, null],
  ["Economic velocity", "v_e = confidence-weighted mean of recent benchmark depth velocity", "Anchors the current rate at which the economic-work composite is closing its remaining gap. Benchmark-local accelerations do not drive the forecast.", null, null, null, null, null, null, null],
  ["METR acceleration", "a_H50 = v_H50 · MIN(k_H50, k_H80)", "A quadratic fit of log2 task horizon supplies relative acceleration k. H50 is primary; the slower of positive H50/H80 feedback estimates is used so reliability cannot silently lag.", null, null, null, null, null, null, null],
  ["Transfer", "τ = v_e / v_H50; k = a_H50 / v_H50", "The level comes from economic benchmarks; METR determines how quickly that level's velocity compounds. The transfer coefficient keeps the initial economic velocity anchored to observed economic data.", null, null, null, null, null, null, null],
  ["Projection", "Δd(h) = v_e·(EXP(k·h) - 1) / k", "Continuous shared-frontier depth gain; when k = 0, Δd = v_e·h. Positive METR acceleration makes future progress raise the subsequent progress rate.", null, null, null, null, null, null, null],
  ["Back-transform", "score_b(h) = 1 - 2^(-(d_b,now + MAX(0,Δd(h))))", "Each graded benchmark receives the shared economic-depth gain, then categories are recomputed and confidence weighted. The score approaches 100% asymptotically.", null, null, null, null, null, null, null],
];
for (let r = 16; r <= 22; r++) { method.getRange(`C${r}:J${r}`).merge(); }
styleHeader(method.getRange("A16:J16")); styleBody(method.getRange("A17:J22"));

sectionBand(method, "A24:J24", "NORMALIZATION RULES");
method.getRange("A25:J30").values = [
  ["Metric type", "Conversion to 0–100%", null, null, null, null, null, null, null, null],
  ["Native percentage", "Use the strict pass, completion, survival, or rubric score as published; pin the benchmark and evaluation configuration.", null, null, null, null, null, null, null, null],
  ["Terminal money", "Frontier terminal outcome ÷ a fixed published target, human result, expert strategy, or oracle result; cap at 100%.", null, null, null, null, null, null, null, null],
  ["Target-only money", "If no human/oracle result exists, a source-published success target may be used provisionally and must be labeled when saturated.", null, null, null, null, null, null, null, null],
  ["Elo", "Convert to win probability against a fixed named anchor: p = 1 / (1 + 10^((R_anchor − R_system)/400)). Never min–max a changing leaderboard.", null, null, null, null, null, null, null, null],
  ["Guardrail", "Do not mix ratios to different anchors in one series. A changed task, harness, judge, budget, or anchor is a documented series break.", null, null, null, null, null, null, null, null],
];
for (let r = 25; r <= 30; r++) method.getRange(`B${r}:J${r}`).merge();
styleHeader(method.getRange("A25:J25")); styleBody(method.getRange("A26:J30"));

sectionBand(method, "A32:J32", "COMPOSITE & CONFIDENCE RULES");
method.getRange("A33:J41").values = [
  ["Rule", "Definition", null, null, null, null, null, null, null, null],
  ["Current benchmark grade", "Latest observed frontier carried to 2026-Q3; A ≥90%, B ≥80%, C ≥70%, D ≥60%, F <60%.", null, null, null, null, null, null, null, null],
  ["Benchmark GPA", "A=4, B=3, C=2, D=1, F=0. Ungraded benchmarks are excluded, not assigned zero.", null, null, null, null, null, null, null, null],
  ["Category GPA", "Mean GPA of graded benchmarks within the category.", null, null, null, null, null, null, null, null],
  ["Evidence credits", "Each benchmark earns one credit per distinct quarterly observation, capped at three. Ungraded or unobserved benchmarks earn zero.", null, null, null, null, null, null, null, null],
  ["Confidence weight", "Category evidence credits ÷ (3 × cataloged benchmarks in the category). This continuous 0–100% weight captures coverage and longitudinal depth.", null, null, null, null, null, null, null, null],
  ["Confidence label", "High ≥80%; Medium ≥50%; Low <50%. The label summarizes the continuous weight used in the model.", null, null, null, null, null, null, null, null],
  ["Overall GPA", "Confidence-weighted mean of the four category GPAs, so sparse categories exert less influence without disappearing.", null, null, null, null, null, null, null, null],
  ["Overall score", "Confidence-weighted mean of category scores after every benchmark has been normalized to 0–100% completion/saturation.", null, null, null, null, null, null, null, null],
];
for (let r = 33; r <= 41; r++) method.getRange(`B${r}:J${r}`).merge();
styleHeader(method.getRange("A33:J33")); styleBody(method.getRange("A34:J41"));

sectionBand(method, "A43:J43", "UPDATE PROTOCOL");
method.getRange("A44:J48").values = [
  ["1", "Append one row to Observations for each new comparable benchmark result; keep benchmark ID and quarter index intact.", null, null, null, null, null, null, null, null],
  ["2", "Use the release quarter, not the date the analyst happened to discover the result. Keep only the quarter frontier for a fixed benchmark/harness definition.", null, null, null, null, null, null, null, null],
  ["3", "If the task set, harness, judge, retry policy, tools, or budget changes, describe the break in Notes and decide whether the row belongs in the same series.", null, null, null, null, null, null, null, null],
  ["4", "Add new benchmarks to Catalog and Report Card only when their metric can be normalized without an arbitrary denominator.", null, null, null, null, null, null, null, null],
  ["5", "Append new METR H50/H80 observations to the canonical CSV, refit the horizon curve, and inspect projected saturation. A projection is a scenario extrapolation, not a probability distribution.", null, null, null, null, null, null, null, null],
];
for (let r = 44; r <= 48; r++) method.getRange(`B${r}:J${r}`).merge();
styleBody(method.getRange("A44:J48")); method.getRange("A44:A48").format = { fill: colors.lightTeal, font: { bold: true, color: colors.teal, size: 12 }, horizontalAlignment: "center", verticalAlignment: "center", borders: { preset: "all", style: "thin", color: colors.line } };
method.freezePanes.freezeRows(3);

// Catalog.
titleBand(cat, "A1:I2", "Benchmark Catalog", "A3:I3", "A benchmark can remain strategically important while ungraded. Ungraded rows are preserved until a defensible 0–100% normalization is available.");
cat.getRange("A5:I5").values = [["Benchmark ID", "Category", "Benchmark Name", "Primary score used", "Normalization rule", "Status", "First release quarter", "Primary URL", "Notes"]];
cat.getRange(`A6:I${5 + catalog.length}`).values = catalog;
styleHeader(cat.getRange("A5:I5")); styleBody(cat.getRange(`A6:I${5 + catalog.length}`));
cat.getRange(`F6:F${5 + catalog.length}`).dataValidation = { rule: { type: "list", values: ["Graded", "Ungraded"] } };
cat.tables.add(`A5:I${5 + catalog.length}`, true, "BenchmarkCatalogTable");
cat.freezePanes.freezeRows(5); cat.freezePanes.freezeColumns(3);

// Observations.
titleBand(obs, "A1:K2", "Normalized Benchmark Observations", "A3:K3", "Evidence captured by 2026-08-26. The date column is the evaluated system's release date used on the retrospective x-axis—not the date the leaderboard result first became public.");
obs.getRange("A5:K5").values = [["Benchmark ID", "Benchmark Name", "Category", "System release date (x-axis)", "Quarter", "Quarter index", "Score", "System / harness", "Score basis", "Source URL", "Notes"]];
const byId = new Map(catalog.map((r) => [r[0], r]));
const obsRows = observations.map((r) => {
  const c = byId.get(r[0]);
  return [r[0], c[2], c[1], d(r[1]), r[2], r[3], r[4], r[5], r[6], r[7], r[8]];
});
obs.getRange(`A6:K${5 + obsRows.length}`).values = obsRows;
styleHeader(obs.getRange("A5:K5")); styleBody(obs.getRange(`A6:K${5 + obsRows.length}`));
obs.getRange(`D6:D${5 + obsRows.length}`).format.numberFormat = "yyyy-mm-dd";
obs.getRange(`G6:G${5 + obsRows.length}`).format.numberFormat = "0.0%";
obs.getRange(`F6:F${5 + obsRows.length}`).dataValidation = { rule: { type: "wholeNumber", operator: "between", formula1: 1, formula2: 20 } };
obs.getRange(`G6:G${5 + obsRows.length}`).dataValidation = { rule: { type: "decimal", operator: "between", formula1: 0, formula2: 1 } };
obs.tables.add(`A5:K${5 + obsRows.length}`, true, "BenchmarkObservationsTable");
obs.freezePanes.freezeRows(5); obs.freezePanes.freezeColumns(3);

// Primary capability-velocity signal and reliability guardrail.
titleBand(metr, "A1:Y2", "METR Task Horizon — Capability Velocity and Acceleration", "A3:Y3", "The economic benchmark basket sets capability level. METR H50 determines how quickly the shared frontier velocity compounds; H80 checks that longer horizons are not purchased by abandoning reliability.");
metr.getRange("A5:L5").values = [["Metric", "Model / system", "Release date", "Horizon (minutes)", "log₂ minutes", "Elapsed quarters to latest", "Fitted log₂ minutes", "Residual", "Harness", "Source URL", "Comparability note", "Observation role"]];
const metrRows = metrSeries.flatMap((series) => series.rows.map((row) => [
  series.key,
  row.model_or_system,
  d(row.model_release_date),
  Number(row.score),
  null,
  (Date.parse(row.model_release_date) - series.fit.latestTimestamp) / 86_400_000 / quarterDays,
  null,
  null,
  row.harness_scope,
  row.source,
  row.comparability_note,
  row.series_role,
]));
metr.getRange(`A6:L${5 + metrRows.length}`).values = metrRows;
for (let index = 0; index < metrRows.length; index++) {
  const row = 6 + index;
  metr.getRange(`E${row}`).formulas = [[`=LN(D${row})/LN(2)`]];
  metr.getRange(`G${row}`).formulas = [[`=IF(A${row}="H50",$W$6+$X$6*F${row}+$Y$6*F${row}^2,$W$7+$X$7*F${row}+$Y$7*F${row}^2)`]];
  metr.getRange(`H${row}`).formulas = [[`=E${row}-G${row}`]];
}
styleHeader(metr.getRange("A5:L5")); styleBody(metr.getRange(`A6:L${5 + metrRows.length}`));
metr.getRange(`C6:C${5 + metrRows.length}`).format.numberFormat = "yyyy-mm-dd";
metr.getRange(`D6:D${5 + metrRows.length}`).format.numberFormat = "0.0";
metr.getRange(`E6:H${5 + metrRows.length}`).format.numberFormat = "0.000";
metr.tables.add(`A5:L${5 + metrRows.length}`, true, "MetrHorizonObservationsTable");

metr.getRange("N5:Y5").values = [["Metric", "Observations", "Source velocity (doublings/qtr)", "Quadratic current velocity", "Quadratic acceleration", "Relative acceleration k", "Velocity growth / qtr", "Fit R²", "Evidence role", "β₀", "β₁", "β₂"]];
metr.getRange("N6:Y7").values = metrSeries.map((series) => [
  series.key,
  series.rows.length,
  series.sourceVelocity,
  series.fit.beta1,
  series.fit.acceleration,
  series.fit.relativeAcceleration,
  Math.expm1(series.fit.relativeAcceleration),
  series.fit.rSquared,
  series.role,
  series.fit.beta0,
  series.fit.beta1,
  series.fit.beta2,
]);
styleHeader(metr.getRange("N5:Y5")); styleBody(metr.getRange("N6:Y7"));
metr.getRange("P6:T7").format.numberFormat = "+0.000;-0.000;0.000";
metr.getRange("U6:U7").format.numberFormat = "0.0%";
metr.getRange("V6:V7").format.numberFormat = "0.000";
metr.getRange("X6:Y7").format.numberFormat = "0.000";
metr.tables.add("N5:Y7", true, "MetrHorizonFitTable");

sectionBand(metr, "N10:Q10", "FORECAST BRIDGE");
metr.getRange("N11:Q19").values = [
  ["Parameter", "Value", "Unit", "Rule"],
  ["Economic gap velocity", null, "failure-gap halvings / qtr", "Confidence-weighted current benchmark velocity"],
  ["H50 source velocity", null, "task-horizon doublings / qtr", `Published ${h50Series.trendDays.toFixed(3)}-day recent-fit doubling time`],
  ["Effective relative acceleration", null, "per qtr", "Slower positive k from H50 and H80 quadratic fits"],
  ["Default H50 acceleration", null, "task-horizon doublings / qtr²", "H50 source velocity × effective relative acceleration"],
  ["Economic transfer coefficient", null, "economic gap halvings / horizon doubling", "Economic velocity ÷ H50 velocity"],
  ["Initial economic acceleration", null, "failure-gap halvings / qtr²", "Economic velocity × effective relative acceleration"],
  ["H80 implied acceleration", null, "task-horizon doublings / qtr²", "H80 source velocity × H80 relative acceleration"],
  ["H80 / H50 feedback ratio", null, "ratio", "Values ≥1 confirm that the reliability horizon is not accelerating more slowly"],
];
metr.getRange("O12").formulas = [["='Summary'!$G$17"]];
metr.getRange("O13").formulas = [["=P6"]];
metr.getRange("O14").formulas = [["=MAX(0,MIN(S6,S7))"]];
metr.getRange("O15").formulas = [["=O13*O14"]];
metr.getRange("O16").formulas = [["=O12/O13"]];
metr.getRange("O17").formulas = [["=O12*O14"]];
metr.getRange("O18").formulas = [["=P7*S7"]];
metr.getRange("O19").formulas = [["=S7/S6"]];
styleHeader(metr.getRange("N11:Q11")); styleBody(metr.getRange("N12:Q19"));
metr.getRange("O12:O18").format.numberFormat = "+0.000;-0.000;0.000";
metr.getRange("O19").format.numberFormat = "0.00x";

sectionBand(metr, "N21:Y21", "INTERPRETATION / LIMITATIONS");
metr.getRange("N22:Y27").values = [
  ["Reading rule", "The default acceleration is a real H50 task-horizon acceleration, not a multiplier. Raising it increases the feedback coefficient k = a/v and therefore brings the gate forward.", null, null, null, null, null, null, null, null, null, null],
  ["H50 role", "Primary measure of the length of tasks a model–harness system can complete at 50% success. The forecast uses the published recent-fit velocity rather than the noisy endpoint derivative.", null, null, null, null, null, null, null, null, null, null],
  ["H80 role", "Reliability guardrail on the same task suite. The default uses the slower positive relative-acceleration estimate; H80 currently accelerates faster, so H50 controls.", null, null, null, null, null, null, null, null, null, null],
  ["Acceleration fit", "Quadratic least squares on log₂ horizon versus elapsed quarters, centered at the latest release. Only five recent points exist, so the acceleration estimate is low confidence and scenario-sensitive.", null, null, null, null, null, null, null, null, null, null],
  ["Ceiling warning", "METR warns that central H50 estimates above 16 hours are unreliable. The final H50 point is retained for transparency; H80 and the published recent-fit velocity limit overinterpretation.", null, null, null, null, null, null, null, null, null, null],
  ["Transfer assumption", "Economic benchmarks measure whether systems can do useful work; METR measures how quickly task horizon advances. Applying METR's relative acceleration to economic gap velocity is the conjectural bridge and a direct target for refutation.", null, null, null, null, null, null, null, null, null, null],
];
for (let row = 22; row <= 27; row++) metr.getRange(`O${row}:Y${row}`).merge();
styleBody(metr.getRange("N22:Y27"));
metr.freezePanes.freezeRows(5); metr.freezePanes.freezeColumns(2);

// Model coefficients and current grades. These formulas make the workbook update from appended observations.
titleBand(model, "A1:U2", "Projection Model — Economic Benchmark Level and Transfer", "A3:U3", "Helper sheet. Economic benchmarks set the current level and initial gap velocity. Benchmark-local acceleration is diagnostic; METR H50/H80 controls the shared feedback applied to every graded benchmark.");
model.getRange("A5:U5").values = [["Benchmark ID", "Benchmark Name", "Category", "Obs count", "Prior-2 Q", "Prior Q", "Latest Q", "Prior-2 score", "Prior score", "Latest score", "Prior-2 depth", "Prior depth", "Latest depth", "Recent gap velocity", "Prior gap velocity", "Benchmark-local acceleration (diagnostic)", "Projection basis", "Current score", "Letter", "GPA", "Evidence credits"]];
styleHeader(model.getRange("A5:U5"));
for (let i = 0; i < catalog.length; i++) {
  const row = 6 + i;
  model.getRange(`A${row}:C${row}`).values = [[catalog[i][0], catalog[i][2], catalog[i][1]]];
  model.getRange(`D${row}`).formulas = [[`=COUNTIF('Observations'!$A$6:$A$500,A${row})`]];
  model.getRange(`G${row}`).formulas = [[`=IF(D${row}=0,"",MAXIFS('Observations'!$F$6:$F$500,'Observations'!$A$6:$A$500,A${row}))`]];
  model.getRange(`F${row}`).formulas = [[`=IF(D${row}<2,"",MAXIFS('Observations'!$F$6:$F$500,'Observations'!$A$6:$A$500,A${row},'Observations'!$F$6:$F$500,"<"&G${row}))`]];
  model.getRange(`E${row}`).formulas = [[`=IF(D${row}<3,"",MAXIFS('Observations'!$F$6:$F$500,'Observations'!$A$6:$A$500,A${row},'Observations'!$F$6:$F$500,"<"&F${row}))`]];
  model.getRange(`H${row}`).formulas = [[`=IF(E${row}="","",SUMIFS('Observations'!$G$6:$G$500,'Observations'!$A$6:$A$500,A${row},'Observations'!$F$6:$F$500,E${row}))`]];
  model.getRange(`I${row}`).formulas = [[`=IF(F${row}="","",SUMIFS('Observations'!$G$6:$G$500,'Observations'!$A$6:$A$500,A${row},'Observations'!$F$6:$F$500,F${row}))`]];
  model.getRange(`J${row}`).formulas = [[`=IF(G${row}="","",SUMIFS('Observations'!$G$6:$G$500,'Observations'!$A$6:$A$500,A${row},'Observations'!$F$6:$F$500,G${row}))`]];
  model.getRange(`K${row}`).formulas = [[`=IF(H${row}="","",IF(H${row}>=1,30,-LN(1-H${row})/LN(2)))`]];
  model.getRange(`L${row}`).formulas = [[`=IF(I${row}="","",IF(I${row}>=1,30,-LN(1-I${row})/LN(2)))`]];
  model.getRange(`M${row}`).formulas = [[`=IF(J${row}="","",IF(J${row}>=1,30,-LN(1-J${row})/LN(2)))`]];
  model.getRange(`N${row}`).formulas = [[`=IF(D${row}<2,0,(M${row}-L${row})/(G${row}-F${row}))`]];
  model.getRange(`O${row}`).formulas = [[`=IF(D${row}<3,0,(L${row}-K${row})/(F${row}-E${row}))`]];
  model.getRange(`P${row}`).formulas = [[`=IF(D${row}<3,0,(N${row}-O${row})/(((G${row}-F${row})+(F${row}-E${row}))/2))`]];
  model.getRange(`Q${row}`).formulas = [[`=IF(D${row}=0,"Ungraded — no normalized observation",IF(D${row}=1,"METR feedback transfer — one economic observation",IF(D${row}=2,"METR feedback transfer — economic velocity contributor","METR feedback transfer — local acceleration retained as diagnostic")))`]];
  model.getRange(`R${row}`).formulas = [[`=IF(D${row}=0,"",J${row})`]];
  model.getRange(`S${row}`).formulas = [[`=IF(R${row}="","N/A",IF(R${row}>='Methodology'!$G$7,"A",IF(R${row}>='Methodology'!$G$8,"B",IF(R${row}>='Methodology'!$G$9,"C",IF(R${row}>='Methodology'!$G$10,"D","F")))))`]];
  model.getRange(`T${row}`).formulas = [[`=IF(R${row}="","",IF(R${row}>='Methodology'!$G$7,'Methodology'!$H$7,IF(R${row}>='Methodology'!$G$8,'Methodology'!$H$8,IF(R${row}>='Methodology'!$G$9,'Methodology'!$H$9,IF(R${row}>='Methodology'!$G$10,'Methodology'!$H$10,'Methodology'!$H$11)))))`]];
  model.getRange(`U${row}`).formulas = [[`=MIN(D${row},3)`]];
}
styleBody(model.getRange(`A6:U${5 + catalog.length}`));
model.getRange(`H6:J${5 + catalog.length}`).format.numberFormat = "0.0%";
model.getRange(`K6:M${5 + catalog.length}`).format.numberFormat = "0.000";
model.getRange(`N6:P${5 + catalog.length}`).format.numberFormat = "0.000";
model.getRange(`R6:R${5 + catalog.length}`).format.numberFormat = "0.0%";
model.getRange(`T6:T${5 + catalog.length}`).format.numberFormat = "0.0";
model.getRange(`U6:U${5 + catalog.length}`).format.numberFormat = "0";
model.tables.add(`A5:U${5 + catalog.length}`, true, "ProjectionModelTable");
model.freezePanes.freezeRows(5); model.freezePanes.freezeColumns(3);

// Wide report card.
titleBand(report, "A1:AY2", "Personal AI Capability Report Card — 2024-Q1 to 2028-Q4", "A3:AY3", "Blue = observed release-quarter frontier; gray = carried frontier; gold = projected. Economic benchmarks set level and velocity; METR H50/H80 supplies the shared acceleration feedback. As of 2026-08-26.");
report.getRange("A4:A5").merge(); report.getRange("B4:B5").merge(); report.getRange("C4:C5").merge(); report.getRange("D4:D5").merge();
report.getRange("A4:D4").values = [["Category", "Benchmark ID", "Benchmark Name", "Score basis"]];
for (let i = 0; i < quarters.length; i++) {
  const startCol = 5 + i * 2;
  const a = `${colName(startCol)}4:${colName(startCol + 1)}4`;
  report.getRange(a).merge(); report.getRange(a).values = [[quarters[i].label]];
  report.getRange(`${colName(startCol)}5:${colName(startCol + 1)}5`).values = [["Score", "Δ score"]];
}
const summaryHeaders = ["Current Score", "Letter", "GPA", "Overall GPA", "Economic gap velocity (halvings/qtr)", "Local acceleration (diagnostic)", "Projection basis"];
report.getRange("AS4:AY4").merge(); report.getRange("AS4:AY4").values = [["CURRENT STATUS & FORECAST MODEL"]];
report.getRange("AS5:AY5").values = [summaryHeaders];
styleHeader(report.getRange("A4:AY5"));
for (let i = 0; i < quarters.length; i++) {
  const startCol = 5 + i * 2;
  const fill = quarters[i].index <= currentQuarterIndex ? colors.teal : colors.gold;
  report.getRange(`${colName(startCol)}4:${colName(startCol + 1)}5`).format.fill = fill;
}

const observationQuarterSet = new Set(observations.map((r) => `${r[0]}|${r[3]}`));
const overallGpaFormula = `=IFERROR((AVERAGEIF($A$6:$A$28,"${categories[0]}",$AU$6:$AU$28)*'Summary'!$K$13+AVERAGEIF($A$6:$A$28,"${categories[1]}",$AU$6:$AU$28)*'Summary'!$K$14+AVERAGEIF($A$6:$A$28,"${categories[2]}",$AU$6:$AU$28)*'Summary'!$K$15+AVERAGEIF($A$6:$A$28,"${categories[3]}",$AU$6:$AU$28)*'Summary'!$K$16)/SUM('Summary'!$K$13:$K$16),"")`;
const projectionDepthGainFormula = (quarterIndex) => {
  const horizon = `(${quarterIndex}-'Methodology'!$B$8)`;
  return `IF(ABS('Summary'!$G$17)<0.000000001,0,IF(ABS('METR Horizon'!$O$14)<0.000000001,'Summary'!$G$17*${horizon},'Summary'!$G$17*(EXP('METR Horizon'!$O$14*${horizon})-1)/'METR Horizon'!$O$14))`;
};
for (let i = 0; i < catalog.length; i++) {
  const row = 6 + i;
  const modelRow = row;
  report.getRange(`A${row}:D${row}`).values = [[catalog[i][1], catalog[i][0], catalog[i][2], catalog[i][3]]];
  for (let q = 0; q < quarters.length; q++) {
    const qi = quarters[q].index;
    const scoreColNum = 5 + q * 2;
    const rateColNum = scoreColNum + 1;
    const scoreCol = colName(scoreColNum);
    const rateCol = colName(rateColNum);
    if (qi <= currentQuarterIndex) {
      report.getRange(`${scoreCol}${row}`).formulas = [[`=IF(COUNTIFS('Observations'!$A$6:$A$500,$B${row},'Observations'!$F$6:$F$500,"<="&${qi})=0,"",SUMIFS('Observations'!$G$6:$G$500,'Observations'!$A$6:$A$500,$B${row},'Observations'!$F$6:$F$500,MAXIFS('Observations'!$F$6:$F$500,'Observations'!$A$6:$A$500,$B${row},'Observations'!$F$6:$F$500,"<="&${qi})))`]];
    } else {
      report.getRange(`${scoreCol}${row}`).formulas = [[`=IF('Model'!$D${modelRow}=0,"",1-POWER(2,-('Model'!$M${modelRow}+MAX(0,${projectionDepthGainFormula(qi)}))))`]];
    }
    if (q === 0) report.getRange(`${rateCol}${row}`).formulas = [[`=""`]];
    else {
      const prevScoreCol = colName(scoreColNum - 2);
      report.getRange(`${rateCol}${row}`).formulas = [[`=IF(OR(${scoreCol}${row}="",${prevScoreCol}${row}=""),"",${scoreCol}${row}-${prevScoreCol}${row})`]];
    }
    report.getRange(`${scoreCol}${row}:${rateCol}${row}`).format.fill = qi > currentQuarterIndex ? colors.lightGold : (observationQuarterSet.has(`${catalog[i][0]}|${qi}`) ? colors.actual : colors.carry);
  }
  const currentScoreCol = colName(5 + (currentQuarterIndex - 1) * 2);
  report.getRange(`AS${row}`).formulas = [[`=IF('Model'!$D${modelRow}=0,"",${currentScoreCol}${row})`]];
  report.getRange(`AT${row}`).formulas = [[`='Model'!S${modelRow}`]];
  report.getRange(`AU${row}`).formulas = [[`=IF('Model'!$D${modelRow}=0,"",'Model'!T${modelRow})`]];
  report.getRange(`AV${row}`).formulas = [[overallGpaFormula]];
  report.getRange(`AW${row}`).formulas = [[`='Model'!N${modelRow}`]];
  report.getRange(`AX${row}`).formulas = [[`='Model'!P${modelRow}`]];
  report.getRange(`AY${row}`).formulas = [[`='Model'!Q${modelRow}`]];
}
styleBody(report.getRange(`A6:AY${5 + catalog.length}`));
// Reapply semantic fills after body borders.
for (let i = 0; i < catalog.length; i++) {
  const row = 6 + i;
  for (let q = 0; q < quarters.length; q++) {
    const qi = quarters[q].index; const sc = colName(5 + q * 2); const rc = colName(6 + q * 2);
    report.getRange(`${sc}${row}:${rc}${row}`).format.fill = qi > currentQuarterIndex ? colors.lightGold : (observationQuarterSet.has(`${catalog[i][0]}|${qi}`) ? colors.actual : colors.carry);
  }
}
report.getRange(`E6:AR${5 + catalog.length}`).format.numberFormat = "0.0%";
report.getRange(`AS6:AS${5 + catalog.length}`).format.numberFormat = "0.0%";
report.getRange(`AU6:AV${5 + catalog.length}`).format.numberFormat = "0.0";
report.getRange(`AW6:AX${5 + catalog.length}`).format.numberFormat = "0.000";
report.getRange(`AT6:AT${5 + catalog.length}`).conditionalFormats.addCustom(`=AT6="A"`, { fill: colors.aFill, font: { color: colors.green, bold: true } });
report.getRange(`AT6:AT${5 + catalog.length}`).conditionalFormats.addCustom(`=AT6="B"`, { fill: colors.greenFill, font: { color: colors.green, bold: true } });
report.getRange(`AT6:AT${5 + catalog.length}`).conditionalFormats.addCustom(`=AT6="C"`, { fill: colors.yellowFill, font: { color: colors.orange, bold: true } });
report.getRange(`AT6:AT${5 + catalog.length}`).conditionalFormats.addCustom(`=AT6="D"`, { fill: colors.orangeFill, font: { color: colors.orange, bold: true } });
report.getRange(`AT6:AT${5 + catalog.length}`).conditionalFormats.addCustom(`=AT6="F"`, { fill: colors.redFill, font: { color: colors.red, bold: true } });
report.freezePanes.freezeRows(5); report.freezePanes.freezeColumns(4);

// Summary dashboard.
titleBand(summary, "A1:R2", "Personal AI Capability — Four-Year Report Card", "A3:R3", "A confidence-weighted view of economic stewardship, operational execution, personal transfer, and economic value/governance. As of 2026-08-26.");
sectionBand(summary, "A5:C5", "CURRENT SCORE"); sectionBand(summary, "D5:F5", "CURRENT LETTER"); sectionBand(summary, "G5:I5", "2028-Q4 SCORE", colors.gold); sectionBand(summary, "J5:L5", "METR H50 ACCELERATION / QTR²"); sectionBand(summary, "M5:O5", "METR H80 GUARDRAIL / QTR²"); sectionBand(summary, "P5:R5", "OVERALL CONFIDENCE");
summary.getRange("A6:C9").merge(); summary.getRange("D6:F9").merge(); summary.getRange("G6:I9").merge(); summary.getRange("J6:L9").merge(); summary.getRange("M6:O9").merge(); summary.getRange("P6:R9").merge();
summary.getRange("A6").formulas = [["=D17"]];
summary.getRange("D6").formulas = [["=IF(A6>='Methodology'!$G$7,\"A\",IF(A6>='Methodology'!$G$8,\"B\",IF(A6>='Methodology'!$G$9,\"C\",IF(A6>='Methodology'!$G$10,\"D\",\"F\"))))"]];
summary.getRange("G6").formulas = [["=F17"]];
summary.getRange("J6").formulas = [["=H17"]];
summary.getRange("M6").formulas = [["=I17"]];
summary.getRange("P6").formulas = [["=J17"]];
for (const cell of ["A6", "D6", "G6", "J6", "M6", "P6"]) summary.getRange(cell).format = { fill: colors.white, font: { bold: true, color: colors.navy, size: 24 }, horizontalAlignment: "center", verticalAlignment: "center", borders: { preset: "all", style: "thin", color: colors.line } };
summary.getRange("A6").format.numberFormat = "0.0%"; summary.getRange("G6").format.numberFormat = "0.0%"; summary.getRange("J6").format.numberFormat = "+0.000;-0.000;0.000"; summary.getRange("M6").format.numberFormat = "+0.000;-0.000;0.000";

sectionBand(summary, "A11:K11", "CATEGORY REPORT CARD");
summary.getRange("A12:K12").values = [["Category", "Graded", "Total", "Current score", "GPA", "2028-Q4 score", "Economic gap velocity / qtr", "METR H50 accel. / qtr²", "METR H80 guardrail / qtr²", "Confidence", "Confidence weight"]];
for (let i = 0; i < categories.length; i++) {
  const row = 13 + i;
  summary.getRange(`A${row}`).values = [[categories[i]]];
  summary.getRange(`B${row}`).formulas = [[`=COUNTIFS('Report Card'!$A$6:$A$28,A${row},'Report Card'!$AT$6:$AT$28,"<>N/A")`]];
  summary.getRange(`C${row}`).formulas = [[`=COUNTIF('Report Card'!$A$6:$A$28,A${row})`]];
  summary.getRange(`D${row}`).formulas = [[`=IFERROR(AVERAGEIF('Report Card'!$A$6:$A$28,A${row},'Report Card'!$AS$6:$AS$28),"")`]];
  summary.getRange(`E${row}`).formulas = [[`=IFERROR(AVERAGEIF('Report Card'!$A$6:$A$28,A${row},'Report Card'!$AU$6:$AU$28),"")`]];
  summary.getRange(`F${row}`).formulas = [[`=IFERROR(AVERAGEIF('Report Card'!$A$6:$A$28,A${row},'Report Card'!$AQ$6:$AQ$28),"")`]];
  summary.getRange(`G${row}`).formulas = [[`=IFERROR(AVERAGEIFS('Model'!$N$6:$N$28,'Model'!$C$6:$C$28,A${row},'Model'!$D$6:$D$28,">=2"),"")`]];
  summary.getRange(`K${row}`).formulas = [[`=IFERROR(SUMIF('Model'!$C$6:$C$28,A${row},'Model'!$U$6:$U$28)/(3*C${row}),0)`]];
  summary.getRange(`J${row}`).formulas = [[`=IF(K${row}>=0.8,"High",IF(K${row}>=0.5,"Medium","Low"))`]];
}
summary.getRange("A17:K17").values = [["Overall (confidence-weighted)", null, null, null, null, null, null, null, null, null, null]];
summary.getRange("B17").formulas = [["=SUM(B13:B16)"]]; summary.getRange("C17").formulas = [["=SUM(C13:C16)"]];
summary.getRange("D17").formulas = [["=IFERROR(SUMPRODUCT(D13:D16,K13:K16)/SUM(K13:K16),\"\")"]]; summary.getRange("E17").formulas = [["=IFERROR(SUMPRODUCT(E13:E16,K13:K16)/SUM(K13:K16),\"\")"]]; summary.getRange("F17").formulas = [["=IFERROR(SUMPRODUCT(F13:F16,K13:K16)/SUM(K13:K16),\"\")"]];
summary.getRange("G17").formulas = [["=IFERROR(SUMPRODUCT(G13:G16,K13:K16)/SUM(K13:K16),\"\")"]];
summary.getRange("H17").formulas = [["='METR Horizon'!$O$15"]];
summary.getRange("I17").formulas = [["='METR Horizon'!$O$18"]];
summary.getRange("K17").formulas = [["=IFERROR(SUMPRODUCT(K13:K16,C13:C16)/SUM(C13:C16),0)"]]; summary.getRange("J17").formulas = [["=IF(K17>=0.8,\"High\",IF(K17>=0.5,\"Medium\",\"Low\"))"]];
styleHeader(summary.getRange("A12:K12")); styleBody(summary.getRange("A13:K17")); summary.getRange("A17:K17").format.fill = colors.lightTeal; summary.getRange("A17:K17").format.font = { bold: true, color: colors.ink };
summary.getRange("D13:D17").format.numberFormat = "0.0%"; summary.getRange("E13:E17").format.numberFormat = "0.00"; summary.getRange("F13:F17").format.numberFormat = "0.0%"; summary.getRange("G13:I17").format.numberFormat = "+0.000;-0.000;0.000"; summary.getRange("K13:K17").format.numberFormat = "0%";
summary.getRange("J13:J17").conditionalFormats.addCustom(`=J13="High"`, { fill: colors.greenFill, font: { color: colors.green, bold: true } });
summary.getRange("J13:J17").conditionalFormats.addCustom(`=J13="Medium"`, { fill: colors.yellowFill, font: { color: colors.orange, bold: true } });
summary.getRange("J13:J17").conditionalFormats.addCustom(`=J13="Low"`, { fill: colors.redFill, font: { color: colors.red, bold: true } });

sectionBand(summary, "A20:F20", "QUARTERLY CATEGORY TRAJECTORY");
summary.getRange("A21:F21").values = [["Quarter", ...categories, "Overall"]];
for (let q = 0; q < quarters.length; q++) {
  const row = 22 + q; const scoreCol = colName(5 + q * 2);
  summary.getRange(`A${row}`).values = [[quarters[q].label]];
  for (let c = 0; c < categories.length; c++) summary.getRange(`${colName(2 + c)}${row}`).formulas = [[`=IFERROR(AVERAGEIF('Report Card'!$A$6:$A$28,${colName(2 + c)}$21,'Report Card'!$${scoreCol}$6:$${scoreCol}$28),"")`]];
  summary.getRange(`F${row}`).formulas = [[`=IFERROR((IF(B${row}="",0,B${row}*$K$13)+IF(C${row}="",0,C${row}*$K$14)+IF(D${row}="",0,D${row}*$K$15)+IF(E${row}="",0,E${row}*$K$16))/(IF(B${row}="",0,$K$13)+IF(C${row}="",0,$K$14)+IF(D${row}="",0,$K$15)+IF(E${row}="",0,$K$16)),"")`]];
}
styleHeader(summary.getRange("A21:F21")); styleBody(summary.getRange("A22:F41")); summary.getRange("B22:F41").format.numberFormat = "0%";
const chart = summary.charts.add("line", summary.getRange("A21:F41"));
chart.title = "Capability saturation by category"; chart.hasLegend = true; chart.xAxis = { axisType: "textAxis", textStyle: { fontSize: 8 } }; chart.yAxis = { numberFormatCode: "0%", min: 0, max: 1 }; chart.setPosition("M11", "R29");

summary.getRange("H31:R42").values = [
  ["LEGEND / READING RULE", null, null, null, null, null, null, null, null, null, null],
  ["Observed", "Blue cells are sourced release-quarter frontiers.", null, null, null, null, null, null, null, null, null],
  ["Carried", "Gray cells hold the last observed frontier between releases.", null, null, null, null, null, null, null, null, null],
  ["Projected", "Gold cells extrapolate economic failure-gap velocity under METR-derived acceleration feedback.", null, null, null, null, null, null, null, null, null],
  ["Δ score", "Quarter-over-quarter percentage-point change in the normalized benchmark score; this is not acceleration.", null, null, null, null, null, null, null, null, null],
  ["Economic gap velocity", "Failure-gap halvings per quarter from economic-work benchmarks with at least two observations. This anchors the initial economic progress rate.", null, null, null, null, null, null, null, null, null],
  ["METR H50 acceleration", "Task-horizon doublings per quarter². This real rate, not a multiplier, determines how quickly capability velocity compounds.", null, null, null, null, null, null, null, null, null],
  ["METR H80 guardrail", "Higher-reliability task-horizon acceleration. The slower positive relative acceleration controls; H80 currently confirms rather than constrains H50.", null, null, null, null, null, null, null, null, null],
  ["Transfer coefficient", "Economic gap velocity divided by H50 horizon velocity. It preserves the economic data's current rate while importing METR's relative acceleration.", null, null, null, null, null, null, null, null, null],
  ["Confidence", "Evidence coverage and longitudinal depth: one credit per distinct quarterly observation, capped at three per benchmark. Category weight = credits ÷ maximum credits. High ≥80%; Medium ≥50%; Low <50%.", null, null, null, null, null, null, null, null, null],
  ["Direct stewardship", "Low confidence: all 7 sources are graded, but 4 newly normalized series and EnterpriseArena each have one observation. Only Vending-Bench has three release-quarter observations.", null, null, null, null, null, null, null, null, null],
  ["Caution", "The composite uses continuous confidence weights. The METR-to-economic transfer and quadratic acceleration fit are conjectural and low-confidence; the workbook exposes both as refutation targets.", null, null, null, null, null, null, null, null, null],
];
summary.getRange("H31:R31").merge();
for (let r = 32; r <= 42; r++) summary.getRange(`I${r}:R${r}`).merge();
styleHeader(summary.getRange("H31:R31")); styleBody(summary.getRange("H32:R42"));
summary.getRange("H32").format.fill = colors.actual; summary.getRange("H33").format.fill = colors.carry; summary.getRange("H34").format.fill = colors.lightGold;
summary.freezePanes.freezeRows(3);

// Re-enter the category-balanced overall GPA after all benchmark GPA formulas exist.
for (let i = 0; i < catalog.length; i++) {
  const row = 6 + i;
  report.getRange(`AV${row}`).formulas = [[overallGpaFormula]];
}

// Layout.
const widths = {
  Summary: [30, 13, 11, 16, 10, 16, 16, 18, 16, 14, 17, 4, 15, 15, 15, 15, 15, 15],
  "Report Card": [30, 12, 24, 42, ...Array(40).fill(9), 13, 9, 9, 12, 15, 17, 38],
  Observations: [12, 25, 30, 14, 11, 12, 12, 28, 34, 48, 45],
  Catalog: [12, 30, 25, 43, 44, 12, 15, 48, 48],
  Model: [12, 25, 30, 10, 10, 10, 10, 12, 12, 12, 12, 12, 12, 14, 14, 14, 38, 13, 9, 9, 14],
  "METR Horizon": [10, 24, 14, 16, 13, 18, 16, 12, 28, 44, 46, 18, 3, 26, 14, 18, 17, 17, 17, 16, 12, 15, 30, 12, 12],
  Methodology: [24, 34, 20, 44, 3, 16, 17, 16, 16, 16],
};
for (const sheet of [summary, report, obs, cat, model, metr, method]) {
  const w = widths[sheet.name];
  for (let i = 0; i < w.length; i++) sheet.getRangeByIndexes(0, i, 200, 1).format.columnWidth = w[i];
  sheet.getRange("1:1").format.rowHeight = 28; sheet.getRange("2:2").format.rowHeight = 28; sheet.getRange("3:3").format.rowHeight = 30;
  sheet.getUsedRange().format.autofitRows();
}
report.getRange("4:5").format.rowHeight = 32; report.getRange(`6:${5 + catalog.length}`).format.rowHeight = 46;
obs.getRange("5:5").format.rowHeight = 38; cat.getRange("5:5").format.rowHeight = 38; model.getRange("5:5").format.rowHeight = 42;
metr.getRange("5:5").format.rowHeight = 42; metr.getRange("11:11").format.rowHeight = 38; metr.getRange("22:27").format.rowHeight = 38;
method.getRange("16:22").format.rowHeight = 38; method.getRange("25:30").format.rowHeight = 38; method.getRange("33:41").format.rowHeight = 34; method.getRange("44:48").format.rowHeight = 34;

// Verification previews, formula inspection, error scan, and export.
await fs.mkdir(previewDir, { recursive: true });
const previews = [
  ["Summary", "A1:R42", "summary.png", 1],
  ["Report Card", "A1:Q28", "report-card-left.png", 0.9],
  ["Report Card", "AQ1:AY28", "report-card-current.png", 1],
  ["Observations", `A1:K${Math.min(5 + obsRows.length, 42)}`, "observations.png", 0.85],
  ["Catalog", `A1:I${5 + catalog.length}`, "catalog.png", 0.85],
  ["Model", `A1:U${5 + catalog.length}`, "model.png", 0.75],
  ["METR Horizon", "A1:Y27", "metr-horizon.png", 0.75],
  ["Methodology", "A1:J48", "methodology.png", 0.9],
];
for (const [sheetName, range, fileName, scale] of previews) {
  const image = await workbook.render({ sheetName, range, autoCrop: "all", scale, format: "png" });
  await fs.writeFile(`${previewDir}/${fileName}`, new Uint8Array(await image.arrayBuffer()));
}
const overview = await workbook.inspect({ kind: "workbook,sheet,table", maxChars: 8000, tableMaxRows: 3, tableMaxCols: 7, tableMaxCellChars: 90 });
console.log(overview.ndjson ?? overview);
const formulaCheck = await workbook.inspect({ kind: "formula", sheetId: "Summary", range: "A1:R42", maxChars: 8000, options: { maxResults: 120 } });
console.log(formulaCheck.ndjson ?? formulaCheck);
const errorCheck = await workbook.inspect({ kind: "match", searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A", options: { useRegex: true, maxResults: 200 }, maxChars: 7000 });
console.log(errorCheck.ndjson ?? errorCheck);
const inspectTargets = [
  ["Summary", "A1:R42"],
  ["Report Card", "A1:AY28"],
  ["Observations", `A1:K${5 + obsRows.length}`],
  ["Catalog", `A1:I${5 + catalog.length}`],
  ["Model", `A1:U${5 + catalog.length}`],
  ["METR Horizon", "A1:Y27"],
  ["Methodology", "A1:J48"],
];
const inspectChunks = [];
for (const [sheetId, range] of inspectTargets) {
  const inspection = await workbook.inspect({ kind: "table", sheetId, range, include: "values,formulas", tableMaxRows: 500, tableMaxCols: 80, tableMaxCellChars: 500, maxChars: 2_000_000 });
  inspectChunks.push(inspection.ndjson ?? String(inspection));
}
await fs.writeFile(inspectPath, `${inspectChunks.join("\n")}\n`, "utf8");
await fs.mkdir(outputDir, { recursive: true });
const xlsx = await SpreadsheetFile.exportXlsx(workbook);
await xlsx.save(outputPath);
console.log(`SAVED ${outputPath}`);
