import type { Locale } from 'date-fns';

import store from '../store';
import { supportedLocales } from '../supportedLocales';

/**
 * To normalize Language String and return language code
 */
export const normalizeLanguageString = (languageString: string): string => {
	let [languageCode, countryCode]: (string | undefined)[] = languageString.split?.(/[-_]/) ?? [];
	if (languageCode?.length !== 2) {
		return 'en';
	}
	languageCode = languageCode.toLowerCase();

	if (countryCode?.length !== 2) {
		countryCode = undefined;
	} else {
		countryCode = countryCode.toUpperCase();
	}

	return countryCode ? `${languageCode}-${countryCode}` : languageCode;
};

/**
 * To get browser Language of user
 */
export const browserLanguage = (): string => navigator.language;

/**
 * This is configured langauge
 */
export const configLanguage = (): string | undefined => {
	const { iframe: { language: iframeLanguage } = {} } = store.state;
	const language = (store.state.config?.settings as Record<string, unknown> | undefined)?.language as string | undefined;
	return iframeLanguage || language;
};

export const getDateFnsLocale = async (): Promise<Locale> => {
	let fullLanguage = configLanguage() || browserLanguage();
	fullLanguage = fullLanguage.toLowerCase();
	const [languageCode] = fullLanguage.split?.(/[-_]/) ?? [];
	const locale = [fullLanguage, languageCode, 'en-US'].find((lng) => supportedLocales.indexOf(lng) > -1);
	const { default: dateFnsLocale } = await import(`date-fns/locale/${locale}.js`);
	return dateFnsLocale as Locale;
};
