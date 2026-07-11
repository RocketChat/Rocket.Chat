import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import * as tar from 'tar';

export interface LoadedBundle {
	/** The entry bundle's source text. */
	code: string;
	/** A label for `node:vm` (used as the script's filename; not a live path after cleanup). */
	filename: string;
}

/**
 * Read an app package `.tgz` from disk, extract it, and return the entry bundle's source (decision
 * 0005 §5). An npm tarball roots everything under `package/`; we read `package/package.json`'s
 * `main` to find the entry. The temp dir is removed once the source is in memory.
 */
export async function loadBundleFromTgz(tgzPath: string): Promise<LoadedBundle> {
	const dir = await mkdtemp(path.join(tmpdir(), 'rcapp-'));
	try {
		await tar.x({ file: tgzPath, cwd: dir });

		const pkgRoot = path.join(dir, 'package');
		const manifest = JSON.parse(await readFile(path.join(pkgRoot, 'package.json'), 'utf8')) as { main?: string };
		const main = manifest.main ?? 'index.js';
		const entry = path.join(pkgRoot, main);

		const code = await readFile(entry, 'utf8');
		return { code, filename: entry };
	} finally {
		await rm(dir, { recursive: true, force: true });
	}
}
