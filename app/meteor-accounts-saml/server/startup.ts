import { Meteor } from 'meteor/meteor';

import { settings } from '../../settings/server';
import { loadSamlServiceProviders } from './lib/settings';
import { Logger } from '../../logger/server';
import { SAMLUtils } from './lib/Utils';

settings.addGroup('SAML');

export const logger = new Logger('steffo:meteor-accounts-saml', {});
SAMLUtils.setLoggerInstance(logger);

const debounce = (fn: Function, delay: number): () => number => {
	let timer: number | null = null;
	return (): number => {
		if (timer != null) {
			Meteor.clearTimeout(timer);
		}
		timer = Meteor.setTimeout(fn, delay);
		return timer;
	};
};

const updateServices = debounce(() => {
	loadSamlServiceProviders();
}, 2000);


settings.get(/^SAML_.+/, updateServices);

Meteor.startup(() => Meteor.call('addSamlService', 'Default'));
