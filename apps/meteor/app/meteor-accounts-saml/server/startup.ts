import { Logger } from '@rocket.chat/logger';
import { Meteor } from 'meteor/meteor';

import { settings } from '../../settings/server';
import { SAMLUtils } from './lib/Utils';
import { loadSamlServiceProviders, addSettings } from './lib/settings';

const logger = new Logger('steffo:meteor-accounts-saml');
SAMLUtils.setLoggerInstance(logger);

Meteor.startup(async () => {
	await addSettings('Default');
	settings.watchByRegex(/^SAML_.+/, loadSamlServiceProviders);
});
