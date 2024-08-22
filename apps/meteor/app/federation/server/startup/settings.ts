import { FederationKeys } from '@rocket.chat/models';

import { settings } from '../../../settings/server';
import { STATUS_ENABLED, STATUS_REGISTERING, STATUS_ERROR_REGISTERING, STATUS_DISABLED } from '../constants';
import { updateStatus, updateEnabled, isRegisteringOrEnabled } from '../functions/helpers';
import { enableCallbacks, disableCallbacks } from '../lib/callbacks';
import { registerWithHub } from '../lib/dns';
import { getFederationDiscoveryMethod } from '../lib/getFederationDiscoveryMethod';
import { getFederationDomain } from '../lib/getFederationDomain';
import { setupLogger } from '../lib/logger';

const updateSettings = async function (): Promise<void> {
	// Get the key pair

	if (getFederationDiscoveryMethod() === 'hub' && !(await isRegisteringOrEnabled())) {
		// Register with hub
		try {
			await updateStatus(STATUS_REGISTERING);

			await registerWithHub(getFederationDomain(), settings.get('Site_Url'), await FederationKeys.getPublicKeyString());

			await updateStatus(STATUS_ENABLED);
		} catch (err) {
			// Disable federation
			await updateEnabled(false);

			await updateStatus(STATUS_ERROR_REGISTERING);
		}
		return;
	}
	await updateStatus(STATUS_ENABLED);
};

// Add settings listeners
settings.watch('FEDERATION_Enabled', async function enableOrDisable(value) {
	setupLogger.info(`Federation is ${value ? 'enabled' : 'disabled'}`);

	if (value) {
		await updateSettings();

		enableCallbacks();
	} else {
		await updateStatus(STATUS_DISABLED);

		disableCallbacks();
	}
});

settings.watchMultiple(['FEDERATION_Discovery_Method', 'FEDERATION_Domain'], updateSettings);
