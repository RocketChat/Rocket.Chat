Meteor.startup ->
	UserPresence.awayTime = 300000
	UserPresence.start()
	Meteor.subscribe("activeUsers")

	Session.setDefault('flexOpened', false)
	Session.setDefault('AvatarRandom', 0)

	window.lastMessageWindow = {}
	window.lastMessageWindowHistory = {}

	@defaultUserLanguage = ->
		lng = window.navigator.userLanguage || window.navigator.language || 'en'
		# Fix browsers having all-lowercase language settings eg. pt-br, en-us
		re = /([a-z]{2}-)([a-z]{2})/
		if re.test lng
			lng = lng.replace re, (match, parts...) -> return parts[0] + parts[1].toUpperCase()
		return lng

	loadedLaguages = []

	setLanguage = (language) ->
		if loadedLaguages.indexOf(language) > -1
			return

		loadedLaguages.push language

		language = language.split('-').shift()
		TAPi18n.setLanguage(language)

		language = language.toLowerCase()
		if language isnt 'en'
			Meteor.call 'loadLocale', language, (data) ->
				moment.locale(language)

	Tracker.autorun (c) ->
		if Meteor.user()?.language?
			c.stop()

			localStorage.setItem("userLanguage", Meteor.user().language)
			setLanguage Meteor.user().language

	userLanguage = localStorage.getItem("userLanguage")
	userLanguage ?= defaultUserLanguage()

	setLanguage userLanguage
