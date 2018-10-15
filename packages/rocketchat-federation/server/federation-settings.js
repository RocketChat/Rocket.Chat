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
		});

		this.add('FEDERATION_Peer_Domains', '', {
			group: 'Peer',
			type: 'string',
			i18nLabel: 'FEDERATION_Peer_Domains',
			i18nDescription: 'FEDERATION_Peer_Domains_Description',
		});

		this.add('FEDERATION_Peer_Host', 'localhost', {
			group: 'Peer',
			type: 'string',
			i18nLabel: 'FEDERATION_Peer_Host',
			i18nDescription: 'FEDERATION_Peer_Host_Description',
		});

		this.add('FEDERATION_Peer_Port', 3300, {
			group: 'Peer',
			type: 'string',
			i18nLabel: 'FEDERATION_Peer_Port',
			i18nDescription: 'FEDERATION_Peer_Port_Description',
		});

		this.add('FEDERATION_DNS_Host', 'localhost', {
			group: 'DNS Server',
			type: 'string',
			i18nLabel: 'FEDERATION_DNS_Host',
			i18nDescription: 'FEDERATION_DNS_Host_Description',
		});

		this.add('FEDERATION_DNS_Port', 8080, {
			group: 'DNS Server',
			type: 'string',
			i18nLabel: 'FEDERATION_DNS_Port',
			i18nDescription: 'FEDERATION_DNS_Port_Description',
		});
	});
});
