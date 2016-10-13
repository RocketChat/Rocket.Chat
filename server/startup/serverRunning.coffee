Meteor.startup ->
	isOplogState = 'Enabled'
	if not MongoInternals.defaultRemoteCollectionDriver().mongo._oplogHandle?
		isOplogState = 'Disabled'

	Meteor.setTimeout ->
		msg = [
			"     Version: #{RocketChat.Info.version}"
			"Process Port: #{process.env.PORT}"
			"    Site URL: #{RocketChat.settings.get('Site_Url')}"
			"       OpLog: #{isOplogState}"
		].join('\n')

		SystemLogger.startup_box msg, 'SERVER RUNNING'
	, 100
