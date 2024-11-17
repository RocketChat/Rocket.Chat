import { ServiceClassInternal } from '@rocket.chat/core-services';
import type { ITranslationService } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import { Settings } from '@rocket.chat/models';
import mem from 'mem';

import { i18n } from '../../lib/i18n';

export class TranslationService extends ServiceClassInternal implements ITranslationService {
	protected name = 'translation';

	// Cache the server language for 1 hour
	private getServerLanguageCached = mem(this.getServerLanguage.bind(this), { maxAge: 1000 * 60 * 60 });

	private async getServerLanguage(): Promise<string> {
		return ((await Settings.findOneById('Language'))?.value as string) || 'en';
	}

	// Use translateText when you already know the language, or want to translate to a predefined language
	translateText(text: string, targetLanguage: string, args?: Record<string, string>): Promise<string> {
		return Promise.resolve(i18n.t(text, { lng: targetLanguage, ...args }));
	}

	// Use translate when you want to translate to the user's language, or server's as a fallback
	async translate(text: string, user: IUser): Promise<string> {
		const language = user.language || (await this.getServerLanguageCached());

		return this.translateText(text, language);
	}

	async translateToServerLanguage(text: string, args?: Record<string, string>): Promise<string> {
		const language = await this.getServerLanguageCached();

		return this.translateText(text, language, args);
	}

	async translateMultipleToServerLanguage(keys: string[]): Promise<Array<{ key: string; value: string }>> {
		const language = await this.getServerLanguageCached();

		return keys.map((key) => ({
			key,
			value: i18n.t(key, { lng: language, fallbackLng: 'en' }),
		}));
	}
}
