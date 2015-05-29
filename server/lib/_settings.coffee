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

configCDN = (settings) ->
	if settings.CDN_PREFIX?
		WebAppInternals.setBundledJsCssPrefix settings.CDN_PREFIX

configKadira = (settings) ->
	if settings.kadira?
		Kadira.connect(settings.kadira.appId, settings.kadira.appSecret)

Settings.find().observe
	added: (settings) ->
		Meteor.settings = settings
		configLoginServices settings
		loadEnvConfigs settings
		configCDN settings
		configKadira settings

	changed: (settings) ->
		Meteor.settings = settings
		configLoginServices settings
		loadEnvConfigs settings
		configCDN settings
		configKadira settings
