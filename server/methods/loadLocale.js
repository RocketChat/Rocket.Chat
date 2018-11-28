import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

Meteor.methods({
	loadLocale(locale) {
		check(locale, String);

		try {
			return Assets.getText(`moment-locales/${ locale.toLowerCase() }.js`);
		} catch (error) {
			try {
				return Assets.getText(`moment-locales/${ locale.split('-').shift().toLowerCase() }.js`);
			} catch (error) {
				return console.log(error);
			}
		}
	},
});
