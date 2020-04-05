import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { hasLicense, getModules } from './license';

Meteor.methods({
	'license:hasLicense'(features: string[]) {
		check(features, [String]);

		return features.map((feature) => ({
			[feature]: hasLicense(feature),
		}));
	},
	'license:getModules'() {
		return getModules();
	},
});
