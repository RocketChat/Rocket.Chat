Meteor.methods
	sendMessage: (message) ->
		if not Meteor.userId()
			throw new Meteor.Error('invalid-user', "[methods] sendMessage -> Invalid user")

		room = Meteor.call 'canAccessRoom', message.rid, Meteor.userId()

		if not room
			return false

		console.log '[methods] sendMessage -> '.green, 'userId:', Meteor.userId(), 'arguments:', arguments

		message.u = Meteor.users.findOne Meteor.userId(), fields: username: 1
		message.ts = new Date()

		message.html = message.msg
		message = RocketChat.callbacks.run 'beforeSaveMessage', message

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
					lm: message.ts
				# increate the messages counter
				$inc:
					msgs: 1


			# increment unread couter if direct messages
			if room.t is 'd'
				###
				Update the other subscriptions
				###
				ChatSubscription.update
					# only subscriptions to the same room
					rid: message.rid
					# not the msg owner
					'u._id':
						$ne: message.u._id
				,
					$set:
						# alert de user
						alert: true
						# open the room for the user
						open: true
					# increment unread couter
					$inc:
						unread: 1

			else
				message.mentions?.forEach (mention) ->
					console.log mention
					###
					Update all other subscriptions of mentioned users to alert their owners and incrementing
					the unread counter for mentions and direct messages
					###
					ChatSubscription.update
						# only subscriptions to the same room
						rid: message.rid
						# the mentioned user
						'u._id': mention._id
					,
						$set:
							# alert de user
							alert: true
							# open the room for the user
							open: true
						# increment unread couter
						$inc:
							unread: 1

			###
			Update all other subscriptions to alert their owners but witout incrementing
			the unread counter, as it is only for mentions and direct messages
			###
			ChatSubscription.update
				# only subscriptions to the same room
				rid: message.rid
				# only the ones that have not been alerted yet
				alert: false
				# not the msg owner
				'u._id':
					$ne: message.u._id
			,
				$set:
					# alert de user
					alert: true
					# open the room for the user
					open: true
			,
				# make sure we alert all matching subscription
				multi: true

		###
		Save the message. If there was already a typing record, update it.
		###
		ChatMessage.upsert
			rid: message.rid
			t: 't'
			$and: [{ 'u._id': message.u._id }]
		,
			$set: message
			$unset:
				t: 1
				expireAt: 1
