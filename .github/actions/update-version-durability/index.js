import 'colors';
import axios from 'axios';
import * as Diff from 'diff';
import semver from 'semver';
import crypto from 'crypto';
import fs from 'fs/promises';
import BeautyHtml from 'beauty-html';
import { DOMParser } from 'xmldom';
import core from '@actions/core';
import { Octokit } from '@octokit/rest';

const D360_TOKEN = core.getInput('D360_TOKEN');
const D360_ARTICLE_ID = core.getInput('D360_ARTICLE_ID');
const PUBLISH = core.getInput('PUBLISH') === 'true';

const octokit = new Octokit({
	auth: core.getInput('GH_TOKEN'),
});


async function requestDocument360(method = 'get', api, data = {}) {
	return axios.request({
		method,
		maxBodyLength: Infinity,
		url: `https://apihub.us.document360.io/v1/${api}`,
		headers: {
			'accept': 'application/json',
			'api_token': D360_TOKEN,
		},
		data,
	});
}

function md5(text) {
	return crypto.createHash('md5').update(text).digest("hex");
}

async function generateTable({ owner, repo } = {}) {
	const response = await requestDocument360('get', `Articles/${D360_ARTICLE_ID}/en`);

	// console.log(response.data.data);

	// const releasesResult = JSON.parse(await fs.readFile('/tmp/releasesResult'));
	const releasesResult = await octokit.paginate(octokit.repos.listReleases.endpoint.merge({ owner, repo, per_page: 100 }));
	// await fs.writeFile('/tmp/releasesResult', JSON.stringify(releasesResult));

	const releases = releasesResult
		.filter((release) => !release.tag_name.includes('-rc') && semver.gte(release.tag_name, '1.0.0'))
		.sort((a, b) => semver.compare(b.tag_name, a.tag_name));

	const releasesMap = {};

	for (const release of releases) {
		release.releaseDate = new Date(release.published_at);

		releasesMap[release.tag_name] = release;
	}

	let index = 0;
	// eslint-disable-next-line no-constant-condition
	while (true) {
		const release = releases[index];

		release.minor_tag = release.tag_name.replace(/\.\d+$/, '');
		release.minorRelease = releasesMap[`${release.minor_tag}.0`];

		if (!releases[index + 1]) {
			break;
		}

		const currentVersion = semver.parse(release.tag_name);
		const previousVersion = semver.parse(releases[index + 1].tag_name);

		releases[index + 1].nextRelease = release;

		// Remove duplicated due to patches
		if (currentVersion.major === previousVersion.major && currentVersion.minor === previousVersion.minor) {
			releases.splice(index + 1, 1);
			continue;
		}

		index++;
	}

	releases[0].last = true;

	const releaseData = [];

	for (const { tag_name, html_url, lts, last, nextRelease, minorRelease, minor_tag} of releases) {
		let supportDate;
		let supportDateStart;

		let releasedAt = new Date(minorRelease.releaseDate);
		releasedAt.setDate(1);

		let minorDate = new Date(minorRelease.releaseDate);
		minorDate.setDate(1);
		supportDateStart = minorDate;
		supportDate = new Date(minorDate);
		supportDate.setMonth(supportDate.getMonth() + (lts ? 6 : 6));

		releaseData.push({
			release: {
				version: minor_tag,
				releasedAt,
				extendedSupport: {
					start: supportDateStart,
					end: supportDate,
				},
				lts: lts === true,
			},
			latestPatch: {
				version: tag_name,
				url: html_url,
			}
		})
	}

	function header({data, salt = ''}) {
		return [
			'<th colspan="1" data-vertical-align="middle" data-horizontal-align="left" rowspan="1" style="vertical-align:middle;text-align:left;">',
			`<p data-block-id="${md5(salt+data)}">${data}</p>`,
			'</th>',
		].join('');
	}

	function line({data, salt = ''}) {
		return [
			'<td colspan="1" rowspan="1" data-vertical-align="middle" data-horizontal-align="left" style="vertical-align:middle;text-align:left;">',
			`<p data-block-id="${md5(salt+data)}">${data}</p>`,
			'</td>',
		].join('');
	}

	const text = [
		'<tr>',
		header({data: 'Rocket.Chat Release'}),
		header({data: 'Released At'}),
		header({data: 'End of Life'}),
		'</tr>',
	];

	releaseData.forEach(({release, latestPatch}) => {
		const releasedAt = release.releasedAt.toLocaleString('en', { month: 'short', year: "numeric" });
		const endOfLife = !release.extendedSupport
			? 'TBD'
			: release.extendedSupport.end.toLocaleString('en', { month: 'short', year: "numeric" });
		const link = `${release.version} (<a href="${latestPatch.url}" target="_blank" translate="no">${latestPatch.version}</a>)`;

		text.push(
			'<tr>',
			line({data: link}),
			line({data: releasedAt, salt: release.version}),
			line({data: endOfLife, salt: release.version}),
			'</tr>',
		);
	});

	const content = response.data.data.html_content.replace(/<tbody>.+(\n.+)*<\/tbody>/m, `<tbody>${text.join('').replace(/\t|\n/g, '')}</tbody>`)

	// console.log(content);

	const parser = new BeautyHtml({ parser: DOMParser });
	const diff = Diff.diffLines(parser.beautify(response.data.data.html_content), parser.beautify(content), { ignoreWhitespace: true, newlineIsToken: false });
	diff.forEach((item) => {
		let color = 'green';

		if (item.removed) {
			color = 'red';
		}

		if (item.removed || item.added) {
			item.value.split('\n').forEach((line) => {
				if (line === '') { return };
				console.log(`${item.removed ? '-' : '+'} ${line}`[color]);
			})
		}
	});

	if (diff.length === 1) {
		console.log('No changes found');
		return;
	}

	if (response.data.data.status === 3) {
		console.log('forking article', response.data.data.version_number);

		const forkResponse = await requestDocument360('put', `Articles/${D360_ARTICLE_ID}/fork`, {
			lang_code: "en",
			user_id: "2511fd00-9558-4826-8d8c-4cc0c110f89c",
			version_number: response.data.data.version_number,
		});

		console.log(forkResponse.data);
	}

	console.log('Updating article');
	const updateResponse = await requestDocument360('put', `Articles/${D360_ARTICLE_ID}/en`, {
		content,
	});

	console.log(updateResponse.data);

	if (PUBLISH) {
		console.log('publishing article', updateResponse.data.data.version_number);

		const forkResponse = await requestDocument360('post', `Articles/${D360_ARTICLE_ID}/en/publish`, {
			user_id: "2511fd00-9558-4826-8d8c-4cc0c110f89c",
			version_number: updateResponse.data.data.version_number,
			publish_message: 'Update support versions table via GitHub Action',
		});

		console.log(forkResponse.data);
	}
}

generateTable({ owner: 'RocketChat', repo: 'Rocket.Chat' });
