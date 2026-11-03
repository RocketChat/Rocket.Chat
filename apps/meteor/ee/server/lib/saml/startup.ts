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

const reloadSamlServiceProviders = debounce(loadSamlServiceProviders, 500);

settings.watchByRegex(/^SAML_.+/, reloadSamlServiceProviders);

settings.watchByRegex(/^SAML_Custom_Default_/, updateGlobalSettings);

License.onToggledFeature('saml-enterprise', { up: reloadSamlServiceProviders, down: reloadSamlServiceProviders });
