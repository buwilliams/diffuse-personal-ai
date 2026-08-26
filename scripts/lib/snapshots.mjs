import fs from 'node:fs/promises';
import path from 'node:path';

const SNAPSHOT_PATTERN = /^snapshot-(\d{8})$/;

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

export async function listSnapshotDirectories(dataRoot) {
  const entries = await fs.readdir(dataRoot, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory() && SNAPSHOT_PATTERN.test(entry.name))
    .map((entry) => ({
      name: entry.name,
      id: entry.name.match(SNAPSHOT_PATTERN)[1],
      path: path.join(dataRoot, entry.name),
    }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

export async function loadSnapshot(snapshotDirectory) {
  const manifestPath = path.join(snapshotDirectory, 'database.json');
  const manifest = await readJson(manifestPath);
  if (!manifest?.metadata || !manifest?.data) throw new Error(`Invalid snapshot manifest: ${manifestPath}`);

  const datasets = {};
  for (const descriptor of manifest.data.datasets ?? []) {
    const file = path.join(snapshotDirectory, descriptor.file);
    const dataset = await readJson(file);
    if (!dataset?.metadata || !dataset?.data) throw new Error(`Invalid dataset envelope: ${file}`);
    if (dataset.metadata.id !== descriptor.id) {
      throw new Error(`Dataset id mismatch in ${descriptor.file}: expected ${descriptor.id}, received ${dataset.metadata.id}`);
    }
    datasets[descriptor.id] = dataset;
  }

  return {
    id: path.basename(snapshotDirectory).match(SNAPSHOT_PATTERN)?.[1] ?? null,
    directory: snapshotDirectory,
    manifest,
    datasets,
  };
}

export async function loadLatestSnapshot(dataRoot) {
  const snapshots = await listSnapshotDirectories(dataRoot);
  if (!snapshots.length) throw new Error(`No snapshot-YYYYMMDD directories found under ${dataRoot}`);
  return loadSnapshot(snapshots.at(-1).path);
}

export function snapshotDateFromId(id) {
  return `${id.slice(0, 4)}-${id.slice(4, 6)}-${id.slice(6, 8)}`;
}
