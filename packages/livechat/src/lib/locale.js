import store from '../store';
import { supportedLocales } from '../supportedLocales';

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
	let fullLanguage = configLanguage() || browserLanguage();
	fullLanguage = fullLanguage.toLowerCase();
	const [languageCode] = fullLanguage.split ? fullLanguage.split(/[-_]/) : [];
	const locale = [fullLanguage, languageCode, 'en-US'].find((lng) => supportedLocales.indexOf(lng) > -1);
	return import(`date-fns/locale/${locale}.js`).then((module) => module.default);
};
