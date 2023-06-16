import path from 'path';

import semver from 'semver';
import { exec } from '@actions/exec';
import * as github from '@actions/github';
import * as core from '@actions/core';

import { setupOctokit } from './setupOctokit';
import { updateVersionPackageJson } from './utils';

export async function startPatchRelease({
	githubToken,
	baseRef,
	mainPackagePath,
	cwd = process.cwd(),
}: {
	baseRef: string;
	mainPackagePath: string;
	githubToken: string;
	cwd?: string;
}) {
	const octokit = setupOctokit(githubToken);

	await exec('git', ['checkout', baseRef]);

	// get version from main package
	const mainPackageJsonPath = path.join(mainPackagePath, 'package.json');
	// eslint-disable-next-line import/no-dynamic-require, @typescript-eslint/no-var-requires
	const { version } = require(mainPackageJsonPath);

	const newVersion = semver.inc(version, 'patch');
	if (!newVersion) {
		throw new Error(`Could not increment version ${version}`);
	}

	const newBranch = `release-${newVersion}`;

	// TODO check if branch exists
	await exec('git', ['checkout', '-b', newBranch]);

	core.info('bump main package.json version');
	updateVersionPackageJson(cwd, newVersion);

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
