Meteor.methods
	removeUserFromRoom: (data) ->
		fromId = Meteor.userId()
		# console.log '[methods] removeUserFromRoom -> '.green, 'fromId:', fromId, 'data:', data

		room = ChatRoom.findOne data.rid

		if room.u?._id isnt Meteor.userId() and room.t is 'c'
			throw new Meteor.Error 403, 'Not allowed'

		update =
			$pull:
				usernames: data.username

		removedUser = Meteor.users.findOne username: data.username

		ChatRoom.update data.rid, update

		ChatSubscription.remove { 'u._id': data.username, rid: data.rid }

		switch room.t
			when 'c'
				RocketChat.authz.removeUsersFromRole(removedUser._id; 'channel-moderator',  data.rid)
			when 'p'
				RocketChat.authz.removeUsersFromRole(removedUser._id; 'group-moderator',  data.rid)

		ChatMessage.insert
			rid: data.rid
			ts: (new Date)
			t: 'ru'
			msg: removedUser.name
			u:
				_id: Meteor.userId()
				username: Meteor.user().username

		return true
