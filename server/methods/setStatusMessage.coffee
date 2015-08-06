Meteor.methods
	setStatusMessage: (status, message) ->
		userId = Meteor.userId()
		if not userId
			throw new Meteor.Error('invalid-user', "[methods] toogleFavorite -> Invalid user")

		console.log '[methods] setStatusMessage -> '.green, 'userId:', Meteor.userId(), 'arguments:', arguments

		field = 'status' + status
		query = {_id: userId}
		query[field] = message
		Meteor.users.update(query, {$set: {statusMessage: message}});
