Template.loginFooter.helpers
	LanguageVersion: ->
		if Template.instance().languageVersion.get()
			return TAPi18n.__('Language_Version', { lng: Template.instance().languageVersion.get() })

Template.loginFooter.events
	'click button.switch-language': (e, t) ->
		userLanguage = t.languageVersion.get()
		localStorage.setItem("userLanguage", userLanguage)
		TAPi18n.setLanguage(userLanguage)
		moment.locale(userLanguage)
		t.languageVersion.set(if userLanguage isnt defaultUserLanguage() then defaultUserLanguage() else 'en')

Template.loginFooter.onCreated ->
	self = @
	@languageVersion = new ReactiveVar

	userLanguage = localStorage.getItem('userLanguage')
	if userLanguage isnt defaultUserLanguage()
		TAPi18n._loadLanguage(defaultUserLanguage()).done ->
			self.languageVersion.set defaultUserLanguage()
	else if userLanguage.indexOf('en') isnt 0
		TAPi18n._loadLanguage('en').done ->
			self.languageVersion.set 'en'
