Meteor.startup(function() {
	RocketChat.settings.addGroup('Video Conference', function() {
		console.log(RocketChat.videoConferenceProviders)

		let providers = [];

		_.forEach(RocketChat.videoConferenceProviders.providers, function(value, key) {
			console.log(key, value);
			providers.push({
				key: key,
				i18nLabel: key
			});
		});

		this.add('VideoConference_Enabled', true, {
			type: 'boolean',
			i18nLabel: 'VideoConference_Enabled',
			public: true
		});

		this.add('VideoConference_Provider', providers[0].identifier, {
			type: 'select',
			enableQuery: {
				_id: 'VideoConference_Enabled',
				value: true
			},
			values: providers,
			public: true
		});

		this.add('VideoConference_Enable_Channels', false, {
			type: 'boolean',
			enableQuery: {
				_id: 'VideoConference_Enabled',
				value: true
			},
			i18nLabel: 'VideoConference_Enable_Channels',
			public: true
		});

	});
});
