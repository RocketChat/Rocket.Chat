Meteor.methods
	'Mailer.sendMail': (from, subject, body, dryrun, query) ->

		return Mailer.sendMail from, subject, body, dryrun, query

# Limit setting username once per minute
# DDPRateLimiter.addRule
# 	type: 'method'
# 	name: 'Mailer.sendMail'
# 	connectionId: -> return true
# , 1, 60000
