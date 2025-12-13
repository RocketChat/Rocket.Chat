import * as core from '@actions/core';
import * as github from '@actions/github';

import { setupOctokit } from './setupOctokit';

export async function updateReleaseToFinal({ githubToken, releaseTag }: { githubToken: string; releaseTag: string }) {
	const octokit = setupOctokit(githubToken);

	const release = await octokit.rest.repos.getReleaseByTag({
		...github.context.repo,
		tag: releaseTag,
	});

	const {
		data: { id: releaseId, draft },
	} = release;

	if (!releaseId) {
		core.warning(`Release with tag ${releaseTag} not found.`);
		return;
	}

	if (!draft) {
		core.info(`Release with tag ${releaseTag} is already final.`);
		return;
	}

	await octokit.rest.repos.updateRelease({
		...github.context.repo,
		release_id: releaseId,
		draft: false,
	});
}
