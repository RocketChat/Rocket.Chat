import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import * as tar from 'tar';

/**
 * Build a throwaway app-package `.tgz` from a CJS bundle string, laid out like an npm tarball
 * (everything under `package/`). Returns the tarball path. Used only by the acceptance test to
 * stand in for the separate bundler tool (0005 §5).
 */
export async function makeAppTgz(bundleCode: string, name = 'fixture-app'): Promise<string> {
	const dir = await mkdtemp(path.join(tmpdir(), 'rcapp-fixture-'));
	const pkgRoot = path.join(dir, 'package');
	await mkdir(pkgRoot, { recursive: true });

	await writeFile(
		path.join(pkgRoot, 'package.json'),
		JSON.stringify({ name, version: '0.0.0', main: 'index.js' }, null, 2),
	);
	await writeFile(path.join(pkgRoot, 'index.js'), bundleCode);

	const tgzPath = path.join(dir, `${name}.tgz`);
	await tar.c({ file: tgzPath, cwd: dir, gzip: true }, ['package']);
	return tgzPath;
}
