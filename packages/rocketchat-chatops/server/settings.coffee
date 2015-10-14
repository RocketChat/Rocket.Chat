Meteor.startup ->
	RocketChat.settings.add 'Chatops_Enabled', false, { type: 'boolean', group: 'General', public: true, i18nLabel: "ChatOps Enabled" }
	RocketChat.settings.add 'Chatops_Username', false, { type: 'string', group: 'General', public: true, i18nLabel: "ChatOps User Name" }
