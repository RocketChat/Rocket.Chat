import fs from 'fs';

import * as locales from 'locale-codes';

export const getPathFromTranslationFile = (language: string): string => Assets.absoluteFilePath(`i18n/${language}.i18n.json`);
export const getSupportedLanguages = async (): Promise<string[]> =>
	new Promise((resolve, reject) => {
		try {
			fs.readdir(`${Assets.getServerDir()}/assets/app/i18n`, (err, files) => {
				if (err) {
					return reject(err);
				}
				resolve(files.map((file) => file.split('.')[0]));
			});
		} catch {
			resolve([]);
		}
	});

const knownMissingLanguageWithNames: Record<string, any> = {
	'de-IN': {
		en: 'German (informal)',
		name: 'Deutsch (informell)',
	},
	'pt-BR': {
		en: 'Portuguese (Brazil)',
		name: 'Português (Brasil)',
	},
	'az': {
		en: 'Azerbaijani',
		name: 'Azərbaycan dili',
	},
	'bs': {
		en: 'Bosnian',
		name: 'Bosanski',
	},
	'cs': {
		en: 'Czech',
		name: 'čeština',
	},
	'cy': {
		en: 'Welsh',
		name: 'Cymraeg',
	},
	'de': {
		en: 'German',
		name: 'Deutsch',
	},
	'de-AT': {
		en: 'German (Austria)',
		name: 'Östereichisches Deutsch',
	},
	'el': {
		en: 'Greek',
		name: 'Ελληνικά',
	},
	'eu': {
		en: 'Basque',
		name: 'Euskara',
	},
	'fa': {
		en: 'Persian',
		name: 'فارسی',
	},
	'fr': {
		en: 'French (France)',
		name: 'Français',
	},
	'hi': {
		en: 'Hindi',
		name: 'हिन्दी',
	},
	'hi-IN': {
		en: 'hi-IN',
		name: 'hi-IN',
	},
	'km': {
		en: 'Khmer',
		name: 'ភាសាខ្មែរ',
	},
	'ku': {
		en: 'Kurdish (Sorani)',
		name: 'كوردی',
	},
	'mn': {
		en: 'Mongolian',
		name: 'Монгол',
	},
	'ms-MY': {
		en: 'Malay',
		name: 'Bahasa Melayu',
	},
	'nl': {
		en: 'Dutch',
		name: 'Nederlands',
	},
	'no': {
		en: 'Norwegian',
		name: 'Norsk',
	},
	'ro': {
		en: 'Romanian',
		name: 'Română',
	},
	'sk-SK': {
		en: 'Slovak',
		name: 'Slovenčina',
	},
	'sq': {
		en: 'Albanian',
		name: 'Shqip',
	},
	'sr': {
		en: 'Serbian',
		name: 'Српски језик',
	},
	'zh': {
		en: 'Chinese',
		name: '中文',
	},
	'zh-HK': {
		en: 'Chinese (Hong Kong)',
		name: '繁體中文（香港）',
	},
	'zh-TW': {
		en: 'Chinese (Taiwan)',
		name: '繁體中文（台灣）',
	},
};

export const getAllLanguagesWithNames = async (): Promise<{ [key: string]: string }> => {
	const supportedLanguages = await getSupportedLanguages();

	return supportedLanguages.reduce((acc, code) => {
		const language = locales.all.find((locale) => locale.tag === code);
		acc[code] = {
			name: knownMissingLanguageWithNames[code]?.name || language?.local || code,
			en: knownMissingLanguageWithNames[code]?.en || language?.name || code,
		};
		return acc;
	}, {} as Record<string, any>);
};
