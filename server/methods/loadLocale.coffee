Meteor.methods
	loadLocale: (locale) ->
		console.log "[method] loadLocale: #{locale}".green
		try
			return Assets.getText "moment-locales/#{locale.toLowerCase()}.js"
		catch e
			console.log e
