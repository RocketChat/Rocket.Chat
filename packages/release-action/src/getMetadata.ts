import { readFile } from 'fs/promises';
import path from 'path';

import { getExecOutput } from '@actions/exec';

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

export async function getAppsEngineVersion() {
	try {
		const result = await getExecOutput('yarn why @rocket.chat/apps-engine --json');

		const match = result.stdout.match(/"@rocket\.chat\/meteor@workspace:apps\/meteor".*"@rocket\.chat\/apps\-engine@[^#]+#npm:([^"]+)"/);
		if (match) {
			return match[1];
		}
	} catch (e) {
		console.error(e);
	}
}
