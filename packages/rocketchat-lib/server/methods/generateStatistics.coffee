Meteor.methods
	generateStatistics: ->
		if not Meteor.userId()
			throw new Meteor.Error('invalid-user', "[methods] generateStatistics -> Invalid user")

		console.log '[methods] generateStatistics -> '.green, 'userId:', Meteor.userId(), 'arguments:', arguments

		unless Meteor.user()?.admin is true
			throw new Meteor.Error 'not-authorized', '[methods] setAdminStatus -> Not authorized'

		return RocketChat.getStatistics()