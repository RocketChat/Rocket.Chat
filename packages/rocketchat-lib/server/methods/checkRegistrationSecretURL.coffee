Meteor.methods
	checkRegistrationSecretURL: (hash) ->
		console.log '[method] checkRegistrationSecretURL'.green, hash
		return hash is RocketChat.settings.get 'Accounts_RegistrationForm_SecretURL'
