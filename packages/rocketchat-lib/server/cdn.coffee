Meteor.startup ->
	cdnPrefix = RocketChat.settings.get 'CDN_PREFIX'
	if cdnPrefix?.trim?() isnt ''
		WebAppInternals.setBundledJsCssPrefix cdnPrefix
