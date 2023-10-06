import { createContext } from 'react';

import type keys from './en.json';

export { keys };

export type TranslationLanguage = {
	en: string;
	name: string;
	ogName: string;
	key: string;
};

export type TranslationKey = keyof typeof keys;

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
