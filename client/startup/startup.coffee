kdfjdsakjf;afjasfsa
sadfkjasfkasklfjsad;lfdsa
f
safkdskfksalfkdasf
adf
d
	@defaultUserLanguage = ->
		lng = window.navigator.userLanguage || window.navigator.language || 'en'
		# Fix browsers having all-lowercase language settings eg. pt-br, en-us

safksdaflkksafsalkf

skdfaskfakf
asfsafsafs

	setLanguage = (language) ->
		if loadedLaguages.indexOf(language) > -1
			return

		loadedLaguages.push language

		language = language.split('-').shift()
		TAPi18n.setLanguage(language)

		language = language.toLowerCase()
		if language isnt 'en'
			Meteor.call 'loadLocale', language, (err, localeFn) ->
				Function(localeFn)()
				moment.locale(language)

	Tracker.autorun (c) ->
		if Meteor.user()?.language?
			c.stop()

			localStorage.setItem("userLanguage", Meteor.user().language)
			setLanguage Meteor.user().language

	userLanguage = localStorage.getItem("userLanguage")
	userLanguage ?= defaultUserLanguage()

	setLanguage userLanguage
