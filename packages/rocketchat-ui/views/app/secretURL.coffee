Template.secretURL.helpers
	registrationAllowed: ->
		return RocketChat.settings.get('Accounts_RegistrationForm') is 'Secret URL' and Template.instance().hashIsValid?.get()

	ready: ->
		return Template.instance().subscriptionsReady?() and Template.instance().hashReady?.get()


Template.secretURL.onCreated ->
	@hashIsValid = new ReactiveVar false
	@hashReady = new ReactiveVar false

	Meteor.call 'checkRegistrationSecretURL', FlowRouter.getParam('hash'), (err, success) =>
		@hashReady.set true
		if success
			Session.set 'loginDefaultState', 'register'
			KonchatNotification.getDesktopPermission()
			@hashIsValid.set true
		else
			@hashIsValid.set false

Template.secretURL.onRendered ->
	$('#initial-page-loading').remove()
