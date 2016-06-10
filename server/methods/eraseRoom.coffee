Meteor.methods
	eraseRoom: (rid) ->
		if not Meteor.userId()
			throw new Meteor.Error 'error-invalid-user', 'Invalid user', { method: 'eraseRoom' }

		fromId = Meteor.userId()

		roomType = RocketChat.models.Rooms.findOneById(rid)?.t

		if RocketChat.authz.hasPermission( fromId, "delete-#{roomType}", rid )
			# ChatRoom.update({ _id: rid}, {'$pull': { userWatching: Meteor.userId(), userIn: Meteor.userId() }})

			RocketChat.models.Messages.removeByRoomId rid
			RocketChat.models.Subscriptions.removeByRoomId rid
			RocketChat.models.Rooms.removeById rid
			# @TODO remove das mensagens lidas do usuário
		else
			throw new Meteor.Error 'error-not-allowed', 'Not allowed', { method: 'eraseRoom' }
