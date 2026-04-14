import { Meteor } from 'meteor/meteor';

const mapLocaleToMomentLocale: Record<string, string> = {
	ug: 'ug-cn',
	zh: 'zh-cn',
};

export async function getMomentLocale(locale: string): Promise<string | undefined> {
	const localeLower = locale.toLowerCase();
	const localesPaths = [
		`moment-locales/${localeLower}.js`,
		`moment-locales/${String(localeLower.split('-').shift())}.js`,
		`moment-locales/${mapLocaleToMomentLocale[localeLower]}.js`,
	];
	for await (const localePath of localesPaths) {
		try {
			return await Assets.getTextAsync(localePath);
		} catch (error) {
			continue;
		}
	}
	throw new Meteor.Error('moment-locale-not-found', `Moment locale not found: ${locale}`);
}
