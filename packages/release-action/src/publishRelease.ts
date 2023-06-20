import fs from 'fs';
import path from 'path';

import { exec } from '@actions/exec';
import * as github from '@actions/github';
import * as core from '@actions/core';

import { createNpmFile } from './createNpmFile';
import { setupOctokit } from './setupOctokit';
import { bumpFileVersions, getChangelogEntry, readPackageJson } from './utils';
import { fixWorkspaceVersionsBeforePublish } from './fixWorkspaceVersionsBeforePublish';

export async function publishRelease({
	githubToken,
	mainPackagePath,
	exitCandidate = false,
	baseRef,
	cwd = process.cwd(),
}: {
	githubToken: string;
	mainPackagePath: string;
	baseRef?: string;
	exitCandidate?: boolean;
	cwd?: string;
}) {
	const octokit = setupOctokit(githubToken);

	// TODO do this only if publishing to npm
	await createNpmFile();

	if (baseRef) {
		await exec('git', ['checkout', baseRef]);
	}

	const { version: currentVersion } = await readPackageJson(cwd);

	if (exitCandidate) {
		let preRelease = false;
		try {
			fs.accessSync(path.resolve(cwd, '.changeset', 'pre.json'));

			preRelease = true;
		} catch (e) {
			// nothing to do, not a pre release
		}

		if (preRelease) {
			// finish release candidate
			await exec('yarn', ['changeset', 'pre', 'exit']);
		}
	}

	// bump version of all packages
	await exec('yarn', ['changeset', 'version']);

	// TODO if main package has no changes, throw error

	// get version from main package
	const { version: newVersion } = await readPackageJson(mainPackagePath);

	const mainPackageChangelog = path.join(mainPackagePath, 'CHANGELOG.md');

	const changelogContents = fs.readFileSync(mainPackageChangelog, 'utf8');
	const changelogEntry = getChangelogEntry(changelogContents, newVersion);
	if (!changelogEntry) {
		// we can find a changelog but not the entry for this version
		// if this is true, something has probably gone wrong
		throw new Error('Could not find changelog entry for version newVersion');
	}

	const releaseBody = changelogEntry.content;

	core.info('update version in all files to new');
	await bumpFileVersions(cwd, currentVersion, newVersion);

	await exec('git', ['add', '.']);
	await exec('git', ['commit', '-m', `Release ${newVersion}`]);

	core.info('fix dependencies in workspace packages');
	await fixWorkspaceVersionsBeforePublish();

	await exec('yarn', ['changeset', 'publish', '--no-git-tag']);

	await exec('git', ['tag', newVersion]);

	await exec('git', ['push', '--follow-tags']);

	core.info('create release');
	await octokit.rest.repos.createRelease({
		name: newVersion,
		tag_name: newVersion,
		body: releaseBody,
		prerelease: newVersion.includes('-'),
		...github.context.repo,
	});
}
