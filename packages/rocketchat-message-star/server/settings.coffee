Meteor.startup ->
	RocketChat.settings.add 'Message_AllowStarring', true, { type: 'boolean', group: 'Message', public: true, i18nLabel: "rocketchat-message-star:Message_AllowStarring" }