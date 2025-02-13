import { FederationKeys } from '@rocket.chat/models';

import { STATUS_ENABLED, STATUS_REGISTERING, STATUS_ERROR_REGISTERING, STATUS_DISABLED } from '../../app/federation/server/constants';
import { updateStatus, updateEnabled, isRegisteringOrEnabled } from '../../app/federation/server/functions/helpers';
import { enableCallbacks, disableCallbacks } from '../../app/federation/server/lib/callbacks';
import { registerWithHub } from '../../app/federation/server/lib/dns';
import { getFederationDiscoveryMethod } from '../../app/federation/server/lib/getFederationDiscoveryMethod';
import { getFederationDomain } from '../../app/federation/server/lib/getFederationDomain';
import { setupLogger } from '../../app/federation/server/lib/logger';
import type { ICachedSettings } from '../../app/settings/server/CachedSettings';

export function configureFederation(settings: ICachedSettings): void {
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
}
