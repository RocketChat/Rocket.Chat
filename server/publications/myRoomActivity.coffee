Meteor.publish 'myRoomActivity', ->
	unless this.userId
		return this.ready()

	# console.log '[publish] myRoomActivity'.green

	return Meteor.publishWithRelations
		handle: this
		collection: ChatSubscription
		filter: { 'u._id': this.userId, $or: [ { ts: { $gte: moment().subtract(1, 'days').startOf('day').toDate() } }, { f: true } ] }
		mappings: [
			key: 'rid'
			reverse: false
			collection: ChatRoom
		]

	# return ChatSubscription.find { uid: this.userId, ts: { $gte: moment().subtract(2, 'days').startOf('day').toDate() } }

