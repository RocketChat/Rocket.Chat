Meteor.startup(function() {
	RocketChat.settings.addGroup('Conference Calls', function() {
		console.log(RocketChat.conferenceCallProviders)

		let providers = [];

		_.forEach(RocketChat.conferenceCallProviders.providers, function(value, key) {
			console.log(key, value);
			providers.push({
				key: key,
				i18nLabel: key
			});
		});

		this.add('ConferenceCall_Enabled', true, {
			type: 'boolean',
			i18nLabel: 'ConferenceCall_Enabled',
			public: true
		});

		this.add('ConferenceCall_Provider', providers[0].identifier, {
			type: 'select',
			enableQuery: {
				_id: 'ConferenceCall_Enabled',
				value: true
			},
			values: providers,
			public: true
		});

		this.add('ConferenceCall_Enable_Channels', false, {
			type: 'boolean',
			enableQuery: {
				_id: 'ConferenceCall_Enabled',
				value: true
			},
			i18nLabel: 'ConferenceCall_Enable_Channels',
			public: true
		});

	});
});
