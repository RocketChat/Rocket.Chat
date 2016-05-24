RocketChat.settings.addGroup('Piwik', function addSettings() {
	this.add('PiwikAnalytics_url', '', {
		type: 'string',
		public: true,
		i18nLabel: 'URL'
	});
	this.add('PiwikAnalytics_siteId', '', {
		type: 'string',
		public: true,
		i18nLabel: 'Client_ID'
	});

	this.section('Analytics_features_enabled', function addFeaturesEnabledSettings() {
		this.add('PiwikAnalytics_features_messages', true, {
			type: 'boolean',
			public: true,
			i18nLabel: 'Messages',
			i18nDescription: 'Analytics_features_messages_Description'
		});
		this.add('PiwikAnalytics_features_rooms', true, {
			type: 'boolean',
			public: true,
			i18nLabel: 'Rooms',
			i18nDescription: 'Analytics_features_rooms_Description'
		});
	});
});
