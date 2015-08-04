Tracker.autorun ->
	user = Meteor.user()
	if user?.status is 'online'
		utcOffset = moment().utcOffset() / 60
		if user.utcOffset isnt utcOffset
			Meteor.call 'updateUserUtcOffset', utcOffset