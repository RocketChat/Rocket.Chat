import { Logger } from '@rocket.chat/logger';
import debounce from 'lodash.debounce';
import { Meteor } from 'meteor/meteor';

import { SAMLUtils } from './lib/Utils';
import { loadSamlServiceProviders, addSettings, updateGlobalSettings } from './lib/settings';
import { settings } from '../../settings';

const logger = new Logger('steffo:meteor-accounts-saml');
SAMLUtils.setLoggerInstance(logger);

Meteor.startup(async () => {
	await addSettings('Default');
});

settings.watchByRegex(/^SAML_.+/, debounce(loadSamlServiceProviders, 500));

settings.watchByRegex(/^SAML_Custom_Default_/, updateGlobalSettings);
