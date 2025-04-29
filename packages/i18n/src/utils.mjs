export const utils = `
const namespacesMap = {
	core: true,
	onboarding: true,
	registration: true,
	cloud: true,
	subscription: true,
};

export const availableTranslationNamespaces = Object.keys(namespacesMap);

export const defaultTranslationNamespace = 'core';

/**
 * Extract the translation keys from a flat object and group them by namespace
 *
 * Example:
 *
 * \\\`\\\`\\\`js
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
 * \\\`\\\`\\\`
 *
 * @param source the flat object with the translation keys
 */
export const extractTranslationNamespaces = (source) => {
	const result = {
		core: {},
		onboarding: {},
		registration: {},
		cloud: {},
		subscription: {},
	};

	for (const [key, value] of Object.entries(source)) {
		const prefix = availableTranslationNamespaces.find((namespace) => key.startsWith(\`\${namespace}.\`));
		const keyWithoutNamespace = prefix ? key.slice(prefix.length + 1) : key;
		const ns = prefix ?? defaultTranslationNamespace;
		result[ns][keyWithoutNamespace] = value;
	}

	return result;
};

export const addSprinfToI18n = function (t) {
	return function (key, ...replaces) {
		if (replaces[0] === undefined) {
			return t(key);
		}

		if (isObject(replaces[0]) && !Array.isArray(replaces[0])) {
			return t(key, replaces[0]);
		}

		return t(key, {
			postProcess: 'sprintf',
			sprintf: replaces,
		});
	};
};

/**
 * Extract only the translation keys that match the given namespaces
 *
 * @param source the flat object with the translation keys
 * @param namespaces the namespaces to extract
 */
export const extractTranslationKeys = (source, namespaces = []) => {
	const all = extractTranslationNamespaces(source);
	return Array.isArray(namespaces) ? namespaces.reduce((result, namespace) => ({ ...result, ...all[namespace] }), {}) : all[namespaces];
};

export const applyCustomTranslations = (i18n, parsedCustomTranslations, { namespaces, languages } = {}) => {
	for (const [lng, translations] of Object.entries(parsedCustomTranslations)) {
		if (languages && !languages.includes(lng)) {
			continue;
		}

		for (const [key, value] of Object.entries(translations)) {
			const prefix = availableTranslationNamespaces.find((namespace) => key.startsWith(\`\${namespace}.\`));
			const keyWithoutNamespace = prefix ? key.slice(prefix.length + 1) : key;
			const ns = prefix ?? defaultTranslationNamespace;

			if (namespaces && !namespaces.includes(ns)) {
				continue;
			}

			i18n.addResourceBundle(lng, ns, { [keyWithoutNamespace]: value }, true, true);
		}
	}
};
`;

export const typedef = `
import type { RocketchatI18nKeys } from '@rocket.chat/i18n';

export declare const addSprinfToI18n: (
	t: (key: string, options?: any) => string
) => (key: string, ...replaces: any[]) => string;

export type TranslationNamespace =
	| (Extract<RocketchatI18nKeys, \`\${string}.\${string}\`> extends \`\${infer T}.\${string}\`
		? T extends Lowercase<T>
			? T
			: never
		: never)
	| 'core';

export declare const extractTranslationNamespaces: (
	source: Record<string, string>
) => Record<TranslationNamespace, Record<string, string>>;

export declare const extractTranslationKeys: (
	source: Record<string, string>,
	namespaces?: string | string[]
) => { [key: string]: any };

export declare const availableTranslationNamespaces: TranslationNamespace[];

export declare const defaultTranslationNamespace: TranslationNamespace;

export declare const applyCustomTranslations: (
	i18n: any,
	parsedCustomTranslations: Record<string, Record<string, string>>,
	options?: {
		namespaces?: string[];
		languages?: string[];
	}
) => void;
`;
