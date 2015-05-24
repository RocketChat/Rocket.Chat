Template.loginForm.helpers
	userName: ->
		return Meteor.user()?.username

	showName: ->
		return 'hidden' unless Template.instance().state.get() is 'register'

	showPassword: ->
		return 'hidden' unless Template.instance().state.get() in ['login', 'register']

	showConfirmPassword: ->
		return 'hidden' unless Template.instance().state.get() is 'register'

	showRegisterLink: ->
		return 'hidden' unless Template.instance().state.get() is 'login'

	showForgotPasswordLink: ->
		return 'hidden' unless Template.instance().state.get() is 'login'

	showBackToLoginLink: ->
		return 'hidden' unless Template.instance().state.get() in ['register', 'forgot-password', 'email-verification']

	btnLoginSave: ->
		switch Template.instance().state.get()
			when 'register'
				return t('general.Submit')
			when 'login'
				return t('general.Login')
			when 'email-verification'
				return t('general.Send_confirmation_email')
			when 'forgot-password'
				return t('general.Reset_password')

Template.loginForm.events
	'submit #login-card': (event) ->
		event.preventDefault()

		console.warn 'submit', event

		button = $(event.target).find('button.login')

		Rocket.Button.loading(button)

		template = Template.instance()

		if template.state.get() is 'email-verification'
			rawData = Mesosphere.Utils.getFormData $(event.target)
			Meteor.call 'sendConfirmationEmail', rawData.email, (err, result) ->
				template.state.set 'login'
			return

		if template.state.get() is 'forgot-password'
			rawData = Mesosphere.Utils.getFormData $(event.target)
			Meteor.call 'sendForgotPasswordEmail', rawData.email, (err, result) ->
				template.state.set 'login'
			return

		mesosphereForm = if template.state.get() is 'register' then 'login-card-register' else 'login-card'

		rawData = Mesosphere.Utils.getFormData $(event.target)
		Mesosphere[mesosphereForm].validate rawData, (err, formData) ->
			if err
				Rocket.Button.reset(button)
				$("#login-card h2").addClass "error"
			else
				$("#login-card h2").removeClass "error"
				if template.state.get() is 'register'
					Meteor.call 'registerUser', formData, (err, result) ->
						Meteor.loginWithPassword formData.email, formData.pass, (error) ->
							template.state.set 'login'
							if error.error is 'no-valid-email'
								template.state.set 'email-verification'
								return
							Router.go 'index'
				else
					Meteor.loginWithPassword formData.email, formData.pass, (error) ->
						$("#login-card h2").addClass "error"
						Rocket.Button.reset(button)
						if error?
							if error.error is 'no-valid-email'
								template.state.set 'email-verification'
							else
								toastr.error error.reason
							return
						Router.go 'index'

	'click .register': ->
		Template.instance().state.set 'register'

	'click .back-to-login': ->
		Template.instance().state.set 'login'

	'click .forgot-password': ->
		Template.instance().state.set 'forgot-password'

Template.loginForm.onCreated ->
	this.state = new ReactiveVar('login')

Template.loginForm.onRendered ->
	Tracker.autorun =>
		switch this.state.get()
			when 'login', 'forgot-password', 'email-verification'
				Meteor.defer ->
					$('input[name=email]').select().focus()

			when 'register'
				Meteor.defer ->
					$('input[name=name]').select().focus()
