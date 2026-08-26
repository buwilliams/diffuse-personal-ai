import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadLatestSnapshot } from './lib/snapshots.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, '..');
const snapshot = await loadLatestSnapshot(path.join(projectRoot, 'data'));
const outputDirectory = path.join(projectRoot, 'surfaces', 'website', 'app', 'generated');
const outputPath = path.join(outputDirectory, 'latest-snapshot.json');

await fs.mkdir(outputDirectory, { recursive: true });
await fs.writeFile(outputPath, `${JSON.stringify({
  id: snapshot.id,
  manifest: snapshot.manifest,
  gates: Object.fromEntries(Object.entries(snapshot.gates).map(([id, gate]) => [id, {
    metadata: gate.metadata,
    data: {
      gate: gate.data.gate,
      sourceFiles: gate.data.sourceFiles,
    },
  }])),
  datasets: snapshot.datasets,
}, null, 2)}\n`, 'utf8');

console.log(`Selected snapshot-${snapshot.id} for the website build.`);
