import * as core from '@actions/core';
import { GitHub, getOctokitOptions } from '@actions/github/lib/utils';
import { throttling } from '@octokit/plugin-throttling';

export const setupOctokit = (githubToken: string) => {
	// @actions/github and @octokit/plugin-throttling bundle separate @octokit/core
	// type trees; TS7 no longer treats the two plugin signatures as compatible.
	return new (GitHub.plugin(throttling as unknown as Parameters<typeof GitHub.plugin>[0]))(
		getOctokitOptions(githubToken, {
			throttle: {
				onRateLimit: (retryAfter: number, options: object, _octokit: unknown, retryCount: number) => {
					core.warning(`Request quota exhausted for request ${(options as any).method} ${(options as any).url}`);

					if (retryCount <= 2) {
						core.info(`Retrying after ${retryAfter} seconds!`);
						return true;
					}
				},
				onSecondaryRateLimit: (retryAfter: number, options: object, _octokit: unknown, retryCount: number) => {
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
