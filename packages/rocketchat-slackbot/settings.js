Meteor.startup(function() {
	RocketChat.settings.addGroup('SlackBridge', function() {
		this.add('SlackBridge_Enabled', false, {
			type: 'boolean',
			i18nLabel: 'Enabled'
		});

		this.add('SlackBridge_APIToken', '', {
			type: 'string',
			enableQuery: {
				_id: 'SlackBridge_Enabled',
				value: true
			},
			i18nLabel: 'API_Token'
		});
	});
});
