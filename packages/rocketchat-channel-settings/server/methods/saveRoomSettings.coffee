Meteor.methods
	saveRoomSettings: (rid, settings) ->
		console.log '[method] saveRoomSettings'.green, rid, settings

		unless Match.test rid, String
			throw new Meteor.Error 'invalid-rid', 'Invalid room'

		unless Match.test settings, Match.ObjectIncluding { roomName: String, roomTopic: String, roomType: String }
			throw new Meteor.Error 'invalid-settings', 'Invalid settings provided'

		unless RocketChat.authz.hasPermission(Meteor.userId(), 'edit-room', rid)
			throw new Meteor.Error 503, 'Not authorized'

		room = RocketChat.models.Rooms.findOneById rid
		if room?
			if settings.roomType isnt room.t
				RocketChat.changeRoomType(rid, settings.roomType)

				if settings.roomType is 'c'
					message = TAPi18n.__('Channel')
				else
					message = TAPi18n.__('Private_Group')

				RocketChat.models.Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser 'room_changed_privacy', rid, message, Meteor.user()

			if settings.roomName isnt room.name
				name = Meteor.call 'saveRoomName', rid, settings.roomName

			if settings.roomTopic isnt room.topic
				RocketChat.changeRoomTopic(rid, settings.roomTopic)
				message = settings.roomTopic
				RocketChat.models.Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser 'room_changed_topic', rid, message, Meteor.user()

		return true
