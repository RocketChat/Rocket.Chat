import type { IUser } from '@rocket.chat/core-typings';

export type TranslationReplacement = { interpolate: Record<string, any>; sprintf?: never } | { sprintf: any[]; interpolate?: never };
export interface ITranslationService {
	translateText(text: string, targetLanguage: string, replacements?: TranslationReplacement): Promise<string>;
	translate(text: string, user: IUser, replacements?: TranslationReplacement): Promise<string>;
	translateToServerLanguage(text: string, replacements?: TranslationReplacement): Promise<string>;
	getLanguageData(language: string): Promise<Record<string, string>>;
	getSupportedLanguages(): Promise<string[]>;
}
