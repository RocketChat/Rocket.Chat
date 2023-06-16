import semver from 'semver';
import { exec } from '@actions/exec';
import * as github from '@actions/github';
import * as core from '@actions/core';

import { setupOctokit } from './setupOctokit';
import { readPackageJson } from './utils';

export async function startPatchRelease({
	githubToken,
	baseRef,
	mainPackagePath,
}: {
	baseRef: string;
	mainPackagePath: string;
	githubToken: string;
	cwd?: string;
}) {
	const octokit = setupOctokit(githubToken);

	await exec('git', ['checkout', baseRef]);

	// get version from main package
	const { version } = await readPackageJson(mainPackagePath);

	const newVersion = semver.inc(version, 'patch');
	if (!newVersion) {
		throw new Error(`Could not increment version ${version}`);
	}

	const newBranch = `release-${newVersion}`;

	// TODO check if branch exists
	await exec('git', ['checkout', '-b', newBranch]);

	// create empty changeset to have something to commit. the changeset file will be removed later in the process
	core.info('create empty changeset');
	await exec('yarn', ['changeset', 'add', '--empty']);

	await exec('git', ['add', '.']);
	await exec('git', ['commit', '-m', newVersion]);

	await exec('git', ['push', 'origin', `HEAD:refs/heads/${newBranch}`]);

	// create a pull request only if the patch is for current version
	if (baseRef === 'master') {
		const finalPrTitle = `Release ${newVersion}`;

		core.info('creating pull request');
		await octokit.rest.pulls.create({
			base: 'master',
			head: newBranch,
			title: finalPrTitle,
			body: '',
			...github.context.repo,
		});
	} else {
		core.info('no pull request created: patch is not for current version');
	}
}
