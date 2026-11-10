import { extractTranslationNamespaces } from '@rocket.chat/i18n';
import languages from '@rocket.chat/i18n/dist/languages';
import type { GlobalTypes } from 'storybook/internal/types';

export const FALLBACK_LANGUAGE = 'en';

const displayName = (language: string) => {
	try {
		return new Intl.DisplayNames([language], { type: 'language' }).of(language) ?? language;
	} catch {
		return language;
	}
};

/** The toolbar control that picks the language stories render in, among every language Rocket.Chat ships. */
export const languageGlobalTypes: GlobalTypes = {
	language: {
		description: 'Language the app root renders stories in',
		toolbar: {
			title: 'Language',
			icon: 'globe',
			items: languages.map((language) => ({ value: language, title: displayName(language), right: language })),
			dynamicTitle: true,
		},
	},
};

export const languageInitialGlobals = { language: FALLBACK_LANGUAGE };

/** Reads the language global, falling back to English for Storybooks that don't declare it. */
export const readLanguageGlobal = (globals: Record<string, unknown>): string =>
	typeof globals.language === 'string' ? globals.language : FALLBACK_LANGUAGE;

export type Translations = ReturnType<typeof extractTranslationNamespaces>;

const translationsByLanguage = new Map<string, Promise<Translations>>();

/** Fetches a language's translations once, from the files the preset serves, split into the namespaces the app registers them under. */
export const loadTranslations = (language: string): Promise<Translations> => {
	let translations = translationsByLanguage.get(language);

	if (!translations) {
		translations = fetch(`./i18n/${encodeURIComponent(language)}.i18n.json`)
			.then((response) => {
				if (!response.ok) {
					throw new Error(`Could not load the ${language} translations: ${response.status} ${response.statusText}`);
				}

				return response.json() as Promise<Record<string, string>>;
			})
			.then(extractTranslationNamespaces)
			.catch((error: unknown) => {
				translationsByLanguage.delete(language);
				throw error;
			});
		translationsByLanguage.set(language, translations);
	}

	return translations;
};

/** Tells whether a language is written right to left. */
export const isRightToLeft = (language: string): boolean => {
	try {
		// Engines expose the text info either as the current `getTextInfo()` method or as the older `textInfo` getter.
		const locale = new Intl.Locale(language) as Intl.Locale & {
			getTextInfo?: () => { direction?: string };
			textInfo?: { direction?: string };
		};
		return (locale.getTextInfo?.() ?? locale.textInfo)?.direction === 'rtl';
	} catch {
		return false;
	}
};
