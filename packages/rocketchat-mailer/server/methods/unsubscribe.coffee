Meteor.methods
	'RocketMailer.unsubscribe': (_id, createdAt) ->
		return RocketMailer.unsubscribe _id, createdAt

# Limit setting username once per minute
DDPRateLimiter.addRule
	type: 'method'
	name: 'RocketMailer.unsubscribe'
	connectionId: -> return true
, 1, 60000
