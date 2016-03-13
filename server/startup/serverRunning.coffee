Meteor.startup ->
	Meteor.setTimeout ->
		msg = [
			"     Version: #{RocketChat.Info.version}"
			"Process Port: #{process.env.PORT}"
			"    Site URL: #{RocketChat.settings.get('Site_Url')}"
		].join('\n')

		SystemLogger.startup_box msg, 'SERVER RUNNING'
	, 100
