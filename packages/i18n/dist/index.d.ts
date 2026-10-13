import type { i18n, TFunction, TOptions } from 'i18next';
import type { RocketchatI18nKeys } from './resources.ts';
export type { RocketchatI18nKeys };
declare module 'i18next' {
    interface TFunction {
        (key: RocketchatI18nKeys): string;
        (key: RocketchatI18nKeys, options: TOptions): string;
    }
}
export declare const addSprinfToI18n: (t: TFunction) => (key: string, ...replaces: any) => string;
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
export declare const extractTranslationNamespaces: (source: Record<string, string>) => Record<TranslationNamespace, Record<string, string>>;
/**
 * Extract only the translation keys that match the given namespaces
 *
 * @param source the flat object with the translation keys
 * @param namespaces the namespaces to extract
 */
export declare const extractTranslationKeys: (source: Record<string, string>, namespaces?: string | string[]) => {
    [key: string]: any;
};
export type TranslationNamespace = (Extract<RocketchatI18nKeys, `${string}.${string}`> extends `${infer T}.${string}` ? (T extends Lowercase<T> ? T : never) : never) | 'core';
export declare const availableTranslationNamespaces: TranslationNamespace[];
export declare const defaultTranslationNamespace: TranslationNamespace;
export declare const applyCustomTranslations: (i18n: i18n, parsedCustomTranslations: Record<string, Record<string, string>>, { namespaces, languages }?: {
    namespaces?: string[];
    languages?: string[];
}) => void;
