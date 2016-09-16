Meteor.methods
	phoneFindUserByQ: (q) ->
		u = RocketChat.models.Users.findOne(q)
		return {
			username: u.username,
			email: u.email,
			phoneextension: u.phoneextension
		}


