Meteor.methods
	updateUserUtcOffset: (utcOffset) ->
		if not @userId?
			return

		@unblock()

		Meteor.users.update({_id: @userId, utcOffset: {$ne: utcOffset}}, {$set: {utcOffset: utcOffset}})