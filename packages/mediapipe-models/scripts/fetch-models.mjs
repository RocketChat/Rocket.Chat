import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Fills `models/` from the pinned manifest so the files ship in the npm tarball without living in git.

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { models } = JSON.parse(await readFile(path.join(root, 'manifest.json'), 'utf8'));
const modelsDir = path.join(root, 'models');

const sha256 = (data) => createHash('sha256').update(data).digest('hex');

await mkdir(modelsDir, { recursive: true });

for (const { file, url, sha256: expected } of models) {
	const target = path.join(modelsDir, file);

	const existing = await readFile(target).catch(() => undefined);
	if (existing && sha256(existing) === expected) {
		continue;
	}

	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Failed to download ${file}: HTTP ${response.status}`);
	}

	const data = Buffer.from(await response.arrayBuffer());
	const actual = sha256(data);
	if (actual !== expected) {
		throw new Error(`Checksum mismatch for ${file}: expected ${expected}, got ${actual}`);
	}

	// Written aside and renamed, so an interrupted download never leaves a truncated model behind.
	await writeFile(`${target}.tmp`, data);
	await rename(`${target}.tmp`, target);
	console.log(`Downloaded ${file}`);
}
