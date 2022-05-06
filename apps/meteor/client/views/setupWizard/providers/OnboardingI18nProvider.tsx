import { useAbsoluteUrl, useLanguage } from '@rocket.chat/ui-contexts';
import i18next from 'i18next';
import i18nextHttpBackend from 'i18next-http-backend';
import React, { Suspense, memo, ReactElement, useEffect, useState } from 'react';
import { I18nextProvider, initReactI18next } from 'react-i18next';

import PageLoading from '../../root/PageLoading';

const useOnboardingI18n = (): typeof i18next => {
	const basePath = useAbsoluteUrl()('/i18n');

	const i18n = useState(() => {
		const i18n = i18next.createInstance().use(i18nextHttpBackend).use(initReactI18next);

		i18n.init({
			fallbackLng: 'en',
			ns: ['onboarding'],
			defaultNS: 'onboarding',
			debug: false,
			backend: {
				loadPath: `${basePath}/{{lng}}.json`,
				parse: (data: string, _languages?: string | string[], namespaces: string | string[] = []): { [key: string]: any } => {
					const source = JSON.parse(data);
					const result: { [key: string]: any } = {};

					for (const key of Object.keys(source)) {
						const prefix = (Array.isArray(namespaces) ? namespaces : [namespaces]).find((namespace) => key.startsWith(`${namespace}.`));

						if (prefix) {
							result[key.slice(prefix.length + 1)] = source[key];
						}
					}

					return result;
				},
			},
		});

		return i18n;
	})[0];

	const lng = useLanguage();

	useEffect(() => {
		i18n.changeLanguage(lng);
	}, [i18n, lng]);

	return i18n;
};

const OnboardingI18nProvider = ({ children }: { children: ReactElement }): ReactElement => {
	const i18n = useOnboardingI18n();

	return (
		<Suspense fallback={<PageLoading />}>
			<I18nextProvider i18n={i18n}>{children}</I18nextProvider>
		</Suspense>
	);
};

export default memo(OnboardingI18nProvider);
