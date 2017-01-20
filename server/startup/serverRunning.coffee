import fs from 'fs'
import path from 'path'
import semver from 'semver'

Meteor.startup ->
	oplogState = 'Disabled'
	if MongoInternals.defaultRemoteCollectionDriver().mongo._oplogHandle?.onOplogEntry?
		oplogState = 'Enabled'
		if RocketChat.settings.get('Force_Disable_OpLog_For_Cache') is true
			oplogState += ' (Disabled for Cache Sync)'

	desiredNodeVersion = semver.clean(fs.readFileSync(path.join(process.cwd(), '../../.node_version.txt')).toString())
	desiredNodeVersionMajor = String(semver.parse(desiredNodeVersion).major)

	Meteor.setTimeout ->
		msg = [
			"Rocket.Chat Version: #{RocketChat.Info.version}"
			"     NodeJS Version: #{process.versions.node} - #{process.arch}"
			"           Platform: #{process.platform}"
			"       Process Port: #{process.env.PORT}"
			"           Site URL: #{RocketChat.settings.get('Site_Url')}"
			"   ReplicaSet OpLog: #{oplogState}"
		]

		if RocketChat.Info.commit?.hash?
			msg.push("        Commit Hash: #{RocketChat.Info.commit.hash.substr(0, 10)}")

		if RocketChat.Info.commit?.branch?
			msg.push("      Commit Branch: #{RocketChat.Info.commit.branch}")

		msg = msg.join('\n')

		if semver.satisfies(process.versions.node, desiredNodeVersionMajor)
			SystemLogger.startup_box msg, 'SERVER RUNNING'
		else
			msg += [
				""
				""
				"YOUR CURRENT NODEJS VERSION IS NOT SUPPORTED,"
				"PLEASE UPGRADE / DOWNGRADE TO VERSION #{desiredNodeVersionMajor}.X.X"
			].join('\n')

			SystemLogger.error_box msg, 'SERVER ERROR'
			process.exit()
	, 100
