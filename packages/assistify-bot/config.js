Meteor.startup(()=> {
	RocketChat.settings.add('Assistify_Bot_Username', '', {
		group: 'Assistify',
		i18nLabel: 'Assistify_Bot_Username',
		type: 'string',
		section: 'Bot',
		public: true
	});

	RocketChat.settings.add('Assistify_Bot_Automated_Response_Threshold', 100, {
		group: 'Assistify',
		i18nLabel: 'Assistify_Bot_Automated_Response_Threshold',
		type: 'int',
		section: 'Bot',
		public: true
	});
});
