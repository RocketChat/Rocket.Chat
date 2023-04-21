import { Settings } from '@rocket.chat/models';
import type { IUser } from '@rocket.chat/core-typings';
import mem from 'mem';
import { ServiceClassInternal } from '@rocket.chat/core-services';
import type { ITranslationService, TranslationReplacement } from '@rocket.chat/core-services';
import i18next from 'i18next';
import FsBackend from 'i18next-fs-backend';
import sprintf from 'i18next-sprintf-postprocessor';

import { getPathFromTranslationFile, getSupportedLanguages } from './loader';

export class TranslationService extends ServiceClassInternal implements ITranslationService {
	protected name = 'translation';

	private defaultNamespace = 'translation';

	private loadedLanguages: string[] = [];

	private i18nextInstance = i18next;

	private supportedLanguages: string[] = [];

	public async started(): Promise<void> {
		const serverLanguage = await this.getServerLanguageCached();
		const supportedLanguages = await getSupportedLanguages();

		await this.i18nextInstance
			.use(FsBackend)
			.use(sprintf)
			.init({
				debug: false,
				...(supportedLanguages.length > 0 ? { supportedLngs: supportedLanguages } : {}),
				fallbackLng: serverLanguage,
				lng: serverLanguage,
				interpolation: { prefix: '__', suffix: '__' },
				ns: this.defaultNamespace,
				defaultNS: this.defaultNamespace,
				backend: {
					loadPath: (language: any) => getPathFromTranslationFile(language),
				},
			});
		this.loadedLanguages.push(serverLanguage);
		this.supportedLanguages = supportedLanguages;
	}

	// Use translateText when you already know the language, or want to translate to a predefined language
	public async translateText(text: string, targetLanguage: string, replacements?: TranslationReplacement): Promise<string> {
		await this.loadLanguageIfNotLoaded(targetLanguage);

		if (replacements && 'interpolate' in replacements && 'sprintf' in replacements) {
			throw new Error('You can only use one of the two replacement types at the same time');
		}

		return this.i18nextInstance.t(text, {
			lng: targetLanguage,
			...(replacements && 'interpolate' in replacements ? replacements.interpolate : {}),
			...(replacements && 'sprintf' in replacements && replacements?.sprintf?.length
				? { postProcess: 'sprintf', sprintf: replacements.sprintf }
				: {}),
		});
	}

	// Use translate when you want to translate to the user's language, or server's as a fallback
	public async translate(text: string, user: IUser, replacements?: TranslationReplacement): Promise<string> {
		const language = user.language || (await this.getServerLanguageCached());
		await this.loadLanguageIfNotLoaded(language);

		return this.translateText(text, language, replacements);
	}

	public async translateToServerLanguage(text: string, replacements?: TranslationReplacement): Promise<string> {
		const language = await this.getServerLanguageCached();
		await this.loadLanguageIfNotLoaded(language);

		return this.translateText(text, language, replacements);
	}

	public async getLanguageData(language: string): Promise<Record<string, string>> {
		await this.loadLanguageIfNotLoaded(language);

		return this.i18nextInstance.getResourceBundle(language, this.defaultNamespace);
	}

	// Cache the server language for 1 hour
	private getServerLanguageCached = mem(this.getServerLanguage.bind(this), { maxAge: 1000 * 60 * 60 });

	private async getServerLanguage(): Promise<string> {
		return ((await Settings.findOneById('Language'))?.value as string) || 'en';
	}

	private async loadLanguageIfNotLoaded(language: string): Promise<void> {
		if (this.supportedLanguages.length > 0 && !this.supportedLanguages.includes(language)) {
			throw new Error('Language not supported');
		}
		if (!this.loadedLanguages.includes(language)) {
			await this.i18nextInstance.loadLanguages([language]);
			this.loadedLanguages.push(language);
		}
	}
}
