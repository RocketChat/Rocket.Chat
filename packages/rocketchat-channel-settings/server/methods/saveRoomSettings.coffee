Meteor.methods
	saveRoomSettings: (rid, settings) ->
		console.log '[method] saveRoomSettings'.green, rid, settings

		unless Match.test rid, String
			throw new Meteor.Error 'invalid-rid'

		unless Match.test settings, Match.ObjectIncluding { roomType: String }
			throw new Meteor.Error 'invalid-settings'

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

		return true
