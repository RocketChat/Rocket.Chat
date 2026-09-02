import type { ProxiedApp } from '../ProxiedApp';

/**
 * What an app ships translations for, and where they resolve. Both answers are the apps
 * platform's alone, so no host has to know either one.
 */

/**
 * The i18n namespace the app's translations resolve in. An app names a key and nothing else,
 * and that key resolves to nothing on its own: it lives in a namespace of the app's own.
 */
export function getAppTranslationNamespace(appId: string): string {
	return `app-${appId}`;
}

/**
 * The app's own translations of one key, per language. Not the whole catalogue: that is every key
 * in every language, and it would cross the boundary on every result that names a key.
 *
 * Languages that don't define the key are skipped, and `undefined` comes back when none of them
 * does - the host has a fallback for a key it cannot resolve, and an empty object would not
 * trigger it.
 */
export function getAppTranslationsForKey(app: ProxiedApp, key: string): Record<string, string> | undefined {
	const { languageContent } = app.getStorageItem();
	const translations: Record<string, string> = {};

	for (const [language, content] of Object.entries(languageContent ?? {})) {
		const value = (content as Record<string, unknown>)?.[key];

		if (typeof value === 'string') {
			translations[language] = value;
		}
	}

	return Object.keys(translations).length ? translations : undefined;
}
