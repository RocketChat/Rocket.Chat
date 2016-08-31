Meteor.methods
	userSetUtcOffset: (utcOffset) ->
		if not @userId?
			return

		@unblock()

		RocketChat.models.Users.setUtcOffset @userId, utcOffset

DDPRateLimiter.addRule
	type: 'method'
	name: 'userSetUtcOffset'
	userId: -> return true
, 1, 60000
