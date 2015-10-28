Meteor.startup ->
	RocketChat.settings.addGroup 'Chatops'
	RocketChat.settings.add 'Chatops_Enabled', false, { type: 'boolean', group: 'Chatops', public: true }
	RocketChat.settings.add 'Chatops_Username', false, { type: 'string', group: 'Chatops', public: true }
