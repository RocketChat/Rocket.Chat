import { readFile } from 'fs/promises';
import path from 'path';

import { readPackageJson } from './utils';

export async function getMongoVersion(cwd: string) {
	try {
		const workflows = await readFile(path.join(cwd, '.github/workflows/ci.yml'), 'utf8');

		const mongoMatch = workflows.match(/compatibleMongoVersions\\": \[([^\]]+)\]/);
		if (!mongoMatch) {
			return [];
		}

		return mongoMatch[1].replace(/["'\\ ]/g, '').split(',');
	} catch (e) {
		console.error(e);
	}
	return [];
}

export async function getNodeNpmVersions(cwd: string): Promise<{ node: string; yarn: string; npm: string }> {
	const packageJson = await readPackageJson(cwd);

	return packageJson.engines;
}

export async function getAppsEngineVersion(cwd: string) {
	try {
		const result = await readPackageJson(path.join(cwd, 'packages/apps-engine'));

		return result.version ?? 'Not Available';
	} catch (e) {
		console.error(e);
	}
}
