# @Visitor = new Meteor.Collection 'rocketchat_visitor'
console.log 'registering sendMessageExternal'
Meteor.methods
	sendMessageExternal: (message) ->
		console.log 'sendMessageExternal ->',arguments

		check message.rid, String
		check message.token, String

		# validate visitor and room
		# visitor = Visitor.findOne token: message.token

		# if not visitor?
		# 	visitor =
		# 		token: message.token
		# 		name: 'guest'
		# 		room: message.rid

		# 	visitor._id = Visitor.insert visitor

		# console.log visitor.room,'isnt', message.rid

		# if visitor.room isnt message.rid
		# 	throw new Meteor.Error 'invalid-visitor-room', 'Invalid visitor room'

		user = Meteor.users.findOne Meteor.userId(), fields: username: 1
		console.log 'visitor ->',user

		room = ChatRoom.findOne message.rid

		if not room?

			# find an online user
			operator = Meteor.users.findOne { operator: true, status: 'online' }

			unless operator
				throw new Meteor.Error 'no-operators', 'Sorry, no online operators'

			ChatRoom.insert
				_id: message.rid
				name: 'guest '+message.rid
				msgs: 1
				lm: new Date()
				usernames: [ operator.username, user.username ]
				t: 'p'
				ts: new Date()
				v:
					token: message.token

			ChatSubscription.insert
				rid: message.rid
				name: 'guest '+message.rid
				alert: true
				open: true
				unread: 1
				u:
					_id: operator._id
					username: operator.username
				t: 'p'

		room = Meteor.call 'canAccessRoom', message.rid, user._id

		if not room
			# console.log 'cannot Access Room'
			throw new Meteor.Error 'cannot-acess-room'
			# return false

		RocketChat.sendMessage user, message, room

		# Meteor.call 'sendMessage', message

		# ChatMessage.insert
		# 	_id: message._id
		# 	ts: new Date()
		# 	rid: message.rid
		# 	msg: message.msg
