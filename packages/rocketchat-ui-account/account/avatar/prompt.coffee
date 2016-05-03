Template.avatarPrompt.onCreated ->
	self = this
	self.suggestions = new ReactiveVar
	self.upload = new ReactiveVar

	self.getSuggestions = ->
		self.suggestions.set undefined
		Meteor.call 'getAvatarSuggestion', (error, avatars) ->
			self.suggestions.set
				ready: true
				avatars: avatars

	self.getSuggestions()

Template.avatarPrompt.onRendered ->
	Tracker.afterFlush ->
		# this should throw an error-template
		FlowRouter.go("home") if !RocketChat.settings.get("Accounts_AllowUserAvatarChange")
		SideNav.setFlex "accountFlex"
		SideNav.openFlex()

Template.avatarPrompt.helpers
	suggestions: ->
		return Template.instance().suggestions.get()

	suggestAvatar: (service) ->
		suggestions = Template.instance().suggestions.get()
		return RocketChat.settings.get("Accounts_OAuth_#{_.capitalize service}") and not suggestions.avatars[service]

	upload: ->
		return Template.instance().upload.get()

	username: ->
		return Meteor.user()?.username

	initialsUsername: ->
		return '@'+Meteor.user()?.username

Template.avatarPrompt.events
	'click .select-service': ->
		if @service is 'initials'
			Meteor.call 'resetAvatar', (err) ->
				if err?.details?.timeToReset?
					toastr.error t('error-too-many-requests', { seconds: parseInt(err.details.timeToReset / 1000) })
				else
					toastr.success t('Avatar_changed_successfully')
		else if @service is 'url'
			if _.trim $('#avatarurl').val()
				Meteor.call 'setAvatarFromService', $('#avatarurl').val(), '', @service, (err) ->
					if err
						if err.details?.timeToReset?
							toastr.error t('error-too-many-requests', { seconds: parseInt(err.details.timeToReset / 1000) })
						else
							toastr.error t('Avatar_url_invalid_or_error')
					else
						toastr.success t('Avatar_changed_successfully')
			else
				toastr.error t('Please_enter_value_for_url')
		else
			Meteor.call 'setAvatarFromService', @blob, @contentType, @service, (err) ->
				if err?.details?.timeToReset?
					toastr.error t('error-too-many-requests', { seconds: parseInt(err.details.timeToReset / 1000) })
				else
					toastr.success t('Avatar_changed_successfully')

	'click .login-with-service': (event, template) ->
		loginWithService = "loginWith#{_.capitalize(this)}"

		serviceConfig = {}

		Meteor[loginWithService] serviceConfig, (error) ->
			if error?.error is 'github-no-public-email'
				alert t("github_no_public_email")
				return

			console.log error
			if error?
				toastr.error error.message
				return

			template.getSuggestions()

	'change .avatar-file-input': (event, template) ->
		e = event.originalEvent or event
		files = e.target.files
		if not files or files.length is 0
			files = e.dataTransfer?.files or []

		for blob in files
			if not /image\/.+/.test blob.type
				return

			reader = new FileReader()
			reader.readAsDataURL(blob)
			reader.onloadend = ->
				template.upload.set
					service: 'upload'
					contentType: blob.type
					blob: reader.result
