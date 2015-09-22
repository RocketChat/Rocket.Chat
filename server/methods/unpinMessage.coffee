Meteor.methods
	unpinMessage: (message) ->
		if not Meteor.userId()
			throw new Meteor.Error('invalid-user', "[methods] unpinMessage -> Invalid user")

		if not RocketChat.settings.get 'Message_AllowPinning'
			throw new Meteor.Error 'message-pinning-not-allowed', "[methods] unpinMessage -> Message pinning not allowed"

		console.log '[methods] unpinMessage -> '.green, 'userId:', Meteor.userId(), 'arguments:', arguments

		# If we keep history of edits, insert a new message to store history information
		if RocketChat.settings.get 'Message_KeepHistory'
			RocketChat.models.Messages.cloneAndSaveAsHistoryById message._id

		message.pinned = false

		message = RocketChat.callbacks.run 'beforeSaveMessage', message

		RocketChat.models.Messages.setPinnedByIdAndUserId message._id, Meteor.userId(), message.pinned


		# Meteor.defer ->
		# 	RocketChat.callbacks.run 'afterSaveMessage', RocketChat.models.Messages.findOneById(message.id)
