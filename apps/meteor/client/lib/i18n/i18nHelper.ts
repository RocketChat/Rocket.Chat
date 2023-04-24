import i18next from 'i18next';
import I18NextHttpBackend from 'i18next-http-backend';
import sprintf from 'i18next-sprintf-postprocessor';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { settings } from '../../../app/settings/client';

export const translationHelper = i18next.createInstance().use(I18NextHttpBackend).use(sprintf);

const parseToJSON = (customTranslations: string): Record<string, Record<string, string>> | false => {
	try {
		return JSON.parse(customTranslations);
	} catch (e) {
		return false;
	}
};

const parse = (data: string, lngs?: string | string[], namespaces: string | string[] = []): { [key: string]: any } => {
	const customTranslations = settings.get('Custom_Translations');
	const parsedCustomTranslations = typeof customTranslations === 'string' && parseToJSON(customTranslations);

	const source = JSON.parse(data);
	const result: { [key: string]: any } = {};

	for (const [key, value] of Object.entries(source)) {
		const [prefix] = key.split('.');

		if (prefix && Array.isArray(namespaces) ? namespaces.includes(prefix) : prefix === namespaces) {
			result[key.slice(prefix.length + 1)] = value;
			continue;
		}

		if (Array.isArray(namespaces) ? namespaces.includes('project') : namespaces === 'project') {
			result[key] = value;
		}
	}

	if (lngs && parsedCustomTranslations) {
		for (const language of Array.isArray(lngs) ? lngs : [lngs]) {
			if (!parsedCustomTranslations[language]) {
				continue;
			}

			for (const [key, value] of Object.entries(parsedCustomTranslations[language])) {
				result[key] = value;
			}
		}
	}

	return result;
};

export const initializeI18n = async (language: string): Promise<void> => {
	const basePath = Meteor.absoluteUrl('/i18n');

	await translationHelper.init({
		lng: language,
		fallbackLng: 'en',
		ns: 'project',
		defaultNS: 'project',
		partialBundledLanguages: true,
		interpolation: { prefix: '__', suffix: '__' },
		debug: false,
		backend: {
			loadPath: (lng: string[]) => `${basePath}/${lng[0]}.json`,
			parse,
		},
	});

	await watchCustomTranslations();
};

export const changeLanguage = async (language: string): Promise<void> => {
	if (language === translationHelper.language || !translationHelper.isInitialized) {
		return;
	}
	await translationHelper.changeLanguage(language);
};

export const addTranslationsToDefaultNamespace = (language: string, translations: Record<string, string>): void => {
	translationHelper.addResourceBundle(language, 'project', translations);
};

const watchCustomTranslations = async (): Promise<void> => {
	Tracker.autorun(() => {
		const customTranslations: string | undefined = settings.get('Custom_Translations');

		if (!customTranslations || !parseToJSON(customTranslations)) {
			return;
		}

		try {
			const parsedCustomTranslations: Record<string, unknown> = JSON.parse(customTranslations);

			for (const [lang, translations] of Object.entries(parsedCustomTranslations)) {
				translationHelper.addResourceBundle(lang, 'project', translations);
			}
		} catch (e) {
			console.error('Invalid setting Custom_Translations', e);
		}
	});
};
