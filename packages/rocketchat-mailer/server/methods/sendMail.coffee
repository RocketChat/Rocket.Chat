Meteor.methods
	'Mailer.sendMail': (from, subject, body, dryrun, query) ->
		if not Meteor.userId()
			throw new Meteor.Error 'error-invalid-user', "Invalid user", { method: 'Mailer.sendMail' }

		unless RocketChat.authz.hasRole( Meteor.userId(), 'admin') is true
			throw new Meteor.Error 'error-not-allowed', 'Not allowed', { method: 'Mailer.sendMail' }

		return Mailer.sendMail from, subject, body, dryrun, query

# Limit setting username once per minute
# DDPRateLimiter.addRule
# 	type: 'method'
# 	name: 'Mailer.sendMail'
# 	connectionId: -> return true
# , 1, 60000
