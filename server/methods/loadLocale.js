import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { getMomentLocale } from '../lib/getMomentLocale';

Meteor.methods({
	loadLocale(locale) {
		check(locale, String);

		try {
			return getMomentLocale(locale);
		} catch (error) {
			throw new Meteor.Error(error.message, `Moment locale not found: ${locale}`);
		}
	},
});
