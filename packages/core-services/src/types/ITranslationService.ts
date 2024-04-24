import type { IUser, AtLeast } from '@rocket.chat/core-typings';

export interface ITranslationService {
	translateText(text: string, targetLanguage: string): Promise<string>;
	translate(text: string, user: AtLeast<IUser, 'language'>): Promise<string>;
	translateToServerLanguage(text: string): Promise<string>;
}
