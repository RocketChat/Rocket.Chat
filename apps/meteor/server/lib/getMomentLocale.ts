import { Meteor } from 'meteor/meteor';

const mapLocaleToMomentLocale: Record<string, string> = {
	ug: 'ug-cn',
	zh: 'zh-cn',
};

export async function getMomentLocale(locale: string): Promise<string | undefined> {
	const localeLower = locale.toLowerCase();
	try {
		return await Assets.getTextAsync(`moment-locales/${localeLower}.js`);
	} catch (error) {
		try {
			return await Assets.getTextAsync(`moment-locales/${String(localeLower.split('-').shift())}.js`);
		} catch (error) {
			try {
				return await Assets.getTextAsync(`moment-locales/${mapLocaleToMomentLocale[localeLower]}.js`);
			} catch (error) {
				throw new Meteor.Error('moment-locale-not-found', `Moment locale not found: ${locale}`);
			}
		}
	}
}
