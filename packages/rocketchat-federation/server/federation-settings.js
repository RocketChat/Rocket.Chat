Meteor.startup(function() {
	RocketChat.settings.addGroup('Federation', function() {
		this.add('FEDERATION_Enabled', false, {
			type: 'boolean',
			i18nLabel: 'Enabled',
			i18nDescription: 'FEDERATION_Enabled',
			alert: 'FEDERATION_Enabled_Alert',
			public: true,
		});

		this.add('FEDERATION_Peer_Identifier', '@rocket.chat', {
			group: 'Peer',
			type: 'string',
			i18nLabel: 'FEDERATION_Peer_Identifier',
			i18nDescription: 'FEDERATION_Peer_Identifier_Description',
			alert: 'FEDERATION_Peer_Identifier_Alert',
		});

		this.add('FEDERATION_Peer_Domains', '@rocket.chat', {
			group: 'Peer',
			type: 'string',
			i18nLabel: 'FEDERATION_Peer_Domains',
			i18nDescription: 'FEDERATION_Peer_Domains_Description',
		});

		this.add('FEDERATION_Hub_URL', 'https://hub.rocket.chat', {
			group: 'Federation Hub',
			type: 'string',
			i18nLabel: 'FEDERATION_Hub_URL',
			i18nDescription: 'FEDERATION_Hub_URL_Description',
		});
	});
});
