Meteor.startup(function() {
	RocketChat.settings.addGroup('Federation', function() {
		this.add('FEDERATION_Enabled', false, {
			type: 'boolean',
			i18nLabel: 'Enabled',
			i18nDescription: 'FEDERATION_Enabled',
			alert: 'FEDERATION_Enabled_Alert',
		});

		this.add('FEDERATION_Peer_Identifier', RocketChat.settings.get('Site_Name'), {
			type: 'string',
			i18nLabel: 'FEDERATION_Peer_Identifier',
			i18nDescription: 'FEDERATION_Peer_Identifier_Description',
		});

		this.add('FEDERATION_Hub_Host', 'localhost', {
			type: 'string',
			i18nLabel: 'FEDERATION_Hub_Host',
			i18nDescription: 'FEDERATION_Hub_Host_Description',
		});

		this.add('FEDERATION_Hub_Port', 8080, {
			type: 'string',
			i18nLabel: 'FEDERATION_Hub_Port',
			i18nDescription: 'FEDERATION_Hub_Port_Description',
		});

		this.add('FEDERATION_Peer_Server_Host', 'localhost', {
			type: 'string',
			i18nLabel: 'FEDERATION_Peer_Server_Host',
			i18nDescription: 'FEDERATION_Peer_Server_Host_Description',
		});

		this.add('FEDERATION_Peer_Server_Port', 3333, {
			type: 'string',
			i18nLabel: 'FEDERATION_Peer_Server_Port',
			i18nDescription: 'FEDERATION_Peer_Server_Port_Description',
		});
	});
});
