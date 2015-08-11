Meteor.methods
	setPassword: (password) ->
		if Meteor.userId()
			Accounts.setPassword Meteor.userId(), password, { logout: false }
			return true