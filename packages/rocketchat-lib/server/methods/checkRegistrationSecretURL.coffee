Meteor.methods
	checkRegistrationSecretURL: (hash) ->

		check hash, String

		return hash is RocketChat.settings.get 'Accounts_RegistrationForm_SecretURL'
