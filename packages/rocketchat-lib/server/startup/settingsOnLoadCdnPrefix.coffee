RocketChat.settings.onload 'CDN_PREFIX', (key, value, initialLoad) ->
	if _.isString value
		if !!value
			WebAppInternals?.setBundledJsCssPrefix value

Meteor.startup ->
	value = RocketChat.settings.get 'CDN_PREFIX'
	if _.isString value
		if !!value
			WebAppInternals?.setBundledJsCssPrefix value
