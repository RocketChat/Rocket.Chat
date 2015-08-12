Meteor.startup ->
	Meteor.users.find({}, { fields: { 'profile.first_name': 1, 'profile.last_name': 1, name: 1, username: 1, pictures: 1, status: 1, emails: 1, phone: 1, services: 1, utcOffset: 1 } }).observe
		added: (user) ->
			Session.set('user_' + user.username + '_status', user.status)
			RoomManager.updateUserStatus user, user.status, user.utcOffset
		changed: (user) ->
			Session.set('user_' + user.username + '_status', user.status)
			RoomManager.updateUserStatus user, user.status, user.utcOffset
		removed: (user) ->
			Session.set('user_' + user.username + '_status', null)
			RoomManager.updateUserStatus user, 'offline', null
