Meteor.methods
	setRealName: (name) ->
		if not Meteor.userId()
			throw new Meteor.Error('error-invalid-user', "Invalid user", { method: 'setRealName' })

		user = Meteor.user()

		if user.name is name
			return name

		if _.trim name
			name = _.trim name

		unless RocketChat.models.Users.setName Meteor.userId(), name
			throw new Meteor.Error 'error-could-not-change-name', "Could not change name", { method: 'setRealName' }

		return name
