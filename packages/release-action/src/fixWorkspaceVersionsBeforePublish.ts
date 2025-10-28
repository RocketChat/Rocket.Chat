// Changesets doesn't currently support workspace versions:
// https://github.com/changesets/changesets/issues/432
// https://github.com/changesets/action/issues/246
// To work around that, we'll manually resolve any `workspace:` version ranges
// with this tool prior to publishing. If/when changesets adds native support for
// publishing with Yarn 3, we can remove this script.
//
// We'll only support the `workspace:^` range, which is the only one we
// generally want to use.

import fs from 'node:fs/promises';
import path from 'node:path';

import { getExecOutput } from '@actions/exec';

import { readPackageJson } from './utils';

const DEPENDENCY_TYPES = ['dependencies', 'devDependencies', 'peerDependencies'];

export async function fixWorkspaceVersionsBeforePublish() {
	const rawWorkspaces = await getExecOutput('yarn workspaces list --json');
	const workspaces = rawWorkspaces.stdout
		.trim()
		.split('\n')
		.map((line) => JSON.parse(line))
		.filter((workspace) => workspace.location !== '.');

	// Get the version of each workspace package.
	const workspaceVersions = new Map();
	for await (const workspace of workspaces) {
		const packageJson = await readPackageJson(workspace.location);
		workspaceVersions.set(workspace.name, packageJson.version);
	}

	// Replace any `workspace:^` version ranges with the actual version.
	for await (const workspace of workspaces) {
		const packageJson = await readPackageJson(workspace.location);

		for (const dependencyType of DEPENDENCY_TYPES) {
			const dependencies = Object.keys(packageJson[dependencyType] ?? {});
			for (const dependency of dependencies) {
				const dependencyVersion = packageJson[dependencyType][dependency];
				if (dependencyVersion.startsWith('workspace:')) {
					const realVersion = workspaceVersions.get(dependency);
					if (!realVersion) {
						throw new Error(`Could not find version for workspace ${dependency}`);
					}

					const semver = dependencyVersion.slice('workspace:'.length);

					if (semver === '*') {
						packageJson[dependencyType][dependency] = `=${realVersion}`;
					} else if (semver === '^') {
						packageJson[dependencyType][dependency] = `^${realVersion}`;
					} else if (semver === '~') {
						packageJson[dependencyType][dependency] = `~${realVersion}`;
					} else {
						packageJson[dependencyType][dependency] = semver;
					}
				}
			}
		}

		await fs.writeFile(path.join(workspace.location, 'package.json'), `${JSON.stringify(packageJson, null, 2)}\n`);
	}
}
