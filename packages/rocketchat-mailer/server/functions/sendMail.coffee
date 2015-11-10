RocketMailer.sendMail = (from, subject, body) ->
	Meteor.users.find({ "rocketMailer.unsubscribed": { $exists: 0 } }).forEach (user) ->
		email = user.emails?[0]?.address
		if email
			Meteor.defer ->
				console.log email
				# mailsend
