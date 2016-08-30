Meteor.methods
	joinDefaultChannels: (silenced) ->
		if not Meteor.userId()
			throw new Meteor.Error('error-invalid-user', "Invalid user", { method: 'joinDefaultChannels' })

		this.unblock();
		RocketChat.addUserToDefaultChannels(Meteor.user(), silenced);
