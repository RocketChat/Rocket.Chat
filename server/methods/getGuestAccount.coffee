Meteor.methods
	getGuestAccount: ->
		lastGuest = RocketChat.models.Users.findOne({'guestId': {$gt: 0}}, {sort: {DateTime: -1, limit: 1}});
		guestId = 1
		if lastGuest
			guestId = lastGuest.guestId + 1

		username = 'guest-' + guestId

		userId = Accounts.createUser
			username: username
			email: username + '@tobedeleted.guest'
			password: ''
			profile:
				name: username

		Accounts.setPassword userId, ''

		RocketChat.models.Users.update userId,
			$set:
				guestId: guestId

		RocketChat.models.Roles.removeUserRoles userId, 'create-d'
		RocketChat.models.Roles.removeUserRoles userId, 'create-p'

		username
