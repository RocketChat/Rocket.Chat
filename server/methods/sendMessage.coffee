Meteor.methods
	sendMessage: (message) ->

		if not Meteor.userId()
			throw new Meteor.Error('invalid-user', "[methods] sendMessage -> Invalid user")

		console.log '[methods] sendMessage -> '.green, 'userId:', Meteor.userId(), 'arguments:', arguments

		user = Meteor.users.findOne Meteor.userId(), fields: username: 1

		room = Meteor.call 'canAccessRoom', message.rid, user._id

		if not room
			return false

		RocketChat.sendMessage user, message, room
