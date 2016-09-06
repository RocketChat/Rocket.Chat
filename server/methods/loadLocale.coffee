Meteor.methods
	loadLocale: (locale) ->

		check locale, String

		try
			return Assets.getText "moment-locales/#{locale.toLowerCase()}.js"
		catch e
			console.log e
