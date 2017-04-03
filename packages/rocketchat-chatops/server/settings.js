Meteor.startup(function() {
	RocketChat.settings.addGroup('Chatops');
	RocketChat.settings.add('Chatops_Enabled', false, { type: 'boolean', group: 'Chatops', public: true });
	return RocketChat.settings.add('Chatops_Username', false, { type: 'string', group: 'Chatops', public: true });
});
