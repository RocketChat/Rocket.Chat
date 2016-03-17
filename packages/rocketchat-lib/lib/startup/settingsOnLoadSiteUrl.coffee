if Meteor.isServer
	url = Npm.require('url')

RocketChat.settings.get 'Site_Url', (key, value) ->
	if value?.trim() isnt ''
		__meteor_runtime_config__.ROOT_URL = value
		__meteor_runtime_config__.DDP_DEFAULT_CONNECTION_URL = value
		if Meteor.absoluteUrl.defaultOptions?.rootUrl?
			Meteor.absoluteUrl.defaultOptions.rootUrl = value

		if Meteor.isServer
			RocketChat.hostname = url.parse(value).hostname

			process.env.MOBILE_ROOT_URL = value
			process.env.MOBILE_DDP_URL = value
			if WebAppInternals?.generateBoilerplate
				WebAppInternals.generateBoilerplate()
