Tracker.autorun ->
	user = Meteor.user()
	if user?.status is 'online'
		utcOffset = moment().utcOffset() / 60
		if user.utcOffset isnt utcOffset
			console.log 'updateUserUtcOffset', utcOffset
			Meteor.call 'updateUserUtcOffset', utcOffset