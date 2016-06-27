Meteor.startup ->
	RocketChat.MessageTypes.registerType({
		id: 'phone_dial_a_number',
		system: true,
		message: 'Sent a number to call'
	})
