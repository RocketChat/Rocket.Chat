Meteor.methods
	'RocketMailer.sendMail': (from, subject, body) ->

		console.log '[method] RocketMailer.sendMail', from, subject, body

		return RocketMailer.sendMail from, subject, body

# Limit setting username once per minute
# DDPRateLimiter.addRule
# 	type: 'method'
# 	name: 'RocketMailer.sendMail'
# 	connectionId: -> return true
# , 1, 60000
