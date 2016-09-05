Meteor.methods
	setAvatarFromService: (dataURI, contentType, service) ->
		unless Meteor.userId()
			throw new Meteor.Error('error-invalid-user', "Invalid user", { method: 'setAvatarFromService' })

		unless RocketChat.settings.get("Accounts_AllowUserAvatarChange")
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'setAvatarFromService' });

		user = Meteor.user()

		return RocketChat.setUserAvatar(user, dataURI, contentType, service);

DDPRateLimiter.addRule
	type: 'method'
	name: 'setAvatarFromService'
	userId: -> return true
, 1, 5000
