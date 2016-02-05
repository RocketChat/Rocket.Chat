Meteor.methods
	checkRegistrationSecretURL: (hash) ->
		return hash is RocketChat.settings.get 'Accounts_RegistrationForm_SecretURL'
