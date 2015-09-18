Meteor.methods
	registerGuest: (token) ->
		check token, String

		user = Meteor.users.findOne { "profile.token": token }, { fields: { _id: 1 } }
		if user?
			throw new Meteor.Error 'token-already-exists', 'Token already exists'

		pass = Meteor.uuid()

		loop
			qt = Meteor.users.find({ 'profile.guest': true }).count() + 1
			user = 'guest-' + qt

			userExists = Meteor.users.findOne { 'username': user }, { fields: { _id: 1 } }
			break if not userExists

		userData =
			username: user
			password: pass

		userId = Accounts.createUser userData

		Meteor.users.update userId,
			$set:
				name: user
				"profile.guest": true
				"profile.token": token

		return {
			user: user
			pass: pass
		}

	sendMessageLivechat: (message) ->
		console.log 'sendMessageLivechat ->',arguments

		check message.rid, String
		check message.token, String

		guest = Meteor.users.findOne Meteor.userId(), fields: username: 1

		room = RocketChat.models.Rooms.findOneById message.rid

		if not room?

			# find an online user
			operator = Meteor.users.findOne { operator: true, status: 'online' }

			unless operator
				throw new Meteor.Error 'no-operators', 'Sorry, no online operators'

			RocketChat.models.Rooms.insert
				_id: message.rid
				name: guest.username
				msgs: 1
				lm: new Date()
				usernames: [ operator.username, guest.username ]
				t: 'd'
				ts: new Date()
				v:
					token: message.token

			RocketChat.models.Subscriptions.insert
				rid: message.rid
				name: guest.username
				alert: true
				open: true
				unread: 1
				u:
					_id: operator._id
					username: operator.username
				t: 'd'

		room = Meteor.call 'canAccessRoom', message.rid, guest._id

		if not room
			throw new Meteor.Error 'cannot-acess-room'

		RocketChat.sendMessage guest, message, room

