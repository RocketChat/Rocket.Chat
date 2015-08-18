@Visitor = new Meteor.Collection 'rocketchat_visitor'
Meteor.methods
	sendMessageExternal: (data) ->
		console.log 'sendMessageExternal ->',arguments

		# validate visitor and room
		visitor = Visitor.findOne token: data.token

		if not visitor?
			visitor =
				token: data.token
				name: 'guest'
				room: data.rid

			visitor._id = Visitor.insert visitor

		console.log visitor.room,'isnt', data.rid

		if visitor.room isnt data.rid
			throw new Meteor.Error 'invalid-visitor-room', 'Invalid visitor room'

		room = ChatRoom.findOne data.rid

		if not room?

			# find an online user
			user = Meteor.users.findOne { status: 'online' }

			ChatRoom.insert
				_id: data.rid
				name: 'guest '+data.rid
				msgs: 1
				lm: new Date()
				usernames: [ user.username ]
				t: 'c'
				ts: new Date()
				v:
					token: data.token

			ChatSubscription.insert
				rid: data.rid
				name: 'guest '+data.rid
				alert: true
				open: true
				unread: 1
				u:
					_id: user._id
					username: user.username
				t: 'c'

		ChatMessage.insert
			_id: data._id
			ts: new Date()
			rid: data.rid
			msg: data.msg
