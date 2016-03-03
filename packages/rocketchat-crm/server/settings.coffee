Meteor.startup ->
	RocketChat.settings.addGroup 'CRM'
	RocketChat.settings.add 'CRM_Enabled', false, { type: 'boolean', group: 'CRM', public: true }
