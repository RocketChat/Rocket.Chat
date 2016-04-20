Meteor.methods
	starMessage: (message) ->
		if not Meteor.userId()
			throw new Meteor.Error('error-invalid-user', "Invalid user", { method: 'starMessage' })

		if not RocketChat.settings.get 'Message_AllowStarring'
			throw new Meteor.Error 'error-action-not-allowed', 'Message starring not allowed', { method: 'pinMessage', action: 'Message_starring' }

		RocketChat.models.Messages.updateUserStarById(message._id, Meteor.userId(), message.starred)
