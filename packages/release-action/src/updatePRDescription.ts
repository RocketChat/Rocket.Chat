import fs from 'fs';
import path from 'path';

import * as core from '@actions/core';
import { exec } from '@actions/exec';
import * as github from '@actions/github';

import { setupOctokit } from './setupOctokit';
import { getChangelogEntry, getEngineVersionsMd, readPackageJson } from './utils';

export async function updatePRDescription({
	githubToken,
	mainPackagePath,
	cwd = process.cwd(),
}: {
	githubToken: string;
	mainPackagePath: string;
	cwd?: string;
}) {
	const octokit = setupOctokit(githubToken);

	// generate change logs from changesets
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

	core.info('get PR description');
	const result = await octokit.rest.pulls.get({
		pull_number: github.context.issue.number,
		body: releaseBody,
		...github.context.repo,
	});

	const { body: originalBody = '' } = result.data;

	const cleanBody = originalBody?.replace(/<!-- release-notes-start -->.*<!-- release-notes-end -->/s, '').trim() || '';

	const bodyUpdated = `${cleanBody}

<!-- release-notes-start -->
<!-- This content is automatically generated. Changing this will not reflect on the final release log -->

_You can see below a preview of the release change log:_

# ${newVersion}

${releaseBody}
<!-- release-notes-end -->`;

	if (bodyUpdated === originalBody) {
		core.info('no changes to PR description');
		return;
	}

	core.info('update PR description');
	await octokit.rest.pulls.update({
		owner: github.context.repo.owner,
		repo: github.context.repo.repo,
		pull_number: github.context.issue.number,
		body: bodyUpdated,
	});
}
