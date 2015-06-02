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


Template.avatarPrompt.helpers
	suggestions: ->
		return Template.instance().suggestions.get()

	upload: ->
		return Template.instance().upload.get()


Template.avatarPrompt.events
	'click .select-service': (e) ->
		Meteor.call 'setAvatarFromService', this.blob, this.service, ->
			Session.set('AvatarRandom', Date.now())
			console.log arguments

	'click .login-with-service': (event, template) ->
		loginWithService = "loginWith#{_.capitalize(this)}"

		serviceConfig = {}

		Meteor[loginWithService] serviceConfig, (error) ->
			if error?.error is 'github-no-public-email'
				alert t("loginServices.github_no_public_email")
				return

			console.log error
			if error?
				toastr.error error.message
				return

			template.getSuggestions()

	'change .myFileInput': (event, template) ->
		FS.Utility.eachFile event, (blob) ->
			reader = new FileReader()
			reader.readAsDataURL(blob)
			reader.onloadend = ->
				template.upload.set
					service: 'upload'
					blob: reader.result
