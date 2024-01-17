import type { RocketchatI18nKeys } from '@rocket.chat/i18n';
import { createContext } from 'react';

export type TranslationLanguage = {
	en: string;
	name: string;
	ogName: string;
	key: string;
};

export type TranslationKey = RocketchatI18nKeys | `app-${string}.${string}`;

export type TranslationContextValue = {
	languages: TranslationLanguage[];
	language: TranslationLanguage['key'];
	loadLanguage: (language: TranslationLanguage['key']) => Promise<void>;
	translate: {
		(key: TranslationKey, options?: unknown): string;
		(key: TranslationKey, ...options: unknown[]): string;
		has: (
			key: string,
			options?: {
				lng?: string;
			},
		) => key is TranslationKey;
	};
};

export const TranslationContext = createContext<TranslationContextValue>({
	languages: [
		{
			name: 'Default',
			en: 'Default',
			ogName: 'Default',
			key: '',
		},
	],
	language: '',
	loadLanguage: async () => console.warn('TranslationContext: loadLanguage not implemented'),
	translate: Object.assign((key: string) => key, {
		has: (key: string): key is TranslationKey => Boolean(key),
	}),
});
