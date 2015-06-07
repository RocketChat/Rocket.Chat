Meteor.methods
	sendMessage: (message) ->
		console.log '[methods] sendMessage -> '.green, 'userId:', Meteor.userId(), 'arguments:', arguments

		if not Meteor.userId()
			throw new Meteor.Error('invalid-user', "[methods] sendMessage -> Invalid user")

		if not Meteor.call 'canAccessRoom', message.rid, Meteor.userId()
			return false

		now = new Date()


		mentions = []
		message.msg.replace /(?:^|\s|\n)(?:@)([A-Za-z0-9-_.]+)/g, (match, mention) ->
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

		message = RocketChat.callbacks.run 'sendMessage', message


		###
		Defer other updated as their return is not interesting to the user
		###
		Meteor.defer ->

			###
			Update all the room activity tracker fields
			###
			ChatRoom.update
				# only subscriptions to the same room
				rid: message.rid
			,
				# update the last message timestamp
				$set:
					lm: now
				# increate the messages counter
				$inc:
					msgs: 1

			#ChatSubscription.update { rid: message.rid, 'u._id': { $ne: Meteor.userId() } }, { $inc: { unread: 1 }, $set: { ts: now } }, { multi: true } // only for mentioned


			###
			Update all other subscriptions to alert the their owners but witout incrementing
			the unread counter, as it is only for mentions and direct messages
			###
			ChatSubscription.update
				# only subscriptions to the same room
				rid: message.rid
				# only the ones that have not been alerted yet
				alert: false
				# not the msg owner
				'u._id':
					$ne: Meteor.userId()
			,
				$set:
					# alert de user
					alert: true
					# open the room for the user
					open: true
			,
				# make sure we alert all matching subscription
				multi: true

		ChatMessage.upsert
				rid: message.rid
				t: 't'
				$and: [{ 'u._id': Meteor.userId() }]
		,
			$set:
				'u._id': Meteor.userId()
				'u.username': Meteor.user().username
				ts: now
				msg: message.msg
				mentions: mentions
			$unset:
				t: 1
				expireAt: 1

	updateMessage: (msg) ->
		fromId = Meteor.userId()
		# console.log '[methods] updateMessage -> '.green, 'fromId:', fromId, 'msg:', msg

		if not Meteor.userId()
			throw new Meteor.Error('invalid-user', "[methods] updateMessage -> Invalid user")

		now = new Date()

		messageFilter = { _id: message.id, 'u._id': Meteor.userId() }

		ChatMessage.update messageFilter,
			$set:
				ets: now
				msg: message.msg

		return
