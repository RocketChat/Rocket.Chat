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
import React, { useEffect, useMemo } from 'react';
import { I18nextProvider, initReactI18next, useTranslation } from 'react-i18next';

import { CachedCollectionManager } from '../../app/ui-cached-collection/client';
import { i18n, addSprinfToI18n } from '../../app/utils/lib/i18n';
import { AppClientOrchestratorInstance } from '../../ee/client/apps/orchestrator';
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

const localeCache = new Map<string, Promise<string>>();

const useI18next = (lng: string): typeof i18next => {
	const basePath = useAbsoluteUrl()('/i18n');

	const customTranslations = useSetting('Custom_Translations');

	const parsedCustomTranslations = useMemo(() => {
		if (!customTranslations || typeof customTranslations !== 'string') {
			return;
		}

		return parseToJSON(customTranslations);
	}, [customTranslations]);

	const extractKeys = useMutableCallback(
		(source: Record<string, string>, lngs?: string | string[], namespaces: string | string[] = []): { [key: string]: any } => {
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
		},
	);

	if (!i18n.isInitialized) {
		i18n.init({
			lng,
			fallbackLng: 'en',
			ns: namespacesDefault,
			nsSeparator: '.',
			resources: {
				en: extractKeys(en),
			},
			partialBundledLanguages: true,
			defaultNS: 'core',
			backend: {
				loadPath: `${basePath}/{{lng}}.json`,
				parse: (data: string, lngs?: string | string[], namespaces: string | string[] = []) =>
					extractKeys(JSON.parse(data), lngs, namespaces),
				request: (_options, url, _payload, callback) => {
					const params = url.split('/');
					const lng = params[params.length - 1];

					let promise = localeCache.get(lng);

					if (!promise) {
						promise = fetch(url).then((res) => res.text());
						localeCache.set(lng, promise);
					}

					promise.then(
						(res) => callback(null, { data: res, status: 200 }),
						() => callback(null, { data: '', status: 500 }),
					);
				},
			},
			react: {
				useSuspense: true,
				bindI18n: 'languageChanged loaded',
				bindI18nStore: 'added removed',
			},
			interpolation: {
				escapeValue: false,
			},
		});
	}

	useEffect(() => {
		if (i18n.language !== lng) {
			i18n.changeLanguage(lng);
		}
	}, [lng]);

	useEffect(() => {
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
	}, [parsedCustomTranslations]);

	return i18n;
};

type TranslationProviderProps = {
	children: ReactNode;
};

const useAutoLanguage = () => {
	const serverLanguage = useSetting<string>('Language');
	const browserLanguage = filterLanguage(window.navigator.userLanguage ?? window.navigator.language);
	const defaultUserLanguage = browserLanguage || serverLanguage || 'en';

	// if the language is supported, if not remove the region
	const suggestedLanguage = languages.includes(defaultUserLanguage) ? defaultUserLanguage : defaultUserLanguage.split('-').shift() ?? 'en';

	// usually that value is set based on the user's config language
	const [language] = useLocalStorage('userLanguage', suggestedLanguage);

	document.documentElement.classList[isRTLScriptLanguage(language) ? 'add' : 'remove']('rtl');
	document.documentElement.setAttribute('dir', isRTLScriptLanguage(language) ? 'rtl' : 'ltr');
	document.documentElement.lang = language;

	// if user has no language set, we should set it to the default language
	return language || suggestedLanguage;
};

const getLanguageName = (code: string, lng: string): string => {
	try {
		const lang = new Intl.DisplayNames([lng], { type: 'language' });
		return lang.of(code) ?? code;
	} catch (e) {
		return code;
	}
};

const TranslationProvider = ({ children }: TranslationProviderProps): ReactElement => {
	const loadLocale = useMethod('loadLocale');

	const language = useAutoLanguage();
	const i18nextInstance = useI18next(language);
	const availableLanguages = useMemo(
		() => [
			{
				en: 'Default',
				name: i18nextInstance.t('Default'),
				ogName: i18nextInstance.t('Default'),
				key: '',
			},
			...[...new Set([...i18nextInstance.languages, ...languages])].map((key) => ({
				en: key,
				name: getLanguageName(key, language),
				ogName: getLanguageName(key, key),
				key,
			})),
		],
		[language, i18nextInstance],
	);

	useEffect(() => {
		if (moment.locales().includes(language.toLowerCase())) {
			moment.locale(language);
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

	useEffect(() => {
		const cb = () => {
			AppClientOrchestratorInstance.getAppClientManager().initialize();
			AppClientOrchestratorInstance.load();
		};
		CachedCollectionManager.onLogin(cb);
		return () => CachedCollectionManager.off('login', cb);
	}, []);

	return (
		<I18nextProvider i18n={i18nextInstance}>
			<TranslationProviderInner children={children} availableLanguages={availableLanguages} />
		</I18nextProvider>
	);
};

/**
 * I was forced to create this component to keep the api useTranslation from rocketchat
 * rocketchat useTranslation invalidates the provider content, triggering all the places that use it
 * i18next triggers a re-render inside useTranslation, since now we are using 100% of the i18next
 * the only way to invalidate after changing the language in a safe way is using the useTranslation from i8next
 * and invalidating the provider content
 */
// eslint-disable-next-line react/no-multi-comp
const TranslationProviderInner = ({
	children,
	availableLanguages,
}: {
	children: ReactNode;
	availableLanguages: {
		en: string;
		name: string;
		ogName: string;
		key: string;
	}[];
}): ReactElement => {
	const { t, i18n } = useTranslation();

	const value: TranslationContextValue = useMemo(
		() => ({
			language: i18n.language,
			languages: availableLanguages,
			loadLanguage: async (language: string): Promise<void> => {
				i18n.changeLanguage(language).then(() => applyCustomTranslations());
			},
			translate: Object.assign(addSprinfToI18n(t), {
				has: ((key, options) => key && i18n.exists(key, options)) as TranslationContextValue['translate']['has'],
			}),
		}),
		[availableLanguages, i18n, t],
	);

	return <TranslationContext.Provider children={children} value={value} />;
};

export default TranslationProvider;
