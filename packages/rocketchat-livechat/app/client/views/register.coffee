Template.register.helpers
	error: ->
		return Template.instance().error.get()

	title: ->
		return '' unless Template.instance().subscriptionsReady()
		return Settings.findOne('Livechat_title')?.value or 'Rocket.Chat'

	color: ->
		return 'transparent' unless Template.instance().subscriptionsReady()
		return Settings.findOne('Livechat_title_color')?.value or '#C1272D'

	welcomeMessage: ->
		return ""

Template.register.events
	'submit #livechat-registration': (e, instance) ->
		e.preventDefault()

		$name = instance.$('input[name=name]')
		$email = instance.$('input[name=email]')

		unless $name.val().trim() and $email.val().trim()
			return instance.showError TAPi18n.__('Please_fill_name_and_email')
		else
			Meteor.call 'registerGuest', visitor.getToken(), $name.val(), $email.val(), (error, result) ->
				if error?
					return instance.showError error.reason

				Meteor.loginWithToken result.token, (error) ->
					if error
						return instance.showError error.reason

	'click .error': (e, instance) ->
		instance.hideError()

Template.register.onCreated ->
	@subscribe 'settings', ['Livechat_title', 'Livechat_title_color']
	@error = new ReactiveVar

	@showError = (msg) =>
		$('.error').addClass('show')
		@error.set msg
		return

	@hideError = =>
		$('.error').removeClass('show')
		@error.set()
		return

