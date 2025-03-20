import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import { browserLanguage, configLanguage, normalizeLanguageString } from './lib/locale';

export const loadResource = async (lng: string) => {
	const {
		default: { translation },
	} = await import(`./i18n/${lng}.json`);

	return translation;
};

export default i18next
	.use({
		type: 'backend',
		read: (language: string, _namespace: string, callback: (error: any, resource: any) => void) => {
			loadResource(language)
				.then((resource) => {
					callback(null, resource);
				})
				.catch((reason) => {
					callback(reason, null);
				});
		},
	})
	.use(initReactI18next)
	.init({
		lng: normalizeLanguageString(configLanguage() || browserLanguage()),
		fallbackLng: 'en',
		react: {
			useSuspense: false,
			bindI18n: 'loaded languageChanged',
			bindI18nStore: 'added',
		},
		interpolation: {
			escapeValue: false,
		},
	});
