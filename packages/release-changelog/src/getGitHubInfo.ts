import DataLoader from 'dataloader';
import fetch from 'node-fetch';

const validRepoNameRegex = /^[\w.-]+\/[\w.-]+$/;

type RequestData = { kind: 'commit'; repo: string; commit: string } | { kind: 'pull'; repo: string; pull: number };

type ReposWithCommitsAndPRsToFetch = Record<string, ({ kind: 'commit'; commit: string } | { kind: 'pull'; pull: number })[]>;

function makeQuery(repos: ReposWithCommitsAndPRsToFetch) {
	return `
			query {
				${Object.keys(repos)
					.map(
						(repo, i) =>
							`a${i}: repository(
						owner: ${JSON.stringify(repo.split('/')[0])}
						name: ${JSON.stringify(repo.split('/')[1])}
					) {
						${repos[repo]
							.map((data) =>
								data.kind === 'commit'
									? `a${data.commit}: object(expression: ${JSON.stringify(data.commit)}) {
						... on Commit {
						commitUrl
						message
						associatedPullRequests(first: 50) {
							nodes {
								number
								url
								mergedAt
								authorAssociation
								author {
									login
									url
								}
							}
						}
						author {
							user {
								login
								url
							}
						}
					}}`
									: `pr__${data.pull}: pullRequest(number: ${data.pull}) {
										url
										authorAssociation
										author {
											login
											url
										}
										mergeCommit {
											commitUrl
											abbreviatedOid
										}
									}`,
							)
							.join('\n')}
					}`,
					)
					.join('\n')}
				}
		`;
}

// why are we using dataloader?
// it provides use with two things
// 1. caching
// since getInfo will be called inside of changeset's getReleaseLine
// and there could be a lot of release lines for a single commit
// caching is important so we don't do a bunch of requests for the same commit
// 2. batching
// getReleaseLine will be called a large number of times but it'll be called at the same time
// so instead of doing a bunch of network requests, we can do a single one.
const GHDataLoader = new DataLoader(async (requests: RequestData[]) => {
	if (!process.env.GITHUB_TOKEN) {
		throw new Error(
			'Please create a GitHub personal access token at https://github.com/settings/tokens/new with `read:user` and `repo:status` permissions and add it as the GITHUB_TOKEN environment variable',
		);
	}
	const repos: ReposWithCommitsAndPRsToFetch = {};
	requests.forEach(({ repo, ...data }) => {
		if (repos[repo] === undefined) {
			repos[repo] = [];
		}
		repos[repo].push(data);
	});

	const data = await fetch('https://api.github.com/graphql', {
		method: 'POST',
		headers: {
			Authorization: `Token ${process.env.GITHUB_TOKEN}`,
		},
		body: JSON.stringify({ query: makeQuery(repos) }),
	}).then((x: any) => x.json());

	if (data.errors) {
		throw new Error(`An error occurred when fetching data from GitHub\n${JSON.stringify(data.errors, null, 2)}`);
	}

	// this is mainly for the case where there's an authentication problem
	if (!data.data) {
		throw new Error(`An error occurred when fetching data from GitHub\n${JSON.stringify(data)}`);
	}

	const cleanedData: Record<string, { commit: Record<string, any>; pull: Record<string, any> }> = {};
	Object.keys(repos).forEach((repo, index) => {
		const output: { commit: Record<string, any>; pull: Record<string, any> } = {
			commit: {},
			pull: {},
		};
		cleanedData[repo] = output;
		Object.entries(data.data[`a${index}`]).forEach(([field, value]) => {
			// this is "a" because that's how it was when it was first written, "a" means it's a commit not a pr
			// we could change it to commit__ but then we have to get new GraphQL results from the GH API to put in the tests
			if (field[0] === 'a') {
				output.commit[field.substring(1)] = value;
			} else {
				output.pull[field.replace('pr__', '')] = value;
			}
		});
	});

	return requests.map(({ repo, ...data }) => cleanedData[repo][data.kind][data.kind === 'pull' ? data.pull : data.commit]);
});

export async function getCommitInfo(request: { commit: string; repo: string; pr?: number }): Promise<{
	pull?: {
		number: number;
		url: string;
	};
	author: {
		association: string;
		login: string;
		url: string;
	};
}> {
	if (!request.commit) {
		throw new Error('Please pass a commit SHA to getInfo');
	}

	if (!request.repo) {
		throw new Error('Please pass a GitHub repository in the form of userOrOrg/repoName to getInfo');
	}

	if (!validRepoNameRegex.test(request.repo)) {
		throw new Error(
			`Please pass a valid GitHub repository in the form of userOrOrg/repoName to getInfo (it has to match the "${validRepoNameRegex.source}" pattern)`,
		);
	}

	const data = await GHDataLoader.load({ kind: 'commit', ...request });

	const prMatch = data.message.match(/\(#(\d+)\)$/m);
	if (!prMatch && !request.pr) {
		return {
			author: { login: data.author.login, url: data.author.url, association: 'MEMBER' },
		};
	}

	const pr = request.pr || Number(prMatch[1]);

	const pullRequest = await GHDataLoader.load({ kind: 'pull', pull: pr, repo: request.repo });

	return {
		pull: {
			number: pr,
			url: pullRequest.url,
		},
		author: {
			login: pullRequest.author.login,
			url: pullRequest.author.url,
			association: pullRequest.authorAssociation,
		},
	};
}
