import { exec } from 'child_process';
import fs from 'fs';
import https from 'https';
import os from 'os';
import path from 'path';
import util from 'util';

const execAsync = util.promisify(exec);

class VersionCompiler {
	async processFilesForTarget(files) {
		const processVersionFile = async function (file) {
			const data = await new Promise((resolve) => {
				const currentVersion =
					JSON.parse(fs.readFileSync(path.resolve(process.cwd(), './package.json'), { encoding: 'utf8' }))?.version || '';

				let type = 'stable';
				if (currentVersion.includes('-rc.')) {
					type = 'candidate';
				} else if (currentVersion.includes('-develop')) {
					type = 'develop';
				}

				const url = `https://releases.rocket.chat/v2/server/supportedVersions?includeDraftType=${type}&includeDraftTag=${currentVersion}`;

				function handleError(err) {
					console.error(err);
					// TODO remove this when we are ready to fail
					// if (process.env.NODE_ENV !== 'development') {
					// 	reject(err);
					// 	return;
					// }
					resolve({});
				}

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
							resolve(supportedVersions);
						});
						response.on('error', (err) => {
							handleError(err);
						});
					})
					.end();
			});

			file.addJavaScript({
				data: `exports.supportedVersions = ${JSON.stringify(data)}`,
				path: `${file.getPathInPackage()}.js`,
			});
		};

		const processFile = async function (file) {
			const output = JSON.parse(file.getContentsAsString());
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

			output.marketplaceApiVersion = require('@rocket.chat/apps-engine/package.json').version.replace(/^[^0-9]/g, '');
			const minimumClientVersions =
				JSON.parse(fs.readFileSync(path.resolve(process.cwd(), './package.json'), { encoding: 'utf8' }))?.rocketchat
					?.minimumClientVersions || {};
			try {
				const result = await execAsync("git log --pretty=format:'%H%n%ad%n%an%n%s' -n 1");
				const data = result.stdout.split('\n');
				output.commit = {
					hash: data.shift(),
					date: data.shift(),
					author: data.shift(),
					subject: data.join('\n'),
				};
			} catch (e) {
				if (process.env.NODE_ENV !== 'development') {
					throw e;
				}
				// no git
			}

			try {
				const tags = await execAsync('git describe --abbrev=0 --tags');
				if (output.commit) {
					output.commit.tag = tags.stdout.replace('\n', '');
				}
			} catch (e) {
				// no tags
			}

			try {
				const branch = await execAsync('git rev-parse --abbrev-ref HEAD');
				if (output.commit) {
					output.commit.branch = branch.stdout.replace('\n', '');
				}
			} catch (e) {
				if (process.env.NODE_ENV !== 'development') {
					throw e;
				}

				// no branch
			}

			file.addJavaScript({
				data: `exports.Info = ${JSON.stringify(output, null, 4)};
				exports.minimumClientVersions = ${JSON.stringify(minimumClientVersions, null, 4)};`,
				path: `${file.getPathInPackage()}.js`,
			});
		};

		for await (const file of files) {
			switch (true) {
				case file.getDisplayPath().endsWith('rocketchat.info'): {
					await processFile(file);
					break;
				}
				case file.getDisplayPath().endsWith('rocketchat-supported-versions.info'): {
					await processVersionFile(file);
					break;
				}
				default: {
					throw new Error(`Unexpected file ${file.getDisplayPath()}`);
				}
			}
		}
	}
}

Plugin.registerCompiler(
	{
		extensions: ['info'],
	},
	() => {
		return new VersionCompiler();
	},
);
