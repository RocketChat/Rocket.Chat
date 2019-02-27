import { Meteor } from 'meteor/meteor';

import { settings } from 'meteor/rocketchat:settings';

import { FederationKeys } from './models/FederationKeys';

Meteor.startup(function() {
	const federationUniqueId = FederationKeys.getUniqueId();
	const federationPublicKey = FederationKeys.getPublicKeyString();

	settings.addGroup('Federation', function() {
		this.add('FEDERATION_Enabled', false, {
			type: 'boolean',
			i18nLabel: 'Enabled',
			i18nDescription: 'FEDERATION_Enabled',
			alert: 'FEDERATION_Enabled_Alert',
			public: true,
		});

		this.add('FEDERATION_Status', '-', {
			group: 'Peer',
			readonly: true,
			type: 'string',
			i18nLabel: 'FEDERATION_Status',
		});

		this.add('FEDERATION_Unique_Id', federationUniqueId, {
			group: 'Peer',
			readonly: true,
			type: 'string',
			i18nLabel: 'FEDERATION_Unique_Id',
			i18nDescription: 'FEDERATION_Unique_Id_Description',
		});

		this.add('FEDERATION_Domain', '', {
			group: 'Peer',
			type: 'string',
			i18nLabel: 'FEDERATION_Domain',
			i18nDescription: 'FEDERATION_Domain_Description',
			alert: 'FEDERATION_Domain_Alert',
		});

		this.add('FEDERATION_Public_Key', federationPublicKey, {
			group: 'Peer',
			readonly: true,
			type: 'string',
			multiline: true,
			i18nLabel: 'FEDERATION_Public_Key',
			i18nDescription: 'FEDERATION_Public_Key_Description',
		});

		this.add('FEDERATION_Hub_URL', 'https://hub.rocket.chat', {
			group: 'Federation Hub',
			type: 'string',
			i18nLabel: 'FEDERATION_Hub_URL',
			i18nDescription: 'FEDERATION_Hub_URL_Description',
		});

		this.add('FEDERATION_Discovery_Method', 'dns', {
			type: 'select',
			values: [{
				key: 'dns',
				i18nLabel: 'DNS',
			}, {
				key: 'hub',
				i18nLabel: 'Hub',
			}],
			i18nLabel: 'FEDERATION_Discovery_Method',
			i18nDescription: 'FEDERATION_Discovery_Method_Description',
			public: true,
		});

	});
});
