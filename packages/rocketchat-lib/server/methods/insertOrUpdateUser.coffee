Meteor.methods
	insertOrUpdateUser: (userData) ->

		check userData, Object

		if not Meteor.userId()
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'insertOrUpdateUser' })

		return RocketChat.saveUser(Meteor.userId(), userData);
