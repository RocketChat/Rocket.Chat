Meteor.methods
	saveRoomSettings: (rid, setting, value) ->
		unless Match.test rid, String
			throw new Meteor.Error 'invalid-rid', 'Invalid room'

		if setting not in ['roomName', 'roomTopic', 'roomType']
			throw new Meteor.Error 'invalid-settings', 'Invalid settings provided'

		unless RocketChat.authz.hasPermission(Meteor.userId(), 'edit-room', rid)
			throw new Meteor.Error 503, 'Not authorized'

		room = RocketChat.models.Rooms.findOneById rid
		if room?
			switch setting
				when 'roomName'
					name = RocketChat.saveRoomName rid, value
					RocketChat.models.Messages.createRoomRenamedWithRoomIdRoomNameAndUser rid, name, Meteor.user()
				when 'roomTopic'
					if value isnt room.topic
						RocketChat.saveRoomTopic(rid, value)
						RocketChat.models.Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser 'room_changed_topic', rid, value, Meteor.user()
				when 'roomType'
					if value isnt room.t
						RocketChat.saveRoomType(rid, value)
						if value is 'c'
							message = TAPi18n.__('Channel')
						else
							message = TAPi18n.__('Private_Group')
						RocketChat.models.Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser 'room_changed_privacy', rid, message, Meteor.user()

		return true
