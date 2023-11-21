import { exec } from 'child_process';
import os from 'os';
import util from 'util';
import path from 'path';
import fs from 'fs';
import https from 'https';

// const execAsync = util.promisify(exec);

class VersionCompiler {
	async processFilesForTarget(files) {
		debugger;
		const processFile = async function (file) {
			if (!file.getDisplayPath().endsWith('rocketchat-supported-versions.versions')) {
				console.log('Skipping', file.getDisplayPath());
				return;
			}

			console.log('Processing', file.getDisplayPath());

			const data = await new Promise((resolve, reject) => {
				https
					.get('https://releases.rocket.chat/v2/server/supportedVersions', function (response) {
						let data = '';
						response.on('data', function (chunk) {
							data += chunk;
						});
						response.on('end', function () {
							resolve(JSON.parse(data));
						});
						response.on('error', function (err) {
							console.error(err);
							reject(err);
						});
					})
					.end();
			});

			file.addJavaScript({
				data: `exports.supportedVersions = ${JSON.stringify(data)}`,
				path: `${file.getPathInPackage()}.js`,
			});
		};

		for await (const file of files) {
			await processFile(file);
		}
	}
}

Plugin.registerCompiler(
	{
		extensions: ['versions'],
	},
	function () {
		return new VersionCompiler();
	},
);
