Meteor.startup ->
	oplogState = 'Disabled'
	if MongoInternals.defaultRemoteCollectionDriver().mongo._oplogHandle?.onOplogEntry?
		oplogState = 'Enabled'
		if RocketChat.settings.get('Force_Disable_OpLog_For_Cache') is true
			oplogState += ' (Disabled for Cache Sync)'

	Meteor.setTimeout ->
		msg = [
			"     Version: #{RocketChat.Info.version}"
			"Process Port: #{process.env.PORT}"
			"    Site URL: #{RocketChat.settings.get('Site_Url')}"
			"       OpLog: #{oplogState}"
		].join('\n')

		SystemLogger.startup_box msg, 'SERVER RUNNING'
	, 100
