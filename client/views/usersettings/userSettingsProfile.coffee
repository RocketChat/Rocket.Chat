Template.userSettingsProfile.helpers
	languages: ->
		languages = TAPi18n.getLanguages()
		result = []
		for key, language of languages
			result.push _.extend(language, { key: key })
		return _.sortBy(result, 'key')

	userLanguage: (key) ->
		return localStorage.getItem('userLanguage')?.split('-').shift().toLowerCase() is key

Template.userSettingsProfile.onCreated ->
	instance = this
	
	@clearForm = ->
		instance.find('#language').value = localStorage.getItem('userLanguage')
		instance.find('#password').value = ''

	@save = ->
		console.log 'Save called'