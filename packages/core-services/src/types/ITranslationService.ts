import type { IUser } from '@rocket.chat/core-typings';

export type TranslationReplacement =
	| { interpolation: Record<string, string>; byPosition?: never }
	| { byPosition: any[]; interpolation?: never };
export interface ITranslationService {
	translateText(text: string, targetLanguage: string, replacements?: TranslationReplacement): Promise<string>;
	translate(text: string, user: IUser, replacements?: TranslationReplacement): Promise<string>;
	translateToServerLanguage(text: string, replacements?: TranslationReplacement): Promise<string>;
	getLanguageData(language: string): Promise<Record<string, string>>;
}
