import fs from 'fs';
import path from 'path';

import * as core from '@actions/core';

import { bumpNextVersion } from './bumpNextVersion';
import { setupGitUser } from './gitUtils';
import { publishRelease } from './publishRelease';
import { startPatchRelease } from './startPatchRelease';

// const getOptionalInput = (name: string) => core.getInput(name) || undefined;

(async () => {
	const githubToken = process.env.GITHUB_TOKEN;
	if (!githubToken) {
		core.setFailed('Please add the GITHUB_TOKEN to the changesets action');
		return;
	}

	// const inputCwd = core.getInput('cwd');
	// if (inputCwd) {
	// 	core.info('changing directory to the one given as the input');
	// 	process.chdir(inputCwd);
	// }

	core.info('setting git user');
	await setupGitUser();

	core.info('setting GitHub credentials');
	fs.writeFileSync(`${process.env.HOME}/.netrc`, `machine github.com\nlogin github-actions[bot]\npassword ${githubToken}`);

	const action = core.getInput('action');
	const baseRef = core.getInput('base-ref');

	const cwd = process.cwd();

	// TODO this could be configurable
	const mainPackagePath = path.join(cwd, 'apps', 'meteor');

	if (action === 'publish-final') {
		await publishRelease({ githubToken, mergeFinal: true, mainPackagePath });
	} else if (action === 'cut') {
		await publishRelease({ githubToken, baseRef, mainPackagePath });
	} else if (action === 'next') {
		await bumpNextVersion({ githubToken, mainPackagePath });
	} else if (action === 'patch') {
		await startPatchRelease({ baseRef, githubToken, mainPackagePath });
	}
})().catch((err) => {
	core.error(err);
	core.setFailed(err.message);
});
