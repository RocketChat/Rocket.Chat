Meteor.methods
	readMessages: (room) ->
		fromId = Meteor.userId()
		console.log '[methods] readMessages -> '.green, 'fromId:', fromId, 'room:', room

		if Meteor.userId()
			filter = { rid: room, uid: Meteor.userId() }
		else
			throw new Meteor.Error 203, '[methods] readMessages -> Invalid user'

		ChatSubscription.update filter, { $set: { unread: 0, ls: (new Date()) } }
