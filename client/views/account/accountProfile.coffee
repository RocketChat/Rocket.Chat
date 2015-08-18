Template.accountProfile.helpers
	flexOpened: ->
		return 'opened' if Session.equals('flexOpened', true)
	arrowPosition: ->
		console.log 'room.helpers arrowPosition' if window.rocketDebug
		return 'left' unless Session.equals('flexOpened', true)
	languages: ->
		languages = TAPi18n.getLanguages()
		result = []
		for key, language of languages
			result.push _.extend(language, { key: key })
		return _.sortBy(result, 'key')

	userLanguage: (key) ->
		return (localStorage.getItem('userLanguage') or defaultUserLanguage())?.split('-').shift().toLowerCase() is key

Template.accountProfile.onCreated ->
	settingsTemplate = this.parentTemplate(3)
	settingsTemplate.child ?= []
	settingsTemplate.child.push this

	@clearForm = ->
		@find('#language').value = localStorage.getItem('userLanguage')
		@find('#password').value = ''

	@save = ->
		instance = @
		data = {}
		reload = false
		selectedLanguage = $('#language').val()
		
		if localStorage.getItem('userLanguage') isnt selectedLanguage
			localStorage.setItem 'userLanguage', selectedLanguage
			data.language = selectedLanguage
			reload = true

		if _.trim $('#password').val()
			data.password = _.trim $('#password').val()

		Meteor.call 'saveUserProfile', data, (error, results) ->
			if results 
				toastr.success t('Profile_saved_successfully')
				instance.clearForm()
				if reload
					setTimeout -> 
						Meteor._reload.reload()
					, 1000

			if error
				toastr.error error.reason

Template.accountProfile.onRendered ->
	Tracker.afterFlush ->
		SideNav.setFlex "accountFlex"
		SideNav.openFlex()

Template.accountProfile.events
	'click .submit button': (e, t) ->
		t.save()
