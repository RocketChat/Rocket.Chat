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
	'focus .input-text input': (event) ->
		$(event.currentTarget).parents('.input-text').addClass('focus')

	'blur .input-text input': (event) ->
		if event.currentTarget.value is ''
			$(event.currentTarget).parents('.input-text').removeClass('focus')

	'submit #login-card': (event, instance) ->
		event.preventDefault()

		username = instance.username.get()
		username.empty = false
		username.error = false
		username.invalid = false
		instance.username.set(username)

		button = $(event.target).find('button.login')
		RocketChat.Button.loading(button)

		value = $("#username").val().trim()
		if value is ''
			username.empty = true
			instance.username.set(username)
			RocketChat.Button.reset(button)
			return

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
			RocketChat.callbacks.run('usernameSet')
