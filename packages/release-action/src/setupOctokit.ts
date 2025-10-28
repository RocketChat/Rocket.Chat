import * as core from '@actions/core';
import { GitHub, getOctokitOptions } from '@actions/github/lib/utils';
import { throttling } from '@octokit/plugin-throttling';

export const setupOctokit = (githubToken: string) => {
	return new (GitHub.plugin(throttling))(
		getOctokitOptions(githubToken, {
			throttle: {
				onRateLimit: (retryAfter, options, _octokit, retryCount) => {
					core.warning(`Request quota exhausted for request ${(options as any).method} ${(options as any).url}`);

					if (retryCount <= 2) {
						core.info(`Retrying after ${retryAfter} seconds!`);
						return true;
					}
				},
				onSecondaryRateLimit: (retryAfter, options, _octokit, retryCount) => {
					core.warning(`SecondaryRateLimit detected for request ${(options as any).method} ${(options as any).url}`);

					if (retryCount <= 2) {
						core.info(`Retrying after ${retryAfter} seconds!`);
						return true;
					}
				},
			},
		}),
	);
};
