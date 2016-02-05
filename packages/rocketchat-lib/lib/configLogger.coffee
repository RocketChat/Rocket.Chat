RocketChat.settings.get 'Log_Package', (key, value) ->
	LoggerManager?.showPackage = value

RocketChat.settings.get 'Log_File', (key, value) ->
	LoggerManager?.showFileAndLine = value

RocketChat.settings.get 'Log_Level', (key, value) ->
	if value?
		LoggerManager?.logLevel = parseInt value
		Meteor.setTimeout ->
			LoggerManager?.enable(true)
		, 200
