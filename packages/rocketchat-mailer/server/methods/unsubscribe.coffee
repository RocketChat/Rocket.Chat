Meteor.methods
	'Mailer:unsubscribe': (_id, createdAt) ->
		return Mailer.unsubscribe _id, createdAt

# Limit setting username once per minute
DDPRateLimiter.addRule
	type: 'method'
	name: 'Mailer:unsubscribe'
	connectionId: -> return true
, 1, 60000
