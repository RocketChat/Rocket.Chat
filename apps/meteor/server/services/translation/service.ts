import type { IUser } from '@rocket.chat/core-typings';
import { ServiceClassInternal } from '@rocket.chat/core-services';
import type { ITranslationService, TranslationReplacement } from '@rocket.chat/core-services';
import i18next from 'i18next';
import FsBackend from 'i18next-fs-backend';
import sprintf from 'i18next-sprintf-postprocessor';

import { getAllLanguagesWithNames, getPathFromTranslationFile, getSupportedLanguages } from './loader';
import { settings } from '../../../app/settings/server';

export class TranslationService extends ServiceClassInternal implements ITranslationService {
	protected name = 'translation';

	private defaultNamespace = 'translation';

	private loadedLanguages: string[] = [];

	private i18nextInstance = i18next;

	private supportedLanguages: string[] = [];

	public async created(): Promise<void> {
		const serverLanguage = this.getServerLanguage().toLowerCase();
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
		this.supportedLanguages = supportedLanguages.map((language) => language.toLowerCase());
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
		const language = user.language || this.getServerLanguage();
		await this.loadLanguageIfNotLoaded(language);

		return this.translateText(text, language, replacements);
	}

	public async translateToServerLanguage(text: string, replacements?: TranslationReplacement): Promise<string> {
		return this.i18nextInstance.t(text, {
			...(replacements && 'interpolate' in replacements ? replacements.interpolate : {}),
			...(replacements && 'sprintf' in replacements && replacements?.sprintf?.length
				? { postProcess: 'sprintf', sprintf: replacements.sprintf }
				: {}),
		});
	}

	public getTranslateToServerLanguageFnWrapper(): (text: string, replacements?: TranslationReplacement) => string {
		return (text: string, replacements?: TranslationReplacement) =>
			this.i18nextInstance.t(text, {
				...(replacements && 'interpolate' in replacements ? replacements.interpolate : {}),
				...(replacements && 'sprintf' in replacements && replacements?.sprintf?.length
					? { postProcess: 'sprintf', sprintf: replacements.sprintf }
					: {}),
			});
	}

	public async getLanguageData(language: string): Promise<Record<string, string>> {
		await this.loadLanguageIfNotLoaded(language);

		return this.i18nextInstance.getResourceBundle(this.convertLanguageToFileSystemCase(language), this.defaultNamespace);
	}

	public async getSupportedLanguages(): Promise<string[]> {
		return this.supportedLanguages.map((language) => this.convertLanguageToFileSystemCase(language));
	}

	public async changeServerLanguage(language: string): Promise<void> {
		await this.i18nextInstance.changeLanguage(language);
	}

	public async getSupportedLanguagesWithNames(): Promise<Record<string, string>> {
		return getAllLanguagesWithNames();
	}

	private getServerLanguage(): string {
		return settings.get<string>('Language') || 'en';
	}

	private async loadLanguageIfNotLoaded(language: string): Promise<void> {
		const lower = language?.toLowerCase() || this.getServerLanguage().toLowerCase();
		if (this.supportedLanguages.length > 0 && !this.supportedLanguages.includes(lower)) {
			throw new Error('Language not supported');
		}
		if (!this.loadedLanguages.includes(lower)) {
			await this.i18nextInstance.loadLanguages([this.convertLanguageToFileSystemCase(language)]);
			this.loadedLanguages.push(lower);
		}
	}

	private convertLanguageToFileSystemCase(language: string): string {
		if (!language.includes('-')) {
			return language;
		}
		const [first, last] = language.split('-');

		return `${first.toLowerCase()}-${last.toUpperCase()}`;
	}
}
