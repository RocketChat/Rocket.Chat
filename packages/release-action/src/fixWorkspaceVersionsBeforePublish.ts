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

import { readPackageJson } from './utils.js';

const DEPENDENCY_TYPES = ['dependencies', 'devDependencies', 'peerDependencies'] as const;

async function listWorkspaces() {
	const rawWorkspaces = await getExecOutput('yarn workspaces list --json');
	return rawWorkspaces.stdout
		.trim()
		.split('\n')
		.map((line) => JSON.parse(line) as { name: string; location: string })
		.filter((workspace) => workspace.location !== '.');
}

// Stops the release before it commits anything when a published package would not install from npm.
export async function assertPublicPackagesInstallable() {
	for (const workspace of await listWorkspaces()) {
		const packageJson = await readPackageJson(workspace.location);
		if (packageJson.private) {
			continue;
		}
		for (const dependencyType of ['dependencies', 'peerDependencies'] as const) {
			for (const [dependency, range] of Object.entries<string>(packageJson[dependencyType] ?? {})) {
				// npm cannot resolve a Yarn `patch:` range.
				if (range.startsWith('patch:')) {
					throw new Error(`${packageJson.name} has a patch: range for ${dependency} in ${dependencyType}; npm cannot install it`);
				}
			}
		}
	}
}

export async function fixWorkspaceVersionsBeforePublish() {
	const workspaces = await listWorkspaces();

	// Get the version of each workspace package.
	const workspaceVersions = new Map<string, string>();
	for (const workspace of workspaces) {
		const packageJson = await readPackageJson(workspace.location);
		workspaceVersions.set(workspace.name, packageJson.version);
	}

	// Replace any `workspace:^` version ranges with the actual version.
	for (const workspace of workspaces) {
		const packageJson = await readPackageJson(workspace.location);

		for (const dependencyType of DEPENDENCY_TYPES) {
			const dependencies = packageJson[dependencyType] ?? {};
			for (const dependency of Object.keys(dependencies)) {
				const dependencyVersion = dependencies[dependency];
				if (dependencyVersion.startsWith('workspace:')) {
					const realVersion = workspaceVersions.get(dependency);
					if (!realVersion) {
						throw new Error(`Could not find version for workspace ${dependency}`);
					}

					const semver = dependencyVersion.slice('workspace:'.length);

					if (semver === '*') {
						dependencies[dependency] = `=${realVersion}`;
					} else if (semver === '^') {
						dependencies[dependency] = `^${realVersion}`;
					} else if (semver === '~') {
						dependencies[dependency] = `~${realVersion}`;
					} else {
						dependencies[dependency] = semver;
					}
				}
			}
		}

		await fs.writeFile(path.join(workspace.location, 'package.json'), `${JSON.stringify(packageJson, null, 2)}\n`);
	}
}
