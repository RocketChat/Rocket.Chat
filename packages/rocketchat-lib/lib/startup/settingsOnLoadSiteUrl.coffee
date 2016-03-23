RocketChat.settings.get 'Site_Url', (key, value) ->
	if value?.trim() isnt ''
		host = value.replace(/\/$/, '')
		prefix = ""
		match = value.match(/([^/]+\/{2}[^/]+)(\/.+)/)
		if match?
			host = match[1]
			prefix = match[2].replace(/\/$/, '')

		__meteor_runtime_config__.ROOT_URL = host
		__meteor_runtime_config__.ROOT_URL_PATH_PREFIX = prefix
		__meteor_runtime_config__.DDP_DEFAULT_CONNECTION_URL = host
		if Meteor.absoluteUrl.defaultOptions?.rootUrl?
			Meteor.absoluteUrl.defaultOptions.rootUrl = host

		if Meteor.isServer
			RocketChat.hostname = host

			process.env.MOBILE_ROOT_URL = host
			process.env.MOBILE_DDP_URL = host
			if WebAppInternals?.generateBoilerplate
				WebAppInternals.generateBoilerplate()
