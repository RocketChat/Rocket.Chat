Meteor.startup(function() {
	RocketChat.settings.addGroup('Livechat');
	RocketChat.settings.add('Livechat_title', 'Rocket.Chat', { type: 'string', group: 'Livechat', public: true });
	RocketChat.settings.add('Livechat_title_color', '#C1272D', { type: 'string', group: 'Livechat', public: true });
	RocketChat.settings.add('Livechat_enabled', false, { type: 'boolean', group: 'Livechat', public: true });
	RocketChat.settings.add('Livechat_registration_form', true, { type: 'boolean', group: 'Livechat', public: true, i18nLabel: 'Show_preregistration_form' });
	RocketChat.settings.add('Livechat_guest_count', 1, { type: 'int', group: 'Livechat' });

	RocketChat.settings.add('Livechat_Room_Count', 1, {
		type: 'int',
		group: 'Livechat'
	});

	RocketChat.settings.add('Livechat_Knowledge_Enabled', false, {
		type: 'boolean',
		group: 'Livechat',
		section: 'Knowledge Base',
		public: true,
		i18nLabel: 'Enabled'
	});

	RocketChat.settings.add('Livechat_Knowledge_Apiai_Key', '', {
		type: 'string',
		group: 'Livechat',
		section: 'Knowledge Base',
		public: true,
		i18nLabel: 'Apiai_Key'
	});

	RocketChat.settings.add('Livechat_Knowledge_Apiai_Language', 'en', {
		type: 'string',
		group: 'Livechat',
		section: 'Knowledge Base',
		public: true,
		i18nLabel: 'Apiai_Language'
	});
});
