Template.accountProfile.helpers
	languages: ->
		languages = TAPi18n.getLanguages()
		result = []
		for key, language of languages
			result.push _.extend(language, { key: key })
		return _.sortBy(result, 'key')

	userLanguage: (key) ->
		return (Meteor.user().language or defaultUserLanguage())?.split('-').shift().toLowerCase() is key

	realname: ->
		return Meteor.user().name

	username: ->
		return Meteor.user().username

	email: ->
		return Meteor.user().emails?[0]?.address

	allowUsernameChange: ->
		return RocketChat.settings.get("Accounts_AllowUsernameChange") and RocketChat.settings.get("LDAP_Enable") isnt true

	allowEmailChange: ->
		return RocketChat.settings.get("Accounts_AllowEmailChange")

	usernameChangeDisabled: ->
		return t('Username_Change_Disabled')

	allowPasswordChange: ->
		return RocketChat.settings.get("Accounts_AllowPasswordChange")

	passwordChangeDisabled: ->
		return t('Password_Change_Disabled')

Template.accountProfile.onCreated ->
	settingsTemplate = this.parentTemplate(3)
	settingsTemplate.child ?= []
	settingsTemplate.child.push this

	@clearForm = ->
		@find('#language').value = localStorage.getItem('userLanguage')
		@find('#oldPassword').value = ''
		@find('#password').value = ''

	@changePassword = (oldPassword, newPassword, callback) ->
		instance = @
		if not oldPassword and not newPassword
			return callback()

		else if !!oldPassword ^ !!newPassword
			toastr.warning t('Old_and_new_password_required')

		else if newPassword and oldPassword
			if !RocketChat.settings.get("Accounts_AllowPasswordChange")
				toastr.error t('Password_Change_Disabled')
				instance.clearForm()
				return
			Accounts.changePassword oldPassword, newPassword, (error) ->
				if error
					toastr.error t('Incorrect_Password')
				else
					return callback()

	@save = ->
		instance = @

		oldPassword = _.trim($('#oldPassword').val())
		newPassword = _.trim($('#password').val())

		instance.changePassword oldPassword, newPassword, ->
			data = {}
			reload = false
			selectedLanguage = $('#language').val()

			if localStorage.getItem('userLanguage') isnt selectedLanguage
				localStorage.setItem 'userLanguage', selectedLanguage
				data.language = selectedLanguage
				reload = true

			if _.trim $('#realname').val()
				data.realname = _.trim $('#realname').val()

			if _.trim $('#username').val()
				if !RocketChat.settings.get("Accounts_AllowUsernameChange")
					toastr.error t('Username_Change_Disabled')
					instance.clearForm()
					return
				else
					data.username = _.trim $('#username').val()

			if _.trim $('#email').val()
				if !RocketChat.settings.get("Accounts_AllowEmailChange")
					toastr.error t('Email_Change_Disabled')
					instance.clearForm()
					return
				else
					data.email = _.trim $('#email').val()

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
		# this should throw an error-template
		FlowRouter.go("home") if !RocketChat.settings.get("Accounts_AllowUserProfileChange")
		SideNav.setFlex "accountFlex"
		SideNav.openFlex()

Template.accountProfile.events
	'click .submit button': (e, t) ->
		t.save()
	'click .logoutOthers button': (event, templateInstance) ->
		Meteor.logoutOtherClients (error) ->
			if error
				toastr.error error.reason
			else
				toastr.success t('Logged_out_of_other_clients_successfully')
