Template.username.onCreated ->
	self = this
	self.username = new ReactiveVar

	Meteor.call 'getUsernameSuggestion', (error, username) ->
		self.username.set
			ready: true
			username: username
		Meteor.defer ->
			self.find('input').focus()

Template.username.helpers
	username: ->
		return Template.instance().username.get()

Template.username.events
	'submit #login-card': (event, instance) ->
		event.preventDefault()

		username = instance.username.get()
		username.empty = false
		username.error = false
		username.invalid = false
		instance.username.set(username)

		button = $(event.target).find('button.login')
		RocketChat.Button.loading(button)

		value = $("input").val().trim()
		if value is ''
			username.empty = true
			instance.username.set(username)
			RocketChat.Button.reset(button)
			return

		if RocketChat.settings.get('Accounts_AnonymousAccess') isnt 'None'
			Meteor.call 'registerAnonymousUser', value, (err, password) ->
				if err
					toastr.error err.reason
					RocketChat.Button.reset(button)
				else
					Meteor.loginWithPassword value, password, (error) ->
						RocketChat.Button.reset(button)
						if error?.error is 'no-valid-email'
							toastr.success t('We_have_sent_registration_email')
							instance.state.set 'login'
						else if error?.error is 'inactive-user'
							instance.state.set 'wait-activation'

						if not error?
							Meteor.call 'joinDefaultChannels'
		else
			Meteor.call 'setUsername', value, (err, result) ->
				if err?
					console.log err
					if err.error is 'username-invalid'
						username.invalid = true
					else
						username.error = true
					username.username = value

				RocketChat.Button.reset(button)
				instance.username.set(username)

			if not err?
				Meteor.call 'joinDefaultChannels'
