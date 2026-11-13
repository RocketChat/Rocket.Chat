import { License } from '@rocket.chat/license';
import debounce from 'lodash.debounce';

import { SAMLUtils } from './lib/Utils';
import { loadSamlServiceProviders, updateGlobalSettings } from './lib/settings';
import { settings } from '../../../../server/settings';

// Loads run one at a time so a removal from an earlier load cannot land after a later load stored the login service.
let providersLoad = Promise.resolve();
const loadServiceProviders = (): Promise<void> => {
	providersLoad = providersLoad
		.then(loadSamlServiceProviders)
		.catch((err) => SAMLUtils.error({ msg: 'Failed to load SAML service providers', err }));
	return providersLoad;
};

const reloadServiceProviders = debounce(loadServiceProviders, 500);
let stopWatchingProviderSettings: (() => void) | undefined;

export const watchSamlServiceProviders = (): void => {
	// Providers are only built while the module is licensed, so a license applied after startup cannot leave them stale.
	License.onToggledFeature('saml-enterprise', {
		up: () => {
			stopWatchingProviderSettings = settings.watchByRegex(/^SAML_.+/, reloadServiceProviders);
		},
		down: () => {
			stopWatchingProviderSettings?.();
			stopWatchingProviderSettings = undefined;
			reloadServiceProviders.cancel();
			void loadServiceProviders();
		},
	});

	settings.watchByRegex(/^SAML_Custom_Default_/, updateGlobalSettings);
};

// onToggledFeature runs neither up nor down when booting without the module; call after the license is applied
// so a SAML login service kept from an unlicensed upgrade stops being offered on the login screen.
export const unloadSamlServiceProvidersWithoutLicense = (): Promise<void> =>
	License.hasModule('saml-enterprise') ? Promise.resolve() : loadServiceProviders();
