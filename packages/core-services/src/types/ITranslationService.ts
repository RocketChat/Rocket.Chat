import type { IUser } from '@rocket.chat/core-typings';

export interface ITranslationService {
	translateText(text: string, targetLanguage: string): Promise<string>;
	translate(text: string, user: IUser): Promise<string>;
	translateToServerLanguage(text: string): Promise<string>;
}
