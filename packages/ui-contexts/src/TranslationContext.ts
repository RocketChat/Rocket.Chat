import { createContext, useContext } from 'react';

export type TranslationLanguage = {
	name: string;
	en: string;
	key: string;
};

export interface IResources {
	translation: typeof import('./en.i18n.json');
}

type TranslationKey = keyof IResources['translation'];

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
	translate: Object.assign((key: TranslationKey) => key, {
		has: () => true,
	}),
});

export const useLanguages = (): TranslationContextValue['languages'] => useContext(TranslationContext).languages;

export const useLanguage = (): TranslationContextValue['language'] => useContext(TranslationContext).language;

export const useLoadLanguage = (): TranslationContextValue['loadLanguage'] => useContext(TranslationContext).loadLanguage;

export const useTranslation = (): TranslationContextValue['translate'] => useContext(TranslationContext).translate;
