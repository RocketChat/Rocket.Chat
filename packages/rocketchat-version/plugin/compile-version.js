import {exec} from 'child_process';
import os from 'os';
import Future from 'fibers/future';
import async from 'async';

class VersionCompiler {
	processFilesForTarget(files) {
		const future = new Future;
		const processFile = function(file, cb) {
			if (!file.getDisplayPath().match(/rocketchat\.info$/)) {
				return cb();
			}

			let output = JSON.parse(file.getContentsAsString());
			output.build = {
				date: new Date().toISOString(),
				nodeVersion: process.version,
				arch: process.arch,
				platform: process.platform,
				osRelease: os.release(),
				totalMemory: os.totalmem(),
				freeMemory: os.freemem(),
				cpus: os.cpus().length
			};

			if (process.env.TRAVIS_BUILD_NUMBER) {
				output.travis = {
					buildNumber: process.env.TRAVIS_BUILD_NUMBER,
					branch: process.env.TRAVIS_BRANCH,
					tag: process.env.TRAVIS_TAG
				};
			}

			exec('git log --pretty=format:\'%H%n%ad%n%an%n%s\' -n 1', function(err, result) {
				if (err == null) {
					result = result.split('\n');
					output.commit = {
						hash: result.shift(),
						date: result.shift(),
						author: result.shift(),
						subject: result.join('\n')
					};
				}

				exec('git describe --abbrev=0 --tags', function(err, result) {
					if (err == null && output.commit != null) {
						output.commit.tag = result.replace('\n', '');
					}

					exec('git rev-parse --abbrev-ref HEAD', function(err, result) {
						if (err == null && output.commit != null) {
							output.commit.branch = result.replace('\n', '');
						}
						output = `RocketChat.Info = ${ JSON.stringify(output, null, 4) };`;
						file.addJavaScript({
							data: output,
							path: `${ file.getPathInPackage() }.js`
						});
						cb();
					});
				});
			});
		};

		async.each(files, processFile, future.resolver());
		return future.wait();
	}
}

Plugin.registerCompiler({
	extensions: ['info']
}, function() {
	return new VersionCompiler();
});
