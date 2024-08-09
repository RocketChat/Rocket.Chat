import type { RocketchatI18nKeys } from '@rocket.chat/i18n';
import { createContext } from 'react';

export type TranslationLanguage = {
	en: string;
	name: string;
	ogName: string;
	key: string;
};

type KeysWithoutSuffix = {
	[K in RocketchatI18nKeys as K extends `${infer T extends string}_${'one' | 'other' | 'zero' | 'few' | 'many' | 'two' | 'three' | 'four'}`
		? T
		: K]: never;
};

export type TranslationKey = keyof KeysWithoutSuffix | `app-${string}.${string}`;

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
