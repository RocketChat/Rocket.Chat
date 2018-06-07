const path = require('path');
const fs = require('fs');
const semver = require('semver');
const ProgressBar = require('progress');
const _ = require('underscore');
const git = require('simple-git/promise')(process.cwd());
const octokit = require('@octokit/rest')();

const minTag = '0.55.0-rc.0';
const commitRegexString = '(^Merge pull request #([0-9]+) from )|( \\(#([0-9]+)\\)$)';
const commitRegex = new RegExp(commitRegexString);

const historyDataFile = path.join(__dirname, '../.github/history.json');

let historyData = (() => {
	try {
		return require(historyDataFile);
	} catch (error) {
		return {};
	}
})();

octokit.authenticate({
	type: 'token',
	token: process.env.GITHUB_TOKEN
});
const owner = 'RocketChat';
const repo = 'Rocket.Chat';

function promiseRetryRateLimit(promiseFn, retryWait = 60000) {
	return new Promise((resolve, reject) => {
		function exec() {
			promiseFn()
				.then(data => resolve(data))
				.catch(error => {
					if (error.headers['x-ratelimit-remaining'] === '0') {
						let reset = error.headers['x-ratelimit-reset'];
						if (reset) {
							reset = parseInt(reset) * 1000 - Date.now();
						}

						console.log('Retrying in', (reset || retryWait) / 1000, 'seconds');
						setTimeout(exec, reset || retryWait);
					} else {
						return reject(error);
					}
				});
		}
		exec();
	});
}

function getPRInfo(number, commit) {
	function onError(error) {
		console.error(commit, error);
		process.exit(1);
	}

	return promiseRetryRateLimit(() => octokit.pullRequests.get({owner, repo, number}))
		.catch(onError)
		.then(pr => {
			const info = {
				pr: number,
				title: pr.data.title,
				userLogin: pr.data.user.login
			};
			// data.author_association: 'CONTRIBUTOR',

			if (pr.data.milestone) {
				info.milestone = pr.data.milestone.title;
			}

			return promiseRetryRateLimit(() => octokit.pullRequests.getCommits({owner, repo, number}))
				.catch(onError)
				.then(commits => {
					info.contributors = _.unique(_.flatten(commits.data.map(i => {
						if (!i.author || !i.committer) {
							return;
						}

						return [i.author.login, i.committer.login];
					})));

					return info;
				});
		});
}

function getPRNumeberFromMessage(message, item) {
	const match = message.match(commitRegex);
	if (match == null) {
		console.log(message, item);
	}
	const number = match[2] || match[4];

	if (!/^\d+$/.test(number)) {
		console.error('Invalid number', {number, message});
		process.exit(1);
	}

	return number;
}

function getPullRequests(from, to) {
	const logParams = ['--no-decorate', '--graph', '-E', `--grep=${ commitRegexString }`, `${ from }...${ to }`];
	logParams.format = {
		hash: '%H',
		date: '%ai',
		message: '%s',
		author_name: '%aN',
		author_email: '%ae'
	};

	return git.log(logParams).then((log) => {
		const items = log.all
			.filter(item => /^(\*\s)[0-9a-z]+$/.test(item.hash))
			.map(item => {
				item.hash = item.hash.replace(/^(\*\s)/, '');
				return item;
			})
			.filter(item => commitRegex.test(item.message));

		const data = [];

		return new Promise((resolve, reject) => {
			const bar = new ProgressBar('  [:bar] :current/:total :percent :etas', {
				total: items.length,
				incomplete: ' ',
				width: 20
			});

			function process() {
				if (items.length === 0) {
					resolve(data);
				}

				const partItems = items.splice(0, 10);
				bar.tick(partItems.length);

				const promises = partItems.map(item => {
					return getPRInfo(getPRNumeberFromMessage(item.message, item), item);
				});

				return Promise.all(promises).then(result => {
					data.push(..._.compact(result));
					if (items.length) {
						setTimeout(process, 100);
					} else {
						resolve(data);
					}
				}).catch(error => reject(error));
			}

			process();
		});
	});
}

function getTags() {
	return git.tags().then((tags) => {
		tags = tags.all.filter(tag => /^\d+\.\d+\.\d+(-rc\.\d+)?$/.test(tag));

		tags = tags.sort((a, b) => {
			if (semver.gt(a, b)) {
				return 1;
			}
			if (semver.lt(a, b)) {
				return -1;
			}
			return 0;
		});

		tags.push('HEAD');

		return tags
			.map((item, index) => {
				return {
					tag: item,
					before: index ? tags[--index] : null
				};
			})
			.filter(item => item.tag === 'HEAD' || semver.gte(item.tag, minTag))
			.reduce((value, item) => {
				value[item.tag] = item;
				return value;
			}, {});
	});
}

function getMissingTags() {
	return getTags().then(tags => {
		const missingTags = _.difference(Object.keys(tags), Object.keys(historyData));
		missingTags.push('HEAD');
		return _.pick(tags, missingTags);
	});
}

getMissingTags().then(missingTags => {
	console.log('Missing tags:');
	console.log(JSON.stringify(Object.keys(missingTags), null, 2));
	missingTags = Object.values(missingTags);

	function loadMissingTag() {
		if (!missingTags.length) {
			return;
		}

		const item = missingTags.shift();
		const from = item.before;
		const to = item.tag;
		console.log('Fetching data for tag:', to, `(from ${ from })`);
		getPullRequests(from, to).then(prs => {
			// console.log('  ', prs.length, 'item(s) found');
			historyData = Object.assign(historyData, {
				[to]: prs
			});
			fs.writeFileSync(historyDataFile, JSON.stringify(historyData, null, 2));
			loadMissingTag();
		});
	}

	loadMissingTag();
});

// getPullRequests('0.61.2', '0.62.0')

// getPRInfo('8158').then(pr => {
// 	console.log(pr);
// });
