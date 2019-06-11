import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

const loadMomentLocale = (locale) => Assets.getText(`moment-locales/${ locale.toLowerCase() }.js`);

Meteor.methods({
	loadLocale(locale) {
		check(locale, String);
		try {
			return loadMomentLocale(locale);
		} catch (error) {
			try {
				return loadMomentLocale(locale.split('-').shift());
			} catch (error) {
				try {
					return loadMomentLocale('en-gb');
				} catch (error) {
					return console.log(error);
				}
			}
		}
	},
});
