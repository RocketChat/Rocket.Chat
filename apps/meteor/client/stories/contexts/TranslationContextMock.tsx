import en from '@rocket.chat/i18n/dist/resources/en.i18n.json';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { TranslationContext } from '@rocket.chat/ui-contexts';
import i18next, { type TOptions } from 'i18next';
import type { ContextType, ReactNode } from 'react';
import { useContext, useMemo } from 'react';

export type TranslationContextMockProps = {
	children: ReactNode;
};

const TranslationContextMock = ({ children }: TranslationContextMockProps) => {
	const parent = useContext(TranslationContext);

	const value = useMemo<ContextType<typeof TranslationContext>>(() => {
		i18next.init({
			fallbackLng: 'en',
			defaultNS: 'project',
			resources: {
				en: {
					project: en,
				},
			},
			interpolation: {
				prefix: '__',
				suffix: '__',
			},
		});

		const translate = (key: string, ...replaces: unknown[]): string => {
			if (typeof replaces[0] === 'object' && replaces[0] !== null) {
				const [options] = replaces;
				return i18next.t(key, options as TOptions);
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
					ogName: 'English',
					key: 'en',
				},
			],
			language: 'en',
			translate,
			loadLanguage: async (): Promise<void> => undefined,
		};
	}, [parent]);

	return <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>;
};

export default TranslationContextMock;
