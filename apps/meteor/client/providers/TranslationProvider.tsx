import { useLocalStorage } from '@rocket.chat/fuselage-hooks';
import languages from '@rocket.chat/i18n/dist/languages';
import en from '@rocket.chat/i18n/src/locales/en.i18n.json';
import { normalizeLanguage } from '@rocket.chat/tools';
import type { TranslationContextValue } from '@rocket.chat/ui-contexts';
import { useMethod, useSetting, TranslationContext } from '@rocket.chat/ui-contexts';
import type i18next from 'i18next';
import I18NextHttpBackend from 'i18next-http-backend';
import sprintf from 'i18next-sprintf-postprocessor';
import moment from 'moment';
import type { ReactElement, ReactNode } from 'react';
import React, { useEffect, useMemo } from 'react';
import { I18nextProvider, initReactI18next, useTranslation } from 'react-i18next';

import { CachedCollectionManager } from '../../app/ui-cached-collection/client';
import { getURL } from '../../app/utils/client';
import {
	i18n,
	addSprinfToI18n,
	extractTranslationKeys,
	applyCustomTranslations,
	availableTranslationNamespaces,
	defaultTranslationNamespace,
	extractTranslationNamespaces,
} from '../../app/utils/lib/i18n';
import { AppClientOrchestratorInstance } from '../../ee/client/apps/orchestrator';
import { isRTLScriptLanguage } from '../lib/utils/isRTLScriptLanguage';

i18n.use(I18NextHttpBackend).use(initReactI18next).use(sprintf);

const useCustomTranslations = (i18n: typeof i18next) => {
	const customTranslations = useSetting('Custom_Translations');

	const parsedCustomTranslations = useMemo((): Record<string, Record<string, string>> | undefined => {
		if (!customTranslations || typeof customTranslations !== 'string') {
			return undefined;
		}

		try {
			return JSON.parse(customTranslations);
		} catch (e) {
			console.error(e);
			return undefined;
		}
	}, [customTranslations]);

	useEffect(() => {
		if (!parsedCustomTranslations) {
			return;
		}

		applyCustomTranslations(i18n, parsedCustomTranslations);

		const handleLanguageChanged = (): void => {
			applyCustomTranslations(i18n, parsedCustomTranslations);
		};

		i18n.on('languageChanged', handleLanguageChanged);

		return () => {
			i18n.off('languageChanged', handleLanguageChanged);
		};
	}, [i18n, parsedCustomTranslations]);
};

const localeCache = new Map<string, Promise<string>>();

const useI18next = (lng: string): typeof i18next => {
	if (!i18n.isInitialized) {
		i18n.init({
			lng,
			fallbackLng: 'en',
			ns: availableTranslationNamespaces,
			defaultNS: defaultTranslationNamespace,
			nsSeparator: '.',
			resources: {
				en: extractTranslationNamespaces(en),
			},
			partialBundledLanguages: true,
			backend: {
				loadPath: 'i18n/{{lng}}.json',
				parse: (data: string, _lngs?: string | string[], namespaces: string | string[] = []) =>
					extractTranslationKeys(JSON.parse(data), namespaces),
				request: (_options, url, _payload, callback) => {
					const params = url.split('/');

					const lng = params[params.length - 1];

					let promise = localeCache.get(lng);

					if (!promise) {
						promise = fetch(getURL(url)).then((res) => res.text());
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
		i18n.changeLanguage(lng);
	}, [lng]);

	return i18n;
};

const useAutoLanguage = () => {
	const serverLanguage = useSetting<string>('Language');
	const browserLanguage = normalizeLanguage(window.navigator.userLanguage ?? window.navigator.language);
	const defaultUserLanguage = serverLanguage || browserLanguage || 'en';

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

type TranslationProviderProps = {
	children: ReactNode;
};

const TranslationProvider = ({ children }: TranslationProviderProps): ReactElement => {
	const loadLocale = useMethod('loadLocale');

	const language = useAutoLanguage();
	const i18nextInstance = useI18next(language);
	useCustomTranslations(i18nextInstance);

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
			loadLanguage: async (language: string) => {
				i18n.changeLanguage(language);
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
