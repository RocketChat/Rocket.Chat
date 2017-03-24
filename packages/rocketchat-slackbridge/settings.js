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
			enableQuery: {
				_id: 'SlackBridge_Enabled',
				value: true
			},
			i18nLabel: 'Alias_Format',
			i18nDescription: 'Alias_Format_Description'
		});

		this.add('SlackBridge_FileUpload_Enabled', true, {
			type: 'boolean',
			enableQuery: {
				_id: 'SlackBridge_Enabled',
				value: true
			},
			i18nLabel: 'FileUpload'
		});

		this.add('SlackBridge_ExcludeBotnames', '', {
			type: 'string',
			enableQuery: {
				_id: 'SlackBridge_Enabled',
				value: true
			},
			i18nLabel: 'Exclude_Botnames',
			i18nDescription: 'Exclude_Botnames_Description'
		});

		this.add('SlackBridge_Out_Enabled', false, {
			type: 'boolean',
			enableQuery: {
				_id: 'SlackBridge_Enabled',
				value: true
			}
		});

		this.add('SlackBridge_Out_All', false, {
			type: 'boolean',
			enableQuery: [{
				_id: 'SlackBridge_Enabled',
				value: true
			}, {
				_id: 'SlackBridge_Out_Enabled',
				value: true
			}]
		});

		this.add('SlackBridge_Out_Channels', '', {
			type: 'roomPick',
			enableQuery: [{
				_id: 'SlackBridge_Enabled',
				value: true
			}, {
				_id: 'SlackBridge_Out_Enabled',
				value: true
			}, {
				_id: 'SlackBridge_Out_All',
				value: false
			}]
		});
	});
});
