Meteor.methods
	updateUser: (userData) ->
		if not Meteor.userId()
			throw new Meteor.Error('invalid-user', "[methods] updateUser -> Invalid user")

		console.log '[methods] updateUser -> '.green, 'userId:', Meteor.userId(), 'arguments:', arguments

		user = Meteor.user()

		canEditUserPermission = RocketChat.authz.hasPermission( user._id, 'edit-other-user-info')
		if user._id isnt userData._id and canEditUserPermission isnt true
			throw new Meteor.Error 'not-authorized', '[methods] updateUser -> Not authorized'

		unless userData._id
			throw new Meteor.Error 'id-is-required', '[methods] updateUser -> User id is required'

		unless userData.name
			throw new Meteor.Error 'name-is-required', 'Name field is required'

		unless userData.username
			throw new Meteor.Error 'user-name-is-required', 'Username field is required'

		Meteor.users.update { _id: userData._id }, { $set: { name: userData.name } }

		Meteor.runAsUser userData._id, ->
			Meteor.call 'setUsername', userData.username

		return true