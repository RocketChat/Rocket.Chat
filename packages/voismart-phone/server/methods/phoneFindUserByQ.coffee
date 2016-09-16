Meteor.methods
	phoneFindUserByQ: (q) ->
		u = RocketChat.models.Users.findOne(q)
		if u
			return {
				username: u.username,
				email: u.email,
				phoneextension: u.phoneextension
			}
		else
			return undefined


