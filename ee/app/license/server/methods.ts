import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { hasLicense } from './license';

Meteor.methods({
	'license:hasLicense'(feature: string) {
		check(feature, String);

		return hasLicense(feature);
	},
});
