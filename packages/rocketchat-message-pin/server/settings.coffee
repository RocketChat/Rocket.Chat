Meteor.startup ->
	RocketChat.settings.add 'Message_AllowPinning', true, { type: 'boolean', group: 'Message', public: true }
	RocketChat.settings.add 'Message_AllowPinningByAnyone', false, { type: 'boolean', group: 'Message', public: true }
