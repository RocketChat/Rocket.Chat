Meteor.methods
	'RocketMailer.unsubscribe': (hash) ->
		return RocketMailer.unsubscribe hash

# Limit setting username once per minute
DDPRateLimiter.addRule
	type: 'method'
	name: 'RocketMailer.unsubscribe'
	connectionId: -> return true
, 1, 60000
