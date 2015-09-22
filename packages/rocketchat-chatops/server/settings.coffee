Meteor.startup ->
	RocketChat.settings.add 'Chatops', true, { type: 'boolean', group: 'General', public: true, i18nLabel: "rocketchat-chatops:Chatops_Enabled" }
