import path from "node:path";
import { fileURLToPath } from "node:url";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const workbookPath = path.resolve(scriptDir, "../../../data/reports/personal-ai-four-year-capability-report-card.xlsx");
const input = await FileBlob.load(workbookPath);
const workbook = await SpreadsheetFile.importXlsx(input);
for (const [sheetId, range] of [["Summary", "A5:O17"], ["Report Card", "AQ4:AY28"], ["Model", "A5:T28"]]) {
  const result = await workbook.inspect({ kind: "table", sheetId, range, include: "values,formulas", tableMaxRows: 30, tableMaxCols: 20, maxChars: 16000 });
  console.log(result.ndjson ?? result);
}
const errors = await workbook.inspect({ kind: "match", searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A", options: { useRegex: true, maxResults: 200 }, maxChars: 8000 });
console.log(errors.ndjson ?? errors);
