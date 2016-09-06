###
# Kick off the global namespace for RocketChat.
# @namespace RocketChat
###
os = Npm.require('os')

RocketChat.Info.uniqueId = RocketChat.settings.get("uniqueID")
RocketChat.Info.createdAt = RocketChat.models.Settings.findOne("uniqueID")?._createdAt

RocketChat.Info.process =
	date: new Date().toISOString()
	nodeVersion: process.version
	depVersions: process.versions
	osArch: os.arch()
	osCpusCount: os.cpus().length
	osCpusModel: os.cpus()[0].model
	osCpusSpeed: os.cpus()[0].speed
	osPlatform: os.platform()
	osRelease: os.release()
	osTotalmem: os.totalmem()
	osType: os.type()
	pid: process.pid
