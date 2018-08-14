const path = require('path');
const fs = require('fs');
const semver = require('semver');
const _ = require('underscore');
const execSync = require('child_process').execSync;

const historyDataFile = path.join(__dirname, '../.github/history.json');
const historyManualDataFile = path.join(__dirname, '../.github/history-manual.json');
const historyFile = path.join(__dirname, '../HISTORY.md');

// TODO: Get from github team members
const nonContributors = [
	'web-flow',
	'Hudell',
	'MarcosSpessatto',
	'bernardoetrevisan',
	'ggazzo',
	'graywolf336',
	'sampaiodiego',
	'alexbrazier',
	'engelgabriel',
	'gdelavald',
	'geekgonecrazy',
	'ggazzo',
	'graywolf336',
	'karlprieb',
	'marceloschmidt',
	'MartinSchoeler',
	'rafaelks',
	'rodrigok',
	'renatobecker',
	'sampaiodiego',
	'SeanPackham'
];

const GroupNames = {
	FIX: '### 🐛 Bug fixes',
	NEW: '### 🎉 New features',
	BREAK: '### ⚠️ BREAKING CHANGES',
	MINOR: '🔍 Minor changes'
};

const SummaryNameEmoticons = {
	FIX: '🐛',
	NEW: '🎉',
	BREAK: '️️️⚠️',
	NOGROUP: '🔍',
	contributor: '👩‍💻👨‍💻'
};

const historyData = (() => {
	try {
		return require(historyDataFile);
	} catch (error) {
		return {};
	}
})();

const historyManualData = (() => {
	try {
		return require(historyManualDataFile);
	} catch (error) {
		return {};
	}
})();

Object.keys(historyManualData).forEach(tag => {
	historyData[tag] = historyData[tag] || [];
	historyData[tag].unshift(...historyManualData[tag]);
});

function groupPRs(prs) {
	const groups = {
		BREAK: [],
		NEW: [],
		FIX: [],
		NOGROUP: []
	};

	prs.forEach(pr => {
		const match = pr.title.match(/\[(FIX|NEW|BREAK)\]\s*(.+)/);
		if (match) {
			pr.title = match[2];
			groups[match[1]].push(pr);
		} else {
			groups.NOGROUP.push(pr);
		}
	});

	return groups;
}

function getTagDate(tag) {
	return execSync(`git tag -l --format="%(creatordate:short)" ${ tag }`).toString().replace(/\n/, '');
}

function getLatestCommitDate() {
	return execSync('git log --date=short --format=\'%ad\' -1').toString().replace(/\n/, '');
}

Object.keys(historyData).forEach(tag => {
	historyData[tag] = {
		prs: historyData[tag],
		rcs: []
	};
});

Object.keys(historyData).forEach(tag => {
	if (/-rc/.test(tag)) {
		const mainTag = tag.replace(/-rc.*/, '');
		historyData[mainTag] = historyData[mainTag] || {
			noMainRelease: true,
			prs: [],
			rcs: []
		};

		if (historyData[mainTag].noMainRelease) {
			historyData[mainTag].rcs.push({
				tag,
				prs: historyData[tag].prs
			});
		} else {
			historyData[mainTag].prs.push(...historyData[tag].prs);
		}

		delete historyData[tag];
	}
});

const file = [];

function getSummary(contributors, groupedPRs) {
	const summary = [];

	Object.keys(groupedPRs).forEach(group => {
		if (groupedPRs[group].length) {
			summary.push(`${ groupedPRs[group].length } ${ SummaryNameEmoticons[group] }`);
		}
	});

	if (contributors.length) {
		summary.push(`${ contributors.length } ${ SummaryNameEmoticons.contributor }`);
	}

	if (summary.length) {
		return `  ·  ${ summary.join('  ·  ') }`;
	}

	return '';
}

function renderPRs(prs) {
	const data = [];
	const groupedPRs = groupPRs(prs);

	Object.keys(groupedPRs).forEach(group => {
		const prs = groupedPRs[group];
		if (!prs.length) {
			return;
		}

		const groupName = GroupNames[group];

		if (group === 'NOGROUP') {
			data.push(`\n<details>\n<summary>${ GroupNames.MINOR }</summary>\n`);
		} else {
			data.push(`\n${ groupName }\n`);
		}
		prs.forEach(pr => {
			let contributors = _.compact(_.difference(pr.contributors, nonContributors))
				.sort()
				.map(contributor => `[@${ contributor }](https://github.com/${ contributor })`)
				.join(' & ');

			if (contributors) {
				contributors = ` by ${ contributors }`;
			}

			const prInfo = pr.pr ? ` ([#${ pr.pr }](https://github.com/RocketChat/Rocket.Chat/pull/${ pr.pr })${ contributors })` : '';
			data.push(`- ${ pr.title }${ prInfo }`);
		});
		if (group === 'NOGROUP') {
			data.push('\n</details>');
		}
	});

	const contributors = _.compact(_.difference(prs.reduce((value, pr) => {
		return _.unique(value.concat(pr.contributors));
	}, []), nonContributors));

	if (contributors.length) {
		// TODO: Improve list like https://gist.github.com/paulmillr/2657075/
		data.push('\n### 👩‍💻👨‍💻 Contributors 😍\n');
		contributors.sort().forEach(contributor => {
			data.push(`- [@${ contributor }](https://github.com/${ contributor })`);
		});
	}

	return {
		data,
		summary: getSummary(contributors, groupedPRs)
	};
}

function sort(a, b) {
	if (a === 'HEAD') {
		return -1;
	}
	if (b === 'HEAD') {
		return 1;
	}

	if (semver.gt(a, b)) {
		return -1;
	}
	if (semver.lt(a, b)) {
		return 1;
	}
	return 0;
}

Object.keys(historyData).sort(sort).forEach(tag => {
	const {prs, rcs} = historyData[tag];

	if (!prs.length && !rcs.length) {
		return;
	}

	const tagDate = tag === 'HEAD' ? getLatestCommitDate() : getTagDate(tag);

	const {data, summary} = renderPRs(prs);

	const tagText = tag === 'HEAD' ? 'Next' : tag;

	if (historyData[tag].noMainRelease) {
		file.push(`\n# ${ tagText } (Under Release Candidate Process)`);
	} else {
		file.push(`\n# ${ tagText }`);
		file.push(`\`${ tagDate }${ summary }\``);
	}

	file.push(...data);

	if (Array.isArray(rcs)) {
		rcs.reverse().forEach(rc => {
			const {data, summary} = renderPRs(rc.prs);

			if (historyData[tag].noMainRelease) {
				const tagDate = getTagDate(rc.tag);
				file.push(`\n## ${ rc.tag }`);
				file.push(`\`${ tagDate }${ summary }\``);
			}

			file.push(...data);
		});
	}
});

fs.writeFileSync(historyFile, file.join('\n'));
