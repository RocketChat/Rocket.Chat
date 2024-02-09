import type { ChangelogFunctions } from '@changesets/types';

import { getInfo, getInfoFromPullRequest } from './getGitHubInfo';

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
			if (prFromSummary !== undefined) {
				const result = await getInfoFromPullRequest({
					repo: options.repo,
					pull: prFromSummary,
				});

				let { links } = result;
				if (commitFromSummary) {
					const shortCommitId = commitFromSummary.slice(0, 7);
					links = {
						...links,
						commit: `[\`${shortCommitId}\`](https://github.com/${options.repo}/commit/${commitFromSummary})`,
					};
				}

				const { user } = result;

				return {
					...links,
					user,
				};
			}
			const commitToFetchFrom = commitFromSummary || changeset.commit;
			if (commitToFetchFrom) {
				const { links, user } = await getInfo({
					repo: options.repo,
					commit: commitToFetchFrom,
				});
				return { ...links, user };
			}
			return {
				commit: null,
				pull: null,
				user: null,
			};
		})();

		const users = (() => {
			if (usersFromSummary.length) {
				return usersFromSummary.map((userFromSummary) => `[@${userFromSummary}](https://github.com/${userFromSummary})`).join(', ');
			}

			if (links.user?.association === 'CONTRIBUTOR') {
				return `[@${links.user.login}](https://github.com/${links.user.login})`;
			}
		})();

		const prefix = [
			links.pull === null ? '' : links.pull,
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
