import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useSetting, TranslationContext, useAbsoluteUrl } from '@rocket.chat/ui-contexts';
import i18next from 'i18next';
import I18NextHttpBackend from 'i18next-http-backend';
import sprintf from 'i18next-sprintf-postprocessor';
import { Tracker } from 'meteor/tracker';
import type { ReactElement, ReactNode } from 'react';
import React, { useEffect, useMemo, useState } from 'react';
import { I18nextProvider, initReactI18next } from 'react-i18next';

import { Users } from '../../app/models/client';
import { settings } from '../../app/settings/client';
import { useReactiveValue } from '../hooks/useReactiveValue';
import { baseURI } from '../lib/baseURI';
import { translationHelper } from '../lib/i18n/i18nHelper';
import { filterLanguage } from '../lib/utils/filterLanguage';

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

	const [i18n] = useState(() => {
		const i18n = i18next.createInstance().use(I18NextHttpBackend).use(sprintf).use(initReactI18next);

		i18n.init({
			lng,
			fallbackLng: 'en',
			ns: namespacesDefault,
			nsSeparator: '.',
			partialBundledLanguages: true,
			debug: false,
			backend: {
				loadPath: (lngs: string[]) => `${basePath}/${lngs[0]}.json`,
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
	}, [customTranslations, i18n]);

	return i18n;
};

const createTranslateFunction = (
	language: string,
	i18nextInstance: typeof i18next,
): {
	(key: TranslationKey, ...replaces: unknown[]): string;
	has: (key: string | undefined, options?: { lng?: string }) => key is TranslationKey;
} =>
	Tracker.nonreactive(() => {
		const translate = (key: TranslationKey, ...replaces: unknown[]): string => {
			if (typeof replaces[0] === 'object') {
				const [options, lng = language] = replaces;
				return translationHelper.exists(key, { lng: String(lng) })
					? translationHelper.t(key, { lng: String(lng), ...options })
					: i18nextInstance.t(key, {
							ns: 'core',
							lng: String(lng),
							...{ ...options, interpolation: { prefix: '__', suffix: '__' } },
					  });
			}

			if (replaces.length === 0) {
				return translationHelper.exists(key, { lng: language })
					? translationHelper.t(key, { lng: language })
					: i18nextInstance.t(key, { ns: 'core', lng: language });
			}
			return translationHelper.exists(key, { lng: language })
				? translationHelper.t(key, {
						postProcess: 'sprintf',
						sprintf: replaces,
						lng: language,
				  })
				: i18nextInstance.t(key, {
						postProcess: 'sprintf',
						sprintf: replaces,
						ns: 'core',
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
		): key is TranslationKey => !!key && (translationHelper.exists(key, { lng }) || i18nextInstance.exists(key, { ns: 'core', lng }));

		return translate;
	});

const getLanguages = async (): Promise<{ name: string; en: string; key: string }[]> => {
	const availableLanguages: Record<string, any> = await (await fetch(`${baseURI}i18n/languages/available`)).json();
	const result = Object.entries(availableLanguages)
		.map(([key, language]) => ({ ...language, key: key.toLowerCase() }))
		.sort((a, b) => a.key.localeCompare(b.key));

	result.unshift({
		name: 'Default',
		en: 'Default',
		key: '',
	});

	return result;
};

const getBrowserLanguage = (): string => filterLanguage(window.navigator.userLanguage ?? window.navigator.language);
const defaultUserLanguage = (): string => settings.get('Language') || getBrowserLanguage() || 'en';

const getLanguage = (): string => {
	const uid = Meteor.userId();
	if (!uid) {
		return defaultUserLanguage();
	}
	const user = Users.findOne(uid, { fields: { language: 1 } });

	return user?.language || defaultUserLanguage();
};

const loadLanguage =
	(i18nInstance: typeof i18next) =>
	async (language: string): Promise<void> => {
		await i18nInstance.changeLanguage(language);
	};

type TranslationProviderProps = {
	children: ReactNode;
};

const TranslationProvider = ({ children }: TranslationProviderProps): ReactElement => {
	const [languages, setLanguages] = useState<{ name: string; en: string; key: string }[]>([]);
	const language = useReactiveValue(getLanguage);
	useEffect(() => {
		async function _getLanguages() {
			setLanguages(await getLanguages());
		}
		_getLanguages();
	}, []);

	const i18nextInstance = useI18next(language);

	const value = useMemo(
		() => ({
			languages,
			language,
			loadLanguage: loadLanguage(i18nextInstance),
			translate: createTranslateFunction(language, i18nextInstance),
		}),
		[languages, language, i18nextInstance],
	);

	return (
		<I18nextProvider i18n={i18nextInstance}>
			<TranslationContext.Provider children={children} value={value} />
		</I18nextProvider>
	);
};

export default TranslationProvider;
