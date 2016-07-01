Meteor.startup ->
	RocketChat.MessageTypes.registerType({
		id: 'webc_audioconf',
		system: true,
		message: TAPi18n.__ 'Ha mandato una richiesta di Audio Conferenza'
	})
