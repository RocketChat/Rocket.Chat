import store from '../store';

/**
 * To normalize Language String and return language code
 * @param {String} languageString
 */
export const normalizeLanguageString = (languageString) => {
	let [languageCode, countryCode] = languageString.split ? languageString.split(/[-_]/) : [];
	if (!languageCode || languageCode.length !== 2) {
		return 'en';
	}
	languageCode = languageCode.toLowerCase();

	if (!countryCode || countryCode.length !== 2) {
		countryCode = null;
	} else {
		countryCode = countryCode.toUpperCase();
	}

	return countryCode ? `${languageCode}-${countryCode}` : languageCode;
};

/**
 * To get browser Language of user
 */
export const browserLanguage = () => navigator.userLanguage || navigator.language;

/**
 * This is configured langauge
 */
export const configLanguage = () => {
	const { config: { settings: { language } = {} } = {}, iframe: { language: iframeLanguage } = {} } = store.state;
	return iframeLanguage || language;
};

export const getDateFnsLocale = () => {
	const supportedLocales = [
		'af',
		'ar',
		'be',
		'bg',
		'bn',
		'ca',
		'cs',
		'cy',
		'da',
		'de',
		'el',
		'en-AU',
		'en-CA',
		'en-GB',
		'en-US',
		'eo',
		'es',
		'et',
		'fa-IR',
		'fi',
		'fr',
		'fr-CA',
		'gl',
		'gu',
		'he',
		'hi',
		'hr',
		'hu',
		'hy',
		'id',
		'is',
		'it',
		'ja',
		'ka',
		'kk',
		'ko',
		'lt',
		'lv',
		'nb',
		'nl',
		'nn',
		'pl',
		'pt',
		'pt-BR',
		'ro',
		'ru',
		'sk',
		'sl',
		'sr',
		'sr-Latn',
		'sv',
		'ta',
		'te',
		'th',
		'tr',
		'ug',
		'uk',
		'vi',
		'zh_CN',
		'zh_TW',
	];

	let fullLanguage = configLanguage() || browserLanguage();
	fullLanguage = fullLanguage.toLowerCase();
	const [languageCode] = fullLanguage.split ? fullLanguage.split(/[-_]/) : [];
	const locale = [fullLanguage, languageCode, 'en-US'].find((lng) => supportedLocales.indexOf(lng) > -1);
	// eslint-disable-next-line import/no-dynamic-require
	return require(`date-fns/locale/${locale}/index.js`);
};
