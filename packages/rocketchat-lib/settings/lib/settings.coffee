@Settings = new Meteor.Collection 'settings'

Settings.find().observe
	added: (record) ->
		Meteor.settings ?= {}
		Meteor.settings[record._id] = record
		# configLoginServices settings
		# loadEnvConfigs settings
		# configCDN settings
		# configKadira settings

	changed: (record) ->
		Meteor.settings?[record._id] = record
		# __meteor_runtime_config__?.PUBLIC_SETTINGS = Meteor.settings?.public
		# configLoginServices settings
		# loadEnvConfigs settings
		# configCDN settings
		# configKadira settings

	removed: (record) ->
		delete Meteor.settings?[record._id]

# loadEnvConfigs = (settings) ->
# 	if settings.ENV?
# 		for key, value of settings.ENV
# 			process.env[key] = value

# configLoginServices = (settings) ->
# 	settings?['login-services']?.forEach (config) ->
# 		ServiceConfiguration.configurations.remove
# 			service: config.service

# 		ServiceConfiguration.configurations.insert config

# configCDN = (settings) ->
# 	if settings.CDN_PREFIX?
# 		WebAppInternals.setBundledJsCssPrefix settings.CDN_PREFIX

# configKadira = (settings) ->
# 	if settings.kadira?
# 		Kadira.connect(settings.kadira.appId, settings.kadira.appSecret)