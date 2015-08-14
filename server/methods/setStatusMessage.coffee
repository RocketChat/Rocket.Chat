Meteor.methods
	setStatusMessage: (status, message) ->
		userId = Meteor.userId()
		if not userId
			throw new Meteor.Error('invalid-user', "[methods] toogleFavorite -> Invalid user")

		console.log '[methods] setStatusMessage -> '.green, 'userId:', Meteor.userId(), 'arguments:', arguments

		user = Meteor.user()
		statusMessages = user?.profile?.statusMessages || {}
		statusMessages[status] = message
		Meteor.users.update userId, {$set: { "profile.statusMessages": statusMessages}}
		console.log '[methods] setStatusMessage -> '.green, 'userId:', Meteor.userId(), 'arguments:', statusMessages


