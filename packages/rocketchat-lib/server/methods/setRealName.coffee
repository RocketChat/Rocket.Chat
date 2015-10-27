Meteor.methods
	setRealName: (name) ->
		if not Meteor.userId()
			throw new Meteor.Error('invalid-user', "[methods] setRealName -> Invalid user")

		console.log '[methods] setRealName -> '.green, 'userId:', Meteor.userId(), 'arguments:', arguments

		user = Meteor.user()

		if user.name is name
			return name

		if _.trim name
			name = _.trim name

		unless RocketChat.models.Users.setName Meteor.userId(), name
			throw new Meteor.Error 'could-not-change-name', "Could not change name"

		return name
