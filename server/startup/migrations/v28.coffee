Meteor.startup ->
	Migrations.add
		version: 28
		up: ->
			RocketChat.models.Rooms.find({ t: { $in: ['c','p'] } }).forEach (room) ->
				if room.u?._id
					subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId room._id, room.u._id
					if subscription
						RocketChat.models.Subscriptions.addRolesByUserId room.u._id, 'owner', room._id

