Meteor.methods
	setStatusMessage: (status, message) ->
		userId = Meteor.userId()
		if not userId
			throw new Meteor.Error('invalid-user', "[methods] toogleFavorite -> Invalid user")

		console.log '[methods] setStatusMessage -> '.green, 'userId:', Meteor.userId(), 'arguments:', arguments

		user = Meteor.user()
		setField = { statusMessages:user.profile.statusMessages}
		setField.statusMessages[status] = message
		result = Meteor.users.update userId, {$set: { "profile": setField}}
