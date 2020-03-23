import { Meteor } from 'meteor/meteor';

import { hasLicense } from './license';

Meteor.methods({
	'license:hasLicense'(feature) {
		return hasLicense(feature);
	},
});
