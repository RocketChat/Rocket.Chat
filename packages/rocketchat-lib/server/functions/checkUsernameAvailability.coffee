RocketChat.checkUsernameAvailability = (username) ->
	return not Meteor.users.findOne({ username: { $regex : new RegExp("^" + _.trim(username) + "$", "i") } })