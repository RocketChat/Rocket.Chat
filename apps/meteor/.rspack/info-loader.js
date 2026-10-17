// Rspack counterpart of the rocketchat:version build plugin (packages/rocketchat-version/plugin/compile-version.js)
const { exec } = require('child_process');
const fs = require('fs');
const https = require('https');
const os = require('os');
const path = require('path');
const util = require('util');

const execAsync = util.promisify(exec);

const readAppPackageJson = (appDir) => JSON.parse(fs.readFileSync(path.join(appDir, 'package.json'), { encoding: 'utf8' }));

const git = async (command, isDevelopment) => {
	try {
		return (await execAsync(command)).stdout;
	} catch (e) {
		if (!isDevelopment) {
			throw e;
		}
	}
};

async function buildInfo(source, appDir, isDevelopment) {
	const output = JSON.parse(source);
	output.build = {
		date: new Date().toISOString(),
		nodeVersion: process.version,
		arch: process.arch,
		platform: process.platform,
		osRelease: os.release(),
		totalMemory: os.totalmem(),
		freeMemory: os.freemem(),
		cpus: os.cpus().length,
	};
	const appsEnginePackageJson = require.resolve('@rocket.chat/apps-engine/package.json', { paths: [appDir] });
	output.marketplaceApiVersion = JSON.parse(fs.readFileSync(appsEnginePackageJson, { encoding: 'utf8' })).version.replace(/^[^0-9]/g, '');
	const minimumClientVersions = readAppPackageJson(appDir)?.rocketchat?.minimumClientVersions || {};

	const log = await git("git log --pretty=format:'%H%n%ad%n%an%n%s' -n 1", isDevelopment);
	if (log) {
		const data = log.split('\n');
		output.commit = {
			hash: data.shift(),
			date: data.shift(),
			author: data.shift(),
			subject: data.join('\n'),
		};
	}

	try {
		const tag = (await execAsync('git describe --abbrev=0 --tags')).stdout;
		if (output.commit) {
			output.commit.tag = tag.replace('\n', '');
		}
	} catch (e) {
		// no tags
	}

	const branch = await git('git rev-parse --abbrev-ref HEAD', isDevelopment);
	if (branch && output.commit) {
		output.commit.branch = branch.replace('\n', '');
	}

	return `exports.Info = ${JSON.stringify(output, null, 4)};
exports.minimumClientVersions = ${JSON.stringify(minimumClientVersions, null, 4)};`;
}

function fetchSupportedVersions(appDir, isDevelopment) {
	return new Promise((resolve, reject) => {
		const currentVersion = readAppPackageJson(appDir)?.version || '';
		let type = 'stable';
		if (currentVersion.includes('-rc.')) {
			type = 'candidate';
		} else if (currentVersion.includes('-develop')) {
			type = 'develop';
		}
		const url = `https://releases.rocket.chat/v2/server/supportedVersions?includeDraftType=${type}&includeDraftTag=${currentVersion}`;

		const handleError = (err) => {
			console.error('Error getting supported versions', err);
			// TODO remove this when we are ready to fail
			if (!isDevelopment) {
				reject(err);
				return;
			}
			resolve({});
		};

		https
			.get(url, (response) => {
				let data = '';
				response.on('data', (chunk) => {
					data += chunk;
				});
				response.on('end', () => {
					const supportedVersions = JSON.parse(data);
					if (!supportedVersions?.signed) {
						return handleError(new Error(`Invalid supportedVersions result:\n  URL: ${url} \n  RESULT: ${data}`));
					}
					if (Math.abs(new Date().getTime() - new Date(supportedVersions.timestamp).getTime()) > 1000 * 60 * 60) {
						return handleError(new Error(`Invalid supportedVersions timestamp:\n  URL: ${url} \n  RESULT: ${data}`));
					}
					if (supportedVersions.versions.some((version) => new Date(version.expiration) < new Date('2019-04-01T00:00:00.000Z'))) {
						return handleError(new Error(`Invalid supportedVersions expiration:\n  URL: ${url} \n  RESULT: ${data}`));
					}
					resolve(supportedVersions);
				});
				response.on('error', handleError);
			})
			.end();
	});
}

module.exports = function infoLoader(source) {
	const callback = this.async();
	const appDir = this.rootContext;
	const isDevelopment = this.mode === 'development';
	// Build metadata changes on every build, so the output must never be served from cache
	this.cacheable(false);

	const fileName = path.basename(this.resourcePath);
	const build = (() => {
		switch (fileName) {
			case 'rocketchat.info':
				return buildInfo(source, appDir, isDevelopment);
			case 'rocketchat-supported-versions.info':
				return isDevelopment
					? Promise.resolve('exports.supportedVersions = {};')
					: fetchSupportedVersions(appDir, isDevelopment).then((data) => `exports.supportedVersions = ${JSON.stringify(data)};`);
			default:
				return Promise.reject(new Error(`Unexpected file ${this.resourcePath}`));
		}
	})();

	build.then((code) => callback(null, code), callback);
};
