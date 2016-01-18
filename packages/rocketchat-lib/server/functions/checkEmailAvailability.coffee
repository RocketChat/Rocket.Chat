RocketChat.checkEmailAvailability = (email) ->
	return not Meteor.users.findOne({ "emails.address": { $regex : new RegExp("^" + s.trim(email) + "$", "i") } })
