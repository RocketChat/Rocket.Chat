import fs from 'fs';
import path from 'path';

import { exec } from '@actions/exec';
import * as core from '@actions/core';
import * as github from '@actions/github';

import { setupOctokit } from './setupOctokit';
import { createNpmFile } from './createNpmFile';
import { getChangelogEntry, updateVersionPackageJson } from './utils';
import { fixWorkspaceVersionsBeforePublish } from './fixWorkspaceVersionsBeforePublish';

export async function bumpNextVersion({
	githubToken,
	mainPackagePath,
	cwd = process.cwd(),
}: {
	githubToken: string;
	mainPackagePath: string;
	cwd?: string;
}) {
	const octokit = setupOctokit(githubToken);

	// TODO do this only if publishing to npm
	await createNpmFile();

	// TODO need to check if there is any change to 'main package', if not, there is no need to enter rc
	// and instead a normal release of the other packages should be done

	// start release candidate
	await exec('yarn', ['changeset', 'pre', 'enter', 'rc']);

	// bump version of all packages to rc
	await exec('yarn', ['changeset', 'version']);

	// get version from main package
	const mainPackageJsonPath = path.join(mainPackagePath, 'package.json');
	// eslint-disable-next-line import/no-dynamic-require, @typescript-eslint/no-var-requires
	const { version: newVersion } = require(mainPackageJsonPath);

	const mainPackageChangelog = path.join(mainPackagePath, 'CHANGELOG.md');

	const changelogContents = fs.readFileSync(mainPackageChangelog, 'utf8');
	const changelogEntry = getChangelogEntry(changelogContents, newVersion);
	if (!changelogEntry) {
		// we can find a changelog but not the entry for this version
		// if this is true, something has probably gone wrong
		throw new Error('Could not find changelog entry for version newVersion');
	}

	const prBody = changelogEntry.content;

	const finalVersion = newVersion.split('-')[0];

	const newBranch = `release-${finalVersion}`;

	// update root package.json
	updateVersionPackageJson(cwd, newVersion);

	// TODO check if branch exists
	await exec('git', ['checkout', '-b', newBranch]);

	await exec('git', ['add', '.']);
	await exec('git', ['commit', '-m', newVersion]);

	await fixWorkspaceVersionsBeforePublish();

	await exec('yarn', ['changeset', 'publish']);

	await exec('git', ['push', '--force', '--follow-tags', 'origin', `HEAD:refs/heads/${newBranch}`]);

	if (newVersion.includes('rc.0')) {
		const finalPrTitle = `Release ${finalVersion}`;

		core.info('creating pull request');
		await octokit.rest.pulls.create({
			base: 'master',
			head: newBranch,
			title: finalPrTitle,
			body: prBody,
			...github.context.repo,
		});
	}

	await octokit.rest.repos.createRelease({
		name: newVersion,
		tag_name: newVersion,
		body: prBody,
		prerelease: newVersion.includes('-'),
		...github.context.repo,
	});
}
