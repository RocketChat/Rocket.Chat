import { ClientSafeError } from '@rocket.chat/core-services';

import { readPrivateAssetText } from './privateAssets';

const mapLocaleToMomentLocale: Record<string, string> = {
	ug: 'ug-cn',
	zh: 'zh-cn',
};

const localePattern = /^[a-z]{2,3}(-[a-z0-9]{2,8})*$/;

export async function getMomentLocale(locale: string): Promise<string | undefined> {
	const localeLower = locale.toLowerCase();
	if (!localePattern.test(localeLower)) {
		throw new ClientSafeError('moment-locale-not-found', `Moment locale not found: ${locale}`);
	}

	const localesPaths = [
		`moment-locales/${localeLower}.js`,
		`moment-locales/${String(localeLower.split('-').shift())}.js`,
		`moment-locales/${mapLocaleToMomentLocale[localeLower]}.js`,
	];
	for await (const localePath of localesPaths) {
		try {
			return await readPrivateAssetText(localePath);
		} catch (error) {
			continue;
		}
	}
	throw new ClientSafeError('moment-locale-not-found', `Moment locale not found: ${locale}`);
}
