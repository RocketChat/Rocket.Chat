import { Meteor } from 'meteor/meteor';

import { settings } from '../../settings/server';
import { loadSamlServiceProviders, addSettings } from './lib/settings';
import { Logger } from '../../../server/lib/logger/Logger';
import { SAMLUtils } from './lib/Utils';

export const logger = new Logger('steffo:meteor-accounts-saml');
SAMLUtils.setLoggerInstance(logger);
Meteor.startup(() => {
	addSettings('Default');
	settings.watchByRegex(/^SAML_.+/, loadSamlServiceProviders);
});
