###
# Me is a named function that will replace /me commands
# @param {Object} doc - The message object
###

class Me 
	constructor: (doc) ->
		# If message starts with /me, replace it for text formatting
		if doc.message.indexOf('/me') is 0
			doc.message = '######' + Meteor.user().name + doc.message.replace('/me', '')
		return doc

Rocket.callbacks.add 'sendMessage', Me