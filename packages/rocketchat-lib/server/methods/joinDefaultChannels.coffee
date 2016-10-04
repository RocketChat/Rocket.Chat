Meteor.methods
	joinDefaultChannels: (silenced) ->
		check silenced, Match.Optional(Boolean)

		if not Meteor.userId()
			throw new Meteor.Error('error-invalid-user', "Invalid user", { method: 'joinDefaultChannels' })

		this.unblock();
		RocketChat.addUserToDefaultChannels(Meteor.user(), silenced);
