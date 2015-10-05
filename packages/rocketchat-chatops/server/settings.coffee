Meteor.startup ->
	RocketChat.settings.add 'Chatops_Enabled', false, { type: 'boolean', group: 'General', public: true, i18nLabel: "rocketchat-chatops:Chatops_Enabled" }
