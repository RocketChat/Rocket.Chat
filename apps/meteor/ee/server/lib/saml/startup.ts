import { License } from '@rocket.chat/license';
import { Logger } from '@rocket.chat/logger';
import debounce from 'lodash.debounce';
import { Meteor } from 'meteor/meteor';

import { SAMLUtils } from './lib/Utils';
import { loadSamlServiceProviders, addSettings, updateGlobalSettings } from './lib/settings';
import { settings } from '../../../../server/settings';

const logger = new Logger('steffo:meteor-accounts-saml');
SAMLUtils.setLoggerInstance(logger);

Meteor.startup(async () => {
	await addSettings('Default');
});

const reloadServiceProviders = debounce(loadSamlServiceProviders, 500);
let stopWatchingProviderSettings: (() => void) | undefined;

// Providers are only built while the module is licensed, so a license applied after startup cannot leave them stale.
License.onToggledFeature('saml-enterprise', {
	up: () => {
		stopWatchingProviderSettings = settings.watchByRegex(/^SAML_.+/, reloadServiceProviders);
	},
	down: () => {
		stopWatchingProviderSettings?.();
		stopWatchingProviderSettings = undefined;
		reloadServiceProviders.cancel();
		void loadSamlServiceProviders();
	},
});

settings.watchByRegex(/^SAML_Custom_Default_/, updateGlobalSettings);
