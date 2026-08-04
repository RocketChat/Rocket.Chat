import type { Locale } from 'date-fns';
import { enUS } from 'date-fns/locale';

type LocaleLoader = () => Promise<Locale>;

// Maps Rocket.Chat language codes (from packages/i18n) to date-fns locale loaders.
// Codes without a direct date-fns counterpart fall back to the closest match, or
// to enUS when no reasonable counterpart exists.
const localeLoaders: Record<string, LocaleLoader> = {
	'af': async () => (await import('date-fns/locale/af')).af,
	'ar': async () => (await import('date-fns/locale/ar')).ar,
	'az': async () => (await import('date-fns/locale/az')).az,
	'be-BY': async () => (await import('date-fns/locale/be')).be,
	'bg': async () => (await import('date-fns/locale/bg')).bg,
	'bn-BD': async () => (await import('date-fns/locale/bn')).bn,
	'bn-IN': async () => (await import('date-fns/locale/bn')).bn,
	'bs': async () => (await import('date-fns/locale/bs')).bs,
	'ca': async () => (await import('date-fns/locale/ca')).ca,
	'cs': async () => (await import('date-fns/locale/cs')).cs,
	'cy': async () => (await import('date-fns/locale/cy')).cy,
	'da': async () => (await import('date-fns/locale/da')).da,
	'de': async () => (await import('date-fns/locale/de')).de,
	'de-AT': async () => (await import('date-fns/locale/de-AT')).deAT,
	'de-IN': async () => (await import('date-fns/locale/de')).de,
	'el': async () => (await import('date-fns/locale/el')).el,
	'en': async () => (await import('date-fns/locale/en-US')).enUS,
	'eo': async () => (await import('date-fns/locale/eo')).eo,
	'es': async () => (await import('date-fns/locale/es')).es,
	'et': async () => (await import('date-fns/locale/et')).et,
	'eu': async () => (await import('date-fns/locale/eu')).eu,
	'fa': async () => (await import('date-fns/locale/fa-IR')).faIR,
	'fi': async () => (await import('date-fns/locale/fi')).fi,
	'fr': async () => (await import('date-fns/locale/fr')).fr,
	'gl': async () => (await import('date-fns/locale/gl')).gl,
	'he': async () => (await import('date-fns/locale/he')).he,
	'hi': async () => (await import('date-fns/locale/hi')).hi,
	'hi-IN': async () => (await import('date-fns/locale/hi')).hi,
	'hr': async () => (await import('date-fns/locale/hr')).hr,
	'hu': async () => (await import('date-fns/locale/hu')).hu,
	'id': async () => (await import('date-fns/locale/id')).id,
	'it': async () => (await import('date-fns/locale/it')).it,
	'ja': async () => (await import('date-fns/locale/ja')).ja,
	'ka-GE': async () => (await import('date-fns/locale/ka')).ka,
	'km': async () => (await import('date-fns/locale/km')).km,
	'ko': async () => (await import('date-fns/locale/ko')).ko,
	'ku': async () => (await import('date-fns/locale/ckb')).ckb,
	'lt': async () => (await import('date-fns/locale/lt')).lt,
	'lv': async () => (await import('date-fns/locale/lv')).lv,
	'mn': async () => (await import('date-fns/locale/mn')).mn,
	'ms-MY': async () => (await import('date-fns/locale/ms')).ms,
	'nb': async () => (await import('date-fns/locale/nb')).nb,
	'nl': async () => (await import('date-fns/locale/nl')).nl,
	'nn': async () => (await import('date-fns/locale/nn')).nn,
	'pl': async () => (await import('date-fns/locale/pl')).pl,
	'pt': async () => (await import('date-fns/locale/pt')).pt,
	'pt-BR': async () => (await import('date-fns/locale/pt-BR')).ptBR,
	'ro': async () => (await import('date-fns/locale/ro')).ro,
	'ru': async () => (await import('date-fns/locale/ru')).ru,
	'se': async () => (await import('date-fns/locale/se')).se,
	'sk': async () => (await import('date-fns/locale/sk')).sk,
	'sk-SK': async () => (await import('date-fns/locale/sk')).sk,
	'sl-SI': async () => (await import('date-fns/locale/sl')).sl,
	'sq': async () => (await import('date-fns/locale/sq')).sq,
	'sr': async () => (await import('date-fns/locale/sr')).sr,
	'sv': async () => (await import('date-fns/locale/sv')).sv,
	'ta-IN': async () => (await import('date-fns/locale/ta')).ta,
	'th-TH': async () => (await import('date-fns/locale/th')).th,
	'tr': async () => (await import('date-fns/locale/tr')).tr,
	'ug': async () => (await import('date-fns/locale/ug')).ug,
	'uk': async () => (await import('date-fns/locale/uk')).uk,
	'vi-VN': async () => (await import('date-fns/locale/vi')).vi,
	'zh': async () => (await import('date-fns/locale/zh-CN')).zhCN,
	'zh-HK': async () => (await import('date-fns/locale/zh-HK')).zhHK,
	'zh-TW': async () => (await import('date-fns/locale/zh-TW')).zhTW,
};

const resolveLoader = (language: string): LocaleLoader | undefined => {
	if (localeLoaders[language]) {
		return localeLoaders[language];
	}
	const base = language.split('-').shift();
	if (base && localeLoaders[base]) {
		return localeLoaders[base];
	}
	return undefined;
};

export const getDateFnsLocale = async (language: string): Promise<Locale> => {
	const loader = resolveLoader(language);
	if (!loader) {
		return enUS;
	}
	try {
		return await loader();
	} catch (error) {
		console.error('Error loading date-fns locale:', error);
		return enUS;
	}
};
