Meteor.methods
	updateUserUtcOffset: (utcOffset) ->
		if not @userId?
			return

		@unblock()

		RocketChat.models.Users.setUtcOffset @userId, utcOffset
