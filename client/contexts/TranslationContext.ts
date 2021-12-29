import { createContext, useContext } from 'react';

import type keys from '../../packages/rocketchat-i18n/i18n/en.i18n.json';

export type TranslationLanguage = {
	name: string;
	en: string;
	key: string;
};

export type TranslationKey = keyof typeof keys;

export type TranslationContextValue = {
	languages: TranslationLanguage[];
	language: TranslationLanguage['key'];
	loadLanguage: (language: TranslationLanguage['key']) => Promise<void>;
	translate: {
		(key: TranslationKey, ...replaces: unknown[]): string;
		has: (key: TranslationKey) => boolean;
	};
};

export const TranslationContext = createContext<TranslationContextValue>({
	languages: [
		{
			name: 'Default',
			en: 'Default',
			key: '',
		},
	],
	language: '',
	loadLanguage: async () => undefined,
	translate: Object.assign((key: string) => key, {
		has: () => true,
	}),
});

export const useLanguages = (): TranslationContextValue['languages'] => useContext(TranslationContext).languages;

export const useLanguage = (): TranslationContextValue['language'] => useContext(TranslationContext).language;

export const useLoadLanguage = (): TranslationContextValue['loadLanguage'] => useContext(TranslationContext).loadLanguage;

export const useTranslation = (): TranslationContextValue['translate'] => useContext(TranslationContext).translate;
