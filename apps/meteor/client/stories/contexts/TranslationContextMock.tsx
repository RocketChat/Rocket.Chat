import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { TranslationContext } from '@rocket.chat/ui-contexts';
import i18next from 'i18next';
import type { ContextType, ReactElement, ReactNode } from 'react';
import React, { useContext, useMemo } from 'react';

type TranslationContextMockProps = {
	children: ReactNode;
};

const TranslationContextMock = ({ children }: TranslationContextMockProps): ReactElement => {
	const parent = useContext(TranslationContext);

	const value = useMemo<ContextType<typeof TranslationContext>>(() => {
		i18next.init({
			fallbackLng: 'en',
			defaultNS: 'project',
			resources: {
				en: {
					project: require('../../../packages/rocketchat-i18n/i18n/en.i18n.json'),
				},
			},
			interpolation: {
				prefix: '__',
				suffix: '__',
			},
			initImmediate: false,
		});

		const translate = (key: string, ...replaces: unknown[]): string => {
			if (typeof replaces[0] === 'object' && replaces[0] !== null) {
				const [options] = replaces;
				return i18next.t(key, options);
			}

			if (replaces.length === 0) {
				return i18next.t(key);
			}

			return i18next.t(key, {
				postProcess: 'sprintf',
				sprintf: replaces,
			});
		};

		translate.has = (key: string | undefined): key is TranslationKey => !!key && i18next.exists(key);

		return {
			...parent,
			languages: [
				{
					name: 'English',
					en: 'English',
					key: 'en',
				},
			],
			language: 'en',
			translate,
			loadLanguage: async (): Promise<void> => undefined,
		};
	}, [parent]);

	return <TranslationContext.Provider children={children} value={value} />;
};

export default TranslationContextMock;
