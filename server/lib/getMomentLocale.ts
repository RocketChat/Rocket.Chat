import { Meteor } from 'meteor/meteor';

export function getMomentLocale(locale: string): string | undefined {
	const localeLower = locale.toLowerCase();

	try {
		return Assets.getText(`moment-locales/${localeLower}.js`);
	} catch (error) {
		try {
			return Assets.getText(`moment-locales/${String(localeLower.split('-').shift())}.js`);
		} catch (error) {
			throw new Meteor.Error('moment-locale-not-found', `Moment locale not found: ${locale}`);
		}
	}
}
