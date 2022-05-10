import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { getModules, getTags, hasLicense, isEnterprise } from './license';

Meteor.methods({
	'license:hasLicense'(feature: string) {
		check(feature, String);

		return hasLicense(feature);
	},
	'license:getModules'() {
		return getModules();
	},
	'license:getTags'() {
		return getTags();
	},
	'license:isEnterprise'() {
		return isEnterprise();
	},
});
