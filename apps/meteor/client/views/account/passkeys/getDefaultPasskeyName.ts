import type { TFunction } from 'i18next';

const browsers: [RegExp, string][] = [
	[/Electron\//, 'Rocket.Chat Desktop'],
	[/Edg(A|iOS)?\//, 'Edge'],
	[/(Firefox|FxiOS)\//, 'Firefox'],
	[/(Chrome|CriOS)\//, 'Chrome'],
	[/Safari\//, 'Safari'],
];

const platforms: [RegExp, string][] = [
	[/iPhone/, 'iPhone'],
	[/iPad/, 'iPad'],
	[/Android/, 'Android'],
	[/CrOS/, 'ChromeOS'],
	[/Mac OS X/, 'macOS'],
	[/Windows/, 'Windows'],
	[/Linux/, 'Linux'],
];

const detect = (candidates: [RegExp, string][], userAgent: string) => candidates.find(([pattern]) => pattern.test(userAgent))?.[1];

/** A name that tells the user where a new passkey lives, until they give it one of their own. */
export const getDefaultPasskeyName = (
	t: TFunction,
	authenticatorAttachment: 'platform' | 'cross-platform' | undefined,
	userAgent: string,
): string => {
	const browser = detect(browsers, userAgent);
	const platform = detect(platforms, userAgent);

	if (authenticatorAttachment === 'cross-platform' || !browser || !platform) {
		return t('Passkey');
	}

	return t('Passkey_client_on_platform', { client: browser, platform });
};
