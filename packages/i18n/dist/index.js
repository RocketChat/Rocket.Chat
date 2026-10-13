import { isObject } from '@rocket.chat/tools';
export const addSprinfToI18n = (t) => {
    return (key, ...replaces) => {
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
export const extractTranslationNamespaces = (source) => {
    const result = {
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
export const extractTranslationKeys = (source, namespaces = []) => {
    const all = extractTranslationNamespaces(source);
    return Array.isArray(namespaces)
        ? namespaces.reduce((result, namespace) => Object.assign(result, all[namespace]), {})
        : all[namespaces];
};
const namespacesMap = {
    core: true,
    onboarding: true,
    registration: true,
    cloud: true,
    subscription: true,
};
export const availableTranslationNamespaces = Object.keys(namespacesMap);
export const defaultTranslationNamespace = 'core';
export const applyCustomTranslations = (i18n, parsedCustomTranslations, { namespaces, languages } = {}) => {
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
