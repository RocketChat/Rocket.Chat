import { Meteor } from 'meteor/meteor';

import { addSamlService } from '../lib/settings';

Meteor.methods({
	addSamlService(name) {
		addSamlService(name);
	},
});
