Template.loginForm.helpers
	userName: ->
		return Meteor.user()?.username

	showName: ->
		return 'hidden' unless Template.instance().state.get() is 'register'

	showPassword: ->
		return 'hidden' unless Template.instance().state.get() in ['login', 'register']

	showConfirmPassword: ->
		return 'hidden' unless Template.instance().state.get() is 'register'

	showEmailOrUsername: ->
		return 'hidden' unless Template.instance().state.get() is 'login'

	showEmail: ->
		return 'hidden' unless Template.instance().state.get() in ['register', 'forgot-password', 'email-verification']

	showRegisterLink: ->
		return 'hidden' unless Template.instance().state.get() is 'login'

	showForgotPasswordLink: ->
		return 'hidden' unless Template.instance().state.get() is 'login'

	showBackToLoginLink: ->
		return 'hidden' unless Template.instance().state.get() in ['register', 'forgot-password', 'email-verification', 'wait-activation']

	btnLoginSave: ->
		switch Template.instance().state.get()
			when 'register'
				return t('Submit')
			when 'login'
				return t('Login')
			when 'email-verification'
				return t('Send_confirmation_email')
			when 'forgot-password'
				return t('Reset_password')

	waitActivation: ->
		return Template.instance().state.get() is 'wait-activation'
		
Template.loginForm.events
	'submit #login-card': (event, instance) ->
		event.preventDefault()

		button = $(event.target).find('button.login')
		RocketChat.Button.loading(button)

		formData = instance.validate()
		if formData
			if instance.state.get() is 'email-verification'
				Meteor.call 'sendConfirmationEmail', formData.email, (err, result) ->
					RocketChat.Button.reset(button)
					toastr.success t('We_have_sent_registration_email')
					instance.state.set 'login'
				return

			if instance.state.get() is 'forgot-password'
				Meteor.call 'sendForgotPasswordEmail', formData.email, (err, result) ->
					RocketChat.Button.reset(button)
					toastr.success t('We_have_sent_password_email')
					instance.state.set 'login'
				return

			if instance.state.get() is 'register'
				Meteor.call 'registerUser', formData, (error, result) ->
					RocketChat.Button.reset(button)

					if error?
						if error.error is 'Email already exists.'
							toastr.error t 'Email_already_exists'
						else
							toastr.error error.reason
						return

					Meteor.loginWithPassword formData.email, formData.pass, (error) ->
						if error?.error is 'no-valid-email'
							toastr.success t('We_have_sent_registration_email')
							instance.state.set 'login'
						else if error?.error is 'inactive-user'
							instance.state.set 'wait-activation'
						# else
							# FlowRouter.go 'index'
			else
				Meteor.loginWithPassword formData.emailOrUsername, formData.pass, (error) ->
					RocketChat.Button.reset(button)
					if error?
						if error.error is 'no-valid-email'
							instance.state.set 'email-verification'
						else
							toastr.error error.reason
						return
					FlowRouter.go 'index'

	'click .register': ->
		Template.instance().state.set 'register'

	'click .back-to-login': ->
		Template.instance().state.set 'login'

	'click .forgot-password': ->
		Template.instance().state.set 'forgot-password'

Template.loginForm.onCreated ->
	instance = @
	@state = new ReactiveVar('login')
	@validate = ->
		formData = $("#login-card").serializeArray()
		formObj = {}
		validationObj = {}

		for field in formData
			formObj[field.name] = field.value

		if instance.state.get() isnt 'login'
			unless formObj['email'] and /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]+\b/i.test(formObj['email'])
				validationObj['email'] = t('Invalid_email')

		if instance.state.get() isnt 'forgot-password'
			unless formObj['pass']
				validationObj['pass'] = t('Invalid_pass')

		if instance.state.get() is 'register'
			unless formObj['name']
				validationObj['name'] = t('Invalid_name')
			if formObj['confirm-pass'] isnt formObj['pass']
				validationObj['confirm-pass'] = t('Invalid_confirm_pass')

		$("#login-card input").removeClass "error"
		unless _.isEmpty validationObj
			button = $('#login-card').find('button.login')
			RocketChat.Button.reset(button)
			$("#login-card h2").addClass "error"
			for key of validationObj
				$("#login-card input[name=#{key}]").addClass "error"
			return false

		$("#login-card h2").removeClass "error"
		$("#login-card input.error").removeClass "error"
		return formObj

Template.loginForm.onRendered ->
	Tracker.autorun =>
		switch this.state.get()
			when 'login', 'forgot-password', 'email-verification'
				Meteor.defer ->
					$('input[name=email]').select().focus()

			when 'register'
				Meteor.defer ->
					$('input[name=name]').select().focus()
