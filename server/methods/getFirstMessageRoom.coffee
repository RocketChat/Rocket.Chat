Meteor.methods
	getFirstMessageRoom: (roomId) ->
		fromId = Meteor.userId()
		console.log '[methods] getFirstRoomMessage -> '.green, 'fromId:', fromId, 'roomId:', roomId

		msgs = ChatMessage.find({ rid: roomId }, { limit: 1, skip: 100, sort: { ts: -1 }, fields: { ts: 1 } }).fetch()

		if msgs.length > 0
			return ts: new Date(msgs[0].ts.getFullYear(), msgs[0].ts.getMonth(), msgs[0].ts.getDate(), msgs[0].ts.getHours())
		else
			return ts: moment().subtract(2, 'hour').startOf('day').toDate()
