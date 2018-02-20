Meteor.startup(function() {
	RocketChat.settings.addGroup('LiveStream & Broadcasting', function() {
		this.add('Livestream_enabled', false, {
			type: 'boolean',
			i18nLabel: 'Enabled',
			public: true,
			alert: 'This feature is currently in beta! Please report bugs to github.com/RocketChat/Rocket.Chat/issues'
		});
		this.add('Broadcasting_enabled', false, {
			type: 'boolean',
			i18nLabel: 'Enabled',
			public: true,
			alert: 'This feature is currently in beta! Please report bugs to github.com/RocketChat/Rocket.Chat/issues',
			enableQuery: { _id: 'Livestream_enabled', value: true }
		});

		this.add('Broadcasting_client_id', '', { type: 'string', public: false, enableQuery: { _id: 'Broadcasting_enabled', value: true } });
		this.add('Broadcasting_client_secret', '', { type: 'string', public: false, enableQuery: { _id: 'Broadcasting_enabled', value: true } });
		this.add('Broadcasting_api_key', '', { type: 'string', public: false, enableQuery: { _id: 'Broadcasting_enabled', value: true } });

	});
});
