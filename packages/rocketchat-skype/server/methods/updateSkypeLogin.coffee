Meteor.methods
	updateSkypeLogin: (_userId, skypeLogin) ->
		RocketChat.models.Users.setSkypeLogin _userId,skypeLogin
		return true
