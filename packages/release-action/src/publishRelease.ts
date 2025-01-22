import fs from 'fs';
import path from 'path';

import * as core from '@actions/core';
import { exec } from '@actions/exec';
import * as github from '@actions/github';
import semver from 'semver';

import { createNpmFile } from './createNpmFile';
import { fixWorkspaceVersionsBeforePublish } from './fixWorkspaceVersionsBeforePublish';
import { checkoutBranch, commitChanges, createTag, getCurrentBranch, mergeBranch, pushChanges } from './gitUtils';
import { setupOctokit } from './setupOctokit';
import { bumpFileVersions, createBumpFile, getChangelogEntry, getEngineVersionsMd, isPreRelease, readPackageJson } from './utils';

export async function publishRelease({
	githubToken,
	mainPackagePath,
	mergeFinal = false,
	baseRef,
	cwd = process.cwd(),
}: {
	githubToken: string;
	mainPackagePath: string;
	baseRef?: string;
	mergeFinal?: boolean;
	cwd?: string;
}) {
	const octokit = setupOctokit(githubToken);

	// TODO do this only if publishing to npm
	await createNpmFile();

	if (baseRef) {
		await checkoutBranch(baseRef);
	}

	const { version: currentVersion } = await readPackageJson(cwd);

	if (mergeFinal && isPreRelease(cwd)) {
		// finish release candidate
		await exec('yarn', ['changeset', 'pre', 'exit']);
	}

	const { name: mainPkgName } = await readPackageJson(mainPackagePath);

	// by creating a changeset we make sure we'll always bump the version
	core.info('create a changeset for main package');
	await createBumpFile(cwd, mainPkgName);

	// bump version of all packages
	await exec('yarn', ['changeset', 'version']);

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

	const releaseBody = (await getEngineVersionsMd(cwd)) + changelogEntry.content;

	core.info('update version in all files to new');
	await bumpFileVersions(cwd, currentVersion, newVersion);

	await commitChanges(`Release ${newVersion}\n\n[no ci]`);

	if (mergeFinal) {
		// get current branch name
		const branchName = await getCurrentBranch();

		// merge release changes to master
		await checkoutBranch('master');
		await mergeBranch(branchName);
	}

	core.info('fix dependencies in workspace packages');
	await fixWorkspaceVersionsBeforePublish();

	await exec('yarn', ['changeset', 'publish', '--no-git-tag']);

	await createTag(newVersion);

	await pushChanges();

	const { data: latestRelease } = await octokit.rest.repos.getLatestRelease({
		...github.context.repo,
	});

	core.info(`latest release tag: ${latestRelease.tag_name}`);

	core.info('create release');
	await octokit.rest.repos.createRelease({
		name: newVersion,
		tag_name: newVersion,
		body: releaseBody,
		prerelease: newVersion.includes('-'),
		make_latest: semver.gt(newVersion, latestRelease.tag_name) ? 'true' : 'false',
		...github.context.repo,
	});
}
