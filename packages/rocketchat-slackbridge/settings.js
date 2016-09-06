Meteor.startup(function() {
	RocketChat.settings.addGroup('SlackBridge', function() {
		this.add('SlackBridge_Enabled', false, {
			type: 'boolean',
			i18nLabel: 'Enabled',
			public: true
		});

		this.add('SlackBridge_APIToken', '', {
			type: 'string',
			enableQuery: {
				_id: 'SlackBridge_Enabled',
				value: true
			},
			i18nLabel: 'API_Token'
		});

		this.add('SlackBridge_AliasFormat', '', {
			type: 'string',
			i18nLabel: 'Alias_Format',
			i18nDescription: 'Alias_Format_Description'
		});

		this.add('SlackBridge_ExcludeBotnames', '', {
			type: 'string',
			i18nLabel: 'Exclude_Botnames',
			i18nDescription: 'Exclude_Botnames_Description'
		});
	});
});
