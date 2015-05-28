@Settings = new Meteor.Collection 'settings'

loadEnvConfigs = (settings) ->
	if settings.ENV?
		for key, value of settings.ENV
			process.env[key] = value

configLoginServices = (settings) ->
	settings?['login-services']?.forEach (config) ->
		ServiceConfiguration.configurations.remove
			service: config.service

		ServiceConfiguration.configurations.insert config

Settings.find().observe
	added: (settings) ->
		Meteor.settings = settings
		configLoginServices settings
		loadEnvConfigs settings

	changed: (settings) ->
		Meteor.settings = settings
		configLoginServices settings
		loadEnvConfigs settings

