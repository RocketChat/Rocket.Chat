import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { readPackageJson } from './utils.js';

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

export async function getNodeNpmVersions(cwd: string) {
	const { engines } = await readPackageJson(cwd);
	if (!engines) {
		throw new Error(`${cwd}/package.json has no engines field`);
	}

	return engines;
}

export async function getAppsEngineVersion(cwd: string) {
	try {
		const result = await readPackageJson(path.join(cwd, 'packages/apps-engine'));

		return result.version ?? 'Not Available';
	} catch (e) {
		console.error(e);
	}
}
