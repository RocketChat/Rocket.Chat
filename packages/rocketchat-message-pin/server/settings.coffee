Meteor.startup ->
	RocketChat.settings.add 'Message_AllowPinning', true, { type: 'boolean', group: 'Message', public: true }
	RocketChat.models.Permissions.upsert('pin-message', { $setOnInsert: { roles: ['owner', 'moderator', 'admin'] } });
