import type { ChangelogFunctions } from '@changesets/types';

import { getCommitInfo } from './getGitHubInfo';

const changelogFunctions: ChangelogFunctions = {
	getReleaseLine: async (changeset, _type, options) => {
		if (!options?.repo) {
			throw new Error(
				'Please provide a repo to this changelog generator like this:\n"changelog": ["@rocket.chat/release-changelog", { "repo": "org/repo" }]',
			);
		}

		let prFromSummary: number | undefined;
		let commitFromSummary: string | undefined;
		const usersFromSummary: string[] = [];

		const replacedChangelog = changeset.summary
			.replace(/^\s*(?:pr|pull|pull\s+request):\s*#?(\d+)/im, (_, pr) => {
				const num = Number(pr);
				if (!isNaN(num)) prFromSummary = num;
				return '';
			})
			.replace(/^\s*commit:\s*([^\s]+)/im, (_, commit) => {
				commitFromSummary = commit;
				return '';
			})
			.replace(/^\s*(?:author|user):\s*@?([^\s]+)/gim, (_, user) => {
				usersFromSummary.push(user);
				return '';
			})
			.trim();

		const [firstLine, ...futureLines] = replacedChangelog.split('\n').map((l) => l.trimEnd());

		const links = await (async () => {
			const commitToFetchFrom = commitFromSummary || changeset.commit;
			if (!commitToFetchFrom) {
				return;
			}

			const { author, pull } = await getCommitInfo({
				repo: options.repo,
				commit: commitToFetchFrom,
				pr: prFromSummary,
			});
			return { pull, author };
		})();

		const users = (() => {
			if (usersFromSummary.length) {
				return usersFromSummary.map((userFromSummary) => `[@${userFromSummary}](https://github.com/${userFromSummary})`).join(', ');
			}

			if (links?.author?.association === 'CONTRIBUTOR') {
				return `[@${links.author.login}](https://github.com/${links.author.login})`;
			}
		})();

		const prefix = [
			links?.pull ? `[#${links?.pull?.number}](${links?.pull?.url})` : '',
			// links.commit === null ? '' : links.commit,
			users ? `by ${users}` : '',
		]
			.filter(Boolean)
			.join(' ');

		return `-${prefix ? ` (${prefix})` : ''} ${firstLine}\n${futureLines.map((l) => `  ${l}`).join('\n')}`;
	},
	getDependencyReleaseLine: async (changesets, dependenciesUpdated, options) => {
		if (!options.repo) {
			throw new Error(
				'Please provide a repo to this changelog generator like this:\n"changelog": ["@rocket.chat/release-changelog", { "repo": "org/repo" }]',
			);
		}
		if (dependenciesUpdated.length === 0) return '';

		const commits = changesets
			.map((cs) => cs.commit)
			.filter((_) => _)
			.join(', ');

		const changesetLink = `- <details><summary>Updated dependencies [${commits}]:</summary>\n`;

		const updatedDepenenciesList = dependenciesUpdated.map((dependency) => `  - ${dependency.name}@${dependency.newVersion}`);

		return [changesetLink, ...updatedDepenenciesList, '  </details>'].join('\n');
	},
};

export default changelogFunctions;
