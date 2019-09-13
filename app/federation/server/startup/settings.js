import { debounce } from 'underscore';
import { Meteor } from 'meteor/meteor';

import { settings } from '../../../settings/server';
import { updateStatus, updateEnabled } from '../functions/helpers';
import { getFederationDomain } from '../lib/getFederationDomain';
import { getFederationDiscoveryMethod } from '../lib/getFederationDiscoveryMethod';
import { registerWithHub } from '../lib/dns';
import { enableCallbacks, disableCallbacks } from '../lib/callbacks';
import { logger } from '../lib/logger';
import { FederationKeys } from '../../../models/server';

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

		this.add('FEDERATION_Status', 'Disabled', {
			readonly: true,
			type: 'string',
			i18nLabel: 'FEDERATION_Status',
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

		this.add('FEDERATION_Test_Setup', 'FEDERATION_Test_Setup', {
			type: 'action',
			actionText: 'FEDERATION_Test_Setup',
		});
	});
});

const updateSettings = debounce(Meteor.bindEnvironment(function() {
	// Get the key pair

	if (getFederationDiscoveryMethod() === 'hub') {
		// Register with hub
		try {
			registerWithHub(getFederationDomain(), settings.get('Site_Url'), FederationKeys.getPublicKeyString());
		} catch (err) {
			// Disable federation
			updateEnabled(false);

			updateStatus('Could not register with Hub');
		}
	} else {
		updateStatus('Enabled');
	}
}), 150);

function enableOrDisable(key, value) {
	logger.setup.info(`Federation is ${ value ? 'enabled' : 'disabled' }`);

	if (value) {
		updateSettings();

		enableCallbacks();
	} else {
		updateStatus('Disabled');

		disableCallbacks();
	}

	value && updateSettings();
}

// Add settings listeners
settings.get('FEDERATION_Enabled', enableOrDisable);
settings.get('FEDERATION_Domain', updateSettings);
settings.get('FEDERATION_Discovery_Method', updateSettings);
