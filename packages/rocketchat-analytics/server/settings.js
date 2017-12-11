RocketChat.settings.addGroup('Analytics', function addSettings() {
	this.section('Piwik', function() {
		const enableQuery = {_id: 'PiwikAnalytics_enabled', value: true};
		this.add('PiwikAnalytics_enabled', false, {
			type: 'boolean',
			public: true,
			i18nLabel: 'Enable'
		});
		this.add('PiwikAnalytics_url', '', {
			type: 'string',
			public: true,
			i18nLabel: 'URL',
			enableQuery
		});
		this.add('PiwikAnalytics_siteId', '', {
			type: 'string',
			public: true,
			i18nLabel: 'Client_ID',
			enableQuery
		});
		this.add('PiwikAdditionalTrackers', '', {
			type: 'string',
			multiline: true,
			public: true,
			i18nLabel: 'PiwikAdditionalTrackers',
			enableQuery
		});
		this.add('PiwikAnalytics_prependDomain', false, {
			type: 'boolean',
			public: true,
			i18nLabel: 'PiwikAnalytics_prependDomain',
			enableQuery
		});
		this.add('PiwikAnalytics_cookieDomain', false, {
			type: 'boolean',
			public: true,
			i18nLabel: 'PiwikAnalytics_cookieDomain',
			enableQuery
		});
		this.add('PiwikAnalytics_domains', '', {
			type: 'string',
			multiline: true,
			public: true,
			i18nLabel: 'PiwikAnalytics_domains',
			enableQuery
		});
	});

	this.section('Analytics_Google', function() {
		const enableQuery = {_id: 'GoogleAnalytics_enabled', value: true};
		this.add('GoogleAnalytics_enabled', false, {
			type: 'boolean',
			public: true,
			i18nLabel: 'Enable'
		});

		this.add('GoogleAnalytics_ID', '', {
			type: 'string',
			public: true,
			i18nLabel: 'Analytics_Google_id',
			enableQuery
		});
	});

	this.section('Analytics_features_enabled', function addFeaturesEnabledSettings() {
		this.add('Analytics_features_messages', true, {
			type: 'boolean',
			public: true,
			i18nLabel: 'Messages',
			i18nDescription: 'Analytics_features_messages_Description'
		});
		this.add('Analytics_features_rooms', true, {
			type: 'boolean',
			public: true,
			i18nLabel: 'Rooms',
			i18nDescription: 'Analytics_features_rooms_Description'
		});
		this.add('Analytics_features_users', true, {
			type: 'boolean',
			public: true,
			i18nLabel: 'Users',
			i18nDescription: 'Analytics_features_users_Description'
		});
	});
});
