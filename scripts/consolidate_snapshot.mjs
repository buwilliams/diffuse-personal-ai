import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { listSnapshotDirectories } from './lib/snapshots.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataRoot = path.join(projectRoot, 'data');

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

async function selectedSnapshotDirectory() {
  const requested = process.argv[2];
  if (requested) return path.resolve(projectRoot, requested);
  const snapshots = await listSnapshotDirectories(dataRoot);
  if (!snapshots.length) throw new Error('No snapshot-YYYYMMDD directories found');
  return snapshots.at(-1).path;
}

const snapshotDirectory = await selectedSnapshotDirectory();
const manifest = await readJson(path.join(snapshotDirectory, 'database.json'));

for (const gate of manifest.data.gates ?? []) {
  const sourceDirectory = path.join(snapshotDirectory, gate.sourceDirectory);
  const sourceNames = (await fs.readdir(sourceDirectory))
    .filter((name) => name.endsWith('-data.json'))
    .sort();
  const sourceFiles = [];
  const fragments = [];

  for (const name of sourceNames) {
    const envelope = await readJson(path.join(sourceDirectory, name));
    const source = envelope.metadata.sources?.[0];
    if (!source || envelope.metadata.sources.length !== 1) {
      throw new Error(`${gate.sourceDirectory}/${name} must describe exactly one source`);
    }
    const sourcePath = `${gate.sourceDirectory}/${name}`;
    const recordCount = (envelope.data.fragments ?? []).reduce(
      (sum, fragment) => sum + (fragment.kind === 'records' ? fragment.items.length : 1),
      0,
    );
    sourceFiles.push({
      id: envelope.metadata.id,
      file: sourcePath,
      publisher: source.publisher,
      title: source.title,
      url: source.url,
      accessedAt: source.accessedAt,
      roles: source.roles,
      notes: source.notes,
      datasetIds: [...new Set((envelope.data.fragments ?? []).map((fragment) => fragment.datasetId))].sort(),
      recordCount,
    });
    fragments.push(...(envelope.data.fragments ?? []).map((fragment) => ({ ...fragment, source })));
  }

  const datasets = {};
  for (const descriptor of manifest.data.datasets.filter((dataset) => dataset.gateId === gate.id)) {
    const datasetFragments = fragments.filter((fragment) => fragment.datasetId === descriptor.id);
    const sourceMap = new Map(datasetFragments.map((fragment) => [fragment.source.id, fragment.source]));
    const data = {};

    for (const collection of descriptor.collections) {
      const matching = datasetFragments.filter((fragment) => fragment.collection === collection);
      const recordFragments = matching.filter((fragment) => fragment.kind === 'records');
      const valueFragments = matching.filter((fragment) => fragment.kind === 'value');
      if (recordFragments.length && valueFragments.length) {
        throw new Error(`${descriptor.id}.${collection} mixes record and value fragments`);
      }
      if (recordFragments.length) {
        data[collection] = recordFragments
          .flatMap((fragment) => fragment.items)
          .sort((a, b) => a.order - b.order)
          .map((item) => item.record);
      } else if (valueFragments.length === 1) {
        data[collection] = valueFragments[0].value;
      } else if (valueFragments.length > 1) {
        throw new Error(`${descriptor.id}.${collection} has multiple value fragments`);
      } else {
        throw new Error(`${descriptor.id}.${collection} has no source fragment`);
      }
    }

    datasets[descriptor.id] = {
      metadata: {
        id: descriptor.id,
        title: descriptor.title,
        description: descriptor.description,
        schemaVersion: manifest.metadata.schemaVersion,
        snapshotDate: manifest.metadata.snapshotDate,
        asOfDate: descriptor.asOfDate,
        sources: [...sourceMap.values()].sort((a, b) => a.id.localeCompare(b.id)),
        update: descriptor.update,
      },
      data,
    };
  }

  const consolidated = {
    metadata: {
      id: `${gate.id}-consolidated`,
      title: gate.title,
      description: gate.description,
      schemaVersion: manifest.metadata.schemaVersion,
      snapshotDate: manifest.metadata.snapshotDate,
      asOfDate: manifest.metadata.asOfDate,
      sources: sourceFiles.map(({ id, publisher, title, url, accessedAt, roles, notes }) => ({
        id, publisher, title, url, accessedAt, roles, notes,
      })),
      update: {
        method: 'deterministic consolidation of source-first JSON files',
        notes: `Run scripts/consolidate_snapshot.mjs after changing files in ${gate.sourceDirectory}.`,
      },
    },
    data: {
      gate: {
        id: gate.id,
        label: gate.label,
        sourceDirectory: gate.sourceDirectory,
      },
      sourceFiles,
      datasets,
    },
  };

  await fs.writeFile(
    path.join(snapshotDirectory, gate.consolidatedFile),
    `${JSON.stringify(consolidated, null, 2)}\n`,
    'utf8',
  );
  console.log(`${gate.consolidatedFile}: ${sourceFiles.length} sources, ${Object.keys(datasets).length} datasets`);
}
