Meteor.methods
	unArchiveRoom: (rid) ->
		if not Meteor.userId()
			throw new Meteor.Error 'invalid-user', '[methods] unArchiveRoom -> Invalid user'

		console.log '[methods] unArchiveRoom -> '.green, 'userId:', Meteor.userId(), 'arguments:', arguments

		room = ChatRoom.findOne rid

		if room.u? and room.u._id is Meteor.userId() or RocketChat.authz.hasRole(Meteor.userId(), 'admin')
			update =
				$set:
					archived: false

			ChatRoom.update rid, update

			for username in room.usernames
				member = Meteor.users.findOne({ username: username },{ fields: { username: 1 }})
				if not member?
					continue

				ChatSubscription.update
					rid: rid
					'u._id': member._id
				,
					$set:
						alert: false
						open: false
						archived: false
