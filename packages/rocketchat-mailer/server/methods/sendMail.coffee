Meteor.methods
	'Mailer.sendMail': (from, subject, body, dryrun) ->

		console.log '[method] Mailer.sendMail', from, subject, body, dryrun

		return Mailer.sendMail from, subject, body, dryrun

# Limit setting username once per minute
# DDPRateLimiter.addRule
# 	type: 'method'
# 	name: 'Mailer.sendMail'
# 	connectionId: -> return true
# , 1, 60000
