import { Meteor } from 'meteor/meteor';
import _ from 'underscore';

import { settings } from '../../settings/server';
import { loadSamlServiceProviders, addSamlService } from './lib/settings';
import { Logger } from '../../logger/server';
import { SAMLUtils } from './lib/Utils';

settings.addGroup('SAML');

export const logger = new Logger('steffo:meteor-accounts-saml', {});
SAMLUtils.setLoggerInstance(logger);

const updateServices = _.debounce(Meteor.bindEnvironment(() => {
	loadSamlServiceProviders();
}), 2000);


settings.get(/^SAML_.+/, updateServices);

Meteor.startup(() => addSamlService('Default'));
