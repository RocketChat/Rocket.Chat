Meteor.startup ->
	RocketChat.MessageTypes.registerType({
		id: 'webc_audioconf',
		system: true,
		message: 'Sent an audioconference request'
	})
