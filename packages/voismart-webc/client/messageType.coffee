Meteor.startup ->
	RocketChat.MessageTypes.registerType({
		id: 'webc_audioconf',
		system: true,
		message: TAPi18n.__ 'Has_sent_AudioConf_request'
	})
