import type { RocketchatI18nKeys } from '@rocket.chat/i18n';
import i18next from 'i18next';
import sprintf from 'i18next-sprintf-postprocessor';

import { isObject } from '../../../lib/utils/isObject';

export const i18n = i18next.use(sprintf);

export const addSprinfToI18n = function (t: (key: string, ...replaces: any) => string) {
	return function (key: string, ...replaces: any): string {
		if (replaces[0] === undefined || (isObject(replaces[0]) && !Array.isArray(replaces[0]))) {
			return t(key, ...replaces);
		}

		return t(key, {
			postProcess: 'sprintf',
			sprintf: replaces,
		});
	};
};

export const t = addSprinfToI18n(i18n.t.bind(i18n));

/**
 * Extract the translation keys from a flat object and group them by namespace
 *
 * Example:
 *
 * ```js
 * const source = {
 *   'core.key1': 'value1',
 *   'core.key2': 'value2',
 *   'onboarding.key1': 'value1',
 *   'onboarding.key2': 'value2',
 *   'registration.key1': 'value1',
 *   'registration.key2': 'value2',
 *   'cloud.key1': 'value1',
 *   'cloud.key2': 'value2',
 *   'subscription.key1': 'value1',
 *   'subscription.key2': 'value2',
 * };
 *
 * const result = extractTranslationNamespaces(source);
 *
 * console.log(result);
 *
 * // {
 * //   core: {
 * //     key1: 'value1',
 * //     key2: 'value2'
 * //   },
 * //   onboarding: {
 * //     key1: 'value1',
 * //     key2: 'value2'
 * //   },
 * //   registration: {
 * //     key1: 'value1',
 * //     key2: 'value2'
 * //   },
 * //   cloud: {
 * //     key1: 'value1',
 * //     key2: 'value2'
 * //   },
 * //   subscription: {
 * //     key1: 'value1',
 * //     key2: 'value2'
 * //   }
 * // }
 * ```
 *
 * @param source the flat object with the translation keys
 */
export const extractTranslationNamespaces = (source: Record<string, string>): Record<TranslationNamespace, Record<string, string>> => {
	const result: Record<TranslationNamespace, Record<string, string>> = {
		core: {},
		onboarding: {},
		registration: {},
		cloud: {},
		subscription: {},
	};

	for (const [key, value] of Object.entries(source)) {
		const prefix = availableTranslationNamespaces.find((namespace) => key.startsWith(`${namespace}.`));
		const keyWithoutNamespace = prefix ? key.slice(prefix.length + 1) : key;
		const ns = prefix ?? defaultTranslationNamespace;
		result[ns][keyWithoutNamespace] = value;
	}

	return result;
};

/**
 * Extract only the translation keys that match the given namespaces
 *
 * @param source the flat object with the translation keys
 * @param namespaces the namespaces to extract
 */
export const extractTranslationKeys = (source: Record<string, string>, namespaces: string | string[] = []): { [key: string]: any } => {
	const all = extractTranslationNamespaces(source);
	return Array.isArray(namespaces)
		? (namespaces as TranslationNamespace[]).reduce((result, namespace) => ({ ...result, ...all[namespace] }), {})
		: all[namespaces as TranslationNamespace];
};

export type TranslationNamespace =
	| (Extract<RocketchatI18nKeys, `${string}.${string}`> extends `${infer T}.${string}` ? (T extends Lowercase<T> ? T : never) : never)
	| 'core';

const namespacesMap: Record<TranslationNamespace, true> = {
	core: true,
	onboarding: true,
	registration: true,
	cloud: true,
	subscription: true,
};

export const availableTranslationNamespaces = Object.keys(namespacesMap) as TranslationNamespace[];
export const defaultTranslationNamespace: TranslationNamespace = 'core';

export const applyCustomTranslations = (
	i18n: typeof i18next,
	parsedCustomTranslations: Record<string, Record<string, string>>,
	{ namespaces, languages }: { namespaces?: string[]; languages?: string[] } = {},
) => {
	for (const [lng, translations] of Object.entries(parsedCustomTranslations)) {
		if (languages && !languages.includes(lng)) {
			continue;
		}

		for (const [key, value] of Object.entries(translations)) {
			const prefix = availableTranslationNamespaces.find((namespace) => key.startsWith(`${namespace}.`));
			const keyWithoutNamespace = prefix ? key.slice(prefix.length + 1) : key;
			const ns = prefix ?? defaultTranslationNamespace;

			if (namespaces && !namespaces.includes(ns)) {
				continue;
			}

			i18n.addResourceBundle(lng, ns, { [keyWithoutNamespace]: value }, true, true);
		}
	}
};
