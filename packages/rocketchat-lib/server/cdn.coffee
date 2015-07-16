Meteor.startup ->
	cdnPrefix = RocketChat.settings.get 'CDN_PREFIX'
	if cdnPrefix? 
		WebAppInternals.setBundledJsCssPrefix cdnPrefix
