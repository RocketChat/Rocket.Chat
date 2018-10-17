Meteor.startup(function() {
	RocketChat.settings.addGroup('Federation', function() {
		this.add('FEDERATION_Enabled', false, {
			type: 'boolean',
			i18nLabel: 'Enabled',
			i18nDescription: 'FEDERATION_Enabled',
			alert: 'FEDERATION_Enabled_Alert',
			public: true,
		});

		this.add('FEDERATION_Peer_Identifier', RocketChat.settings.get('Site_Name'), {
			group: 'Peer',
			type: 'string',
			i18nLabel: 'FEDERATION_Peer_Identifier',
			i18nDescription: 'FEDERATION_Peer_Identifier_Description',
			alert: 'FEDERATION_Peer_Identifier_Alert',
		});

		this.add('FEDERATION_Peer_Domains', '', {
			group: 'Peer',
			type: 'string',
			i18nLabel: 'FEDERATION_Peer_Domains',
			i18nDescription: 'FEDERATION_Peer_Domains_Description',
		});

		this.add('FEDERATION_DNS_URL', 'localhost', {
			group: 'DNS Server',
			type: 'string',
			i18nLabel: 'FEDERATION_DNS_URL',
			i18nDescription: 'FEDERATION_DNS_URL_Description',
		});
	});
});
