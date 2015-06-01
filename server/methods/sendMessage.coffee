Meteor.methods
	sendMessage: (msg) ->
		fromId = Meteor.userId()
		# console.log '[methods] sendMessage -> '.green, 'fromId:', fromId, 'msg:', msg

		if not Meteor.userId()
			throw new Meteor.Error('invalid-user', "[methods] sendMessage -> Invalid user")

		now = new Date()

		retObj = null

		roomData = ChatRoom.findOne msg.rid

		rid = msg.rid

		if not roomData
			throw new Meteor.Error 'room-not-found', 'Sala não encontrada'

		roomUpdate = { $set: { lm: now }, $inc: { msgs: 1 } }

		if Meteor.userId() and roomData.uids.indexOf(Meteor.userId()) is -1
			roomUpdate.$push = { uids: Meteor.userId() }

		ChatRoom.update rid, roomUpdate

		if Meteor.userId()?
			messageFilter = { rid: rid, uid: Meteor.userId(), t: 't' }
			activityFilter = { rid: rid, uid: { $ne: Meteor.userId() } }

		ChatMessage.upsert messageFilter,
			$set:
				ts: now
				msg: msg.message
			$unset:
				t: 1
				expireAt: 1

		# increment unread counter on which user in room
		ChatSubscription.update activityFilter, { $inc: { unread: 1 }, $set: { ts: now } }, { multi: true }

		return retObj

	updateMessage: (msg) ->
		fromId = Meteor.userId()
		# console.log '[methods] updateMessage -> '.green, 'fromId:', fromId, 'msg:', msg

		if not Meteor.userId()
			throw new Meteor.Error('invalid-user', "[methods] updateMessage -> Invalid user")

		now = new Date()

		messageFilter = { _id: msg.id, uid: Meteor.userId() }

		ChatMessage.update messageFilter,
			$set:
				ets: now
				msg: msg.message

		return
