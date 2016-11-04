Meteor.methods
	saveRoomSettings: (rid, setting, value) ->
		if not Meteor.userId()
			throw new Meteor.Error('error-invalid-user', "Invalid user", { function: 'RocketChat.saveRoomName' })

		unless Match.test rid, String
			throw new Meteor.Error 'error-invalid-room', 'Invalid room', { method: 'saveRoomSettings' }

		if setting not in ['roomName', 'roomTopic', 'roomDescription', 'roomType', 'readOnly', 'systemMessages', 'default', 'joinCode']
			throw new Meteor.Error 'error-invalid-settings', 'Invalid settings provided', { method: 'saveRoomSettings' }

		unless RocketChat.authz.hasPermission(Meteor.userId(), 'edit-room', rid)
			throw new Meteor.Error 'error-action-not-allowed', 'Editing room is not allowed', { method: 'saveRoomSettings', action: 'Editing_room' }

		if setting is 'default' and not RocketChat.authz.hasPermission(@userId, 'view-room-administration')
			throw new Meteor.Error 'error-action-not-allowed', 'Viewing room administration is not allowed', { method: 'saveRoomSettings', action: 'Viewing_room_administration' }

		room = RocketChat.models.Rooms.findOneById rid
		if room?
			switch setting
				when 'roomName'
					name = RocketChat.saveRoomName rid, value, Meteor.user()
				when 'roomTopic'
					if value isnt room.topic
						RocketChat.saveRoomTopic(rid, value, Meteor.user())
				when 'roomDescription'
					if value isnt room.description
						RocketChat.saveRoomDescription rid, value, Meteor.user()
				when 'roomType'
					if value isnt room.t
						RocketChat.saveRoomType(rid, value, Meteor.user())
				when 'readOnly'
					if value isnt room.ro
						RocketChat.saveRoomReadOnly rid, value, Meteor.user()
				when 'systemMessages'
					if value isnt room.sysMes
						RocketChat.saveRoomSystemMessages rid, value, Meteor.user()
				when 'joinCode'
					RocketChat.models.Rooms.setJoinCodeById rid, String(value)
				when 'default'
					RocketChat.models.Rooms.saveDefaultById rid, value

		return { result: true, rid: room._id }
