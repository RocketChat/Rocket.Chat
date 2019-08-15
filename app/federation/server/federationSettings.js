import { Meteor } from 'meteor/meteor';

import { settings } from '../../settings';
import { FederationKeys } from '../../models/server';

Meteor.startup(function() {
	const federationPublicKey = FederationKeys.getPublicKeyString();

	settings.addGroup('Federation', function() {
		this.add('FEDERATION_Enabled', false, {
			type: 'boolean',
			i18nLabel: 'Enabled',
			i18nDescription: 'FEDERATION_Enabled',
			alert: 'FEDERATION_Enabled_Alert',
			public: true,
		});

		this.add('FEDERATION_Domain', '', {
			type: 'string',
			i18nLabel: 'FEDERATION_Domain',
			i18nDescription: 'FEDERATION_Domain_Description',
			alert: 'FEDERATION_Domain_Alert',
			disableReset: true,
		});

		this.add('FEDERATION_Public_Key', federationPublicKey, {
			readonly: true,
			type: 'string',
			multiline: true,
			i18nLabel: 'FEDERATION_Public_Key',
			i18nDescription: 'FEDERATION_Public_Key_Description',
		});

		// this.add('FEDERATION_Test_Setup', 'FEDERATION_Test_Setup', {
		// 	type: 'action',
		// 	actionText: 'FEDERATION_Test_Setup',
		// });
	});
});
