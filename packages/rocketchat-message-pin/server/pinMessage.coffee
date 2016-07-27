Meteor.methods
	pinMessage: (message) ->
		if not Meteor.userId()
			throw new Meteor.Error('error-invalid-user', "Invalid user", { method: 'pinMessage' })

		if not RocketChat.settings.get 'Message_AllowPinning'
			throw new Meteor.Error 'error-action-not-allowed', 'Message pinning not allowed', { method: 'pinMessage', action: 'Message_pinning' }

		room = RocketChat.models.Rooms.findOne({ _id: message.rid })

		if Array.isArray(room.usernames) && room.usernames.indexOf(Meteor.user().username) is -1
			return false

		# If we keep history of edits, insert a new message to store history information
		if RocketChat.settings.get 'Message_KeepHistory'
			RocketChat.models.Messages.cloneAndSaveAsHistoryById message._id

		me = RocketChat.models.Users.findOneById Meteor.userId()

		message.pinned = true
		message.pinnedAt = Date.now
		message.pinnedBy =
			_id: Meteor.userId()
			username: me.username

		message = RocketChat.callbacks.run 'beforeSaveMessage', message

		RocketChat.models.Messages.setPinnedByIdAndUserId message._id, message.pinnedBy, message.pinned

		RocketChat.models.Messages.createWithTypeRoomIdMessageAndUser 'message_pinned', message.rid, '', me,
			attachments: [
				"text" : message.msg
				"author_name" : message.u.username,
				"author_icon" : getAvatarUrlFromUsername(message.u.username),
				"ts" : message.ts
			]

	unpinMessage: (message) ->
		if not Meteor.userId()
			throw new Meteor.Error('error-invalid-user', "Invalid user", { method: 'unpinMessage' })

		if not RocketChat.settings.get 'Message_AllowPinning'
			throw new Meteor.Error 'error-action-not-allowed', 'Message pinning not allowed', { method: 'unpinMessage', action: 'Message_pinning' }

		room = RocketChat.models.Rooms.findOne({ _id: message.rid })

		if Array.isArray(room.usernames) && room.usernames.indexOf(Meteor.user().username) is -1
			return false

		# If we keep history of edits, insert a new message to store history information
		if RocketChat.settings.get 'Message_KeepHistory'
			RocketChat.models.Messages.cloneAndSaveAsHistoryById message._id

		me = RocketChat.models.Users.findOneById Meteor.userId()

		message.pinned = false
		message.pinnedBy =
			_id: Meteor.userId()
			username: me.username

		message = RocketChat.callbacks.run 'beforeSaveMessage', message

		RocketChat.models.Messages.setPinnedByIdAndUserId message._id, message.pinnedBy, message.pinned


		# Meteor.defer ->
		# 	RocketChat.callbacks.run 'afterSaveMessage', RocketChat.models.Messages.findOneById(message.id)
