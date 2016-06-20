RocketChat.checkUsernameAvailability = (username) ->
	usernameBlackList = []
	RocketChat.settings.get('Accounts_BlockedUsernameList', (key, value) =>
		usernameBlackList = _.map(value.split(','), (username) => username.trim())
		if usernameBlackList.length isnt 0
			for restrictedUsername in usernameBlackList
				regex = new RegExp('^' + s.escapeRegExp(restrictedUsername) + '$', 'i')
				return false if regex.test(s.trim(s.escapeRegExp(username)))
		return not Meteor.users.findOne({ username: { $regex : new RegExp("^" + s.trim(s.escapeRegExp(username)) + "$", "i") } });
	)
