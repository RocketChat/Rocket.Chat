RocketChat.settings.onload 'CDN_PREFIX', (key, value, initialLoad) ->
	if value?.trim() isnt ''
		WebAppInternals?.setBundledJsCssPrefix value
