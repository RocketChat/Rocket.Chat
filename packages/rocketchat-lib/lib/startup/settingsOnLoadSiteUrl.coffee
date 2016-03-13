if Meteor.isServer
	url = Npm.require('url')

RocketChat.settings.get 'Site_Url', (key, value) ->
	if value?.trim() isnt ''
		__meteor_runtime_config__.ROOT_URL = value
		if Meteor.absoluteUrl.defaultOptions?.rootUrl?
			Meteor.absoluteUrl.defaultOptions.rootUrl = value

		if Meteor.isServer
			RocketChat.hostname = url.parse(value).hostname
