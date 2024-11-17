import type { IUser } from '@rocket.chat/core-typings';

export interface ITranslationService {
	translateText(text: string, targetLanguage: string, args?: Record<string, string>): Promise<string>;
	translate(text: string, user: IUser): Promise<string>;
	translateToServerLanguage(text: string, args?: Record<string, string>): Promise<string>;
	translateMultipleToServerLanguage(keys: string[]): Promise<Array<{ key: string; value: string }>>;
}
