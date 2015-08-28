Meteor.methods
	joinDefaultChannels: ->
		if not Meteor.userId()
			throw new Meteor.Error('invalid-user', "[methods] setUsername -> Invalid user")

		console.log '[methods] joinDefaultChannels -> '.green, 'userId:', Meteor.userId(), 'arguments:', arguments

		user = Meteor.user()

		ChatRoom.find({default: true, t: {$in: ['c', 'p']}}).forEach (room) ->
			
			# put user in default rooms
			ChatRoom.update room._id,
				$addToSet:
					usernames: user.username

			if not ChatSubscription.findOne(rid: room._id, 'u._id': user._id)?
				
				# Add a subscription to this user
				ChatSubscription.insert
					rid: room._id
					name: room.name
					ts: new Date()
					t: room.t
					f: false
					open: true
					alert: true
					unread: 1
					u:
						_id: user._id
						username: user.username
				
				# Insert user joined message
				ChatMessage.insert
					rid: room._id
					ts: new Date()
					t: 'uj'
					msg: ''
					u:
						_id: user._id
						username: user.username