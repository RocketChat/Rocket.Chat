import { Meteor } from 'meteor/meteor';

import { settings } from '../../settings';
import { loadSamlServiceProviders } from './lib/settings';


settings.addGroup('SAML');


const debounce = (fn, delay): () => number => {
	let timer = null;
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
