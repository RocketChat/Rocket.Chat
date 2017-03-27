//let Future, VersionCompiler, async, exec, os;
let VersionCompiler = undefined;

const exec = Npm.require('child_process').exec;

const os = Npm.require('os');

const Future = Npm.require('fibers/future');

const async = Npm.require('async');

Plugin.registerCompiler({
	extensions: ['info']
}, function() {
	return new VersionCompiler();
});

VersionCompiler = (function() {
	function VersionCompiler() {}

	VersionCompiler.prototype.processFilesForTarget = function(files) {
		const future = new Future;
		const processFile = function(file, cb) {
			let output;
			if (!file.getDisplayPath().match(/rocketchat\.info$/)) {
				return cb();
			}
			output = JSON.parse(file.getContentsAsString());
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
			return exec('git log --pretty=format:\'%H%n%ad%n%an%n%s\' -n 1', function(err, result) {
				if (err == null) {
					result = result.split('\n');
					output.commit = {
						hash: result.shift(),
						date: result.shift(),
						author: result.shift(),
						subject: result.join('\n')
					};
				}
				return exec('git describe --abbrev=0 --tags', function(err, result) {
					let ref;
					if (err == null) {
						if ((ref = output.commit) != null) {
							ref.tag = result.replace('\n', '');
						}
					}
					return exec('git rev-parse --abbrev-ref HEAD', function(err, result) {
						let ref1;
						if (err == null) {
							if ((ref1 = output.commit) != null) {
								ref1.branch = result.replace('\n', '');
							}
						}
						output = `RocketChat.Info = ${ JSON.stringify(output, null, 4) };`;
						file.addJavaScript({
							data: output,
							path: `${ file.getPathInPackage() }.js`
						});
						return cb();
					});
				});
			});
		};
		async.each(files, processFile, future.resolver());
		return future.wait();
	};

	return VersionCompiler;

}());
