Meteor.startup ->
	query =
		username:
			$exists: 1
		status:
			$in: ['online', 'away', 'busy']
	RocketChat.models.Users.find(query).observeChanges
		removed: (id) ->
			user = RocketChat.models.Users.findOne
				_id: id
			if user.guestId
				RocketChat.models.Users.remove id
