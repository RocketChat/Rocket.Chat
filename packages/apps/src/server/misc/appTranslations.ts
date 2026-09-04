import { normalizeLanguage } from '@rocket.chat/tools';

import type { ProxiedApp } from '../ProxiedApp';

/**
 * What an app ships translations for, and where they resolve. Both answers are the apps
 * platform's alone, so no host has to know either one.
 */

/**
 * The i18n namespace the app's translations resolve in.
 */
export function getAppTranslationNamespace(appId: string): string {
	return `app-${appId}`;
}

/**
 * The app's own translations of one single key, per language.
 *
 * Languages that don't define the key are skipped, and `undefined` comes back when none of them
 * does - the host has a fallback for a key it cannot resolve, and an empty object would not
 * trigger it.
 *
 * The package parser lowercases the name of every `i18n/*.json` file, so an app that ships
 * `pt-BR.json` is stored under `pt-br`. A host looks a language up by the code the workspace runs
 * in, which keeps the region uppercase, so the keys are normalized back on the way out.
 */
export function getAppTranslationsForKey(app: ProxiedApp, key: string): Record<string, string> | undefined {
	const { languageContent } = app.getStorageItem();
	const translations: Record<string, string> = {};

	for (const [language, content] of Object.entries(languageContent ?? {})) {
		const value = (content as Record<string, unknown>)?.[key];

		if (typeof value === 'string') {
			translations[normalizeLanguage(language)] = value;
		}
	}

	return Object.keys(translations).length ? translations : undefined;
}
