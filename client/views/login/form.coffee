Template.loginForm.helpers
	userName: ->
		return Meteor.user()?.username

	needsValidateEmail: ->
		return Template.instance().needsValidateEmail.get()

	registering: ->
		return 'hidden' unless Session.get('registering')

	btnLoginSave: ->
		return if Session.get('registering') then t('general.Submit') else t('Login')

	btnCancelRegister: ->
		return if Session.get('registering') then t('login.Cancel') else t('login.Register')

Template.loginForm.events
	'submit #login-card': (event) ->
		event.preventDefault()

		console.warn 'submit', event

		button = $(event.target).find('button.login')

		Rocket.Button.loading(button)

		template = Template.instance()

		if template.needsValidateEmail.get() is true
			rawData = Mesosphere.Utils.getFormData $(event.target)
			Meteor.call 'sendConfirmationEmail', rawData.email, (err, result) ->
				template.needsValidateEmail.set false
			return

		mesosphereForm = if Session.get('registering') then 'login-card-register' else 'login-card'

		rawData = Mesosphere.Utils.getFormData $(event.target)
		Mesosphere[mesosphereForm].validate rawData, (err, formData) ->
			if err
				Rocket.Button.reset(button)
				$("#login-card h2").addClass "error"
			else
				$("#login-card h2").removeClass "error"
				if Session.get('registering')
					Meteor.call 'registerUser', formData, (err, result) ->
						Meteor.loginWithPassword formData.email, formData.pass, (error) ->
							Session.set('registering', false)
							if error.error is 'no-valid-email'
								template.needsValidateEmail.set(true)
								return
							Router.go 'index'
				else
					Meteor.loginWithPassword formData.email, formData.pass, (error) ->
						$("#login-card h2").addClass "error"
						Rocket.Button.reset(button)
						if error?
							if error.error is 'no-valid-email'
								template.needsValidateEmail.set(true)
							else
								toastr.error error.reason
							return
						Router.go 'index'

	'click .register': ->
		Session.set('registering', !Session.get('registering'))

		if Session.get('registering')
			Meteor.defer ->
				$('input[name=name]').select().focus()

Template.loginForm.onCreated ->
	this.needsValidateEmail = new ReactiveVar(false)
