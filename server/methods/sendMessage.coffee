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

		if Meteor.userId() and not Meteor.user().username in roomData.usernames
			roomUpdate.$push = { usernames: Meteor.user().username }

		ChatRoom.update rid, roomUpdate

		if Meteor.userId()?
			messageFilter = { rid: rid, $and: [{ 'u._id': Meteor.userId() }], t: 't' }
			activityFilter = { rid: rid, 'u._id': { $ne: Meteor.userId() } }

		mentions = []
		msg.message.replace /(?:^|\s|\n)(?:@)([A-Za-z0-9-_.]+)/g, (match, mention) ->
			mentions.push mention

		mentions = _.unique mentions

		mentions = mentions.filter (mention) ->
			return Meteor.users.findOne({username: mention}, {fields: {_id: 1}})?

		mentions = mentions.map (mention) ->
			return {
				username: mention
			}

		if mentions.length is 0
			mentions = undefined

		msg = RocketChat.callbacks.run 'sendMessage', msg

		ChatMessage.upsert messageFilter,
			$set:
				'u._id': Meteor.userId()
				'u.username': Meteor.user().username
				ts: now
				msg: msg.message
				mentions: mentions
			$unset:
				t: 1
				expireAt: 1

		# increment unread counter on which user in room
		Meteor.defer -> ChatSubscription.update activityFilter, { $inc: { unread: 1 }, $set: { ts: now } }, { multi: true }

		return retObj

	updateMessage: (msg) ->
		fromId = Meteor.userId()
		# console.log '[methods] updateMessage -> '.green, 'fromId:', fromId, 'msg:', msg

		if not Meteor.userId()
			throw new Meteor.Error('invalid-user', "[methods] updateMessage -> Invalid user")

		now = new Date()

		messageFilter = { _id: msg.id, 'u._id': Meteor.userId() }

		ChatMessage.update messageFilter,
			$set:
				ets: now
				msg: msg.message

		return
