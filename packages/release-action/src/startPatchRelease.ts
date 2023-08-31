import * as core from '@actions/core';
import * as github from '@actions/github';
import semver from 'semver';

import { checkoutBranch, commitChanges, createBranch, pushNewBranch } from './gitUtils';
import { setupOctokit } from './setupOctokit';
import { createBumpFile, readPackageJson } from './utils';

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

	await checkoutBranch(baseRef);

	// get version from main package
	const { version, name: mainPkgName } = await readPackageJson(mainPackagePath);

	const newVersion = semver.inc(version, 'patch');
	if (!newVersion) {
		throw new Error(`Could not increment version ${version}`);
	}

	const newBranch = `release-${newVersion}`;

	// TODO check if branch exists
	await createBranch(newBranch);

	// by creating a changeset we make sure we'll always bump the version
	core.info('create a changeset for main package');
	await createBumpFile(cwd, mainPkgName);

	await commitChanges(`Bump ${newVersion}`);

	await pushNewBranch(newBranch);

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
