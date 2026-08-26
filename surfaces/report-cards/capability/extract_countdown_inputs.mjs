import path from "node:path";
import { fileURLToPath } from "node:url";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const file = path.resolve(scriptDir, "../../../data/reports/personal-ai-four-year-capability-report-card.xlsx");
const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(file));
const result = await workbook.inspect({ kind: "table", sheetId: "Summary", range: "A30:F41", include: "values,formulas", tableMaxRows: 20, tableMaxCols: 8, maxChars: 12000 });
console.log(result.ndjson ?? result);
