exec = Npm.require('child_process').exec
os = Npm.require('os')
Future = Npm.require('fibers/future')
async = Npm.require('async')

Plugin.registerCompiler
	extensions: ['info']
, -> new VersionCompiler()


class VersionCompiler
	processFilesForTarget: (files) ->
		future = new Future

		processFile = (file, cb) ->
			return cb() if not file.getDisplayPath().match /rocketchat\.info$/

			output = JSON.parse file.getContentsAsString()
			output.build =
				date: new Date().toISOString()
				nodeVersion: process.version
				arch: process.arch
				platform: process.platform
				osRelease: os.release()
				totalMemory: os.totalmem()
				freeMemory: os.freemem()
				cpus: os.cpus().length

			if process.env.TRAVIS_BUILD_NUMBER
				output.travis =
					buildNumber: process.env.TRAVIS_BUILD_NUMBER
					branch: process.env.TRAVIS_BRANCH
					tag: process.env.TRAVIS_TAG

			exec "git log --pretty=format:'%H%n%ad%n%an%n%s' -n 1", (err, result) ->
				if not err?
					result = result.split('\n')

					output.commit =
						hash: result.shift()
						date: result.shift()
						author: result.shift()
						subject: result.join('\n')

				exec "git describe --abbrev=0 --tags", (err, result) ->
					if not err?
						output.commit?.tag = result.replace('\n', '')

					exec "git rev-parse --abbrev-ref HEAD", (err, result) ->
						if not err?
							output.commit?.branch = result.replace('\n', '')

						output = """
							RocketChat.Info = #{JSON.stringify(output, null, 4)};
						"""

						file.addJavaScript({ data: output, path: file.getPathInPackage() + '.js' })
						cb()

		async.each files, processFile, future.resolver()

		future.wait()
