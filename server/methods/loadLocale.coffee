Meteor.methods
	loadLocale: (locale) ->
		try
			return Assets.getText "moment-locales/#{locale.toLowerCase()}.js"
		catch e
			console.log e
