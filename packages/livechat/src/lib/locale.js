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
	return {
		'af': () => import('date-fns/locale/af'),
		'ar-DZ': () => import('date-fns/locale/ar-DZ'),
		'ar-EG': () => import('date-fns/locale/ar-EG'),
		'ar-MA': () => import('date-fns/locale/ar-MA'),
		'ar-SA': () => import('date-fns/locale/ar-SA'),
		'ar-TN': () => import('date-fns/locale/ar-TN'),
		'ar': () => import('date-fns/locale/ar'),
		'az': () => import('date-fns/locale/az'),
		'be-tarask': () => import('date-fns/locale/be-tarask'),
		'be': () => import('date-fns/locale/be'),
		'bg': () => import('date-fns/locale/bg'),
		'bn': () => import('date-fns/locale/bn'),
		'bs': () => import('date-fns/locale/bs'),
		'ca': () => import('date-fns/locale/ca'),
		'ckb': () => import('date-fns/locale/ckb'),
		'cs': () => import('date-fns/locale/cs'),
		'cy': () => import('date-fns/locale/cy'),
		'da': () => import('date-fns/locale/da'),
		'de-AT': () => import('date-fns/locale/de-AT'),
		'de': () => import('date-fns/locale/de'),
		'el': () => import('date-fns/locale/el'),
		'en-AU': () => import('date-fns/locale/en-AU'),
		'en-CA': () => import('date-fns/locale/en-CA'),
		'en-GB': () => import('date-fns/locale/en-GB'),
		'en-IE': () => import('date-fns/locale/en-IE'),
		'en-IN': () => import('date-fns/locale/en-IN'),
		'en-NZ': () => import('date-fns/locale/en-NZ'),
		'en-US': () => import('date-fns/locale/en-US'),
		'en-ZA': () => import('date-fns/locale/en-ZA'),
		'eo': () => import('date-fns/locale/eo'),
		'et': () => import('date-fns/locale/et'),
		'eu': () => import('date-fns/locale/eu'),
		'fa-IR': () => import('date-fns/locale/fa-IR'),
		'fi': () => import('date-fns/locale/fi'),
		'fr-CA': () => import('date-fns/locale/fr-CA'),
		'fr-CH': () => import('date-fns/locale/fr-CH'),
		'fr': () => import('date-fns/locale/fr'),
		'fy': () => import('date-fns/locale/fy'),
		'gd': () => import('date-fns/locale/gd'),
		'gl': () => import('date-fns/locale/gl'),
		'gu': () => import('date-fns/locale/gu'),
		'he': () => import('date-fns/locale/he'),
		'hi': () => import('date-fns/locale/hi'),
		'hr': () => import('date-fns/locale/hr'),
		'ht': () => import('date-fns/locale/ht'),
		'hu': () => import('date-fns/locale/hu'),
		'hy': () => import('date-fns/locale/hy'),
		'id': () => import('date-fns/locale/id'),
		'is': () => import('date-fns/locale/is'),
		'it-CH': () => import('date-fns/locale/it-CH'),
		'it': () => import('date-fns/locale/it'),
		'ja-Hira': () => import('date-fns/locale/ja-Hira'),
		'ja': () => import('date-fns/locale/ja'),
		'ka': () => import('date-fns/locale/ka'),
		'kk': () => import('date-fns/locale/kk'),
		'km': () => import('date-fns/locale/km'),
		'kn': () => import('date-fns/locale/kn'),
		'ko': () => import('date-fns/locale/ko'),
		'lb': () => import('date-fns/locale/lb'),
		'lt': () => import('date-fns/locale/lt'),
		'lv': () => import('date-fns/locale/lv'),
		'mk': () => import('date-fns/locale/mk'),
		'mn': () => import('date-fns/locale/mn'),
		'ms': () => import('date-fns/locale/ms'),
		'mt': () => import('date-fns/locale/mt'),
		'nb': () => import('date-fns/locale/nb'),
		'nl-BE': () => import('date-fns/locale/nl-BE'),
		'nl': () => import('date-fns/locale/nl'),
		'nn': () => import('date-fns/locale/nn'),
		'oc': () => import('date-fns/locale/oc'),
		'pl': () => import('date-fns/locale/pl'),
		'pt-BR': () => import('date-fns/locale/pt-BR'),
		'pt': () => import('date-fns/locale/pt'),
		'ro': () => import('date-fns/locale/ro'),
		'ru': () => import('date-fns/locale/ru'),
		'se': () => import('date-fns/locale/se'),
		'sk': () => import('date-fns/locale/sk'),
		'sl': () => import('date-fns/locale/sl'),
		'sq': () => import('date-fns/locale/sq'),
		'sr-Latn': () => import('date-fns/locale/sr-Latn'),
		'sr': () => import('date-fns/locale/sr'),
		'sv': () => import('date-fns/locale/sv'),
		'ta': () => import('date-fns/locale/ta'),
		'te': () => import('date-fns/locale/te'),
		'th': () => import('date-fns/locale/th'),
		'tr': () => import('date-fns/locale/tr'),
		'ug': () => import('date-fns/locale/ug'),
		'uk': () => import('date-fns/locale/uk'),
		'uz-Cyrl': () => import('date-fns/locale/uz-Cyrl'),
		'uz': () => import('date-fns/locale/uz'),
		'vi': () => import('date-fns/locale/vi'),
		'zh-CN': () => import('date-fns/locale/zh-CN'),
		'zh-HK': () => import('date-fns/locale/zh-HK'),
		'zh-TW': () => import('date-fns/locale/zh-TW'),
	}
		[locale]()
		.then((module) => module.default);
};
