Meteor.methods
	readMessages: (room) ->

		# console.log '[methods] readMessages -> '.green, 'fromId:', fromId, 'room:', room

		if not Meteor.userId()
			throw new Meteor.Error 'invalid-user', '[methods] readMessages -> Invalid user'

		ChatSubscription.update
			rid: room
			'u._id': Meteor.userId()
		,
			$set:
				alert: false
				unread: 0
				ls: (new Date())
