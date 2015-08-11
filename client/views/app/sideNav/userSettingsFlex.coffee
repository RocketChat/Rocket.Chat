Template.userSettingsFlex.helpers
	languages: ->
		languages = TAPi18n.getLanguages()
		result = []
		for key, language of languages
			result.push _.extend(language, { key: key })
		return _.sortBy(result, 'key')

	userLanguage: (key) ->
		return localStorage.getItem('userLanguage')?.split('-').shift().toLowerCase() is key

Template.userSettingsFlex.events
	'mouseenter header': ->
		SideNav.overArrow()

	'mouseleave header': ->
		SideNav.leaveArrow()

	'click header': ->
		SideNav.closeFlex()

	'click .cancel-settings': ->
		SideNav.closeFlex()

	'click .input-submit .save': (e, instance) ->
		selectedLanguage = $('#language').val()
		if localStorage.getItem('userLanguage') isnt selectedLanguage
			localStorage.setItem 'userLanguage', selectedLanguage
			Meteor._reload.reload()

		if $('#password').val()
			Meteor.call 'setPassword', $('#password').val(), (err, results) ->
				if results 
					toastr.success t('Password_changed_successfully')
				if err
					toastr.error error.reason


		SideNav.closeFlex()
		instance.clearForm()

Template.userSettingsFlex.onCreated ->
	instance = this
	
	@clearForm = ->
		instance.find('#language').value = localStorage.getItem('userLanguage')
		instance.find('#password').value = ''
