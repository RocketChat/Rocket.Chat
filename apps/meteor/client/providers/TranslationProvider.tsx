import { useLocalStorage, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import languages from '@rocket.chat/i18n/dist/languages';
import en from '@rocket.chat/i18n/src/locales/en.i18n.json';
import type { TranslationKey, TranslationContextValue } from '@rocket.chat/ui-contexts';
import { useMethod, useSetting, TranslationContext, useAbsoluteUrl } from '@rocket.chat/ui-contexts';
import type i18next from 'i18next';
import I18NextHttpBackend from 'i18next-http-backend';
import sprintf from 'i18next-sprintf-postprocessor';
import moment from 'moment';
import type { ReactElement, ReactNode } from 'react';
import React, { useEffect, useMemo, useState } from 'react';
import { I18nextProvider, initReactI18next } from 'react-i18next';

import { i18n } from '../../app/utils/lib/tapi18n';
import { applyCustomTranslations } from '../lib/utils/applyCustomTranslations';
import { filterLanguage } from '../lib/utils/filterLanguage';
import { isRTLScriptLanguage } from '../lib/utils/isRTLScriptLanguage';

i18n.use(I18NextHttpBackend).use(initReactI18next).use(sprintf);

type TranslationNamespace = Extract<TranslationKey, `${string}.${string}`> extends `${infer T}.${string}`
	? T extends Lowercase<T>
		? T
		: never
	: never;

const namespacesDefault = ['core', 'onboarding', 'registration', 'cloud'] as TranslationNamespace[];

const parseToJSON = (customTranslations: string): Record<string, Record<string, string>> | false => {
	try {
		return JSON.parse(customTranslations);
	} catch (e) {
		return false;
	}
};

const useI18next = (lng: string): typeof i18next => {
	const basePath = useAbsoluteUrl()('/i18n');

	const customTranslations = useSetting('Custom_Translations');

	const parse = useMutableCallback((data: string, lngs?: string | string[], namespaces: string | string[] = []): { [key: string]: any } => {
		const parsedCustomTranslations = typeof customTranslations === 'string' && parseToJSON(customTranslations);

		const source = JSON.parse(data);
		const result: { [key: string]: any } = {};

		for (const [key, value] of Object.entries(source)) {
			const [prefix] = key.split('.');

			if (prefix && Array.isArray(namespaces) ? namespaces.includes(prefix) : prefix === namespaces) {
				result[key.slice(prefix.length + 1)] = value;
				continue;
			}

			if (Array.isArray(namespaces) ? namespaces.includes('core') : namespaces === 'core') {
				result[key] = value;
			}
		}

		if (lngs && parsedCustomTranslations) {
			for (const language of Array.isArray(lngs) ? lngs : [lngs]) {
				if (!parsedCustomTranslations[language]) {
					continue;
				}

				for (const [key, value] of Object.entries(parsedCustomTranslations[language])) {
					const prefix = (Array.isArray(namespaces) ? namespaces : [namespaces]).find((namespace) => key.startsWith(`${namespace}.`));

					if (prefix) {
						result[key.slice(prefix.length + 1)] = value;
					}
				}
			}
		}

		return result;
	});

	useState(() => {
		i18n.init({
			lng,
			fallbackLng: 'en',
			ns: namespacesDefault,
			nsSeparator: '.',
			resources: {
				en: {
					core: en,
				},
			},
			partialBundledLanguages: true,
			defaultNS: 'core',
			backend: {
				loadPath: `${basePath}/{{lng}}.json`,
				parse,
			},
		});
	});

	useEffect(() => {
		i18n.changeLanguage(lng);
	}, [lng]);

	useEffect(() => {
		if (!customTranslations || typeof customTranslations !== 'string') {
			return;
		}

		const parsedCustomTranslations = parseToJSON(customTranslations);

		if (!parsedCustomTranslations) {
			return;
		}

		for (const [ln, translations] of Object.entries(parsedCustomTranslations)) {
			if (!translations) {
				continue;
			}
			const namespaces = Object.entries(translations).reduce((acc, [key, value]): Record<string, Record<string, string>> => {
				const namespace = key.split('.')[0];

				if (namespacesDefault.includes(namespace as unknown as TranslationNamespace)) {
					acc[namespace] = acc[namespace] ?? {};
					acc[namespace][key] = value;
					acc[namespace][key.slice(namespace.length + 1)] = value;
					return acc;
				}
				acc.project = acc.project ?? {};
				acc.project[key] = value;
				return acc;
			}, {} as Record<string, Record<string, string>>);

			for (const [namespace, translations] of Object.entries(namespaces)) {
				i18n.addResourceBundle(ln, namespace, translations);
			}
		}
	}, [customTranslations]);

	return i18n;
};

const loadLanguage = async (language: string): Promise<void> => {
	i18n.changeLanguage(language).then(() => applyCustomTranslations());
};

type TranslationProviderProps = {
	children: ReactNode;
};

const useAutoLanguage = (): string => {
	const defaultUserLanguage =
		useSetting<string>('Language') || filterLanguage(window.navigator.userLanguage ?? window.navigator.language) || 'en';

	const suggestedLanguage = languages.find((lng) => lng === defaultUserLanguage)
		? defaultUserLanguage
		: defaultUserLanguage.split('-').shift() ?? 'en';

	const [language] = useLocalStorage('userLanguage', suggestedLanguage);

	document.documentElement.classList[isRTLScriptLanguage(language) ? 'add' : 'remove']('rtl');
	document.documentElement.setAttribute('dir', isRTLScriptLanguage(language) ? 'rtl' : 'ltr');
	document.documentElement.lang = language;

	return language;
};

const TranslationProvider = ({ children }: TranslationProviderProps): ReactElement => {
	const loadLocale = useMethod('loadLocale');

	const language = useAutoLanguage();
	const i18nextInstance = useI18next(language);
	const availableLanguages = useMemo(
		() =>
			[...new Set([...i18nextInstance.languages, ...languages])].map((key) => ({
				en: key,
				name: key,
				key,
			})),
		[i18nextInstance],
	);

	useEffect(() => {
		if (moment.locales().includes(language.toLowerCase())) {
			return;
		}

		const locale = !availableLanguages.find((lng) => lng.key === language) ? language.split('-').shift() : language;

		loadLocale(locale ?? language)
			.then((localeSrc) => {
				localeSrc && Function(localeSrc).call({ moment });
				moment.locale(language);
			})
			.catch((error) => {
				moment.locale('en');
				console.error('Error loading moment locale:', error);
			});
	}, [language, loadLocale, availableLanguages]);

	const value: TranslationContextValue = useMemo(
		() => ({
			language,
			languages: availableLanguages,
			loadLanguage,
			translate: Object.assign(
				((key, ...options) => {
					if (options.length > 1 || typeof options[0] !== 'object') {
						return i18nextInstance.t(key, { postProcess: 'sprintf', sprintf: options });
					}
					return i18nextInstance.t(key, ...options);
				}) as TranslationContextValue['translate'],
				{
					has: ((key, options) => key && i18nextInstance.exists(key, options)) as TranslationContextValue['translate']['has'],
				},
			),
		}),
		[language, availableLanguages, i18nextInstance],
	);

	return (
		<I18nextProvider i18n={i18nextInstance}>
			<TranslationContext.Provider children={children} value={value} />
		</I18nextProvider>
	);
};

export default TranslationProvider;
