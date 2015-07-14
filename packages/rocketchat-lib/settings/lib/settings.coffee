@Settings = new Meteor.Collection 'settings'

Settings.find().observe
	added: (record) ->
		Meteor.settings ?= {}
		Meteor.settings[record._id] = record.value
		
		if process?
			process.env ?= {}
			process.env[record._id] = record.value
		# configLoginServices settings
		# configCDN settings

	changed: (record) ->
		Meteor.settings?[record._id] = record.value
		if process?
			process.env[record._id] = record.value
		# __meteor_runtime_config__?.PUBLIC_SETTINGS = Meteor.settings?.public
		# configLoginServices settings
		# configCDN settings

	removed: (record) ->
		delete Meteor.settings?[record._id]
		delete process?.env?[record._id]


# configLoginServices = (settings) ->
# 	settings?['login-services']?.forEach (config) ->
# 		ServiceConfiguration.configurations.remove
# 			service: config.service

# 		ServiceConfiguration.configurations.insert config

# configCDN = (settings) ->
# 	if settings.CDN_PREFIX?
# 		WebAppInternals.setBundledJsCssPrefix settings.CDN_PREFIX
