Meteor.methods
	archiveRoom: (rid) ->
		if not Meteor.userId()
			throw new Meteor.Error 'invalid-user', '[methods] archiveRoom -> Invalid user'

		console.log '[methods] archiveRoom -> '.green, 'userId:', Meteor.userId(), 'arguments:', arguments

		room = ChatRoom.findOne rid

		if room.u? and room.u._id is Meteor.userId() or Meteor.user().admin?
			update =
				$set:
					archived: true

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
						archived: true
