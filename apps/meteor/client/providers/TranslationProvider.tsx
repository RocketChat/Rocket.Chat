import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useSetting, TranslationContext, useAbsoluteUrl } from '@rocket.chat/ui-contexts';
import i18next from 'i18next';
import I18NextHttpBackend from 'i18next-http-backend';
import { TAPi18n, TAPi18next } from 'meteor/rocketchat:tap-i18n';
import { Tracker } from 'meteor/tracker';
import type { ReactElement, ReactNode } from 'react';
import React, { useEffect, useMemo, useState } from 'react';
import { I18nextProvider, initReactI18next } from 'react-i18next';

import { useReactiveValue } from '../hooks/useReactiveValue';

type TranslationNamespace = Extract<TranslationKey, `${string}.${string}`> extends `${infer T}.${string}`
	? T extends Lowercase<T>
		? T
		: never
	: never;

const namespacesDefault = ['onboarding', 'registration'] as TranslationNamespace[];

const parseToJSON = (customTranslations: string) => {
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
			const prefix = (Array.isArray(namespaces) ? namespaces : [namespaces]).find((namespace) => key.startsWith(`${namespace}.`));

			if (prefix) {
				result[key.slice(prefix.length + 1)] = value;
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

	const [i18n] = useState(() => {
		const i18n = i18next.createInstance().use(I18NextHttpBackend).use(initReactI18next);

		i18n.init({
			lng,
			fallbackLng: 'en',
			ns: namespacesDefault,
			nsSeparator: '.',
			partialBundledLanguages: true,
			debug: false,
			backend: {
				loadPath: `${basePath}/{{lng}}.json`,
				parse,
			},
		});

		return i18n;
	});

	useEffect(() => {
		i18n.changeLanguage(lng);
	}, [i18n, lng]);

	useEffect(() => {
		if (!customTranslations || typeof customTranslations !== 'string') {
			return;
		}

		const parsedCustomTranslations: Record<string, Record<string, string>> = JSON.parse(customTranslations);

		for (const [ln, translations] of Object.entries(parsedCustomTranslations)) {
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
	}, [customTranslations, i18n]);

	return i18n;
};

const createTranslateFunction = (
	language: string,
): {
	(key: TranslationKey, ...replaces: unknown[]): string;
	has: (key: string | undefined, options?: { lng?: string }) => key is TranslationKey;
} =>
	Tracker.nonreactive(() => {
		const translate = (key: TranslationKey, ...replaces: unknown[]): string => {
			if (typeof replaces[0] === 'object') {
				const [options, lng = language] = replaces;
				return TAPi18next.t(key, {
					ns: 'project',
					lng: String(lng),
					...options,
				});
			}

			if (replaces.length === 0) {
				return TAPi18next.t(key, { ns: 'project', lng: language });
			}

			return TAPi18next.t(key, {
				postProcess: 'sprintf',
				sprintf: replaces,
				ns: 'project',
				lng: language,
			});
		};

		translate.has = (
			key: string | undefined,
			{
				lng = language,
			}: {
				lng?: string;
			} = {},
		): key is TranslationKey => !!key && TAPi18next.exists(key, { ns: 'project', lng });

		return translate;
	});

const getLanguages = (): { name: string; en: string; key: string }[] => {
	const result = Object.entries(TAPi18n.getLanguages())
		.map(([key, language]) => ({ ...language, key: key.toLowerCase() }))
		.sort((a, b) => a.key.localeCompare(b.key));

	result.unshift({
		name: 'Default',
		en: 'Default',
		key: '',
	});

	return result;
};

const getLanguage = (): string => TAPi18n.getLanguage();

const loadLanguage = async (language: string): Promise<void> => {
	TAPi18n.setLanguage(language);
};

type TranslationProviderProps = {
	children: ReactNode;
};

const TranslationProvider = ({ children }: TranslationProviderProps): ReactElement => {
	const languages = useReactiveValue(getLanguages);
	const language = useReactiveValue(getLanguage);

	const i18nextInstance = useI18next(language);

	const value = useMemo(
		() => ({
			languages,
			language,
			loadLanguage,
			translate: createTranslateFunction(language),
		}),
		[languages, language],
	);

	return (
		<I18nextProvider i18n={i18nextInstance}>
			<TranslationContext.Provider children={children} value={value} />
		</I18nextProvider>
	);
};

export default TranslationProvider;
