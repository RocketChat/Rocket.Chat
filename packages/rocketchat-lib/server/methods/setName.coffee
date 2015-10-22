Meteor.methods
	setName: (name) ->
		if not Meteor.userId()
			throw new Meteor.Error('invalid-user', "[methods] setName -> Invalid user")

		console.log '[methods] setName -> '.green, 'userId:', Meteor.userId(), 'arguments:', arguments

		user = Meteor.user()

		if user.name is name
			return name

		if not /^[0-9a-zA-Z-_. ]+$/.test name
			throw new Meteor.Error 'name-invalid', "#{name} is not a valid name, use only letters, numbers, dots, dashes, and spaces"

		unless RocketChat.models.Users.setName Meteor.userId(), name
			throw new Meteor.Error 'could-not-change-name', "Could not change name"

		return name
