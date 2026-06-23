import type { IMessage, MessageAttachment, IProviderMetadata, ITranslationResult, ISupportedLanguage } from '@rocket.chat/core-typings';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';

import { TranslationProviderRegistry, AutoTranslate } from './autotranslate';
import { libreLogger } from './logger';
import { i18n } from '../../../server/lib/i18n';
import { settings } from '../../settings/server';

interface ILibreTranslateLanguage {
	code: string;
	name: string;
	targets?: string[];
}

const REQUEST_TIMEOUT = 10000;

const toLanguageTag = (code: string): string => {
	try {
		return new Intl.Locale(code).toString();
	} catch (err) {
		libreLogger.error({ msg: 'Invalid language code returned by LibreTranslate', code, err });
		return code;
	}
};

/**
 * LibreTranslate translation service provider class representation.
 * @class
 * @augments AutoTranslate
 */
class LibreTranslateAutoTranslate extends AutoTranslate {
	apiKey: string;

	apiEndPointUrl: string;

	constructor() {
		super();
		this.name = 'libre-translate';
		this.apiEndPointUrl = '';
		this.apiKey = '';

		settings.watch<string>('AutoTranslate_LibreTranslateAPIURL', (value) => {
			this.apiEndPointUrl = (value || '').replace(/\/$/, '');
		});

		settings.watch<string>('AutoTranslate_LibreTranslateAPIKey', (value) => {
			this.apiKey = value;
		});
	}

	_getProviderMetadata(): IProviderMetadata {
		return {
			name: this.name,
			displayName: i18n.t('AutoTranslate_LibreTranslate'),
			settings: this._getSettings(),
		};
	}

	_getSettings(): IProviderMetadata['settings'] {
		return {
			apiKey: this.apiKey,
			apiEndPointUrl: this.apiEndPointUrl,
		};
	}

	async getSupportedLanguages(target: string): Promise<ISupportedLanguage[]> {
		if (!this.apiEndPointUrl) {
			return [];
		}

		if (this.supportedLanguages[target]) {
			return this.supportedLanguages[target];
		}

		try {
			// SECURITY: the URL comes from a setting only an admin can change, so disabling SSRF validation is safe here.
			const request = await fetch(`${this.apiEndPointUrl}/languages`, {
				ignoreSsrfValidation: true,
				timeout: REQUEST_TIMEOUT,
			});
			if (!request.ok) {
				throw new Error('Failed to fetch supported languages');
			}

			const result = (await request.json()) as ILibreTranslateLanguage[];

			this.supportedLanguages[target || 'en'] = result.map(({ code, name }) => ({
				language: toLanguageTag(code),
				name,
			}));
			return this.supportedLanguages[target || 'en'];
		} catch (err) {
			libreLogger.error({ msg: 'Error fetching supported languages', err });
			return [];
		}
	}

	private resolveTargetLanguage(language: string, supportedLanguages: ISupportedLanguage[]): string {
		if (language.includes('-') && !supportedLanguages.find((supported) => supported.language === language)) {
			return language.slice(0, 2);
		}
		return language;
	}

	// `q` is sent as an array of lines; LibreTranslate returns `translatedText` as an array (one entry per line).
	private async _query(lines: string[], targetLanguage: string): Promise<string | null> {
		const body: Record<string, unknown> = {
			q: lines,
			source: 'auto',
			target: targetLanguage,
			format: 'text',
			...(this.apiKey && { api_key: this.apiKey }),
		};

		// SECURITY: the URL comes from a setting only an admin can change, so disabling SSRF validation is safe here.
		const result = await fetch(`${this.apiEndPointUrl}/translate`, {
			method: 'POST',
			ignoreSsrfValidation: true,
			timeout: REQUEST_TIMEOUT,
			headers: { 'Content-Type': 'application/json' },
			body,
		});

		if (!result.ok) {
			throw new Error(result.statusText);
		}

		const json = (await result.json()) as { translatedText?: string | string[] };
		if (json.translatedText === undefined) {
			return null;
		}
		return Array.isArray(json.translatedText) ? json.translatedText.join('\n') : json.translatedText;
	}

	async _translateMessage(message: IMessage, targetLanguages: string[]): Promise<ITranslationResult> {
		const translations: { [k: string]: string } = {};
		if (!this.apiEndPointUrl) {
			return translations;
		}

		const msgs = message.msg.split('\n');
		const supportedLanguages = await this.getSupportedLanguages('en');
		for (const targetLanguage of targetLanguages) {
			const language = this.resolveTargetLanguage(targetLanguage, supportedLanguages);
			try {
				const translatedText = await this._query(msgs, language);
				if (translatedText !== null) {
					translations[language] = this.deTokenize(Object.assign({}, message, { msg: translatedText }));
				}
			} catch (err) {
				libreLogger.error({ msg: 'Error translating message', err });
			}
		}
		return translations;
	}

	async _translateAttachmentDescriptions(attachment: MessageAttachment, targetLanguages: string[]): Promise<ITranslationResult> {
		const translations: { [k: string]: string } = {};
		if (!this.apiEndPointUrl) {
			return translations;
		}

		const supportedLanguages = await this.getSupportedLanguages('en');
		for (const targetLanguage of targetLanguages) {
			const language = this.resolveTargetLanguage(targetLanguage, supportedLanguages);
			try {
				const translatedText = await this._query([attachment.description || attachment.text || ''], language);
				if (translatedText !== null) {
					translations[language] = translatedText;
				}
			} catch (err) {
				libreLogger.error({ msg: 'Error translating message attachment', err });
			}
		}
		return translations;
	}
}

TranslationProviderRegistry.registerProvider(new LibreTranslateAutoTranslate());
